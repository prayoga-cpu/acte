"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { InvitationPreview } from "@acte/contracts";
import { useI18n } from "@/i18n/locale-context";
import { Logo } from "@/components/marketing/logo";

const inputClass =
  "mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40";

/**
 * Accepting is token-bound (D-014): the form posts name + password to
 * /v1/invitations/:token/accept, which creates the account for the
 * invitation's own address and joins that firm. The email field is display
 * only — it is never sent.
 */
export function InviteForm({ token, preview }: { token: string; preview: InvitationPreview | null }) {
  const router = useRouter();
  const { t } = useI18n();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!preview) {
    return (
      <div className="glass fade-up w-full max-w-[380px] p-6">
        <Link href="/">
          <Logo />
        </Link>
        <p className="mt-5 font-display text-[16px] font-semibold text-ivory">{t.invitePage.invalidTitle}</p>
        <p className="mt-1.5 text-[12.5px] leading-relaxed text-ash">{t.invitePage.invalidBody}</p>
        <Link href="/login" className="mt-5 inline-block text-[12.5px] text-ivory/85 transition hover:text-gold-pale">
          {t.auth.backToLogin}
        </Link>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch(`/v1/invitations/${encodeURIComponent(token)}/accept`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, password }),
      });
      if (!res.ok) {
        const code = ((await res.json().catch(() => null)) as { error?: { code?: string } } | null)?.error?.code;
        setError(
          code === "account_exists"
            ? t.invitePage.accountExists
            : code === "invitation_not_found"
              ? t.invitePage.invalidBody
              : t.invitePage.acceptError,
        );
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
      <p className="mt-1.5 text-[12.5px] text-ash">{t.invitePage.title}</p>
      <p className="mt-1 text-[11.5px] text-ash/80">{t.invitePage.joining(preview.firmName, t.admin.roles[preview.role])}</p>

      <form onSubmit={submit} className="mt-6 space-y-3.5">
        <div>
          <label className="block text-[11.5px] text-ash" htmlFor="invite-email">
            {t.auth.email}
          </label>
          <input id="invite-email" type="email" value={preview.email} readOnly className={`${inputClass} opacity-70`} />
        </div>

        <div>
          <label className="block text-[11.5px] text-ash" htmlFor="invite-name">
            {t.auth.name}
          </label>
          <input
            id="invite-name"
            type="text"
            required
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-[11.5px] text-ash" htmlFor="invite-password">
            {t.auth.password}
          </label>
          <input
            id="invite-password"
            type="password"
            required
            minLength={8}
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
          />
        </div>

        {error && <p className="text-[12px] text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={busy}
          className="w-full rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-[13px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
        >
          {t.invitePage.submit}
        </button>
      </form>
    </div>
  );
}
