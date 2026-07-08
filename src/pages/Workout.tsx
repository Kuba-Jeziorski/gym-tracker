import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  type FocusEventHandler,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import { WorkoutLastTemplateTrainingPanel } from "../components/WorkoutLastTemplateTrainingPanel";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import type { UseFormRegisterReturn } from "react-hook-form";
import { useCurrentWorkout } from "../contexts/CurrentWorkoutContext";
import { useWorkoutTemplates } from "../contexts/WorkoutTemplatesContext";
import { useLanguage } from "../contexts/LanguageContext";
import { useWeightUnit } from "../contexts/WeightUnitContext";
import { useCompletedWorkouts } from "../contexts/CompletedWorkoutsContext";
import { useAllExercises } from "../contexts/CustomExercisesContext";
import { useFavoriteExercises } from "../contexts/FavoriteExercisesContext";
import type { StoredWorkout } from "../data/workoutStorage";
import { inputWeightToKg } from "../helpers/weightConversion";
import {
  parseAvgVelocityKmh,
  parseDistanceKm,
  parseDurationToSeconds,
  parsePaceToMinPerKm,
} from "../helpers/kinematics";
import {
  readCurrentWorkoutDraft,
  upsertCurrentWorkoutDraft,
  clearCurrentWorkoutDraft,
} from "../helpers/currentWorkoutDraftStorage";
import { Select } from "../components/Select";
import { Switch } from "../components/Switch";
import { ConfirmModal } from "../components/ConfirmModal";
import { routes } from "../routes";
import { cn } from "../lib/utils";
import {
  preventViewportZoomOnInputFocus,
  restoreViewportAfterInputBlur,
} from "../helpers/restoreViewportAfterInputBlur";
import {
  buildSortedExerciseSelectOptions,
  filterExerciseOptionsForPicker,
  withSelectedExerciseOption,
} from "../helpers/exerciseSelectOptions";

type SetValues = {
  weight?: string;
  reps?: string;
  time?: string;
  distance?: string;
  avgVelocity?: string;
  pace?: string;
};

type WorkoutExercise = {
  exerciseUniqueName: string;
  sets: SetValues[];
};

type WorkoutFormValues = {
  exercises: WorkoutExercise[];
};

const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000; // 1 day

const defaultSet = (): SetValues => ({
  weight: "",
  reps: "",
  time: "",
  distance: "",
  avgVelocity: "",
  pace: "",
});

function isEmptySet(s: SetValues): boolean {
  return (
    !(s.weight?.trim() ?? "") &&
    !(s.reps?.trim() ?? "") &&
    !(s.time?.trim() ?? "") &&
    !(s.distance?.trim() ?? "") &&
    !(s.avgVelocity?.trim() ?? "") &&
    !(s.pace?.trim() ?? "")
  );
}

function canAddSet(
  exercises: {
    weight?: boolean;
    reps?: boolean;
    time?: boolean;
    distance?: boolean;
    avgVelocity?: boolean;
    pace?: boolean;
    unique_name: string;
  }[],
  sets: SetValues[],
  exerciseUniqueName: string,
): boolean {
  if (sets.length === 0) return true;
  const exercise = exercises.find((e) => e.unique_name === exerciseUniqueName);
  if (!exercise) return false;
  const last = sets[sets.length - 1];
  if (exercise.weight && !last.weight?.trim()) return false;
  if (exercise.reps && !last.reps?.trim()) return false;
  const isKinematics =
    Boolean(exercise.distance) ||
    Boolean(exercise.avgVelocity) ||
    Boolean(exercise.pace);
  if (isKinematics) {
    const durationSec = exercise.time
      ? parseDurationToSeconds(last.time ?? "")
      : null;
    const distanceKm = exercise.distance
      ? parseDistanceKm(last.distance ?? "")
      : null;
    const avgVelocityKmh = exercise.avgVelocity
      ? parseAvgVelocityKmh(last.avgVelocity ?? "")
      : null;
    const paceMinPerKm = exercise.pace
      ? parsePaceToMinPerKm(last.pace ?? "")
      : null;

    if (durationSec != null && avgVelocityKmh != null) return true;
    if (durationSec != null && paceMinPerKm != null) return true;
    if (distanceKm != null && avgVelocityKmh != null) return true;
    if (distanceKm != null && paceMinPerKm != null) return true;
    if (durationSec != null && distanceKm != null) return true;
    return false;
  }

  if (exercise.time && !last.time?.trim()) return false;
  return true;
}

