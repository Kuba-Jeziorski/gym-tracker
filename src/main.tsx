import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { CurrentWorkoutProvider } from './contexts/CurrentWorkoutContext'
import { AccountPreferencesProvider } from './contexts/AccountPreferencesContext'
import { CompletedWorkoutsProvider } from './contexts/CompletedWorkoutsContext'
import { CustomExercisesProvider } from './contexts/CustomExercisesContext'
import { WorkoutTemplatesProvider } from './contexts/WorkoutTemplatesContext'
import './index.css'
import App from './App.tsx'

const queryClient = new QueryClient()

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
        <AccountPreferencesProvider>
          <CompletedWorkoutsProvider>
            <CustomExercisesProvider>
              <WorkoutTemplatesProvider>
                <CurrentWorkoutProvider>
                  <App />
                </CurrentWorkoutProvider>
              </WorkoutTemplatesProvider>
            </CustomExercisesProvider>
          </CompletedWorkoutsProvider>
        </AccountPreferencesProvider>
      </AuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
