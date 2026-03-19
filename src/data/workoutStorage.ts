/**
 * Types for completed workouts. Completed workouts are stored in localStorage
 * for now (see CompletedWorkoutsContext). Replace with DB (e.g. Supabase) when ready.
 */

export type StoredSet = {
  weight?: string
  reps?: string
  time?: string
}

export type StoredWorkoutExercise = {
  exerciseUniqueName: string
  sets: StoredSet[]
}

export type StoredWorkout = {
  id: string
  startedAt: string
  completedAt: string
  /** Present when the workout was started from a template (Supabase `template_id`). */
  templateId?: string | null
  /** Snapshot at save time (`trainings.template_name`); survives template delete / id null. */
  templateName?: string | null
  exercises: StoredWorkoutExercise[]
}
