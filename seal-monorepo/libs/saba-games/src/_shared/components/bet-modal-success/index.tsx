import * as gc from "@sg/sg-game-client";
import { useEffect } from 'react';
import style from './Success.module.scss';
import { MessageType } from "../../types/message-types";
import { useMessageContext } from "../../contexts/message-context";

const BetModalSuccess = ({ totalStake }) => {
    const { sendMessage } = useMessageContext();

    useEffect(() => {
        sendMessage({
            type: MessageType.SYNC_BALANCE,
            data: {
                totalStake: totalStake,
                winBet: undefined,
            },
        });
    }, [totalStake]);

    return (
        <div className={style['stake-container']}>
            <span className={style['stake']}>{`-${gc.FormatUtils.numberWithCommas(totalStake)}`}</span>
        </div>
    );
};

export default BetModalSuccess;
