import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  type Locale,
  translations,
} from "../i18n/translations";
import { fetchProfile, upsertProfile } from "../services/profilesDb";

export type UserGender = "male" | "female";
export type WeightUnit = "kg" | "lb";
export type MobileFontSizeMode = "standard" | "enlarged";

export type UserProfile = {
  name: string;
  weightKg: number | null;
  heightCm: number | null;
  gender: UserGender | null;
};

const emptyProfile: UserProfile = {
  name: "",
  weightKg: null,
  heightCm: null,
  gender: null,
};

type AccountPreferencesValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  weightUnit: WeightUnit;
  setWeightUnit: (unit: WeightUnit) => void;
  mobileFontSizeMode: MobileFontSizeMode;
  setMobileFontSizeMode: (mode: MobileFontSizeMode) => void;
  profile: UserProfile;
  setName: (name: string) => void;
  setWeightKg: (weightKg: number | null) => void;
  setHeightCm: (heightCm: number | null) => void;
  setGender: (gender: UserGender | null) => void;
  t: (key: string) => string;
  profileLoading: boolean;
  flushProfileSave: () => Promise<void>;
  refreshProfileFromServer: () => Promise<void>;
  saveProfileChanges: () => Promise<{ ok: boolean; error: string | null }>;
};

const AccountPreferencesContext = createContext<AccountPreferencesValue | null>(
  null
);

function parseMobileFontSizeMode(
  value: string | null | undefined,
): MobileFontSizeMode {
  return value === "enlarged" ? "enlarged" : "standard";
}

function rowToProfile(row: {
  name: string | null;
  weight_kg: number | null;
  height_cm: number | null;
  gender: string | null;
  locale: string;
  weight_unit: string;
  mobile_font_size_mode?: string | null;
}): {
  locale: Locale;
  weightUnit: WeightUnit;
  profile: UserProfile;
  mobileFontSizeMode: MobileFontSizeMode;
} {
  return {
    locale: row.locale === "pl" ? "pl" : "en",
    weightUnit: row.weight_unit === "lb" ? "lb" : "kg",
    profile: {
      name: row.name ?? "",
      weightKg: row.weight_kg,
      heightCm: row.height_cm,
      gender:
        row.gender === "male" || row.gender === "female"
          ? row.gender
          : null,
    },
    mobileFontSizeMode: parseMobileFontSizeMode(row.mobile_font_size_mode),
  };
}

function numClose(
  a: number | null | undefined,
  b: number | null | undefined
): boolean {
  if (a === b) return true;
  if (a == null && b == null) return true;
  if (a == null || b == null) return false;
  return Math.abs(a - b) < 1e-5;
}

function samePrefs(
  a: {
    profile: UserProfile;
    locale: Locale;
    weightUnit: WeightUnit;
    mobileFontSizeMode: MobileFontSizeMode;
  },
  b: {
    profile: UserProfile;
    locale: Locale;
    weightUnit: WeightUnit;
    mobileFontSizeMode: MobileFontSizeMode;
  },
): boolean {
  return (
    a.locale === b.locale &&
    a.weightUnit === b.weightUnit &&
    a.mobileFontSizeMode === b.mobileFontSizeMode &&
    a.profile.name === b.profile.name &&
    numClose(a.profile.weightKg, b.profile.weightKg) &&
    numClose(a.profile.heightCm, b.profile.heightCm) &&
    a.profile.gender === b.profile.gender
  );
}

function applyServerRow(
  row: {
    name: string | null;
    weight_kg: number | null;
    height_cm: number | null;
    gender: string | null;
    locale: string;
    weight_unit: string;
    mobile_font_size_mode?: string | null;
  },
  setters: {
    setLocaleState: (l: Locale) => void;
    setWeightUnitState: (w: WeightUnit) => void;
    setMobileFontSizeModeState: (m: MobileFontSizeMode) => void;
    setProfileState: (p: UserProfile) => void;
    profileRef: MutableRefObject<UserProfile>;
    localeRef: MutableRefObject<Locale>;
    weightUnitRef: MutableRefObject<WeightUnit>;
    mobileFontSizeRef: MutableRefObject<MobileFontSizeMode>;
  },
) {
  const next = rowToProfile(row);
  setters.setLocaleState(next.locale);
  setters.setWeightUnitState(next.weightUnit);
  setters.setMobileFontSizeModeState(next.mobileFontSizeMode);
  setters.setProfileState(next.profile);
  setters.profileRef.current = next.profile;
  setters.localeRef.current = next.locale;
  setters.weightUnitRef.current = next.weightUnit;
  setters.mobileFontSizeRef.current = next.mobileFontSizeMode;
}

