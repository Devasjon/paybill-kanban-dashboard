import type { LucideIcon } from "lucide-react";

export function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  bg,
  fg,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  bg: string;
  fg: string;
}) {
  return (
    <div className="rounded-2xl p-4 sm:p-5" style={{ backgroundColor: bg }}>
      <span
        className="inline-flex items-center justify-center h-8 w-8 rounded-lg mb-3"
        style={{ backgroundColor: "rgba(255,255,255,0.55)", color: fg }}
      >
        <Icon className="h-4 w-4" strokeWidth={2.25} />
      </span>
      <p className="text-xs font-medium" style={{ color: fg, opacity: 0.85 }}>
        {label}
      </p>
      <p className="text-xl sm:text-2xl font-bold mt-1 tabular-nums text-[#1c1c1f]">{value}</p>
      <p className="text-xs mt-1" style={{ color: fg, opacity: 0.75 }}>
        {sub}
      </p>
    </div>
  );
}
