import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from './AuthContext'
import {
  fetchWeightLog,
  measurementsFromRow,
  upsertWeightLog,
  type WeightLogRow,
} from '../services/weightLogsDb'
import {
  removeWeightMeasurement,
  upsertWeightMeasurement,
  type WeightMeasurement,
} from '../helpers/weightMeasurements'

type WeightLogsContextValue = {
  measurements: WeightMeasurement[]
  isLoading: boolean
  saveMeasurement: (date: string, weightKg: number) => Promise<void>
  deleteMeasurement: (date: string) => Promise<void>
}

const WeightLogsContext = createContext<WeightLogsContextValue | null>(null)

export function WeightLogsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const queryClient = useQueryClient()

  const logsQuery = useQuery({
    queryKey: ['weightLogs', userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await fetchWeightLog(userId!)
      if (error) throw error
      return (data as WeightLogRow | null) ?? null
    },
  })

  const measurements = measurementsFromRow(logsQuery.data)

  const saveMutation = useMutation({
    mutationFn: async (next: WeightMeasurement[]) => {
      if (!userId) return
      const { error } = await upsertWeightLog(userId, next)
      if (error) throw error
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['weightLogs', userId] })
    },
  })

  const saveMeasurement = useCallback(
    async (date: string, weightKg: number) => {
      await saveMutation.mutateAsync(upsertWeightMeasurement(measurements, date, weightKg))
    },
    [measurements, saveMutation],
  )

  const deleteMeasurement = useCallback(
    async (date: string) => {
      await saveMutation.mutateAsync(removeWeightMeasurement(measurements, date))
    },
    [measurements, saveMutation],
  )

  return (
    <WeightLogsContext.Provider
      value={{
        measurements,
        isLoading: logsQuery.isLoading,
        saveMeasurement,
        deleteMeasurement,
      }}
    >
      {children}
    </WeightLogsContext.Provider>
  )
}

export function useWeightLogs() {
  const value = useContext(WeightLogsContext)
  if (value === null) {
    throw new Error('useWeightLogs must be used within WeightLogsProvider')
  }
  return value
}
