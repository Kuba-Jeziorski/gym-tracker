import type { Exercise } from "../data/exercises";

export type ExerciseSelectOption = { value: string; label: string };

export function buildSortedExerciseSelectOptions(
  exercises: Exercise[],
  t: (key: string) => string,
): ExerciseSelectOption[] {
  return exercises
    .map((ex) => ({
      value: ex.unique_name,
      label: ex.unique_name.startsWith("custom_") ? ex.name : t(ex.unique_name),
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
    );
}

/** Picker list: favorites-only when requested and non-empty; otherwise full list. */
export function filterExerciseOptionsForPicker(
  fullSorted: ExerciseSelectOption[],
  favoriteUniqueNames: Set<string>,
  favoritesOnly: boolean,
): ExerciseSelectOption[] {
  if (!favoritesOnly || favoriteUniqueNames.size === 0) {
    return fullSorted;
  }
  const filtered = fullSorted.filter((o) => favoriteUniqueNames.has(o.value));
  return filtered.length > 0 ? filtered : fullSorted;
}

/**
 * Ensures the current exercise value stays in the options list when filtering
 * (e.g. legacy row or exercise removed from favorites).
 */
export function withSelectedExerciseOption(
  options: ExerciseSelectOption[],
  currentUniqueName: string,
  fullSorted: ExerciseSelectOption[],
): ExerciseSelectOption[] {
  if (!currentUniqueName.trim()) return options;
  if (options.some((o) => o.value === currentUniqueName)) return options;
  const extra = fullSorted.find((o) => o.value === currentUniqueName);
  if (!extra) return options;
  return [...options, extra].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}

/** Multi-select templates: keep chosen exercises visible even if not in favorites filter. */
export function mergeExerciseOptionsWithValues(
  pickerOptions: ExerciseSelectOption[],
  fullSorted: ExerciseSelectOption[],
  selectedValues: string[],
): ExerciseSelectOption[] {
  const inPicker = new Set(pickerOptions.map((o) => o.value));
  const extras = selectedValues
    .filter((v) => v && !inPicker.has(v))
    .map((v) => fullSorted.find((o) => o.value === v))
    .filter((o): o is ExerciseSelectOption => o != null);
  if (extras.length === 0) return pickerOptions;
  return [...extras, ...pickerOptions].sort((a, b) =>
    a.label.localeCompare(b.label, undefined, { sensitivity: "base" }),
  );
}
