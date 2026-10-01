"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { Logo } from "@/components/marketing/logo";

/** Not a prototype screen: laid out like /login. The answer is the same whether or not the address has an account. */
export function ForgotPasswordForm() {
  const { t } = useI18n();
  const auth = t.auth;
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/v1/auth/request-password-reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, redirectTo: `${window.location.origin}/reset-password` }),
      });
      if (!res.ok) {
        setError(auth.emailUnavailable);
        return;
      }
      setSent(true);
    } catch {
      setError(auth.emailUnavailable);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass fade-up w-full max-w-[380px] p-6">
      <Link href="/">
        <Logo />
      </Link>
      <p className="mt-1.5 text-[12.5px] text-ash">{auth.forgotTitle}</p>

      {sent ? (
        <p className="mt-6 text-[12.5px] leading-relaxed text-emerald-300">{auth.forgotSent}</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3.5">
          <p className="text-[11.5px] leading-relaxed text-ash/80">{auth.forgotIntro}</p>
          <div>
            <label className="block text-[11.5px] text-ash" htmlFor="email">
              {auth.email}
            </label>
            <input
              id="email"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
            />
          </div>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-[13px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {auth.forgotSubmit}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-[12px] text-ash">
        <Link href="/login" className="text-ivory/85 transition hover:text-gold-pale">
          {auth.backToLogin}
        </Link>
      </p>
    </div>
  );
}
