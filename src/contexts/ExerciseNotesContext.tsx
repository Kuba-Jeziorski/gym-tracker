import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "./AuthContext";
import {
  deleteExerciseNote,
  fetchExerciseNotes,
  upsertExerciseNote,
  type ExerciseNoteRow,
} from "../services/exerciseNotesDb";

type ExerciseNotesContextValue = {
  notesByExerciseUniqueName: Record<string, string>;
  saveExerciseNote: (exerciseUniqueName: string, note: string) => Promise<void>;
};

const ExerciseNotesContext = createContext<ExerciseNotesContextValue | null>(null);

export function ExerciseNotesProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const queryClient = useQueryClient();

  const notesQuery = useQuery({
    queryKey: ["exerciseNotes", userId],
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data, error } = await fetchExerciseNotes(userId!);
      if (error) throw error;
      return (data ?? []) as ExerciseNoteRow[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async ({
      exerciseUniqueName,
      note,
    }: {
      exerciseUniqueName: string;
      note: string;
    }) => {
      if (!userId) return;
      if (!note) {
        const { error } = await deleteExerciseNote(userId, exerciseUniqueName);
        if (error) throw error;
        return;
      }
      const { error } = await upsertExerciseNote(userId, exerciseUniqueName, note);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["exerciseNotes", userId] });
    },
  });

  const notesByExerciseUniqueName = useMemo(() => {
    const rows = notesQuery.data ?? [];
    return rows.reduce<Record<string, string>>((acc, row) => {
      const key = row.exercise_unique_name?.trim();
      if (!key) return acc;
      acc[key] = row.note ?? "";
      return acc;
    }, {});
  }, [notesQuery.data]);

  const saveExerciseNote = useCallback(
    async (exerciseUniqueName: string, note: string) => {
      await saveMutation.mutateAsync({
        exerciseUniqueName,
        note: note.trim(),
      });
    },
    [saveMutation],
  );

  return (
    <ExerciseNotesContext.Provider
      value={{
        notesByExerciseUniqueName,
        saveExerciseNote,
      }}
    >
      {children}
    </ExerciseNotesContext.Provider>
  );
}

export function useExerciseNotes() {
  const value = useContext(ExerciseNotesContext);
  if (value === null) {
    throw new Error("useExerciseNotes must be used within ExerciseNotesProvider");
  }
  return value;
}
