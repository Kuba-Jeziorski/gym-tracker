import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import SelectLib from "react-select";
import { useLanguage } from "../contexts/LanguageContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useFavoriteExercises } from "../contexts/FavoriteExercisesContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import type { WorkoutTemplate } from "../data/workoutTemplates";
import { selectStylesMulti } from "../components/Select";
import { ConfirmModal } from "../components/ConfirmModal";
import { Switch } from "../components/Switch";
import { cn } from "../lib/utils";
import { routes } from "../routes";
import {
  buildSortedExerciseSelectOptions,
  filterExerciseOptionsForPicker,
  mergeExerciseOptionsWithValues,
} from "../helpers/exerciseSelectOptions";
import {
  clearCustomTemplateDraft,
  readCustomTemplateDraft,
  upsertCustomTemplateDraft,
} from "../helpers/customTemplateDraftStorage";

type Option = { value: string; label: string };

function readInitialTemplateFormState(): {
  templateName: string;
  selectedUniqueNames: string[];
  formOpen: boolean;
  editTarget: WorkoutTemplate | null;
} {
  const empty = {
    templateName: "",
    selectedUniqueNames: [] as string[],
    formOpen: false,
    editTarget: null as WorkoutTemplate | null,
  };
  if (typeof window === "undefined") return empty;
  const draft = readCustomTemplateDraft();
  if (!draft) return empty;
  const editTarget =
    draft.mode === "edit" && draft.editTemplateId
      ? {
          id: draft.editTemplateId,
          name: draft.templateName,
          exerciseUniqueNames: [...draft.selectedUniqueNames],
        }
      : null;
  return {
    templateName: draft.templateName,
    selectedUniqueNames: draft.selectedUniqueNames,
    formOpen: draft.formOpen,
    editTarget,
  };
}

