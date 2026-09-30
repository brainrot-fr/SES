import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useAccountProfile } from "./AccountProfileProvider";
import { useLang } from "../../context/LanguageContext";
import EntryBrand from "../../components/layout/EntryBrand";
import "./accountOnboarding.css";

const COUNTRY_CODES = `
AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY
MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM
PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ
TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW
`;

const ISO_COUNTRY_CODES = `
AW AF AO AI AX AL AD AE AR AM AS AQ TF AG AU AT AZ BI BE BJ BQ BF BD BG BH BS BA BL BY BZ BM BO BR BB BN BT BV BW
CF CA CC CH CL CN CI CM CD CG CK CO KM CV CR CU CW CX KY CY CZ DE DJ DM DK DO EC EG ER EH ES EE ET FI FJ FK FM FR
FO GA GE GG GH GI GN GP GM GW GQ GR GD GL GT GF GU GY HK HM HN HR HT HU ID IM IN IO IE IR IQ IS IL IT JM JE JO JP
KZ KE KH KI KM KN KP KR KW KG LA LB LS LR LY LI LK LT LU LV MO MF MA MC MD MG MV MH MK ML MT MM ME MN MP MZ MR
MS MQ MU YT NA NC NE NF NG NI NU NL NO NP NR NZ OM PK PA PN PE PH PW PG PR PT PY PS PF QA RE RO RU RW SA SD SN
SG GS SH SJ SB SL SV SM SO PM RS SS ST SR SK SI SZ SX SC SY TC TD TG TH TJ TM TL TO TT TV TW TZ UG UA UM UY
US UZ VA VC VE VG VI VN VU WF WS YE ZA ZM ZW DZ GB LC MW MX MY PL SE TK TN TR
`;

