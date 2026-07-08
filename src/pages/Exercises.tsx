import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import SelectLib from "react-select";
import { useLanguage } from "../contexts/LanguageContext";
import { routes } from "../routes";
import { useCustomExercises } from "../contexts/CustomExercisesContext";
import { useFavoriteExercises } from "../contexts/FavoriteExercisesContext";
import { useExerciseNotes } from "../contexts/ExerciseNotesContext";
import type { Exercise } from "../data/exercises";
import { MUSCLE_GROUPS } from "../data/exercises";
import { ConfirmModal } from "../components/ConfirmModal";
import { Switch } from "../components/Switch";
import { Select } from "../components/Select";
import { selectStylesMulti } from "../components/Select";
import { cn } from "../lib/utils";

type MuscleOption = { value: string; label: string };

const muscleGroupOptions: MuscleOption[] = MUSCLE_GROUPS.map((m) => ({
  value: m,
  label: m.charAt(0).toUpperCase() + m.slice(1),
}));

const CUSTOM_PREFIX = "custom_";

function getExerciseDisplayName(
  ex: Exercise,
  t: (key: string) => string,
): string {
  return ex.unique_name.startsWith(CUSTOM_PREFIX) ? ex.name : t(ex.unique_name);
}

function isCustom(ex: Exercise): boolean {
  return ex.unique_name.startsWith(CUSTOM_PREFIX);
}

