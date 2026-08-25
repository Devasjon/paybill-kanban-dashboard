import { useState } from "react";
import { Loader2 } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { register } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function Register({
  onRegistered,
  onGoToLogin,
}: {
  onRegistered: (email: string) => void;
  onGoToLogin: () => void;
}) {
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const passwordsMismatch = passwordConfirmation.length > 0 && password !== passwordConfirmation;
  const canSubmit = name.trim() && email.trim() && password.length >= 8 && password === passwordConfirmation;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setLoading(true);
    setError(null);
    try {
      await register(name.trim(), email.trim(), password, passwordConfirmation);
      onRegistered(email.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : t("authGenericError"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <h2 className="text-2xl font-semibold">{t("authRegisterTitle")}</h2>
        <p className="text-sm text-muted-foreground mt-1">{t("authRegisterSubtitle")}</p>
      </div>

      <div className="grid gap-3.5">
        <div className="grid gap-1.5">
          <Label htmlFor="register-name">{t("fieldName")}</Label>
          <Input
            id="register-name"
            autoComplete="name"
            placeholder={t("fieldNamePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="register-email">{t("fieldEmail")}</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            placeholder={t("fieldEmailPlaceholder")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="register-password">{t("fieldPassword")}</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p className="text-[11px] text-muted-foreground">{t("fieldPasswordHint")}</p>
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="register-password-confirm">{t("fieldPasswordConfirm")}</Label>
          <Input
            id="register-password-confirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirmation}
            onChange={(e) => setPasswordConfirmation(e.target.value)}
          />
          {passwordsMismatch && <p className="text-[11px] text-red-600">{t("authPasswordsMismatch")}</p>}
        </div>
      </div>

      {error && <p className="text-xs text-red-600">{error}</p>}

      <Button
        type="submit"
        disabled={loading || !canSubmit}
        className="w-full rounded-full h-11 bg-[#17171d] hover:bg-[#26262f] gap-2"
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {t("authRegisterButton")}
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        {t("authHaveAccount")}{" "}
        <button type="button" onClick={onGoToLogin} className="font-medium text-foreground hover:underline">
          {t("authLoginLink")}
        </button>
      </p>
    </form>
  );
}
