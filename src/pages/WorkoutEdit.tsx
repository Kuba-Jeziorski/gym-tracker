import { useEffect, useMemo, useState } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useFavoriteExercises } from "../contexts/FavoriteExercisesContext";
import { useExerciseNotes } from "../contexts/ExerciseNotesContext";
import type { StoredWorkout } from "../data/workoutStorage";
import {
  storedKgToDisplay,
  inputWeightToKg,
} from "../helpers/weightConversion";
import {
  parseAvgVelocityKmh,
  parseDistanceKm,
  parseDurationToSeconds,
  parsePaceToMinPerKm,
} from "../helpers/kinematics";
import { routes } from "../routes";
import { Select } from "../components/Select";
import { Switch } from "../components/Switch";
import { ConfirmModal } from "../components/ConfirmModal";
import { cn } from "../lib/utils";
import {
  preventViewportZoomOnInputFocus,
  restoreViewportAfterInputBlur,
} from "../helpers/restoreViewportAfterInputBlur";
import {
  buildSortedExerciseSelectOptions,
  filterExerciseOptionsForPicker,
  withSelectedExerciseOption,
} from "../helpers/exerciseSelectOptions";

import type { UseFormRegisterReturn } from "react-hook-form";

type SetValues = {
  weight?: string;
  reps?: string;
  time?: string;
  distance?: string;
  avgVelocity?: string;
  pace?: string;
};

type WorkoutExercise = {
  exerciseUniqueName: string;
  sets: SetValues[];
};

type WorkoutFormValues = {
  completedAt: string;
  notes: string;
  exercises: WorkoutExercise[];
};

function toDatetimeLocalValue(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  const [datePart, timePart] = value.split("T");
  if (!datePart || !timePart) return null;

  const [y, m, d] = datePart.split("-").map((x) => Number(x));
  const [hh, mm] = timePart.split(":").map((x) => Number(x));

  if ([y, m, d, hh, mm].some((n) => Number.isNaN(n))) return null;

  const dt = new Date(y, m - 1, d, hh, mm, 0, 0);
  return dt.toISOString();
}

function startedAtForCompletedAt(
  previousStartedAt: string,
  completedAtIso: string,
): string {
  const completed = new Date(completedAtIso).getTime();
  const started = new Date(previousStartedAt).getTime();
  if (Number.isNaN(completed) || Number.isNaN(started) || completed > started) {
    return previousStartedAt;
  }
  const oneHourMs = 60 * 60 * 1000;
  return new Date(Math.max(0, completed - oneHourMs)).toISOString();
}

const defaultSet = (): SetValues => ({
  weight: "",
  reps: "",
  time: "",
  distance: "",
  avgVelocity: "",
  pace: "",
});

function isEmptySet(s: SetValues): boolean {
  return (
    !(s.weight?.trim() ?? "") &&
    !(s.reps?.trim() ?? "") &&
    !(s.time?.trim() ?? "") &&
    !(s.distance?.trim() ?? "") &&
    !(s.avgVelocity?.trim() ?? "") &&
    !(s.pace?.trim() ?? "")
  );
}

