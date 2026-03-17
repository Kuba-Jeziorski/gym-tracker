import { useEffect, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useParams, Link, useNavigate } from "react-router-dom";
import { CircleMinus } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { exercises } from "../data/exercises";
import type { StoredWorkout } from "../data/workoutStorage";
import {
  storedKgToDisplay,
  inputWeightToKg,
} from "../helpers/weightConversion";
import { routes } from "../routes";
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

function isEmptySet(s: SetValues): boolean {
  return (
    !(s.weight?.trim() ?? "") &&
    !(s.reps?.trim() ?? "") &&
    !(s.time?.trim() ?? "")
  );
}

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

export function WorkoutEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { weightUnit } = useWeightUnit();
  const { workouts, updateWorkout } = useCompletedWorkouts();

  const workout = id ? workouts.find((w) => w.id === id) : null;
  const [removeSetTarget, setRemoveSetTarget] = useState<{
    exerciseIndex: number;
    setIndex: number;
  } | null>(null);

  const { control, register, watch, handleSubmit, setValue, reset } =
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

  useEffect(() => {
    if (!workout) return;
    const formExercises: WorkoutExercise[] = workout.exercises.map((ex) => ({
      exerciseUniqueName: ex.exerciseUniqueName ?? "",
      sets:
        ex.sets?.length > 0
          ? ex.sets.map((s) => ({
              weight: storedKgToDisplay(s.weight ?? "", weightUnit),
              reps: s.reps ?? "",
              time: s.time ?? "",
            }))
          : [defaultSet()],
    }));
    if (formExercises.length === 0) {
      formExercises.push({ exerciseUniqueName: "", sets: [defaultSet()] });
    }
    reset({ exercises: formExercises });
  }, [workout, weightUnit, reset]);

  const exerciseSelectOptions = exercises.map((ex) => ({
    value: ex.unique_name,
    label: t(ex.unique_name),
  }));

  const onSave = handleSubmit((data) => {
    if (!id || !workout) return;
    const updated: StoredWorkout = {
      ...workout,
      exercises: data.exercises.map((ex) => {
        const mapped = (ex.sets ?? []).map((s) => ({
          weight: inputWeightToKg(s.weight ?? "", weightUnit),
          reps: s.reps ?? "",
          time: s.time ?? "",
        }));
        return {
          exerciseUniqueName: ex.exerciseUniqueName,
          sets: mapped.filter((s) => !isEmptySet(s)),
        };
      }),
    };
    updateWorkout(id, updated);
    navigate(routes.workoutDetail(id));
  });

  if (!id) {
    return (
      <div>
        <Link
          to={routes.history}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
        >
          ← {t("workoutDetail_back")}
        </Link>
        <p className="text-brand-text-muted">
          {t("workoutDetail_description")}
        </p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div>
        <Link
          to={routes.history}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
        >
          ← {t("workoutDetail_back")}
        </Link>
        <p className="text-brand-text-muted">{t("notFound_message")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <header className="shrink-0 mb-4">
        <Link
          to={routes.workoutDetail(id)}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-2 inline-block"
        >
          ← {t("workoutDetail_back")}
        </Link>
        <h1 className="text-2xl font-semibold text-brand-dark">
          {t("titles_workoutDetailEdit")}
        </h1>
        <p className="text-brand-text-muted text-sm">
          {new Date(workout.completedAt).toLocaleDateString(undefined, {
            dateStyle: "medium",
          })}
        </p>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-brand-border bg-brand-bg-soft p-4">
        <form id="workout-edit-form" onSubmit={onSave} className="space-y-6">
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
                    render={({ field: f }) => (
                      <Select
                        value={f.value}
                        onChange={f.onChange}
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
                        prevSet?.weight?.trim() || t("workout_weight");
                      const repsPlaceholder =
                        prevSet?.reps?.trim() || t("workout_reps");
                      const timePlaceholder =
                        prevSet?.time?.trim() || t("workout_time");
                      return (
                        <div
                          key={setIndex}
                          className="flex flex-wrap items-center gap-2 gap-y-2 text-sm"
                        >
                          <button
                            type="button"
                            onClick={() =>
                              setRemoveSetTarget({ exerciseIndex: index, setIndex })
                            }
                            className={cn(
                              "shrink-0 rounded p-1 transition-colors",
                              "text-brand-text-muted hover:text-red-400 active:text-red-400 focus-visible:text-red-400 focus-visible:outline-none",
                            )}
                            title={t("workout_removeSet")}
                            aria-label={t("workout_removeSet")}
                          >
                            <CircleMinus className="size-5" />
                          </button>
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
                                {t(weightUnit === "kg" ? "unit_kg" : "unit_lb")}
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
                                className="min-w-[8rem] w-24 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
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
                        const all = watch("exercises") ?? [];
                        const updated = all.map((ex, i) =>
                          i === index
                            ? {
                                ...ex,
                                sets: [...(ex.sets ?? []), defaultSet()],
                              }
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
        </form>
      </div>

      <footer className="shrink-0 flex gap-3 mt-4 pt-4 border-t border-brand-border">
        <button
          type="submit"
          form="workout-edit-form"
          className="px-4 py-2 rounded-lg bg-brand-primary text-brand-bg font-medium hover:bg-brand-primary-hover transition-colors duration-300"
        >
          {t("workoutEdit_save")}
        </button>
        <Link
          to={routes.workoutDetail(id)}
          className="px-4 py-2 rounded-lg border border-brand-border text-brand-text hover:bg-brand-bg-soft transition-colors duration-300 inline-block"
        >
          {t("workoutEdit_cancel")}
        </Link>
      </footer>
      <ConfirmModal
        open={removeSetTarget !== null}
        title={t("workout_removeSetConfirmTitle")}
        message={t("workout_removeSetConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={() => {
          if (removeSetTarget === null) return;
          const { exerciseIndex, setIndex } = removeSetTarget;
          const all = watch("exercises") ?? [];
          const currentSets = all[exerciseIndex]?.sets ?? [];
          const newSets = currentSets.filter((_, i) => i !== setIndex);
          const updated = all.map((ex, i) =>
            i === exerciseIndex
              ? {
                  ...ex,
                  sets: newSets.length > 0 ? newSets : [defaultSet()],
                }
              : ex,
          );
          setValue("exercises", updated);
          setRemoveSetTarget(null);
        }}
        onCancel={() => setRemoveSetTarget(null)}
        variant="danger"
      />
    </div>
  );
}
