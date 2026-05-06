import { useLanguage } from "../contexts/LanguageContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useExerciseNotes } from "../contexts/ExerciseNotesContext";
import type { StoredWorkout } from "../data/workoutStorage";
import { WorkoutExerciseReadonlyBlock } from "./WorkoutExerciseReadonlyBlock";

export function CompletedWorkoutReadonlyContent({
  workout,
}: {
  workout: StoredWorkout;
}) {
  const { t } = useLanguage();
  const allExercises = useAllExercises();
  const { notesByExerciseUniqueName } = useExerciseNotes();

  const getExerciseDisplayName = (uniqueName: string) => {
    const ex = allExercises.find((e) => e.unique_name === uniqueName);
    if (ex)
      return ex.unique_name.startsWith("custom_") ? ex.name : t(ex.unique_name);
    return t(uniqueName);
  };

  const exerciseNotes = workout.exercises
    .map((exercise) => {
      const uniqueName = exercise.exerciseUniqueName;
      return {
        uniqueName,
        displayName: getExerciseDisplayName(uniqueName),
        note: notesByExerciseUniqueName[uniqueName]?.trim() ?? "",
      };
    })
    .filter((item) => item.note)
    .filter(
      (item, index, arr) =>
        arr.findIndex((other) => other.uniqueName === item.uniqueName) ===
        index,
    );

  return (
    <div className="grid grid-cols-1 gap-4">
      {exerciseNotes.length > 0 && (
        <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
          <h2 className="text-base font-medium text-brand-dark mb-2">
            {t("exerciseNote_modalTitle")}
          </h2>
          <div className="space-y-2">
            {exerciseNotes.map((item) => (
              <div key={item.uniqueName}>
                <p className="text-sm font-medium text-brand-dark">
                  {item.displayName}
                </p>
                <p className="text-sm text-brand-text whitespace-pre-wrap">
                  {item.note}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
      <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
        <h2 className="text-base font-medium text-brand-dark mb-2">
          {t("workoutDetail_note")}
        </h2>
        <p className="text-sm text-brand-text whitespace-pre-wrap">
          {workout.notes?.trim() ? workout.notes : t("workoutDetail_noteEmpty")}
        </p>
      </div>
      {workout.exercises
        .filter((ex) => ex.exerciseUniqueName || (ex.sets?.length ?? 0) > 0)
        .map((exercise, index) => (
          <WorkoutExerciseReadonlyBlock
            key={`${exercise.exerciseUniqueName}-${index}`}
            exercise={exercise}
            exerciseConfig={allExercises.find(
              (e) => e.unique_name === exercise.exerciseUniqueName,
            )}
            displayName={getExerciseDisplayName(exercise.exerciseUniqueName)}
          />
        ))}
    </div>
  );
}
