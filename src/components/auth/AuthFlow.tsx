import { useState } from "react";
import type { AuthUser } from "@/types";
import { AuthLayout } from "@/components/auth/AuthLayout";
import { Login } from "@/pages/auth/Login";
import { Register } from "@/pages/auth/Register";
import { OtpVerify } from "@/pages/auth/OtpVerify";
import { ForgotPassword } from "@/pages/auth/ForgotPassword";
import { ResetPassword } from "@/pages/auth/ResetPassword";

type AuthScreen = "login" | "register" | "verify-otp" | "forgot-password" | "reset-password";

/**
 * Local screen-switch state, matching App.tsx's own Page-string-switch
 * style — there's no router in this project and five screens doesn't need
 * one. Rendered by AuthGate (src/App.tsx) whenever there's no valid session.
 */
export function AuthFlow({ onAuthenticated }: { onAuthenticated: (token: string, user: AuthUser) => void }) {
  const [screen, setScreen] = useState<AuthScreen>("login");
  const [pendingEmail, setPendingEmail] = useState("");

  return (
    <AuthLayout>
      {screen === "login" && (
        <Login
          onAuthenticated={onAuthenticated}
          onGoToRegister={() => setScreen("register")}
          onGoToForgotPassword={() => setScreen("forgot-password")}
        />
      )}
      {screen === "register" && (
        <Register
          onRegistered={(email) => {
            setPendingEmail(email);
            setScreen("verify-otp");
          }}
          onGoToLogin={() => setScreen("login")}
        />
      )}
      {screen === "verify-otp" && (
        <OtpVerify email={pendingEmail} onAuthenticated={onAuthenticated} onGoToLogin={() => setScreen("login")} />
      )}
      {screen === "forgot-password" && (
        <ForgotPassword
          onCodeSent={(email) => {
            setPendingEmail(email);
            setScreen("reset-password");
          }}
          onGoToLogin={() => setScreen("login")}
        />
      )}
      {screen === "reset-password" && (
        <ResetPassword email={pendingEmail} onDone={() => setScreen("login")} onGoToLogin={() => setScreen("login")} />
      )}
    </AuthLayout>
  );
}
