import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";

const STORAGE_KEY = "gym-tracker-user-profile";

export type UserGender = "male" | "female";

export type UserProfile = {
  name: string;
  weightKg: number | null;
  heightCm: number | null;
  gender: UserGender | null;
};

const defaultProfile: UserProfile = {
  name: "",
  weightKg: null,
  heightCm: null,
  gender: null,
};

function loadFromStorage(): UserProfile {
  if (typeof window === "undefined") return defaultProfile;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProfile;
    const parsed = JSON.parse(raw) as unknown;
    if (parsed && typeof parsed === "object") {
      return {
        name: typeof parsed.name === "string" ? parsed.name : "",
        weightKg:
          typeof parsed.weightKg === "number" && Number.isFinite(parsed.weightKg)
            ? parsed.weightKg
            : null,
        heightCm:
          typeof parsed.heightCm === "number" && Number.isFinite(parsed.heightCm)
            ? parsed.heightCm
            : null,
        gender:
          parsed.gender === "male" || parsed.gender === "female"
            ? parsed.gender
            : null,
      };
    }
  } catch {
    // ignore
  }
  return defaultProfile;
}

function saveToStorage(profile: UserProfile) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

type UserProfileContextValue = {
  profile: UserProfile;
  setName: (name: string) => void;
  setWeightKg: (weightKg: number | null) => void;
  setHeightCm: (heightCm: number | null) => void;
  setGender: (gender: UserGender | null) => void;
};

const UserProfileContext = createContext<UserProfileContextValue | null>(null);

export function UserProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile);

  useEffect(() => {
    setProfileState(loadFromStorage());
  }, []);

  const setProfile = useCallback((updater: (prev: UserProfile) => UserProfile) => {
    setProfileState((prev) => {
      const next = updater(prev);
      saveToStorage(next);
      return next;
    });
  }, []);

  const setName = useCallback(
    (name: string) => setProfile((p) => ({ ...p, name })),
    [setProfile],
  );
  const setWeightKg = useCallback(
    (weightKg: number | null) => setProfile((p) => ({ ...p, weightKg })),
    [setProfile],
  );
  const setHeightCm = useCallback(
    (heightCm: number | null) => setProfile((p) => ({ ...p, heightCm })),
    [setProfile],
  );
  const setGender = useCallback(
    (gender: UserGender | null) => setProfile((p) => ({ ...p, gender })),
    [setProfile],
  );

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        setName,
        setWeightKg,
        setHeightCm,
        setGender,
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  const v = useContext(UserProfileContext);
  if (v === null)
    throw new Error("useUserProfile must be used within UserProfileProvider");
  return v;
}
