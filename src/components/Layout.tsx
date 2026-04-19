import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard,
  ChartColumn,
  Dumbbell,
  ListPlus,
  Download,
  User,
  Settings,
  Menu,
  X,
} from "lucide-react";
import { routes } from "../routes";
import { navItems } from "../navConfig";
import { getPageTitleKey } from "../helpers/getPageTitle";
import { useLanguage } from "../contexts/LanguageContext";
import { useProfileLoading } from "../contexts/AccountPreferencesContext";
import { PageLoader } from "./PageLoader";
import { cn } from "../lib/utils";

const navIcons: Record<string, typeof LayoutDashboard> = {
  [routes.dashboard]: LayoutDashboard,
  [routes.summary]: ChartColumn,
  [routes.workout]: Dumbbell,
  [routes.library]: ListPlus,
  [routes.install]: Download,
  [routes.user]: User,
  [routes.settings]: Settings,
};

export function Layout() {
  const location = useLocation();
  const { t } = useLanguage();
  const profileLoading = useProfileLoading();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const titleKey = getPageTitleKey(location.pathname);
    document.title = `${t("appTitle")} - ${t(titleKey)}`;
  }, [location.pathname, t]);

  useEffect(() => {
    setMobileNavOpen(false);
  }, [location.pathname]);

  const titleKey = useMemo(
    () => getPageTitleKey(location.pathname),
    [location.pathname],
  );

  if (profileLoading) {
    return <PageLoader />;
  }

  return (
    <div
      className={cn(
        "flex bg-brand-bg overflow-hidden",
        "h-[100dvh]",
        "p-3 sm:p-4 md:p-6",
        "gap-0 md:gap-8",
      )}
    >
      <aside
        className={cn(
          "hidden md:flex",
          "w-52 shrink-0 rounded-xl bg-brand-bg-soft border border-brand-border flex-col shadow-sm overflow-hidden",
        )}
      >
        <div
          className={cn(
            "pt-10 pb-8 px-6 border-b border-brand-border flex flex-col items-center justify-center min-h-[7rem] gap-3",
          )}
        >
          <NavLink
            to={routes.dashboard}
            className={cn(
              "flex flex-col items-center gap-3 text-brand-dark font-semibold text-2xl tracking-tight text-center",
              "transition-colors duration-300 hover:text-brand-primary",
            )}
          >
            <img src="/favicon.svg" alt="" className="w-12 h-12 shrink-0" aria-hidden />
            <span>{t("appTitle")}</span>
          </NavLink>
        </div>
        <nav className={cn("flex-1 p-4 flex flex-col gap-1")}>
          {navItems.map(({ to, labelKey }) => {
            const Icon = navIcons[to];
            return (
              <NavLink
                key={to}
                to={to}
                end={to === routes.dashboard}
                className={({ isActive }) =>
                  cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-300",
                    "flex items-center gap-2",
                    isActive
                      ? "bg-brand-primary/15 text-brand-primary"
                      : "text-brand-text hover:bg-brand-bg hover:text-brand-primary",
                  )
                }
              >
                {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden />}
                {t(labelKey)}
              </NavLink>
            );
          })}
        </nav>
      </aside>

      <div className={cn("md:hidden")}>
        {mobileNavOpen && (
          <button
            type="button"
            onClick={() => setMobileNavOpen(false)}
            className="fixed inset-0 z-40 bg-black/55"
            aria-label={t("nav_close")}
          />
        )}
        <aside
          className={cn(
            "fixed left-0 top-0 bottom-0 z-50",
            "w-[18rem] max-w-[85vw]",
            "bg-brand-bg-soft border-r border-brand-border shadow-xl",
            "transform transition-transform duration-200",
            mobileNavOpen ? "translate-x-0" : "-translate-x-full",
            "flex flex-col overflow-hidden",
          )}
          aria-hidden={!mobileNavOpen}
        >
          <div className="pt-6 pb-4 px-5 border-b border-brand-border flex items-center justify-between gap-3">
            <NavLink
              to={routes.dashboard}
              className={cn(
                "flex items-center gap-3 text-brand-dark font-semibold text-lg tracking-tight",
                "transition-colors duration-300 hover:text-brand-primary",
              )}
            >
              <img src="/favicon.svg" alt="" className="w-10 h-10 shrink-0" aria-hidden />
              <span>{t("appTitle")}</span>
            </NavLink>
            <button
              type="button"
              onClick={() => setMobileNavOpen(false)}
              className="rounded-lg p-2 text-brand-text-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
              aria-label={t("nav_close")}
            >
              <X className="w-5 h-5" aria-hidden />
            </button>
          </div>
          <nav className={cn("flex-1 p-3 flex flex-col gap-1")}>
            {navItems.map(({ to, labelKey }) => {
              const Icon = navIcons[to];
              return (
                <NavLink
                  key={to}
                  to={to}
                  end={to === routes.dashboard}
                  className={({ isActive }) =>
                    cn(
                      "rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-300",
                      "flex items-center gap-2",
                      isActive
                        ? "bg-brand-primary/15 text-brand-primary"
                        : "text-brand-text hover:bg-brand-bg hover:text-brand-primary",
                    )
                  }
                >
                  {Icon && <Icon className="w-4 h-4 shrink-0" aria-hidden />}
                  {t(labelKey)}
                </NavLink>
              );
            })}
          </nav>
        </aside>
      </div>

      <main className={cn("flex-1 min-w-0 min-h-0 flex flex-col overflow-hidden")}>
        <div className="md:hidden shrink-0 mb-3">
          <div className="rounded-xl border border-brand-border bg-brand-bg-soft px-3 py-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileNavOpen(true)}
              className="rounded-lg p-2 text-brand-text-muted hover:text-brand-text hover:bg-brand-bg transition-colors"
              aria-label={t("nav_open")}
            >
              <Menu className="w-5 h-5" aria-hidden />
            </button>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-brand-dark truncate">
                {t(titleKey)}
              </p>
            </div>
            <div className="w-9" />
          </div>
        </div>

        <div
          className={cn(
            "w-full flex flex-col flex-1 min-h-0 overflow-y-auto",
            "p-4 sm:p-6 lg:p-8",
            "rounded-xl border border-brand-border bg-brand-bg-soft md:border-0 md:bg-transparent md:rounded-none md:p-0",
          )}
        >
          <Outlet />
        </div>
      </main>
    </div>
  );
}