function isSetValidForExercise(
  set: SetValues,
  exercise:
    | {
        weight?: boolean;
        reps?: boolean;
        time?: boolean;
        distance?: boolean;
        avgVelocity?: boolean;
        pace?: boolean;
        unique_name: string;
      }
    | undefined,
): boolean {
  if (!exercise) return false;
  if (exercise.weight && !(set.weight?.trim() ?? "")) return false;
  if (exercise.reps && !(set.reps?.trim() ?? "")) return false;

  const isKinematics =
    Boolean(exercise.distance) ||
    Boolean(exercise.avgVelocity) ||
    Boolean(exercise.pace);
  if (isKinematics) {
    const durationSec = exercise.time
      ? parseDurationToSeconds(set.time ?? "")
      : null;
    const distanceKm = exercise.distance
      ? parseDistanceKm(set.distance ?? "")
      : null;
    const avgVelocityKmh = exercise.avgVelocity
      ? parseAvgVelocityKmh(set.avgVelocity ?? "")
      : null;
    const paceMinPerKm = exercise.pace
      ? parsePaceToMinPerKm(set.pace ?? "")
      : null;

    if (durationSec != null && avgVelocityKmh != null) return true;
    if (durationSec != null && paceMinPerKm != null) return true;
    if (distanceKm != null && avgVelocityKmh != null) return true;
    if (distanceKm != null && paceMinPerKm != null) return true;
    if (durationSec != null && distanceKm != null) return true;
    return false;
  }

  if (exercise.time && !(set.time?.trim() ?? "")) return false;
  return true;
}

function mergeRegisterWithViewportReset(
  field: UseFormRegisterReturn,
): UseFormRegisterReturn & { onFocus: FocusEventHandler<HTMLElement> } {
  return {
    ...field,
    onFocus: (_e) => {
      preventViewportZoomOnInputFocus();
    },
    onBlur: (e) => {
      const r = field.onBlur(e);
      restoreViewportAfterInputBlur();
      return r;
    },
  };
}

function canFinishWorkout(
  exercises: WorkoutExercise[] | undefined,
  allExercises: {
    weight?: boolean;
    reps?: boolean;
    time?: boolean;
    distance?: boolean;
    avgVelocity?: boolean;
    pace?: boolean;
    unique_name: string;
  }[],
): boolean {
  if (!exercises?.length) return false;
  const hasAtLeastOneValidSet = exercises.some((ex) => {
    const exercise = allExercises.find(
      (e) => e.unique_name === ex.exerciseUniqueName,
    );
    return (ex.sets ?? []).some((s) => isSetValidForExercise(s, exercise));
  });
  const everySetValid = exercises.every((ex) => {
    const exercise = allExercises.find(
      (e) => e.unique_name === ex.exerciseUniqueName,
    );
    if (!exercise)
      return (ex.sets ?? []).length === 0 || (ex.sets ?? []).every(isEmptySet);
    return (ex.sets ?? []).every((s) => isSetValidForExercise(s, exercise));
  });
  return hasAtLeastOneValidSet && everySetValid;
}

