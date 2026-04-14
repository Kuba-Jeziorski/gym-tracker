export type StoredSet = {
  weight?: string
  reps?: string
  time?: string
  distance?: string
  avgVelocity?: string
  pace?: string
}

export type StoredWorkoutExercise = {
  exerciseUniqueName: string
  sets: StoredSet[]
}

export type StoredWorkout = {
  id: string
  startedAt: string
  completedAt: string
  templateId?: string | null
  templateName?: string | null
  notes?: string
  exercises: StoredWorkoutExercise[]
}
