"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { Logo } from "@/components/marketing/logo";

export function ResetPasswordForm({ token }: { token: string | null }) {
  const { t } = useI18n();
  const auth = t.auth;
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : auth.resetInvalid);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/v1/auth/reset-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ newPassword: password, token }),
      });
      if (!res.ok) {
        setError(auth.resetInvalid);
        return;
      }
      setDone(true);
    } catch {
      setError(auth.resetInvalid);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass fade-up w-full max-w-[380px] p-6">
      <Link href="/">
        <Logo />
      </Link>
      <p className="mt-1.5 text-[12.5px] text-ash">{auth.resetTitle}</p>

      {done ? (
        <p className="mt-6 text-[12.5px] leading-relaxed text-emerald-300">{auth.resetDone}</p>
      ) : (
        <form onSubmit={submit} className="mt-6 space-y-3.5">
          <div>
            <label className="block text-[11.5px] text-ash" htmlFor="new-password">
              {auth.newPassword}
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              disabled={!token}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40 disabled:opacity-60"
            />
          </div>
          {error && <p className="text-[12px] text-red-400">{error}</p>}
          <button
            type="submit"
            disabled={busy || !token}
            className="w-full rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-[13px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
          >
            {auth.resetSubmit}
          </button>
        </form>
      )}

      <p className="mt-5 text-center text-[12px] text-ash">
        <Link href={done || !token ? "/login" : "/forgot-password"} className="text-ivory/85 transition hover:text-gold-pale">
          {done || !token ? auth.backToLogin : auth.forgotRetry}
        </Link>
      </p>
    </div>
  );
}
