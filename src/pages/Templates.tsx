import { useState, useCallback, useRef } from "react";
import SelectLib from "react-select";
import { useLanguage } from "../contexts/LanguageContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import type { WorkoutTemplate } from "../data/workoutTemplates";
import { selectStylesMulti } from "../components/Select";
import { ConfirmModal } from "../components/ConfirmModal";
import { cn } from "../lib/utils";

const CUSTOM_PREFIX = "custom_";

type Option = { value: string; label: string };

function getExerciseLabel(
  uniqueName: string,
  name: string,
  t: (key: string) => string,
): string {
  return uniqueName.startsWith(CUSTOM_PREFIX) ? name : t(uniqueName);
}

export function Templates() {
  const { t } = useLanguage();
  const allExercises = useAllExercises();
  const { templates, addTemplate, updateTemplate, removeTemplate, isTemplateNameTaken } =
    useWorkoutTemplates();
  const [templateName, setTemplateName] = useState("");
  const [selectedUniqueNames, setSelectedUniqueNames] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<WorkoutTemplate | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const options: Option[] = allExercises.map((ex) => ({
    value: ex.unique_name,
    label: getExerciseLabel(ex.unique_name, ex.name, t),
  }));

  const selectedOptions = selectedUniqueNames
    .map((value) => options.find((o) => o.value === value))
    .filter((o): o is Option => o != null);

  const resetForm = useCallback(() => {
    setTemplateName("");
    setSelectedUniqueNames([]);
    setEditTarget(null);
  }, []);

  const handleEdit = useCallback((template: WorkoutTemplate) => {
    setEditTarget(template);
    setTemplateName(template.name);
    setSelectedUniqueNames([...template.exerciseUniqueNames]);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  }, []);

  const nameIsDuplicate =
    templateName.trim() !== "" &&
    isTemplateNameTaken(templateName, editTarget?.id);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = templateName.trim();
    if (!trimmed) return;
    if (nameIsDuplicate) return;
    if (selectedUniqueNames.length === 0) return;
    if (editTarget) {
      updateTemplate(editTarget.id, {
        name: trimmed,
        exerciseUniqueNames: [...selectedUniqueNames],
      });
      resetForm();
    } else {
      addTemplate({
        name: trimmed,
        exerciseUniqueNames: [...selectedUniqueNames],
      });
      resetForm();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("templates_title")}
        </h1>
        <p className="text-brand-text-muted mb-6">{t("templates_description")}</p>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="shrink-0 rounded-xl border border-brand-border bg-brand-bg-soft p-4 mb-4"
      >
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {editTarget ? t("templates_editTitle") : t("templates_create")}
        </h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm text-brand-text-muted">
              {t("templates_namePlaceholder")}
            </span>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder={t("templates_namePlaceholder")}
              className={cn(
                "rounded-lg border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder max-w-md",
                nameIsDuplicate
                  ? "border-red-500/70 focus:outline-red-500/70"
                  : "border-brand-border",
              )}
              aria-invalid={nameIsDuplicate}
              aria-describedby={nameIsDuplicate ? "template-name-error" : undefined}
            />
            {nameIsDuplicate && (
              <span
                id="template-name-error"
                className="text-sm text-red-400"
                role="alert"
              >
                {t("templates_nameDuplicate")}
              </span>
            )}
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm text-brand-text-muted">
              {t("templates_exercisesLabel")}
            </span>
            <div className="w-full min-w-0">
              <SelectLib<Option, true>
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                value={selectedOptions}
                onChange={(selected) =>
                  setSelectedUniqueNames(
                    selected ? selected.map((o) => o.value) : [],
                  )
                }
                options={options}
                placeholder="—"
                styles={selectStylesMulti}
                classNamePrefix="gym-select"
                className="min-w-0"
                menuPortalTarget={
                  typeof document !== "undefined" ? document.body : null
                }
                menuPosition="fixed"
              />
            </div>
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={!templateName.trim() || nameIsDuplicate || selectedUniqueNames.length === 0}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors w-fit",
                templateName.trim() && !nameIsDuplicate && selectedUniqueNames.length > 0
                  ? "border-transparent bg-brand-primary text-brand-bg hover:bg-brand-primary-hover"
                  : "border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed",
              )}
            >
              {editTarget ? t("workoutEdit_save") : t("templates_create")}
            </button>
            {editTarget && (
              <button
                type="button"
                onClick={resetForm}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors"
              >
                {t("workoutEdit_cancel")}
              </button>
            )}
          </div>
        </div>
      </form>

      {templates.length === 0 ? (
        <p className="text-brand-text-muted text-sm shrink-0">
          {t("templates_empty")}
        </p>
      ) : (
        <div className="flex-1 min-h-0 min-w-0 flex flex-col">
          <ul
            className={cn(
              "list-none m-0 p-0 space-y-2 flex-1 min-h-0 overflow-y-auto min-w-0 pr-1",
            )}
          >
          {templates.map((template) => (
            <li
              key={template.id}
              className="flex items-center justify-between gap-2 rounded-lg border border-brand-border bg-brand-bg-soft px-4 py-3 list-none"
            >
              <div>
                <p className="font-medium text-brand-dark">{template.name}</p>
                <p className="text-sm text-brand-text-muted">
                  {template.exerciseUniqueNames.length}{" "}
                  {t("templates_exercises")}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(template)}
                  className="text-sm text-brand-text-muted hover:text-brand-primary transition-colors"
                >
                  {t("templates_edit")}
                </button>
                <button
                  type="button"
                  onClick={() => setRemoveTarget(template.id)}
                  className="text-sm text-brand-text-muted hover:text-red-400 transition-colors"
                >
                  {t("workout_remove")}
                </button>
              </div>
            </li>
          ))}
          </ul>
        </div>
      )}

      <ConfirmModal
        open={removeTarget !== null}
        title={t("templates_removeConfirmTitle")}
        message={t("templates_removeConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={() => {
          if (removeTarget) removeTemplate(removeTarget);
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
        variant="danger"
      />
    </div>
  );
}
