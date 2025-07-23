import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { MessageHandlerManager, MessageHandlerConfig, MessageHandlerOptions } from '../utils/message-handler-manager';
import { WindowMessage, MessageType, MessageData, BettingBlockStateData, BetPanelStateData, HandleBetData, ShowConfirmBetData, HideConfirmBetData, ToggleStatisticData, SetTokenData } from '../types/message-types';
import { getElementTotalHeight } from '../utils/height-util';

interface MessageContextType {
    sendMessage: (message: WindowMessage) => void;
    messageManager: MessageHandlerManager | null;
    messageData: MessageData;
    getMessageData: <T extends MessageType>(type: T) => MessageData[T] | undefined;
    clearMessageData: (type: MessageType) => void;
    clearAllMessageData: () => void;
}

const MessageContext = createContext<MessageContextType | null>(null);

interface MessageProviderProps {
    children: React.ReactNode;
    config: MessageHandlerConfig;
    options: MessageHandlerOptions;
}

const MessageManagerProvider: React.FC<MessageProviderProps> = ({
    children,
    config,
    options
}) => {
    const messageManagerRef = useRef<MessageHandlerManager | null>(null);
    const [messageData, setMessageData] = useState<MessageData>({} as MessageData);

    const handleMessage = useCallback((data: any, type: MessageType) => {
        setMessageData(prev => ({
            ...prev,
            [type]: data
        }));
    }, []);

    const getMessageData = useCallback(<T extends MessageType>(type: T): MessageData[T] | undefined => {
        return messageData[type];
    }, [messageData]);

    const clearMessageData = useCallback((type: MessageType) => {
        setMessageData(prev => {
            const newData = { ...prev };
            delete newData[type];
            return newData;
        });
    }, []);

    const clearAllMessageData = useCallback(() => {
        setMessageData({} as MessageData);
    }, []);

    useEffect(() => {
        const enhancedOptions: MessageHandlerOptions = {
            ...options,
            onSetToken: (data: SetTokenData) => {
                handleMessage(data, MessageType.SET_TOKEN);
                options.onSetToken?.(data);
            },
            onUpdateSettings: (data) => {
                handleMessage(data, MessageType.UPDATE_SETTINGS);
                document.documentElement.setAttribute('data-theme', data.theme);
                document.documentElement.setAttribute('data-darkmode', data.isDarkMode.toString());
                options.onUpdateSettings?.(data);
            },
            onBettingBlockState: (data: BettingBlockStateData) => {
                handleMessage(data, MessageType.BETTING_BLOCK_STATE);
                options.onBettingBlockState?.(data);
            },
            onBetPanelState: (data: BetPanelStateData) => {
                handleMessage(data, MessageType.BET_PANEL_STATE);
                options.onBetPanelState?.(data);
            },
            onHandleBet: (data: HandleBetData) => {
                handleMessage(data, MessageType.HANDLE_BET);
                options.onHandleBet?.(data);
            },
            onShowConfirmBet: (data: ShowConfirmBetData) => {
                handleMessage(data, MessageType.SHOW_CONFIRM_BET);
                options.onShowConfirmBet?.(data);
            },
            onHideConfirmBet: (data: HideConfirmBetData) => {
                handleMessage(data, MessageType.HIDE_CONFIRM_BET);
                options.onHideConfirmBet?.(data);
            },
            onHandleClear: () => {
                handleMessage(undefined, MessageType.HANDLE_CLEAR);
                options.onHandleClear?.();
            },
            onToggleStatistic: (data: ToggleStatisticData) => {
                handleMessage(data, MessageType.TOGGLE_STATISTIC);
                options.onToggleStatistic?.(data);
            },
            onGetHeight: () => {
                const appHeight = getElementTotalHeight('saba-games-app');
                const heightMessage = {
                    type: MessageType.SET_HEIGHT,
                    data: {
                        height: appHeight
                    }
                } as const;

                sendMessage(heightMessage);
            }
        };

        const manager = new MessageHandlerManager(config, enhancedOptions);
        messageManagerRef.current = manager;

        manager.initialize();

        return () => {
            manager.destroy();
            messageManagerRef.current = null;
        };
    }, [config, options, handleMessage]);

    const sendMessage = (message: WindowMessage) => {
        messageManagerRef.current?.sendMessage(message);
    };

    return (
        <MessageContext.Provider value={{
            sendMessage,
            messageManager: messageManagerRef.current,
            messageData,
            getMessageData,
            clearMessageData,
            clearAllMessageData
        }}>
            {children}
        </MessageContext.Provider>
    );
};

export const MessageProvider: React.FC<MessageProviderProps> = ({
    children,
    config,
    options
}) => {
    return (
        <MessageManagerProvider config={config} options={options}>
            {children}
        </MessageManagerProvider>
    );
};

export const useMessageContext = () => {
    const context = useContext(MessageContext);
    if (!context) {
        throw new Error('useMessageContext must be used within a MessageProvider');
    }
    return context;
};