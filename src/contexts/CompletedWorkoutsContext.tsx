import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react'
import type { StoredWorkout } from '../data/workoutStorage'

type CompletedWorkoutsContextValue = {
  workouts: StoredWorkout[]
  appendWorkout: (workout: StoredWorkout) => void
  updateWorkout: (id: string, workout: StoredWorkout) => void
  removeWorkout: (id: string) => void
  isLoading: boolean
}

const CompletedWorkoutsContext = createContext<CompletedWorkoutsContextValue | null>(null)

const WORKOUTS_JSON_URL = '/workouts.json'
const STORAGE_KEY = 'gym-tracker-workouts'

function loadFromStorage(): StoredWorkout[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function saveToStorage(list: StoredWorkout[]) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

export function CompletedWorkoutsProvider({ children }: { children: ReactNode }) {
  const [workouts, setWorkouts] = useState<StoredWorkout[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetch(WORKOUTS_JSON_URL)
      .then((res) => (res.ok ? res.json() : []))
      .then((data: unknown) => {
        const fromFile = Array.isArray(data) ? data : []
        const fromStorage = loadFromStorage()
        setWorkouts(fromStorage.length > 0 ? fromStorage : fromFile)
      })
      .catch(() => setWorkouts(loadFromStorage()))
      .finally(() => setIsLoading(false))
  }, [])

  const appendWorkout = useCallback((workout: StoredWorkout) => {
    setWorkouts((prev) => {
      const next = [...prev, workout]
      saveToStorage(next)
      return next
    })
  }, [])

  const updateWorkout = useCallback((id: string, workout: StoredWorkout) => {
    setWorkouts((prev) => {
      const next = prev.map((w) => (w.id === id ? workout : w))
      saveToStorage(next)
      return next
    })
  }, [])

  const removeWorkout = useCallback((id: string) => {
    setWorkouts((prev) => {
      const next = prev.filter((w) => w.id !== id)
      saveToStorage(next)
      return next
    })
  }, [])

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
