/**
 * AuthUpgradeDialog.jsx
 * The optional "back up my data" flow — links a real email to the
 * anonymous identity so it survives a reinstall. Skippable, per
 * feat-userObject.md; closing this dialog with no email entered just
 * leaves the identity anonymous, same as before.
 */

import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";
import Modal from "../../components/ui/Modal";
import TextField from "../../components/ui/TextField";
import Button from "../../components/ui/Button";

export default function AuthUpgradeDialog({ open, onClose }) {
  const { t } = useLang();
  const { startEmailUpgrade, upgradeConfirmed, clearUpgradeConfirmed } =
    useAuth();

  const [step, setStep] = useState("email"); // 'email' | 'waiting' | 'done'
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  /* The deep link listener in AuthContext flips upgradeConfirmed once the
   * user taps the email link — jump straight to the success state. */
  useEffect(() => {
    if (upgradeConfirmed && step === "waiting") {
      setStep("done");
      clearUpgradeConfirmed();
    }
  }, [upgradeConfirmed, step, clearUpgradeConfirmed]);

  const reset = () => {
    setStep("email");
    setEmail("");
    setPassword("");
    setError(null);
    setBusy(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSendCode = async (e) => {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError(t("authUpgradePasswordTooShort"));
      return;
    }
    setBusy(true);
    try {
      await startEmailUpgrade(email.trim(), password);
      setStep("waiting");
    } catch (err) {
      setError(err.message || t("authUpgradeError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      labelledBy="auth-upgrade-dialog-title"
      disableClose={busy}
      className="ui-auth-dialog"
    >
      <h2 className="ui-dialog-title" id="auth-upgrade-dialog-title">
        {t("authUpgradeTitle")}
      </h2>

      {step === "email" && (
        <form className="ui-dialog-form" onSubmit={handleSendCode}>
          <p className="ui-dialog-copy">
            {t("authUpgradeDesc")}
          </p>
          <TextField
            id="auth-upgrade-email"
            label={t("authEmailLabel")}
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("authUpgradeEmailPlaceholder")}
          />
          <TextField
            id="auth-upgrade-password"
            label={t("authPasswordLabel")}
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("authUpgradePasswordPlaceholder")}
          />
          <p className="ui-dialog-hint">
            {t("authUpgradePasswordHint")}
          </p>
          {error && <p className="ui-dialog-error" role="alert">{error}</p>}
          <div className="ui-dialog-actions">
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={handleClose}
            >
              {t("authUpgradeSkip")}
            </Button>
            <Button type="submit" busy={busy}>
              {busy ? t("authUpgradeSending") : t("authUpgradeSendCode")}
            </Button>
          </div>
        </form>
      )}

      {step === "waiting" && (
        <div className="ui-dialog-form">
          <p className="ui-dialog-copy">
            {t("authUpgradeWaitingDesc")} <strong>{email}</strong>
          </p>
          <p className="ui-dialog-hint">
            {t("authUpgradeWaitingHint")}
          </p>
          <Button type="button" variant="secondary" onClick={handleClose}>
            {t("authUpgradeCloseWhileWaiting")}
          </Button>
        </div>
      )}

      {step === "done" && (
        <div className="ui-dialog-form">
          <p className="ui-dialog-copy">
            {t("authUpgradeSuccess")}
          </p>
          <Button type="button" onClick={handleClose}>
            {t("authUpgradeClose")}
          </Button>
        </div>
      )}
    </Modal>
  );
}
