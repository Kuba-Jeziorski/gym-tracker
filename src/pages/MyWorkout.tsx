import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useLanguage } from "../contexts/LanguageContext";
import { Workout } from "./Workout";
import { History } from "./History";
import { cn } from "../lib/utils";

export type MyWorkoutTab = "new" | "completed";

/** Matches Layout mobile nav (`md:hidden`): tabs move under Workout title on small screens. */
const MOBILE_NAV_MEDIA = "(max-width: 767px)";

export function MyWorkout() {
  const { t } = useLanguage();
  const location = useLocation();
  const stateTab = (location.state as { tab?: MyWorkoutTab } | null)?.tab;
  const [tab, setTab] = useState<MyWorkoutTab>(stateTab === "completed" ? "completed" : "new");
  const [isMobileNavLayout, setIsMobileNavLayout] = useState(false);

  useEffect(() => {
    if (stateTab === "completed") setTab("completed");
  }, [stateTab]);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_NAV_MEDIA);
    const update = () => setIsMobileNavLayout(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  const embedMyWorkoutTabsBelowWorkoutTitle =
    tab === "new" && isMobileNavLayout;

  const myWorkoutTablist = (
    <div
      className="flex gap-1 rounded-lg border border-brand-border bg-brand-bg-soft p-1 w-fit max-w-full flex-wrap"
      role="tablist"
      aria-label={t("nav_myWorkout")}
    >
      <button
        type="button"
        role="tab"
        aria-selected={tab === "new"}
        onClick={() => setTab("new")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          tab === "new"
            ? "bg-brand-primary text-brand-bg"
            : "text-brand-text-muted hover:text-brand-text hover:bg-brand-bg",
        )}
      >
        {t("tab_newTraining")}
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={tab === "completed"}
        onClick={() => setTab("completed")}
        className={cn(
          "rounded-md px-4 py-2 text-sm font-medium transition-colors",
          tab === "completed"
            ? "bg-brand-primary text-brand-bg"
            : "text-brand-text-muted hover:text-brand-text hover:bg-brand-bg",
        )}
      >
        {t("tab_completedTrainings")}
      </button>
    </div>
  );

  return (
    <div className="flex flex-col min-h-0 flex-1">
      {!embedMyWorkoutTabsBelowWorkoutTitle && (
        <div className="shrink-0 mb-4">{myWorkoutTablist}</div>
      )}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden" role="tabpanel">
        {tab === "new" && (
          <Workout
            myWorkoutSubHeaderTabs={
              embedMyWorkoutTabsBelowWorkoutTitle
                ? myWorkoutTablist
                : undefined
            }
          />
        )}
        {tab === "completed" && <History />}
      </div>
    </div>
  );
}
