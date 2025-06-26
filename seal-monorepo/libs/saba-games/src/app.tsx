import './styles/main.scss';
import './_shared/utils/string-helper';
import { loadI18n } from './i18n';
import Lobby from './lobby/lobby';
import { AppProvider, useAppContext } from './appProvider';
import { SyncMemberSiteBalance } from './_shared/utils/sync-member-site-balance';
import { useEffect } from 'react';
import { createMessageHandlerConfig } from './_shared/utils/message-handler-manager';
import { MessageProvider } from './_shared/contexts/message-context';

interface AppProps extends AppContentProps {
    appEnv: string;
    siteId: string;
    language: string;
    renewToken?: Function;
    updateBalanceCallback?: void | null;
    encryptionKey: string;
}

interface AppContentProps {
    token: string;
    renewToken?: Function;
    updateBalanceCallback?: void | null;
}

const App = ({ appEnv, token, language, siteId, renewToken, updateBalanceCallback, encryptionKey }: AppProps) => {
    return (
        <MessageProvider config={createMessageHandlerConfig(appEnv, encryptionKey)} options={{}}>
            <AppProvider appEnv={appEnv} language={language} siteId={siteId}>
                <AppContent token={token} renewToken={renewToken} updateBalanceCallback={updateBalanceCallback} />
            </AppProvider>
        </MessageProvider>
    );
};

const AppContent = ({ token, renewToken, updateBalanceCallback }: AppContentProps) => {
    const { language, theme, isDarkMode } = useAppContext();

    useEffect(() => {
        if (updateBalanceCallback) {
            SyncMemberSiteBalance.getInstance().setSyncBalanceCallback(updateBalanceCallback);
        }
    }, [updateBalanceCallback]);

    // Update theme and dark mode when they change
    useEffect(() => {
        console.log('AppContent theme', theme);
        console.log('AppContent isDarkMode', isDarkMode);
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-darkmode', isDarkMode.toString());
    }, [theme, isDarkMode]);

    useEffect(() => {
        console.log('AppContent language', language);
    }, [language]);

    loadI18n(language);
    return (
        <div data-react="true" style={{ width: '100%' }}>
            {token && <Lobby token={token} language={language} renewToken={renewToken} />}
        </div>
    );
};

export default App;
