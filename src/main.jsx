/**
 * main.jsx
 * Entry point for the React application.
 *
 * - Bootstraps React using createRoot.
 * - Wraps the whole app in LanguageProvider so translation and direction state
 *   is available throughout the component tree.
 */

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <LanguageProvider>
        <App />
      </LanguageProvider>
    </AuthProvider>
  </StrictMode>,
);