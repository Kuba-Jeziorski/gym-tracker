import { useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useCurrentWorkout } from "../contexts/CurrentWorkoutContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { exercises } from "../data/exercises";
import type { StoredWorkout } from "../data/workoutStorage";
import { inputWeightToKg } from "../helpers/weightConversion";
import { Select } from "../components/Select";
import { ConfirmModal } from "../components/ConfirmModal";
import { cn } from "../lib/utils";

type SetValues = {
  weight?: string;
  reps?: string;
  time?: string;
};

type WorkoutExercise = {
  exerciseUniqueName: string;
  sets: SetValues[];
};

type WorkoutFormValues = {
  exercises: WorkoutExercise[];
};

const defaultSet = (): SetValues => ({ weight: "", reps: "", time: "" });

function canAddSet(sets: SetValues[], exerciseUniqueName: string): boolean {
  if (sets.length === 0) return true;
  const exercise = exercises.find((e) => e.unique_name === exerciseUniqueName);
  if (!exercise) return false;
  const last = sets[sets.length - 1];
  if (exercise.weight && !last.weight?.trim()) return false;
  if (exercise.reps && !last.reps?.trim()) return false;
  if (exercise.time && !last.time?.trim()) return false;
  return true;
}

export function Workout() {
  const { currentWorkout, startWorkout, endWorkout } = useCurrentWorkout();
  const { t } = useLanguage();
  const { weightUnit } = useWeightUnit();
  const { appendWorkout } = useCompletedWorkouts();
  const [discardModalOpen, setDiscardModalOpen] = useState(false);

  const { control, register, watch, handleSubmit, setValue } =
    useForm<WorkoutFormValues>({
      defaultValues: { exercises: [] },
    });

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control,
    name: "exercises",
  });

  const watchedExercises = watch("exercises");

  const exerciseSelectOptions = exercises.map((ex) => ({
    value: ex.unique_name,
    label: t(ex.unique_name),
  }));

  const onFinish = handleSubmit((data) => {
    const stored: StoredWorkout = {
      id: currentWorkout!.id,
      startedAt: currentWorkout!.startedAt,
      completedAt: new Date().toISOString(),
      exercises: data.exercises.map((ex) => ({
        exerciseUniqueName: ex.exerciseUniqueName,
        sets: (ex.sets ?? []).map((s) => ({
          weight: inputWeightToKg(s.weight ?? "", weightUnit),
          reps: s.reps ?? "",
          time: s.time ?? "",
        })),
      })),
    };
    appendWorkout(stored);
    endWorkout();
  });

  const onDiscardClick = () => setDiscardModalOpen(true);
  const onDiscardConfirm = () => {
    setDiscardModalOpen(false);
    endWorkout();
  };
  const onDiscardCancel = () => setDiscardModalOpen(false);

  if (!currentWorkout) {
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("workout_title")}
        </h1>
        <p className="text-brand-text-muted mb-6">{t("workout_noWorkout")}</p>
        <button
          type="button"
          onClick={startWorkout}
          className="px-4 py-2 rounded-lg bg-brand-primary text-brand-bg font-medium hover:bg-brand-primary-hover transition-colors duration-300"
        >
          {t("workout_start")}
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-brand-dark mb-1">
          {t("workout_title")}
        </h1>
        <p className="text-brand-text-muted text-sm">
          {t("workout_startedAt")}{" "}
          {new Date(currentWorkout.startedAt).toLocaleString()}.
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-brand-border bg-brand-bg-soft p-4">
        <div className="space-y-6">
          {exerciseFields.map((field, index) => {
            const exerciseUniqueName =
              watchedExercises?.[index]?.exerciseUniqueName ?? "";
            const exercise = exercises.find(
              (e) => e.unique_name === exerciseUniqueName,
            );
            const sets = watchedExercises?.[index]?.sets ?? [];

            return (
              <div
                key={field.id}
                className="rounded-lg border border-brand-border bg-brand-bg p-4 space-y-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <label className="text-sm font-medium text-brand-dark shrink-0">
                    {t("workout_exercise")}
                  </label>
                  <Controller
                    control={control}
                    name={`exercises.${index}.exerciseUniqueName` as const}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onChange={field.onChange}
                        options={exerciseSelectOptions}
                        placeholder="—"
                        className="min-w-[20rem]"
                      />
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-brand-text-muted hover:text-brand-text text-sm"
                  >
                    {t("workout_remove")}
                  </button>
                </div>

                {exercise && (
                  <div className="space-y-2">
                    {(sets as SetValues[]).map((_, setIndex) => {
                      const prevSet =
                        setIndex > 0
                          ? (sets as SetValues[])[setIndex - 1]
                          : null;
                      const weightPlaceholder =
                        prevSet?.weight?.trim() ||
                        t("workout_weight");
                      const repsPlaceholder =
                        prevSet?.reps?.trim() || t("workout_reps");
                      const timePlaceholder =
                        prevSet?.time?.trim() || t("workout_time");
                      return (
                        <div
                          key={setIndex}
                          className="flex flex-wrap items-center gap-2 gap-y-2 text-sm"
                        >
                          {exercise.weight && (
                            <div className="flex items-center gap-1.5 mr-5">
                              <input
                                type="number"
                                placeholder={weightPlaceholder}
                                {...register(
                                  `exercises.${index}.sets.${setIndex}.weight` as const,
                                )}
                                className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                              />
                              <span className="text-brand-text-muted text-sm shrink-0">
                                {t(
                                  weightUnit === "kg" ? "unit_kg" : "unit_lb",
                                )}
                              </span>
                            </div>
                          )}
                          {exercise.reps && (
                            <>
                              <input
                                type="number"
                                placeholder={repsPlaceholder}
                                {...register(
                                  `exercises.${index}.sets.${setIndex}.reps` as const,
                                )}
                                className="min-w-[4rem] w-24 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                              />
                              <span className="text-brand-text-muted text-sm shrink-0">
                                {t("workout_reps")}
                              </span>
                            </>
                          )}
                          {exercise.time && (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                placeholder={timePlaceholder}
                                {...register(
                                  `exercises.${index}.sets.${setIndex}.time` as const,
                                )}
                                className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                              />
                              <span className="text-brand-text-muted text-sm shrink-0">
                                (s)
                              </span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      disabled={
                        !canAddSet(sets as SetValues[], exerciseUniqueName)
                      }
                      onClick={() => {
                        const nextSet = defaultSet();
                        const all = watch("exercises") ?? [];
                        const updated = all.map((ex, i) =>
                          i === index
                            ? { ...ex, sets: [...(ex.sets ?? []), nextSet] }
                            : ex,
                        );
                        setValue("exercises", updated);
                      }}
                      className={cn(
                        "text-sm rounded px-2 py-1 border transition-colors",
                        canAddSet(sets as SetValues[], exerciseUniqueName)
                          ? "border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                          : "border-brand-border text-brand-text-muted cursor-not-allowed",
                      )}
                    >
                      {t("workout_addSet")}
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          <button
            type="button"
            onClick={() =>
              appendExercise({
                exerciseUniqueName: "",
                sets: [defaultSet()],
              })
            }
            className="w-full rounded-lg border border-dashed border-brand-border py-3 text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition-colors text-sm font-medium"
          >
            + {t("workout_addExercise")}
          </button>
        </div>
      </div>

      <footer className="shrink-0 flex gap-3 mt-4 pt-4 border-t border-brand-border">
        <button
          type="button"
          onClick={onFinish}
          className="px-4 py-2 rounded-lg bg-brand-primary text-brand-bg font-medium hover:bg-brand-primary-hover transition-colors duration-300"
        >
          {t("workout_finish")}
        </button>
        <button
          type="button"
          onClick={onDiscardClick}
          className="px-4 py-2 rounded-lg border border-brand-border text-brand-text hover:bg-brand-bg-soft transition-colors duration-300"
        >
          {t("workout_discard")}
        </button>
      </footer>
      <ConfirmModal
        open={discardModalOpen}
        title={t("workout_discardConfirmTitle")}
        message={t("workout_discardConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={onDiscardConfirm}
        onCancel={onDiscardCancel}
        variant="danger"
      />
    </div>
  );
}
