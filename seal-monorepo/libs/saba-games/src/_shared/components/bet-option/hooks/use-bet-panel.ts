import { useCallback, useEffect, useRef, useState } from 'react';
import { IBetPanelConfig, IBetPanelPosition } from '../types/bet-panel.types';
import { calculateBetPanelState } from '../utils/bet-panel.utils';
import { MessageType } from '../../../types/message-types';
import { useMessageContext } from '../../../contexts/message-context';
import { useAppContext } from '../../../../appProvider';
import { useBettingBlockData } from '../../../../hooks/use-message-data';

export const useBetPanel = (
    config: IBetPanelConfig,
    betChoice: string,
    odd: number,
    gameName: string,
    namespace: string
) => {
    const { siteId } = useAppContext();
    const { sendMessage } = useMessageContext();
    const bettingBlockData = useBettingBlockData();
    const bettingBlockRef = useRef<HTMLDivElement>(null);
    const [isShowBetSlip, setIsShowBetSlip] = useState(false);

    const getBetPanelPosition = useCallback((): IBetPanelPosition => {
        if (bettingBlockRef.current) {
            const rect = bettingBlockRef.current.getBoundingClientRect();
            return {
                top: rect.bottom + window.scrollY - 10,
                left: rect.left + window.scrollX
            };
        }
        return { top: 0, left: 0 };
    }, []);

    const sendBetPanelState = useCallback(() => {
        const position = getBetPanelPosition();
        const panelState = calculateBetPanelState(
            config,
            betChoice,
            odd,
            siteId,
            gameName,
            namespace,
            position
        );

        const betPanelMessage = {
            type: MessageType.BET_PANEL_STATE,
            data: panelState
        } as const;

        sendMessage(betPanelMessage);

    }, [config, betChoice, odd, gameName, namespace]);

    // bet panel state of open or close
    const sendBettingBlockState = useCallback((isShowBetSlip: boolean) => {
        const bettingBlockMessage = {
            type: MessageType.BETTING_BLOCK_STATE,
            data: {
                isShowBetSlip: isShowBetSlip,
                betChoice: betChoice,
                odd: odd,
            }
        } as const;

        setIsShowBetSlip(isShowBetSlip);
        sendMessage(bettingBlockMessage);
    }, [config, betChoice, odd, gameName, namespace]);

    useEffect(() => {
        if (!bettingBlockData) {
            return;
        }

        const { isShowBetSlip: openBetSlip, betChoice: dataBetChoice } = bettingBlockData;

        if (dataBetChoice !== betChoice) {
            setIsShowBetSlip(false);
            return;
        }

        setIsShowBetSlip(openBetSlip);
    }, [bettingBlockData, betChoice]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (bettingBlockRef.current && !bettingBlockRef.current.contains(event.target as Node)) {
                setIsShowBetSlip(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [bettingBlockRef]);

    useEffect(() => {
        const handleResize = () => {
            const shouldUpdatePosition = bettingBlockRef.current &&
                isShowBetSlip;

            if (shouldUpdatePosition) {
                sendBetPanelState();
            }
        };

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
        }
    }, [isShowBetSlip]);

    return {
        bettingBlockRef,
        isShowBetSlip,
        setIsShowBetSlip,
        sendBetPanelState,
        sendBettingBlockState
    };
}; 