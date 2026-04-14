import {
  createContext,
  useContext,
  useCallback,
  type ReactNode,
} from "react";
import type { WorkoutTemplate } from "../data/workoutTemplates";
import { useAuth } from "./AuthContext";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  deleteTemplateById,
  fetchTemplates,
  insertTemplate,
  toWorkoutTemplate,
  updateTemplateById,
} from "../services/templatesDb";
import { updateTrainingTemplateNameByTemplateId } from "../services/trainingsDb";

type WorkoutTemplatesContextValue = {
  templates: WorkoutTemplate[];
  addTemplate: (template: Omit<WorkoutTemplate, "id">) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, template: Omit<WorkoutTemplate, "id">) => void;
  isTemplateNameTaken: (name: string, excludeId?: string) => boolean;
};

const WorkoutTemplatesContext = createContext<WorkoutTemplatesContextValue | null>(null);

function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

function hasDuplicateName(
  list: WorkoutTemplate[],
  name: string,
  excludeId?: string,
): boolean {
  const normalized = normalizeName(name);
  if (!normalized) return false;
  return list.some(
    (t) => t.id !== excludeId && normalizeName(t.name) === normalized,
  );
}

export function WorkoutTemplatesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const templatesQuery = useQuery({
    queryKey: ["templates", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await fetchTemplates(userId!);
      if (error) throw error;
      return (data ?? []).map(toWorkoutTemplate);
    },
  });

  const templates = templatesQuery.data ?? [];

  const insertMutation = useMutation({
    mutationFn: async (template: Omit<WorkoutTemplate, "id">) => {
      if (!userId) return;
      const { error } = await insertTemplate({
        user_id: userId,
        name: template.name.trim(),
        exercise_unique_names: template.exerciseUniqueNames ?? [],
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["templates", userId] });
    },
  });

  const addTemplate = useCallback(
    (template: Omit<WorkoutTemplate, "id">) => {
      if (!userId) return;
      if (hasDuplicateName(templates, template.name)) return;
      insertMutation.mutate(template);
    },
    [insertMutation, templates, userId],
  );

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      template,
    }: {
      id: string;
      template: Omit<WorkoutTemplate, "id">;
    }) => {
      if (!userId) return;
      const { error } = await updateTemplateById(userId, id, {
        name: template.name.trim(),
        exercise_unique_names: template.exerciseUniqueNames ?? [],
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      const { error: trainingsUpdateError } =
        await updateTrainingTemplateNameByTemplateId(
          userId,
          id,
          template.name.trim(),
        );
      if (trainingsUpdateError) throw trainingsUpdateError;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["templates", userId] });
      await queryClient.invalidateQueries({ queryKey: ["trainings", userId] });
    },
  });

  const updateTemplate = useCallback(
    (id: string, template: Omit<WorkoutTemplate, "id">) => {
      if (!userId) return;
      if (hasDuplicateName(templates, template.name, id)) return;
      updateMutation.mutate({ id, template });
    },
    [templates, updateMutation, userId],
  );

  const removeMutation = useMutation({
    mutationFn: async (id: string) => {
      if (!userId) return;
      const { error } = await deleteTemplateById(userId, id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["templates", userId] });
    },
  });

  const removeTemplate = useCallback(
    (id: string) => {
      removeMutation.mutate(id);
    },
    [removeMutation],
  );

  const isTemplateNameTaken = useCallback(
    (name: string, excludeId?: string) => hasDuplicateName(templates, name, excludeId),
    [templates],
  );

  return (
    <WorkoutTemplatesContext.Provider
      value={{
        templates,
        addTemplate,
        removeTemplate,
        updateTemplate,
        isTemplateNameTaken,
      }}
    >
      {children}
    </WorkoutTemplatesContext.Provider>
  );
}

export function useWorkoutTemplates() {
  const v = useContext(WorkoutTemplatesContext);
  if (v === null)
    throw new Error("useWorkoutTemplates must be used within WorkoutTemplatesProvider");
  return v;
}
