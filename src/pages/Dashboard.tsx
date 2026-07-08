import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCurrentWorkout } from "../contexts/CurrentWorkoutContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import { useUserProfile } from "../contexts/UserProfileContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { routes } from "../routes";
import type { StoredWorkout } from "../data/workoutStorage";
import {
  countTotalSets,
  getWorkoutsThisCalendarWeek,
} from "../helpers/workoutStats";
import { cn } from "../lib/utils";
import { Dumbbell } from "lucide-react";
import { PersonalBestsList } from "../components/PersonalBestsList";

function formatDMY(d: Date) {
  return [
    d.getDate().toString().padStart(2, "0"),
    (d.getMonth() + 1).toString().padStart(2, "0"),
    d.getFullYear(),
  ].join(".");
}

function findVerticalScrollParent(
  start: HTMLElement | null,
): HTMLElement | null {
  let p = start?.parentElement ?? null;
  while (p) {
    const { overflowY } = getComputedStyle(p);
    if (
      overflowY === "auto" ||
      overflowY === "scroll" ||
      overflowY === "overlay"
    ) {
      return p;
    }
    p = p.parentElement;
  }
  return null;
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
  templateName,
  t,
}: {
  workout: StoredWorkout;
  allExercises: { unique_name: string; name: string }[];
  templateName?: string;
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
        <div className="col-span-2 p-3 flex flex-col justify-start xs:hidden">
          {templateName ? (
            <p className="text-brand-text-muted text-sm mb-1.5 shrink-0">
              {t("workout_templateLabel")}: {templateName}
            </p>
          ) : null}
          {exerciseLabels.length > 0 ? (
            <ul className="text-xs text-brand-text-muted flex flex-wrap gap-2">
              {exerciseLabels.map((label, i) => (
                <li key={i} className="flex items-center gap-2 text-sm">
                  {label}
                  {i < exerciseLabels.length - 1 && <span>·</span>}
                </li>
              ))}
              {more > 0 && (
                <li className="text-brand-text-muted/80">+{more}</li>
              )}
            </ul>
          ) : (
            <span className="text-xs text-brand-text-muted">—</span>
          )}
        </div>

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
            {templateName ? (
              <p className="text-brand-text-muted text-sm mb-1.5">
                {t("workout_templateLabel")}: {templateName}
              </p>
            ) : null}
            {exerciseLabels.length > 0 ? (
              <ul className="text-xs text-brand-text-muted flex flex-wrap gap-2">
                {exerciseLabels.map((label, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    {label}
                    {i < exerciseLabels.length - 1 && <span>·</span>}
                  </li>
                ))}
                {more > 0 && (
                  <li className="text-brand-text-muted/80">+{more}</li>
                )}
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
  const rootRef = useRef<HTMLDivElement>(null);
  const [padForScrollbar, setPadForScrollbar] = useState(false);
  const { t } = useLanguage();
  const { currentWorkout } = useCurrentWorkout();
  const { workouts, isLoading } = useCompletedWorkouts();
  const { profile } = useUserProfile();
  const allExercises = useAllExercises();
  const { templates } = useWorkoutTemplates();

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
    const thisWeek = getWorkoutsThisCalendarWeek(workouts);
    return {
      workoutsThisWeek: thisWeek.length,
      setsThisWeek: countTotalSets(thisWeek),
    };
  }, [workouts]);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const scrollParent =
      findVerticalScrollParent(root) ?? document.documentElement;

    const update = () => {
      const gap = scrollParent.scrollHeight - scrollParent.clientHeight;
      setPadForScrollbar(gap > 0.5);
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(root);
    ro.observe(scrollParent);
    window.addEventListener("resize", update);
    window.visualViewport?.addEventListener("resize", update);
    let rafInner = 0;
    const rafOuter = requestAnimationFrame(() => {
      rafInner = requestAnimationFrame(update);
    });
    return () => {
      cancelAnimationFrame(rafOuter);
      cancelAnimationFrame(rafInner);
      ro.disconnect();
      window.removeEventListener("resize", update);
      window.visualViewport?.removeEventListener("resize", update);
    };
  }, [workouts, isLoading]);

  return (
    <div
      ref={rootRef}
      className={cn(
        "flex flex-col gap-8",
        padForScrollbar && "md:pr-2 lg:pr-0",
      )}
    >
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
                  templateName={
                    (workout.templateId
                      ? templates.find((tmpl) => tmpl.id === workout.templateId)
                          ?.name
                      : undefined) || workout.templateName?.trim()
                  }
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
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
              <p className="text-2xl font-semibold text-brand-dark">
                {stats.workoutsThisWeek}
              </p>
              <p className="text-sm text-brand-text-muted">
                {t("dashboard_stat_trainingsThisWeek")}
              </p>
            </div>
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
              <p className="text-2xl font-semibold text-brand-dark">
                {stats.setsThisWeek}
              </p>
              <p className="text-sm text-brand-text-muted">
                {t("dashboard_stat_setsThisWeek")}
              </p>
            </div>
          </div>
        )}
        {!isLoading && workouts.length > 0 && (
          <Link
            to={routes.summary}
            className="mt-3 inline-block text-sm font-medium text-brand-accent hover:text-brand-primary-hover transition-colors"
          >
            {t("dashboard_viewAll")} →
          </Link>
        )}
      </section>

      <section>
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {t("user_personalBestHeading")}
        </h2>
        <PersonalBestsList limit={3} showViewAllLink />
      </section>
    </div>
  );
}
