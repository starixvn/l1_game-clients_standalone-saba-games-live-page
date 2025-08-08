import * as gc from '@sg/sg-game-client';
import { sharedContainer } from './startup';

/**
 * Gateway Connection Manager for Saba Games
 * Manages WebSocket gateway connections specifically for saba-games
 * Provides centralized gateway connection tracking and cleanup
 * Ensures proper WebSocket close frames are sent to services
 */
export class ConnectionManager {
    private static instance: ConnectionManager;
    private connections: Set<any> = new Set();
    private shutdownInProgress = false;
    private sharedContainer: any = null;

    private constructor() {
        console.log('[ConnectionManager] Initializing singleton instance');
    }

    public static getInstance(): ConnectionManager {
        if (!ConnectionManager.instance) {
            console.log('[ConnectionManager] Creating new instance');
            ConnectionManager.instance = new ConnectionManager();
        }
        return ConnectionManager.instance;
    }

    /**
     * Get the shared container from various possible sources
     */
    private getSharedContainer(): any {
        if (!this.sharedContainer) {
            console.log('[ConnectionManager] Attempting to get shared container');
            try {
                // Try multiple container sources like hot-league-wall
                const sources = [
                    sharedContainer,
                    window['saba_games_shared_container'],
                    (gc as any).sharedContainer,
                    (window as any).sharedContainer
                ];

                for (const source of sources) {
                    if (source && typeof source.get === 'function') {
                        console.log('[ConnectionManager] Found valid container source');
                        this.sharedContainer = source;
                        break;
                    }
                }

                // Fallback to gc.getContainer() if no other sources work
                if (!this.sharedContainer) {
                    console.log('[ConnectionManager] Using fallback container');
                    this.sharedContainer = gc.getContainer();
                }
            } catch (error) {
                console.error('[ConnectionManager] Failed to get shared container:', error);
            }
        }
        return this.sharedContainer;
    }

    /**
     * Get the Gateway ConnectHandler from the container
     */
    private getGatewayConnectHandler(): any {
        console.log('[ConnectionManager] Getting gateway connect handler');
        const container = this.getSharedContainer();

        if (!container) {
            console.log('[ConnectionManager] No container available');
            return null;
        }

        try {
            const handler = container.get(gc.GatewayConnection.GatewayConnectionHandlers.ConnectHandler);
            console.log('[ConnectionManager] Gateway handler retrieved:', !!handler);
            return handler;
        } catch (error) {
            console.error('[ConnectionManager] Failed to get gateway handler:', error);
            return null;
        }
    }

    /**
     * Register a gateway connection for tracking
     */
    public registerGatewayConnection(connection: any): void {
        console.log('[ConnectionManager] Registering new gateway connection');
        console.log('[ConnectionManager] ===== GATEWAY CONNECTION REGISTRATION =====');
        console.log('[ConnectionManager] Connection details:', {
            exists: !!connection,
            id: connection?.id,
            connected: connection?.connected,
            disconnected: connection?.disconnected
        });

        if (connection && !this.connections.has(connection)) {
            this.connections.add(connection);
            console.log('[ConnectionManager] Connection registered successfully');
            console.log('[ConnectionManager] Total active connections:', this.connections.size);

            // Add connection state logging
            if (connection.on) {
                connection.on('connect', () => {
                    console.log('[ConnectionManager] Registered connection connected, ID:', connection.id);
                });

                connection.on('disconnect', (reason: string) => {
                    console.log('[ConnectionManager] Registered connection disconnected, ID:', connection.id, 'Reason:', reason);
                });

                connection.on('error', (error: any) => {
                    console.error('[ConnectionManager] Registered connection error, ID:', connection.id, 'Error:', error);
                });
            }
        } else {
            console.log('[ConnectionManager] Connection not registered:', {
                connectionExists: !!connection,
                alreadyRegistered: connection ? this.connections.has(connection) : false
            });
        }

        console.log('[ConnectionManager] ===== GATEWAY CONNECTION REGISTRATION END =====');
    }

    /**
     * Unregister a gateway connection from tracking
     */
    public unregisterGatewayConnection(connection: any): void {
        console.log('[ConnectionManager] Unregistering gateway connection');
        if (connection && this.connections.has(connection)) {
            this.connections.delete(connection);
            console.log('[ConnectionManager] Connection unregistered, remaining connections:', this.connections.size);
        }
    }

    /**
     * Close a specific gateway connection with proper WebSocket cleanup
     */
    public async closeGatewayConnection(connection: any, reason?: string): Promise<boolean> {
        console.log('[ConnectionManager] Closing gateway connection, reason:', reason);
        if (!connection) {
            console.log('[ConnectionManager] No connection to close');
            return false;
        }

        try {
            // 1. Remove event listeners first
            this.removeConnectionListeners(connection);

            // 2. Check connection state
            if (connection.readyState === WebSocket.OPEN) {
                console.log('[ConnectionManager] Connection is open, performing close');
                // 3. Close the connection (this sends WebSocket close frame)
                await this.performConnectionClose(connection);
            }

            // 4. Unregister from tracking
            this.unregisterGatewayConnection(connection);

            // 5. Clear references
            this.clearConnectionReferences(connection);

            console.log('[ConnectionManager] Connection closed successfully');
            return true;

        } catch (error) {
            console.error('[ConnectionManager] Error closing connection:', error);
            return false;
        }
    }