export function AccountPreferencesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [locale, setLocaleState] = useState<Locale>("en");
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>("kg");
  const [mobileFontSizeMode, setMobileFontSizeModeState] =
    useState<MobileFontSizeMode>("standard");
  const [profile, setProfileState] = useState<UserProfile>(emptyProfile);
  const [profileLoading, setProfileLoading] = useState(true);

  const userIdRef = useRef<string | null>(null);
  userIdRef.current = user?.id ?? null;

  const profileRef = useRef(profile);
  const localeRef = useRef(locale);
  const weightUnitRef = useRef(weightUnit);
  const mobileFontSizeRef = useRef<MobileFontSizeMode>(mobileFontSizeMode);
  profileRef.current = profile;
  localeRef.current = locale;
  weightUnitRef.current = weightUnit;
  mobileFontSizeRef.current = mobileFontSizeMode;

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isInitialProfileLoadRef = useRef(false);

  const persistSnapshot = useCallback(
    (
      p: UserProfile,
      loc: Locale,
      wu: WeightUnit,
      mobileFont: MobileFontSizeMode,
      uid: string,
    ) => {
      return upsertProfile(uid, {
        name: p.name,
        weight_kg: p.weightKg,
        height_cm: p.heightCm,
        gender: p.gender,
        locale: loc,
        weight_unit: wu,
        mobile_font_size_mode: mobileFont,
      });
    },
    [],
  );

  const applyRow = useCallback(
    (row: Parameters<typeof applyServerRow>[0]) => {
      applyServerRow(row, {
        setLocaleState,
        setWeightUnitState,
        setMobileFontSizeModeState,
        setProfileState,
        profileRef,
        localeRef,
        weightUnitRef,
        mobileFontSizeRef,
      });
    },
    [],
  );

  const flushProfileSave = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid) return;
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const sent = {
      profile: { ...profileRef.current },
      locale: localeRef.current,
      weightUnit: weightUnitRef.current,
      mobileFontSizeMode: mobileFontSizeRef.current,
    };
    const { error } = await persistSnapshot(
      sent.profile,
      sent.locale,
      sent.weightUnit,
      sent.mobileFontSizeMode,
      uid,
    );
    if (error || userIdRef.current !== uid) return;
    const { data } = await fetchProfile(uid);
    if (!data || userIdRef.current !== uid) return;
    applyRow(data);
  }, [persistSnapshot, applyRow]);

  const saveProfileChanges = useCallback(async (): Promise<{
    ok: boolean;
    error: string | null;
  }> => {
    const uid = userIdRef.current;
    if (!uid) {
      return { ok: false, error: "Not signed in" };
    }
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
    const p = profileRef.current;
    const loc = localeRef.current;
    const wu = weightUnitRef.current;
    const mf = mobileFontSizeRef.current;
    const { error } = await persistSnapshot(p, loc, wu, mf, uid);
    if (error) {
      return {
        ok: false,
        error: error.message || String(error),
      };
    }
    if (userIdRef.current !== uid) {
      return { ok: false, error: "Session changed" };
    }
    const { data, error: fetchErr } = await fetchProfile(uid);
    if (fetchErr) {
      return {
        ok: false,
        error: fetchErr.message || "Could not load saved profile",
      };
    }
    if (!data || userIdRef.current !== uid) {
      return { ok: false, error: "Could not verify save" };
    }
    applyRow(data);
    return { ok: true, error: null };
  }, [persistSnapshot, applyRow]);

  const refreshProfileFromServer = useCallback(async () => {
    const uid = userIdRef.current;
    if (!uid || isInitialProfileLoadRef.current) return;
    await flushProfileSave();
    if (userIdRef.current !== uid) return;
    const { data, error } = await fetchProfile(uid);
    if (error || !data || userIdRef.current !== uid) return;
    const server = rowToProfile(data);
    const local = {
      profile: profileRef.current,
      locale: localeRef.current,
      weightUnit: weightUnitRef.current,
      mobileFontSizeMode: mobileFontSizeRef.current,
    };
    if (!samePrefs(local, server)) {
      applyRow(data);
    }
  }, [flushProfileSave, applyRow]);

  const scheduleProfilePersist = useCallback(() => {
    const uid = userIdRef.current;
    if (!uid) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      saveTimerRef.current = null;
      if (userIdRef.current !== uid) return;
      const sent = {
        profile: { ...profileRef.current },
        locale: localeRef.current,
        weightUnit: weightUnitRef.current,
        mobileFontSizeMode: mobileFontSizeRef.current,
      };
      const { error } = await persistSnapshot(
        sent.profile,
        sent.locale,
        sent.weightUnit,
        sent.mobileFontSizeMode,
        uid,
      );
      if (error || userIdRef.current !== uid) return;
      const { data } = await fetchProfile(uid);
      if (!data || userIdRef.current !== uid) return;
      const now = {
        profile: profileRef.current,
        locale: localeRef.current,
        weightUnit: weightUnitRef.current,
        mobileFontSizeMode: mobileFontSizeRef.current,
      };
      if (!samePrefs(sent, now)) return;
      applyRow(data);
    }, 450);
  }, [persistSnapshot, applyRow]);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setLocaleState("en");
      setWeightUnitState("kg");
      setMobileFontSizeModeState("standard");
      setProfileState(emptyProfile);
      setProfileLoading(false);
      return;
    }

    setProfileLoading(true);
    isInitialProfileLoadRef.current = true;
    (async () => {
      const { data, error } = await fetchProfile(user.id);
      if (cancelled) return;
      if (error || !data) {
        await upsertProfile(user.id, {
          name: "",
          weight_kg: null,
          height_cm: null,
          gender: null,
          locale: "en",
          weight_unit: "kg",
          mobile_font_size_mode: "standard",
        });
        const { data: row } = await fetchProfile(user.id);
        if (cancelled) return;
        if (row) applyRow(row);
      } else {
        applyRow(data);
      }
      if (!cancelled) {
        setProfileLoading(false);
        isInitialProfileLoadRef.current = false;
      }
    })();

    return () => {
      cancelled = true;
      isInitialProfileLoadRef.current = false;
    };
  }, [user?.id, applyRow]);

  useEffect(() => {
    if (!user?.id) return;
    const sync = () => {
      if (document.visibilityState === "visible") {
        void refreshProfileFromServer();
      }
    };
    document.addEventListener("visibilitychange", sync);
    window.addEventListener("focus", sync);
    return () => {
      document.removeEventListener("visibilitychange", sync);
      window.removeEventListener("focus", sync);
    };
  }, [user?.id, refreshProfileFromServer]);

  const setLocale = useCallback(
    async (next: Locale) => {
      setLocaleState(next);
      localeRef.current = next;
      const uid = userIdRef.current;
      if (!uid) return;
      const { error } = await persistSnapshot(
        profileRef.current,
        next,
        weightUnitRef.current,
        mobileFontSizeRef.current,
        uid,
      );
      if (!error && userIdRef.current === uid) {
        const { data } = await fetchProfile(uid);
        if (data) applyRow(data);
      }
    },
    [persistSnapshot, applyRow],
  );

  const setWeightUnit = useCallback(
    async (next: WeightUnit) => {
      setWeightUnitState(next);
      weightUnitRef.current = next;
      const uid = userIdRef.current;
      if (!uid) return;
      const { error } = await persistSnapshot(
        profileRef.current,
        localeRef.current,
        next,
        mobileFontSizeRef.current,
        uid,
      );
      if (!error && userIdRef.current === uid) {
        const { data } = await fetchProfile(uid);
        if (data) applyRow(data);
      }
    },
    [persistSnapshot, applyRow],
  );

  const setMobileFontSizeMode = useCallback(
    async (mode: MobileFontSizeMode) => {
      setMobileFontSizeModeState(mode);
      mobileFontSizeRef.current = mode;
      const uid = userIdRef.current;
      if (!uid) return;
      const { error } = await persistSnapshot(
        profileRef.current,
        localeRef.current,
        weightUnitRef.current,
        mode,
        uid,
      );
      if (!error && userIdRef.current === uid) {
        const { data } = await fetchProfile(uid);
        if (data) applyRow(data);
      }
    },
    [persistSnapshot, applyRow],
  );

  const setName = useCallback(
    (name: string) => {
      setProfileState((prev) => {
        const next = { ...prev, name };
        profileRef.current = next;
        return next;
      });
      scheduleProfilePersist();
    },
    [scheduleProfilePersist]
  );

  const setWeightKg = useCallback(
    (weightKg: number | null) => {
      setProfileState((prev) => {
        const next = { ...prev, weightKg };
        profileRef.current = next;
        return next;
      });
      scheduleProfilePersist();
    },
    [scheduleProfilePersist]
  );

  const setHeightCm = useCallback(
    (heightCm: number | null) => {
      setProfileState((prev) => {
        const next = { ...prev, heightCm };
        profileRef.current = next;
        return next;
      });
      scheduleProfilePersist();
    },
    [scheduleProfilePersist]
  );

  const setGender = useCallback(
    (gender: UserGender | null) => {
      setProfileState((prev) => {
        const next = { ...prev, gender };
        profileRef.current = next;
        return next;
      });
      scheduleProfilePersist();
    },
    [scheduleProfilePersist]
  );

  const t = useCallback(
    (key: string): string => {
      const dict = translations[locale];
      return dict[key] ?? translations.en[key] ?? key;
    },
    [locale]
  );

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle(
      "mobile-font-enlarged",
      mobileFontSizeMode === "enlarged",
    );
  }, [mobileFontSizeMode]);

  const value: AccountPreferencesValue = {
    locale,
    setLocale,
    weightUnit,
    setWeightUnit,
    mobileFontSizeMode,
    setMobileFontSizeMode,
    profile,
    setName,
    setWeightKg,
    setHeightCm,
    setGender,
    t,
    profileLoading,
    flushProfileSave,
    refreshProfileFromServer,
    saveProfileChanges,
  };

  return (
    <AccountPreferencesContext.Provider value={value}>
      {children}
    </AccountPreferencesContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(AccountPreferencesContext);
  if (ctx === null)
    throw new Error("useLanguage must be used within AccountPreferencesProvider");
  return {
    locale: ctx.locale,
    setLocale: ctx.setLocale,
    t: ctx.t,
  };
}

