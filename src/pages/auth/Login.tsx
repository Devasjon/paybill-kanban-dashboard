import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { AuthUser } from "@/types";
import { useI18n } from "@/lib/i18n";
import { login, AuthError } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Login({
  onAuthenticated,
  onGoToRegister,
  onGoToForgotPassword,
}: {
  onAuthenticated: (token: string, user: AuthUser) => void;
  onGoToRegister: () => void;
  onGoToForgotPassword: () => void;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim() || !password) return;
    setLoading(true);
    setError(null);
    try {
      const result = await login(email.trim(), password);
      onAuthenticated(result.token, result.user);
    } catch (err) {
      if (err instanceof AuthError && err.status === 403) {
        setError(t("authEmailNotVerified"));
      } else {
        setError(err instanceof Error ? err.message : t("authGenericError"));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{t("authLoginTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("authLoginSubtitle")}</p>
      </div>

      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="login-email">{t("fieldEmail")}</Label>
          <Input
            id="login-email"
            type="email"
            autoComplete="email"
            placeholder={t("fieldEmailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="login-password">{t("fieldPassword")}</Label>
            <button
              type="button"
              onClick={onGoToForgotPassword}
              className="text-xs font-medium text-muted-foreground hover:text-foreground"
            >
              {t("authForgotPasswordLink")}
            </button>
          </div>
          <Input
            id="login-password"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !email.trim() || !password}
        className="w-full rounded-full h-11 bg-[#17171d] hover:bg-[#26262f] gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("authLoginButton")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("authNoAccount")}{" "}
        <button type="button" onClick={onGoToRegister} className="font-medium text-foreground hover:underline">
          {t("authRegisterLink")}
        </button>
      </p>
    </form>
  );
}
