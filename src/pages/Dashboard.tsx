import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrentWorkout } from "../contexts/CurrentWorkoutContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { routes } from "../routes";
import type { StoredWorkout } from "../data/workoutStorage";
import {
  computePersonalBests,
  countTotalSets,
  getWorkoutsInRange,
  getCurrentStreakWeeks,
  formatPBDate,
  formatTimeSeconds,
} from "../helpers/workoutStats";
import { kgToLb } from "../helpers/weightConversion";
import { cn } from "../lib/utils";
import { Dumbbell } from "lucide-react";
import Tooltip from "@mui/material/Tooltip";

function formatDMY(d: Date) {
  return [
    d.getDate().toString().padStart(2, "0"),
    (d.getMonth() + 1).toString().padStart(2, "0"),
    d.getFullYear(),
  ].join(".");
}

function getExerciseDisplayName(
  uniqueName: string,
  allExercises: { unique_name: string; name: string }[],
  t: (key: string) => string,
) {
  const ex = allExercises.find((e) => e.unique_name === uniqueName);
  if (ex) return ex.unique_name.startsWith("custom_") ? ex.name : t(uniqueName);
  return uniqueName;
}

function RecentWorkoutCard({
  workout,
  allExercises,
  t,
}: {
  workout: StoredWorkout;
  allExercises: { unique_name: string; name: string }[];
  t: (key: string) => string;
}) {
  const completedDate = new Date(workout.completedAt);
  const validExercises = workout.exercises.filter(
    (ex) => ex.exerciseUniqueName,
  );
  const exerciseLabels = validExercises
    .map((ex) => getExerciseDisplayName(ex.exerciseUniqueName, allExercises, t))
    .slice(0, 2);
  const more = Math.max(0, validExercises.length - 2);

  return (
    <Link
      to={routes.workoutDetail(workout.id)}
      className={cn(
        "block rounded-xl border border-brand-border bg-brand-bg-soft p-0 overflow-hidden",
        "transition-all duration-200",
        "hover:border-brand-primary hover:bg-brand-primary/5",
      )}
    >
      <div className="grid grid-cols-3 min-h-[4.5rem] xs:grid-cols-1">
        {/* Desktop: exercises left */}
        <div className="col-span-2 p-3 flex flex-col justify-center xs:hidden">
          {exerciseLabels.length > 0 ? (
            <ul className="text-xs text-brand-text-muted flex flex-wrap gap-2">
              {exerciseLabels.map((label, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {label}
                  {i < exerciseLabels.length - 1 && <span>·</span>}
                </li>
              ))}
              {more > 0 && <li className="text-brand-text-muted/80">+{more}</li>}
            </ul>
          ) : (
            <span className="text-xs text-brand-text-muted">—</span>
          )}
        </div>

        {/* Desktop: date/time right */}
        <div className="col-span-1 border-l border-brand-border flex flex-col items-end justify-center gap-0.5 pr-3 my-3 xs:hidden">
          <p className="text-base font-medium text-brand-dark">
            {formatDMY(completedDate)}
          </p>
          <p className="text-sm text-brand-text-muted">
            {completedDate.toLocaleTimeString(undefined, {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        {/* Mobile (<480px): date/time top, exercises bottom */}
        <div className="hidden xs:block">
          <div className="px-4 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-medium text-brand-dark">
                {formatDMY(completedDate)}
              </p>
              <p className="text-sm text-brand-text-muted">
                {completedDate.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
          <div className="h-px bg-brand-border mx-4" />
          <div className="px-4 py-3">
            {exerciseLabels.length > 0 ? (
              <ul className="text-xs text-brand-text-muted flex flex-wrap gap-2">
                {exerciseLabels.map((label, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {label}
                    {i < exerciseLabels.length - 1 && <span>·</span>}
                  </li>
                ))}
                {more > 0 && <li className="text-brand-text-muted/80">+{more}</li>}
              </ul>
            ) : (
              <span className="text-xs text-brand-text-muted">—</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

export function Dashboard() {
  const { t } = useLanguage();
  const { currentWorkout } = useCurrentWorkout();
  const { workouts, isLoading } = useCompletedWorkouts();
  const { profile } = useUserProfile();
  const allExercises = useAllExercises();
  const { weightUnit } = useWeightUnit();

  const recentWorkouts = [...workouts]
    .sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )
    .slice(0, 3);

  const greeting = profile.name.trim()
    ? `${t("dashboard_hi")}, ${profile.name.trim()}`
    : t("dashboard_title");

  const stats = useMemo(() => {
    const thisWeek = getWorkoutsInRange(workouts, 7);
    const thisMonth = getWorkoutsInRange(workouts, 30);
    return {
      trainingsCompleted: workouts.length,
      totalSets: countTotalSets(workouts),
      workoutsThisWeek: thisWeek.length,
      workoutsThisMonth: thisMonth.length,
      currentStreakWeeks: getCurrentStreakWeeks(workouts),
    };
  }, [workouts]);

  const personalBests = useMemo(
    () => computePersonalBests(workouts),
    [workouts],
  );
  const pbList = useMemo(
    () =>
      Array.from(personalBests.entries())
        .map(([uniqueName, pb]) => ({
          uniqueName,
          displayName: getExerciseDisplayName(uniqueName, allExercises, t),
          ...pb,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [personalBests, allExercises, t],
  );

  return (
    <div className="flex flex-col gap-8">
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark mb-1">
          {greeting}
        </h1>
        <p className="text-brand-text-muted">{t("dashboard_description")}</p>
      </header>

      <section>
        <Link
          to={routes.workout}
          className={cn(
            "inline-flex items-center gap-2 rounded-xl border-2 border-brand-primary bg-brand-primary/10 px-5 py-3",
            "text-brand-primary font-medium",
            "transition-colors hover:bg-brand-primary/20 hover:border-brand-primary/80",
          )}
        >
          <Dumbbell className="size-5" aria-hidden />
          {currentWorkout ? t("dashboard_continueWorkout") : t("workout_start")}
        </Link>
      </section>

      <section>
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {t("dashboard_recentWorkouts")}
        </h2>
        {isLoading ? (
          <p className="text-brand-text-muted text-sm">{t("loading")}</p>
        ) : recentWorkouts.length === 0 ? (
          <p className="text-brand-text-muted text-sm mb-2">
            {t("dashboard_noWorkoutsYet")}
          </p>
        ) : (
          <ul className="space-y-2">
            {recentWorkouts.map((workout) => (
              <li key={workout.id}>
                <RecentWorkoutCard
                  workout={workout}
                  allExercises={allExercises}
                  t={t}
                />
              </li>
            ))}
          </ul>
        )}
        {!isLoading && workouts.length > 0 && (
          <Link
            to={routes.workout}
            state={{ tab: "completed" }}
            className="mt-3 inline-block text-sm font-medium text-brand-accent hover:text-brand-primary-hover transition-colors"
          >
            {t("dashboard_viewAll")} →
          </Link>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {t("user_statsHeading")}
        </h2>
        {isLoading ? (
          <p className="text-brand-text-muted text-sm">{t("loading")}</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
              <p className="text-2xl font-semibold text-brand-dark">
                {stats.trainingsCompleted}
              </p>
              <p className="text-sm text-brand-text-muted">
                {t("user_stat_trainingsCompleted")}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
              <p className="text-2xl font-semibold text-brand-dark">
                {stats.totalSets}
              </p>
              <p className="text-sm text-brand-text-muted">
                {t("user_stat_totalSets")}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
              <p className="text-2xl font-semibold text-brand-dark">
                {stats.workoutsThisWeek}
              </p>
              <p className="text-sm text-brand-text-muted">
                {t("user_stat_workoutsThisWeek")}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
              <p className="text-2xl font-semibold text-brand-dark">
                {stats.workoutsThisMonth}
              </p>
              <p className="text-sm text-brand-text-muted">
                {t("user_stat_workoutsThisMonth")}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
              <p className="text-2xl font-semibold text-brand-dark">
                {stats.currentStreakWeeks}
              </p>
              <p className="text-sm text-brand-text-muted">
                {t("user_stat_streakWeeks")}
              </p>
            </div>
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {t("user_personalBestHeading")}
        </h2>
        {isLoading ? (
          <p className="text-brand-text-muted text-sm">{t("loading")}</p>
        ) : pbList.length === 0 ? (
          <p className="text-brand-text-muted text-sm">
            {t("user_personalBestEmpty")}
          </p>
        ) : (
          <div className="rounded-xl border border-brand-border bg-brand-bg-soft overflow-hidden">
            <ul className="divide-y divide-brand-border">
              {pbList.map(
                ({
                  uniqueName,
                  displayName,
                  highestWeightKg,
                  highestWeightDate,
                  highestVolume,
                  highestVolumeDate,
                  mostReps,
                  mostRepsDate,
                  longestTimeSeconds,
                  longestTimeDate,
                }) => {
                  const displayWeight = (kg: number) =>
                    weightUnit === "lb"
                      ? kgToLb(kg) % 1 === 0
                        ? kgToLb(kg).toString()
                        : kgToLb(kg).toFixed(1)
                      : kg.toString();
                  const hasAny =
                    highestWeightKg != null ||
                    highestVolume != null ||
                    mostReps != null ||
                    longestTimeSeconds != null;
                  if (!hasAny) return null;
                  return (
                    <li key={uniqueName} className="px-4 py-4">
                      <p className="font-medium text-brand-dark mb-3">
                        {displayName}
                      </p>
                      <dl className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        {highestWeightKg != null && (
                          <div>
                            <dt className="text-brand-text-muted">
                              <Tooltip
                                title={t("user_pb_tooltip_highestWeight")}
                              >
                                <span className="cursor-help underline decoration-dotted underline-offset-2">
                                  {t("user_pb_highestWeight")}
                                </span>
                              </Tooltip>
                            </dt>
                            <dd className="text-brand-text font-medium">
                              {displayWeight(highestWeightKg)}{" "}
                              {t(weightUnit === "kg" ? "unit_kg" : "unit_lb")}
                              {highestWeightDate != null && (
                                <span className="text-brand-text-muted font-normal ml-1">
                                  ({formatPBDate(highestWeightDate)})
                                </span>
                              )}
                            </dd>
                          </div>
                        )}
                        {highestVolume != null && (
                          <div>
                            <dt className="text-brand-text-muted">
                              <Tooltip
                                title={t("user_pb_tooltip_highestVolume")}
                              >
                                <span className="cursor-help underline decoration-dotted underline-offset-2">
                                  {t("user_pb_highestVolume")}
                                </span>
                              </Tooltip>
                            </dt>
                            <dd className="text-brand-text font-medium">
                              {highestVolume % 1 === 0
                                ? highestVolume
                                : highestVolume.toFixed(1)}
                              {highestVolumeDate != null && (
                                <span className="text-brand-text-muted font-normal ml-1">
                                  ({formatPBDate(highestVolumeDate)})
                                </span>
                              )}
                            </dd>
                          </div>
                        )}
                        {mostReps != null && (
                          <div>
                            <dt className="text-brand-text-muted">
                              <Tooltip title={t("user_pb_tooltip_mostReps")}>
                                <span className="cursor-help underline decoration-dotted underline-offset-2">
                                  {t("user_pb_mostReps")}
                                </span>
                              </Tooltip>
                            </dt>
                            <dd className="text-brand-text font-medium">
                              {mostReps}
                              {mostRepsDate != null && (
                                <span className="text-brand-text-muted font-normal ml-1">
                                  ({formatPBDate(mostRepsDate)})
                                </span>
                              )}
                            </dd>
                          </div>
                        )}
                        {longestTimeSeconds != null && (
                          <div>
                            <dt className="text-brand-text-muted">
                              <Tooltip title={t("user_pb_tooltip_longestTime")}>
                                <span className="cursor-help underline decoration-dotted underline-offset-2">
                                  {t("user_pb_longestTime")}
                                </span>
                              </Tooltip>
                            </dt>
                            <dd className="text-brand-text font-medium">
                              {formatTimeSeconds(longestTimeSeconds)}
                              {longestTimeDate != null && (
                                <span className="text-brand-text-muted font-normal ml-1">
                                  ({formatPBDate(longestTimeDate)})
                                </span>
                              )}
                            </dd>
                          </div>
                        )}
                      </dl>
                    </li>
                  );
                },
              )}
            </ul>
          </div>
        )}
      </section>
    </div>
  );
}
