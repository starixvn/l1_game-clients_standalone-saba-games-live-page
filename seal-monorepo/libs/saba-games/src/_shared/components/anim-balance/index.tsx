import * as gc from "@sg/sg-game-client";
import { useEffect } from 'react';
import style from './balance.module.scss';
import { useMessageContext } from '../../contexts/message-context';
import { MessageType } from "../../types/message-types";

const AnimationBalance = ({ winBet }) => {
    const { sendMessage } = useMessageContext();

    useEffect(() => {
        sendMessage({
            type: MessageType.SYNC_BALANCE,
            data: {
                totalStake: undefined,
                winBet: winBet,
            },
        });
    }, [winBet]);

    return (
        <div className={style['win-amount']}>
            {`+${gc.FormatUtils.numberWithCommas(winBet, 2)}`}
        </div>
    );
};

export default AnimationBalance;
