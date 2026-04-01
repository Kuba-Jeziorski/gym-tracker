import type { StoredWorkout } from '../data/workoutStorage'

function parseTimeToSeconds(s: string): number | null {
  const trimmed = s?.trim()
  if (!trimmed) return null
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':').map((p) => parseFloat(p.trim()))
    if (parts.length === 2 && Number.isFinite(parts[0]) && Number.isFinite(parts[1])) {
      return parts[0] * 60 + parts[1]
    }
    if (parts.length === 1 && Number.isFinite(parts[0])) return parts[0]
    return null
  }
  const n = parseFloat(trimmed)
  return Number.isFinite(n) && n >= 0 ? n : null
}

export type ExercisePersonalBest = {
  highestWeightKg: number | null
  highestWeightDate: string | null
  highestVolume: number | null
  highestVolumeDate: string | null
  mostReps: number | null
  mostRepsDate: string | null
  longestTimeSeconds: number | null
  longestTimeDate: string | null
}

export function formatPBDate(isoDate: string): string {
  const d = new Date(isoDate)
  return [
    d.getDate().toString().padStart(2, '0'),
    (d.getMonth() + 1).toString().padStart(2, '0'),
    d.getFullYear(),
  ].join('.')
}

export function computePersonalBests(workouts: StoredWorkout[]): Map<string, ExercisePersonalBest> {
  const map = new Map<string, ExercisePersonalBest>()
  for (const w of workouts) {
    const completedAt = w.completedAt
    for (const ex of w.exercises) {
      if (!ex.exerciseUniqueName) continue
      let cur = map.get(ex.exerciseUniqueName) ?? {
        highestWeightKg: null,
        highestWeightDate: null,
        highestVolume: null,
        highestVolumeDate: null,
        mostReps: null,
        mostRepsDate: null,
        longestTimeSeconds: null,
        longestTimeDate: null,
      }
      for (const set of ex.sets ?? []) {
        const wStr = set.weight?.trim()
        const weightKg = wStr ? parseFloat(wStr) : NaN
        const repsStr = set.reps?.trim()
        const reps = repsStr ? parseInt(repsStr, 10) : NaN
        const timeSec = set.time ? parseTimeToSeconds(set.time) : null
        if (Number.isFinite(weightKg) && weightKg > 0) {
          if (cur.highestWeightKg == null || weightKg > cur.highestWeightKg) {
            cur = { ...cur, highestWeightKg: weightKg, highestWeightDate: completedAt }
          }
          if (Number.isFinite(reps) && reps > 0) {
            const volume = weightKg * reps
            if (cur.highestVolume == null || volume > cur.highestVolume) {
              cur = { ...cur, highestVolume: volume, highestVolumeDate: completedAt }
            }
          }
        }
        if (Number.isFinite(reps) && reps > 0 && (cur.mostReps == null || reps > cur.mostReps)) {
          cur = { ...cur, mostReps: reps, mostRepsDate: completedAt }
        }
        if (timeSec != null && timeSec > 0 && (cur.longestTimeSeconds == null || timeSec > cur.longestTimeSeconds)) {
          cur = { ...cur, longestTimeSeconds: timeSec, longestTimeDate: completedAt }
        }
      }
      if (cur.highestWeightKg != null || cur.highestVolume != null || cur.mostReps != null || cur.longestTimeSeconds != null) {
        map.set(ex.exerciseUniqueName, cur)
      }
    }
  }
  return map
}

export function formatTimeSeconds(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`
  const m = Math.floor(sec / 60)
  const s = Math.round(sec % 60)
  return s > 0 ? `${m}:${s.toString().padStart(2, '0')}` : `${m}min`
}

export function countTotalSets(workouts: StoredWorkout[]): number {
  let n = 0
  for (const w of workouts) {
    for (const ex of w.exercises) {
      n += (ex.sets ?? []).length
    }
  }
  return n
}

/** Monday 00:00:00.000 local time for the calendar week containing `d`. */
function startOfWeekMonday(d: Date): Date {
  const mon = new Date(d)
  mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  mon.setHours(0, 0, 0, 0)
  return mon
}

/** Previous calendar week's Monday 00:00 from a Date that is already week-start Monday. */
function previousWeekMondayStart(weekStartMonday: Date): Date {
  const d = new Date(weekStartMonday)
  d.setDate(d.getDate() - 7)
  return d
}

/** Workouts completed from Monday 00:00 (inclusive) through the following Monday 00:00 (exclusive). */
export function getWorkoutsThisCalendarWeek(workouts: StoredWorkout[]): StoredWorkout[] {
  const now = new Date()
  const weekStart = startOfWeekMonday(now)
  const weekEndExclusive = new Date(weekStart)
  weekEndExclusive.setDate(weekEndExclusive.getDate() + 7)
  const startMs = weekStart.getTime()
  const endMs = weekEndExclusive.getTime()
  return workouts.filter((w) => {
    const t = new Date(w.completedAt).getTime()
    return t >= startMs && t < endMs
  })
}

/** Workouts completed in the current calendar month (local time). */
export function getWorkoutsThisCalendarMonth(workouts: StoredWorkout[]): StoredWorkout[] {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  const monthEndExclusive = new Date(now.getFullYear(), now.getMonth() + 1, 1, 0, 0, 0, 0)
  const startMs = monthStart.getTime()
  const endMs = monthEndExclusive.getTime()
  return workouts.filter((w) => {
    const t = new Date(w.completedAt).getTime()
    return t >= startMs && t < endMs
  })
}

export function getCurrentStreakWeeks(workouts: StoredWorkout[]): number {
  if (workouts.length === 0) return 0
  const sorted = [...workouts].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  )
  const weekKeys = new Set<string>()
  for (const w of sorted) {
    const d = new Date(w.completedAt)
    const mon = new Date(d)
    mon.setDate(d.getDate() - ((d.getDay() + 6) % 7))
    mon.setHours(0, 0, 0, 0)
    weekKeys.add(mon.getTime().toString())
  }
  const weeks = Array.from(weekKeys).sort((a, b) => Number(b) - Number(a))
  const now = new Date()
  const thisWeekStart = startOfWeekMonday(now)
  let streak = 0
  let expectedMonday = thisWeekStart
  for (const key of weeks) {
    const weekStart = parseInt(key, 10)
    if (weekStart !== expectedMonday.getTime()) break
    streak++
    expectedMonday = previousWeekMondayStart(expectedMonday)
  }
  return streak
}
