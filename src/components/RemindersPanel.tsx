import type { Bill } from "@/types";
import { useI18n } from "@/lib/i18n";
import { daysUntil, formatRM } from "@/lib/bills";
import { Card, CardContent } from "@/components/ui/card";
import { statusTheme } from "@/lib/theme";

export function RemindersPanel({ bills, onOpenCalendar }: { bills: Bill[]; onOpenCalendar: () => void }) {
  const { t, lang } = useI18n();

  const upcoming = bills
    .filter((b) => !b.paid && daysUntil(b.dueDate) >= 0 && daysUntil(b.dueDate) <= 7)
    .sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate))
    .slice(0, 4);

  const monthAbbrevEn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const monthAbbrevMs = ["Jan", "Feb", "Mac", "Apr", "Mei", "Jun", "Jul", "Ogo", "Sep", "Okt", "Nov", "Dis"];
  const monthAbbrev = lang === "ms" ? monthAbbrevMs : monthAbbrevEn;

  return (
    <Card className="rounded-2xl border-black/5 shadow-sm">
      <CardContent className="p-5">
        <h3 className="font-semibold text-sm">{t("remindersTitle")}</h3>
        <p className="text-xs text-muted-foreground mt-0.5">{t("remindersSubtitle")}</p>

        <div className="mt-4 space-y-3">
          {upcoming.length === 0 && <p className="text-xs text-muted-foreground">{t("remindersEmpty")}</p>}
          {upcoming.map((bill) => {
            const d = new Date(bill.dueDate + "T00:00:00");
            const days = daysUntil(bill.dueDate);
            const theme = statusTheme[days <= 3 ? "dueSoon" : "upcoming"];
            return (
              <div key={bill.id} className="flex items-center gap-3">
                <div
                  className="flex flex-col items-center justify-center h-10 w-10 rounded-lg shrink-0 leading-none"
                  style={{ backgroundColor: theme.bg, color: theme.fg }}
                >
                  <span className="text-sm font-bold">{d.getDate()}</span>
                  <span className="text-[8px] font-medium uppercase">{monthAbbrev[d.getMonth()]}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{bill.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {t("remindersDaysLeft", { n: days, amount: formatRM(bill.amount).replace("RM ", "") })}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onOpenCalendar}
          className="text-xs font-medium text-[#6d5bd0] mt-4 hover:underline"
        >
          {t("openCalendar")}
        </button>
      </CardContent>
    </Card>
  );
}
