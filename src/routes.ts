export const routes = {
  dashboard: '/',
  workout: '/workout',
  /** Used for workout detail/edit URLs only (list is under workout tab). */
  history: '/history',
  workoutDetail: (id: string) => `/history/${id}`,
  workoutDetailEdit: (id: string) => `/history/${id}/edit`,
  /** Exercises + Templates (Library) page. */
  library: '/exercises',
  install: '/install',
  user: '/user',
  settings: '/settings',
} as const
