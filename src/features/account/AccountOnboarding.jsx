import { useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from "framer-motion";
import { useAccountProfile } from "./AccountProfileProvider";
import { useLang } from "../../context/LanguageContext";
import EntryBrand from "../../components/layout/EntryBrand";
import { Button } from "../../components/shadcn/button";
import { Checkbox } from "../../components/shadcn/checkbox";
import { Label } from "../../components/shadcn/label";
import { Popover, PopoverContent, PopoverTrigger } from "../../components/shadcn/popover";
import { Progress } from "../../components/shadcn/progress";
import { RadioGroup, RadioGroupItem } from "../../components/shadcn/radio-group";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "../../components/shadcn/command";
import { Check, ChevronsUpDown } from "lucide-react";
import { friendlyError } from "../../lib/supabaseClient.js";
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
  const [confirmed, setConfirmed] = useState(profile?.follower_confirmed === true);
  const [countryCode, setCountryCode] = useState(
    profile?.country_code || "",
  );
  const [countryOpen, setCountryOpen] = useState(false);
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
      setError(friendlyError(saveError, t, "accountSaveStepError"));
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
      setError(friendlyError(saveError, t, "accountSaveProfileError"));
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
      <Progress className="fixed inset-x-0 top-0 z-[100] h-1 rounded-none" value={stepNumber / 3 * 100} aria-label={t("accountProfileProgress").replace("{step}", String(stepNumber))} />
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
                  <span className="account-onboarding__helper">
                    {t("accountGenderHelper")}
                  </span>
                </fieldset>
                {error && <p className="account-onboarding__error" role="alert">{error}</p>}
                <Button className="account-onboarding__button" type="button" disabled={!gender || busy} onClick={() => runStep(() => saveGender(gender), "confirmation")}>
                  {busy ? t("accountSaving") : t("accountContinue")}
                </Button>
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
                <div className="account-onboarding__confirmation flex min-h-11 items-start gap-3">
                  <Checkbox id="account-follower-confirmation" checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} disabled={busy} />
                  <Label htmlFor="account-follower-confirmation" className="font-normal">{t("accountFollowerStatement")}</Label>
                </div>
                <p className="account-onboarding__helper">
                  {t("accountConfirmationRequired")}
                </p>
                {error && <p className="account-onboarding__error" role="alert">{error}</p>}
                <div className="account-onboarding__actions">
                  <Button className="account-onboarding__button account-onboarding__button--secondary" type="button" variant="outline" disabled={busy} onClick={() => setStep("gender")}>
                    {t("accountBack")}
                  </Button>
                  <Button className="account-onboarding__button" type="button" disabled={!confirmed || busy} onClick={() => runStep(confirmFollower, "country")}>
                    {busy ? t("accountSaving") : t("accountConfirmContinue")}
                  </Button>
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
                <Label className="account-onboarding__label" id="account-country-label">{t("accountCountryLabel")}</Label>
                <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                  <PopoverTrigger asChild>
                    <Button type="button" variant="outline" className="min-h-12 w-full justify-between" aria-labelledby="account-country-label" aria-describedby="account-country-help" disabled={busy}>
                      {countryOptions.find(({ code }) => code === countryCode)?.name || t("accountCountryPlaceholder")}
                      <ChevronsUpDown className="ms-2 size-4 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[min(250px,calc(100vw-2rem))] p-0" align="start">
                    <Command>
                      <CommandInput placeholder={t("accountCountrySearch")} />
                      <CommandList>
                        <CommandEmpty>{t("accountCountryNoResults")}</CommandEmpty>
                        <CommandGroup>
                          {countryOptions.map(({ code, name }) => (
                            <CommandItem key={code} value={name} onSelect={() => {
                              setCountryCode(code);
                              setCountryOpen(false);
                            }}>
                              <Check className={countryCode === code ? "opacity-100" : "opacity-0"} />
                              {name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
                <p
                  className="account-onboarding__helper"
                  id="account-country-help"
                >
                  {countryHelper}
                </p>
                {error && <p className="account-onboarding__error" role="alert">{error}</p>}
                <div className="account-onboarding__actions">
                  <Button className="account-onboarding__button account-onboarding__button--secondary" type="button" variant="outline" disabled={busy} onClick={() => setStep("confirmation")}>
                    {t("accountBack")}
                  </Button>
                  {countryCode ? (
                    <Button className="account-onboarding__button" type="button" disabled={busy} onClick={() => finish(countryCode)}>
                      {busy ? t("accountSaving") : t("accountSaveFinish")}
                    </Button>
                  ) : (
                    <Button className="account-onboarding__button" type="button" disabled={busy} onClick={() => finish(null)}>
                      {busy ? t("accountSaving") : t("accountSkipCountry")}
                    </Button>
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
