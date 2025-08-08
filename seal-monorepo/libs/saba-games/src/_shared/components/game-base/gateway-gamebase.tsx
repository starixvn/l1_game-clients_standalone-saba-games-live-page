import * as gc from '@sg/sg-game-client';
import GameBase, { IGameBaseState } from '.';
import { GameBaseProps } from './type';
import { handle, render } from '@sg/sg-observer';
import { RoundStore } from '@sg/sg-game-client/dist/game/rounds';
import { StorageManager, localStorageKeys } from '../../utils/storage-manager';
import { ILatestBetRecord } from '../../types/betting';
import AuthorizationHandler from '../../handlers/authorization-handler';

export interface IGatewayGameBaseState extends IGameBaseState {
    isAuthorized: boolean;
    isSignedIn: boolean;
}

export default abstract class GatewayGameBase<P extends GameBaseProps, S extends IGatewayGameBaseState> extends GameBase<P, S> {
    private authHandler: AuthorizationHandler;

    constructor(props: P) {
        super(props);
        console.log('[GatewayGameBase] Initializing with props:', props);
        this.state = {
            ...this.state,
            isAuthorized: false,
            isSignedIn: false,
        } as S;

        this.authHandler = new AuthorizationHandler(
            this.state.isAuthorized,
            this.state.isSignedIn,
            () => this.signIn(),
            () => this.autoCreateNickname(),
        );
        console.log('[GatewayGameBase] Authorization handler initialized');
    }

    private isRoundIdMatching(currentRoundId: number): boolean {
        console.log('[GatewayGameBase] Checking round ID match:', currentRoundId);
        const betHistory = StorageManager.get(localStorageKeys.betHistory) as ILatestBetRecord[] | null;
        if (!betHistory || !Array.isArray(betHistory)) {
            console.log('[GatewayGameBase] No valid bet history found');
            return false;
        }
        const storedGame = betHistory.find((bet) => bet.namespace === this.props.namespace);
        const isMatching = storedGame ? currentRoundId === storedGame.roundId : false;
        console.log('[GatewayGameBase] Round ID match result:', isMatching);
        return isMatching;
    }

    processAuthorizationIfRoundMatches(roundId: number) {
        console.log('[GatewayGameBase] Processing authorization for round:', roundId);
        if (!this.isRoundIdMatching(roundId)) {
            console.log('[GatewayGameBase] Round ID does not match, skipping authorization');
            return;
        }
        console.log('[GatewayGameBase] Round ID matches, proceeding with authorization');
        this.authHandler = new AuthorizationHandler(
            this.state.isAuthorized,
            this.state.isSignedIn,
            () => this.signIn(),
            () => this.autoCreateNickname(),
        );
        this.authHandler.handleWaitForAuthorize();
    }

    @render(gc.Auth.AuthStore, (store) => store.isAuthorized)
    protected handleAuthorized(isAuthorized: boolean) {
        console.log('[GatewayGameBase] Authorization state changed:', isAuthorized);
        this.setState({ isAuthorized });
    }

    @handle(gc.Auth.AuthHandlers.Authorize, (handler) => handler.handleAutoGenerateName())
    protected autoCreateNickname() {
        console.log('[GatewayGameBase] Auto-creating nickname');
    }

    @render(gc.GatewayConnection.GatewayConnectionStore, (store) => store.isConnected)
    handleConnectLiveGatewayForGame(isConnected: boolean) {
        console.log('[GatewayGameBase] Gateway connection state:', isConnected);
        if (isConnected) {
            console.log('[GatewayGameBase] Connecting to live gateway');
            this.connectLiveGateway();
        }
    }

    @handle(gc.Connection.ConnectionHandlers.ConnectHandler, (handler) => handler.handleGateway())
    connectLiveGateway() {
        console.log('[GatewayGameBase] Gateway connection handled at lobby level');
    }

    @render(gc.Connection.ConnectionStore, (store) => store.isConnected)
    handleJoinGame(isConnected: boolean) {
        console.log('[GatewayGameBase] Game connection state:', isConnected);
        if (isConnected) {
            console.log('[GatewayGameBase] Joining game');
            this.joinGame();
        }
    }

    @handle(gc.Connection.ConnectionHandlers.JoinGameHandler)
    joinGame() {
        console.log('[GatewayGameBase] Processing join game authorization');
        this.processAuthorizationIfRoundMatches(this.state.roundId);
    }

    @handle(gc.Connection.ConnectionHandlers.SignInHandler)
    signIn() {
        console.log('[GatewayGameBase] Sign in handler called');
    }

    override handleConnected(signedIn: boolean) {
        console.log('[GatewayGameBase] Connection status:', signedIn);
        if (signedIn) {
            console.log('[GatewayGameBase] Initializing in-game gateway');
            this.inGameLiveGateway();
        }
    }

    @handle(gc.Connection.ConnectionHandlers.InGameHandler, (handler) => handler.handleGateway())
    inGameLiveGateway() {
        console.log('[GatewayGameBase] In-game gateway initialized');
    }

    @handle(gc.Connection.ConnectionHandlers.CloseConnectHandler, (handler) => handler.handleGateway())
    closeConnect() {
        console.log('[GatewayGameBase] Connection close handled at lobby level');
    }
}