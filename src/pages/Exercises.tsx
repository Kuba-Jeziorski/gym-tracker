import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import SelectLib from "react-select";
import { useLanguage } from "../contexts/LanguageContext";
import { useCustomExercises } from "../contexts/CustomExercisesContext";
import type { Exercise } from "../data/exercises";
import { MUSCLE_GROUPS } from "../data/exercises";
import { ConfirmModal } from "../components/ConfirmModal";
import { Switch } from "../components/Switch";
import { Select } from "../components/Select";
import { selectStyles } from "../components/Select";
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
  const [name, setName] = useState("");
  const [weight, setWeight] = useState(false);
  const [reps, setReps] = useState(false);
  const [time, setTime] = useState(false);
  const [mainMuscleGroup, setMainMuscleGroup] = useState("");
  const [allMuscleGroups, setAllMuscleGroups] = useState<string[]>([]);
  const [editTarget, setEditTarget] = useState<Exercise | null>(null);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);
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

  const resetForm = useCallback(() => {
    setName("");
    setWeight(false);
    setReps(false);
    setTime(false);
    setMainMuscleGroup("");
    setAllMuscleGroups([]);
    setEditTarget(null);
  }, []);

  const handleEdit = useCallback((ex: Exercise) => {
    setEditTarget(ex);
    setName(ex.name);
    setWeight(ex.weight);
    setReps(ex.reps);
    setTime(ex.time);
    setMainMuscleGroup(ex.main_muscle_group ?? "");
    setAllMuscleGroups(ex.all_muscle_groups ?? []);
    requestAnimationFrame(() =>
      formRef.current?.scrollIntoView({ behavior: "smooth" }),
    );
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    if (!weight && !reps && !time) return;
    if (editTarget) {
      updateCustomExercise(editTarget.unique_name, {
        name: trimmed,
        weight,
        reps,
        time,
        main_muscle_group: mainMuscleGroup.trim() || "",
        all_muscle_groups: [...allMuscleGroups],
      });
      resetForm();
    } else {
      addCustomExercise({
        name: trimmed,
        weight,
        reps,
        time,
        main_muscle_group: mainMuscleGroup.trim() || "",
        all_muscle_groups: [...allMuscleGroups],
      });
      resetForm();
    }
  };

  return (
    <div className="flex flex-col h-full min-h-0 gap-4">
      <header className="shrink-0">
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("exercises_title")}
        </h1>
        <p className="text-brand-text-muted">{t("exercises_description")}</p>
      </header>

      <form
        ref={formRef}
        onSubmit={handleSubmit}
        className="shrink-0 rounded-xl border border-brand-border bg-brand-bg-soft p-4 flex flex-col gap-4"
      >
        <h2 className="text-lg font-medium text-brand-dark mb-3">
          {editTarget ? t("exercises_editTitle") : t("exercises_add")}
        </h2>
        <div className="flex flex-wrap items-end gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-brand-text-muted">
              {t("exercises_namePlaceholder")}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("exercises_namePlaceholder")}
              className="rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder min-w-[16rem]"
            />
          </label>
          <div className="flex items-center gap-6 h-[42px]">
            <Switch
              checked={weight}
              onChange={setWeight}
              label={t("workout_weight")}
            />
            <Switch
              checked={reps}
              onChange={setReps}
              label={t("workout_reps")}
            />
            <Switch
              checked={time}
              onChange={setTime}
              label={t("workout_time")}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-sm text-brand-text-muted">
              {t("exercises_mainMuscleGroup")}
            </span>
            <Select
              value={mainMuscleGroup}
              onChange={setMainMuscleGroup}
              options={muscleGroupOptions}
              placeholder="—"
              className="min-w-[12rem]"
            />
          </label>
          <label className="flex flex-col gap-2">
            <span className="text-sm text-brand-text-muted">
              {t("exercises_allMuscleGroups")}
            </span>
            <div className="min-w-[24rem]">
              <SelectLib<MuscleOption, true>
                isMulti
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
                options={muscleGroupOptions}
                placeholder="—"
                styles={selectStyles}
                classNamePrefix="gym-select"
              />
            </div>
          </label>
        </div>
        <div className="">
          <div className="h-[42px] flex items-center gap-2">
            <button
              type="submit"
              disabled={!name.trim() || (!weight && !reps && !time)}
              className={cn(
                "rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                name.trim() && (weight || reps || time)
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
          "flex-1 min-h-0 relative scroll-fade-bottom scroll-fade-top",
          atBottom && "at-bottom",
          atTop && "at-top",
        )}
      >
        <div
          ref={scrollRef}
          className="h-full overflow-y-auto"
          onScroll={checkScroll}
        >
          <ul className="space-y-2 pr-1 pb-2">
            {sortedExercises.map((ex) => (
              <li
                key={ex.unique_name}
                className="flex items-center justify-between gap-2 rounded-lg border border-brand-border bg-brand-bg-soft px-4 py-3"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-medium text-brand-dark">
                    {getExerciseDisplayName(ex, t)}
                  </span>
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
                  <span className="text-sm text-brand-text-muted">
                    {[
                      ex.weight && t("workout_weight"),
                      ex.reps && t("workout_reps"),
                      ex.time && t("workout_time"),
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
                  </span>
                </div>
                {isCustom(ex) && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEdit(ex)}
                      className="text-sm text-brand-text-muted hover:text-brand-primary transition-colors"
                    >
                      {t("exercises_edit")}
                    </button>
                    <button
                      type="button"
                      onClick={() => setRemoveTarget(ex.unique_name)}
                      className="text-sm text-brand-text-muted hover:text-red-400 transition-colors"
                    >
                      {t("workout_remove")}
                    </button>
                  </div>
                )}
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
