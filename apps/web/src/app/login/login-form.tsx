"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { Logo } from "@/components/marketing/logo";

export function LoginForm() {
  const router = useRouter();
  const { t } = useI18n();
  const auth = t.auth;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"password" | "magic-link">("password");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submitPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/v1/auth/sign-in/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      if (!res.ok) {
        const code = ((await res.json().catch(() => null)) as { code?: string } | null)?.code;
        setError(code === "MEMBER_SUSPENDED" ? auth.suspended : auth.error);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  const submitMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/v1/auth/sign-in/magic-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        setError(auth.error);
        return;
      }
      setNotice(auth.magicLinkSent);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass fade-up w-full max-w-[380px] p-6">
      <Link href="/">
        <Logo />
      </Link>
      <p className="mt-1.5 text-[12.5px] text-ash">{auth.subtitle}</p>

      <form onSubmit={mode === "password" ? submitPassword : submitMagicLink} className="mt-6 space-y-3.5">
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

        {mode === "password" && (
          <div>
            <label className="block text-[11.5px] text-ash" htmlFor="password">
              {auth.password}
            </label>
            <input
              id="password"
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
            />
          </div>
        )}

        {error && <p className="text-[12px] text-red-400">{error}</p>}
        {notice && <p className="text-[12px] text-emerald-300">{notice}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-[13px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {mode === "password" ? auth.signIn : auth.magicLink}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-[11px] text-ash">
        <div className="h-px flex-1 bg-white/[0.08]" />
        {auth.orDivider}
        <div className="h-px flex-1 bg-white/[0.08]" />
      </div>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "password" ? "magic-link" : "password");
          setError(null);
          setNotice(null);
        }}
        className="mt-4 w-full rounded-full border border-white/[0.12] px-4 py-2 text-[12.5px] text-ivory/80 transition hover:border-gold/35 hover:text-gold-pale"
      >
        {mode === "password" ? auth.magicLink : auth.signIn}
      </button>

      <p className="mt-5 text-center text-[12px] text-ash">
        {auth.noAccount}{" "}
        <Link href="/signup" className="text-ivory/85 transition hover:text-gold-pale">
          {auth.createAccount}
        </Link>
      </p>
    </div>
  );
}
