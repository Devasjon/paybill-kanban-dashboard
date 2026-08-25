import { Palette } from "lucide-react";
import type { DebtColorScheme } from "@/types";
import { useI18n } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function ColorSchemeToggle({
  value,
  onChange,
}: {
  value: DebtColorScheme;
  onChange: (scheme: DebtColorScheme) => void;
}) {
  const { t } = useI18n();

  return (
    <div className="flex items-center gap-2">
      <Palette className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
      <div className="flex items-center rounded-full border border-black/10 bg-white p-0.5">
        <button
          type="button"
          onClick={() => onChange("pinkPurple")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            value === "pinkPurple" ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
          )}
        >
          {t("colorSchemePinkPurple")}
        </button>
        <button
          type="button"
          onClick={() => onChange("blueGreen")}
          className={cn(
            "px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
            value === "blueGreen" ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
          )}
        >
          {t("colorSchemeBlueGreen")}
        </button>
      </div>
    </div>
  );
}
