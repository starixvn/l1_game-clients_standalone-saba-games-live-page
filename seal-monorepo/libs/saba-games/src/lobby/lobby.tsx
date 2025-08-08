import * as gc from '@sg/sg-game-client';
import { handle, observer, render } from '@sg/sg-observer';
import { reaction } from 'mobx';
import React from 'react';
import { configSharedContainer } from '../_shared/components/game-base/startup';
import { LobbyStore } from '../_shared/states/lobby';
import * as lobbyUtils from './utils';
import styles from './lobby.module.scss';
import { DropdownType, LeagueTabDropdown } from '../_shared/components/all-tab-components/league-tab-dropdown';
import { AppContextConsumer } from '../appProvider';
import Loading from '../_shared/components/loading';
import { GameMatchTab } from '../_shared/components/all-tab-components/game-match-tab';
import { IOfferGame, ILobbyState } from './type';
import { GameListTab } from '../_shared/components/all-tab-components/game-list-tab';
import SessionTimeout from '../_shared/components/timeout';
import { ConnectionManager } from '../_shared/components/game-base/connection-manager';
import { sharedContainer } from '../_shared/components/game-base/startup';

@observer
class LobbyComponent extends React.PureComponent<any, ILobbyState> {
    private reRenderGameTimeout?: NodeJS.Timeout;
    private connectionManager: ConnectionManager;
    private authReaction?: any;
    private offerGamesReaction?: any;

    constructor(props: { token: string }) {
        super(props);
        console.log('[Lobby] Initializing with props:', props);
        configSharedContainer();
        this.state = {
            offerGames: [],
            isRenderGame: true,
            leagueToogle: true,
            expandedGames: {},
            selectedGameId: null,
            isSessionTimeout: false,
            isAuthenticated: false,
            username: '',
        };

        // Initialize connection manager at lobby level
        this.connectionManager = ConnectionManager.getInstance();
        console.log('[Lobby] Connection manager initialized');
    }

    clearReRenderGameTimeout = () => {
        console.log('[Lobby] Clearing re-render timeout');
        if (!this.reRenderGameTimeout) {
            return;
        }
        clearTimeout(this.reRenderGameTimeout);
    };

    componentWillUnmount() {
        console.log('[Lobby] Component unmounting');
        this.clearReRenderGameTimeout();

        // Clean up MobX reactions
        if (this.authReaction) {
            console.log('[Lobby] Disposing authentication reaction');
            this.authReaction();
            this.authReaction = undefined;
        }
        if (this.offerGamesReaction) {
            console.log('[Lobby] Disposing offer games reaction');
            this.offerGamesReaction();
            this.offerGamesReaction = undefined;
        }

        // Clean up connections when lobby unmounts
        this.cleanupLobbyConnections();
    }



    /**
     * Clean up all connections when lobby unmounts
     */
    private async cleanupLobbyConnections() {
        console.log('[Lobby] Cleaning up lobby connections');
        try {
            // Disconnect using the manager (handles both handler.disconnect() and connection.close())
            await this.connectionManager.disconnect('lobby_unmount');

            // Close all remaining connections as a safety measure (sends WebSocket close frames)
            await this.connectionManager.closeAllGatewayConnections('lobby_unmount');
            console.log('[Lobby] Connection cleanup completed');
        } catch (error) {
            console.error('[Lobby] Error during connection cleanup:', error);
        }
    }

    componentDidUpdate(prevProps: Readonly<any>, prevState: Readonly<ILobbyState>, snapshot?: any): void {
        console.log('[Lobby] Component updated, checking token change');
        if (prevProps.token !== this.props.token) {
            console.log('[Lobby] Token changed, initiating SSO');
            this.sso({ token: this.props.token });
        }
    }

    componentDidMount() {
        console.log('[Lobby] Component mounted');
        const { token } = this.props;
        this.sso({ token });

        // Set up MobX reactions for isAuthenticated and offerGames
        this.setupAuthObserver();
        this.setupOfferGamesObserver();
    }



    private setupAuthObserver() {
        console.log('[Lobby] Setting up authentication observer');
        try {
            const container = sharedContainer;
            if (!container) {
                console.log('[Lobby] No container available for auth observer setup');
                return;
            }

            const authStore = container.get(gc.Auth.AuthStore);
            if (!authStore) {
                console.log('[Lobby] No auth store available for observer setup');
                return;
            }

            console.log('[Lobby] Creating MobX reaction for isAuthenticated');
            this.authReaction = reaction(
                () => authStore.isAuthenticated,
                (isAuthenticated) => {
                    console.log('[Lobby] MobX reaction triggered - Authentication state changed:', isAuthenticated);
                    this.handleIsAuthenticated(isAuthenticated);
                },
                { fireImmediately: true },
            );
            console.log('[Lobby] Authentication observer setup completed');
        } catch (error) {
            console.error('[Lobby] Error setting up authentication observer:', error);
        }
    }

