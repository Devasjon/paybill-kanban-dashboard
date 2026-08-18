import type { AppData, SyncConfig } from "@/types";

/**
 * Cloud sync against the companion Laravel backend's /api/state endpoint
 * (see wasender-backend-laravel/app/Http/Controllers/Api/AppStateController.php).
 *
 * The sync config itself (url/token) is deliberately NOT part of the synced
 * AppData blob — it has to be entered manually on each device first (you
 * need to know where to fetch from before you can fetch anything), so it
 * stays local to each device/browser, same as before for WhatsApp settings.
 *
 * Like whatsapp.ts, this never assumes a specific backend is deployed: if
 * sync isn't enabled/configured, callers should just skip calling these.
 */

export type CloudState = Omit<AppData, "lang"> & { lang?: AppData["lang"] };

interface FetchStateResult {
  data: CloudState | null;
  updatedAt: string | null;
}

export async function fetchCloudState(config: SyncConfig): Promise<FetchStateResult> {
  const res = await fetch(config.url, {
    method: "GET",
    headers: { Authorization: `Bearer ${config.token}` },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Sync fetch failed: HTTP ${res.status} ${detail}`.trim());
  }

  return (await res.json()) as FetchStateResult;
}

export async function pushCloudState(config: SyncConfig, data: CloudState): Promise<string | null> {
  const res = await fetch(config.url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${config.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ data }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Sync push failed: HTTP ${res.status} ${detail}`.trim());
  }

  const body = (await res.json()) as { ok: boolean; updatedAt: string | null };
  return body.updatedAt ?? null;
}
