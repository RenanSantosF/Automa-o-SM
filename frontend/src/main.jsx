import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { LoginProvider } from './Contexts/LoginContext.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <StrictMode>
      <LoginProvider>
        <App />
      </LoginProvider>
    </StrictMode>
  );
}
