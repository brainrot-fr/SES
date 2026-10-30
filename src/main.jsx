import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { MotionConfig } from 'framer-motion';
import { DirectionProvider as RadixDirectionProvider } from '@radix-ui/react-direction';
import { LanguageProvider } from '@/context/LanguageContext';
import { useLang } from '@/context/LanguageContext';
import { AuthProvider } from '@/context/AuthContext.jsx';
import { TooltipProvider } from '@/components/shadcn/tooltip.jsx';
import { supabaseConfigured } from '@/lib/supabaseClient.js';
import '@/index.css';
import App from '@/App.jsx';

function AppDirectionProvider({ children }) {
  const { isRTL } = useLang();

  return (
    <RadixDirectionProvider dir={isRTL ? 'rtl' : 'ltr'}>
      {children}
    </RadixDirectionProvider>
  );
}

function AppWithConfigGuard() {
  const { t } = useLang();

  if (!supabaseConfigured) {
    return (
      <main className="grid min-h-dvh place-items-center bg-background px-6 text-center">
        <section className="max-w-lg space-y-3" role="alert">
          <h1 className="text-xl font-semibold text-foreground">{t('configErrorTitle')}</h1>
          <p className="text-sm leading-relaxed text-muted-foreground">{t('configErrorDescription')}</p>
        </section>
      </main>
    );
  }

  return (
    <AppDirectionProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AppDirectionProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <TooltipProvider>
        <HashRouter>
          <LanguageProvider>
            <AppWithConfigGuard />
          </LanguageProvider>
        </HashRouter>
      </TooltipProvider>
    </MotionConfig>
  </StrictMode>,
);