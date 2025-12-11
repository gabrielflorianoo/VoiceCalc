import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error('Could not find root element to mount to');
}

if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker
            .register('/service-worker.js')
            .then((registration) => {
                console.log('Service Worker Registrado: ', registration.scope);
            })
            .catch((err) => {
                console.log('Falha no Registro do Service Worker: ', err);
            });
    });
}

const root = createRoot(rootElement);
root.render(
    <StrictMode>
        <App />
    </StrictMode>,
);