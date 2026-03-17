import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'
import { useCompletedWorkouts } from '../contexts/CompletedWorkoutsContext'
import { routes } from '../routes'
import type { StoredWorkout } from '../data/workoutStorage'
import { cn } from '../lib/utils'

function WorkoutCard({
  workout,
  t,
}: {
  workout: StoredWorkout
  t: (key: string) => string
}) {
  const completedDate = new Date(workout.completedAt)
  const validExercises = workout.exercises.filter((ex) => ex.exerciseUniqueName)
  const exerciseLabels = validExercises
    .map((ex) => t(ex.exerciseUniqueName))
    .slice(0, 3)
  const more = Math.max(0, validExercises.length - 3)

  return (
    <Link
      to={routes.workoutDetail(workout.id)}
      className={cn(
        'block rounded-xl border border-brand-border bg-brand-bg-soft p-4',
        'transition-all duration-200',
        'hover:border-brand-primary hover:bg-brand-primary/5 hover:shadow-md'
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium text-brand-dark">
            {completedDate.toLocaleDateString(undefined, {
              dateStyle: 'medium',
            })}
          </p>
          <p className="text-xs text-brand-text-muted mt-0.5">
            {completedDate.toLocaleTimeString(undefined, {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>
      <ul className="mt-2 text-sm text-brand-text-muted space-y-0.5">
        {exerciseLabels.map((label, i) => (
          <li key={i}>{label}</li>
        ))}
        {more > 0 && (
          <li className="text-brand-text-muted/80">+{more}</li>
        )}
      </ul>
    </Link>
  )
}

export function History() {
  const { t } = useLanguage()
  const { workouts, isLoading } = useCompletedWorkouts()

  const sorted = [...workouts].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  )

  return (
    <div>
      <h1 className="text-2xl font-semibold text-brand-dark mb-2">
        {t('history_title')}
      </h1>
      <p className="text-brand-text-muted mb-6">{t('history_description')}</p>
      {isLoading ? (
        <p className="text-brand-text-muted text-sm">{t('loading')}</p>
      ) : sorted.length === 0 ? (
        <p className="text-brand-text-muted text-sm">{t('history_empty')}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((workout) => (
            <WorkoutCard key={workout.id} workout={workout} t={t} />
          ))}
        </div>
      )}
    </div>
  )
}
