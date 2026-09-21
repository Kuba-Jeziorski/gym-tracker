export type WeightMeasurement = {
  date: string
  weightKg: number
}

type RawMeasurement = {
  date?: unknown
  weight_kg?: unknown
  weightKg?: unknown
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export function localDateInputValue(date = new Date()): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatWeightDate(dateStr: string): string {
  const [year, month, day] = dateStr.split('-')
  if (!year || !month || !day) return dateStr
  return `${day}.${month}.${year}`
}

function parseWeightKg(value: unknown): number | null {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? '').replace(',', '.'))
  if (!Number.isFinite(n) || n <= 0) return null
  return Math.round(n * 100) / 100
}

export function parseWeightMeasurements(raw: unknown): WeightMeasurement[] {
  if (!Array.isArray(raw)) return []
  const byDate = new Map<string, number>()
  for (const item of raw as RawMeasurement[]) {
    const date = typeof item?.date === 'string' ? item.date.trim() : ''
    if (!DATE_RE.test(date)) continue
    const weightKg = parseWeightKg(item.weight_kg ?? item.weightKg)
    if (weightKg == null) continue
    byDate.set(date, weightKg)
  }
  return [...byDate.entries()]
    .map(([date, weightKg]) => ({ date, weightKg }))
    .sort((a, b) => a.date.localeCompare(b.date))
}

export function serializeWeightMeasurements(measurements: WeightMeasurement[]) {
  return parseWeightMeasurements(measurements).map((item) => ({
    date: item.date,
    weight_kg: item.weightKg,
  }))
}

export function upsertWeightMeasurement(
  measurements: WeightMeasurement[],
  date: string,
  weightKg: number,
): WeightMeasurement[] {
  return parseWeightMeasurements([...measurements, { date, weightKg }])
}

export function removeWeightMeasurement(
  measurements: WeightMeasurement[],
  date: string,
): WeightMeasurement[] {
  return measurements.filter((item) => item.date !== date)
}
