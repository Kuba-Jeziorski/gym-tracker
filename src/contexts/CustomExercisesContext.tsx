import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { Exercise } from "../data/exercises";
import { exercises as builtinExercises } from "../data/exercises";
import { slugify } from "../helpers/slugify";

const STORAGE_KEY = "gym-tracker-custom-exercises";

type CustomExercisesContextValue = {
  customExercises: Exercise[];
  allExercises: Exercise[];
  addCustomExercise: (exercise: Omit<Exercise, "unique_name">) => void;
  updateCustomExercise: (
    uniqueName: string,
    exercise: Omit<Exercise, "unique_name">,
  ) => void;
  removeCustomExercise: (uniqueName: string) => void;
};

const CustomExercisesContext = createContext<CustomExercisesContextValue | null>(null);

function loadFromStorage(): Exercise[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(list: Exercise[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

export function CustomExercisesProvider({ children }: { children: ReactNode }) {
  const [customExercises, setCustomExercises] = useState<Exercise[]>([]);

  useEffect(() => {
    setCustomExercises(loadFromStorage());
  }, []);

  const allExercises = [...builtinExercises, ...customExercises];

  const addCustomExercise = useCallback(
    (exercise: Omit<Exercise, "unique_name">) => {
      const baseSlug = "custom_" + slugify(exercise.name);
      if (!baseSlug.replace("custom_", "")) return;
      setCustomExercises((prev) => {
        const existing = [...builtinExercises, ...prev];
        let uniqueName = baseSlug;
        let n = 0;
        while (existing.some((e) => e.unique_name === uniqueName)) {
          n += 1;
          uniqueName = `${baseSlug}_${n}`;
        }
        const full: Exercise = {
          ...exercise,
          unique_name: uniqueName,
          main_muscle_group: exercise.main_muscle_group ?? "",
          all_muscle_groups: exercise.all_muscle_groups ?? [],
        };
        const next = [...prev, full];
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const updateCustomExercise = useCallback(
    (uniqueName: string, exercise: Omit<Exercise, "unique_name">) => {
      setCustomExercises((prev) => {
        const next = prev.map((e) =>
          e.unique_name === uniqueName
            ? {
                ...e,
                name: exercise.name.trim(),
                weight: exercise.weight,
                reps: exercise.reps,
                time: exercise.time,
                main_muscle_group: exercise.main_muscle_group ?? "",
                all_muscle_groups: exercise.all_muscle_groups ?? [],
              }
            : e,
        );
        saveToStorage(next);
        return next;
      });
    },
    [],
  );

  const removeCustomExercise = useCallback((uniqueName: string) => {
    setCustomExercises((prev) => {
      const next = prev.filter((e) => e.unique_name !== uniqueName);
      saveToStorage(next);
      return next;
    });
  }, []);

  return (
    <CustomExercisesContext.Provider
      value={{
        customExercises,
        allExercises,
        addCustomExercise,
        updateCustomExercise,
        removeCustomExercise,
      }}
    >
      {children}
    </CustomExercisesContext.Provider>
  );
}

export function useCustomExercises() {
  const v = useContext(CustomExercisesContext);
  if (v === null)
    throw new Error("useCustomExercises must be used within CustomExercisesProvider");
  return v;
}

export function useAllExercises(): Exercise[] {
  const ctx = useContext(CustomExercisesContext);
  if (ctx === null) return builtinExercises;
  return ctx.allExercises;
}
