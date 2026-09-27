/**
 * SignInDialog.jsx
 * Lets someone sign into an already-upgraded account on a new device,
 * using the email+password set via AuthUpgradeDialog on the original
 * device. This replaces the current device's anonymous session — it's a
 * device-becomes-this-identity action, not a merge, so the copy here is
 * upfront about that trade-off.
 */

import { useState } from 'react';
import { Dialog } from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import { useLang } from '../../context/LanguageContext';

export default function SignInDialog({ open, onClose }) {
  const { t } = useLang();
  const { signIn } = useAuth();

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

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      sx={{
        '& .MuiDialog-container': { alignItems: { xs: 'flex-end', sm: 'center' } },
        '& .MuiBackdrop-root': { backgroundColor: 'rgba(0, 0, 0, 0.52)' },
        '& .MuiDialog-paper': {
          bgcolor: 'var(--panel)',
          color: 'var(--text-small)',
          borderRadius: { xs: '20px 20px 0 0', sm: '16px' },
          m: { xs: 0, sm: 4 },
          width: '100%',
          p: 3,
        },
      }}
    >
      <h2 style={{ margin: '0 0 0.75rem', color: 'var(--text-large)', fontSize: '1.1rem' }}>
        {t('signInTitle')}
      </h2>
      <p style={{ color: 'var(--text-small)', fontSize: '0.9rem', marginTop: 0 }}>
        {t('signInDesc')}
      </p>

      <form onSubmit={handleSubmit}>
        <input
          type="email"
          required
          autoFocus
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder={t('authUpgradeEmailPlaceholder')}
          style={inputStyle}
        />
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={t('signInPasswordPlaceholder')}
          style={{ ...inputStyle, marginTop: '0.5rem' }}
        />
        {error && <p style={errorStyle}>{error}</p>}
        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
          <button type="button" onClick={handleClose} style={secondaryBtnStyle}>
            {t('authUpgradeSkip')}
          </button>
          <button type="submit" disabled={busy} style={primaryBtnStyle}>
            {busy ? t('signInSubmitting') : t('signInSubmit')}
          </button>
        </div>
      </form>
    </Dialog>
  );
}

const inputStyle = {
  width: '100%',
  padding: '0.7rem 0.9rem',
  borderRadius: '10px',
  border: '1px solid var(--border)',
  background: 'var(--panel-2)',
  color: 'var(--text-small)',
  fontSize: '0.95rem',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const errorStyle = {
  color: 'var(--danger)',
  fontSize: '0.82rem',
  marginTop: '0.5rem',
  marginBottom: 0,
};

const primaryBtnStyle = {
  flex: 1,
  padding: '0.7rem',
  background: 'var(--primary)',
  color: 'var(--panel)',
  border: 'none',
  borderRadius: '10px',
  fontWeight: 700,
  fontSize: '0.9rem',
  cursor: 'pointer',
};

const secondaryBtnStyle = {
  flex: 1,
  padding: '0.7rem',
  background: 'var(--panel-2)',
  color: 'var(--text-small)',
  border: '1px solid var(--border)',
  borderRadius: '10px',
  fontWeight: 600,
  fontSize: '0.9rem',
  cursor: 'pointer',
};