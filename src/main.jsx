import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext.jsx';
import './index.css';
import App from './App.jsx';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <HashRouter>
        <LanguageProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </LanguageProvider>
      </HashRouter>
    </MotionConfig>
  </StrictMode>,
);