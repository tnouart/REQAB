// src/main.ts
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ThemeProvider } from './contexts/ThemeContext';
import { ToastProvider } from './contexts/ToastContext';
import { FeatureFlagsProvider } from './contexts/FeatureFlagsContext';
import { UserProvider } from './contexts/UserContext';
import App from './App';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <UserProvider>
      <ThemeProvider>
        <ToastProvider>
          <FeatureFlagsProvider>
            <App />
          </FeatureFlagsProvider>
        </ToastProvider>
      </ThemeProvider>
    </UserProvider>
  </React.StrictMode>
);