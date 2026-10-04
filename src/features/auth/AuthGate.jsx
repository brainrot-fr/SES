import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import { Button } from '../../components/shadcn/button';
import { Field } from '../../components/shadcn/field';
import { Input } from '../../components/shadcn/input';
import { Label } from '../../components/shadcn/label';
import { Alert, AlertDescription } from '../../components/shadcn/alert';
import { Separator } from '../../components/shadcn/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/shadcn/tabs';
import AppIcon from '../../components/icons/AppIcon';
import EntryBrand from '../../components/layout/EntryBrand';
import { friendlyError } from '../../lib/supabaseClient.js';

export default function AuthGate({ socialWriteGate = false }) {
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
      setError(friendlyError(authError, t, 'authGenericError'));
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
      setError(friendlyError(authError, t, 'authGenericError'));
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
    <main className="grid min-h-dvh bg-background md:grid-cols-2">
      <EntryBrand />
      <section className="mx-auto grid w-full max-w-md content-center gap-4 px-4 py-8 md:px-8" aria-labelledby="auth-gate-title">
        <h1 className="text-xl font-semibold text-foreground" id="auth-gate-title">{t('authRequiredTitle')}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t('authRequiredDescription')}</p>
        {socialWriteGate && (
          <Alert><AlertDescription>{t("authSocialWriteGate")}</AlertDescription></Alert>
        )}
        <Tabs value={mode} onValueChange={(value) => selectMode(value)} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="signup">{t('authCreateAccount')}</TabsTrigger>
            <TabsTrigger value="signin">{t('signInTitle')}</TabsTrigger>
          </TabsList>
          <TabsContent value={mode} className="pt-1">
        {confirmationSent ? (
          <div className="grid gap-2 py-3" role="status">
            <p className="font-semibold">{t('authConfirmationTitle')}</p>
            <p className="text-sm leading-relaxed text-muted-foreground">
              {t('authConfirmationDescription')} <strong>{email}</strong>
            </p>
          </div>
        ) : (
          <form className="grid gap-3 pt-3" onSubmit={handleSubmit}>
            {mode === 'signup' && (
              <Field>
                <Label htmlFor="auth-username" className="text-foreground">{t('authUsernameLabel')}</Label>
                <Input
                  id="auth-username"
                  type="text"
                  required
                  maxLength={40}
                  autoComplete="nickname"
                  placeholder={t('authUsernamePlaceholder')}
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                />
              </Field>
            )}
            <Field>
              <Label htmlFor="auth-email" className="text-foreground">{t('authEmailLabel')}</Label>
              <Input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder={t('authUpgradeEmailPlaceholder')}
                dir="ltr"
              />
            </Field>
            <Field>
              <Label htmlFor="auth-password" className="text-foreground">{t('authPasswordLabel')}</Label>
              <Input
                id="auth-password"
                type="password"
                required
                minLength={mode === 'signup' ? 8 : undefined}
                autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                placeholder={t('authPasswordPlaceholder')}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                dir="ltr"
              />
            </Field>
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <Button
              type="submit"
              busy={busy}
              className="mt-2 w-full"
            >
              {busy
                ? t(mode === 'signup' ? 'authCreatingAccount' : 'signInSubmitting')
                : t(mode === 'signup' ? 'authCreateAccount' : 'signInSubmit')}
            </Button>
          </form>
        )}
          </TabsContent>
        </Tabs>
        <div className="flex items-center gap-3" aria-hidden="true"><Separator className="flex-1" /><span className="text-xs text-muted-foreground">{t('authOr')}</span><Separator className="flex-1" /></div>
        <Button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          variant="outline"
          className="w-full"
        >
          <AppIcon name="google" size={18} />
          {t('googleSignIn')}
        </Button>

        <Button
          type="button"
          onClick={() => selectMode(mode === 'signup' ? 'signin' : 'signup')}
          variant="ghost"
          className="w-full"
        >
          {t(mode === 'signup' ? 'authHaveAccount' : 'authNeedAccount')}
        </Button>
        <p className="text-start text-xs text-muted-foreground" lang={lang}>
          {t('authDataNotice')}
        </p>
      </section>
    </main>
  );
}