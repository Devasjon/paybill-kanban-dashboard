import type { Bill, BillStatus } from "@/types";

export function daysUntil(dateStr: string, from: Date = new Date()): number {
  const due = new Date(dateStr + "T00:00:00");
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  return Math.round((due.getTime() - start.getTime()) / 86400000);
}

export function billStatus(bill: Bill): BillStatus {
  if (bill.paid) return "paid";
  const d = daysUntil(bill.dueDate);
  if (d < 0) return "overdue";
  if (d <= 3) return "dueSoon";
  return "upcoming";
}

export function nextMonthDate(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  const day = d.getDate();
  d.setDate(1);
  d.setMonth(d.getMonth() + 1);
  const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  d.setDate(Math.min(day, lastDay));
  return d.toISOString().slice(0, 10);
}

export function formatDate(dateStr: string, lang: "en" | "ms"): string {
  const d = new Date(dateStr + "T00:00:00");
  const monthsEn = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const monthsMs = [
    "Jan", "Feb", "Mac", "Apr", "Mei", "Jun",
    "Jul", "Ogos", "Sep", "Okt", "Nov", "Dis",
  ];
  const months = lang === "ms" ? monthsMs : monthsEn;
  return `${d.getDate()} ${months[d.getMonth()]}`;
}

export function formatRM(n: number): string {
  return "RM " + n.toLocaleString("en-MY", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatRMShort(n: number): string {
  return "RM" + Math.round(n).toLocaleString("en-MY");
}
