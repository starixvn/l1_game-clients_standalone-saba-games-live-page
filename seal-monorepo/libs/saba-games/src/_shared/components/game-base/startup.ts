import * as gc from '@sg/sg-game-client';
import * as Observer from '@sg/sg-observer';
import * as mobx from 'mobx';
import { reaction } from 'mobx';
import 'reflect-metadata';
import { getSiteConfig, appSettings } from '../../app-settings';
import { Lobby } from '../../states';
import { LobbyStore } from '../../states/lobby';

interface ILanguages {
    [key: string]: any;
}

declare global {
    interface Window {
        languages: ILanguages;
    }
}

function getSharedContainer(siteConfigs: gc.Configs.SiteConfigs) {
    console.log('[Startup] Creating shared container with configs:', siteConfigs);
    const containerOptions: gc.IContainerOptions = {
        onContainerCreated: (container) => {
            console.log('[Startup] Container created, binding site configs');
            container.bind(gc.Configs.SiteConfigs).toConstantValue(siteConfigs);
        },

        enabledFeatures: [
            gc.Player.FEATURE_NAME,
            gc.Auth.FEATURE_NAME,
            gc.App.FEATURE_NAME,
            gc.Notification.FEATURE_NAME,
            gc.ConnectSite.FEATURE_NAME,
            gc.ChipSetting.FEATURE_NAME,
            gc.GatewayConnection.FEATURE_NAME,
            gc.RoundBasePF.FEATURE_NAME,
            Lobby.FEATURE_NAME,
        ],
        features: [...gc.defaultFeatures, Lobby],
    };

    console.log('[Startup] Container options configured:', {
        enabledFeatures: containerOptions.enabledFeatures,
        featuresCount: containerOptions?.features?.length
    });

    return gc.getContainer(containerOptions);
}

console.log('[Startup] Initializing shared container with game ID:', appSettings.defaultGameId);
export const sharedContainer = getSharedContainer(getSiteConfig(appSettings.defaultGameId));

// Make the shared container available globally for external access
if (typeof window !== 'undefined') {
    console.log('[Startup] Making shared container globally available');
    (window as any).saba_games_shared_container = sharedContainer;
}

export function configSharedContainer() {
    console.log('[Startup] Configuring shared container with observer');
    Observer.configure({ default: { mobx, container: gc.buildObserverContainer(sharedContainer) } });
    console.log('[Startup] Shared container configuration complete');
    return sharedContainer;
}

export function configGameContainer(gameName: string, containerOptions: gc.IContainerOptions) {
    console.log('[Startup] Configuring game container for:', gameName);
    const container = gc.getContainer(containerOptions);

    console.log('[Startup] Getting lobby store from shared container');
    const lobbyStore = sharedContainer.get(LobbyStore);
    container.bind(LobbyStore).toConstantValue(lobbyStore);

    console.log('[Startup] Building observer container');
    const observerContainer = gc.buildObserverContainer(container);

    console.log('[Startup] Configuring observer for game:', gameName);
    Observer.configure({ [gameName]: { mobx: { reaction }, container: observerContainer } });

    console.log('[Startup] Game container configuration complete');
    return container;
}