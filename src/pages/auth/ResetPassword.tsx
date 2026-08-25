import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { resetPassword } from "@/lib/auth";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ResetPassword({
  email,
  onDone,
  onGoToLogin,
}: {
  email: string;
  onDone: () => void;
  onGoToLogin: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = code.length === 6 && password.length >= 8 && password === passwordConfirmation;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await resetPassword(email, code, password, passwordConfirmation);
      toast.success(t("authResetSuccessToast"));
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authOtpInvalid"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{t("authResetTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("authOtpSubtitle", { email })}</p>
      </div>

      <div className="grid gap-3.5">
        <OtpCodeInput value={code} onChange={setCode} />
        <div className="grid gap-1.5">
          <Label htmlFor="reset-password">{t("fieldNewPassword")}</Label>
          <Input
            id="reset-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">{t("fieldPasswordHint")}</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="reset-password-confirm">{t("fieldPasswordConfirm")}</Label>
          <Input
            id="reset-password-confirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full rounded-full h-11 bg-[#17171d] hover:bg-[#26262f] gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("authResetButton")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <button type="button" onClick={onGoToLogin} className="font-medium text-foreground hover:underline">
          {t("authBackToLogin")}
        </button>
      </p>
    </form>
  );
}
