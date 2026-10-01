import { ResetPasswordForm } from "./reset-password-form";
import { LocaleToggleButton } from "@/components/locale-toggle-button";

/** The emailed reset link lands here with `?token=…`, or `?error=…` when the link is no longer valid. */
export default async function ResetPasswordPage({ searchParams }: { searchParams: Promise<{ token?: string; error?: string }> }) {
  const { token, error } = await searchParams;
  return (
    <main className="relative flex h-[100dvh] items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <LocaleToggleButton />
      </div>
      <ResetPasswordForm token={error ? null : (token ?? null)} />
    </main>
  );
}
