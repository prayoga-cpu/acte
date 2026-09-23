"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { Logo } from "@/components/marketing/logo";

export function SignupForm() {
  const router = useRouter();
  const { t } = useI18n();
  const auth = t.auth;
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/v1/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      if (!res.ok) {
        setError(auth.signUpError);
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="glass fade-up w-full max-w-[380px] p-6">
      <Link href="/">
        <Logo />
      </Link>
      <p className="mt-1.5 text-[12.5px] text-ash">{auth.signUpTitle}</p>
      <p className="mt-1 text-[11.5px] text-ash/80">{auth.signUpSubtitle}</p>

      <form onSubmit={submit} className="mt-6 space-y-3.5">
        <div>
          <label className="block text-[11.5px] text-ash" htmlFor="name">
            {auth.name}
          </label>
          <input
            id="name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
          />
        </div>

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

        <div>
          <label className="block text-[11.5px] text-ash" htmlFor="password">
            {auth.password}
          </label>
          <input
            id="password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
          />
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-[13px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {auth.signUpSubmit}
        </button>
      </form>

      <p className="mt-5 text-center text-[12px] text-ash">
        {auth.haveAccount}{" "}
        <Link href="/login" className="text-ivory/85 transition hover:text-gold-pale">
          {auth.backToLogin}
        </Link>
      </p>
    </div>
  );
}
