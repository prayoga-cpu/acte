import { ForgotPasswordForm } from "./forgot-password-form";
import { LocaleToggleButton } from "@/components/locale-toggle-button";

export default function ForgotPasswordPage() {
  return (
    <main className="relative flex h-[100dvh] items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <LocaleToggleButton />
      </div>
      <ForgotPasswordForm />
    </main>
  );
}
