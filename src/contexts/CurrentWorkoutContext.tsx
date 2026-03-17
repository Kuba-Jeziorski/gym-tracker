import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type CurrentWorkout = {
  id: string
  startedAt: string
}

type CurrentWorkoutContextValue = {
  currentWorkout: CurrentWorkout | null
  startWorkout: () => void
  endWorkout: () => void
}

const CurrentWorkoutContext = createContext<CurrentWorkoutContextValue | null>(null)

export function CurrentWorkoutProvider({ children }: { children: ReactNode }) {
  const [currentWorkout, setCurrentWorkout] = useState<CurrentWorkout | null>(null)

  const startWorkout = useCallback(() => {
    setCurrentWorkout({
      id: crypto.randomUUID(),
      startedAt: new Date().toISOString(),
    })
  }, [])

  const endWorkout = useCallback(() => {
    setCurrentWorkout(null)
  }, [])

  return (
    <CurrentWorkoutContext.Provider value={{ currentWorkout, startWorkout, endWorkout }}>
      {children}
    </CurrentWorkoutContext.Provider>
  )
}

export function useCurrentWorkout() {
  const value = useContext(CurrentWorkoutContext)
  if (value === null) throw new Error('useCurrentWorkout must be used within CurrentWorkoutProvider')
  return value
}
