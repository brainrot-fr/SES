import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import TextField from '../../components/ui/TextField';
import AppIcon from '../../components/icons/AppIcon';

export default function AuthGate() {
  const { t, lang } = useLang();
  const { signIn, signInGoogle, signUp } = useAuth();
  const [mode, setMode] = useState('signup');
  const [username, setUsername] = useState('');
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
        if (username.trim().length < 2) {
          setError(t('authUsernameTooShort'));
          return;
        }
        const result = await signUp(username.trim(), email.trim(), password);
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
    <main className="auth-gate">
      <Card as="section" className="auth-gate__card">
        <p className="auth-gate__eyebrow">
          {t('authRequiredEyebrow')}
        </p>
        <h1 className="auth-gate__title">
          {t('authRequiredTitle')}
        </h1>
        <p className="auth-gate__description">
          {t('authRequiredDescription')}
        </p>

        <div className="auth-gate__tabs" role="tablist" aria-label={t('authModeLabel')}>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signup'}
            onClick={() => selectMode('signup')}
            className={`auth-gate__tab${mode === 'signup' ? ' auth-gate__tab--active' : ''}`}
          >
            {t('authCreateAccount')}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'signin'}
            onClick={() => selectMode('signin')}
            className={`auth-gate__tab${mode === 'signin' ? ' auth-gate__tab--active' : ''}`}
          >
            {t('signInTitle')}
          </button>
        </div>

        {confirmationSent ? (
          <div className="auth-gate__confirmation" role="status">
            <p className="auth-gate__confirmation-title">{t('authConfirmationTitle')}</p>
            <p className="auth-gate__confirmation-copy">
              {t('authConfirmationDescription')} <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form className="auth-gate__form" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <TextField
                id="auth-username"
                label={t('authUsernameLabel')}
                type="text"
                required
                maxLength={40}
                autoComplete="nickname"
                placeholder={t('authUsernamePlaceholder')}
                value={username}
                onChange={(event) => setUsername(event.target.value)}
              />
            )}
            <TextField
              id="auth-email"
              label={t('authEmailLabel')}
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder={t('authUpgradeEmailPlaceholder')}
              dir="ltr"
            />
            <TextField
              id="auth-password"
              label={t('authPasswordLabel')}
              type="password"
              required
              minLength={mode === 'signup' ? 8 : undefined}
              autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
              placeholder={t('authPasswordPlaceholder')}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              dir="ltr"
            />
            {error && <p className="auth-gate__error" role="alert">{error}</p>}
            <Button
              type="submit"
              busy={busy}
              fullWidth
              className="auth-gate__submit"
            >
              {busy
                ? t(mode === 'signup' ? 'authCreatingAccount' : 'signInSubmitting')
                : t(mode === 'signup' ? 'authCreateAccount' : 'signInSubmit')}
            </Button>
          </form>
        )}

        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          variant="secondary"
          fullWidth
          className="auth-gate__google"
        >
          <AppIcon name="google" size={18} />
          {t('googleSignIn')}
        </Button>

        <Button
          type="button"
          onClick={() => selectMode(mode === 'signup' ? 'signin' : 'signup')}
          variant="ghost"
          fullWidth
          className="auth-gate__mode-link"
        >
          {t(mode === 'signup' ? 'authHaveAccount' : 'authNeedAccount')}
        </Button>
        <p className="auth-gate__notice" lang={lang}>
          {t('authDataNotice')}
        </p>
      </Card>
    </main>
  );
}