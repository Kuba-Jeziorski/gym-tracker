import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageLoader } from './components/PageLoader'
import { routes } from './routes'
import { useAuth } from './contexts/AuthContext'

const Auth = lazy(() => import('./pages/Auth').then((m) => ({ default: m.Auth })))
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const MyWorkout = lazy(() => import('./pages/MyWorkout').then((m) => ({ default: m.MyWorkout })))
const WorkoutDetail = lazy(() => import('./pages/WorkoutDetail').then((m) => ({ default: m.WorkoutDetail })))
const WorkoutEdit = lazy(() => import('./pages/WorkoutEdit').then((m) => ({ default: m.WorkoutEdit })))
const Install = lazy(() => import('./pages/Install').then((m) => ({ default: m.Install })))
const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })))
const User = lazy(() => import('./pages/User').then((m) => ({ default: m.User })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function ProtectedWrapper() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (!user) return <Navigate to={routes.auth} replace />
  return <Outlet />
}

function PublicAuthRoute() {
  const { user, loading } = useAuth()
  if (loading) return <PageLoader />
  if (user) return <Navigate to={routes.dashboard} replace />
  return <Auth />
}

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path={routes.auth} element={<PublicAuthRoute />} />
          <Route element={<ProtectedWrapper />}>
            <Route path={routes.dashboard} element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="workout" element={<MyWorkout />} />
              <Route path="history/:id" element={<WorkoutDetail />} />
              <Route path="history/:id/edit" element={<WorkoutEdit />} />
              <Route path="exercises" element={<Library />} />
              <Route path="install" element={<Install />} />
              <Route path="user" element={<User />} />
              <Route path="settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
