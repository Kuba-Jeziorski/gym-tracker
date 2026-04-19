export type CustomTemplateDraft = {
  v: 1;
  draftStartedAt: string;
  formOpen: boolean;
  mode: "create" | "edit";
  editTemplateId: string | null;
  templateName: string;
  selectedUniqueNames: string[];
};

const STORAGE_KEY = "gym-tracker.customTemplateDraft.v1";
const MAX_DRAFT_AGE_MS = 24 * 60 * 60 * 1000;

function isExpired(draftStartedAt: string): boolean {
  const ms = Date.parse(draftStartedAt);
  if (!Number.isFinite(ms)) return true;
  return Date.now() - ms > MAX_DRAFT_AGE_MS;
}

function parseDraft(raw: string | null): CustomTemplateDraft | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as CustomTemplateDraft;
    if (parsed?.v !== 1 || typeof parsed.draftStartedAt !== "string") return null;
    if (typeof parsed.templateName !== "string") return null;
    if (!Array.isArray(parsed.selectedUniqueNames)) return null;
    if (typeof parsed.formOpen !== "boolean") return null;
    if (parsed.mode !== "create" && parsed.mode !== "edit") return null;
    if (parsed.editTemplateId != null && typeof parsed.editTemplateId !== "string")
      return null;
    const names = parsed.selectedUniqueNames.filter(
      (x): x is string => typeof x === "string",
    );
    return {
      ...parsed,
      selectedUniqueNames: names,
    };
  } catch {
    return null;
  }
}

export function readCustomTemplateDraft(): CustomTemplateDraft | null {
  if (typeof window === "undefined") return null;
  const parsed = parseDraft(window.localStorage.getItem(STORAGE_KEY));
  if (!parsed) return null;
  if (isExpired(parsed.draftStartedAt)) {
    clearCustomTemplateDraft();
    return null;
  }
  return parsed;
}

export function upsertCustomTemplateDraft(
  data: Omit<CustomTemplateDraft, "draftStartedAt" | "v">,
): void {
  if (typeof window === "undefined") return;
  try {
    const existing = parseDraft(window.localStorage.getItem(STORAGE_KEY));
    const draftStartedAt =
      existing && !isExpired(existing.draftStartedAt)
        ? existing.draftStartedAt
        : new Date().toISOString();
    const next: CustomTemplateDraft = {
      v: 1,
      draftStartedAt,
      ...data,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore quota / private mode
  }
}

export function clearCustomTemplateDraft(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}
