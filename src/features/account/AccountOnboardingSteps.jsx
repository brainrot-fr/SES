// Template: Entry — focused onboarding step composition.
import { Button } from "../../components/shadcn/button";
import { Checkbox } from "../../components/shadcn/checkbox";
import { Label } from "../../components/shadcn/label";
import { RadioGroup, RadioGroupItem } from "../../components/shadcn/radio-group";
import AccountCountryPicker from "./AccountCountryPicker";

function StepHeading({ id, headingRef, children }) {
  return (
    <h1
      className="account-onboarding__title"
      id={id}
      ref={headingRef}
      tabIndex="-1"
    >
      {children}
    </h1>
  );
}

export function GenderStep({ t, titleId, headingRef, gender, setGender, busy, error, onContinue }) {
  return (
    <div className="account-onboarding__step">
      <StepHeading id={titleId} headingRef={headingRef}>{t("accountGenderTitle")}</StepHeading>
      <p className="account-onboarding__copy">{t("accountGenderCopy")}</p>
      <fieldset className="account-onboarding__fieldset">
        <legend className="account-onboarding__label">{t("accountGenderLabel")}</legend>
        <RadioGroup value={gender} onValueChange={setGender} disabled={busy} className="account-onboarding__choices">
          {[
            { value: "girl", label: t("accountGirl") },
            { value: "boy", label: t("accountBoy") },
          ].map((choice) => (
            <Label className={`account-onboarding__choice${gender === choice.value ? " account-onboarding__choice--selected" : ""}`} htmlFor={`account-gender-${choice.value}`} key={choice.value}>
              <RadioGroupItem id={`account-gender-${choice.value}`} value={choice.value} />
              <span>{choice.label}</span>
            </Label>
          ))}
        </RadioGroup>
        <span className="account-onboarding__helper">{t("accountGenderHelper")}</span>
      </fieldset>
      {error && <p className="account-onboarding__error" role="alert">{error}</p>}
      <Button className="account-onboarding__button" type="button" disabled={!gender || busy} onClick={onContinue}>
        {busy ? t("accountSaving") : t("accountContinue")}
      </Button>
    </div>
  );
}

export function ConfirmationStep({ t, titleId, headingRef, confirmed, setConfirmed, busy, error, onBack, onContinue }) {
  return (
    <div className="account-onboarding__step">
      <StepHeading id={titleId} headingRef={headingRef}>{t("accountConfirmationTitle")}</StepHeading>
      <p className="account-onboarding__copy">{t("accountConfirmationCopy")}</p>
      <div className="account-onboarding__confirmation flex min-h-11 items-start gap-3">
        <Checkbox id="account-follower-confirmation" checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} disabled={busy} />
        <Label htmlFor="account-follower-confirmation" className="font-normal">{t("accountFollowerStatement")}</Label>
      </div>
      <p className="account-onboarding__helper">{t("accountConfirmationRequired")}</p>
      {error && <p className="account-onboarding__error" role="alert">{error}</p>}
      <div className="account-onboarding__actions">
        <Button className="account-onboarding__button account-onboarding__button--secondary" type="button" variant="outline" disabled={busy} onClick={onBack}>
          {t("accountBack")}
        </Button>
        <Button className="account-onboarding__button" type="button" disabled={!confirmed || busy} onClick={onContinue}>
          {busy ? t("accountSaving") : t("accountConfirmContinue")}
        </Button>
      </div>
    </div>
  );
}

export function CountryStep({
  t,
  locale,
  titleId,
  headingRef,
  countryCode,
  countryOptions,
  setCountryCode,
  busy,
  error,
  countryHelper,
  onBack,
  onFinish,
}) {
  return (
    <div className="account-onboarding__step">
      <StepHeading id={titleId} headingRef={headingRef}>{t("accountCountryTitle")}</StepHeading>
      <p className="account-onboarding__copy">{t("accountCountryCopy")}</p>
      <AccountCountryPicker
        locale={locale}
        options={countryOptions}
        value={countryCode}
        onChange={setCountryCode}
        disabled={busy}
        label={t("accountCountryLabel")}
        placeholder={t("accountCountryPlaceholder")}
        searchPlaceholder={t("accountCountrySearch")}
        noResults={t("accountCountryNoResults")}
      />
      <p className="account-onboarding__helper" id="account-country-help">{countryHelper}</p>
      {error && <p className="account-onboarding__error" role="alert">{error}</p>}
      <div className="account-onboarding__actions">
        <Button className="account-onboarding__button account-onboarding__button--secondary" type="button" variant="outline" disabled={busy} onClick={onBack}>
          {t("accountBack")}
        </Button>
        <Button className="account-onboarding__button" type="button" disabled={busy} onClick={() => onFinish(countryCode || null)}>
          {busy
            ? t("accountSaving")
            : countryCode
              ? t("accountSaveFinish")
              : t("accountSkipCountry")}
        </Button>
      </div>
    </div>
  );
}
