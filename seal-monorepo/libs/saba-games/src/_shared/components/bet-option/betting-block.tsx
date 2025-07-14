import * as gc from '@sg/sg-game-client';
import { Auth, Connection, Rounds } from '@sg/sg-game-client';
import { handle, render } from '@sg/sg-observer';
import classNames from 'classnames';
import React, { useEffect } from 'react';
import {
    GameBettingOptionsContext,
    GameBettingZoneContext,
} from '../../../_shared/react-contexts/game-betting-zone-context/game-betting-zone-context';
import { ObserverComponent } from '../observer-component/observer-component';
import Styles from './bet-option.module.scss';
import { useBetPanel } from './hooks/use-bet-panel';
import { IBetPanelConfig } from './types/bet-panel.types';
import { useHandleBetData } from '../../../hooks/use-message-data';
import { BettingBlockProps, BettingPanelContentProps, IBettingBlockState } from './types/bet-block.types';

const BettingPanelContent: React.FC<BettingPanelContentProps> = ({
    betPanelConfig,
    betChoice,
    odd,
    gameName,
    namespace,
    panelId,
    onBet,
    handleBet,
    isAuthorized,
    roundState,
    autoCreateNickname,
    children,
    flashAnimationClass,
    bettingZoneState,
    waitForAuthorization
}) => {
    const {
        bettingBlockRef,
        isShowBetSlip,
        sendBetPanelState,
        sendBettingBlockState
    } = useBetPanel(betPanelConfig, betChoice, odd, gameName, namespace);
    const handleBetData = useHandleBetData();

    // Add effect to watch roundState changes
    useEffect(() => {
        if (roundState === Rounds.ROUND_STATE.PLACING_BET && isShowBetSlip) {
            sendBetPanelState();
        } else {
            sendBettingBlockState(false);
        }
    }, [roundState, isShowBetSlip]);

    const handleOnClick = (event: React.MouseEvent) => {
        event.stopPropagation();

        if (roundState !== Rounds.ROUND_STATE.PLACING_BET) {
            console.log(`onBet ${roundState}`);
            onBet();
            return;
        }

        if (!isAuthorized) {
            autoCreateNickname();
        }

        waitForAuthorization(betChoice, odd);

        sendBettingBlockState(true);
    };

    useEffect(() => {
        if (!handleBetData) {
            return;
        }

        const { amount, betChoice: dataBetChoice, clientSeed } = handleBetData;
        if (roundState !== Rounds.ROUND_STATE.PLACING_BET) {
            onBet();
            return;
        }

        if (dataBetChoice !== betChoice) {
            return;
        }

        handleBet(amount, dataBetChoice, clientSeed);
    }, [handleBetData, roundState, betChoice, onBet, handleBet]);

    return (
        <GameBettingZoneContext.Provider value={bettingZoneState}>
            <div
                ref={bettingBlockRef}
                className={classNames(`${Styles['betting-block']} ${Styles[flashAnimationClass]}`, {
                    [Styles['open-panel-background-color']]: panelId === betChoice,
                })}
                onClick={handleOnClick}
            >
                {children}
            </div>
        </GameBettingZoneContext.Provider>
    );
};

class BettingBlock extends ObserverComponent<BettingBlockProps, IBettingBlockState> {
    private timeoutId: NodeJS.Timeout | null = null;
    private readonly maxTimeoutDuration = 10000;
    static contextType = GameBettingOptionsContext;

    constructor(props: BettingBlockProps) {
        super(props);

        this.state = {
            isAuthorized: false,
            isSignedIn: false,
            dispose: null,
            isFinishShowResult: false,
            isShowStaticHighlight: undefined,
            roundState: '',
            clientRoundId: 0,
            stakeLevel: { minBet: 0, maxBet: 0 },
            currency: '',
            minBet: 0,
            maxBet: 0,
            maxBetPerChoices: {},
            clientSeed: '',
            betChoice: '',
            odd: 0
        };
    }

    componentDidMount() {
        super.componentDidMount();
    }

