import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import { routes } from "../routes";
import { ConfirmModal } from "../components/ConfirmModal";
import { CompletedWorkoutReadonlyContent } from "../components/CompletedWorkoutReadonlyContent";

export function WorkoutDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { workouts, removeWorkout } = useCompletedWorkouts();
  const { templates } = useWorkoutTemplates();
  const [removeModalOpen, setRemoveModalOpen] = useState(false);

  const workout = id ? workouts.find((w) => w.id === id) : null;

  const onRemoveConfirm = () => {
    if (id) {
      removeWorkout(id);
      setRemoveModalOpen(false);
      navigate(routes.workout, { state: { tab: "completed" } });
    }
  };

  if (!id) {
    return (
      <div>
        <Link
          to={routes.workout}
          state={{ tab: "completed" }}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
        >
          ← {t("workoutDetail_back")}
        </Link>
        <p className="text-brand-text-muted">
          {t("workoutDetail_description")}
        </p>
      </div>
    );
  }

  if (!workout) {
    return (
      <div>
        <Link
          to={routes.workout}
          state={{ tab: "completed" }}
          className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
        >
          ← {t("workoutDetail_back")}
        </Link>
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("workoutDetail_title")}
        </h1>
        <p className="text-brand-text-muted">{t("notFound_message")}</p>
      </div>
    );
  }

  const completedDate = new Date(workout.completedAt);
  const startedDate = new Date(workout.startedAt);

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
    (workout.templateId
      ? templates.find((tmpl) => tmpl.id === workout.templateId)?.name
      : "") || workout.templateName?.trim();

  return (
    <div>
      <Link
        to={routes.workout}
        state={{ tab: "completed" }}
        className="text-brand-accent hover:text-brand-primary-hover text-sm mb-4 inline-block"
      >
        ← {t("workoutDetail_back")}
      </Link>
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-brand-dark mb-1">
            {t("workoutDetail_title")} — {formatDMY(completedDate)}
          </h1>
          {templateName ? (
            <p className="text-brand-text-muted text-sm">
              {t("workout_templateLabel")}: {templateName}
            </p>
          ) : null}
          <p className="text-brand-text-muted text-sm">{startedLine}</p>
          <p className="text-brand-text-muted text-sm">{completedLine}</p>
        </div>
        <div className="flex gap-2">
          <Link
            to={routes.workoutDetailEdit(id)}
            className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg-soft transition-colors"
          >
            {t("workoutDetail_edit")}
          </Link>
          <button
            type="button"
            onClick={() => setRemoveModalOpen(true)}
            className="rounded-lg border border-red-500/50 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 transition-colors"
          >
            {t("workoutDetail_remove")}
          </button>
        </div>
      </header>
      <ConfirmModal
        open={removeModalOpen}
        title={t("workoutDetail_removeConfirmTitle")}
        message={t("workoutDetail_removeConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={onRemoveConfirm}
        onCancel={() => setRemoveModalOpen(false)}
        variant="danger"
      />
      <CompletedWorkoutReadonlyContent workout={workout} />
    </div>
  );
}
