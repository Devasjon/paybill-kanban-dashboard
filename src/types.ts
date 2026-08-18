export type Lang = "en" | "ms";

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
  backendUrl: string; // e.g. https://your-deploy.vercel.app/api/send-whatsapp
  defaultNumber: string; // E.164
  enabled: boolean;
}

export interface SyncConfig {
  url: string; // e.g. https://your-domain.com/api/state
  token: string; // bearer token, matches APP_ACCESS_TOKEN on the backend
  enabled: boolean;
}

export type SyncStatus = "idle" | "syncing" | "synced" | "error";

export interface AppData {
  bills: Bill[];
  debts: Debt[];
  lang: Lang;
  whatsapp: WhatsAppConfig;
  notificationLog: NotificationLogEntry[];
  extraDebtPayment: number;
}
