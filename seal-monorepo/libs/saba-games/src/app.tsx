import './styles/main.scss';
import './_shared/utils/string-helper';
import { loadI18n } from './i18n';
import Lobby from './lobby/lobby';
import { AppProvider } from './appProvider';
import { SyncMemberSiteBalance } from './_shared/utils/sync-member-site-balance';
import { useEffect, useState } from 'react';
import { createMessageHandlerConfig } from './_shared/utils/message-handler-manager';
import { MessageProvider } from './_shared/contexts/message-context';
import { useSettingsData } from './hooks/use-message-data';
import { getEncryptedTokenFromUrl } from './_shared/utils/url-token-helper';

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

const App = ({ appEnv, token, siteId, renewToken, updateBalanceCallback, encryptionKey }: AppProps) => {
    const [decryptedToken, setDecryptedToken] = useState<string>('');
    const [isLoading, setIsLoading] = useState<boolean>(true);

    useEffect(() => {
        const initializeToken = () => {
            try {
                const tokenFromUrl = getEncryptedTokenFromUrl(encryptionKey, token);
                
                setDecryptedToken(tokenFromUrl);
            } catch (error) {
                setDecryptedToken(token);
            } finally {
                setIsLoading(false);
            }
        };

        initializeToken();
    }, [token, encryptionKey, appEnv]);

    if (isLoading) {
        return <div>Loading...</div>;
    }
    
    return (
        <MessageProvider config={createMessageHandlerConfig(appEnv, encryptionKey)} options={{}}>
            <AppProvider appEnv={appEnv} siteId={siteId}>
                <AppContent token={decryptedToken} renewToken={renewToken} updateBalanceCallback={updateBalanceCallback} />
            </AppProvider>
        </MessageProvider>
    );
};

const AppContent = ({ token, renewToken, updateBalanceCallback }: AppContentProps) => {
    const settingData = useSettingsData();

    useEffect(() => {
        if (updateBalanceCallback) {
            SyncMemberSiteBalance.getInstance().setSyncBalanceCallback(updateBalanceCallback);
        }
    }, [updateBalanceCallback]);

    loadI18n(settingData?.language || 'en');
    return (
        <div id="saba-games-app" data-react="true" style={{ width: '100%' }}>
            {token && <Lobby token={token} language={settingData?.language || 'en'} renewToken={renewToken} />}
        </div>
    );
};

export default App;
