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
  exercises: StoredWorkoutExercise[]
}
