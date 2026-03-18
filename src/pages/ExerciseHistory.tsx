import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { routes } from "../routes";
import type { StoredSet } from "../data/workoutStorage";
import { formatStoredWeightForDisplay } from "../helpers/weightConversion";
import { cn } from "../lib/utils";

function formatDMY(d: Date) {
  return [
    d.getDate().toString().padStart(2, "0"),
    (d.getMonth() + 1).toString().padStart(2, "0"),
    d.getFullYear(),
  ].join(".");
}

type SetRow = {
  workoutId: string;
  completedAt: string;
  blockIndex: number;
  setIndex: number;
  set: StoredSet;
};

function collectSets(
  workouts: {
    id: string;
    completedAt: string;
    exercises: { exerciseUniqueName: string; sets?: StoredSet[] }[];
  }[],
  uniqueName: string,
): SetRow[] {
  const rows: SetRow[] = [];
  for (const w of workouts) {
    w.exercises.forEach((block, blockIndex) => {
      if (block.exerciseUniqueName !== uniqueName || !block.sets?.length)
        return;
      block.sets.forEach((set, i) => {
        rows.push({
          workoutId: w.id,
          completedAt: w.completedAt,
          blockIndex,
          setIndex: i + 1,
          set,
        });
      });
    });
  }
  rows.sort(
    (a, b) =>
      new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
  );
  return rows;
}

export function ExerciseHistory() {
  const { exerciseKey } = useParams<{ exerciseKey: string }>();
  const { t } = useLanguage();
  const { weightUnit } = useWeightUnit();
  const { workouts, isLoading } = useCompletedWorkouts();
  const allExercises = useAllExercises();

  const uniqueName = exerciseKey ? decodeURIComponent(exerciseKey) : "";

  const exercise = useMemo(
    () => allExercises.find((e) => e.unique_name === uniqueName),
    [allExercises, uniqueName],
  );

  const displayName = useMemo(() => {
    if (!uniqueName) return "";
    if (exercise)
      return exercise.unique_name.startsWith("custom_")
        ? exercise.name
        : t(exercise.unique_name);
    return t(uniqueName);
  }, [exercise, uniqueName, t]);

  const rows = useMemo(
    () => (uniqueName ? collectSets(workouts, uniqueName) : []),
    [workouts, uniqueName],
  );

  const hasWeight = rows.some(
    (r) => r.set.weight != null && r.set.weight !== "",
  );
  const hasReps = rows.some((r) => r.set.reps != null && r.set.reps !== "");
  const hasTime = rows.some((r) => r.set.time != null && r.set.time !== "");

  if (!exerciseKey) {
    return (
      <div>
        <Link
          to={routes.library}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
        >
          ← {t("exerciseHistory_back")}
        </Link>
        <p className="text-brand-text-muted">{t("notFound_message")}</p>
      </div>
    );
  }

  if (!isLoading && !exercise && rows.length === 0) {
    return (
      <div>
        <Link
          to={routes.library}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
        >
          ← {t("exerciseHistory_back")}
        </Link>
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("exerciseHistory_notFound")}
        </h1>
        <p className="text-brand-text-muted">{t("notFound_message")}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <Link
        to={routes.library}
        className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block shrink-0"
      >
        ← {t("exerciseHistory_back")}
      </Link>
      <header className="shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-brand-dark mb-1">
          {displayName || uniqueName}
        </h1>
        <p className="text-brand-text-muted text-sm">
          {t("exerciseHistory_subtitle")}
        </p>
      </header>

      {isLoading ? (
        <p className="text-brand-text-muted">{t("loading")}</p>
      ) : rows.length === 0 ? (
        <p className="text-brand-text-muted">{t("exerciseHistory_empty")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-brand-border bg-brand-bg-soft">
          <table className="w-full text-sm text-left min-w-[28rem]">
            <thead>
              <tr className="border-b border-brand-border text-brand-text-muted">
                <th className="py-3 px-4 font-medium whitespace-nowrap">
                  {t("exerciseHistory_date")}
                </th>
                <th className="py-3 px-3 font-medium w-12">#</th>
                {hasWeight && (
                  <th className="py-3 px-3 font-medium whitespace-nowrap">
                    {t("workout_weight")} (
                    {t(weightUnit === "kg" ? "unit_kg" : "unit_lb")})
                  </th>
                )}
                {hasReps && (
                  <th className="py-3 px-3 font-medium">{t("workout_reps")}</th>
                )}
                {hasTime && (
                  <th className="py-3 px-3 font-medium whitespace-nowrap">
                    {t("workout_time")} ({t("unit_s")})
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIndex) => {
                const d = new Date(row.completedAt);
                const prev = rows[rowIndex - 1];
                const isFirstOfWorkout =
                  !prev || prev.workoutId !== row.workoutId;
                let rowSpan = 1;
                if (isFirstOfWorkout) {
                  for (
                    let j = rowIndex + 1;
                    j < rows.length && rows[j].workoutId === row.workoutId;
                    j++
                  ) {
                    rowSpan++;
                  }
                }
                const next = rows[rowIndex + 1];
                const isEndOfWorkout =
                  !next || next.workoutId !== row.workoutId;
                return (
                  <tr
                    key={`${row.workoutId}-${row.blockIndex}-${row.setIndex}`}
                    className={cn(
                      isEndOfWorkout && "border-b border-brand-border",
                      "hover:bg-brand-bg/80",
                    )}
                  >
                    {isFirstOfWorkout && (
                      <td
                        rowSpan={rowSpan}
                        className="py-2.5 px-4 align-top"
                      >
                        <Link
                          to={routes.workoutDetail(row.workoutId)}
                          className={cn(
                            "group inline-flex flex-wrap items-baseline gap-x-1.5 font-medium whitespace-nowrap",
                            "no-underline hover:no-underline",
                          )}
                        >
                          <span className="text-brand-text transition-colors group-hover:text-brand-primary">
                            {formatDMY(d)}
                          </span>
                          <span className="text-brand-primary text-xs font-normal tabular-nums transition-colors group-hover:text-brand-primary">
                            {d.toLocaleTimeString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </Link>
                      </td>
                    )}
                    <td className="py-2.5 px-3 text-brand-text-muted">
                      {row.setIndex}
                    </td>
                    {hasWeight && (
                      <td className="py-2.5 px-3 text-brand-text">
                        {formatStoredWeightForDisplay(
                          row.set.weight ?? "",
                          weightUnit,
                        )}
                      </td>
                    )}
                    {hasReps && (
                      <td className="py-2.5 px-3 text-brand-text">
                        {row.set.reps ?? "—"}
                      </td>
                    )}
                    {hasTime && (
                      <td className="py-2.5 px-3 text-brand-text">
                        {row.set.time ?? "—"}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
