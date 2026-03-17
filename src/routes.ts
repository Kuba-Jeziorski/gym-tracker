export const routes = {
  dashboard: '/',
  workout: '/workout',
  history: '/history',
  workoutDetail: (id: string) => `/history/${id}`,
  workoutDetailEdit: (id: string) => `/history/${id}/edit`,
  install: '/install',
  settings: '/settings',
} as const
