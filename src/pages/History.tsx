import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { routes } from "../routes";
import type { StoredWorkout } from "../data/workoutStorage";
import { cn } from "../lib/utils";

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
  return t(uniqueName);
}

function WorkoutCard({
  workout,
  allExercises,
  templateName,
  t,
}: {
  workout: StoredWorkout;
  allExercises: { unique_name: string; name: string }[];
  /** Resolved from current templates when this workout was saved with a template. */
  templateName?: string;
  t: (key: string) => string;
}) {
  const completedDate = new Date(workout.completedAt);
  const validExercises = workout.exercises.filter(
    (ex) => ex.exerciseUniqueName,
  );
  const exerciseLabels = validExercises
    .map((ex) => getExerciseDisplayName(ex.exerciseUniqueName, allExercises, t))
    .slice(0, 3);
  const more = Math.max(0, validExercises.length - 3);

  return (
    <Link
      to={routes.workoutDetail(workout.id)}
      className={cn(
        "block rounded-xl border border-brand-border bg-brand-bg-soft p-0 overflow-hidden",
        "transition-all duration-200",
        "hover:border-brand-primary hover:bg-brand-primary/5 hover:shadow-md",
      )}
    >
      <div className="grid grid-cols-3 min-h-[4.5rem] xs:grid-cols-1">
        {/* Desktop: exercises left */}
        <div className="col-span-2 p-4 flex flex-col justify-end xs:hidden">
          {templateName ? (
            <p className="text-sm leading-snug text-brand-text mb-2 shrink-0">
              <span className="text-brand-text-muted">
                {t("workout_templateLabel")}:{" "}
              </span>
              <span className="font-semibold">{templateName}</span>
            </p>
          ) : null}
          {exerciseLabels.length > 0 ? (
            <ul className="text-sm text-brand-text-muted flex flex-wrap gap-2">
              {exerciseLabels.map((label, i) => (
                <li key={i} className="flex items-center gap-2">
                  {label}
                  {i < exerciseLabels.length - 1 && <span>·</span>}
                </li>
              ))}
              {more > 0 && (
                <li className="text-brand-text-muted/80">+{more}</li>
              )}
            </ul>
          ) : (
            <span className="text-sm text-brand-text-muted">—</span>
          )}
        </div>

        {/* Desktop: date/time right */}
        <div className="col-span-1 border-l border-brand-border flex flex-col items-end justify-center gap-0.5 pr-4 my-4 xs:hidden">
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
            {templateName ? (
              <p className="text-sm leading-snug text-brand-text mb-2">
                <span className="text-brand-text-muted">
                  {t("workout_templateLabel")}:{" "}
                </span>
                <span className="font-semibold">{templateName}</span>
              </p>
            ) : null}
            {exerciseLabels.length > 0 ? (
              <ul className="text-sm text-brand-text-muted flex flex-wrap gap-2">
                {exerciseLabels.map((label, i) => (
                  <li key={i} className="flex items-center gap-2">
                    {label}
                    {i < exerciseLabels.length - 1 && <span>·</span>}
                  </li>
                ))}
                {more > 0 && (
                  <li className="text-brand-text-muted/80">+{more}</li>
                )}
              </ul>
            ) : (
              <span className="text-sm text-brand-text-muted">—</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

const MONTH_KEYS = [
  "month_january",
  "month_february",
  "month_march",
  "month_april",
  "month_may",
  "month_june",
  "month_july",
  "month_august",
  "month_september",
  "month_october",
  "month_november",
  "month_december",
] as const;

/** Format date as "March 2026" using translated month name (capitalized). */
function formatMonthYear(d: Date, t: (key: string) => string): string {
  const monthName = t(MONTH_KEYS[d.getMonth()]);
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${d.getFullYear()}`;
}

/** Group workouts by month (key: "YYYY-MM"), newest first. */
function groupByMonth(workouts: StoredWorkout[]): [string, StoredWorkout[]][] {
  const map = new Map<string, StoredWorkout[]>();
  for (const w of workouts) {
    const d = new Date(w.completedAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const list = map.get(key) ?? [];
    list.push(w);
    map.set(key, list);
  }
  for (const list of map.values()) {
    list.sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    );
  }
  const entries = Array.from(map.entries());
  entries.sort(([a], [b]) => b.localeCompare(a));
  return entries;
}

export function History() {
  const { t } = useLanguage();
  const allExercises = useAllExercises();
  const { templates } = useWorkoutTemplates();
  const { workouts, isLoading } = useCompletedWorkouts();
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 2;
    setAtTop(el.scrollTop <= threshold);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= threshold);
  }, []);

  const sorted = [...workouts].sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  const byMonth = groupByMonth(sorted);

  useEffect(() => {
    checkScroll();
  }, [byMonth.length, checkScroll]);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("history_title")}
        </h1>
        <p className="text-brand-text-muted">{t("history_description")}</p>
      </div>
      {isLoading ? (
        <p className="text-brand-text-muted text-sm shrink-0">{t("loading")}</p>
      ) : sorted.length === 0 ? (
        <p className="text-brand-text-muted text-sm shrink-0">
          {t("history_empty")}
        </p>
      ) : (
        <div
          className={cn(
            "flex-1 min-h-0 min-w-0 relative overflow-hidden scroll-fade-bottom scroll-fade-top",
            atBottom && "at-bottom",
            atTop && "at-top",
          )}
        >
          <div
            ref={scrollRef}
            className="h-full overflow-y-auto min-h-0"
            onScroll={checkScroll}
          >
            <div className="space-y-8 pr-3">
              {byMonth.map(([key, monthWorkouts]) => {
                const firstDate = new Date(monthWorkouts[0].completedAt);
                return (
                  <section key={key}>
                    <h2 className="text-lg font-medium text-brand-dark mb-3">
                      {formatMonthYear(firstDate, t)}
                    </h2>
                    <ul className="grid gap-3 grid-cols-1">
                      {monthWorkouts.map((workout) => (
                        <li key={workout.id}>
                          <WorkoutCard
                            workout={workout}
                            allExercises={allExercises}
                            templateName={
                              workout.templateName?.trim() ||
                              (workout.templateId
                                ? templates.find(
                                    (tmpl) => tmpl.id === workout.templateId,
                                  )?.name
                                : undefined)
                            }
                            t={t}
                          />
                        </li>
                      ))}
                    </ul>
                  </section>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
