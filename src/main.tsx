import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { CurrentWorkoutProvider } from './contexts/CurrentWorkoutContext'
import { LanguageProvider } from './contexts/LanguageContext'
import { WeightUnitProvider } from './contexts/WeightUnitContext'
import { UserProfileProvider } from './contexts/UserProfileContext'
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
      <LanguageProvider>
        <WeightUnitProvider>
          <UserProfileProvider>
          <CompletedWorkoutsProvider>
            <CustomExercisesProvider>
              <WorkoutTemplatesProvider>
                <CurrentWorkoutProvider>
                  <App />
                </CurrentWorkoutProvider>
              </WorkoutTemplatesProvider>
            </CustomExercisesProvider>
          </CompletedWorkoutsProvider>
          </UserProfileProvider>
        </WeightUnitProvider>
      </LanguageProvider>
    </QueryClientProvider>
  </StrictMode>,
)
