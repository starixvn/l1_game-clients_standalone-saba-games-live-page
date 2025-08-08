import * as gc from '@sg/sg-game-client';

import SG_LOCAL_CONFIG from '../../../configs/sg/configs.LOCAL_1.json';
import SG_SIT_CONFIG from '../../../configs/sg/configs.SIT.json';
import SG_UAT_CONFIG from '../../../configs/sg/configs.UAT.json';
import SG_PROD_CONFIG from '../../../configs/sg/configs.PROD.json';
import VG_LOCAL_CONFIG from '../../../configs/vg/configs.LOCAL_1.json';
import VG_SIT_CONFIG from '../../../configs/vg/configs.SIT.json';
import VG_UAT_CONFIG from '../../../configs/vg/configs.UAT.json';
import VG_PROD_CONFIG from '../../../configs/vg/configs.PROD.json';

// custom game settings (order)
import SG_GAME_SETTINGS from '../../../configs/saba-game-settings.json';
import VG_GAME_SETTINGS from '../../../configs/vg-game-settings.json';
import { NOVA88_SITE_ID, VIVA88_SITE_ID } from '../../../constant/app';

// Environment configuration
export const reuqestSSO_APP_ENV = 'LOCAL';
export const requestSSO_SITE_ID = VIVA88_SITE_ID;
export enum APP_ENV {
    LOCAL = 'LOCAL',
    SIT = 'SIT',
    UAT = 'UAT',
    PROD = 'PROD'
}

export const getEnvironmentConfig = ({ appEnv, siteId }) => {
    console.log('[AppSettings] Getting environment config for:', { appEnv, siteId });
    const configMaps = {
        [NOVA88_SITE_ID]: {
            LOCAL: VG_LOCAL_CONFIG,
            SIT: VG_SIT_CONFIG,
            UAT: VG_UAT_CONFIG,
            PROD: VG_PROD_CONFIG
        },
        [VIVA88_SITE_ID]: {
            LOCAL: SG_LOCAL_CONFIG,
            SIT: SG_SIT_CONFIG,
            UAT: SG_UAT_CONFIG,
            PROD: SG_PROD_CONFIG
        }
    }
    const environmentsConfig = configMaps[siteId][appEnv];

    const gameSettingsMap = {
        [NOVA88_SITE_ID]: VG_GAME_SETTINGS,
        [VIVA88_SITE_ID]: SG_GAME_SETTINGS
    }
    const gameSettings = gameSettingsMap[siteId];

    console.log('[AppSettings] Environment config loaded:', { environmentsConfig, gameSettings });
    return {
        ...environmentsConfig,
        gameSettings
    };
}

export const appSettings = getEnvironmentConfig({
    appEnv: APP_ENV.LOCAL,
    siteId: VIVA88_SITE_ID
});

export const getSiteConfig = (gameId: number) => {
    console.log('[AppSettings] Getting site config for game:', gameId);
    const gameSetting = appSettings.gameSettings[gameId];
    const config: gc.Configs.SiteConfigs = {
        isDev: false,
        systemType: appSettings.systemType,
        serverDomain: appSettings.serverDomain,
        ssl: appSettings.ssl,
        subDomain: appSettings.subDomain,
        env: appSettings.env,
        enableMsgpackParserAllGames: appSettings.enableMsgpackParserAllGames,
        enableMsgpackParserOnNotification: appSettings.enableMsgpackParserOnNotification,
        websocket: gameSetting.websocket,
        mainObserverNamespace: gameSetting.mainObserverNamespace,
        subGuideDomain: '',
        subDirectory: appSettings.subDirectory,
        userServicePath: appSettings.userServicePath,
    };

    console.log('[AppSettings] Site config generated:', config);
    return config;
};

export const getGameSetting = (gameId: number) => {
    console.log('[AppSettings] Getting game settings for:', gameId);
    const settings = appSettings.gameSettings[gameId];

    if (!settings) {
        console.log('[AppSettings] No settings found for game:', gameId);
        return null;
    }

    console.log('[AppSettings] Game settings found:', settings);
    return settings;
};

export const getGameSettingIds = (visibleOnly: boolean = true) => {
    console.log('[AppSettings] Getting game setting IDs, visibleOnly:', visibleOnly);
    const gameSettings = Object.keys(appSettings.gameSettings).map((value) => {
        return appSettings.gameSettings[value];
    });

    const filteredSettings = visibleOnly
        ? gameSettings.filter(setting => setting.isVisible)
        : gameSettings;

    const orderedGameSettings = filteredSettings.sort((a, b) => a.order - b.order);
    const ids = orderedGameSettings.map((value) => value.id);

    console.log('[AppSettings] Game setting IDs:', ids);
    return ids;
};

export const getVisibleGameSettings = () => {
    console.log('[AppSettings] Getting visible game settings');
    const gameSettings = Object.keys(appSettings.gameSettings).map((value) => {
        return appSettings.gameSettings[value];
    });

    const visibleSettings = gameSettings
        .filter(setting => setting.isVisible)
        .sort((a, b) => a.order - b.order);

    console.log('[AppSettings] Visible game settings:', visibleSettings);
    return visibleSettings;
};