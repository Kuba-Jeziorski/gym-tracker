import { useEffect, useMemo, useState } from "react";
import type { Locale } from "../i18n/translations";
import type { UserGender } from "../contexts/UserProfileContext";
import type { WeightUnit } from "../contexts/WeightUnitContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useAuth } from "../contexts/AuthContext";
import { lbToKg } from "../helpers/weightConversion";
import { cn } from "../lib/utils";
import { supabase } from "../services/supabaseClient";

type AuthTab = "signin" | "signup" | "reset";

const buttonActiveClass =
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors bg-brand-primary/15 text-brand-primary border border-brand-primary/30";
const buttonInactiveClass =
  "rounded-lg px-3 py-2 text-sm font-medium transition-colors border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft";

export function Auth() {
  const { t } = useLanguage();
  const { signIn, signUp } = useAuth();
  const [tab, setTab] = useState<AuthTab>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [signupLocale, setSignupLocale] = useState<Locale>("en");
  const [signupWeightUnit, setSignupWeightUnit] = useState<WeightUnit>("kg");
  const [signupName, setSignupName] = useState("");
  const [signupWeight, setSignupWeight] = useState("");
  const [signupHeight, setSignupHeight] = useState("");
  const [signupGender, setSignupGender] = useState<UserGender | null>(null);

  const isRecoveryLink = useMemo(() => {
    if (typeof window === "undefined") return false;
    const h = window.location.hash ?? "";
    return h.includes("type=recovery") || h.includes("access_token=");
  }, []);

  useEffect(() => {
    if (!isRecoveryLink) return;
    setTab("reset");
    setError(null);
    setSuccess(null);
  }, [isRecoveryLink]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const trimmedEmail = email.trim();
    const trimmedPassword = password;
    if (tab !== "reset") {
      if (!trimmedEmail || !trimmedPassword) {
        setError(t("auth_error_missing"));
        return;
      }
    }
    if (tab === "signup") {
      if (trimmedPassword !== confirmPassword) {
        setError(t("auth_error_passwordMismatch"));
        return;
      }
    }
    if (tab === "reset") {
      if (!trimmedPassword || trimmedPassword !== confirmPassword) {
        setError(t("auth_error_passwordMismatch"));
        return;
      }
    }
    setSubmitting(true);
    try {
      if (tab === "signin") {
        const { error: err } = await signIn(trimmedEmail, trimmedPassword);
        if (err) setError(err.message);
      } else if (tab === "signup") {
        const weightNum = parseFloat(signupWeight.trim());
        const weightKg =
          !Number.isNaN(weightNum) && weightNum >= 0
            ? signupWeightUnit === "lb"
              ? lbToKg(weightNum)
              : weightNum
            : null;
        const heightNum = parseFloat(signupHeight.trim());
        const heightCm =
          !Number.isNaN(heightNum) && heightNum >= 0 ? heightNum : null;
        const { error: err } = await signUp(trimmedEmail, trimmedPassword, {
          name: signupName.trim(),
          weight_kg: weightKg != null ? String(weightKg) : "",
          height_cm: heightCm != null ? String(heightCm) : "",
          gender: signupGender ?? "",
          locale: signupLocale,
          weight_unit: signupWeightUnit,
        });
        if (err) {
          setError(err.message);
        } else {
          setSuccess(t("auth_success_signup"));
        }
      } else {
        const { error: err } = await supabase.auth.updateUser({
          password: trimmedPassword,
        });
        if (err) {
          setError(err.message);
        } else {
          setSuccess(t("auth_success_passwordReset"));
          setPassword("");
          setConfirmPassword("");
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", window.location.pathname);
          }
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  const inputClass =
    "w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2.5 text-brand-dark placeholder:text-brand-placeholder focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary";
  const labelClass = "block text-sm font-medium text-brand-text-muted mb-1.5";

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-brand-bg p-4">
      <div
        className={cn(
          "w-full flex flex-col items-center gap-8",
          tab === "signup" ? "max-w-xl" : "max-w-sm",
        )}
      >
        <div className="flex flex-col items-center gap-2">
          <img src="/favicon.svg" alt="" className="w-14 h-14" aria-hidden />
          <h1 className="text-2xl font-semibold text-brand-dark">
            {t("appTitle")}
          </h1>
          <p className="text-brand-text-muted text-sm">{t("auth_subtitle")}</p>
        </div>

        <div className="w-full rounded-xl border border-brand-border bg-brand-bg-soft p-6 shadow-sm">
          {tab !== "reset" && (
            <div className="flex gap-2 mb-6">
              <button
                type="button"
                onClick={() => {
                  setTab("signin");
                  setError(null);
                  setSuccess(null);
                }}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === "signin"
                    ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                    : "border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft",
                )}
              >
                {t("auth_signIn")}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTab("signup");
                  setError(null);
                  setSuccess(null);
                }}
                className={cn(
                  "flex-1 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  tab === "signup"
                    ? "bg-brand-primary/15 text-brand-primary border border-brand-primary/30"
                    : "border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft",
                )}
              >
                {t("auth_signUp")}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {tab !== "reset" && (
              <div>
                <label htmlFor="auth-email" className={labelClass}>
                  {t("auth_email")}
                </label>
                <input
                  id="auth-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={t("auth_emailPlaceholder")}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            )}
            <div>
              <label htmlFor="auth-password" className={labelClass}>
                {tab === "reset" ? t("auth_newPassword") : t("auth_password")}
              </label>
              <input
                id="auth-password"
                type="password"
                autoComplete={
                  tab === "signin" ? "current-password" : "new-password"
                }
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth_passwordPlaceholder")}
                className={inputClass}
                disabled={submitting}
              />
            </div>
            {(tab === "signup" || tab === "reset") && (
              <div>
                <label htmlFor="auth-confirm-password" className={labelClass}>
                  {t("auth_confirmPassword")}
                </label>
                <input
                  id="auth-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t("auth_passwordPlaceholder")}
                  className={inputClass}
                  disabled={submitting}
                />
              </div>
            )}

            {tab === "signup" && (
              <div className="flex flex-col gap-4 pt-2 border-t border-brand-border">
                <div className="flex gap-6 items-start">
                  <div className="min-w-0 flex-1">
                    <label className={labelClass}>
                      {t("settings_languageHeading")}
                    </label>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label={t("settings_languageHeading")}
                    >
                      {(["en", "pl"] as const).map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => setSignupLocale(loc)}
                          className={
                            signupLocale === loc
                              ? buttonActiveClass
                              : buttonInactiveClass
                          }
                        >
                          {t(loc === "en" ? "lang_en" : "lang_pl")}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className={labelClass}>
                      {t("settings_weightUnit")}
                    </label>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label={t("settings_weightUnit")}
                    >
                      <button
                        type="button"
                        onClick={() => setSignupWeightUnit("kg")}
                        className={
                          signupWeightUnit === "kg"
                            ? buttonActiveClass
                            : buttonInactiveClass
                        }
                      >
                        {t("unit_kg")}
                      </button>
                      <button
                        type="button"
                        onClick={() => setSignupWeightUnit("lb")}
                        className={
                          signupWeightUnit === "lb"
                            ? buttonActiveClass
                            : buttonInactiveClass
                        }
                      >
                        {t("unit_lb")}
                      </button>
                    </div>
                  </div>
                </div>
                <div>
                  <label htmlFor="auth-signup-name" className={labelClass}>
                    {t("settings_nameHeading")} ({t("auth_optional")})
                  </label>
                  <input
                    id="auth-signup-name"
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    placeholder={t("settings_namePlaceholder")}
                    className={inputClass}
                    disabled={submitting}
                  />
                </div>
                <div className="flex gap-6 items-start">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="auth-signup-weight" className={labelClass}>
                      {t("settings_weightHeading")} ({t("auth_optional")})
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        id="auth-signup-weight"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={signupWeightUnit === "kg" ? 0.5 : 1}
                        value={signupWeight}
                        onChange={(e) => setSignupWeight(e.target.value)}
                        placeholder={t("settings_weightPlaceholder")}
                        className="min-w-0 w-full max-w-[7rem] rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-dark placeholder:text-brand-placeholder focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        disabled={submitting}
                      />
                      <span className="text-brand-text-muted text-sm shrink-0">
                        {t(signupWeightUnit === "kg" ? "unit_kg" : "unit_lb")}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <label htmlFor="auth-signup-height" className={labelClass}>
                      {t("settings_heightHeading")} ({t("auth_optional")})
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      <input
                        id="auth-signup-height"
                        type="number"
                        inputMode="decimal"
                        min={0}
                        step={0.1}
                        value={signupHeight}
                        onChange={(e) => setSignupHeight(e.target.value)}
                        placeholder={t("settings_heightPlaceholder")}
                        className="min-w-0 w-full max-w-[7rem] rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-dark placeholder:text-brand-placeholder focus:border-brand-primary focus:outline-none focus:ring-1 focus:ring-brand-primary"
                        disabled={submitting}
                      />
                      <span className="text-brand-text-muted text-sm shrink-0">
                        {t("unit_cm")}
                      </span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <label className={labelClass}>
                      {t("settings_genderHeading")} ({t("auth_optional")})
                    </label>
                    <div
                      className="flex flex-wrap gap-2"
                      role="group"
                      aria-label={t("settings_genderHeading")}
                    >
                      <button
                        type="button"
                        onClick={() =>
                          setSignupGender(
                            signupGender === "male" ? null : "male",
                          )
                        }
                        className={
                          signupGender === "male"
                            ? buttonActiveClass
                            : buttonInactiveClass
                        }
                      >
                        {t("settings_genderMale")}
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setSignupGender(
                            signupGender === "female" ? null : "female",
                          )
                        }
                        className={
                          signupGender === "female"
                            ? buttonActiveClass
                            : buttonInactiveClass
                        }
                      >
                        {t("settings_genderFemale")}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-400" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-sm text-brand-primary" role="status">
                {success}
              </p>
            )}
            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-brand-primary px-4 py-2.5 text-sm font-medium text-brand-bg hover:bg-brand-primary-hover focus:outline-none focus:ring-2 focus:ring-brand-primary focus:ring-offset-2 focus:ring-offset-brand-bg disabled:opacity-50 disabled:pointer-events-none transition-colors"
            >
              {submitting
                ? t("loading")
                : tab === "signin"
                  ? t("auth_submitSignIn")
                  : tab === "signup"
                    ? t("auth_submitSignUp")
                    : t("auth_submitResetPassword")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
