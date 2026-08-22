import type { ScanConfig, ScannedReceipt } from "@/types";

/**
 * Sends a receipt/invoice photo to the companion Laravel backend's
 * /api/scan-receipt endpoint (see
 * wasender-backend-laravel/app/Http/Controllers/Api/ScanReceiptController.php),
 * which forwards it to Claude's vision API server-side and returns
 * structured fields to prefill a bill from.
 *
 * Reuses the same bearer token as Cloud Sync (SyncConfig.token) rather than
 * a separate secret — both endpoints are protected by the same
 * APP_ACCESS_TOKEN on the backend.
 */
export async function scanReceipt(
  file: File,
  config: ScanConfig,
  token: string
): Promise<ScannedReceipt> {
  const body = new FormData();
  body.append("image", file);

  const res = await fetch(config.url, {
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
