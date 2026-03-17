import { routes } from '../routes'
import { routeTitleKeys } from '../navConfig'

export function getPageTitleKey(pathname: string): string {
  if (pathname === routes.dashboard) return routeTitleKeys[routes.dashboard]
  if (pathname.endsWith('/edit')) return 'titles_workoutDetailEdit'
  if (pathname.startsWith('/history/') && pathname !== '/history') return 'titles_workoutDetail'
  const base = pathname.split('/').filter(Boolean)[0]
  const key = base ? `/${base}` : routes.dashboard
  return routeTitleKeys[key] ?? 'titles_dashboard'
}
