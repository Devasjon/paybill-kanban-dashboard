import type { ScannedReceipt } from "@/types";

/**
 * Sends a receipt/invoice photo to the companion Laravel backend's
 * /api/scan-receipt endpoint (see
 * wasender-backend-laravel/app/Http/Controllers/Api/ScanReceiptController.php),
 * which forwards it to Claude's vision API server-side and returns
 * structured fields to prefill a bill from.
 *
 * Reuses the logged-in user's session token (see src/lib/auth.ts) — every
 * user shares the one backend at VITE_API_BASE_URL.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export async function scanReceipt(file: File, token: string): Promise<ScannedReceipt> {
  const body = new FormData();
  body.append("image", file);

  const res = await fetch(`${API_BASE}/api/scan-receipt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body,
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const detail = json?.error ?? `HTTP ${res.status}`;
    throw new Error(detail);
  }

  return json.data as ScannedReceipt;
}
