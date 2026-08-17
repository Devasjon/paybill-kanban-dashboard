import { useMemo, useState } from "react";
import type { Bill, BillStatus } from "@/types";
import { useI18n } from "@/lib/i18n";
import { billStatus, daysUntil } from "@/lib/bills";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BillRow } from "@/components/BillRow";
import { KanbanBoard } from "@/components/KanbanBoard";
import { Plus, List, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

type FilterKey = "all" | BillStatus;

export function AllBills({
  bills,
  search,
  onMarkPaid,
  onEdit,
  onDelete,
  onOpenAddBill,
  onKanbanChange,
}: {
  bills: Bill[];
  search: string;
  onMarkPaid: (bill: Bill) => void;
  onEdit: (bill: Bill) => void;
  onDelete: (bill: Bill) => void;
  onOpenAddBill: () => void;
  onKanbanChange: (bill: Bill) => void;
}) {
  const { t } = useI18n();
  const [view, setView] = useState<"list" | "kanban">("list");
  const [filter, setFilter] = useState<FilterKey>("all");

  const filtered = useMemo(() => {
    let result = bills;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((b) => b.name.toLowerCase().includes(q));
    }
    if (filter !== "all") {
      result = result.filter((b) => billStatus(b) === filter);
    }
    return [...result].sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));
  }, [bills, search, filter]);

  const FILTERS: { key: FilterKey; labelKey: string }[] = [
    { key: "all", labelKey: "filterAll" },
    { key: "upcoming", labelKey: "filterUpcoming" },
    { key: "overdue", labelKey: "filterLate" },
    { key: "paid", labelKey: "filterPaid" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-bold">{t("allBillsTitle")}</h2>
          <p className="text-sm text-muted-foreground mt-0.5">{t("allBillsSubtitle")}</p>
        </div>
        <Button onClick={onOpenAddBill} className="rounded-full h-10 px-5 bg-[#17171d] hover:bg-[#26262f] gap-1.5">
          <Plus className="h-4 w-4" />
          {t("addNewBill")}
        </Button>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={cn(
                "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors",
                filter === f.key
                  ? "bg-[#17171d] text-white border-transparent"
                  : "bg-white text-muted-foreground border-black/10 hover:bg-black/5"
              )}
            >
              {t(f.labelKey)}
            </button>
          ))}
        </div>
        <div className="flex items-center rounded-full border border-black/10 bg-white p-0.5">
          <button
            type="button"
            onClick={() => setView("list")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              view === "list" ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
            )}
          >
            <List className="h-3.5 w-3.5" /> {t("viewList")}
          </button>
          <button
            type="button"
            onClick={() => setView("kanban")}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors",
              view === "kanban" ? "bg-[#17171d] text-white" : "text-muted-foreground hover:bg-black/5"
            )}
          >
            <LayoutGrid className="h-3.5 w-3.5" /> {t("viewKanban")}
          </button>
        </div>
      </div>

      {view === "list" ? (
        <Card className="rounded-2xl border-black/5 shadow-sm">
          <CardContent className="p-5">
            {filtered.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center">{t("noBillsFound")}</p>
            ) : (
              <div className="divide-y divide-black/5">
                {filtered.map((bill) => (
                  <BillRow key={bill.id} bill={bill} onMarkPaid={onMarkPaid} onEdit={onEdit} onDelete={onDelete} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ) : (
        <KanbanBoard bills={filtered} onChange={onKanbanChange} />
      )}
    </div>
  );
}
