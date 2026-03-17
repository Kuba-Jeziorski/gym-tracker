import { Outlet, NavLink, useLocation } from "react-router-dom";
import { useEffect } from "react";
import {
  LayoutDashboard,
  Dumbbell,
  History,
  Download,
  Settings,
} from "lucide-react";
import { routes } from "../routes";
import { navItems } from "../navConfig";
import { getPageTitleKey } from "../helpers/getPageTitle";
import { useLanguage } from "../contexts/LanguageContext";
import { cn } from "../lib/utils";

const navIcons: Record<string, typeof LayoutDashboard> = {
  [routes.dashboard]: LayoutDashboard,
  [routes.workout]: Dumbbell,
  [routes.history]: History,
  [routes.install]: Download,
  [routes.settings]: Settings,
};

export function Layout() {
  const location = useLocation();
  const { t } = useLanguage();

  useEffect(() => {
    const titleKey = getPageTitleKey(location.pathname);
    document.title = `${t("appTitle")} - ${t(titleKey)}`;
  }, [location.pathname, t]);

  return (
    <div className={cn("flex min-h-screen bg-brand-bg py-6 pl-6 pr-6 gap-8")}>
      <aside
        className={cn(
          "w-52 shrink-0 rounded-xl bg-brand-bg-soft border border-brand-border flex flex-col shadow-sm overflow-hidden"
        )}
      >
        <div
          className={cn(
            "pt-10 pb-8 px-6 border-b border-brand-border flex flex-col items-center justify-center min-h-[7rem] gap-3"
          )}
        >
          <NavLink
            to={routes.dashboard}
            className={cn(
              "flex flex-col items-center gap-3 text-brand-dark font-semibold text-2xl tracking-tight text-center",
              "transition-colors duration-300 hover:text-brand-primary"
            )}
          >
            <img
              src="/favicon.svg"
              alt=""
              className="w-12 h-12 shrink-0"
              aria-hidden
            />
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
                      : "text-brand-text hover:bg-brand-bg hover:text-brand-primary"
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

      <main className={cn("flex-1 min-w-0 flex flex-col min-h-0")}>
        <div className={cn("w-full p-8 flex flex-col flex-1 min-h-0 overflow-hidden")}>
          <div className={cn("flex-1 min-h-0 flex flex-col")}>
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
