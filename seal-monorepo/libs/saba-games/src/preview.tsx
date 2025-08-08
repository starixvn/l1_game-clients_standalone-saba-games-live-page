import 'reflect-metadata';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useSentryInit } from './saba-games-index';
import { PLATFORM_TYPE_MAPPING, PLATFORM_TYPE_NUMBER, VIVA88_SITE_ID } from '../constant/app';
import App from './app';
import { PreviewProvider, usePreviewContext } from './previewProvider';
//import ProviderSetDropDown from './_shared/components/provider-set-dropdown';
import { requestSSO } from './_shared/utils/sso-helper';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import DiceDemo from './_shared/components/color-game-dice/dice-demo';
import { appSettings } from './_shared/app-settings';

const Preview = () => {
    const [token, setToken] = useState('');

    const isInitialMount = useRef(true);

    const handleGetToken = useCallback(async () => {
        const result = await requestSSO();
        if (result?.token) {
            setToken(result.token);
        }
    }, []);

    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            handleGetToken();
        }
    }, [handleGetToken]);

    return (
        token && (
            <PreviewProvider>
                <Router>
                    <PreviewContext token={token} renewToken={handleGetToken} />
                </Router>
            </PreviewProvider>
        )
    );
};

const PreviewContext = ({ token, renewToken }) => {
    const { theme, isDarkMode, language } = usePreviewContext();
    const [isExpanded, setIsExpanded] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    const appEnv = '';
    const siteId = VIVA88_SITE_ID;
    const platformType = PLATFORM_TYPE_NUMBER.DESKTOP;
    const platform = PLATFORM_TYPE_MAPPING[platformType];
    const encryptionKey = appSettings.encryptionKey || 'development-key';
    useSentryInit();

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        document.documentElement.setAttribute('data-darkmode', isDarkMode.toString());
    }, [theme, isDarkMode]);

    return (
        <div
            ref={containerRef}
            data-platform={platform}
            data-version={process.env.TAG_VERSION}
            className={'seal-vg-sg-index'}
            style={{
                minHeight: isExpanded ? '400px' : '264px',
                transition: 'min-height 0.3s ease-in-out',
                overflow: 'hidden'
            }}
        >
            <div ref={contentRef}>
                {/* <ProviderSetDropDown /> */}
                <Routes>
                    <Route path="/color-games-demo" element={<DiceDemo />} />
                    <Route path="*" element={
                        <App
                            appEnv={appEnv}
                            token={token}
                            language={language}
                            siteId={siteId}
                            encryptionKey={encryptionKey}
                        />
                    } />
                </Routes>
            </div>
        </div>
    );
};

export default Preview;
