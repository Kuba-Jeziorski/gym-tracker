import { routes } from './routes'

export const navItems = [
  { to: routes.dashboard, labelKey: 'nav_dashboard' },
  { to: routes.workout, labelKey: 'nav_workout' },
  { to: routes.history, labelKey: 'nav_history' },
  { to: routes.install, labelKey: 'nav_install' },
  { to: routes.settings, labelKey: 'nav_settings' },
] as const

export const routeTitleKeys: Record<string, string> = {
  [routes.dashboard]: 'titles_dashboard',
  [routes.workout]: 'titles_workout',
  [routes.history]: 'titles_history',
  [routes.install]: 'titles_install',
  [routes.settings]: 'titles_settings',
}
