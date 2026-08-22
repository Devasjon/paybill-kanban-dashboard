import { Plus, StickyNote, ChevronRight } from "lucide-react";
import type { Bill, CalendarNote } from "@/types";
import { useI18n } from "@/lib/i18n";
import { billStatus, formatRM } from "@/lib/bills";
import { statusTheme } from "@/lib/theme";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";

function formatFullDate(iso: string, lang: "en" | "ms"): string {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString(lang === "ms" ? "ms-MY" : "en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const STATUS_LABEL_KEY = {
  upcoming: "statusUpcoming",
  dueSoon: "statusDueSoon",
  overdue: "statusLate",
  paid: "statusPaid",
} as const;

export function DayModal({
  open,
  onOpenChange,
  date,
  bills,
  notes,
  onEditBill,
  onAddBill,
  onEditNote,
  onAddNote,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  bills: Bill[];
  notes: CalendarNote[];
  onEditBill: (bill: Bill) => void;
  onAddBill: (date: string) => void;
  onEditNote: (note: CalendarNote) => void;
  onAddNote: (date: string) => void;
}) {
  const { t, lang } = useI18n();

  if (!date) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        <div className="p-6">
          <p className="text-[10px] font-semibold tracking-wider text-muted-foreground">{t("modalEyebrow")}</p>
          <h2 className="text-lg font-semibold mt-1">{formatFullDate(date, lang)}</h2>

          {bills.length === 0 && notes.length === 0 ? (
            <p className="text-sm text-muted-foreground mt-3">{t("dayModalEmpty")}</p>
          ) : (
            <div className="mt-4 space-y-2">
              {bills.map((bill) => {
                const status = billStatus(bill);
                const theme = statusTheme[status];
                return (
                  <button
                    key={bill.id}
                    type="button"
                    onClick={() => onEditBill(bill)}
                    className="w-full flex items-center gap-2.5 rounded-xl border border-black/5 p-3 text-left hover:bg-black/[0.02] transition-colors"
                  >
                    <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: theme.dot }} />
                    <span className="flex-1 min-w-0">
                      <span className="block text-sm font-medium truncate">{bill.name}</span>
                      <span className="block text-xs text-muted-foreground tabular-nums">{formatRM(bill.amount)}</span>
                    </span>
                    <StatusBadge status={status} label={t(STATUS_LABEL_KEY[status])} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  </button>
                );
              })}
              {notes.map((note) => (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => onEditNote(note)}
                  className="w-full flex items-start gap-2.5 rounded-xl border border-dashed border-black/10 p-3 text-left hover:bg-black/[0.02] transition-colors"
                >
                  <StickyNote className="h-4 w-4 text-muted-foreground shrink-0 mt-0.5" />
                  <span className="flex-1 min-w-0 text-sm">{note.text}</span>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 mt-5">
            <Button
              variant="outline"
              onClick={() => onAddBill(date)}
              className="flex-1 rounded-full h-10 gap-1.5 text-sm"
            >
              <Plus className="h-4 w-4" />
              {t("addNewBill")}
            </Button>
            <Button
              variant="outline"
              onClick={() => onAddNote(date)}
              className="flex-1 rounded-full h-10 gap-1.5 text-sm"
            >
              <StickyNote className="h-4 w-4" />
              {t("addNote")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
