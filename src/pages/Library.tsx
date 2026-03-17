import { useState } from "react";
import { useLanguage } from "../contexts/LanguageContext";
import { Exercises } from "./Exercises";
import { Templates } from "./Templates";
import { cn } from "../lib/utils";

type LibraryTab = "exercises" | "templates";

export function Library() {
  const { t } = useLanguage();
  const [tab, setTab] = useState<LibraryTab>("exercises");

  return (
    <div className="flex flex-col min-h-0 flex-1">
      <div className="shrink-0 mb-4">
        <h1 className="text-2xl font-semibold text-brand-dark mb-2">
          {t("library_title")}
        </h1>
        <p className="text-brand-text-muted mb-4">{t("library_description")}</p>
        <div
          className="flex gap-1 rounded-lg border border-brand-border bg-brand-bg-soft p-1 w-fit"
          role="tablist"
          aria-label={t("library_title")}
        >
          <button
            type="button"
            role="tab"
            aria-selected={tab === "exercises"}
            onClick={() => setTab("exercises")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "exercises"
                ? "bg-brand-primary text-brand-bg"
                : "text-brand-text-muted hover:text-brand-text hover:bg-brand-bg",
            )}
          >
            {t("tab_exercises")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "templates"}
            onClick={() => setTab("templates")}
            className={cn(
              "rounded-md px-4 py-2 text-sm font-medium transition-colors",
              tab === "templates"
                ? "bg-brand-primary text-brand-bg"
                : "text-brand-text-muted hover:text-brand-text hover:bg-brand-bg",
            )}
          >
            {t("tab_templates")}
          </button>
        </div>
      </div>
      <div className="flex-1 min-h-0 flex flex-col" role="tabpanel">
        {tab === "exercises" && <Exercises />}
        {tab === "templates" && <Templates />}
      </div>
    </div>
  );
}
