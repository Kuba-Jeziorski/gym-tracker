import { routes } from './routes'

export const navItems = [
  { to: routes.dashboard, labelKey: 'nav_dashboard' },
  { to: routes.workout, labelKey: 'nav_myWorkout' },
  { to: routes.library, labelKey: 'nav_library' },
  { to: routes.install, labelKey: 'nav_install' },
  { to: routes.user, labelKey: 'nav_user' },
  { to: routes.settings, labelKey: 'nav_settings' },
] as const

export const routeTitleKeys: Record<string, string> = {
  [routes.dashboard]: 'titles_dashboard',
  [routes.workout]: 'titles_myWorkout',
  [routes.library]: 'titles_library',
  [routes.install]: 'titles_install',
  [routes.user]: 'titles_user',
  [routes.settings]: 'titles_settings',
}
