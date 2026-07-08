import { useEffect, useMemo, useState } from "react";
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
  computeMaxVolumeOverTime,
  computeMaxWeightOverTime,
  formatPBDate,
  getExerciseUniqueNamesWithVolumeData,
  getExerciseUniqueNamesWithWeightData,
} from "../helpers/workoutStats";
import { kgToLb } from "../helpers/weightConversion";

type ChartType = "maxWeight" | "maxVolume";

type ChartPoint = {
  dateLabel: string;
  value: number;
  weight: number;
  reps: number | null;
};

function formatChartNumber(value: number): number {
  return value % 1 === 0 ? value : Math.round(value * 10) / 10;
}

function formatChartWeight(kg: number, unit: "kg" | "lb"): number {
  if (unit === "lb") {
    return formatChartNumber(kgToLb(kg));
  }
  return formatChartNumber(kg);
}

function formatChartVolume(volumeKg: number, unit: "kg" | "lb"): number {
  if (unit === "lb") {
    return formatChartNumber(volumeKg * kgToLb(1));
  }
  return formatChartNumber(volumeKg);
}

export function SummaryCharts() {
  const { t } = useLanguage();
  const { workouts, isLoading } = useCompletedWorkouts();
  const allExercises = useAllExercises();
  const { weightUnit } = useWeightUnit();
  const [chartType, setChartType] = useState<ChartType>("maxWeight");
  const [selectedExercise, setSelectedExercise] = useState("");

  const chartTypeOptions = useMemo(
    () => [
      { value: "maxWeight", label: t("summary_charts_typeMaxWeight") },
      { value: "maxVolume", label: t("summary_charts_typeMaxVolume") },
    ],
    [t],
  );

  const exerciseOptions = useMemo(() => {
    const withData = new Set(
      chartType === "maxWeight"
        ? getExerciseUniqueNamesWithWeightData(workouts)
        : getExerciseUniqueNamesWithVolumeData(workouts),
    );
    return buildSortedExerciseSelectOptions(allExercises, t).filter((o) =>
      withData.has(o.value),
    );
  }, [workouts, allExercises, t, chartType]);

  useEffect(() => {
    if (
      selectedExercise &&
      !exerciseOptions.some((o) => o.value === selectedExercise)
    ) {
      setSelectedExercise("");
    }
  }, [exerciseOptions, selectedExercise]);

  const chartData = useMemo((): ChartPoint[] => {
    if (!selectedExercise) return [];
    if (chartType === "maxWeight") {
      return computeMaxWeightOverTime(workouts, selectedExercise).map(
        (point) => ({
          dateLabel: formatPBDate(point.completedAt),
          value: formatChartWeight(point.maxWeightKg, weightUnit),
          weight: formatChartWeight(point.maxWeightKg, weightUnit),
          reps: point.repsAtMaxWeight,
        }),
      );
    }
    return computeMaxVolumeOverTime(workouts, selectedExercise).map(
      (point) => ({
        dateLabel: formatPBDate(point.completedAt),
        value: formatChartVolume(point.maxVolumeKg, weightUnit),
        weight: formatChartWeight(point.weightKgAtMaxVolume, weightUnit),
        reps: point.repsAtMaxVolume,
      }),
    );
  }, [workouts, selectedExercise, weightUnit, chartType]);

  const weightUnitLabel = t(weightUnit === "kg" ? "unit_kg" : "unit_lb");
  const volumeUnitLabel =
    weightUnit === "kg"
      ? t("summary_charts_volumeUnitKg")
      : t("summary_charts_volumeUnitLb");
  const chartTitle =
    chartType === "maxWeight"
      ? t("summary_charts_maxWeightTitle")
      : t("summary_charts_maxVolumeTitle");
  const emptyExercisesMessage =
    chartType === "maxWeight"
      ? t("summary_charts_emptyExercises")
      : t("summary_charts_emptyVolumeExercises");
  const emptyDataMessage =
    chartType === "maxWeight"
      ? t("summary_charts_emptyData")
      : t("summary_charts_emptyVolumeData");
  const yAxisUnit =
    chartType === "maxWeight" ? ` ${weightUnitLabel}` : ` ${volumeUnitLabel}`;

  if (isLoading) {
    return <p className="text-brand-text-muted text-sm">{t("loading")}</p>;
  }

  if (exerciseOptions.length === 0) {
    return (
      <p className="text-brand-text-muted text-sm">{emptyExercisesMessage}</p>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="block text-sm font-medium text-brand-dark mb-2">
            {t("summary_charts_selectChartType")}
          </p>
          <Select
            value={chartType}
            onChange={(value) => setChartType(value as ChartType)}
            options={chartTypeOptions}
            className="max-w-xs"
          />
        </div>
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
      </div>

      {!selectedExercise ? (
        <p className="text-brand-text-muted text-sm">
          {t("summary_charts_selectPlaceholder")}
        </p>
      ) : chartData.length === 0 ? (
        <p className="text-brand-text-muted text-sm">{emptyDataMessage}</p>
      ) : (
        <div className="rounded-xl border border-brand-border bg-brand-bg-soft p-4">
          <h2 className="text-lg font-medium text-brand-dark mb-4">
            {chartTitle}
          </h2>
          <div className="overflow-x-auto sm:overflow-x-visible">
            <div className="h-72 min-w-[550px] w-[550px] sm:w-full">
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
                    unit={yAxisUnit}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null;
                      const point = payload[0].payload as ChartPoint;
                      return (
                        <div className="rounded-lg border border-brand-border bg-brand-bg-soft px-3 py-2 text-sm shadow-sm">
                          <p className="text-brand-text-muted mb-1">{label}</p>
                          <p className="font-medium text-brand-text">
                            {point.value}
                            {chartType === "maxWeight"
                              ? ` ${weightUnitLabel}`
                              : ` ${volumeUnitLabel}`}
                          </p>
                          {chartType === "maxVolume" && (
                            <p className="text-brand-text-muted">
                              {point.weight} {weightUnitLabel}
                            </p>
                          )}
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
                    dataKey="value"
                    stroke="var(--brand-primary)"
                    strokeWidth={2}
                    dot={{ fill: "var(--brand-primary)", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
