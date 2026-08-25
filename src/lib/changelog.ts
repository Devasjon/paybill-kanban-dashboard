import type { Lang } from "@/types";

export interface ChangelogEntry {
  id: string;
  date: string; // ISO yyyy-mm-dd
  title: Record<Lang, string>;
  description: Record<Lang, string>;
}

// Newest first. Add a new entry here whenever a user-facing feature ships —
// this list drives the "what's new" sparkle button in the Topbar.
export const CHANGELOG: ChangelogEntry[] = [
  {
    id: "analytics-debt-strategy",
    date: "2026-08-25",
    title: { en: "Debt payoff planner", ms: "Perancang pelunasan hutang" },
    description: {
      en: "Analytics now shows an Avalanche vs Snowball payoff plan for your debts — priority order, months to debt-free, and total interest.",
      ms: "Analitik kini tunjukkan pelan pelunasan Avalanche vs Snowball untuk hutang anda — susunan keutamaan, bulan ke bebas hutang, dan jumlah faedah.",
    },
  },
  {
    id: "calendar-interactive",
    date: "2026-08-22",
    title: { en: "Clickable calendar", ms: "Kalendar boleh diklik" },
    description: {
      en: "Tap any day to add a bill or reminder note, or open an existing bill to adjust it.",
      ms: "Ketik mana-mana hari untuk tambah bil atau nota peringatan, atau buka bil sedia ada untuk ubah suai.",
    },
  },
  {
    id: "receipt-scan-import",
    date: "2026-08-19",
    title: { en: "Scan or import receipts", ms: "Imbas atau import resit" },
    description: {
      en: "Snap a photo or import a file/PDF of a receipt or invoice, and Paybill reads the details into a new bill automatically.",
      ms: "Ambil gambar atau import fail/PDF resit atau invois, dan Paybill akan baca butirannya terus ke dalam bil baharu.",
    },
  },
  {
    id: "pwa-install",
    date: "2026-08-18",
    title: { en: "Install as an app", ms: "Pasang sebagai aplikasi" },
    description: {
      en: "Paybill can now be added to your home screen on phone, tablet, or laptop, and the interface loads even offline.",
      ms: "Paybill kini boleh ditambah ke skrin utama telefon, tablet, atau laptop anda, dan antara muka boleh dimuatkan walaupun luar talian.",
    },
  },
];
