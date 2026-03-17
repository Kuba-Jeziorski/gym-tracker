import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import type { WorkoutTemplate } from "../data/workoutTemplates";

const STORAGE_KEY = "gym-tracker-templates";

type WorkoutTemplatesContextValue = {
  templates: WorkoutTemplate[];
  addTemplate: (template: Omit<WorkoutTemplate, "id">) => void;
  removeTemplate: (id: string) => void;
  updateTemplate: (id: string, template: Omit<WorkoutTemplate, "id">) => void;
  isTemplateNameTaken: (name: string, excludeId?: string) => boolean;
};

const WorkoutTemplatesContext = createContext<WorkoutTemplatesContextValue | null>(null);

function loadFromStorage(): WorkoutTemplate[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveToStorage(list: WorkoutTemplate[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

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
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);

  useEffect(() => {
    setTemplates(loadFromStorage());
  }, []);

  const addTemplate = useCallback((template: Omit<WorkoutTemplate, "id">) => {
    setTemplates((prev) => {
      if (hasDuplicateName(prev, template.name)) return prev;
      const full: WorkoutTemplate = {
        ...template,
        id: crypto.randomUUID(),
      };
      const next = [...prev, full];
      saveToStorage(next);
      return next;
    });
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveToStorage(next);
      return next;
    });
  }, []);

  const updateTemplate = useCallback((id: string, template: Omit<WorkoutTemplate, "id">) => {
    setTemplates((prev) => {
      if (hasDuplicateName(prev, template.name, id)) return prev;
      const next = prev.map((t) => (t.id === id ? { ...t, ...template } : t));
      saveToStorage(next);
      return next;
    });
  }, []);

  const isTemplateNameTaken = useCallback(
    (name: string, excludeId?: string) =>
      hasDuplicateName(templates, name, excludeId),
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
