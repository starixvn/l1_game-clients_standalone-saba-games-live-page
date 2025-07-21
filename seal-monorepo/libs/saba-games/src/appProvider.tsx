import { ReactNode, createContext, useContext, useState } from 'react';

export interface AppContextType {
    appEnv: string;
    siteId: string;
    theme: string;
    isDarkMode: boolean;
}

interface AppProviderProps {
    children: ReactNode;
    appEnv: string;
    siteId: string;
}

export const DEFAULT_APP_CONTEXT = {
    appEnv: '',
    siteId: '',
    theme: 'light-01',
    isDarkMode: false
};

// Create the context
export const AppContext = createContext<AppContextType>({
    ...DEFAULT_APP_CONTEXT
});

// Set display name for dev tools
AppContext.displayName = 'AppContext';

// Export Provider and Consumer for render props pattern
export const AppContextProvider = AppContext.Provider;
export const AppContextConsumer = AppContext.Consumer;

// Hook for functional components
export const useAppContext = () => useContext(AppContext);

export const AppProvider: React.FC<AppProviderProps> = ({
    children,
    appEnv,
    siteId
}: AppProviderProps) => {
    const [contextValue, setContextValue] = useState<AppContextType>({
        appEnv,
        siteId,
        theme: 'light-01',
        isDarkMode: false
    });

    return (
        <AppContextProvider value={contextValue}>
            {children}
        </AppContextProvider>
    );
};