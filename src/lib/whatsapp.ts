import type { Bill, Lang, NotificationEvent, NotificationLogEntry, WhatsAppConfig } from "@/types";
import { formatRM } from "@/lib/bills";

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

const messageTemplates: Record<NotificationEvent, Record<Lang, (bill: Bill) => string>> = {
  billAdded: {
    en: (b) => `New bill added: ${b.name} (${formatRM(b.amount)}), due ${b.dueDate}. You'll get a reminder before it's due.`,
    ms: (b) => `Bil baharu ditambah: ${b.name} (${formatRM(b.amount)}), tamat tempoh ${b.dueDate}. Anda akan terima peringatan sebelum tarikh tamat.`,
  },
  billDueSoon: {
    en: (b) => `Reminder: ${b.name} (${formatRM(b.amount)}) is due soon on ${b.dueDate}.`,
    ms: (b) => `Peringatan: ${b.name} (${formatRM(b.amount)}) akan tamat tempoh pada ${b.dueDate}.`,
  },
  billOverdue: {
    en: (b) => `Overdue: ${b.name} (${formatRM(b.amount)}) was due ${b.dueDate}. Please settle it soon to avoid late charges.`,
    ms: (b) => `Tertunggak: ${b.name} (${formatRM(b.amount)}) sepatutnya dibayar pada ${b.dueDate}. Sila selesaikan segera untuk elak caj lewat.`,
  },
  billPaid: {
    en: (b) => `Paid: ${b.name} (${formatRM(b.amount)}) has been marked as paid. Nice work staying on top of it!`,
    ms: (b) => `Dibayar: ${b.name} (${formatRM(b.amount)}) telah ditandakan dibayar. Bagus, kekal teratur!`,
  },
};

export function buildWhatsAppMessage(event: NotificationEvent, bill: Bill, lang: Lang): string {
  return messageTemplates[event][lang](bill);
}

/**
 * Sends (or attempts to send) a WhatsApp notification for a bill status event.
 *
 * IMPORTANT: this never calls WasenderAPI directly from the browser — the
 * Session API Key is a secret and must live server-side. Instead this posts
 * to the companion Laravel backend's /api/send-whatsapp endpoint (see
 * wasender-backend-laravel/app/Http/Controllers/Api/SendWhatsAppController.php),
 * authenticated with the logged-in user's session token. If notifications
 * aren't enabled, the notification is logged as "skipped" so the trigger
 * logic is still fully visible/testable.
 */
export async function sendWhatsAppNotification(
  event: NotificationEvent,
  bill: Bill,
  config: WhatsAppConfig,
  lang: Lang,
  token: string
): Promise<NotificationLogEntry> {
  const message = buildWhatsAppMessage(event, bill, lang);
  const to = bill.whatsappNumber || config.defaultNumber;
  const base: Omit<NotificationLogEntry, "status" | "detail"> = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    event,
    billName: bill.name,
    message,
    to,
  };

  if (!config.enabled || !to) {
    return {
      ...base,
      status: "skipped_no_backend",
      detail: !config.enabled ? "WhatsApp notifications disabled in Settings" : "No WhatsApp number configured",
    };
  }

  try {
    const res = await fetch(`${API_BASE}/api/send-whatsapp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ to, text: message, event, billName: bill.name }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return { ...base, status: "failed", detail: `HTTP ${res.status} ${text}`.trim() };
    }
    return { ...base, status: "sent" };
  } catch (err) {
    return {
      ...base,
      status: "failed",
      detail: err instanceof Error ? err.message : "Network error calling backend",
    };
  }
}
