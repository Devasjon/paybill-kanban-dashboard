import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useI18n } from "@/lib/i18n";

/**
 * Shared 6-digit code field for OtpVerify and ResetPassword — a single
 * numeric input rather than a segmented widget, matching this project's
 * plain-Input convention (see DebtFormModal.tsx).
 */
export function OtpCodeInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const { t } = useI18n();

  return (
    <div className="grid gap-1.5">
      <Label htmlFor="otp-code">{t("fieldOtpCode")}</Label>
      <Input
        id="otp-code"
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder={t("fieldOtpCodePlaceholder")}
        value={value}
        onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 6))}
        className="text-center text-lg tracking-[0.3em] font-semibold"
      />
    </div>
  );
}