export function useWeightUnit() {
  const ctx = useContext(AccountPreferencesContext);
  if (ctx === null)
    throw new Error("useWeightUnit must be used within AccountPreferencesProvider");
  return {
    weightUnit: ctx.weightUnit,
    setWeightUnit: ctx.setWeightUnit,
  };
}

export function useMobileFontSizeMode() {
  const ctx = useContext(AccountPreferencesContext);
  if (ctx === null)
    throw new Error(
      "useMobileFontSizeMode must be used within AccountPreferencesProvider",
    );
  return {
    mobileFontSizeMode: ctx.mobileFontSizeMode,
    setMobileFontSizeMode: ctx.setMobileFontSizeMode,
  };
}

export function useUserProfile() {
  const ctx = useContext(AccountPreferencesContext);
  if (ctx === null)
    throw new Error("useUserProfile must be used within AccountPreferencesProvider");
  return {
    profile: ctx.profile,
    setName: ctx.setName,
    setWeightKg: ctx.setWeightKg,
    setHeightCm: ctx.setHeightCm,
    setGender: ctx.setGender,
    flushProfileSave: ctx.flushProfileSave,
    refreshProfileFromServer: ctx.refreshProfileFromServer,
    saveProfileChanges: ctx.saveProfileChanges,
  };
}

export function useProfileLoading() {
  const ctx = useContext(AccountPreferencesContext);
  if (ctx === null) return false;
  return ctx.profileLoading;
}
