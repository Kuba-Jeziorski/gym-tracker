import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

export type WeightUnit = 'kg' | 'lb'

const STORAGE_KEY = 'gym-tracker-weight-unit'

function getStored(): WeightUnit {
  if (typeof window === 'undefined') return 'kg'
  const v = localStorage.getItem(STORAGE_KEY)
  return v === 'lb' ? 'lb' : 'kg'
}

type WeightUnitContextValue = {
  weightUnit: WeightUnit
  setWeightUnit: (u: WeightUnit) => void
}

const WeightUnitContext = createContext<WeightUnitContextValue | null>(null)

export function WeightUnitProvider({ children }: { children: ReactNode }) {
  const [weightUnit, setWeightUnitState] = useState<WeightUnit>(getStored)

  const setWeightUnit = useCallback((u: WeightUnit) => {
    setWeightUnitState(u)
    localStorage.setItem(STORAGE_KEY, u)
  }, [])

  return (
    <WeightUnitContext.Provider value={{ weightUnit, setWeightUnit }}>
      {children}
    </WeightUnitContext.Provider>
  )
}

export function useWeightUnit() {
  const v = useContext(WeightUnitContext)
  if (v === null) throw new Error('useWeightUnit must be used within WeightUnitProvider')
  return v
}