    /**
     * Remove event listeners from connection
     */
    private removeConnectionListeners(connection: any): void {
        console.log('[ConnectionManager] Removing connection listeners');
        if (!connection || typeof connection.removeEventListener !== 'function') {
            return;
        }

        try {
            // Remove common event listeners
            const events = ['open', 'close', 'error', 'message'];
            events.forEach(event => {
                connection.removeEventListener(event, () => { });
            });
            console.log('[ConnectionManager] Listeners removed successfully');
        } catch (error) {
            console.error('[ConnectionManager] Error removing listeners:', error);
        }
    }

    /**
     * Perform the actual connection close (sends WebSocket close frame)
     */
    private async performConnectionClose(connection: any): Promise<void> {
        console.log('[ConnectionManager] Performing connection close');
        return new Promise((resolve, reject) => {
            try {
                // Set up close event listener
                const onClose = () => {
                    console.log('[ConnectionManager] Connection close event received');
                    connection.removeEventListener('close', onClose);
                    resolve();
                };

                const onError = (error: any) => {
                    console.error('[ConnectionManager] Connection close error:', error);
                    connection.removeEventListener('error', onError);
                    reject(error);
                };

                connection.addEventListener('close', onClose);
                connection.addEventListener('error', onError);

                // Close the connection (this sends WebSocket close frame with code 41)
                connection.close();

                // Set a timeout in case the close event doesn't fire
                setTimeout(() => {
                    console.log('[ConnectionManager] Connection close timeout reached');
                    connection.removeEventListener('close', onClose);
                    connection.removeEventListener('error', onError);
                    resolve();
                }, 5000);

            } catch (error) {
                console.error('[ConnectionManager] Error in performConnectionClose:', error);
                reject(error);
            }
        });
    }

    /**
     * Clear connection references
     */
    private clearConnectionReferences(connection: any): void {
        console.log('[ConnectionManager] Clearing connection references');
        try {
            // Clear common reference properties
            if (connection && typeof connection === 'object') {
                Object.keys(connection).forEach(key => {
                    if (key.includes('connection') || key.includes('socket')) {
                        (connection as any)[key] = null;
                    }
                });
            }
            console.log('[ConnectionManager] References cleared successfully');
        } catch (error) {
            console.error('[ConnectionManager] Error clearing references:', error);
        }
    }

    /**
     * Disconnect using the gateway handler's disconnect method and close connections
     */
    public async disconnect(reason: string): Promise<void> {
        console.log('[ConnectionManager] Disconnecting, reason:', reason);
        if (this.shutdownInProgress) {
            console.log('[ConnectionManager] Shutdown already in progress');
            return;
        }

        try {
            this.shutdownInProgress = true;
            console.log('[ConnectionManager] Starting shutdown process');

            const handler = this.getGatewayConnectHandler();

            if (handler) {
                // 1. Call handler's disconnect method
                if (typeof handler.disconnect === 'function') {
                    console.log('[ConnectionManager] Calling handler disconnect');
                    await handler.disconnect();
                }

                // 2. Close the handler's connection if it exists
                if (handler.connection) {
                    console.log('[ConnectionManager] Closing handler connection');
                    await this.closeGatewayConnection(handler.connection, reason);
                }
            }
        } catch (error) {
            console.error('[ConnectionManager] Error during disconnect:', error);
        } finally {
            this.shutdownInProgress = false;
            console.log('[ConnectionManager] Disconnect process completed');
        }
    }

    /**
     * Close all tracked gateway connections directly (sends WebSocket close frames)
     */
    public async closeAllGatewayConnections(reason: string): Promise<void> {
        console.log('[ConnectionManager] Closing all gateway connections, reason:', reason);
        if (this.connections.size === 0) {
            console.log('[ConnectionManager] No connections to close');
            return;
        }

        const connections = Array.from(this.connections);
        console.log('[ConnectionManager] Closing', connections.length, 'connections');
        const closePromises = connections.map(connection =>
            this.closeGatewayConnection(connection, reason)
        );

        try {
            await Promise.allSettled(closePromises);
            console.log('[ConnectionManager] All connections closed');
        } catch (error) {
            console.error('[ConnectionManager] Error during bulk close:', error);
        }
    }

    /**
     * Get the number of active gateway connections
     */
    public getActiveGatewayConnectionCount(): number {
        return this.connections.size;
    }

    /**
     * Check if gateway shutdown is in progress
     */
    public isGatewayShutdownInProgress(): boolean {
        return this.shutdownInProgress;
    }

    /**
     * Check if there are any active gateway connections
     */
    public hasActiveGatewayConnections(): boolean {
        return this.connections.size > 0;
    }

    /**
     * Get all tracked gateway connections (for debugging)
     */
    public getGatewayConnections(): any[] {
        return Array.from(this.connections);
    }

    /**
     * Clear all gateway connections (for testing or reset)
     */
    public clearGatewayConnections(): void {
        console.log('[ConnectionManager] Clearing all gateway connections');
        this.connections.clear();
    }

    /**
     * Reset gateway connection state and clear all connections
     */
    public async reset(): Promise<void> {
        console.log('[ConnectionManager] Resetting connection manager');
        try {
            await this.closeAllGatewayConnections('reset');
            this.shutdownInProgress = false;
            console.log('[ConnectionManager] Reset completed');
        } catch (error) {
            console.error('[ConnectionManager] Error during reset:', error);
        }
    }

    /**
     * Check if gateway connect handler is available
     */
    public isGatewayHandlerAvailable(): boolean {
        console.log('[ConnectionManager] Checking gateway handler availability');
        const handler = this.getGatewayConnectHandler();
        const isAvailable = handler !== null && typeof handler.disconnect === 'function';
        console.log('[ConnectionManager] Gateway handler available:', isAvailable);
        return isAvailable;
    }
}