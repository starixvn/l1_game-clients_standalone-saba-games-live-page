import * as gc from '@sg/sg-game-client';
import * as Observer from '@sg/sg-observer';
import * as mobx from 'mobx';
import { reaction } from 'mobx';
import 'reflect-metadata';
import { getSiteConfig, appSettings } from '../../app-settings';
import { Lobby } from '../../states';
import { LobbyStore } from '../../states/lobby';
interface Languages {
    [key: string]: any;
}

declare global {
    interface Window {
        languages: Languages;
    }
}

function getSharedContainer(siteConfigs: gc.Configs.SiteConfigs) {
    const containerOptions: gc.IContainerOptions = {
        onContainerCreated: (container) => {
            console.log('stand alone game containerOptions', siteConfigs);
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

    
    return gc.getContainer(containerOptions);
}

export const sharedContainer = getSharedContainer(getSiteConfig(appSettings.defaultGameId));

export function configSharedContainer() {
    console.log('stand alone game configSharedContainer', gc.buildObserverContainer(sharedContainer));
    Observer.configure({ default: { mobx, container: gc.buildObserverContainer(sharedContainer) } });
    return sharedContainer;
}

export function configGameContainer(gameName: string, containerOptions: gc.IContainerOptions) {
    const container = gc.getContainer(containerOptions);

    const lobbyStore = sharedContainer.get(LobbyStore);
    console.log('stand alone game lobbyStore', lobbyStore);
    container.bind(LobbyStore).toConstantValue(lobbyStore);

    const observerContainer = gc.buildObserverContainer(container);

    Observer.configure({ [gameName]: { mobx: { reaction }, container: observerContainer } });
    return container;
}
