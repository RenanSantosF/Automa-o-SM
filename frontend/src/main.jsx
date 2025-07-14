import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.jsx';
import './index.css';
import { LoginProvider } from './Contexts/LoginContext.jsx';
import { UserProvider } from './Contexts/RegisterContext.jsx';

// 👇 Novo: Registro do PWA com vite-plugin-pwa
import { registerSW } from 'virtual:pwa-register';

registerSW({
  onNeedRefresh() {
    console.log('⚠️ Nova versão disponível. Atualize o app.');
  },
  onOfflineReady() {
    console.log('✅ App pronto para uso offline.');
  },
});

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <LoginProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </LoginProvider>
    </StrictMode>
  );
}