    private setupOfferGamesObserver() {
        console.log('[Lobby] Setting up offer games observer');
        try {
            const container = sharedContainer;
            if (!container) {
                console.log('[Lobby] No container available for offer games observer setup');
                return;
            }

            const mainPlayerStore = container.get(gc.Player.MainPlayerStore);
            if (!mainPlayerStore) {
                console.log('[Lobby] No main player store available for observer setup');
                return;
            }

            console.log('[Lobby] Creating MobX reaction for offerGames');
            this.offerGamesReaction = reaction(
                () => mainPlayerStore.offerGames,
                (offerGames) => {
                    console.log('[Lobby] MobX reaction triggered - Offer games changed:', offerGames?.length);
                    this.handleOfferGames(offerGames);
                },
                { fireImmediately: true },
            );
            console.log('[Lobby] Offer games observer setup completed');
        } catch (error) {
            console.error('[Lobby] Error setting up offer games observer:', error);
        }
    }



    @handle(gc.Auth.AuthHandlers.SSO)
    sso(ssoInfo: gc.Auth.ISSOInfo) {
        console.log('[Lobby] Handling SSO with info:', ssoInfo);
        return ssoInfo;
    }

    @render(gc.App.AppStore, (store) => store.isSessionTimeout)
    redirectToSessionTimeoutPage(isSessionTimeout: boolean) {
        console.log('[Lobby] Session timeout status changed:', isSessionTimeout);
        this.setState({ isSessionTimeout });
    }

    handleIsAuthenticated(isAuthenticated: boolean) {
        console.log('[Lobby] Authentication state changed:', isAuthenticated);
        this.setState({ isAuthenticated });
        if (isAuthenticated) {
            console.log('[Lobby] User authenticated, connecting to gateway');
            this.connectLiveGateway();
        }
    }

    @handle(gc.GatewayConnection.GatewayConnectionHandlers.ConnectHandler)
    connectLiveGateway() {
        console.log('[Lobby] Connecting to live gateway');
        console.log('[Lobby] ===== GATEWAY CONNECTION FLOW START =====');
        console.log('[Lobby] Current state:', {
            isAuthenticated: this.state.isAuthenticated,
            isSessionTimeout: this.state.isSessionTimeout,
            username: this.state.username,
        });

        // Register the connection when it's established
        const handler = this.getConnectionHandler();

        if (handler && (handler as any).connection) {
            console.log('[Lobby] Registering gateway connection');
            console.log('[Lobby] Handler details:', {
                hasConnection: !!(handler as any).connection,
                connectionId: (handler as any).connection?.id,
                connectionState: (handler as any).connection?.connected,
            });

            this.connectionManager.registerGatewayConnection((handler as any).connection);
            console.log('[Lobby] Gateway connection registered successfully');
        } else {
            console.log('[Lobby] No handler or connection available for registration');
            console.log('[Lobby] Handler available:', !!handler);
            console.log('[Lobby] Handler connection available:', !!(handler as any)?.connection);
        }

        console.log('[Lobby] ===== GATEWAY CONNECTION FLOW END =====');
    }

    /**
     * Get connection handler from the container
     */
    private getConnectionHandler(): any {
        console.log('[Lobby] Getting connection handler');
        try {
            const container = sharedContainer;

            if (!container) {
                console.log('[Lobby] No container available');
                return null;
            }

            const handler = container.get(gc.GatewayConnection.GatewayConnectionHandlers.ConnectHandler);
            console.log('[Lobby] Connection handler retrieved:', !!handler);
            return handler;
        } catch (error) {
            console.error('[Lobby] Error getting connection handler:', error);
            return null;
        }
    }

