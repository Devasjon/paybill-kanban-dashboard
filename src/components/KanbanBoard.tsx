import { useState } from "react";
import {
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  useDraggable,
  useDroppable,
  DragOverlay,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import type { Bill, BillStatus } from "@/types";
import { useI18n } from "@/lib/i18n";
import { billStatus, daysUntil, formatRM, formatDate } from "@/lib/bills";
import { categoryTheme, statusTheme } from "@/lib/theme";
import { categoryLabelKey } from "@/lib/labels";

const COLUMNS: { status: BillStatus; labelKey: string }[] = [
  { status: "upcoming", labelKey: "kanbanColUpcoming" },
  { status: "dueSoon", labelKey: "kanbanColDueSoon" },
  { status: "overdue", labelKey: "kanbanColLate" },
  { status: "paid", labelKey: "kanbanColPaid" },
];

function BillCard({ bill, dragging = false }: { bill: Bill; dragging?: boolean }) {
  const { t, lang } = useI18n();
  const cat = categoryTheme[bill.category];
  const Icon = cat.icon;
  return (
    <div
      className="rounded-xl bg-white border border-black/5 p-3 shadow-sm select-none"
      style={{ opacity: dragging ? 0.9 : 1, boxShadow: dragging ? "0 8px 24px rgba(0,0,0,0.15)" : undefined }}
    >
      <div className="flex items-center gap-2">
        <span
          className="flex items-center justify-center h-7 w-7 rounded-lg shrink-0"
          style={{ backgroundColor: cat.bg, color: cat.fg }}
        >
          <Icon className="h-3.5 w-3.5" strokeWidth={2.25} />
        </span>
        <p className="text-sm font-medium truncate">{bill.name}</p>
      </div>
      <p className="text-xs text-muted-foreground mt-1.5">{t(categoryLabelKey(bill.category))}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-sm font-semibold tabular-nums">{formatRM(bill.amount)}</span>
        <span className="text-[11px] text-muted-foreground">{formatDate(bill.dueDate, lang)}</span>
      </div>
    </div>
  );
}

function DraggableCard({ bill }: { bill: Bill }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: bill.id,
    data: { bill },
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, touchAction: "none" as const }
    : { touchAction: "none" as const };

  return (
    <div ref={setNodeRef} style={{ ...style, opacity: isDragging ? 0.35 : 1 }} {...listeners} {...attributes}>
      <BillCard bill={bill} />
    </div>
  );
}

function Column({ status, labelKey, bills }: { status: BillStatus; labelKey: string; bills: Bill[] }) {
  const { t } = useI18n();
  const { setNodeRef, isOver } = useDroppable({ id: status });
  const theme = statusTheme[status];
  const total = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <div
      ref={setNodeRef}
      className="rounded-2xl p-3 flex flex-col min-w-[260px] w-full sm:w-auto sm:flex-1 transition-colors"
      style={{ backgroundColor: isOver ? theme.bg : "#F4F4F2" }}
    >
      <div className="flex items-center justify-between px-1 mb-2">
        <div className="flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: theme.dot }} />
          <span className="text-sm font-semibold">{t(labelKey)}</span>
          <span className="text-xs text-muted-foreground">({bills.length})</span>
        </div>
      </div>
      <p className="text-xs text-muted-foreground px-1 mb-2 tabular-nums">{formatRM(total)}</p>
      <div className="space-y-2 min-h-[80px]">
        {bills.map((bill) => (
          <DraggableCard key={bill.id} bill={bill} />
        ))}
      </div>
    </div>
  );
}

export function KanbanBoard({ bills, onChange }: { bills: Bill[]; onChange: (bill: Bill) => void }) {
  const { t } = useI18n();
  const [activeBill, setActiveBill] = useState<Bill | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 8 } })
  );

  function handleDragStart(e: DragStartEvent) {
    const bill = e.active.data.current?.bill as Bill | undefined;
    setActiveBill(bill ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setActiveBill(null);
    const bill = e.active.data.current?.bill as Bill | undefined;
    const targetStatus = e.over?.id as BillStatus | undefined;
    if (!bill || !targetStatus) return;

    const currentStatus = billStatus(bill);
    if (targetStatus === currentStatus) return;

    if (targetStatus === "paid") {
      onChange({ ...bill, paid: true });
    } else if (currentStatus === "paid") {
      onChange({ ...bill, paid: false });
    }
    // Dropping between upcoming/dueSoon/overdue is a no-op: those are derived
    // purely from the due date, so the card will snap back to its real
    // column — dragging still gives clear tactile feedback either way.
  }

  const byStatus = (status: BillStatus) =>
    bills.filter((b) => billStatus(b) === status).sort((a, b) => daysUntil(a.dueDate) - daysUntil(b.dueDate));

  return (
    <div>
      <p className="text-xs text-muted-foreground mb-3">{t("dragHint")}</p>
      <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
        <div className="flex flex-col sm:flex-row gap-3 overflow-x-auto pb-2">
          {COLUMNS.map((col) => (
            <Column key={col.status} status={col.status} labelKey={col.labelKey} bills={byStatus(col.status)} />
          ))}
        </div>
        <DragOverlay>{activeBill ? <BillCard bill={activeBill} dragging /> : null}</DragOverlay>
      </DndContext>
    </div>
  );
}
