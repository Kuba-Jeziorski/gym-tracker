import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useAuth } from "./AuthContext";
import {
  readFavoriteExercises,
  writeFavoriteExercises,
} from "../helpers/favoriteExercisesStorage";

type FavoriteExercisesContextValue = {
  favoriteUniqueNames: string[];
  favoriteIdSet: Set<string>;
  pickerFavoritesOnly: boolean;
  setPickerFavoritesOnly: (value: boolean) => void;
  toggleFavorite: (uniqueName: string) => void;
  isFavorite: (uniqueName: string) => boolean;
};

const FavoriteExercisesContext =
  createContext<FavoriteExercisesContextValue | null>(null);

function userStorageKey(userId: string | undefined): string {
  return userId ?? "anon";
}

export function FavoriteExercisesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const key = userStorageKey(user?.id);

  const [favoriteUniqueNames, setFavoriteUniqueNames] = useState<string[]>([]);
  const [pickerFavoritesOnly, setPickerFavoritesOnlyState] = useState(false);
  const pickerFavoritesOnlyRef = useRef(pickerFavoritesOnly);
  pickerFavoritesOnlyRef.current = pickerFavoritesOnly;

  useEffect(() => {
    const stored = readFavoriteExercises(key);
    setFavoriteUniqueNames(stored.names);
    setPickerFavoritesOnlyState(stored.pickerFavoritesOnly);
  }, [key]);

  useEffect(() => {
    if (favoriteUniqueNames.length === 0 && pickerFavoritesOnly) {
      setPickerFavoritesOnlyState(false);
      writeFavoriteExercises(key, {
        names: favoriteUniqueNames,
        pickerFavoritesOnly: false,
      });
    }
  }, [favoriteUniqueNames, key, pickerFavoritesOnly]);

  const persist = useCallback(
    (names: string[], pickerOnly: boolean) => {
      writeFavoriteExercises(key, {
        names,
        pickerFavoritesOnly: pickerOnly,
      });
    },
    [key],
  );

  const setPickerFavoritesOnly = useCallback(
    (value: boolean) => {
      setPickerFavoritesOnlyState(value);
      persist(favoriteUniqueNames, value);
    },
    [favoriteUniqueNames, persist],
  );

  const toggleFavorite = useCallback(
    (uniqueName: string) => {
      setFavoriteUniqueNames((prev) => {
        const next = prev.includes(uniqueName)
          ? prev.filter((x) => x !== uniqueName)
          : [...prev, uniqueName];
        persist(next, pickerFavoritesOnlyRef.current);
        return next;
      });
    },
    [persist],
  );

  const favoriteIdSet = useMemo(
    () => new Set(favoriteUniqueNames),
    [favoriteUniqueNames],
  );

  const isFavorite = useCallback(
    (uniqueName: string) => favoriteIdSet.has(uniqueName),
    [favoriteIdSet],
  );

  const value = useMemo(
    (): FavoriteExercisesContextValue => ({
      favoriteUniqueNames,
      favoriteIdSet,
      pickerFavoritesOnly,
      setPickerFavoritesOnly,
      toggleFavorite,
      isFavorite,
    }),
    [
      favoriteUniqueNames,
      favoriteIdSet,
      pickerFavoritesOnly,
      setPickerFavoritesOnly,
      toggleFavorite,
      isFavorite,
    ],
  );

  return (
    <FavoriteExercisesContext.Provider value={value}>
      {children}
    </FavoriteExercisesContext.Provider>
  );
}

export function useFavoriteExercises(): FavoriteExercisesContextValue {
  const ctx = useContext(FavoriteExercisesContext);
  if (ctx === null) {
    throw new Error(
      "useFavoriteExercises must be used within FavoriteExercisesProvider",
    );
  }
  return ctx;
}
