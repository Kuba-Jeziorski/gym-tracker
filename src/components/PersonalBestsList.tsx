import { useMemo } from "react";
import { Link } from "react-router-dom";
import Tooltip from "@mui/material/Tooltip";
import { useLanguage } from "../contexts/LanguageContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { routes } from "../routes";
import {
  computePersonalBests,
  formatPBDate,
  formatTimeSeconds,
} from "../helpers/workoutStats";
import { kgToLb } from "../helpers/weightConversion";

function getExerciseDisplayName(
  uniqueName: string,
  allExercises: { unique_name: string; name: string }[],
  t: (key: string) => string,
) {
  const ex = allExercises.find((e) => e.unique_name === uniqueName);
  if (ex) return ex.unique_name.startsWith("custom_") ? ex.name : t(uniqueName);
  return uniqueName;
}

type PersonalBestsListProps = {
  limit?: number;
  showViewAllLink?: boolean;
  id?: string;
};

export function PersonalBestsList({
  limit,
  showViewAllLink = false,
  id,
}: PersonalBestsListProps) {
  const { t } = useLanguage();
  const { workouts, isLoading } = useCompletedWorkouts();
  const allExercises = useAllExercises();
  const { weightUnit } = useWeightUnit();

  const pbList = useMemo(
    () =>
      Array.from(computePersonalBests(workouts).entries())
        .map(([uniqueName, pb]) => ({
          uniqueName,
          displayName: getExerciseDisplayName(uniqueName, allExercises, t),
          ...pb,
        }))
        .sort((a, b) => a.displayName.localeCompare(b.displayName)),
    [workouts, allExercises, t],
  );

  const displayed = limit != null ? pbList.slice(0, limit) : pbList;
  const hasMore = limit != null && pbList.length > limit;

  if (isLoading) {
    return <p className="text-brand-text-muted text-sm">{t("loading")}</p>;
  }

  if (pbList.length === 0) {
    return (
      <p className="text-brand-text-muted text-sm">
        {t("user_personalBestEmpty")}
      </p>
    );
  }

  const displayWeight = (kg: number) =>
    weightUnit === "lb"
      ? kgToLb(kg) % 1 === 0
        ? kgToLb(kg).toString()
        : kgToLb(kg).toFixed(1)
      : kg.toString();

  return (
    <>
      <div
        id={id}
        className="rounded-xl border border-brand-border bg-brand-bg-soft overflow-hidden"
      >
        <ul className="divide-y divide-brand-border">
          {displayed.map(
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
                          <Tooltip title={t("user_pb_tooltip_highestWeight")}>
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
                          <Tooltip title={t("user_pb_tooltip_highestVolume")}>
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
      {showViewAllLink && hasMore && (
        <Link
          to={routes.summary}
          state={{ section: "personal-bests" }}
          className="mt-3 inline-block text-sm font-medium text-brand-accent hover:text-brand-primary-hover transition-colors"
        >
          {t("dashboard_viewAll")} →
        </Link>
      )}
    </>
  );
}
