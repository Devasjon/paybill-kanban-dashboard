import {
  LayoutDashboard,
  Receipt,
  Calendar,
  Landmark,
  BarChart3,
  Wallet,
  Settings,
  Sparkles,
  X,
} from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { sidebarBg, sidebarActiveBg, sidebarBorder, brandPurple } from "@/lib/theme";
import type { Page } from "@/App";

const NAV_WORKSPACE: { page: Page; icon: typeof LayoutDashboard; labelKey: string }[] = [
  { page: "dashboard", icon: LayoutDashboard, labelKey: "navDashboard" },
  { page: "bills", icon: Receipt, labelKey: "navAllBills" },
  { page: "calendar", icon: Calendar, labelKey: "navCalendar" },
  { page: "debts", icon: Landmark, labelKey: "navMyDebts" },
];

const NAV_MANAGEMENT: { page: Page; icon: typeof LayoutDashboard; labelKey: string }[] = [
  { page: "analytics", icon: BarChart3, labelKey: "navAnalytics" },
  { page: "paymentMethods", icon: Wallet, labelKey: "navPaymentMethods" },
  { page: "settings", icon: Settings, labelKey: "navSettings" },
];

export function Sidebar({
  page,
  setPage,
  mobileOpen,
  onCloseMobile,
}: {
  page: Page;
  setPage: (p: Page) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}) {
  const { t } = useI18n();

  const NavGroup = ({
    label,
    items,
  }: {
    label: string;
    items: { page: Page; icon: typeof LayoutDashboard; labelKey: string }[];
  }) => (
    <div className="mb-5">
      <p className="px-3 mb-1.5 text-[10px] font-semibold tracking-wider text-white/35">{label}</p>
      <nav className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = page === item.page;
          return (
            <button
              key={item.page}
              type="button"
              onClick={() => {
                setPage(item.page);
                onCloseMobile();
              }}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                active ? "text-white" : "text-white/55 hover:text-white/85 hover:bg-white/5"
              )}
              style={active ? { backgroundColor: sidebarActiveBg } : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              <span className="truncate">{t(item.labelKey)}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );

  return (
    <>
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onCloseMobile}
          aria-hidden="true"
        />
      )}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col shrink-0 transition-transform duration-200 lg:sticky lg:top-0 lg:h-screen lg:translate-x-0",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
        style={{ backgroundColor: sidebarBg, borderRight: `1px solid ${sidebarBorder}` }}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <div className="flex items-center gap-2.5">
            <span
              className="flex items-center justify-center h-8 w-8 rounded-lg text-white font-bold text-sm"
              style={{ backgroundColor: brandPurple }}
            >
              P
            </span>
            <span className="text-white font-semibold text-base">
              {t("appName")}
              <span style={{ color: brandPurple }}>.</span>
            </span>
          </div>
          <button
            type="button"
            className="lg:hidden text-white/60 hover:text-white"
            onClick={onCloseMobile}
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-4 pb-5 flex items-center gap-2.5 border-b" style={{ borderColor: sidebarBorder }}>
          <div
            className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-semibold shrink-0"
            style={{ background: "linear-gradient(135deg, #a78bfa, #f472b6)" }}
          >
            GA
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">Gaya Avasi</p>
            <p className="text-white/40 text-xs truncate">{t("personalAccount")}</p>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pt-4">
          <NavGroup label={t("navGroupWorkspace")} items={NAV_WORKSPACE} />
          <NavGroup label={t("navGroupManagement")} items={NAV_MANAGEMENT} />
        </div>

        <div className="p-3">
          <div
            className="rounded-xl p-4 text-white relative overflow-hidden"
            style={{ background: `linear-gradient(135deg, ${brandPurple}, #8b7ff0)` }}
          >
            <Sparkles className="h-4 w-4 mb-2 opacity-90" />
            <p className="text-sm font-semibold leading-snug">{t("promoTitle")}</p>
            <p className="text-xs text-white/75 mt-1 leading-snug">{t("promoSubtitle")}</p>
          </div>
        </div>
      </aside>
    </>
  );
}
