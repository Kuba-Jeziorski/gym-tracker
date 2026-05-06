import { Link } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import type { StoredWorkout } from "../data/workoutStorage";
import { routes } from "../routes";
import { CompletedWorkoutReadonlyContent } from "./CompletedWorkoutReadonlyContent";

export function WorkoutLastTemplateTrainingPanel({
  lastWorkout,
}: {
  lastWorkout: StoredWorkout | null;
}) {
  const { t } = useLanguage();
  const { templates } = useWorkoutTemplates();

  if (!lastWorkout) {
    return (
      <p className="text-sm text-brand-text-muted py-2">
        {t("workout_lastTrainingEmpty")}
      </p>
    );
  }

  const completedDate = new Date(lastWorkout.completedAt);
  const startedDate = new Date(lastWorkout.startedAt);

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
    (lastWorkout.templateId
      ? templates.find((tmpl) => tmpl.id === lastWorkout.templateId)?.name
      : "") || lastWorkout.templateName?.trim();

  return (
    <div className="flex flex-col gap-4 min-h-0">
      <header className="shrink-0 space-y-1">
        <h2 className="text-lg font-semibold text-brand-dark">
          {t("workoutDetail_title")} — {formatDMY(completedDate)}
        </h2>
        {templateName ? (
          <p className="text-brand-text-muted text-sm">
            {t("workout_templateLabel")}: {templateName}
          </p>
        ) : null}
        <p className="text-brand-text-muted text-sm">{startedLine}</p>
        <p className="text-brand-text-muted text-sm">{completedLine}</p>
        <Link
          to={routes.workoutDetail(lastWorkout.id)}
          state={{ tab: "completed" }}
          className="inline-block text-sm text-brand-accent hover:text-brand-primary-hover mt-2"
        >
          {t("workout_openFullDetails")}
        </Link>
      </header>
      <CompletedWorkoutReadonlyContent workout={lastWorkout} />
    </div>
  );
}