export function Exercises() {
  const { t } = useLanguage();
  const {
    allExercises,
    addCustomExercise,
    updateCustomExercise,
    removeCustomExercise,
  } = useCustomExercises();
  const { isFavorite, toggleFavorite } = useFavoriteExercises();
  const { notesByExerciseUniqueName, saveExerciseNote } = useExerciseNotes();
  const [formOpen, setFormOpen] = useState(false);
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(false);
  const [reps, setReps] = useState(false);
  const [time, setTime] = useState(false);
  const [distance, setDistance] = useState(false);
  const [avgVelocity, setAvgVelocity] = useState(false);
  const [pace, setPace] = useState(false);
  const [mainMuscleGroup, setMainMuscleGroup] = useState("");
  const [allMuscleGroups, setAllMuscleGroups] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const threshold = 2;
    setAtTop(el.scrollTop <= threshold);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= threshold);
  }, []);

  const sortedExercises = useMemo(
    () =>
      [...allExercises].sort((a, b) =>
        getExerciseDisplayName(a, t).localeCompare(
          getExerciseDisplayName(b, t),
          undefined,
          { sensitivity: "base" },
        ),
      ),
    [allExercises, t],
  );

  useEffect(() => {
    checkScroll();
  }, [allExercises.length, checkScroll]);

  useEffect(() => {
    if (editTarget) setFormOpen(true);
  }, [editTarget]);

  const resetForm = useCallback(() => {
    setName("");
    setWeight(false);
    setReps(false);
    setTime(false);
    setDistance(false);
    setAvgVelocity(false);
    setPace(false);
    setMainMuscleGroup("");
    setAllMuscleGroups([]);
    setEditTarget(null);
    setNoteDraft("");
    setFormOpen(false);
  }, []);

  const handleEdit = useCallback(
    (ex: Exercise) => {
      setEditTarget(ex);
      setName(ex.name);
      setWeight(ex.weight);
      setReps(ex.reps);
      setTime(ex.time);
      setDistance(Boolean(ex.distance));
      setAvgVelocity(Boolean(ex.avgVelocity));
      setPace(Boolean(ex.pace));
      setMainMuscleGroup(ex.main_muscle_group ?? "");
      setAllMuscleGroups(ex.all_muscle_groups ?? []);
      setNoteDraft(notesByExerciseUniqueName[ex.unique_name] ?? "");
      requestAnimationFrame(() =>
        formRef.current?.scrollIntoView({ behavior: "smooth" }),
      );
    },
    [notesByExerciseUniqueName],
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    const isEditingCustomExercise = editTarget ? isCustom(editTarget) : false;
    if (isEditingCustomExercise) {
      if (!trimmed) return;
      if (!weight && !reps && !time && !distance && !avgVelocity && !pace)
        return;
    }
    if (editTarget) {
      if (isEditingCustomExercise) {
        updateCustomExercise(editTarget.unique_name, {
          name: trimmed,
          weight,
          reps,
          time,
          distance,
          avgVelocity,
          pace,
          main_muscle_group: mainMuscleGroup.trim() || "",
          all_muscle_groups: [...allMuscleGroups],
        });
      }
      await saveExerciseNote(editTarget.unique_name, noteDraft);
      resetForm();
    } else {
      addCustomExercise({
        name: trimmed,
        weight,
        reps,
        time,
        distance,
        avgVelocity,
        pace,
        main_muscle_group: mainMuscleGroup.trim() || "",
        all_muscle_groups: [...allMuscleGroups],
      });
      resetForm();
    }
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 max-sm:flex-none gap-4">
      <header className="shrink-0">
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("exercises_title")}
        </h1>
        <p className="text-brand-text-muted">{t("exercises_description")}</p>
      </header>

      <div className="shrink-0">
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
          {formOpen ? t("workoutEdit_cancel") : t("exercises_add")}
        </button>
      </div>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className={cn(
          "shrink-0 rounded-xl border border-brand-border bg-brand-bg-soft p-4 flex flex-col gap-4",
          "max-xl:rounded-lg",
          !formOpen && !editTarget && "hidden",
        )}
      >
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {editTarget
            ? isCustom(editTarget)
              ? t("exercises_editTitle")
              : t("exerciseNote_modalTitle")
            : t("exercises_add")}
        </h2>
        {editTarget && !isCustom(editTarget) ? (
          <p className="text-sm text-brand-text-muted">
            {t("exerciseNote_modalDescription")}
          </p>
        ) : null}
        {(!editTarget || isCustom(editTarget)) && (
          <>
        <div className="flex flex-wrap items-start lg:items-end gap-4 max-sm:flex-col">
          <label className="flex flex-col gap-2 w-full sm:w-auto">
            <span className="text-sm text-brand-text-muted">
              {t("exercises_namePlaceholder")}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("exercises_namePlaceholder")}
              disabled={Boolean(editTarget && !isCustom(editTarget))}
              className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder min-w-0 w-full sm:min-w-[16rem] sm:w-auto"
            />
          </label>
          <div className="flex items-center gap-6 min-h-[42px] flex-wrap w-full">
            <Switch
              checked={weight}
              onChange={setWeight}
              disabled={Boolean(editTarget && !isCustom(editTarget))}
              label={t("workout_weight")}
            />
            <Switch
              checked={reps}
              onChange={setReps}
              disabled={Boolean(editTarget && !isCustom(editTarget))}
              label={t("workout_reps")}
            />
            <Switch
              checked={time}
              onChange={setTime}
              disabled={Boolean(editTarget && !isCustom(editTarget))}
              label={t("workout_time")}
            />
            <Switch
              checked={distance}
              onChange={setDistance}
              disabled={Boolean(editTarget && !isCustom(editTarget))}
              label={t("workout_distance")}
            />
            <Switch
              checked={avgVelocity}
              onChange={setAvgVelocity}
              disabled={Boolean(editTarget && !isCustom(editTarget))}
              label={t("workout_avgVelocity")}
            />
            <Switch
              checked={pace}
              onChange={setPace}
              disabled={Boolean(editTarget && !isCustom(editTarget))}
              label={t("workout_pace")}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-start lg:items-end gap-4 max-sm:flex-col">
          <label className="flex flex-col gap-2 flex-1 w-full">
            <span className="text-sm text-brand-text-muted">
              {t("exercises_mainMuscleGroup")}
            </span>
            <Select
              value={mainMuscleGroup}
              onChange={setMainMuscleGroup}
              options={muscleGroupOptions}
              placeholder="—"
              className="min-w-0 w-full sm:min-w-[12rem] sm:w-auto"
            />
          </label>
          <label className="flex flex-col gap-2 w-full">
            <span className="text-sm text-brand-text-muted">
              {t("exercises_allMuscleGroups")}
            </span>
            <div className="min-w-0 w-full sm:min-w-[24rem]">
              <SelectLib<MuscleOption, true>
                isMulti
                closeMenuOnSelect={false}
                hideSelectedOptions={false}
                value={allMuscleGroups.map((value) => ({
                  value,
                  label:
                    muscleGroupOptions.find((o) => o.value === value)?.label ??
                    value,
                }))}
                onChange={(selected) =>
                  setAllMuscleGroups(
                    selected ? selected.map((o) => o.value) : [],
                  )
                }
                isDisabled={Boolean(editTarget && !isCustom(editTarget))}
                options={muscleGroupOptions}
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
        </div>
          </>
        )}
        {editTarget && (
          <label className="flex flex-col gap-2">
            {isCustom(editTarget) ? (
              <span className="text-sm text-brand-text-muted">
                {t("exerciseNote_modalTitle")}
              </span>
            ) : null}
            <textarea
              value={noteDraft}
              onChange={(e) => setNoteDraft(e.target.value)}
              rows={4}
              placeholder={t("exerciseNote_placeholder")}
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
            />
          </label>
        )}
        <div className="">
          <div className="h-[42px] flex items-center gap-2">
            <button
              type="submit"
              disabled={
                !editTarget &&
                (!name.trim() ||
                  (!weight &&
                    !reps &&
                    !time &&
                    !distance &&
                    !avgVelocity &&
                    !pace))
              }
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                editTarget ||
                  (name.trim() &&
                    (weight || reps || time || distance || avgVelocity || pace))
                  ? "border-transparent bg-brand-primary text-brand-bg hover:bg-brand-primary-hover"
                  : "border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed",
              )}
            >
              {editTarget ? t("workoutEdit_save") : t("exercises_add")}
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

      <div
        className={cn(
          "flex-1 min-h-0 relative max-sm:flex-none max-sm:min-h-0",
          "sm:scroll-fade-bottom sm:scroll-fade-top",
          atBottom && "at-bottom",
          atTop && "at-top",
        )}
      >
        <div
          ref={scrollRef}
          className="max-sm:h-auto max-sm:overflow-visible sm:h-full sm:overflow-y-auto"
          onScroll={checkScroll}
        >
          <ul className="space-y-2 pr-3 pb-2">
            {sortedExercises.map((ex) => (
              <li
                key={ex.unique_name}
                className={cn(
                  "rounded-lg border border-brand-border bg-brand-bg-soft px-4 py-3",
                  "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between",
                )}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <button
                      type="button"
                      onClick={() => toggleFavorite(ex.unique_name)}
                      aria-pressed={isFavorite(ex.unique_name)}
                      aria-label={
                        isFavorite(ex.unique_name)
                          ? t("exercises_favoriteRemove")
                          : t("exercises_favoriteToggle")
                      }
                      className={cn(
                        "shrink-0 rounded-md p-1.5 leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary",
                        isFavorite(ex.unique_name)
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-brand-text-muted hover:text-brand-text",
                      )}
                    >
                      <span aria-hidden className="text-lg">
                        {isFavorite(ex.unique_name) ? "★" : "☆"}
                      </span>
                    </button>
                    <Link
                      to={routes.exerciseHistory(ex.unique_name)}
                      title={t("exercises_nameLinkTitle")}
                      className={cn(
                        "font-medium text-brand-dark hover:text-brand-primary",
                        "underline-offset-2 hover:underline decoration-brand-primary/80",
                        "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary rounded",
                      )}
                    >
                      {getExerciseDisplayName(ex, t)}
                    </Link>
                    <span
                      className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        isCustom(ex)
                          ? "bg-brand-primary/15 text-brand-primary"
                          : "bg-brand-border/50 text-brand-text-muted",
                      )}
                    >
                      {isCustom(ex)
                        ? t("exercises_custom")
                        : t("exercises_builtIn")}
                    </span>
                  </div>
                  <div className="text-sm text-brand-text-muted mt-1">
                    {[
                      ex.weight && t("workout_weight"),
                      ex.reps && t("workout_reps"),
                      ex.time && t("workout_time"),
                      ex.distance && t("workout_distance"),
                      ex.avgVelocity && t("workout_avgVelocity"),
                      ex.pace && t("workout_pace"),
                      (ex.all_muscle_groups?.length ?? 0) > 0
                        ? ex.all_muscle_groups
                            .map((m) => m.charAt(0).toUpperCase() + m.slice(1))
                            .join(", ")
                        : ex.main_muscle_group
                          ? ex.main_muscle_group.charAt(0).toUpperCase() +
                            ex.main_muscle_group.slice(1)
                          : null,
                    ]
                      .filter(Boolean)
                      .join(" · ")}
                  </div>
                  {(notesByExerciseUniqueName[ex.unique_name] ?? "").trim() && (
                    <p className="text-sm text-brand-text-muted mt-2 whitespace-pre-wrap rounded-lg border border-brand-border bg-brand-bg px-2.5 py-2">
                      {notesByExerciseUniqueName[ex.unique_name]}
                    </p>
                  )}
                </div>
                <div className="flex gap-2 sm:items-center sm:justify-end">
                  {isCustom(ex) ? (
                    <button
                      type="button"
                      onClick={() => handleEdit(ex)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft",
                      )}
                    >
                      {t("exercises_edit")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleEdit(ex)}
                      className={cn(
                        "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                        "border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft",
                      )}
                    >
                      {t("exerciseNote_edit")}
                    </button>
                  )}
                  {isCustom(ex) && (
                    <>
                      <button
                        type="button"
                        onClick={() => setRemoveTarget(ex.unique_name)}
                        className={cn(
                          "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                          "border border-brand-border text-brand-text-muted hover:bg-brand-bg-soft hover:text-red-400 hover:border-red-500/40",
                        )}
                      >
                        {t("workout_remove")}
                      </button>
                    </>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <ConfirmModal
        open={removeTarget !== null}
        title={t("exercises_removeConfirmTitle")}
        message={t("exercises_removeConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={() => {
          if (removeTarget) removeCustomExercise(removeTarget);
          setRemoveTarget(null);
        }}
        onCancel={() => setRemoveTarget(null)}
        variant="danger"
      />
    </div>
  );
}
