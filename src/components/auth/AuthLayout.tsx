import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { sidebarBg, brandPurple } from "@/lib/theme";
import { LanguageToggle } from "@/components/auth/LanguageToggle";

/**
 * The two-panel auth shell: left = Paybill branding (reuses Sidebar.tsx's
 * brand mark and promoTitle/promoSubtitle copy), right = the auth form.
 * Hidden on small screens — just the form panel shows there.
 */
export function AuthLayout({ children }: { children: React.ReactNode }) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex bg-white">
      <div
        className="hidden lg:flex lg:w-[42%] xl:w-[38%] flex-col justify-between p-10 shrink-0"
        style={{ backgroundColor: sidebarBg }}
      >
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

        <div>
          <h1 className="text-white text-3xl font-semibold leading-tight max-w-sm">{t("authBrandHeadline")}</h1>
          <p className="text-white/60 text-sm mt-3 max-w-sm leading-relaxed">{t("authBrandSubheadline")}</p>
        </div>

        <div
          className="rounded-xl p-4 text-white relative overflow-hidden max-w-sm"
          style={{ background: `linear-gradient(135deg, ${brandPurple}, #8b7ff0)` }}
        >
          <Sparkles className="h-4 w-4 mb-2 opacity-90" />
          <p className="text-sm font-semibold leading-snug">{t("promoTitle")}</p>
          <p className="text-xs text-white/75 mt-1 leading-snug">{t("promoSubtitle")}</p>
        </div>
      </div>

      <div className="flex-1 flex flex-col min-h-screen">
        <div className="flex justify-between lg:justify-end items-center p-5 sm:p-6">
          <div className="flex items-center gap-2 lg:hidden">
            <span
              className="flex items-center justify-center h-7 w-7 rounded-lg text-white font-bold text-xs"
              style={{ backgroundColor: brandPurple }}
            >
              P
            </span>
            <span className="font-semibold text-sm">{t("appName")}</span>
          </div>
          <LanguageToggle />
        </div>

        <div className="flex-1 flex items-center justify-center px-5 sm:px-6 pb-10">
          <div className="w-full max-w-sm">{children}</div>
        </div>
      </div>
    </div>
  );
}
