import { Search, Menu, Sun, Moon } from "lucide-react";
import type { NotificationLogEntry, Theme } from "@/types";
import { useI18n } from "@/lib/i18n";
import { Input } from "@/components/ui/input";
import { WhatsNewButton } from "@/components/WhatsNewButton";
import { NotificationBell } from "@/components/NotificationBell";

const PAGE_TITLE_KEY: Record<string, string> = {
  dashboard: "navDashboard",
  bills: "navAllBills",
  calendar: "navCalendar",
  debts: "navMyDebts",
  analytics: "navAnalytics",
  paymentMethods: "navPaymentMethods",
  settings: "navSettings",
};

export function Topbar({
  page,
  search,
  setSearch,
  onOpenMobileMenu,
  theme,
  onToggleTheme,
  notificationLog,
}: {
  page: string;
  search: string;
  setSearch: (s: string) => void;
  onOpenMobileMenu: () => void;
  theme: Theme;
  onToggleTheme: () => void;
  notificationLog: NotificationLogEntry[];
}) {
  const { t } = useI18n();

  return (
    <div className="sticky top-0 z-30 bg-background/90 backdrop-blur px-4 sm:px-6 py-4 flex items-center justify-between gap-3 border-b border-black/[0.04]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          className="lg:hidden h-9 w-9 flex items-center justify-center rounded-lg hover:bg-black/5 shrink-0"
          onClick={onOpenMobileMenu}
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <h1 className="text-lg font-semibold truncate">{t(PAGE_TITLE_KEY[page] ?? "navDashboard")}</h1>
      </div>
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <div className="relative hidden sm:block mr-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("searchPlaceholder")}
            className="pl-9 w-52 md:w-64 rounded-full bg-white dark:bg-white/5"
          />
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          className="h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5"
          aria-label={t(theme === "dark" ? "switchToLight" : "switchToDark")}
        >
          {theme === "dark" ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
        </button>
        <WhatsNewButton />
        <NotificationBell notificationLog={notificationLog} />
        <div
          className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0 ml-1"
          style={{ background: "linear-gradient(135deg, #a78bfa, #f472b6)" }}
        >
          GA
        </div>
      </div>
    </div>
  );
}
