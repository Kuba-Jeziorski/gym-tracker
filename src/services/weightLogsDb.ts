import type { PostgrestError } from '@supabase/supabase-js'
import { supabase } from './supabaseClient'
import {
  parseWeightMeasurements,
  serializeWeightMeasurements,
  type WeightMeasurement,
} from '../helpers/weightMeasurements'

export type WeightLogRow = {
  user_id: string
  measurements: unknown
  updated_at: string
}

export async function fetchWeightLog(userId: string) {
  return supabase
    .from('weight_logs')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
}

export async function upsertWeightLog(
  userId: string,
  measurements: WeightMeasurement[],
): Promise<{
  data: WeightLogRow | null
  error: PostgrestError | null
}> {
  const { data, error } = await supabase
    .from('weight_logs')
    .upsert(
      {
        user_id: userId,
        measurements: serializeWeightMeasurements(measurements),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id' },
    )
    .select('*')
    .single()
  return { data: (data as WeightLogRow | null) ?? null, error }
}

export function measurementsFromRow(row: WeightLogRow | null | undefined): WeightMeasurement[] {
  return parseWeightMeasurements(row?.measurements)
}
