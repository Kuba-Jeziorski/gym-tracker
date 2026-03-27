export type FavoriteExercisesStored = {
  names: string[];
  /** When true, workout/template exercise pickers show only starred exercises. */
  pickerFavoritesOnly: boolean;
};

const STORAGE_PREFIX = "gym-tracker.favoriteExercises.v1";

function storageKey(userId: string): string {
  return `${STORAGE_PREFIX}:${userId}`;
}

const defaultStored = (): FavoriteExercisesStored => ({
  names: [],
  pickerFavoritesOnly: false,
});

export function readFavoriteExercises(userId: string): FavoriteExercisesStored {
  if (typeof window === "undefined") return defaultStored();
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) return defaultStored();
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== "object") return defaultStored();
    const o = parsed as Record<string, unknown>;
    const namesRaw = o.names;
    const names = Array.isArray(namesRaw)
      ? namesRaw.filter((x): x is string => typeof x === "string")
      : [];
    const pickerFavoritesOnly = Boolean(o.pickerFavoritesOnly);
    return { names, pickerFavoritesOnly };
  } catch {
    return defaultStored();
  }
}

export function writeFavoriteExercises(
  userId: string,
  data: FavoriteExercisesStored,
): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(storageKey(userId), JSON.stringify(data));
  } catch {
    /* quota / private mode */
  }
}
