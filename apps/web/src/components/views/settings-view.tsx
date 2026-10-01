"use client";

import { useState } from "react";
import type { MemberProfile, SourceSettings, TaskSource } from "@acte/contracts";
import { fmtEurFromCents } from "@/lib/format";
import { SourceBadge } from "@/components/journal/source-badge";
import { useI18n, type Dictionary } from "@/i18n/locale-context";

const SOURCE_KEYS: Exclude<TaskSource, "manual">[] = ["word", "outlook", "web"];

function sourceCopy(t: Dictionary, src: Exclude<TaskSource, "manual">): { name: string; desc: string } {
  switch (src) {
    case "word":
      return { name: t.settingsView.wordName, desc: t.settingsView.wordDesc };
    case "outlook":
      return { name: t.settingsView.outlookName, desc: t.settingsView.outlookDesc };
    case "web":
      return { name: t.settingsView.webName, desc: t.settingsView.webDesc };
  }
}

const DEFAULT_SOURCES: SourceSettings = { word: true, outlook: true, web: true };

/**
 * The on/off state persists per member (`GET/PATCH /v1/me/sources`), but
 * nothing acts on it yet — there is no Companion to actually turn a source
 * on or off (stage 4, apps/tracker is gated). This is real preference
 * storage for a feature that isn't built yet, which is why it's honest to
 * call it out rather than pretend a toggle here changes any capture.
 */
export function SettingsView({
  member,
  sources,
  onUpdateSources,
  onUpdatePreferences,
  onToast,
}: {
  member: MemberProfile;
  sources: SourceSettings;
  onUpdateSources: (next: SourceSettings) => Promise<void>;
  onUpdatePreferences: (patch: { alertEmails?: boolean }) => Promise<void>;
  onToast: (message: string) => void;
}) {
  const { t } = useI18n();
  const sourcesOn = { ...DEFAULT_SOURCES, ...sources };
  const loaded = true;

  const toggle = async (src: Exclude<TaskSource, "manual">, checked: boolean) => {
    try {
      await onUpdateSources({ ...sourcesOn, [src]: checked });
      onToast(`${sourceCopy(t, src).name} ${checked ? t.settingsView.reactivated : t.settingsView.suspended}`);
    } catch {
      onToast(t.settingsView.saveError);
    }
  };

  const toggleAlertEmails = async (checked: boolean) => {
    try {
      await onUpdatePreferences({ alertEmails: checked });
      onToast(checked ? t.settingsView.alertEmailsOn : t.settingsView.alertEmailsOff);
    } catch {
      onToast(t.settingsView.saveError);
    }
  };

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-4">
        <p className="eyebrow">{t.settingsView.title}</p>
        <h2 className="mt-1 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-ivory">{t.settingsView.subtitle}</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="glass fade-up p-5" data-tour="settings-sources">
          <p className="eyebrow">{t.settingsView.sourcesTitle}</p>
          <p className="mt-1.5 text-[11px] text-ash">{t.settingsView.sourcesNote}</p>
          <div className="mt-2 divide-y divide-white/[0.05]">
            {SOURCE_KEYS.map((src) => {
              const copy = sourceCopy(t, src);
              return (
                <div key={src} className="flex items-center gap-3 py-2.5">
                  <SourceBadge source={src} size={6} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] text-ivory/90">{copy.name}</p>
                    <p className="text-[11px] text-ash">{copy.desc}</p>
                  </div>
                  <label className="switch">
                    <input
                      type="checkbox"
                      disabled={!loaded}
                      checked={sourcesOn[src] ?? true}
                      onChange={(e) => toggle(src, e.target.checked)}
                    />
                    <span className="slider" />
                  </label>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass fade-up p-5" data-tour="settings-rate">
          <p className="eyebrow">{t.settingsView.hourlyRateTitle}</p>
          <p className="mt-2 font-mono text-[22px] text-ivory">{fmtEurFromCents(member.hourlyRateCents)} / h</p>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ash">{t.settingsView.hourlyRateNote}</p>
        </section>

        {/* Not in the prototype (D-018, D-019): the alert-email opt-out and the password change. */}
        <section className="glass fade-up p-5" data-tour="settings-alerts">
          <p className="eyebrow">{t.settingsView.alertEmailsTitle}</p>
          <div className="mt-2 flex items-center gap-3">
            <p className="min-w-0 flex-1 text-[11.5px] leading-relaxed text-ash">{t.settingsView.alertEmailsNote}</p>
            <label className="switch">
              <input type="checkbox" aria-label={t.settingsView.alertEmailsTitle} checked={member.alertEmails} onChange={(e) => toggleAlertEmails(e.target.checked)} />
              <span className="slider" />
            </label>
          </div>
        </section>

        <ChangePassword onToast={onToast} />

        <section className="glass fade-up p-5 md:col-span-2" data-tour="settings-privacy">
          <p className="eyebrow">{t.settingsView.privacyTitle}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ivory/85">{t.settingsView.privacyBody}</p>
        </section>
      </div>
    </div>
  );
}

/** better-auth's own POST /v1/auth/change-password: needs the current password, and signs out the other sessions. */
function ChangePassword({ onToast }: { onToast: (message: string) => void }) {
  const { t } = useI18n();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (next.length < 8) {
      setError(t.settingsView.passwordTooShort);
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/v1/auth/change-password", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ currentPassword: current, newPassword: next, revokeOtherSessions: true }),
      });
      if (!res.ok) {
        setError(res.status === 400 || res.status === 401 ? t.settingsView.passwordWrong : t.settingsView.saveError);
        return;
      }
      setCurrent("");
      setNext("");
      onToast(t.settingsView.passwordChanged);
    } catch {
      setError(t.settingsView.saveError);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40";

  return (
    <section className="glass fade-up p-5" data-tour="settings-password">
      <p className="eyebrow">{t.settingsView.passwordTitle}</p>
      <form onSubmit={submit} className="mt-2">
        <label className="block text-[11.5px] text-ash" htmlFor="pw-current">
          {t.settingsView.passwordCurrent}
        </label>
        <input id="pw-current" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} className={inputClass} />
        <label className="mt-3 block text-[11.5px] text-ash" htmlFor="pw-new">
          {t.settingsView.passwordNew}
        </label>
        <input id="pw-new" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} className={inputClass} />
        {error && <p className="mt-2 text-[11.5px] text-red-400">{error}</p>}
        <button
          type="submit"
          disabled={saving || !current || !next}
          className="mt-3 rounded-full border border-gold/35 bg-gold/10 px-3.5 py-1.5 text-[12px] font-semibold text-gold-pale transition hover:bg-gold/[0.18] disabled:opacity-60"
        >
          {t.settingsView.passwordSubmit}
        </button>
      </form>
    </section>
  );
}
