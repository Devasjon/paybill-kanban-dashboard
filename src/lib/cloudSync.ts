import type { AppData } from "@/types";

/**
 * Cloud sync against the companion Laravel backend's /api/state endpoint
 * (see wasender-backend-laravel/app/Http/Controllers/Api/AppStateController.php).
 *
 * Every logged-in user shares the one backend at VITE_API_BASE_URL,
 * authenticated with their own session token — there's no per-user URL to
 * configure (see src/lib/auth.ts for where that token comes from).
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;

export type CloudState = Omit<AppData, "lang"> & { lang?: AppData["lang"] };

interface FetchStateResult {
  data: CloudState | null;
  updatedAt: string | null;
}

export async function fetchCloudState(token: string): Promise<FetchStateResult> {
  const res = await fetch(`${API_BASE}/api/state`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Sync fetch failed: HTTP ${res.status} ${detail}`.trim());
  }

  return (await res.json()) as FetchStateResult;
}

export async function pushCloudState(token: string, data: CloudState): Promise<string | null> {
  const res = await fetch(`${API_BASE}/api/state`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
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
