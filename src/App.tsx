import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components/Layout'
import { PageLoader } from './components/PageLoader'
import { routes } from './routes'

const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })))
const MyWorkout = lazy(() => import('./pages/MyWorkout').then((m) => ({ default: m.MyWorkout })))
const WorkoutDetail = lazy(() => import('./pages/WorkoutDetail').then((m) => ({ default: m.WorkoutDetail })))
const WorkoutEdit = lazy(() => import('./pages/WorkoutEdit').then((m) => ({ default: m.WorkoutEdit })))
const Install = lazy(() => import('./pages/Install').then((m) => ({ default: m.Install })))
const Library = lazy(() => import('./pages/Library').then((m) => ({ default: m.Library })))
const User = lazy(() => import('./pages/User').then((m) => ({ default: m.User })))
const Settings = lazy(() => import('./pages/Settings').then((m) => ({ default: m.Settings })))
const NotFound = lazy(() => import('./pages/NotFound').then((m) => ({ default: m.NotFound })))

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageLoader />}>
        <Routes>
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
        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
