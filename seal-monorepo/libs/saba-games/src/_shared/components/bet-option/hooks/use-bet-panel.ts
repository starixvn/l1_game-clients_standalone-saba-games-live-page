import { useState, useCallback, useRef, useEffect } from 'react';
import { IBetPanelConfig, IBetPanelPosition } from '../types/bet-panel.types';
import { calculateBetPanelState } from '../utils/bet-panel.utils';
import { MessageType } from '../../../types/message-types';
import { useMessageContext } from '../../../contexts/message-context';
import { useAppContext } from '../../../../appProvider';

export const useBetPanel = (
    config: IBetPanelConfig,
    betChoice: string,
    odd: number,
    gameName: string,
    namespace: string
) => {
    const { siteId } = useAppContext();
    const { sendMessage } = useMessageContext();
    const [isShowBetSlip, setIsShowBetSlip] = useState(false);
    const bettingBlockRef = useRef<HTMLDivElement>(null);

    const getBetPanelPosition = useCallback((): IBetPanelPosition => {
        if (bettingBlockRef.current) {
            const rect = bettingBlockRef.current.getBoundingClientRect();
            return {
                top: rect.bottom + window.scrollY,
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
            position,
            !isShowBetSlip
        );

        const betPanelMessage = {
            type: MessageType.BET_PANEL_STATE,
            data: panelState
        } as const;

        sendMessage(betPanelMessage);

    }, [config, betChoice, odd, gameName, namespace, isShowBetSlip, getBetPanelPosition]);

    const handleClickOutside = useCallback((event: MouseEvent) => {
        if (bettingBlockRef.current && !bettingBlockRef.current.contains(event.target as Node)) {
            setIsShowBetSlip(false);
        }
    }, []);

    useEffect(() => {
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [handleClickOutside]);

    return {
        isShowBetSlip,
        setIsShowBetSlip,
        bettingBlockRef,
        sendBetPanelState
    };
}; 