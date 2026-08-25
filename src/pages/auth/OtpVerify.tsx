import { useState } from "react";
import { Loader2 } from "lucide-react";
import type { AuthUser } from "@/types";
import { useI18n } from "@/lib/i18n";
import { verifyRegistrationOtp, resendOtp } from "@/lib/auth";
import { OtpCodeInput } from "@/components/auth/OtpCodeInput";
import { Button } from "@/components/ui/button";

export function OtpVerify({
  email,
  onAuthenticated,
  onGoToLogin,
}: {
  email: string;
  onAuthenticated: (token: string, user: AuthUser) => void;
  onGoToLogin: () => void;
}) {
  const { t } = useI18n();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.length !== 6) return;
    setLoading(true);
    setError(null);
    try {
      const result = await verifyRegistrationOtp(email, code);
      onAuthenticated(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authOtpInvalid"));
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    setResending(true);
    setError(null);
    setResent(false);
    try {
      await resendOtp(email);
      setResent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authGenericError"));
    } finally {
      setResending(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{t("authOtpTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("authOtpSubtitle", { email })}</p>
      </div>

      <OtpCodeInput value={code} onChange={setCode} />

      {error && <p className="text-xs text-red-600">{error}</p>}
      {resent && !error && <p className="text-xs text-green-600">{t("authOtpResent")}</p>}

      <Button
        type="submit"
        disabled={loading || code.length !== 6}
        className="w-full rounded-full h-11 bg-[#17171d] hover:bg-[#26262f] gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("authOtpButton")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("authOtpDidntGetIt")}{" "}
        <button
          type="button"
          onClick={handleResend}
          disabled={resending}
          className="font-medium text-foreground hover:underline disabled:opacity-50"
        >
          {resending ? t("authOtpResending") : t("authOtpResendLink")}
        </button>
      </p>

      <p className="text-center text-sm text-muted-foreground">
        <button type="button" onClick={onGoToLogin} className="font-medium text-foreground hover:underline">
          {t("authBackToLogin")}
        </button>
      </p>
    </form>
  );
}
