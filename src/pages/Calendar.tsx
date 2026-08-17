import { useMemo, useState } from "react";
import type { Bill } from "@/types";
import { useI18n } from "@/lib/i18n";
import { billStatus, formatRM } from "@/lib/bills";
import { statusTheme } from "@/lib/theme";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MONTHS_EN = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];
const MONTHS_MS = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

const WEEKDAYS_EN = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAYS_MS = ["Ahd", "Isn", "Sel", "Rab", "Kha", "Jum", "Sab"];

function toIso(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function CalendarPage({ bills }: { bills: Bill[] }) {
  const { t, lang } = useI18n();
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));

  const months = lang === "ms" ? MONTHS_MS : MONTHS_EN;
  const weekdays = lang === "ms" ? WEEKDAYS_MS : WEEKDAYS_EN;

  const billsByDate = useMemo(() => {
    const map = new Map<string, Bill[]>();
    for (const b of bills) {
      const list = map.get(b.dueDate) ?? [];
      list.push(b);
      map.set(b.dueDate, list);
    }
    return map;
  }, [bills]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayIso = toIso(today.getFullYear(), today.getMonth(), today.getDate());

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDayOfWeek }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  const LEGEND: { status: keyof typeof statusTheme; labelKey: string }[] = [
    { status: "upcoming", labelKey: "legendUpcoming" },
    { status: "dueSoon", labelKey: "legendDueSoon" },
    { status: "overdue", labelKey: "legendLate" },
    { status: "paid", labelKey: "legendPaid" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">{t("calendarTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("calendarSubtitle")}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {LEGEND.map((l) => (
            <span key={l.status} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusTheme[l.status].dot }} />
              {t(l.labelKey)}
            </span>
          ))}
        </div>
      </div>

      <Card className="rounded-2xl border-black/5 shadow-sm">
        <CardContent className="p-4 sm:p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-sm">
              {months[month]} {year}
            </h3>
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setCursor(new Date(year, month - 1, 1))}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-full text-xs px-3"
                onClick={() => setCursor(new Date(today.getFullYear(), today.getMonth(), 1))}
              >
                {t("today")}
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8"
                onClick={() => setCursor(new Date(year, month + 1, 1))}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {weekdays.map((w) => (
              <div key={w} className="text-center text-[10px] font-medium text-muted-foreground py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="aspect-square" />;
              const iso = toIso(year, month, day);
              const dayBills = billsByDate.get(iso) ?? [];
              const isToday = iso === todayIso;
              return (
                <div
                  key={iso}
                  className={cn(
                    "aspect-square rounded-lg p-1 sm:p-1.5 flex flex-col gap-0.5 overflow-hidden border",
                    isToday ? "border-[#6d5bd0]" : "border-black/5"
                  )}
                  style={{ backgroundColor: isToday ? "#F1F0FE" : "#FAFAF9" }}
                >
                  <span className={cn("text-[10px] sm:text-xs font-medium", isToday && "text-[#4B3A9E] font-bold")}>
                    {day}
                  </span>
                  <div className="flex-1 flex flex-col gap-0.5 min-h-0">
                    {dayBills.slice(0, 2).map((b) => {
                      const theme = statusTheme[billStatus(b)];
                      return (
                        <span
                          key={b.id}
                          title={`${b.name} · ${formatRM(b.amount)}`}
                          className="text-[8px] sm:text-[9px] leading-tight rounded px-1 py-0.5 truncate"
                          style={{ backgroundColor: theme.bg, color: theme.fg }}
                        >
                          {b.name}
                        </span>
                      );
                    })}
                    {dayBills.length > 2 && (
                      <span className="text-[8px] text-muted-foreground px-1">+{dayBills.length - 2}</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
