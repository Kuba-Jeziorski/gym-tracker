import { useEffect, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { routes } from "../routes";
import {
  countTotalSets,
  sumWorkoutsVolumeKg,
  getWorkoutsThisCalendarWeek,
  getWorkoutsThisCalendarMonth,
  getCurrentStreakWeeks,
  groupWorkoutsByCalendarWeekDescending,
  groupWorkoutsByCalendarMonthDescending,
} from "../helpers/workoutStats";
import { PersonalBestsList } from "../components/PersonalBestsList";
import { cn } from "../lib/utils";

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

type SummaryLocationState = {
  section?: string;
};

function formatDMY(d: Date) {
  return [
    d.getDate().toString().padStart(2, "0"),
    (d.getMonth() + 1).toString().padStart(2, "0"),
    d.getFullYear(),
  ].join(".");
}

function formatWeekRange(weekStartMonday: Date) {
  const end = new Date(weekStartMonday);
  end.setDate(end.getDate() + 6);
  return `${formatDMY(weekStartMonday)} – ${formatDMY(end)}`;
}

function formatVolumeKgReps(value: number) {
  if (value === 0) return "0";
  return value % 1 === 0 ? value.toString() : value.toFixed(1);
}

function formatMonthYear(
  year: number,
  monthIndex: number,
  t: (key: string) => string,
) {
  const d = new Date(year, monthIndex, 1);
  const monthName = t(MONTH_KEYS[d.getMonth()]);
  const capitalized = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  return `${capitalized} ${d.getFullYear()}`;
}

function StatCard({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
      <p className="text-2xl font-semibold text-brand-dark">{value}</p>
      <p className="text-sm text-brand-text-muted">{label}</p>
    </div>
  );
}

export function Summary() {
  const { t } = useLanguage();
  const location = useLocation();
  const scrollSection = (location.state as SummaryLocationState | null)?.section;
  const { workouts, isLoading } = useCompletedWorkouts();

  const weekWorkouts = useMemo(
    () => getWorkoutsThisCalendarWeek(workouts),
    [workouts],
  );
  const monthWorkouts = useMemo(
    () => getWorkoutsThisCalendarMonth(workouts),
    [workouts],
  );

  const byWeek = useMemo(
    () => groupWorkoutsByCalendarWeekDescending(workouts),
    [workouts],
  );
  const byMonth = useMemo(
    () => groupWorkoutsByCalendarMonthDescending(workouts),
    [workouts],
  );

  const allTimeSets = useMemo(() => countTotalSets(workouts), [workouts]);
  const weekSets = useMemo(() => countTotalSets(weekWorkouts), [weekWorkouts]);
  const monthSets = useMemo(
    () => countTotalSets(monthWorkouts),
    [monthWorkouts],
  );

  const streak = useMemo(() => getCurrentStreakWeeks(workouts), [workouts]);

  useEffect(() => {
    if (scrollSection !== "personal-bests") return;
    const el = document.getElementById("personal-bests");
    if (!el) return;
    const timer = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [scrollSection]);

  return (
    <div className="flex flex-col gap-8">
      <p>
        <Link
          to={routes.dashboard}
          className={cn(
            "text-sm font-medium text-brand-accent hover:text-brand-primary-hover transition-colors",
          )}
        >
          ← {t("nav_dashboard")}
        </Link>
      </p>
      <header>
        <h1 className="text-2xl font-semibold text-brand-dark mb-1">
          {t("summary_title")}
        </h1>
        <p className="text-brand-text-muted">{t("summary_description")}</p>
      </header>

      {isLoading ? (
        <p className="text-brand-text-muted text-sm">{t("loading")}</p>
      ) : workouts.length === 0 ? (
        <p className="text-brand-text-muted text-sm">{t("summary_empty")}</p>
      ) : (
        <>
          <section>
            <h2 className="text-lg font-medium text-brand-dark mb-3">
              {t("summary_section_allTime")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-3">
              <StatCard
                value={workouts.length}
                label={t("summary_stat_trainingsAll")}
              />
              <StatCard value={allTimeSets} label={t("summary_stat_setsAll")} />
              <StatCard value={streak} label={t("user_stat_streakWeeks")} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-brand-dark mb-3">
              {t("summary_section_thisWeek")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                value={weekWorkouts.length}
                label={t("summary_stat_trainingsWeek")}
              />
              <StatCard value={weekSets} label={t("summary_stat_setsWeek")} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-brand-dark mb-3">
              {t("summary_section_thisMonth")}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <StatCard
                value={monthWorkouts.length}
                label={t("summary_stat_trainingsMonth")}
              />
              <StatCard value={monthSets} label={t("summary_stat_setsMonth")} />
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-brand-dark mb-3">
              {t("summary_byWeek")}
            </h2>
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-left text-brand-text-muted">
                    <th className="px-4 py-3 font-medium">
                      {t("summary_column_period")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right w-24">
                      {t("summary_column_trainings")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right w-24">
                      {t("summary_column_sets")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right w-28">
                      {t("summary_column_volume")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byWeek.map(({ weekStartMonday, workouts: wk }) => (
                    <tr
                      key={weekStartMonday.getTime()}
                      className="border-b border-brand-border last:border-0"
                    >
                      <td className="px-4 py-3 text-brand-dark">
                        {formatWeekRange(weekStartMonday)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {wk.length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {countTotalSets(wk)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatVolumeKgReps(sumWorkoutsVolumeKg(wk))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-brand-dark mb-3">
              {t("summary_byMonth")}
            </h2>
            <div className="rounded-xl border border-brand-border bg-brand-bg-soft overflow-x-auto">
              <table className="w-full min-w-[36rem] text-sm">
                <thead>
                  <tr className="border-b border-brand-border text-left text-brand-text-muted">
                    <th className="px-4 py-3 font-medium">
                      {t("summary_column_period")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right w-24">
                      {t("summary_column_trainings")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right w-24">
                      {t("summary_column_sets")}
                    </th>
                    <th className="px-4 py-3 font-medium text-right w-28">
                      {t("summary_column_volume")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {byMonth.map(({ year, monthIndex, workouts: mw }) => (
                    <tr
                      key={`${year}-${monthIndex}`}
                      className="border-b border-brand-border last:border-0"
                    >
                      <td className="px-4 py-3 text-brand-dark">
                        {formatMonthYear(year, monthIndex, t)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {mw.length}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {countTotalSets(mw)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {formatVolumeKgReps(sumWorkoutsVolumeKg(mw))}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-medium text-brand-dark mb-3">
              {t("user_personalBestHeading")}
            </h2>
            <PersonalBestsList id="personal-bests" />
          </section>
        </>
      )}
    </div>
  );
}
