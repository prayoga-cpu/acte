"use client";

import { useEffect, useState } from "react";
import type { Member, SourceSettings, TaskSource } from "@acte/contracts";
import { fmtEurFromCents } from "@/lib/format";
import { api } from "@/lib/api-client";
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
export function SettingsView({ member, onToast }: { member: Member; onToast: (message: string) => void }) {
  const { t } = useI18n();
  const [sourcesOn, setSourcesOn] = useState<SourceSettings>(DEFAULT_SOURCES);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api
      .get<SourceSettings>("/v1/me/sources")
      .then((s) => setSourcesOn({ ...DEFAULT_SOURCES, ...s }))
      .finally(() => setLoaded(true));
  }, []);

  const toggle = async (src: Exclude<TaskSource, "manual">, checked: boolean) => {
    const next = { ...sourcesOn, [src]: checked };
    setSourcesOn(next);
    try {
      await api.patch<SourceSettings>("/v1/me/sources", next);
      onToast(`${sourceCopy(t, src).name} ${checked ? t.settingsView.reactivated : t.settingsView.suspended}`);
    } catch {
      setSourcesOn(sourcesOn);
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
        <section className="glass fade-up p-5">
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

        <section className="glass fade-up p-5">
          <p className="eyebrow">{t.settingsView.hourlyRateTitle}</p>
          <p className="mt-2 font-mono text-[22px] text-ivory">{fmtEurFromCents(member.hourlyRateCents)} / h</p>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ash">{t.settingsView.hourlyRateNote}</p>
        </section>

        <section className="glass fade-up p-5 md:col-span-2">
          <p className="eyebrow">{t.settingsView.privacyTitle}</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ivory/85">{t.settingsView.privacyBody}</p>
        </section>
      </div>
    </div>
  );
}
