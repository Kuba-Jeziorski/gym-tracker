export const routes = {
  auth: '/login',
  dashboard: '/',
  workout: '/workout',
  /** Used for workout detail/edit URLs only (list is under workout tab). */
  history: '/history',
  workoutDetail: (id: string) => `/history/${id}`,
  workoutDetailEdit: (id: string) => `/history/${id}/edit`,
  /** Exercises + Templates (Library) page. */
  library: '/exercises',
  /** All logged sets for one exercise (unique_name URL-encoded). */
  exerciseHistory: (uniqueName: string) =>
    `/exercises/history/${encodeURIComponent(uniqueName)}`,
  install: '/install',
  user: '/user',
  settings: '/settings',
} as const
