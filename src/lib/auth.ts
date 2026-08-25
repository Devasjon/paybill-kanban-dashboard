import type { AuthUser } from "@/types";

/**
 * Talks to the companion Laravel backend's /api/auth/* endpoints (see
 * wasender-backend-laravel/app/Http/Controllers/Api/Auth/*) — registration,
 * OTP verification, login, logout, and password reset. Plain fetch, same
 * style as cloudSync.ts and receiptScan.ts, not a library.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL as string | undefined;
const TOKEN_KEY = "paybill_auth_token";

export class AuthError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function apiBase(): string {
  if (!API_BASE) {
    throw new Error("VITE_API_BASE_URL is not configured — see .env.example.");
  }
  return API_BASE;
}

async function post<T>(path: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok) {
    const message = json?.message ?? json?.error ?? `HTTP ${res.status}`;
    throw new AuthError(message, res.status);
  }

  return json as T;
}

export interface LoginResult {
  ok: true;
  token: string;
  user: AuthUser;
}

export function register(name: string, email: string, password: string, passwordConfirmation: string) {
  return post<{ ok: true; message: string }>("/api/auth/register", {
    name,
    email,
    password,
    password_confirmation: passwordConfirmation,
  });
}

export function verifyRegistrationOtp(email: string, code: string) {
  return post<LoginResult>("/api/auth/verify-otp", { email, code });
}

export function resendOtp(email: string) {
  return post<{ ok: true; message: string }>("/api/auth/resend-otp", { email });
}

export function login(email: string, password: string) {
  return post<LoginResult>("/api/auth/login", { email, password });
}

export function forgotPassword(email: string) {
  return post<{ ok: true; message: string }>("/api/auth/forgot-password", { email });
}

export function resetPassword(email: string, code: string, password: string, passwordConfirmation: string) {
  return post<{ ok: true }>("/api/auth/reset-password", {
    email,
    code,
    password,
    password_confirmation: passwordConfirmation,
  });
}

export async function logout(token: string): Promise<void> {
  await post<{ ok: true }>("/api/auth/logout", {}, token);
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${apiBase()}/api/auth/me`, {
    headers: { Accept: "application/json", Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new AuthError("Session expired", res.status);
  }

  const json = (await res.json()) as { user: AuthUser };
  return json.user;
}

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function storeToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}
