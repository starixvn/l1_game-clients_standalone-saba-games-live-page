import './styles/main.scss';
import './_shared/utils/string-helper';
import { loadI18n } from './i18n';
import Lobby from './lobby/lobby';
import { AppProvider } from './appProvider';
import { SyncMemberSiteBalance } from './_shared/utils/sync-member-site-balance';
import { useEffect, useState, useRef } from 'react';
import { createMessageHandlerConfig } from './_shared/utils/message-handler-manager';
import { MessageProvider } from './_shared/contexts/message-context';
import { useSettingsData } from './hooks/use-message-data';
import { getEncryptedTokenFromUrl } from './_shared/utils/url-token-helper';
import { useMessageContext } from './_shared/contexts/message-context';
import { MessageType } from './_shared/types/message-types';

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
    const { sendMessage } = useMessageContext();
    const appContainerRef = useRef<HTMLDivElement>(null);
    const resizeObserverRef = useRef<ResizeObserver | null>(null);
    const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const lastHeightRef = useRef<number>(0);

    useEffect(() => {
        if (updateBalanceCallback) {
            SyncMemberSiteBalance.getInstance().setSyncBalanceCallback(updateBalanceCallback);
        }
    }, [updateBalanceCallback]);

    useEffect(() => {
        const appContainer = appContainerRef.current;
        if (!appContainer) return;
        const sendInitialHeight = () => {
            const initialHeight = appContainer.offsetHeight;
            if (initialHeight > 0) {
                const heightMessage = {
                    type: MessageType.SET_HEIGHT,
                    data: {
                        height: initialHeight
                    }
                } as const;

                sendMessage(heightMessage);
                lastHeightRef.current = initialHeight;
            }
        };

        const debouncedHeightUpdate = (newHeight: number) => {
            if (Math.abs(newHeight - lastHeightRef.current) < 1) {
                return;
            }

            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
            }

            debounceTimeoutRef.current = setTimeout(() => {
                const heightMessage = {
                    type: MessageType.SET_HEIGHT,
                    data: {
                        height: newHeight
                    }
                } as const;

                sendMessage(heightMessage);
                lastHeightRef.current = newHeight;
            }, 100);
        };

        resizeObserverRef.current = new ResizeObserver((entries) => {
            for (const entry of entries) {
                const newHeight = entry.contentRect.height;
                debouncedHeightUpdate(newHeight);
            }
        });

        resizeObserverRef.current.observe(appContainer);
        setTimeout(sendInitialHeight, 100);

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
                resizeObserverRef.current = null;
            }
            if (debounceTimeoutRef.current) {
                clearTimeout(debounceTimeoutRef.current);
                debounceTimeoutRef.current = null;
            }
        };
    }, [sendMessage]);

    loadI18n(settingData?.language || 'en');
    return (
        <div 
            id="saba-games-app" 
            ref={appContainerRef}
            data-react="true" 
            style={{ width: '100%' }}
        >
            {token && <Lobby token={token} language={settingData?.language || 'en'} renewToken={renewToken} />}
        </div>
    );
};

export default App;