export function Templates() {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const allExercises = useAllExercises();
  const { favoriteIdSet, pickerFavoritesOnly, setPickerFavoritesOnly } =
    useFavoriteExercises();
  const {
    templates,
    addTemplate,
    updateTemplate,
    removeTemplate,
    isTemplateNameTaken,
  } = useWorkoutTemplates();
  const initialFormRef = useRef<ReturnType<typeof readInitialTemplateFormState> | null>(
    null,
  );
  if (initialFormRef.current === null) {
    initialFormRef.current = readInitialTemplateFormState();
  }
  const initialForm = initialFormRef.current;
  const [templateName, setTemplateName] = useState(initialForm.templateName);
  const [selectedUniqueNames, setSelectedUniqueNames] = useState(
    initialForm.selectedUniqueNames,
  );
  const [editTarget, setEditTarget] = useState<WorkoutTemplate | null>(
    initialForm.editTarget,
  );
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(initialForm.formOpen);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (editTarget) setFormOpen(true);
  }, [editTarget]);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 639px)");
    const updateViewportFlag = () => {
      setIsMobileViewport(media.matches);
    };
    updateViewportFlag();
    media.addEventListener("change", updateViewportFlag);
    return () => {
      media.removeEventListener("change", updateViewportFlag);
    };
  }, []);

  useEffect(() => {
    const active = formOpen || editTarget !== null;
    if (!active) {
      clearCustomTemplateDraft();
      return;
    }
    const hasProgress =
      templateName.trim().length > 0 || selectedUniqueNames.length > 0;
    if (!hasProgress) {
      clearCustomTemplateDraft();
      return;
    }
    upsertCustomTemplateDraft({
      formOpen,
      mode: editTarget ? "edit" : "create",
      editTemplateId: editTarget?.id ?? null,
      templateName,
      selectedUniqueNames,
    });
  }, [templateName, selectedUniqueNames, formOpen, editTarget]);

  const fullOptions = useMemo(
    () => buildSortedExerciseSelectOptions(allExercises, t),
    [allExercises, t],
  );

  const pickerOptions = useMemo(
    () =>
      filterExerciseOptionsForPicker(
        fullOptions,
        favoriteIdSet,
        pickerFavoritesOnly,
      ),
    [fullOptions, favoriteIdSet, pickerFavoritesOnly],
  );

  const options: Option[] = useMemo(
    () =>
      mergeExerciseOptionsWithValues(
        pickerOptions,
        fullOptions,
        selectedUniqueNames,
      ),
    [pickerOptions, fullOptions, selectedUniqueNames],
  );

  const sortedTemplates = useMemo(
    () =>
      [...templates].sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      ),
    [templates],
  );

  const selectedOptions = selectedUniqueNames
    .map((value) => options.find((o) => o.value === value))
    .filter((o): o is Option => o != null);

  const selectedExerciseItems = selectedUniqueNames
    .map((uniqueName) => {
      const exercise = allExercises.find((ex) => ex.unique_name === uniqueName);
      if (!exercise) return null;
      return {
        uniqueName,
        label: exercise.unique_name.startsWith("custom_")
          ? exercise.name
          : t(exercise.unique_name),
      };
    })
    .filter(
      (
        item,
      ): item is {
        uniqueName: string;
        label: string;
      } => item != null,
    );

  const resetForm = useCallback(() => {
    setTemplateName("");
    setSelectedUniqueNames([]);
    setEditTarget(null);
    setFormOpen(false);
    clearCustomTemplateDraft();
  }, []);

  const handleRemoveExercise = useCallback((uniqueName: string) => {
    setSelectedUniqueNames((prev) =>
      prev.filter((value) => value !== uniqueName),
    );
  }, []);

  const moveExercise = useCallback((fromIndex: number, toIndex: number) => {
    setSelectedUniqueNames((prev) => {
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= prev.length ||
        toIndex >= prev.length
      ) {
        return prev;
      }
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }, []);

  const handleSelectionChange = useCallback((selected: readonly Option[] | null) => {
    const nextValues = selected ? selected.map((o) => o.value) : [];
    setSelectedUniqueNames((prev) => {
      const keptInOrder = prev.filter((value) => nextValues.includes(value));
      const appendedNew = nextValues.filter((value) => !keptInOrder.includes(value));
      return [...keptInOrder, ...appendedNew];
    });
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
    <div className="flex flex-col flex-1 min-h-0 overflow-y-auto pr-3">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("templates_title")}
        </h1>
        <p className="text-brand-text-muted mb-6">
          {t("templates_description")}
        </p>
      </div>

      <div className="shrink-0 mb-4">
        <button
          type="button"
          onClick={() => setFormOpen((v) => !v)}
          className={cn(
            "w-fit max-[479px]:w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
            formOpen
              ? "border-brand-border bg-brand-bg-soft text-brand-text"
              : "border-transparent bg-brand-primary text-brand-bg hover:bg-brand-primary-hover",
          )}
        >
          {formOpen ? t("workoutEdit_cancel") : t("templates_create")}
        </button>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cn(
          "shrink-0 rounded-xl border border-brand-border bg-brand-bg-soft p-4 mb-4",
          "max-xl:rounded-lg",
          !formOpen && !editTarget && "hidden",
        )}
      >
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {editTarget ? t("templates_editTitle") : t("templates_create")}
        </h2>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <Switch
              checked={pickerFavoritesOnly}
              onChange={setPickerFavoritesOnly}
              disabled={favoriteIdSet.size === 0}
              label={t("exercisePicker_favoritesOnly")}
            />
            {favoriteIdSet.size === 0 && (
              <p className="text-xs text-brand-text-muted max-w-xl">
                {t("exercisePicker_favoritesOnlyDisabledHint")}
              </p>
            )}
          </div>
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
              aria-describedby={
                nameIsDuplicate ? "template-name-error" : undefined
              }
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
                closeMenuOnSelect
                hideSelectedOptions={false}
                controlShouldRenderValue={false}
                value={selectedOptions}
                onChange={handleSelectionChange}
                options={options}
                placeholder="—"
                styles={selectStylesMulti}
                classNamePrefix="gym-select"
                className="min-w-0"
                menuPortalTarget={
                  !isMobileViewport && typeof document !== "undefined"
                    ? document.body
                    : null
                }
                menuPosition={isMobileViewport ? "absolute" : "fixed"}
                menuPlacement="bottom"
              />
            </div>
            {selectedExerciseItems.length > 0 && (
              <ul className="mt-3 space-y-2">
                {selectedExerciseItems.map((item, index) => (
                  <li
                    key={item.uniqueName}
                    className="flex items-center justify-between gap-3 rounded-lg border border-brand-border bg-brand-bg px-3 py-2"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-brand-text">
                        {index + 1}. {item.label}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => moveExercise(index, index - 1)}
                        disabled={index === 0}
                        className={cn(
                          "text-xs rounded border px-2 py-1 transition-colors",
                          index === 0
                            ? "border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed"
                            : "border-brand-border text-brand-text-muted hover:bg-brand-bg-soft",
                        )}
                      >
                        {t("templates_moveUp")}
                      </button>
                      <button
                        type="button"
                        onClick={() => moveExercise(index, index + 1)}
                        disabled={index === selectedExerciseItems.length - 1}
                        className={cn(
                          "text-xs rounded border px-2 py-1 transition-colors",
                          index === selectedExerciseItems.length - 1
                            ? "border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed"
                            : "border-brand-border text-brand-text-muted hover:bg-brand-bg-soft",
                        )}
                      >
                        {t("templates_moveDown")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveExercise(item.uniqueName)}
                        className="text-xs text-brand-text-muted hover:text-red-400 transition-colors"
                      >
                        {t("workout_remove")}
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </label>
          <div className="flex items-center gap-2">
            <button
              type="submit"
              disabled={
                !templateName.trim() ||
                nameIsDuplicate ||
                selectedUniqueNames.length === 0
              }
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors w-fit",
                templateName.trim() &&
                  !nameIsDuplicate &&
                  selectedUniqueNames.length > 0
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
              "list-none m-0 p-0 space-y-2 flex-1 min-h-0 overflow-y-auto min-w-0 pr-3",
            )}
          >
            {sortedTemplates.map((template) => (
              <li
                key={template.id}
                className={cn(
                  "rounded-lg border border-brand-border bg-brand-bg-soft px-4 py-3 list-none",
                  "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                )}
              >
                <div className="min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      navigate(routes.workout, {
                        state: { tab: "completed", templateId: template.id },
                      })
                    }
                    className="font-medium text-brand-dark hover:text-brand-primary transition-colors text-left"
                  >
                    {template.name}
                  </button>
                  <p className="text-sm text-brand-text-muted mt-1">
                    {template.exerciseUniqueNames.length}{" "}
                    {t("templates_exercises")}
                  </p>
                </div>
                <div className="flex gap-2 sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => handleEdit(template)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft",
                    )}
                  >
                    {t("templates_edit")}
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoveTarget(template.id)}
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      "border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft hover:text-red-400 hover:border-red-500/40",
                    )}
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
