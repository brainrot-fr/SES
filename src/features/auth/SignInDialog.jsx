/**
 * SignInDialog.jsx
 * Lets someone sign into an already-upgraded account on a new device,
 * using the email+password set via AuthUpgradeDialog on the original
 * device. This replaces the current device's anonymous session — it's a
 * device-becomes-this-identity action, not a merge, so the copy here is
 * upfront about that trade-off.
 */

import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';
import Modal from '../../components/ui/Modal';
import TextField from '../../components/ui/TextField';
import Button from '../../components/ui/Button';

export default function SignInDialog({ open, onClose }) {
  const { t } = useLang();
  const { signIn, signInGoogle } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setEmail('');
    setPassword('');
    setError(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      handleClose();
    } catch (err) {
      setError(err.message || t('signInError'));
    } finally {
      setBusy(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInGoogle();
      handleClose();
    } catch (err) {
      setError(err.message || t('authGenericError'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      labelledBy="sign-in-dialog-title"
      disableClose={busy}
      className="ui-auth-dialog"
    >
      <h2 className="ui-dialog-title" id="sign-in-dialog-title">
        {t('signInTitle')}
      </h2>
      <p className="ui-dialog-copy">
        {t('signInDesc')}
      </p>

      <form className="ui-dialog-form" onSubmit={handleSubmit}>
        <TextField
          id="sign-in-email"
          label={t('authEmailLabel')}
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('authUpgradeEmailPlaceholder')}
        />
        <TextField
          id="sign-in-password"
          label={t('authPasswordLabel')}
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('signInPasswordPlaceholder')}
        />
        {error && <p className="ui-dialog-error" role="alert">{error}</p>}
        <div className="ui-dialog-actions">
          <Button type="button" variant="secondary" disabled={busy} onClick={handleClose}>
            {t('authUpgradeSkip')}
          </Button>
          <Button type="submit" busy={busy}>
            {busy ? t('signInSubmitting') : t('signInSubmit')}
          </Button>
        </div>
      </form>
      <Button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={busy}
        variant="secondary"
        fullWidth
        className="ui-dialog-google"
      >
        {t('googleSignIn')}
      </Button>
    </Modal>
  );
}