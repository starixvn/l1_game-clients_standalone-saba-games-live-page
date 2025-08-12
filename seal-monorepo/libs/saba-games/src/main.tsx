import * as ReactDOM from 'react-dom/client';
import { ErrorBoundary } from 'react-error-boundary';

import SabaGamesGroup from './index';

const ErrorFallback = ({ error }) => {
    console.error('Error in application:', error);
    return (
        <div role="alert">
            <p>Something went wrong:</p>
            <pre>{error.message}</pre>
        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement);

const defaultProps = {
    isDarkMode: false,
    platformType: undefined,
    token: '',
    appEnv: '',
    siteId: '',
    language: 'en',
    encryptionKey: undefined
};

const App = SabaGamesGroup;

// Explicit default props passed to the app
const props = defaultProps;

root.render(
    <ErrorBoundary FallbackComponent={ErrorFallback}>
        <App {...props} />
    </ErrorBoundary>
);
