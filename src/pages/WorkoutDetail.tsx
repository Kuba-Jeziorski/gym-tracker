import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import { routes } from "../routes";
import type { StoredWorkoutExercise, StoredSet } from "../data/workoutStorage";
import type { Exercise } from "../data/exercises";
import { ConfirmModal } from "../components/ConfirmModal";
import { formatStoredWeightForDisplay } from "../helpers/weightConversion";
import {
  deriveKinematicsFromSet,
  formatKm,
  formatKmh,
  formatPaceMinPerKm,
  formatSecondsAsMmSs,
} from "../helpers/kinematics";

function ExerciseBlock({
  exercise,
  exerciseConfig,
  displayName,
  t,
  weightUnit,
}: {
  exercise: StoredWorkoutExercise;
  exerciseConfig?: Exercise;
  displayName: string;
  t: (key: string) => string;
  weightUnit: "kg" | "lb";
}) {
  const sets = exercise.sets ?? [];
  const hasWeight = sets.some((s) => s.weight != null && s.weight !== "");
  const hasReps = sets.some((s) => s.reps != null && s.reps !== "");
  const hasTime = sets.some((s) => s.time != null && s.time !== "");
  const hasDistance = sets.some(
    (s) => s.distance != null && s.distance !== "",
  );
  const hasAvgVelocity = sets.some(
    (s) => s.avgVelocity != null && s.avgVelocity !== "",
  );
  const hasPace = sets.some((s) => s.pace != null && s.pace !== "");

  const showWeight = Boolean(exerciseConfig?.weight) || hasWeight;
  const showReps = Boolean(exerciseConfig?.reps) || hasReps;
  const showTime = Boolean(exerciseConfig?.time) || hasTime;
  const showDistance = Boolean(exerciseConfig?.distance) || hasDistance;
  const showAvgVelocity =
    Boolean(exerciseConfig?.avgVelocity) || hasAvgVelocity;
  const showPace = Boolean(exerciseConfig?.pace) || hasPace;

  return (
    <div className="rounded-lg border border-brand-border bg-brand-bg p-4">
      <h3 className="text-base font-medium text-brand-dark mb-3">
        {displayName || "—"}
      </h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-brand-border text-brand-text-muted">
              <th className="py-2 pr-4 font-medium">#</th>
              {showWeight && (
                <th className="py-2 pr-4 font-medium">
                  {t("workout_weight")} (
                  {t(weightUnit === "kg" ? "unit_kg" : "unit_lb")})
                </th>
              )}
              {showReps && (
                <th className="py-2 pr-4 font-medium">{t("workout_reps")}</th>
              )}
              {showTime && (
                <th className="py-2 font-medium">{t("workout_time")}</th>
              )}
              {showDistance && (
                <th className="py-2 font-medium whitespace-nowrap">
                  {t("workout_distance")} ({t("unit_km")})
                </th>
              )}
              {showAvgVelocity && (
                <th className="py-2 font-medium whitespace-nowrap">
                  {t("workout_avgVelocity")} ({t("unit_kmh")})
                </th>
              )}
              {showPace && (
                <th className="py-2 font-medium whitespace-nowrap">
                  {t("workout_pace")} ({t("unit_min_per_km")})
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {sets.map((set: StoredSet, setIndex: number) => (
              <tr
                key={setIndex}
                className="border-b border-[var(--brand-code-bg)] last:border-b-0"
              >
                <td className="py-2 pr-4 text-brand-text">{setIndex + 1}</td>
                {showWeight && (
                  <td className="py-2 pr-4 text-brand-text">
                    {formatStoredWeightForDisplay(set.weight ?? "", weightUnit)}
                  </td>
                )}
                {showReps && (
                  <td className="py-2 pr-4 text-brand-text">
                    {set.reps ?? "—"}
                  </td>
                )}
                {showTime && (
                  <td className="py-2 text-brand-text">
                    {(() => {
                      const derived = deriveKinematicsFromSet(set);
                      if (derived.durationSec != null) {
                        return formatSecondsAsMmSs(derived.durationSec);
                      }
                      return set.time ?? "—";
                    })()}
                  </td>
                )}
                {showDistance && (
                  <td className="py-2 text-brand-text">
                    {(() => {
                      const derived = deriveKinematicsFromSet(set);
                      if (derived.distanceKm != null) return formatKm(derived.distanceKm);
                      return set.distance ?? "—";
                    })()}
                  </td>
                )}
                {showAvgVelocity && (
                  <td className="py-2 text-brand-text">
                    {(() => {
                      const derived = deriveKinematicsFromSet(set);
                      if (derived.avgVelocityKmh != null)
                        return formatKmh(derived.avgVelocityKmh);
                      return set.avgVelocity ?? "—";
                    })()}
                  </td>
                )}
                {showPace && (
                  <td className="py-2 text-brand-text">
                    {(() => {
                      const derived = deriveKinematicsFromSet(set);
                      if (derived.paceMinPerKm != null)
                        return formatPaceMinPerKm(derived.paceMinPerKm);
                      return set.pace ?? "—";
                    })()}
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { weightUnit } = useWeightUnit();
  const { workouts, removeWorkout } = useCompletedWorkouts();
  const allExercises = useAllExercises();
  const { templates } = useWorkoutTemplates();
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  const getExerciseDisplayName = (uniqueName: string) => {
    const ex = allExercises.find((e) => e.unique_name === uniqueName);
    if (ex)
      return ex.unique_name.startsWith("custom_") ? ex.name : t(ex.unique_name);
    return t(uniqueName);
  };

  const workout = id ? workouts.find((w) => w.id === id) : null;

  const onRemoveConfirm = () => {
    if (id) {
      removeWorkout(id);
      setRemoveModalOpen(false);
      navigate(routes.workout, { state: { tab: "completed" } });
    }
  };

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
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("workoutDetail_title")}
        </h1>
        <p className="text-brand-text-muted">{t("notFound_message")}</p>
      </div>
    );
  }

  const completedDate = new Date(workout.completedAt);
  const startedDate = new Date(workout.startedAt);

  const formatDMY = (d: Date) =>
    [
      d.getDate().toString().padStart(2, "0"),
      (d.getMonth() + 1).toString().padStart(2, "0"),
      d.getFullYear(),
    ].join(".");
  const formatHMS = (d: Date) =>
    [
      d.getHours().toString().padStart(2, "0"),
      d.getMinutes().toString().padStart(2, "0"),
      d.getSeconds().toString().padStart(2, "0"),
    ].join(".");

  const startedLine = `${t("workoutDetail_started")} - ${formatDMY(startedDate)}, ${formatHMS(startedDate)}`;
  const completedLine = `${t("workoutDetail_completed")} - ${formatDMY(completedDate)}, ${formatHMS(completedDate)}`;
  const templateName =
    workout.templateName?.trim() ||
    (workout.templateId
      ? templates.find((tmpl) => tmpl.id === workout.templateId)?.name
      : "");

  return (
    <div>
      <Link
        to={routes.workout}
        state={{ tab: "completed" }}
        className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
      >
        ← {t("workoutDetail_back")}
      </Link>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-dark mb-1">
            {t("workoutDetail_title")} — {formatDMY(completedDate)}
          </h1>
          {templateName ? (
            <p className="text-brand-text-muted text-sm">
              {t("workout_templateLabel")}: {templateName}
            </p>
          ) : null}
          <p className="text-brand-text-muted text-sm">{startedLine}</p>
          <p className="text-brand-text-muted text-sm">{completedLine}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={routes.workoutDetailEdit(id)}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg-soft transition-colors"
          >
            {t("workoutDetail_edit")}
          </Link>
          <button
            type="button"
            onClick={() => setRemoveModalOpen(true)}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {t("workoutDetail_remove")}
          </button>
        </div>
      </header>
      <ConfirmModal
        open={removeModalOpen}
        title={t("workoutDetail_removeConfirmTitle")}
        message={t("workoutDetail_removeConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={onRemoveConfirm}
        onCancel={() => setRemoveModalOpen(false)}
        variant="danger"
      />
      <div className="grid grid-cols-1 gap-4">
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
            <ExerciseBlock
              key={`${exercise.exerciseUniqueName}-${index}`}
              exercise={exercise}
              exerciseConfig={allExercises.find(
                (e) => e.unique_name === exercise.exerciseUniqueName,
              )}
              displayName={getExerciseDisplayName(exercise.exerciseUniqueName)}
              t={t}
              weightUnit={weightUnit}
            />
          ))}
      </div>
    </div>
  );
}
