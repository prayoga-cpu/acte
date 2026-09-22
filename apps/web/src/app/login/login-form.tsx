"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { fr } from "@/i18n/fr";

export function LoginForm() {
  const router = useRouter();
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
        setError(fr.auth.error);
        return;
      }
      router.push("/");
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
        setError(fr.auth.error);
        return;
      }
      setNotice(fr.auth.magicLinkSent);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass fade-up w-full max-w-[380px] p-6">
      <h1 className="flex items-baseline font-display text-[22px] font-extrabold uppercase leading-none tracking-[0.01em] text-ivory">
        ACT
        <span className="relative pr-1.5">
          E
          <svg className="absolute -right-1 -top-2 h-[15px] w-[15px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="square">
            <path d="M4 13l5 5L20 6" />
          </svg>
        </span>
        <span className="-ml-1">.</span>
      </h1>
      <p className="mt-1.5 text-[12.5px] text-ash">{fr.auth.subtitle}</p>

      <form onSubmit={mode === "password" ? submitPassword : submitMagicLink} className="mt-6 space-y-3.5">
        <div>
          <label className="block text-[11.5px] text-ash" htmlFor="email">
            {fr.auth.email}
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
              {fr.auth.password}
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
          {mode === "password" ? fr.auth.signIn : fr.auth.magicLink}
        </button>
      </form>

      <div className="mt-4 flex items-center gap-3 text-[11px] text-ash">
        <div className="h-px flex-1 bg-white/[0.08]" />
        {fr.auth.orDivider}
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
        {mode === "password" ? fr.auth.magicLink : fr.auth.signIn}
      </button>
    </div>
  );
}