function getCountryOptions(locale) {
  const names =
    typeof Intl.DisplayNames === "function"
      ? new Intl.DisplayNames([locale], { type: "region" })
      : null;
  return [
    ...new Set([
      ...COUNTRY_CODES.trim().split(/\s+/),
      ...ISO_COUNTRY_CODES.trim().split(/\s+/),
    ]),
  ]
    .map((code) => ({ code, name: names?.of(code) || code }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export default function AccountOnboarding() {
  const { t, lang } = useLang();
  const {
    profile,
    saveGender,
    confirmFollower,
    completeOnboarding,
  } = useAccountProfile();
  const reduceMotion = useReducedMotion();
  const countryOptions = useMemo(
    () => getCountryOptions(lang === "ur" ? "ur" : "en"),
    [lang],
  );
  const [step, setStep] = useState(() => {
    if (
      profile?.onboarding_gender !== "girl" &&
      profile?.onboarding_gender !== "boy"
    ) {
      return "gender";
    }
    return profile?.follower_confirmed ? "country" : "confirmation";
  });
  const [gender, setGender] = useState(profile?.onboarding_gender || "");
  const [confirmed, setConfirmed] = useState(false);
  const [countryCode, setCountryCode] = useState(
    profile?.country_code || "",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const headingRef = useRef(null);

  const stepNumber = step === "gender" ? 1 : step === "confirmation" ? 2 : 3;
  const titleId = `account-onboarding-title-${step}`;
  const countryHelper = t("accountCountryDateRule");

  useEffect(() => {
    const focusTimer = window.setTimeout(
      () => headingRef.current?.focus(),
      reduceMotion ? 0 : 220,
    );
    return () => window.clearTimeout(focusTimer);
  }, [reduceMotion, step]);

  const runStep = async (operation, nextStep) => {
    setBusy(true);
    setError("");
    try {
      await operation();
      setStep(nextStep);
    } catch (saveError) {
      setError(
        saveError.message ||
          t("accountSaveStepError"),
      );
    } finally {
      setBusy(false);
    }
  };

  const finish = async (code) => {
    setBusy(true);
    setError("");
    try {
      await completeOnboarding(code);
    } catch (saveError) {
      setError(
        saveError.message ||
          t("accountSaveProfileError"),
      );
    } finally {
      setBusy(false);
    }
  };

  const direction = reduceMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 1 } }
    : {
        initial: { opacity: 0, x: 18 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -14 },
      };

  return (
    <main className="account-onboarding">
      <div
        className="account-onboarding__progress"
        role="progressbar"
        aria-label={t("accountProfileProgress").replace("{step}", String(stepNumber))}
        aria-valuemin="1"
        aria-valuemax="3"
        aria-valuenow={stepNumber}
      >
        <span style={{ width: `${(stepNumber / 3) * 100}%` }} />
      </div>
      <EntryBrand />
      <section
        className="account-onboarding__form"
        aria-labelledby={titleId}
      >
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={step}
            {...direction}
            transition={{ duration: reduceMotion ? 0 : 0.2, ease: "easeOut" }}
          >
            {step === "gender" ? (
              <div className="account-onboarding__step">
                <h1
                  className="account-onboarding__title"
                  id={titleId}
                  ref={headingRef}
                  tabIndex="-1"
                >
                  {t("accountGenderTitle")}
                </h1>
                <p className="account-onboarding__copy">
                  {t("accountGenderCopy")}
                </p>
                <fieldset className="account-onboarding__fieldset">
                  <legend className="account-onboarding__label">
                    {t("accountGenderLabel")}
                  </legend>
                  <div className="account-onboarding__choices">
                    {[
                      { value: "girl", label: t("accountGirl") },
                      { value: "boy", label: t("accountBoy") },
                    ].map((choice) => (
                      <label
                        className={`account-onboarding__choice${gender === choice.value ? " account-onboarding__choice--selected" : ""}`}
                        key={choice.value}
                      >
                        <input
                          type="radio"
                          name="onboarding-gender"
                          value={choice.value}
                          checked={gender === choice.value}
                          onChange={() => setGender(choice.value)}
                          disabled={busy}
                        />
                        <span>{choice.label}</span>
                      </label>
                    ))}
                  </div>
                  <span className="account-onboarding__helper">
                    {t("accountGenderHelper")}
                  </span>
                </fieldset>
                {error && <p className="account-onboarding__error" role="alert">{error}</p>}
                <button
                  className="account-onboarding__button"
                  type="button"
                  disabled={!gender || busy}
                  onClick={() =>
                    runStep(() => saveGender(gender), "confirmation")
                  }
                >
                  {busy ? t("accountSaving") : t("accountContinue")}
                </button>
              </div>
            ) : step === "confirmation" ? (
              <div className="account-onboarding__step">
                <h1
                  className="account-onboarding__title"
                  id={titleId}
                  ref={headingRef}
                  tabIndex="-1"
                >
                  {t("accountConfirmationTitle")}
                </h1>
                <p className="account-onboarding__copy">
                  {t("accountConfirmationCopy")}
                </p>
                <label className="account-onboarding__confirmation">
                  <input
                    type="checkbox"
                    checked={confirmed || profile?.follower_confirmed === true}
                    onChange={(event) => setConfirmed(event.target.checked)}
                    disabled={busy}
                  />
                  <span>
                    {t("accountFollowerStatement")}
                  </span>
                </label>
                <p className="account-onboarding__helper">
                  {t("accountConfirmationRequired")}
                </p>
                {error && <p className="account-onboarding__error" role="alert">{error}</p>}
                <div className="account-onboarding__actions">
                  <button
                    className="account-onboarding__button account-onboarding__button--secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => setStep("gender")}
                  >
                    {t("accountBack")}
                  </button>
                  <button
                    className="account-onboarding__button"
                    type="button"
                    disabled={!confirmed || busy}
                    onClick={() =>
                      runStep(confirmFollower, "country")
                    }
                  >
                    {busy ? t("accountSaving") : t("accountConfirmContinue")}
                  </button>
                </div>
              </div>
            ) : (
              <div className="account-onboarding__step">
                <h1
                  className="account-onboarding__title"
                  id={titleId}
                  ref={headingRef}
                  tabIndex="-1"
                >
                  {t("accountCountryTitle")}
                </h1>
                <p className="account-onboarding__copy">
                  {t("accountCountryCopy")}
                </p>
                <label
                  className="account-onboarding__label"
                  htmlFor="account-country"
                >
                  {t("accountCountryLabel")}
                </label>
                <select
                  className="account-onboarding__select"
                  id="account-country"
                  value={countryCode}
                  onChange={(event) => setCountryCode(event.target.value)}
                  disabled={busy}
                  aria-describedby="account-country-help"
                >
                  <option value="">{t("accountCountryPlaceholder")}</option>
                  {countryOptions.map(({ code, name }) => (
                    <option value={code} key={code}>
                      {name}
                    </option>
                  ))}
                </select>
                <p
                  className="account-onboarding__helper"
                  id="account-country-help"
                >
                  {countryHelper}
                </p>
                {error && <p className="account-onboarding__error" role="alert">{error}</p>}
                <div className="account-onboarding__actions">
                  <button
                    className="account-onboarding__button account-onboarding__button--secondary"
                    type="button"
                    disabled={busy}
                    onClick={() => setStep("confirmation")}
                  >
                    {t("accountBack")}
                  </button>
                  {countryCode ? (
                    <button
                      className="account-onboarding__button"
                      type="button"
                      disabled={busy}
                      onClick={() => finish(countryCode)}
                    >
                      {busy ? t("accountSaving") : t("accountSaveFinish")}
                    </button>
                  ) : (
                    <button
                      className="account-onboarding__button"
                      type="button"
                      disabled={busy}
                      onClick={() => finish(null)}
                    >
                      {busy ? t("accountSaving") : t("accountSkipCountry")}
                    </button>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}
