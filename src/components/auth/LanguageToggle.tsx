import type { Lang } from "@/types";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * The pill language switcher, extracted from Settings.tsx so both the
 * Settings page and the auth screens share one implementation. Reads/writes
 * language directly via useI18n — no props needed.
 */
export function LanguageToggle({ className }: { className?: string }) {
  const { lang, setLang } = useI18n();

  return (
    <div className={cn("flex items-center rounded-full border border-black/10 bg-white p-0.5 w-fit", className)}>
      {(["en", "ms"] as Lang[]).map((l) => (
        <button
          key={l}
          type="button"
          onClick={() => setLang(l)}
          className={cn(
            "px-4 py-1.5 rounded-full text-xs font-medium transition-colors",
            lang === l ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
          )}
        >
          {l === "en" ? "English" : "Bahasa Melayu"}
        </button>
      ))}
    </div>
  );
}
