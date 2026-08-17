import type { BillStatus } from "@/types";
import { statusTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function StatusBadge({ status, label, className }: { status: BillStatus; label: string; className?: string }) {
  const s = statusTheme[status];
  const Icon = s.icon;
  return (
    <span
      className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium", className)}
      style={{ backgroundColor: s.bg, color: s.fg }}
    >
      <Icon className="h-3 w-3" strokeWidth={2.5} />
      {label}
    </span>
  );
}
