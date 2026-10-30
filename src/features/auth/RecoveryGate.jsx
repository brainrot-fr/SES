import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { useLang } from "@/context/LanguageContext";
import { Button } from "@/components/shadcn/button";
import { Field, FieldError, FieldLabel } from "@/components/shadcn/field";
import { Input } from "@/components/shadcn/input";
import EntryBrand from "@/components/layout/EntryBrand";
import { friendlyError } from "@/lib/supabaseClient.js";

export default function RecoveryGate() {
  const { t } = useLang();
  const { saveRecoveredPassword, finishPasswordRecovery } = useAuth();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await saveRecoveredPassword(password);
      finishPasswordRecovery();
    } catch (saveError) {
      setError(friendlyError(saveError, t, "authGenericError"));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="grid min-h-dvh bg-background md:grid-cols-2">
      <EntryBrand />
      <section className="mx-auto grid w-full max-w-md content-center gap-4 px-4 py-8 md:px-8" aria-labelledby="password-recovery-title">
        <h1 className="text-xl font-semibold text-foreground" id="password-recovery-title">{t("authRecoveryTitle")}</h1>
        <p className="text-sm leading-relaxed text-muted-foreground">{t("authRecoveryDescription")}</p>
        <form className="grid gap-3" onSubmit={handleSubmit}>
          <Field>
            <FieldLabel htmlFor="recovery-password">{t("authPasswordLabel")}</FieldLabel>
            <Input
              id="recovery-password"
              type="password"
              minLength={8}
              required
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              dir="ltr"
            />
          </Field>
          <FieldError>{error}</FieldError>
          <Button type="submit" busy={busy} className="w-full">
            {busy ? t("authRecoverySaving") : t("authRecoverySubmit")}
          </Button>
        </form>
      </section>
    </main>
  );
}
