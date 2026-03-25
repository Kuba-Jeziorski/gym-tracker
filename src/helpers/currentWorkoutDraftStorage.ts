export type CurrentWorkoutDraft = {
  workoutId: string;
  startedAt: string;
  templateId?: string | null;
  exercises: unknown;
};

const STORAGE_KEY = "gym-tracker.currentWorkoutDraft.v1";

export function readCurrentWorkoutDraft(): CurrentWorkoutDraft | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CurrentWorkoutDraft;
    if (!parsed?.workoutId) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function upsertCurrentWorkoutDraft(draft: CurrentWorkoutDraft): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(draft));
  } catch {
  }
}

export function clearCurrentWorkoutDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
  }
}

