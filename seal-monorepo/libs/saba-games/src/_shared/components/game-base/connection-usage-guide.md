# Connection Usage Guide for Standalone Saba Games

## Overview

This guide explains how to properly use the ConnectionManager in your standalone Saba Games components.

## Basic Usage

```typescript
import { ConnectionManager } from './connection-manager';

class MyGameComponent extends GatewayGameBase {
    private connectionManager = ConnectionManager.getInstance();

    componentDidMount() {
        // Register connection when established
        const connection = await this.establishConnection();
        this.connectionManager.registerGatewayConnection(connection);
    }

    componentWillUnmount() {
        // Clean up connections when component unmounts
        this.cleanupConnections();
        super.componentWillUnmount();
    }

    private async cleanupConnections() {
        try {
            // Disconnect and close all connections
            await this.connectionManager.disconnect('component_unmount');
            await this.connectionManager.closeAllGatewayConnections('component_unmount');
        } catch (error) {
            console.error('Error during connection cleanup:', error);
        }
    }
}
```

## Best Practices

1. **Always Use Singleton Instance**

    ```typescript
    const connectionManager = ConnectionManager.getInstance();
    ```

2. **Register Connections Immediately**

    ```typescript
    const connection = await establishConnection();
    connectionManager.registerGatewayConnection(connection);
    ```

3. **Clean Up on Unmount**

    ```typescript
    componentWillUnmount() {
        this.connectionManager.disconnect('component_unmount');
    }
    ```

4. **Handle Connection Errors**

    ```typescript
    try {
        await this.connectionManager.disconnect('cleanup');
    } catch (error) {
        console.error('Connection cleanup failed:', error);
    }
    ```

5. **Check Connection State**
    ```typescript
    if (this.connectionManager.hasActiveGatewayConnections()) {
        // Handle active connections
    }
    ```

## Connection Lifecycle

1. **Initialization**

    - Get ConnectionManager instance
    - Configure container
    - Set up error handlers

2. **Connection Establishment**

    - Create connection
    - Register with ConnectionManager
    - Set up event listeners

3. **Active Usage**

    - Monitor connection state
    - Handle reconnection if needed
    - Track active connections

4. **Cleanup**
    - Remove event listeners
    - Close connections properly
    - Clear references

## Error Handling

```typescript
try {
    await this.connectionManager.disconnect('error_recovery');
    await this.connectionManager.reset();
    // Attempt reconnection
} catch (error) {
    console.error('Connection error:', error);
    // Implement fallback behavior
}
```

## Integration with Container

The ConnectionManager integrates with the shared container system:

```typescript
import { sharedContainer } from './startup';

// The ConnectionManager will automatically:
// 1. Try sharedContainer first
// 2. Fall back to window.saba_games_shared_container
// 3. Try gc.sharedContainer
// 4. Finally try gc.getContainer()
```

## Testing

When writing tests:

```typescript
beforeEach(() => {
    ConnectionManager.getInstance().reset();
});

afterEach(async () => {
    await ConnectionManager.getInstance().closeAllGatewayConnections('test_cleanup');
});
```

## Common Issues and Solutions

1. **Connection Not Closing**

    ```typescript
    // ❌ Wrong
    connection.close();

    // ✅ Correct
    await connectionManager.closeGatewayConnection(connection);
    ```

2. **Memory Leaks**

    ```typescript
    // ❌ Wrong
    componentWillUnmount() {
        connection.close();
    }

    // ✅ Correct
    componentWillUnmount() {
        await this.connectionManager.disconnect('unmount');
        this.connectionManager.clearGatewayConnections();
    }
    ```

3. **Multiple Connections**

    ```typescript
    // ❌ Wrong
    connections.forEach((conn) => conn.close());

    // ✅ Correct
    await this.connectionManager.closeAllGatewayConnections('cleanup');
    ```

## Performance Considerations

1. **Connection Tracking**

    - Only register active connections
    - Unregister closed connections
    - Monitor connection count

2. **Resource Cleanup**

    - Remove event listeners
    - Clear references
    - Use proper cleanup sequence

3. **Error Recovery**
    - Implement exponential backoff
    - Handle reconnection gracefully
    - Log connection issues

## Debugging Tips

1. Check active connections:

    ```typescript
    console.log('Active connections:', connectionManager.getActiveGatewayConnectionCount());
    ```

2. Monitor shutdown status:

    ```typescript
    console.log('Shutdown in progress:', connectionManager.isGatewayShutdownInProgress());
    ```

3. Verify handler availability:
    ```typescript
    console.log('Handler available:', connectionManager.isGatewayHandlerAvailable());
    ```

Remember to always use the ConnectionManager for all gateway connection operations to ensure proper connection management and cleanup.
