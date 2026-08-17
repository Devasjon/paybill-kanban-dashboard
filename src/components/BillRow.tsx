import type { Bill } from "@/types";
import { useI18n } from "@/lib/i18n";
import { billStatus, daysUntil, formatDate, formatRM } from "@/lib/bills";
import { categoryTheme } from "@/lib/theme";
import { categoryLabelKey } from "@/lib/labels";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Check } from "lucide-react";

function statusLabel(t: (k: string, v?: Record<string, string | number>) => string, bill: Bill): string {
  const status = billStatus(bill);
  if (status === "paid") return t("statusPaid");
  const d = daysUntil(bill.dueDate);
  if (status === "overdue") return t("statusOverdueDays", { n: Math.abs(d) });
  if (d === 0) return t("statusDueToday");
  return t("statusDueInDays", { n: d });
}

export function BillRow({
  bill,
  onMarkPaid,
  onEdit,
  onDelete,
  showActions = true,
}: {
  bill: Bill;
  onMarkPaid: (bill: Bill) => void;
  onEdit?: (bill: Bill) => void;
  onDelete?: (bill: Bill) => void;
  showActions?: boolean;
}) {
  const { t, lang } = useI18n();
  const status = billStatus(bill);
  const cat = categoryTheme[bill.category];
  const Icon = cat.icon;

  return (
    <div className="flex items-center gap-3 py-2.5">
      <span
        className="flex items-center justify-center h-9 w-9 rounded-xl shrink-0"
        style={{ backgroundColor: cat.bg, color: cat.fg }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium truncate">{bill.name}</p>
        <p className="text-xs text-muted-foreground truncate">
          {t(categoryLabelKey(bill.category))} · {t("billDueOn", { date: formatDate(bill.dueDate, lang) })}
        </p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-sm font-semibold tabular-nums">{formatRM(bill.amount)}</p>
        <StatusBadge status={status} label={statusLabel(t, bill)} className="mt-0.5" />
      </div>
      {showActions && (
        <div className="flex items-center gap-1 shrink-0">
          {!bill.paid && (
            <Button size="sm" variant="outline" className="h-8 rounded-full text-xs" onClick={() => onMarkPaid(bill)}>
              <Check className="h-3 w-3 mr-1" />
              {t("payAction")}
            </Button>
          )}
          {onEdit && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onEdit(bill)}>
              <Pencil className="h-3.5 w-3.5" />
            </Button>
          )}
          {onDelete && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => onDelete(bill)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
