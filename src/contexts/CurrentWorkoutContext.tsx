import { createContext, useContext, useState, useCallback, useRef, type ReactNode } from 'react'

export type CurrentWorkout = {
  id: string
  startedAt: string
  templateId?: string
}

type CurrentWorkoutContextValue = {
  currentWorkout: CurrentWorkout | null
  startWorkout: () => void
  startWorkoutWithTemplate: (templateId: string, exerciseUniqueNames: string[]) => void
  consumeInitialExercises: () => string[] | null
  endWorkout: () => void
}

const CurrentWorkoutContext = createContext<CurrentWorkoutContextValue | null>(null)

export function CurrentWorkoutProvider({ children }: { children: ReactNode }) {
  const [currentWorkout, setCurrentWorkout] = useState<CurrentWorkout | null>(null)
  const initialExercisesRef = useRef<string[] | null>(null)

  const startWorkout = useCallback(() => {
    initialExercisesRef.current = null
    setCurrentWorkout({
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
    })
  }, [])

  const startWorkoutWithTemplate = useCallback((templateId: string, exerciseUniqueNames: string[]) => {
    initialExercisesRef.current =
      exerciseUniqueNames.length > 0 ? exerciseUniqueNames : null
    setCurrentWorkout({
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
      templateId,
    })
  }, [])

  const consumeInitialExercises = useCallback(() => {
    const names = initialExercisesRef.current
    initialExercisesRef.current = null
    return names
  }, [])

  const endWorkout = useCallback(() => {
    setCurrentWorkout(null)
    initialExercisesRef.current = null
  }, [])

  return (
    <CurrentWorkoutContext.Provider
      value={{
        currentWorkout,
        startWorkout,
        startWorkoutWithTemplate,
        consumeInitialExercises,
        endWorkout,
      }}
    >
      {children}
    </CurrentWorkoutContext.Provider>
  )
}

export function useCurrentWorkout() {
  const value = useContext(CurrentWorkoutContext)
  if (value === null) throw new Error('useCurrentWorkout must be used within CurrentWorkoutProvider')
  return value
}
