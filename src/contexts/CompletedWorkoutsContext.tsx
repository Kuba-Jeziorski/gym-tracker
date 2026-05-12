import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from 'react'
import type { StoredWorkout } from '../data/workoutStorage'
import { useAuth } from './AuthContext'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { deleteTrainingById, updateTrainingById, upsertTraining } from '../services/trainingsDb'
import { trainingsQueryKey, useTrainingsQuery } from '../hooks/useTrainingsQuery'

type CompletedWorkoutsContextValue = {
  workouts: StoredWorkout[]
  appendWorkout: (workout: StoredWorkout) => void
  updateWorkout: (id: string, workout: StoredWorkout) => Promise<void>
  removeWorkout: (id: string) => void
  isLoading: boolean
}

const CompletedWorkoutsContext = createContext<CompletedWorkoutsContextValue | null>(null)

export function CompletedWorkoutsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()
  const { workouts, isLoading } = useTrainingsQuery()

  const appendMutation = useMutation({
    mutationFn: async (workout: StoredWorkout) => {
      if (!userId) return
      const { error } = await upsertTraining({
        id: workout.id,
        user_id: userId,
        template_id: workout.templateId ?? null,
        template_name: workout.templateName?.trim() || null,
        started_at: workout.startedAt,
        completed_at: workout.completedAt,
        exercises: workout.exercises ?? [],
        notes: workout.notes ?? "",
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trainingsQueryKey(userId) })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({ id, workout }: { id: string; workout: StoredWorkout }) => {
      if (!userId) return
      const { error } = await updateTrainingById(userId, id, {
        started_at: workout.startedAt,
        completed_at: workout.completedAt,
        exercises: workout.exercises ?? [],
        notes: workout.notes ?? "",
        updated_at: new Date().toISOString(),
      })
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trainingsQueryKey(userId) })
    },
  })

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) return
      const { error } = await deleteTrainingById(userId, id)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: trainingsQueryKey(userId) })
    },
  })

  const appendWorkout = useCallback((workout: StoredWorkout) => {
    appendMutation.mutate(workout)
  }, [appendMutation])

  const updateWorkout = useCallback(
    async (id: string, workout: StoredWorkout) => {
      await updateMutation.mutateAsync({ id, workout })
    },
    [updateMutation],
  )

  const removeWorkout = useCallback((id: string) => {
    removeMutation.mutate(id)
  }, [removeMutation])

  return (
    <CompletedWorkoutsContext.Provider value={{ workouts, appendWorkout, updateWorkout, removeWorkout, isLoading }}>
      {children}
    </CompletedWorkoutsContext.Provider>
  )
}

export function useCompletedWorkouts() {
  const v = useContext(CompletedWorkoutsContext)
  if (v === null) throw new Error('useCompletedWorkouts must be used within CompletedWorkoutsProvider')
  return v
}