function canAddSet(
  exercises: {
    weight?: boolean;
    reps?: boolean;
    time?: boolean;
    distance?: boolean;
    avgVelocity?: boolean;
    pace?: boolean;
    unique_name: string;
  }[],
  sets: SetValues[],
  exerciseUniqueName: string,
): boolean {
  if (sets.length === 0) return true;
  const exercise = exercises.find((e) => e.unique_name === exerciseUniqueName);
  if (!exercise) return false;
  const last = sets[sets.length - 1];
  if (exercise.weight && !last.weight?.trim()) return false;
  if (exercise.reps && !last.reps?.trim()) return false;
  const isKinematics =
    Boolean(exercise.distance) ||
    Boolean(exercise.avgVelocity) ||
    Boolean(exercise.pace);

  if (isKinematics) {
    const durationSec = exercise.time
      ? parseDurationToSeconds(last.time ?? "")
      : null;
    const distanceKm = exercise.distance ? parseDistanceKm(last.distance ?? "") : null;
    const avgVelocityKmh = exercise.avgVelocity
      ? parseAvgVelocityKmh(last.avgVelocity ?? "")
      : null;
    const paceMinPerKm = exercise.pace ? parsePaceToMinPerKm(last.pace ?? "") : null;

    if (durationSec != null && avgVelocityKmh != null) return true;
    if (durationSec != null && paceMinPerKm != null) return true;
    if (distanceKm != null && avgVelocityKmh != null) return true;
    if (distanceKm != null && paceMinPerKm != null) return true;
    if (durationSec != null && distanceKm != null) return true;
    return false;
  }

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
  const allExercises = useAllExercises();
  const { notesByExerciseUniqueName } = useExerciseNotes();
  const {
    favoriteIdSet,
    pickerFavoritesOnly,
    setPickerFavoritesOnly,
  } = useFavoriteExercises();
  const [removeSetTarget, setRemoveSetTarget] = useState<{
    exerciseIndex: number;
    setIndex: number;
  } | null>(null);
  const [showEmptySetsError, setShowEmptySetsError] = useState(false);

  const { control, register, watch, handleSubmit, setValue, reset } =
    useForm<WorkoutFormValues>({
      defaultValues: { completedAt: "", notes: "", exercises: [] },
    });

  function mergeRegisterWithViewportClamping(field: UseFormRegisterReturn) {
    return {
      ...field,
      onFocus: () => {
        preventViewportZoomOnInputFocus();
      },
      onBlur: (e) => {
        const r = (
          field as unknown as { onBlur?: (ev: unknown) => unknown }
        ).onBlur?.(e);
        restoreViewportAfterInputBlur();
        return r;
      },
    } as UseFormRegisterReturn;
  }

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
  } = useFieldArray({
    control,
    name: "exercises",
  });

  const watchedExercises = watch("exercises");
  const hasEmptySetsInForm = (watchedExercises ?? []).some((ex) =>
    (ex.sets ?? []).some(isEmptySet),
  );

  useEffect(() => {
    if (!hasEmptySetsInForm) setShowEmptySetsError(false);
  }, [hasEmptySetsInForm]);

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
              distance: s.distance ?? "",
              avgVelocity: s.avgVelocity ?? "",
              pace: s.pace ?? "",
            }))
          : [defaultSet()],
    }));
    if (formExercises.length === 0) {
      formExercises.push({ exerciseUniqueName: "", sets: [defaultSet()] });
    }
    reset({
      completedAt: toDatetimeLocalValue(workout.completedAt),
      notes: workout.notes ?? "",
      exercises: formExercises,
    });
  }, [workout, weightUnit, reset]);

  const fullExerciseOptions = useMemo(
    () => buildSortedExerciseSelectOptions(allExercises, t),
    [allExercises, t],
  );

  const pickerExerciseOptions = useMemo(
    () =>
      filterExerciseOptionsForPicker(
        fullExerciseOptions,
        favoriteIdSet,
        pickerFavoritesOnly,
      ),
    [fullExerciseOptions, favoriteIdSet, pickerFavoritesOnly],
  );
  const getExerciseDisplayName = useMemo(
    () => (uniqueName: string) => {
      const ex = allExercises.find((item) => item.unique_name === uniqueName);
      if (ex) {
        return ex.unique_name.startsWith("custom_") ? ex.name : t(ex.unique_name);
      }
      return t(uniqueName);
    },
    [allExercises, t],
  );
  const exerciseNotes = (workout?.exercises ?? [])
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
        arr.findIndex((other) => other.uniqueName === item.uniqueName) === index,
    );

  const onSave = handleSubmit(async (data) => {
    if (!id || !workout) return;
    if (hasEmptySetsInForm) {
      setShowEmptySetsError(true);
      return;
    }
    const completedAt = datetimeLocalToIso(data.completedAt);
    if (!completedAt) return;
    const startedAt = startedAtForCompletedAt(workout.startedAt, completedAt);
    const updated: StoredWorkout = {
      ...workout,
      startedAt,
      completedAt,
      notes: data.notes?.trim() ?? "",
      exercises: data.exercises.map((ex) => {
        const mapped = (ex.sets ?? []).map((s) => ({
          weight: inputWeightToKg(s.weight ?? "", weightUnit),
          reps: s.reps ?? "",
          time: s.time ?? "",
          distance: s.distance ?? "",
          avgVelocity: s.avgVelocity ?? "",
          pace: s.pace ?? "",
        }));
        return {
          exerciseUniqueName: ex.exerciseUniqueName,
          sets: mapped.filter((s) => !isEmptySet(s)),
        };
      }),
    };
    await updateWorkout(id, updated);
    navigate(routes.workoutDetail(id));
  });

  if (!id) {
    return (
      <div>
        <Link
          to={routes.workout}
          state={{ tab: "completed" }}
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
          to={routes.workout}
          state={{ tab: "completed" }}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
        >
          ← {t("workoutDetail_back")}
        </Link>
        <p className="text-brand-text-muted">{t("notFound_message")}</p>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-4">
        <Link
          to={routes.workoutDetail(id)}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-2 inline-block"
        >
          ← {t("workoutDetail_back")}
        </Link>
        <h1 className="text-2xl font-semibold text-brand-dark">
          {t("titles_workoutDetailEdit")}
        </h1>
      </header>
      {exerciseNotes.length > 0 && (
        <div className="rounded-lg border border-brand-border bg-brand-bg p-4 mb-4">
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

      <div className="rounded-lg border border-brand-border bg-brand-bg-soft p-4 mb-4">
        <form id="workout-edit-form" onSubmit={onSave} className="space-y-6">
          <div>
            <label
              htmlFor="workout-edit-completed-at"
              className="block text-sm font-medium text-brand-dark mb-1.5"
            >
              {t("workoutEdit_completedAt")}
            </label>
            <input
              id="workout-edit-completed-at"
              type="datetime-local"
              step={60}
              {...mergeRegisterWithViewportClamping(
                register("completedAt", { required: true }),
              )}
              className="max-w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text"
            />
            <p className="text-brand-text-muted text-xs mt-1.5">
              {t("workoutEdit_completedAtHint")}
            </p>
          </div>
          <div>
            <label
              htmlFor="workout-edit-note"
              className="block text-sm font-medium text-brand-dark mb-1.5"
            >
              {t("workoutDetail_note")}
            </label>
            <textarea
              id="workout-edit-note"
              rows={4}
              {...mergeRegisterWithViewportClamping(register("notes"))}
              placeholder={t("workout_finishModalNotePlaceholder")}
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
            />
          </div>

          <div className="flex flex-col gap-1">
            <Switch
              checked={pickerFavoritesOnly}
              onChange={setPickerFavoritesOnly}
              disabled={favoriteIdSet.size === 0}
              label={t("exercisePicker_favoritesOnly")}
            />
            {favoriteIdSet.size === 0 && (
              <p className="text-xs text-brand-text-muted max-w-xl">
                {t("exercisePicker_favoritesOnlyDisabledHint")}
              </p>
            )}
          </div>

          {exerciseFields.map((field, index) => {
            const exerciseUniqueName =
              watchedExercises?.[index]?.exerciseUniqueName ?? "";
            const exercise = allExercises.find(
              (e) => e.unique_name === exerciseUniqueName,
            );
            const sets = watchedExercises?.[index]?.sets ?? [];
            const exerciseSelectOptions = withSelectedExerciseOption(
              pickerExerciseOptions,
              exerciseUniqueName,
              fullExerciseOptions,
            );

            return (
              <div
                key={field.id}
                className="rounded-lg border border-brand-border bg-brand-bg p-4 space-y-3"
              >
                <div className="flex justify-end -mt-0.5">
                  <button
                    type="button"
                    onClick={() => removeExercise(index)}
                    className="text-sm text-brand-text-muted hover:text-red-400 transition-colors"
                  >
                    {t("workout_removeExercise")}
                  </button>
                </div>
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
                        className="min-w-[20rem] xs:min-w-0 xs:w-full"
                      />
                    )}
                  />
                </div>

                {exercise && (
                  <div className="space-y-2">
                    {(sets as SetValues[]).map((_, setIndex) => (
                        <div key={setIndex} className="text-sm space-y-1.5">
                          <div className="flex justify-end">
                            <button
                              type="button"
                              onClick={() =>
                                setRemoveSetTarget({
                                  exerciseIndex: index,
                                  setIndex,
                                })
                              }
                              className="text-sm text-brand-text-muted hover:text-red-400 transition-colors"
                            >
                              {t("workout_removeSet")}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 gap-y-2">
                            {exercise.weight && (
                              <div className="flex items-center gap-1.5 mr-5">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportClamping(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.weight` as const,
                                    ),
                                  )}
                                  inputMode="decimal"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
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
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportClamping(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.reps` as const,
                                    ),
                                  )}
                                  inputMode="numeric"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
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
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportClamping(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.time` as const,
                                    ),
                                  )}
                                  inputMode="text"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9:.,]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_s")}
                                </span>
                              </div>
                            )}
                            {exercise.distance && (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportClamping(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.distance` as const,
                                    ),
                                  )}
                                  inputMode="decimal"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_km")}
                                </span>
                              </div>
                            )}
                            {exercise.avgVelocity && (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportClamping(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.avgVelocity` as const,
                                    ),
                                  )}
                                  inputMode="decimal"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_kmh")}
                                </span>
                              </div>
                            )}
                            {exercise.pace && (
                              <div className="flex items-center gap-1.5">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportClamping(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.pace` as const,
                                    ),
                                  )}
                                  inputMode="text"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9:.,]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_min_per_km")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                    ))}
                    <button
                      type="button"
                      disabled={
                        !canAddSet(
                          allExercises,
                          sets as SetValues[],
                          exerciseUniqueName,
                        )
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
                        canAddSet(
                          allExercises,
                          sets as SetValues[],
                          exerciseUniqueName,
                        )
                          ? "border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                          : "border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed",
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

      {showEmptySetsError && hasEmptySetsInForm && (
        <p className="text-sm text-red-400 mt-2">
          {t("workout_noEmptySetsMessage")}
        </p>
      )}

      <footer className="flex gap-3 mt-4 pt-4 border-t border-brand-border">
        <button
          type="submit"
          form="workout-edit-form"
          className="px-4 py-2 rounded-lg font-medium hover:bg-brand-primary-hover transition-colors duration-300 bg-brand-primary text-brand-bg"
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