export function Workout({
  myWorkoutSubHeaderTabs,
}: {
  myWorkoutSubHeaderTabs?: ReactNode;
} = {}) {
  const {
    currentWorkout,
    startWorkout,
    startWorkoutWithTemplate,
    consumeInitialExercises,
    endWorkout,
  } = useCurrentWorkout();
  const { templates, updateTemplate, addTemplate } = useWorkoutTemplates();
  const { t } = useLanguage();
  const { weightUnit } = useWeightUnit();
  const allExercises = useAllExercises();
  const { favoriteIdSet, pickerFavoritesOnly, setPickerFavoritesOnly } =
    useFavoriteExercises();
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [removeSetTarget, setRemoveSetTarget] = useState<{
    exerciseIndex: number;
    setIndex: number;
  } | null>(null);
  const [removeExerciseTarget, setRemoveExerciseTarget] = useState<number | null>(
    null,
  );
  const { appendWorkout, workouts } = useCompletedWorkouts();
  const navigate = useNavigate();
  const [discardModalOpen, setDiscardModalOpen] = useState(false);
  const [finishModalOpen, setFinishModalOpen] = useState(false);
  const [workoutNote, setWorkoutNote] = useState("");
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [showEmptySetsError, setShowEmptySetsError] = useState(false);
  const [templateSaveModal, setTemplateSaveModal] = useState<{
    stored: StoredWorkout;
    exerciseUniqueNames: string[];
    templateId: string;
  } | null>(null);
  const [atTop, setAtTop] = useState(true);
  const [atBottom, setAtBottom] = useState(true);
  const [isMobileViewport, setIsMobileViewport] = useState(false);
  const [mobileEditorOpen, setMobileEditorOpen] = useState(false);
  const [templateWorkoutTab, setTemplateWorkoutTab] = useState<
    "current" | "last"
  >("current");
  const exerciseListScrollRef = useRef<HTMLUListElement>(null);

  const checkScroll = useCallback(() => {
    const el = exerciseListScrollRef.current;
    if (!el) return;
    const threshold = 2;
    setAtTop(el.scrollTop <= threshold);
    setAtBottom(el.scrollHeight - el.scrollTop - el.clientHeight <= threshold);
  }, []);

  const lastCompletedWithSameTemplate = useMemo(() => {
    const tid = currentWorkout?.templateId;
    if (!tid) return null;
    const same = workouts.filter((w) => w.templateId === tid);
    if (same.length === 0) return null;
    return [...same].sort(
      (a, b) =>
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime(),
    )[0];
  }, [workouts, currentWorkout?.templateId]);

  const expiredDraftForThisWorkout = (() => {
    if (!currentWorkout) return null;
    const draft = readCurrentWorkoutDraft();
    if (draft?.workoutId !== currentWorkout.id) return null;
    const startedMs = Date.parse(draft.startedAt);
    if (!Number.isFinite(startedMs)) return draft;
    return Date.now() - startedMs > MAX_DRAFT_AGE_MS ? draft : null;
  })();

  const draftExercisesForDefaults = (() => {
    if (!currentWorkout) return [] as WorkoutExercise[];
    if (expiredDraftForThisWorkout) return [] as WorkoutExercise[];
    const draft = readCurrentWorkoutDraft();
    if (draft?.workoutId !== currentWorkout.id) return [] as WorkoutExercise[];
    return Array.isArray(draft.exercises)
      ? (draft.exercises as unknown as WorkoutExercise[])
      : ([] as WorkoutExercise[]);
  })();

  const { control, register, watch, handleSubmit, setValue, reset } =
    useForm<WorkoutFormValues>({
      defaultValues: { exercises: draftExercisesForDefaults },
    });

  const {
    fields: exerciseFields,
    append: appendExercise,
    remove: removeExercise,
    replace: replaceExercises,
  } = useFieldArray({
    control,
    name: "exercises",
  });

  const watchedExercises = watch("exercises");
  const hasEmptySetsInForm = (watchedExercises ?? []).some((ex) =>
    (ex.sets ?? []).some(isEmptySet),
  );

  useEffect(() => {
    if (!hasEmptySetsInForm) setShowEmptySetsError(false);
  }, [hasEmptySetsInForm]);

  useEffect(() => {
    if (!currentWorkout) return;
    const draft = readCurrentWorkoutDraft();
    if (draft?.workoutId === currentWorkout.id) {
      setWorkoutNote(typeof draft.notes === "string" ? draft.notes : "");
    } else {
      setWorkoutNote("");
    }
  }, [currentWorkout?.id]);

  useEffect(() => {
    if (!currentWorkout) return;
    const exercises = watchedExercises ?? [];
    const draft = readCurrentWorkoutDraft();
    if (
      exercises.length === 0 &&
      (!draft || draft.workoutId !== currentWorkout.id)
    ) {
      return;
    }
    upsertCurrentWorkoutDraft({
      workoutId: currentWorkout.id,
      startedAt: currentWorkout.startedAt,
      templateId: currentWorkout.templateId ?? null,
      exercises,
      notes: workoutNote,
    });
  }, [currentWorkout, workoutNote, watchedExercises]);

  const currentWorkoutIdRef = useRef<string | null>(null);
  currentWorkoutIdRef.current = currentWorkout?.id ?? null;
  const restoringDraftRef = useRef(false);
  const skipNextAutosaveRef = useRef(true);

  useEffect(() => {
    checkScroll();
  }, [exerciseFields.length, checkScroll]);

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
    if (currentWorkout?.id) setTemplateWorkoutTab("current");
  }, [currentWorkout?.id]);

  useEffect(() => {
    if (!currentWorkout) {
      setMobileEditorOpen(false);
      return;
    }
    if (isMobileViewport) {
      setMobileEditorOpen(true);
    }
  }, [currentWorkout, isMobileViewport]);

  useEffect(() => {
    if (!expiredDraftForThisWorkout) return;
    clearCurrentWorkoutDraft();
    endWorkout();
  }, [expiredDraftForThisWorkout, endWorkout]);

  useEffect(() => {
    if (!currentWorkout) return;
    const draft = readCurrentWorkoutDraft();
    if (draft?.workoutId === currentWorkout.id) {
      const draftExercises = Array.isArray(draft.exercises)
        ? (draft.exercises as WorkoutExercise[])
        : [];
      if (draftExercises.length > 0) {
        reset({ exercises: draftExercises });
        replaceExercises(draftExercises);
        return;
      }
    }

    const initialNames = consumeInitialExercises();
    const templateExerciseNames =
      currentWorkout.templateId != null
        ? (templates.find((tmpl) => tmpl.id === currentWorkout.templateId)
            ?.exerciseUniqueNames ?? [])
        : [];
    const exerciseNames =
      initialNames && initialNames.length > 0
        ? initialNames
        : templateExerciseNames;
    const initialExercises =
      exerciseNames.length > 0
        ? exerciseNames.map((exerciseUniqueName) => ({
            exerciseUniqueName,
            sets: [defaultSet()],
          }))
        : [];
    reset({ exercises: initialExercises });
    replaceExercises(initialExercises);
  }, [
    currentWorkout?.id,
    currentWorkout?.templateId,
    consumeInitialExercises,
    reset,
    currentWorkout,
    replaceExercises,
    templates,
  ]);

  useEffect(() => {
    if (!currentWorkout) return;

    skipNextAutosaveRef.current = true;
    const sub = watch((value) => {
      if (restoringDraftRef.current) return;
      if (skipNextAutosaveRef.current) {
        skipNextAutosaveRef.current = false;
        return;
      }
      if (currentWorkoutIdRef.current !== currentWorkout.id) return;
      const existing = readCurrentWorkoutDraft();
      const nextExercises = (value as { exercises?: unknown })?.exercises ?? [];
      if (
        existing?.workoutId === currentWorkout.id &&
        Array.isArray(existing.exercises) &&
        existing.exercises.length > 0 &&
        Array.isArray(nextExercises) &&
        nextExercises.length === 0
      ) {
        return;
      }
      upsertCurrentWorkoutDraft({
        workoutId: currentWorkout.id,
        startedAt: currentWorkout.startedAt,
        templateId: currentWorkout.templateId ?? null,
        exercises: nextExercises,
        notes: workoutNote,
      });
    });

    return () => {
      sub.unsubscribe();
      if (currentWorkoutIdRef.current !== currentWorkout.id) return;
      upsertCurrentWorkoutDraft({
        workoutId: currentWorkout.id,
        startedAt: currentWorkout.startedAt,
        templateId: currentWorkout.templateId ?? null,
        exercises: watchedExercises ?? [],
        notes: workoutNote,
      });
    };
  }, [currentWorkout, watch, watchedExercises, workoutNote]);

  const fullExerciseOptions = useMemo(
    () => buildSortedExerciseSelectOptions(allExercises, t),
    [allExercises, t],
  );

  const pickerExerciseOptions = useMemo(
    () =>
      filterExerciseOptionsForPicker(
        fullExerciseOptions,
        favoriteIdSet,
        pickerFavoritesOnly,
      ),
    [fullExerciseOptions, favoriteIdSet, pickerFavoritesOnly],
  );

  const onFinish = handleSubmit((data) => {
    const templateForSave = currentWorkout!.templateId
      ? templates.find((t) => t.id === currentWorkout!.templateId)
      : undefined;
    const stored: StoredWorkout = {
      id: currentWorkout!.id,
      startedAt: currentWorkout!.startedAt,
      completedAt: new Date().toISOString(),
      templateId: currentWorkout!.templateId ?? null,
      templateName: templateForSave?.name?.trim() || null,
      notes: workoutNote.trim(),
      exercises: data.exercises.map((ex) => {
        const mapped = (ex.sets ?? []).map((s) => ({
          weight: inputWeightToKg(s.weight ?? "", weightUnit),
          reps: s.reps ?? "",
          time: s.time ?? "",
          distance: s.distance ?? "",
          avgVelocity: s.avgVelocity ?? "",
          pace: s.pace ?? "",
        }));
        return {
          exerciseUniqueName: ex.exerciseUniqueName,
          sets: mapped.filter((s) => !isEmptySet(s)),
        };
      }),
    };
    const exerciseUniqueNames = stored.exercises.map(
      (e) => e.exerciseUniqueName,
    );
    const templateId = currentWorkout!.templateId;
    if (templateId) {
      const template = templates.find((t) => t.id === templateId);
      const originalNames = template?.exerciseUniqueNames ?? [];
      const modified =
        originalNames.length !== exerciseUniqueNames.length ||
        originalNames.some((name, i) => name !== exerciseUniqueNames[i]);
      if (modified && template) {
        setTemplateSaveModal({ stored, exerciseUniqueNames, templateId });
        return;
      }
    }
    appendWorkout(stored);
    setFinishModalOpen(false);
    setWorkoutNote("");
    endWorkout();
    navigate(routes.workout, { state: { tab: "completed" } });
  });

  const handleTemplateSaveUpdate = () => {
    if (!templateSaveModal) return;
    const template = templates.find(
      (t) => t.id === templateSaveModal.templateId,
    );
    if (template) {
      updateTemplate(templateSaveModal.templateId, {
        name: template.name,
        exerciseUniqueNames: templateSaveModal.exerciseUniqueNames,
      });
    }
    appendWorkout(templateSaveModal.stored);
    endWorkout();
    setTemplateSaveModal(null);
    navigate(routes.workout, { state: { tab: "completed" } });
  };

  const handleTemplateSaveNew = () => {
    if (!templateSaveModal) return;
    const template = templates.find(
      (t) => t.id === templateSaveModal.templateId,
    );
    const name = template
      ? `${template.name} (${t("workout_templateCopy")})`
      : t("templates_namePlaceholder");
    addTemplate({
      name,
      exerciseUniqueNames: templateSaveModal.exerciseUniqueNames,
    });
    appendWorkout(templateSaveModal.stored);
    endWorkout();
    setTemplateSaveModal(null);
    navigate(routes.workout, { state: { tab: "completed" } });
  };

  const onDiscardClick = () => setDiscardModalOpen(true);
  const onFinishClick = () => {
    if (hasEmptySetsInForm) {
      setShowEmptySetsError(true);
      return;
    }
    if (!canFinish) return;
    setFinishModalOpen(true);
  };
  const onDiscardConfirm = () => {
    setDiscardModalOpen(false);
    endWorkout();
  };
  const onDiscardCancel = () => setDiscardModalOpen(false);

  if (!currentWorkout) {
    const templateOptions = [...templates]
      .sort((a, b) =>
        a.name.localeCompare(b.name, undefined, { sensitivity: "base" }),
      )
      .map((tmpl) => ({
        value: tmpl.id,
        label: tmpl.name,
      }));
    const handleStartWithTemplate = () => {
      const template = templates.find((tmpl) => tmpl.id === selectedTemplateId);
      if (template) {
        startWorkoutWithTemplate(template.id, template.exerciseUniqueNames);
        setSelectedTemplateId("");
      }
    };
    return (
      <div>
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("workout_title")}
        </h1>
        {myWorkoutSubHeaderTabs ? (
          <div className="mb-4">{myWorkoutSubHeaderTabs}</div>
        ) : null}
        <p className="text-brand-text-muted mb-6">{t("workout_noWorkout")}</p>
        <div className="flex flex-col gap-4">
          <button
            type="button"
            onClick={startWorkout}
            className="w-fit px-4 py-2 rounded-lg bg-brand-primary text-brand-bg font-medium hover:bg-brand-primary-hover transition-colors duration-300"
          >
            {t("workout_start")}
          </button>
          {templates.length > 0 && (
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex flex-col gap-1">
                <span className="text-sm text-brand-text-muted">
                  {t("workout_startWithTemplate")}
                </span>
                <div className="min-w-[16rem]">
                  <Select
                    value={selectedTemplateId}
                    onChange={setSelectedTemplateId}
                    options={templateOptions}
                    placeholder={t("workout_chooseTemplate")}
                  />
                </div>
              </label>
              <button
                type="button"
                onClick={handleStartWithTemplate}
                disabled={!selectedTemplateId}
                className={cn(
                  "h-[42px] px-4 rounded-lg border font-medium transition-colors duration-300",
                  selectedTemplateId
                    ? "border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                    : "border-brand-border text-brand-text-muted cursor-not-allowed",
                )}
              >
                {t("workout_startWithTemplateButton")}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  const canFinish = canFinishWorkout(watchedExercises, allExercises);
  const template =
    currentWorkout.templateId != null
      ? templates.find((t) => t.id === currentWorkout.templateId)
      : undefined;
  const hasActiveTemplateId = currentWorkout.templateId != null;
  const isLastTemplateView = Boolean(
    hasActiveTemplateId && templateWorkoutTab === "last",
  );
  const showLastTrainingAsMainColumn =
    isLastTemplateView && !isMobileViewport;
  const templateSessionTablist = hasActiveTemplateId ? (
    <div
      className="flex gap-1 rounded-lg border border-brand-border bg-brand-bg-soft p-1 w-fit max-w-full flex-wrap"
      role="tablist"
      aria-label={t("workout_sessionTabs_aria")}
    >
      <button
        type="button"
        role="tab"
        aria-selected={templateWorkoutTab === "current"}
        onClick={() => setTemplateWorkoutTab("current")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          templateWorkoutTab === "current"
            ? "bg-brand-primary text-brand-bg"
            : "text-brand-text-muted hover:text-brand-text hover:bg-brand-bg",
        )}
      >
        {t("workout_tabCurrentTraining")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={templateWorkoutTab === "last"}
        onClick={() => setTemplateWorkoutTab("last")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          templateWorkoutTab === "last"
            ? "bg-brand-primary text-brand-bg"
            : "text-brand-text-muted hover:text-brand-text hover:bg-brand-bg",
        )}
      >
        {t("workout_tabLastTraining")}
      </button>
    </div>
  ) : null;
  const workoutEditorBody = (
    <>
      <div
        className={cn(
          "flex-1 min-h-0 min-w-0 flex flex-col relative overflow-hidden scroll-fade-bottom scroll-fade-top",
          atBottom && "at-bottom",
          atTop && "at-top",
        )}
      >
        <div className="rounded-lg border border-brand-border bg-brand-bg-soft p-4 mb-4 flex flex-col flex-1 min-h-0 xs:border-0 xs:p-0">
          <div className="flex flex-col gap-1 mb-3 shrink-0">
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
          <label className="hidden sm:flex flex-col gap-2 mb-3 shrink-0">
            <span className="text-sm font-medium text-brand-dark">
              {t("workoutDetail_note")}
            </span>
            <textarea
              value={workoutNote}
              onChange={(e) => setWorkoutNote(e.target.value)}
              placeholder={t("workout_finishModalNotePlaceholder")}
              rows={3}
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
            />
          </label>
          <div className="sm:hidden mb-3 shrink-0">
            <button
              type="button"
              onClick={() => setNoteModalOpen(true)}
              className={cn(
                "w-full rounded-lg border px-4 py-2 text-sm font-medium transition-colors",
                workoutNote.trim()
                  ? "border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                  : "border-brand-border text-brand-text hover:bg-brand-bg-soft",
              )}
            >
              {workoutNote.trim()
                ? t("exerciseNote_edit")
                : t("workout_finishModalNoteLabel")}
            </button>
          </div>
          <ul
            ref={exerciseListScrollRef}
            onScroll={checkScroll}
            className={cn(
              "list-none m-0 p-0 space-y-2 flex-1 min-h-0 overflow-y-auto min-w-0",
            )}
          >
            {exerciseFields.map((field, index) => {
              const exerciseUniqueName =
                watchedExercises?.[index]?.exerciseUniqueName ?? "";
              const exercise = allExercises.find(
                (e) => e.unique_name === exerciseUniqueName,
              );
              const sets = watchedExercises?.[index]?.sets ?? [];
              const exerciseSelectOptions = withSelectedExerciseOption(
                pickerExerciseOptions,
                exerciseUniqueName,
                fullExerciseOptions,
              );

              return (
                <li
                  key={field.id}
                  className="rounded-lg border border-brand-border bg-brand-bg p-4 space-y-3 list-none"
                >
                  <div className="flex justify-end -mt-0.5">
                    <button
                      type="button"
                      onClick={() => setRemoveExerciseTarget(index)}
                      className="text-sm text-brand-text-muted hover:text-red-400 transition-colors"
                    >
                      {t("workout_removeExercise")}
                    </button>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <label className="text-sm font-medium text-brand-dark shrink-0">
                      {t("workout_exercise")}
                    </label>
                    <Controller
                      control={control}
                      name={`exercises.${index}.exerciseUniqueName` as const}
                      render={({ field }) => (
                        <Select
                          value={field.value}
                          onChange={field.onChange}
                          options={exerciseSelectOptions}
                          placeholder="—"
                          className="min-w-[20rem] xs:min-w-0 xs:w-full"
                        />
                      )}
                    />
                  </div>
                  {exercise && (
                    <div className="space-y-2">
                      {(sets as SetValues[]).map((_, setIndex) => (
                        <div
                          key={setIndex}
                          className={cn(
                            "text-sm",
                            "xs:rounded-lg xs:border xs:border-brand-border xs:bg-brand-bg xs:p-3",
                          )}
                        >
                          <div className="flex justify-end mb-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setRemoveSetTarget({
                                  exerciseIndex: index,
                                  setIndex,
                                })
                              }
                              className="text-sm text-brand-text-muted hover:text-red-400 transition-colors"
                            >
                              {t("workout_removeSet")}
                            </button>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 gap-y-2 xs:flex-col xs:items-start">
                            {exercise.weight && (
                              <div className="flex items-center gap-1.5 whitespace-nowrap 2xs:w-full">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportReset(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.weight` as const,
                                    ),
                                  )}
                                  inputMode="decimal"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t(
                                    weightUnit === "kg" ? "unit_kg" : "unit_lb",
                                  )}
                                </span>
                              </div>
                            )}
                            {exercise.reps && (
                              <div className="flex items-center gap-1.5 whitespace-nowrap 2xs:w-full">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportReset(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.reps` as const,
                                    ),
                                  )}
                                  inputMode="numeric"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
                                  className="min-w-[8rem] w-24 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("workout_reps")}
                                </span>
                              </div>
                            )}
                            {exercise.time && (
                              <div className="flex items-center gap-1.5 whitespace-nowrap 2xs:w-full">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportReset(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.time` as const,
                                    ),
                                  )}
                                  inputMode="text"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9:.,]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_s")}
                                </span>
                              </div>
                            )}
                            {exercise.distance && (
                              <div className="flex items-center gap-1.5 whitespace-nowrap 2xs:w-full">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportReset(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.distance` as const,
                                    ),
                                  )}
                                  inputMode="decimal"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_km")}
                                </span>
                              </div>
                            )}
                            {exercise.avgVelocity && (
                              <div className="flex items-center gap-1.5 whitespace-nowrap 2xs:w-full">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportReset(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.avgVelocity` as const,
                                    ),
                                  )}
                                  inputMode="decimal"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9]*[.,]?[0-9]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_kmh")}
                                </span>
                              </div>
                            )}
                            {exercise.pace && (
                              <div className="flex items-center gap-1.5 whitespace-nowrap 2xs:w-full">
                                <input
                                  type="text"
                                  placeholder={t("workout_insertValue")}
                                  {...mergeRegisterWithViewportReset(
                                    register(
                                      `exercises.${index}.sets.${setIndex}.pace` as const,
                                    ),
                                  )}
                                  inputMode="text"
                                  autoComplete="off"
                                  spellCheck={false}
                                  pattern="[0-9:.,]*"
                                  className="min-w-[8rem] w-28 rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
                                />
                                <span className="text-brand-text-muted text-sm shrink-0">
                                  {t("unit_min_per_km")}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                      <div className="flex flex-wrap items-center gap-2 max-[479px]:flex-nowrap max-[479px]:justify-between">
                        <button
                          type="button"
                          disabled={
                            !canAddSet(
                              allExercises,
                              sets as SetValues[],
                              exerciseUniqueName,
                            )
                          }
                          onClick={() => {
                            const nextSet = defaultSet();
                            const all = watch("exercises") ?? [];
                            const updated = all.map((ex, i) =>
                              i === index
                                ? { ...ex, sets: [...(ex.sets ?? []), nextSet] }
                                : ex,
                            );
                            setValue("exercises", updated);
                          }}
                          className={cn(
                            "text-sm rounded px-2 py-1 border transition-colors max-[479px]:w-full",
                            canAddSet(
                              allExercises,
                              sets as SetValues[],
                              exerciseUniqueName,
                            )
                              ? "border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                              : "border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed",
                          )}
                        >
                          {t("workout_addSet")}
                        </button>
                        <button
                          type="button"
                          disabled={
                            !canAddSet(
                              allExercises,
                              sets as SetValues[],
                              exerciseUniqueName,
                            ) || sets.length === 0
                          }
                          onClick={() => {
                            const all = watch("exercises") ?? [];
                            const updated = all.map((ex, i) => {
                              if (i !== index) return ex;
                              const currentSets = ex.sets ?? [];
                              const lastSet = currentSets[currentSets.length - 1];
                              const duplicatedSet = lastSet
                                ? { ...lastSet }
                                : defaultSet();
                              return {
                                ...ex,
                                sets: [...currentSets, duplicatedSet],
                              };
                            });
                            setValue("exercises", updated);
                          }}
                          className={cn(
                            "text-sm rounded px-2 py-1 border transition-colors max-[479px]:w-full",
                            canAddSet(
                              allExercises,
                              sets as SetValues[],
                              exerciseUniqueName,
                            ) && sets.length > 0
                              ? "border-brand-primary text-brand-primary hover:bg-brand-primary/10"
                              : "border-brand-border bg-brand-code-bg text-brand-text-muted cursor-not-allowed",
                          )}
                        >
                          {t("workout_duplicateSet")}
                        </button>
                      </div>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          <button
            type="button"
            onClick={() =>
              appendExercise({
                exerciseUniqueName: "",
                sets: [defaultSet()],
              })
            }
            className="mt-3 shrink-0 w-full rounded-lg border border-dashed border-brand-border py-3 text-brand-text-muted hover:border-brand-primary hover:text-brand-primary transition-colors text-sm font-medium"
          >
            + {t("workout_addExercise")}
          </button>
        </div>
      </div>

      {showEmptySetsError && hasEmptySetsInForm && (
        <p className="text-sm text-red-400 mt-2">
          {t("workout_noEmptySetsMessage")}
        </p>
      )}

      <footer className="shrink-0 flex gap-3 mt-4 pt-4 border-t border-brand-border max-[479px]:flex-nowrap max-[479px]:justify-between">
        <button
          type="button"
          onClick={onFinishClick}
          className="px-4 py-2 rounded-lg font-medium transition-colors duration-300 max-[479px]:w-full bg-brand-primary text-brand-bg hover:bg-brand-primary-hover"
        >
          {t("workout_finish")}
        </button>
        <button
          type="button"
          onClick={onDiscardClick}
          className="px-4 py-2 rounded-lg border border-brand-border text-brand-text hover:bg-brand-bg-soft transition-colors duration-300 max-[479px]:w-full"
        >
          {t("workout_discard")}
        </button>
      </footer>
    </>
  );

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <header className="shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-brand-dark mb-1">
          {t("workout_title")}
        </h1>
        <p className="text-brand-text-muted text-sm">
          {t("workout_startedAt")}{" "}
          {new Date(currentWorkout.startedAt).toLocaleString()}.
        </p>
        {template && (
          <p className="text-brand-text-muted text-sm mt-0.5">
            {t("workout_templateLabel")}: {template.name}
          </p>
        )}
      </header>
      {myWorkoutSubHeaderTabs ? (
        <div className="shrink-0 mb-4">{myWorkoutSubHeaderTabs}</div>
      ) : null}
      {templateSessionTablist && !isMobileViewport ? (
        <div className="shrink-0 mb-4">{templateSessionTablist}</div>
      ) : null}
      {showLastTrainingAsMainColumn ? (
        <div className="flex-1 min-h-0 overflow-y-auto flex flex-col pr-1 -mr-1">
          <WorkoutLastTemplateTrainingPanel
            lastWorkout={lastCompletedWithSameTemplate}
          />
        </div>
      ) : (
        <>
          <div className="hidden sm:flex sm:flex-1 sm:min-h-0 sm:flex-col">
            {workoutEditorBody}
          </div>
          <div className="sm:hidden">
            {!mobileEditorOpen && (
              <button
                type="button"
                onClick={() => setMobileEditorOpen(true)}
                className="w-full rounded-lg border border-brand-primary text-brand-primary px-4 py-2 font-medium hover:bg-brand-primary/10 transition-colors"
              >
                {t("workout_title")}
              </button>
            )}
            {mobileEditorOpen && (
              <div className="fixed inset-0 z-50 bg-brand-bg-soft p-4 flex flex-col">
                <div className="shrink-0 mb-3 flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-brand-dark">
                    {t("workout_title")}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setMobileEditorOpen(false)}
                    className="rounded-lg border border-brand-border px-3 py-1.5 text-sm text-brand-text hover:bg-brand-bg transition-colors"
                    aria-label={t("nav_close")}
                  >
                    {t("nav_close")}
                  </button>
                </div>
                {templateSessionTablist ? (
                  <div className="shrink-0 mb-3">{templateSessionTablist}</div>
                ) : null}
                {isLastTemplateView ? (
                  <div className="flex-1 min-h-0 overflow-y-auto flex flex-col pr-1 -mr-1">
                    <WorkoutLastTemplateTrainingPanel
                      lastWorkout={lastCompletedWithSameTemplate}
                    />
                  </div>
                ) : (
                  <div className="flex-1 min-h-0 flex flex-col">
                    {workoutEditorBody}
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
      {noteModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workout-note-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/60"
            aria-hidden="true"
            onClick={() => setNoteModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-brand-border bg-brand-bg-soft p-6 shadow-lg">
            <h2
              id="workout-note-modal-title"
              className="text-lg font-semibold text-brand-dark mb-2"
            >
              {t("workoutDetail_note")}
            </h2>
            <textarea
              value={workoutNote}
              onChange={(e) => setWorkoutNote(e.target.value)}
              placeholder={t("workout_finishModalNotePlaceholder")}
              rows={4}
              autoFocus
              className="w-full rounded-lg border border-brand-border bg-brand-bg px-3 py-2 text-brand-text placeholder:text-brand-placeholder"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-brand-primary text-brand-bg hover:bg-brand-primary-hover transition-colors"
              >
                {t("workoutEdit_save")}
              </button>
            </div>
          </div>
        </div>
      )}
      {finishModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="workout-finish-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/60"
            aria-hidden="true"
            onClick={() => setFinishModalOpen(false)}
          />
          <div className="relative w-full max-w-md rounded-xl border border-brand-border bg-brand-bg-soft p-6 shadow-lg">
            <h2
              id="workout-finish-modal-title"
              className="text-lg font-semibold text-brand-dark mb-2"
            >
              {t("workout_finishModalTitle")}
            </h2>
            <p className="text-brand-text-muted text-sm mb-4">
              {t("workout_finishModalMessage")}
            </p>
            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setFinishModalOpen(false)}
                className="rounded-lg border border-brand-border px-4 py-2 text-sm font-medium text-brand-text hover:bg-brand-bg transition-colors"
              >
                {t("workoutEdit_cancel")}
              </button>
              <button
                type="button"
                onClick={onFinish}
                className="rounded-lg px-4 py-2 text-sm font-medium bg-brand-primary text-brand-bg hover:bg-brand-primary-hover transition-colors"
              >
                {t("workout_finish")}
              </button>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        open={discardModalOpen}
        title={t("workout_discardConfirmTitle")}
        message={t("workout_discardConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={onDiscardConfirm}
        onCancel={onDiscardCancel}
        variant="danger"
      />
      <ConfirmModal
        open={removeExerciseTarget !== null}
        title={t("workout_removeExerciseConfirmTitle")}
        message={t("workout_removeExerciseConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={() => {
          if (removeExerciseTarget === null) return;
          removeExercise(removeExerciseTarget);
          setRemoveExerciseTarget(null);
        }}
        onCancel={() => setRemoveExerciseTarget(null)}
        variant="danger"
      />
      <ConfirmModal
        open={removeSetTarget !== null}
        title={t("workout_removeSetConfirmTitle")}
        message={t("workout_removeSetConfirmMessage")}
        confirmLabel={t("common_yes")}
        cancelLabel={t("common_no")}
        onConfirm={() => {
          if (removeSetTarget === null) return;
          const { exerciseIndex, setIndex } = removeSetTarget;
          const all = watch("exercises") ?? [];
          const currentSets = all[exerciseIndex]?.sets ?? [];
          const newSets = currentSets.filter((_, i) => i !== setIndex);
          const updated = all.map((ex, i) =>
            i === exerciseIndex
              ? {
                  ...ex,
                  sets: newSets.length > 0 ? newSets : [defaultSet()],
                }
              : ex,
          );
          setValue("exercises", updated);
          setRemoveSetTarget(null);
        }}
        onCancel={() => setRemoveSetTarget(null)}
        variant="danger"
      />
      {templateSaveModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="template-save-modal-title"
        >
          <div
            className="absolute inset-0 bg-black/60"
            aria-hidden="true"
            onClick={() => {
              appendWorkout(templateSaveModal.stored);
              endWorkout();
              setTemplateSaveModal(null);
              navigate(routes.workout, { state: { tab: "completed" } });
            }}
          />
          <div className="relative w-full max-w-md rounded-xl border border-brand-border bg-brand-bg-soft p-6 shadow-lg">
            <h2
              id="template-save-modal-title"
              className="text-lg font-semibold text-brand-dark mb-2"
            >
              {t("workout_templateSaveModalTitle")}
            </h2>
            <p className="text-brand-text-muted text-sm mb-6">
              {t("workout_templateSaveModalMessage")}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={handleTemplateSaveUpdate}
                className="w-full rounded-lg bg-brand-primary text-brand-bg px-4 py-2 text-sm font-medium hover:bg-brand-primary-hover transition-colors"
              >
                {t("workout_templateSaveUpdate")}
              </button>
              <button
                type="button"
                onClick={handleTemplateSaveNew}
                className="w-full rounded-lg border border-brand-border text-brand-text px-4 py-2 text-sm font-medium hover:bg-brand-bg transition-colors"
              >
                {t("workout_templateSaveNew")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (templateSaveModal) {
                    appendWorkout(templateSaveModal.stored);
                    endWorkout();
                    setTemplateSaveModal(null);
                    navigate(routes.workout, { state: { tab: "completed" } });
                  }
                }}
                className="w-full rounded-lg border border-brand-border text-brand-text-muted px-4 py-2 text-sm font-medium hover:bg-brand-bg transition-colors"
              >
                {t("workout_templateSaveFinishOnly")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
