import * as gc from "@sg/sg-game-client";
import { render } from "@sg/sg-observer";
import React, { useEffect } from 'react';

import { IPropsObserver, IStateObserver, ObserverComponent } from "../observer-component/observer-component";
import BetModalSuccess from "../bet-modal-success";
import { useMessageContext } from "../../contexts/message-context";
import { MessageType } from "../../types/message-types";
import { useHideConfirmBetData } from "../../../hooks/use-message-data";

const DEBUG_STYLE = 'color: red; font-weight: bold;';
interface IConfirmBetContentData {
  totalStake: number;
  betChoice: string;
  namespace: string;
}
export interface IConfirmBet extends IStateObserver {
  totalStake: number;
  validBet: gc.Bet.IValidBet;
  betChoice: string;
  turnOffNotification: boolean;
  namespace: string;
  confirmBetData: IConfirmBetContentData;
}

const NOTIFY_KEY = 'turnOffNotification';

interface IConfirmBetContentProps {
  confirmBetData: IConfirmBetContentData;
}

const ConfirmBetContent: React.FC<IConfirmBetContentProps> = ({
  confirmBetData
}) => {
  const { sendMessage } = useMessageContext();
  const hideConfirmBetData = useHideConfirmBetData();

  useEffect(() => {
    if (hideConfirmBetData) {
      sessionStorage.setItem(NOTIFY_KEY, hideConfirmBetData.turnOffNotification ? 'true' : 'false');
    }
  }, [hideConfirmBetData]);

  useEffect(() => {
    const { totalStake, betChoice, namespace } = confirmBetData;
    sendMessage({
      type: MessageType.SHOW_CONFIRM_BET,
      data: {
        totalStake,
        betChoice,
        namespace
      }
    });
  }, [confirmBetData]);

  return <></>;
};

export class ConfirmBet extends ObserverComponent<IPropsObserver, IConfirmBet> {
  private isJoiningGame = false;

  constructor(props: IPropsObserver) {
    super(props);
    this.state = {
      dispose: null,
      totalStake: 0,
      validBet: {},
      betChoice: '',
      namespace: props.namespace,
    } as IConfirmBet;
  }


  @render(gc.Bet.BetStore, (store) => store.lastReceivedBet)
  setTotalStake(lastReceivedBet: gc.Bet.ILastReceivedBet) {
    if (lastReceivedBet) {
      // Check if notifications are turned off
      const isNotificationTurnedOff = sessionStorage.getItem(NOTIFY_KEY) === 'true';
      console.log('%c[IFRAME] Checking notification setting:', DEBUG_STYLE, { isNotificationTurnedOff });

      if (isNotificationTurnedOff) {
        console.log('%c[IFRAME] Notifications turned off, showing BetModalSuccess', DEBUG_STYLE);
        this.setState({ totalStake: lastReceivedBet.value });
        return;
      }

      this.setState({ totalStake: lastReceivedBet.value });
    }
  }

  @render(gc.Bet.BetStore, (store) => store.betChoice)
  setBetChoice(betChoice: string) {
    if (betChoice) {
      console.log('%c[IFRAME] Bet choice updated', DEBUG_STYLE, { betChoice });
      this.setState({ betChoice });
    }
  }

  @render(gc.Connection.ConnectionStore, (store) => store.joinGame)
  handleJoinedGame() {
    console.log('%c[IFRAME] Game joined, closing confirm bet', DEBUG_STYLE);
    this.isJoiningGame = true;
    this.handleClose();
  }

  @render(gc.Bet.BetStore, (store) => store.validBet)
  setIsValidBet(validBet: gc.Bet.IValidBet) {
    if (this.isJoiningGame) {
      return;
    }
    console.log('%c[IFRAME] Valid bet updated', DEBUG_STYLE, { validBet });
    this.setState({ validBet });
  }

  handleClose = () => {
    console.log('%c[IFRAME] Sending HIDE_CONFIRM_BET message', DEBUG_STYLE);
    this.setState({ validBet: { value: false } }, () => {
      window.parent.postMessage({
        type: 'HIDE_CONFIRM_BET'
      }, '*');
      setTimeout(() => {
        this.isJoiningGame = false;
      }, 0);
    });
  };

  private shouldShowBetModalSuccess(): boolean {
    const { validBet, totalStake } = this.state;
    const isNotificationTurnedOff = sessionStorage.getItem(NOTIFY_KEY) === 'true';

    return !!validBet?.value && isNotificationTurnedOff && totalStake > 0;
  }

  render() {
    const { totalStake, validBet } = this.state;

    const confirmBetData = {
      totalStake: totalStake,
      betChoice: this.state.betChoice,
      namespace: this.state.namespace
    }

    if (!validBet?.value) {
      console.log('%c[IFRAME] Not rendering - invalid bet', DEBUG_STYLE);
      return <></>;
    }

    if (this.shouldShowBetModalSuccess()) {
      console.log('%c[IFRAME] Rendering BetModalSuccess', DEBUG_STYLE, { totalStake });
      return <BetModalSuccess totalStake={totalStake} />;
    }

    return <ConfirmBetContent confirmBetData={confirmBetData} />;
  }
}
