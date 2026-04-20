import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { CurrentWorkoutProvider } from './contexts/CurrentWorkoutContext'
import { AccountPreferencesProvider } from './contexts/AccountPreferencesContext'
import { CompletedWorkoutsProvider } from './contexts/CompletedWorkoutsContext'
import { CustomExercisesProvider } from './contexts/CustomExercisesContext'
import { FavoriteExercisesProvider } from './contexts/FavoriteExercisesContext'
import { WorkoutTemplatesProvider } from './contexts/WorkoutTemplatesContext'
import { ExerciseNotesProvider } from './contexts/ExerciseNotesContext'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
    })
  })
}

let container = document.getElementById('root')

if (!container) {
  container = document.createElement('div')
  container.id = 'root'
  document.body.appendChild(container)
}

createRoot(container).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <FavoriteExercisesProvider>
          <AccountPreferencesProvider>
            <CompletedWorkoutsProvider>
              <CustomExercisesProvider>
                <ExerciseNotesProvider>
                  <WorkoutTemplatesProvider>
                    <CurrentWorkoutProvider>
                      <App />
                    </CurrentWorkoutProvider>
                  </WorkoutTemplatesProvider>
                </ExerciseNotesProvider>
              </CustomExercisesProvider>
            </CompletedWorkoutsProvider>
          </AccountPreferencesProvider>
        </FavoriteExercisesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
