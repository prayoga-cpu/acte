import { SignupForm } from "./signup-form";
import { LocaleToggleButton } from "@/components/locale-toggle-button";

export default function SignupPage() {
  return (
    <main className="relative flex h-[100dvh] items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <LocaleToggleButton />
      </div>
      <SignupForm />
    </main>
  );
}
