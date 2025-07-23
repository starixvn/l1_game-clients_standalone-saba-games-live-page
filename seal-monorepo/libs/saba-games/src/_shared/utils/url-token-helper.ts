import { MessageEncryption } from '../../utils/encryption';

/**
 * 從 URL 參數中獲取並解密 token
 * 處理格式：URL 參數包含 JSON 字符串形式的加密對象 {encryptedData: "...", iv: "..."}
 * 加密對象包含 {token: "actual_token"} 結構
 */
export const getEncryptedTokenFromUrl = (
    encryptionKey: string,
    fallbackToken: string = '',
    paramName: string = 'token'
): string => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encryptedTokenParam = urlParams.get(paramName);
        
        if (!encryptedTokenParam) {
            console.log('No encrypted token parameter found in URL');
            return fallbackToken;
        }

        if (!encryptionKey) {
            console.warn('No encryption key provided');
            return fallbackToken;
        }

        const messageEncryption = new MessageEncryption(encryptionKey);
        
        try {
            const encryptedToken = JSON.parse(encryptedTokenParam);
            
            if (!encryptedToken.encryptedData || !encryptedToken.iv) {
                console.warn('Invalid encrypted token format');
                return fallbackToken;
            }
            
            const decryptedData = messageEncryption.decrypt(encryptedToken);
            
            if (decryptedData && decryptedData.token) {
                console.log('Successfully decrypted token from URL');
                return decryptedData.token;
            } else {
                console.warn('Decrypted data does not contain token field');
                return fallbackToken;
            }
            
        } catch (decryptError) {
            console.error('Failed to decrypt token from URL:', decryptError);
            return fallbackToken;
        }
        
    } catch (error) {
        console.error('Error processing URL token:', error);
        return fallbackToken;
    }
};

/**
 * 檢查 URL 是否包含加密的 token 參數
 */
export const hasEncryptedTokenInUrl = (paramName: string = 'token'): boolean => {
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const encryptedTokenParam = urlParams.get(paramName);
        
        if (!encryptedTokenParam) {
            return false;
        }

        const parsed = JSON.parse(encryptedTokenParam);
        return !!(parsed.encryptedData && parsed.iv);
    } catch {
        return false;
    }
};

/**
 * 清理 URL 中的 token 參數（安全考慮）
 */
export const cleanTokenFromUrl = (paramName: string = 'token'): void => {
    try {
        const url = new URL(window.location.href);
        url.searchParams.delete(paramName);

        window.history.replaceState({}, document.title, url.toString());
        console.log('Cleaned token parameter from URL');
    } catch (error) {
        console.warn('Failed to clean token from URL:', error);
    }
}; 