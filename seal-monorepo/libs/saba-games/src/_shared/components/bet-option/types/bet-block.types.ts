import * as gc from '@sg/sg-game-client';
import { IStateObserver } from "../../observer-component/observer-component";
import { IBetPanelConfig } from "./bet-panel.types";

export interface BettingBlockProps {
    odd: number;
    betChoice: string;
    gameName: string;
    namespace: string;
    children: React.ReactNode;
    settlementResult?: gc.GameServiceMessage.TSettlementResult;
    onBet: () => void;
}

export interface IBettingBlockState extends IStateObserver {
    isAuthorized: boolean;
    isSignedIn: boolean;
    isFinishShowResult: boolean;
    isShowStaticHighlight?: boolean;
    roundState: string;
    clientRoundId: number;
    stakeLevel: gc.Player.IStakeLevel;
    currency: string;
    minBet: number;
    maxBet: number;
    maxBetPerChoices: gc.GameServiceMessage.MaxBetPerChoices;
    clientSeed: string;
    betChoice: string;
    odd: number;
}

export interface BettingPanelContentProps {
    betPanelConfig: IBetPanelConfig;
    betChoice: string;
    odd: number;
    gameName: string;
    namespace: string;
    panelId: string;
    onBet: () => void;
    handleBet: (amount: number, betChoice: string, clientSeed: string) => void;
    isAuthorized: boolean;
    roundState: string;
    autoCreateNickname: () => void;
    children: React.ReactNode;
    flashAnimationClass: string;
    bettingZoneState: {
        gameName: string;
        betChoice: string;
        odd: number;
    };
    waitForAuthorization: (betChoice: string, odd: number) => void;
}