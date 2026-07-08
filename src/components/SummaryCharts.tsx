import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Select } from "./Select";
import { useLanguage } from "../contexts/LanguageContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { buildSortedExerciseSelectOptions } from "../helpers/exerciseSelectOptions";
import {
  computeMaxWeightOverTime,
  formatPBDate,
  getExerciseUniqueNamesWithWeightData,
} from "../helpers/workoutStats";
import { kgToLb } from "../helpers/weightConversion";

function formatChartWeight(kg: number, unit: "kg" | "lb"): number {
  if (unit === "lb") {
    const lb = kgToLb(kg);
    return lb % 1 === 0 ? lb : Math.round(lb * 10) / 10;
  }
  return kg % 1 === 0 ? kg : Math.round(kg * 10) / 10;
}

type ChartPoint = {
  dateLabel: string;
  maxWeight: number;
  reps: number | null;
};

export function SummaryCharts() {
  const { t } = useLanguage();
  const { workouts, isLoading } = useCompletedWorkouts();
  const allExercises = useAllExercises();
  const { weightUnit } = useWeightUnit();
  const [selectedExercise, setSelectedExercise] = useState("");

  const exerciseOptions = useMemo(() => {
    const withWeight = new Set(getExerciseUniqueNamesWithWeightData(workouts));
    return buildSortedExerciseSelectOptions(allExercises, t).filter((o) =>
      withWeight.has(o.value),
    );
  }, [workouts, allExercises, t]);

  const chartData = useMemo(() => {
    if (!selectedExercise) return [];
    return computeMaxWeightOverTime(workouts, selectedExercise).map(
      (point) => ({
        dateLabel: formatPBDate(point.completedAt),
        maxWeight: formatChartWeight(point.maxWeightKg, weightUnit),
        reps: point.repsAtMaxWeight,
      }),
    );
  }, [workouts, selectedExercise, weightUnit]);

  const weightUnitLabel = t(weightUnit === "kg" ? "unit_kg" : "unit_lb");

  if (isLoading) {
    return <p className="text-brand-text-muted text-sm">{t("loading")}</p>;
  }

  if (exerciseOptions.length === 0) {
    return (
      <p className="text-brand-text-muted text-sm">
        {t("summary_charts_emptyExercises")}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="block text-sm font-medium text-brand-dark mb-2">
          {t("summary_charts_selectExercise")}
        </p>
        <Select
          value={selectedExercise}
          onChange={setSelectedExercise}
          options={exerciseOptions}
          placeholder={t("summary_charts_selectPlaceholder")}
          className="max-w-md"
        />
      </div>

      {!selectedExercise ? (
        <p className="text-brand-text-muted text-sm">
          {t("summary_charts_selectPlaceholder")}
        </p>
      ) : chartData.length === 0 ? (
        <p className="text-brand-text-muted text-sm">
          {t("summary_charts_emptyData")}
        </p>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
          <h2 className="text-lg font-medium text-brand-dark mb-4">
            {t("summary_charts_maxWeightTitle")}
          </h2>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 8, right: 16, left: 0, bottom: 8 }}
              >
                <CartesianGrid
                  stroke="var(--brand-border)"
                  strokeDasharray="3 3"
                />
                <XAxis
                  dataKey="dateLabel"
                  stroke="var(--brand-text-muted)"
                  tick={{ fill: "var(--brand-text-muted)", fontSize: 12 }}
                  tickMargin={8}
                />
                <YAxis
                  stroke="var(--brand-text-muted)"
                  tick={{ fill: "var(--brand-text-muted)", fontSize: 12 }}
                  tickMargin={8}
                  unit={` ${weightUnitLabel}`}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null;
                    const point = payload[0].payload as ChartPoint;
                    return (
                      <div className="rounded-lg border border-brand-border bg-brand-bg-soft px-3 py-2 text-sm shadow-sm">
                        <p className="text-brand-text-muted mb-1">{label}</p>
                        <p className="font-medium text-brand-text">
                          {point.maxWeight} {weightUnitLabel}
                        </p>
                        {point.reps != null && (
                          <p className="text-brand-text-muted">
                            {point.reps} {t("workout_reps")}
                          </p>
                        )}
                      </div>
                    );
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="maxWeight"
                  stroke="var(--brand-primary)"
                  strokeWidth={2}
                  dot={{ fill: "var(--brand-primary)", r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