    handleOfferGames(offerGames: any[] | undefined) {
        console.log('[Lobby] ===== OFFER GAMES UPDATE =====');
        console.log('[Lobby] MobX reaction triggered for offerGames');
        console.log('[Lobby] Handling offer games update:', offerGames?.length);
        console.log('[Lobby] Offer games data:', offerGames);
        console.log('[Lobby] Offer games type:', typeof offerGames);
        console.log('[Lobby] Offer games is array:', Array.isArray(offerGames));

        if (offerGames && offerGames.length > 0) {
            // Convert IOfferGame[] to { gameId: number }[] for getFilteredGames
            const offerGamesForFilter = offerGames.map((game) => ({ gameId: game.gameId }));
            const filteredOfferGames = lobbyUtils.getFilteredGames(offerGamesForFilter);
            console.log('[Lobby] Filtered offer games:', filteredOfferGames);
            const expandedGames = filteredOfferGames.reduce(
                (acc, game) => {
                    acc[game.gameId] = true;
                    return acc;
                },
                {} as { [key: number]: boolean },
            );
            console.log('[Lobby] Setting state with filtered games and expanded games');
            this.setState({ offerGames: filteredOfferGames, expandedGames } as ILobbyState);

            if (!this.state.selectedGameId) {
                console.log('[Lobby] Setting initial selected game:', filteredOfferGames[0].gameId);
                this.setState({ selectedGameId: filteredOfferGames[0].gameId });
            }
        } else {
            console.log('[Lobby] No offer games available or empty array');
            console.log('[Lobby] offerGames value:', offerGames);
        }
        console.log('[Lobby] ===== OFFER GAMES UPDATE END =====');
    }

    @render(LobbyStore, (store) => store.tryToConnectCount)
    updateTryToConnectCount(tryToConnectCount: number) {
        console.log('[Lobby] Connection retry count updated:', tryToConnectCount);
        const isDisconnect = tryToConnectCount > 0;
        if (isDisconnect) {
            console.log('[Lobby] Disconnected, triggering re-render');
            this.setState({ isRenderGame: false });
            this.reRenderGameTimeout = setTimeout(() => {
                console.log('[Lobby] Re-enabling game render');
                this.setState({ isRenderGame: true });
            }, 500);
        }
    }

    @render(gc.Auth.AuthStore, (store) => store.username)
    private handleUsername(username: string) {
        console.log('[Lobby] Username updated:', username);
        username && this.setState({ username });
    }

    updateLeagueToogle = (leagueToogle: boolean) => {
        console.log('[Lobby] League toggle updated:', leagueToogle);
        this.setState({ leagueToogle });
    };

    handleTabClick = (gameId: number) => {
        console.log('[Lobby] Game tab selected:', gameId);
        this.setState({ selectedGameId: gameId });
    };

    private renderGames(context) {
        console.log('[Lobby] Rendering games with context');
        const { offerGames, leagueToogle, selectedGameId, isSessionTimeout, isAuthenticated, username } = this.state;

        const renderGameContent = () => {
            console.log('[Lobby] ===== RENDER GAME CONTENT =====');
            console.log('[Lobby] Current state for rendering:', {
                isSessionTimeout,
                offerGamesLength: offerGames.length,
                isAuthenticated,
                username,
            });

            if (isSessionTimeout) {
                console.log('[Lobby] Rendering session timeout view');
                return (
                    <SessionTimeout
                        token={this.props.token}
                        renewToken={this.props.renewToken}
                        language={this.props.language}
                        username={username}
                    />
                );
            }

            const hasGames = offerGames.length > 0;
            console.log('[Lobby] Has games check:', { hasGames, offerGamesLength: offerGames.length, isAuthenticated });
            if (!hasGames || !isAuthenticated) {
                console.log('[Lobby] Showing loading state - condition not met');
                console.log('[Lobby] hasGames:', hasGames, 'isAuthenticated:', isAuthenticated);
                return <Loading />;
            }

            const selectedGame = offerGames.find((game) => game.gameId === selectedGameId) || offerGames[0];
            console.log('[Lobby] Rendering game content for:', selectedGame.gameId);

            return (
                <>
                    <GameListTab
                        offerGames={offerGames}
                        selectedGameId={selectedGameId}
                        onTabClick={this.handleTabClick}
                    />
                    <div key={selectedGameId} style={{ height: '100%' }}>
                        <GameMatchTab
                            gameId={selectedGame.gameId}
                            className={styles['lobby-tabs']}
                            leagueToogle={leagueToogle}
                            language={this.props.language}
                        />
                    </div>
                </>
            );
        };

        return (
            <>
                <LeagueTabDropdown
                    dropdownType={DropdownType.LEAGUE}
                    leagueToogle={leagueToogle}
                    updateLeagueToogle={this.updateLeagueToogle}
                />
                {renderGameContent()}
            </>
        );
    }

    render() {
        console.log('[Lobby] Rendering main component');
        return (
            <div className={styles['lobby']}>
                <AppContextConsumer>{(context) => this.renderGames(context)}</AppContextConsumer>
            </div>
        );
    }
}

export default LobbyComponent;
