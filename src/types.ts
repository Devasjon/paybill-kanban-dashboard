export type Lang = "en" | "ms";

export interface AuthUser {
  id: number;
  name: string;
  email: string;
}

export type BillCategory =
  | "utilities"
  | "housing"
  | "creditCard"
  | "subscription"
  | "insurance"
  | "loan"
  | "other";

export type BillStatus = "upcoming" | "dueSoon" | "overdue" | "paid";

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO yyyy-mm-dd
  category: BillCategory;
  recurring: boolean;
  paid: boolean;
  whatsappNumber?: string;
  // Set only on the auto-generated monthly minimum-payment bill for a Debt
  // (see App.tsx's syncDebtMinPaymentBill) — links this Bill back to the
  // Debt it was generated from, so paying it here can reduce that Debt's
  // balance too, and so debt edits keep the bill's amount in sync.
  debtId?: string;
}

export type DebtType =
  | "creditCard"
  | "studyLoan"
  | "personalLoan"
  | "carLoan"
  | "housingLoan"
  | "other";

export interface Debt {
  id: string;
  name: string;
  type: DebtType;
  originalAmount: number;
  currentBalance: number;
  apr?: number;
  minPayment?: number;
  // Credit card balance transfer package details (type === "creditCard" only).
  isBalanceTransfer?: boolean;
  balanceTransferMonths?: number;
  balanceTransferAmount?: number; // baki balance transfer
  balanceTransferEndDate?: string; // ISO yyyy-mm-dd — bila tamat pakej
}

export type NotificationEvent = "billAdded" | "billDueSoon" | "billOverdue" | "billPaid";

export interface NotificationLogEntry {
  id: string;
  timestamp: string; // ISO
  event: NotificationEvent;
  billName: string;
  message: string;
  to: string;
  status: "sent" | "failed" | "skipped_no_backend";
  detail?: string;
}

export interface WhatsAppConfig {
  defaultNumber: string; // E.164
  enabled: boolean;
  // No backendUrl field — every logged-in user shares the one backend at
  // VITE_API_BASE_URL, authenticated with their own session token (see
  // src/lib/whatsapp.ts).
}

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface ScanConfig {
  enabled: boolean;
  // No url/token fields — same reasoning as WhatsAppConfig above (see
  // src/lib/receiptScan.ts).
}

export interface ScannedReceipt {
  merchant: string;
  amount: number;
  date: string | null; // ISO yyyy-mm-dd
  category: BillCategory;
  isPaid: boolean;
}

export interface CalendarNote {
  id: string;
  date: string; // ISO yyyy-mm-dd
  text: string;
}

export type DebtStrategy = "avalanche" | "snowball";

export type Theme = "light" | "dark";

export type DebtColorScheme = "pinkPurple" | "blueGreen";

export interface DebtPayment {
  id: string;
  debtId: string;
  date: string; // ISO yyyy-mm-dd
  amount: number;
  description?: string;
}

export interface AppData {
  bills: Bill[];
  debts: Debt[];
  lang: Lang;
  theme: Theme;
  whatsapp: WhatsAppConfig;
  notificationLog: NotificationLogEntry[];
  extraDebtPayment: number;
  notes: CalendarNote[];
  debtColorScheme: DebtColorScheme;
  debtPayments: DebtPayment[];
}
