import { useState } from "react";
import { Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { CHANGELOG } from "@/lib/changelog";
import { formatDate } from "@/lib/bills";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

export function WhatsNewButton() {
  const { t, lang } = useI18n();
  const [seen, setSeen] = useState(false);

  return (
    <Popover onOpenChange={(open) => open && setSeen(true)}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="relative h-9 w-9 flex items-center justify-center rounded-full hover:bg-black/5"
          aria-label={t("whatsNewTitle")}
        >
          <Sparkles className="h-[18px] w-[18px]" />
          {!seen && (
            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#f472b6] ring-2 ring-background" />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="p-4 border-b border-black/5">
          <p className="text-sm font-semibold flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" style={{ color: "#6d5bd0" }} />
            {t("whatsNewTitle")}
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{t("whatsNewSubtitle")}</p>
        </div>
        <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
          {CHANGELOG.map((entry) => (
            <div key={entry.id} className="p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{entry.title[lang]}</p>
                <span className="text-[10px] text-muted-foreground shrink-0">{formatDate(entry.date, lang)}</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{entry.description[lang]}</p>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
