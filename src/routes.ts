export const routes = {
  auth: '/login',
  dashboard: '/',
  workout: '/workout',
  history: '/history',
  workoutDetail: (id: string) => `/history/${id}`,
  workoutDetailEdit: (id: string) => `/history/${id}/edit`,
  library: '/exercises',
  exerciseHistory: (uniqueName: string) =>
    `/exercises/history/${encodeURIComponent(uniqueName)}`,
  install: '/install',
  user: '/user',
  settings: '/settings',
} as const