    componentWillUnmount() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
        }
        super.componentWillUnmount();
    }

    @render(Auth.AuthStore, (store) => store.isAuthorized)
    protected handleAuthorized(isAuthorized: boolean) {
        this.setState({ isAuthorized });
    }

    @render(Connection.ConnectionStore, (store) => store.isSignedIn)
    protected handleSignIn(isSignedIn: boolean) {
        if (isSignedIn) {
            this.setState({ isSignedIn });
        }
    }

    @render(gc.Settlements.SettlementStore, (store) => store.isFinishedShowResult)
    finishShowResult(isFinishedShowResult: boolean) {
        this.setState({ isFinishShowResult: isFinishedShowResult });
    }

    @render(gc.Rounds.RoundTimeStore, (store) => store.roundState, { fireImmediately: false })
    renderCountDownTimerState(roundState: string) {
        const stateUpdates = {
            [Rounds.ROUND_STATE.SHOW_RESULT]: { isShowStaticHighlight: true },
            [Rounds.ROUND_STATE.STARTING_ROUND]: { isShowStaticHighlight: true },
            [Rounds.ROUND_STATE.LOCKING_BET]: { isShowStaticHighlight: false },
        };

        const update = stateUpdates[roundState] || {};
        this.setState(update);
        this.setState({ roundState });
    }

    @render(gc.Rounds.RoundStore, (store) => store.clientRoundId)
    renderRoundId(clientRoundId: number) {
        this.setState({ clientRoundId });
    }

    @render(gc.Player.MainPlayerStore, (store) => store.stakeLevel)
    setUserStakeLevel(stakeLevel: gc.Player.IStakeLevel) {
        if (stakeLevel) {
            this.setState({ stakeLevel });
        }
    }

    @render(gc.Player.MainPlayerStore, (store) => store.currency)
    setCurrency(currency: string) {
        this.setState({ currency });
    }

    @render(gc.GameConfigs.GameConfigStore, (store) => ({
        minBet: store.minBet,
        maxBet: store.maxBet,
        maxBetPerChoices: store.maxBetPerChoices,
    }))
    setMaxBetPerChoices({
        minBet,
        maxBet,
        maxBetPerChoices,
    }: {
        minBet: number;
        maxBet: number;
        maxBetPerChoices: gc.GameServiceMessage.MaxBetPerChoices;
    }) {
        this.setState({ maxBetPerChoices, minBet, maxBet });
    }

    @render(gc.RoundBasePF.ProvablyFairStore, (store) => store.clientSeed)
    handleClientSeed(clientSeed: string) {
        this.setState({ clientSeed });
    }

    @handle(Auth.AuthHandlers.Authorize, (handler) => handler.handleAutoGenerateName())
    protected autoCreateNickname() { }

    @handle(Connection.ConnectionHandlers.SignInHandler)
    protected signIn() { }

    protected updateBettingState(betChoice: string, odd: number) {
        this.setState({ betChoice, odd });
    }

    protected waitForAuthorization(betChoice: string, odd: number) {
        const interval = 100;
        const startTime = Date.now();
        this.clearTimeout();

        const checkAuthorization = () => {
            if (this.state.isAuthorized) {
                this.handleUserSignIn();
                this.updateBettingState(betChoice, odd);
                this.clearTimeout();
            } else if (Date.now() - startTime < this.maxTimeoutDuration) {
                this.timeoutId = setTimeout(checkAuthorization, interval);
            }
        };

        this.timeoutId = setTimeout(checkAuthorization, interval);
    }

    protected handleUserSignIn() {
        if (!this.state.isSignedIn) {
            this.signIn();
        }
    }

    protected clearTimeout() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }

    @handle(gc.Bet.BetHandler)
    handleBet(amount: number, betChoice: string, clientSeed: string) {
        return { amount, betChoice, clientSeed };
    }

    render() {
        const { children, gameName, settlementResult, betChoice, odd, namespace } = this.props;
        const { isFinishShowResult, isShowStaticHighlight } = this.state;
        let flashAnimationClass = '';
        const bettingZoneState = {
            gameName,
            betChoice,
            odd,
        };

        if (isFinishShowResult && settlementResult?.[betChoice]) {
            flashAnimationClass = 'flash-and-keep-background-color';
        } else if (isShowStaticHighlight && settlementResult?.[betChoice]) {
            flashAnimationClass = 'highlight-static-bet-choice';
        }

        const betPanelConfig: IBetPanelConfig = {
            minBet: this.state.minBet,
            maxBet: this.state.maxBet,
            maxBetPerChoices: this.state.maxBetPerChoices,
            stakeLevel: this.state.stakeLevel,
            currency: this.state.currency,
            clientRoundId: this.state.clientRoundId,
            clientSeed: this.state.clientSeed
        };

        return (
            <GameBettingOptionsContext.Consumer>
                {({ panelId }) => (
                    <BettingPanelContent
                        betPanelConfig={betPanelConfig}
                        betChoice={betChoice}
                        odd={odd}
                        gameName={gameName}
                        namespace={namespace}
                        panelId={panelId}
                        onBet={this.props.onBet}
                        handleBet={this.handleBet.bind(this)}
                        isAuthorized={this.state.isAuthorized}
                        roundState={this.state.roundState}
                        autoCreateNickname={this.autoCreateNickname.bind(this)}
                        children={children}
                        flashAnimationClass={flashAnimationClass}
                        bettingZoneState={bettingZoneState}
                        waitForAuthorization={this.waitForAuthorization.bind(this)}
                    />
                )}
            </GameBettingOptionsContext.Consumer>
        );
    }
}

export default BettingBlock;
