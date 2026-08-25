import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { forgotPassword } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ForgotPassword({
  onCodeSent,
  onGoToLogin,
}: {
  onCodeSent: (email: string) => void;
  onGoToLogin: () => void;
}) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError(null);
    try {
      await forgotPassword(email.trim());
      onCodeSent(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authGenericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{t("authForgotTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("authForgotSubtitle")}</p>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="forgot-email">{t("fieldEmail")}</Label>
        <Input
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder={t("fieldEmailPlaceholder")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !email.trim()}
        className="w-full rounded-full h-11 bg-[#17171d] hover:bg-[#26262f] gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("authForgotButton")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <button type="button" onClick={onGoToLogin} className="font-medium text-foreground hover:underline">
          {t("authBackToLogin")}
        </button>
      </p>
    </form>
  );
}
