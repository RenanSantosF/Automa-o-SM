import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import React from 'react';
import App from './App.jsx';
import './index.css';
import { LoginProvider } from './Contexts/LoginContext.jsx';
import { UserProvider } from './Contexts/RegisterContext.jsx';

const rootElement = document.getElementById('root');

if (rootElement) {
  createRoot(rootElement).render(
    <React.StrictMode>
      <LoginProvider>
        <UserProvider>
          <App />
        </UserProvider>
      </LoginProvider>
    </React.StrictMode>
  );
}
