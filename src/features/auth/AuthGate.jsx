import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';

export default function AuthGate() {
  const { t, lang } = useLang();
  const { signIn, signInGoogle, signUp } = useAuth();
  const [mode, setMode] = useState('signup');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [confirmationSent, setConfirmationSent] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'signin') {
        await signIn(email.trim(), password);
      } else {
        const result = await signUp(email.trim(), password);
        setConfirmationSent(result.confirmationRequired);
      }
    } catch (authError) {
      setError(authError.message || t('authGenericError'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    setBusy(true);
    try {
      await signInGoogle();
    } catch (authError) {
      setError(authError.message || t('authGenericError'));
    } finally {
      setBusy(false);
    }
  };

  const selectMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setConfirmationSent(false);
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-bg p-5">
      <section className="w-full max-w-[400px] rounded-md border border-hairline bg-surface-1 p-6 shadow-md">
        <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-primary">
          {t('authRequiredEyebrow')}
        </p>
        <h1 className="mb-2 mt-2 text-xl font-bold text-heading">
          {t('authRequiredTitle')}
        </h1>
        <p className="mb-5 mt-0 text-sm leading-relaxed text-muted">
          {t('authRequiredDescription')}
        </p>

        <div className="mb-5 grid grid-cols-2 rounded-md bg-surface-2 p-1" role="tablist" aria-label={t('authModeLabel')}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => selectMode('signup')}
            className={`rounded-sm px-3 py-2.5 text-sm font-semibold transition-colors ${mode === 'signup' ? 'bg-surface-1 text-heading shadow-sm' : 'text-muted'}`}
          >
            {t('authCreateAccount')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => selectMode('signin')}
            className={`rounded-sm px-3 py-2.5 text-sm font-semibold transition-colors ${mode === 'signin' ? 'bg-surface-1 text-heading shadow-sm' : 'text-muted'}`}
          >
            {t('signInTitle')}
          </button>
        </div>

        {confirmationSent ? (
          <div className="rounded-md border border-hairline bg-surface-2 p-4" role="status">
            <p className="m-0 text-sm font-semibold text-heading">{t('authConfirmationTitle')}</p>
            <p className="mb-0 mt-2 text-sm leading-relaxed text-muted">
              {t('authConfirmationDescription')} <strong className="text-body">{email}</strong>
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <label className="mb-1.5 block text-sm font-semibold text-body" htmlFor="auth-email">
              {t('authEmailLabel')}
            </label>
            <input
              id="auth-email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('authUpgradeEmailPlaceholder')}
              className="w-full rounded-md border border-hairline bg-surface-1 px-3 py-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
            <label className="mb-1.5 mt-4 block text-sm font-semibold text-body" htmlFor="auth-password">
              {t('signInPasswordPlaceholder')}
            </label>
            <input
              id="auth-password"
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-hairline bg-surface-1 px-3 py-3 text-sm text-body outline-none focus:ring-2 focus:ring-primary/30"
              dir="ltr"
            />
            {error && <p className="mb-0 mt-3 text-sm text-danger" role="alert">{error}</p>}
            <button
              type="submit"
              disabled={busy}
              className="mt-5 w-full rounded-md bg-primary px-4 py-3 text-sm font-bold text-on-primary transition-opacity disabled:cursor-wait disabled:opacity-60"
            >
              {busy
                ? t(mode === 'signup' ? 'authCreatingAccount' : 'signInSubmitting')
                : t(mode === 'signup' ? 'authCreateAccount' : 'signInSubmit')}
            </button>
          </form>
        )}

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="mt-4 w-full rounded-md border border-hairline bg-surface-1 px-4 py-3 text-sm font-semibold text-body transition-colors hover:bg-surface-2 disabled:cursor-wait disabled:opacity-60"
        >
          {t('googleSignIn')}
        </button>

        <button
          type="button"
          onClick={() => selectMode(mode === 'signup' ? 'signin' : 'signup')}
          className="mt-4 w-full border-0 bg-transparent py-2 text-sm font-semibold text-primary underline-offset-4 hover:underline"
        >
          {t(mode === 'signup' ? 'authHaveAccount' : 'authNeedAccount')}
        </button>
        <p className="mb-0 mt-3 text-center text-xs text-muted" lang={lang}>
          {t('authDataNotice')}
        </p>
      </section>
    </main>
  );
}