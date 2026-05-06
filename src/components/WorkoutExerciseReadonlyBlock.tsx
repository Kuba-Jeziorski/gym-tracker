import { useLanguage } from "../contexts/LanguageContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import type { StoredWorkoutExercise, StoredSet } from "../data/workoutStorage";
import type { Exercise } from "../data/exercises";
import { formatStoredWeightForDisplay } from "../helpers/weightConversion";
import {
  deriveKinematicsFromSet,
  formatKm,
  formatKmh,
  formatPaceMinPerKm,
  formatSecondsAsMmSs,
} from "../helpers/kinematics";

export function WorkoutExerciseReadonlyBlock({
  exercise,
  exerciseConfig,
  displayName,
}: {
  exercise: StoredWorkoutExercise;
  exerciseConfig?: Exercise;
  displayName: string;
}) {
  const { t } = useLanguage();
  const { weightUnit } = useWeightUnit();
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
                      if (derived.distanceKm != null)
                        return formatKm(derived.distanceKm);
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
