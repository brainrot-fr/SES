/**
 * AuthUpgradeDialog.jsx
 * The optional "back up my data" flow — links a real email to the
 * anonymous identity so it survives a reinstall. Skippable, per
 * feat-userObject.md; closing this dialog with no email entered just
 * leaves the identity anonymous, same as before.
 */

import { useState, useEffect } from "react";
import { Dialog } from "@mui/material";
import { useAuth } from "../../context/AuthContext";
import { useLang } from "../../context/LanguageContext";

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
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      sx={{
        "& .MuiDialog-container": {
          alignItems: { xs: "flex-end", sm: "center" },
        },
        "& .MuiBackdrop-root": { backgroundColor: "rgba(0, 0, 0, 0.52)" },
        "& .MuiDialog-paper": {
          bgcolor: "var(--panel)",
          color: "var(--text-small)",
          borderRadius: { xs: "20px 20px 0 0", sm: "16px" },
          m: { xs: 0, sm: 4 },
          width: "100%",
          p: 3,
        },
      }}
    >
      <h2
        style={{
          margin: "0 0 0.75rem",
          color: "var(--text-large)",
          fontSize: "1.1rem",
        }}
      >
        {t("authUpgradeTitle")}
      </h2>

      {step === "email" && (
        <form onSubmit={handleSendCode}>
          <p
            style={{
              color: "var(--text-small)",
              fontSize: "0.9rem",
              marginTop: 0,
            }}
          >
            {t("authUpgradeDesc")}
          </p>
          <input
            type="email"
            required
            autoFocus
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("authUpgradeEmailPlaceholder")}
            style={inputStyle}
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={t("authUpgradePasswordPlaceholder")}
            style={{ ...inputStyle, marginTop: "0.5rem" }}
          />
          <p
            style={{
              color: "var(--muted)",
              fontSize: "0.78rem",
              marginTop: "0.35rem",
            }}
          >
            {t("authUpgradePasswordHint")}
          </p>
          {error && <p style={errorStyle}>{error}</p>}
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem" }}>
            <button
              type="button"
              onClick={handleClose}
              style={secondaryBtnStyle}
            >
              {t("authUpgradeSkip")}
            </button>
            <button type="submit" disabled={busy} style={primaryBtnStyle}>
              {busy ? t("authUpgradeSending") : t("authUpgradeSendCode")}
            </button>
          </div>
        </form>
      )}

      {step === "waiting" && (
        <div>
          <p style={{ color: "var(--text-small)", fontSize: "0.9rem" }}>
            {t("authUpgradeWaitingDesc")} <strong>{email}</strong>
          </p>
          <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
            {t("authUpgradeWaitingHint")}
          </p>
          <button onClick={handleClose} style={secondaryBtnStyle}>
            {t("authUpgradeCloseWhileWaiting")}
          </button>
        </div>
      )}

      {step === "done" && (
        <div>
          <p style={{ color: "var(--text-small)", fontSize: "0.9rem" }}>
            {t("authUpgradeSuccess")}
          </p>
          <button onClick={handleClose} style={primaryBtnStyle}>
            {t("authUpgradeClose")}
          </button>
        </div>
      )}
    </Dialog>
  );
}

const inputStyle = {
  width: "100%",
  padding: "0.7rem 0.9rem",
  borderRadius: "10px",
  border: "1px solid var(--border)",
  background: "var(--panel-2)",
  color: "var(--text-small)",
  fontSize: "0.95rem",
  fontFamily: "inherit",
  boxSizing: "border-box",
};

const errorStyle = {
  color: "var(--danger)",
  fontSize: "0.82rem",
  marginTop: "0.5rem",
  marginBottom: 0,
};

const primaryBtnStyle = {
  flex: 1,
  padding: "0.7rem",
  background: "var(--primary)",
  color: "var(--panel)",
  border: "none",
  borderRadius: "10px",
  fontWeight: 700,
  fontSize: "0.9rem",
  cursor: "pointer",
};

const secondaryBtnStyle = {
  flex: 1,
  padding: "0.7rem",
  background: "var(--panel-2)",
  color: "var(--text-small)",
  border: "1px solid var(--border)",
  borderRadius: "10px",
  fontWeight: 600,
  fontSize: "0.9rem",
  cursor: "pointer",
};
