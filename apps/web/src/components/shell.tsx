"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { DossierStatus } from "@acte/contracts";
import { fr } from "@/i18n/fr";
import { isLightMode, setThemeLight } from "@/lib/theme";
import { useOutsideClick } from "@/lib/use-outside-click";
import { useDashboard, type DashboardInitialData } from "@/lib/use-dashboard";
import { HomeView } from "@/components/views/home-view";
import { JournalView } from "@/components/views/journal-view";
import { DossiersView } from "@/components/views/dossiers-view";
import { StatsView } from "@/components/views/stats-view";
import { BillingView } from "@/components/views/billing-view";
import { ProfileView } from "@/components/views/profile-view";
import { CloudView } from "@/components/views/cloud-view";
import { SettingsView } from "@/components/views/settings-view";
import { BrainPanel } from "@/components/brain-panel";
import { Toast } from "@/components/toast";

type View = "home" | "journal" | "dossiers" | "stats" | "billing" | "profile" | "cloud" | "settings";

const RAIL_ITEMS: { view: View; label: string; icon: React.ReactNode }[] = [
  {
    view: "journal",
    label: fr.nav.journal,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
        <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
      </svg>
    ),
  },
  {
    view: "dossiers",
    label: fr.nav.dossiers,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
      </svg>
    ),
  },
  {
    view: "stats",
    label: fr.nav.stats,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" x2="12" y1="20" y2="10" />
        <line x1="18" x2="18" y1="20" y2="4" />
        <line x1="6" x2="6" y1="20" y2="16" />
      </svg>
    ),
  },
  {
    view: "cloud",
    label: fr.nav.cloud,
    icon: (
      <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
      </svg>
    ),
  },
];

export function Shell({ initial, complianceClaimsEnabled }: { initial: DashboardInitialData; complianceClaimsEnabled: boolean }) {
  const router = useRouter();
  const d = useDashboard(initial);
  const [view, setView] = useState<View>("home");
  const [isLight, setIsLight] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [brainOpen, setBrainOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(profileMenuRef, () => setProfileMenuOpen(false), profileMenuOpen);

  useEffect(() => {
    setIsLight(isLightMode());
  }, []);

  useEffect(() => {
    if (view === "dossiers") d.refreshDossiers();
    if (view === "stats") d.refreshStats();
    if (view === "billing") d.refreshInvoices();
  }, [view]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    const next = !isLight;
    setIsLight(next);
    setThemeLight(next);
    d.showToast(next ? "Mode clair activé" : "Mode sombre activé");
  };

  const logout = async () => {
    await fetch("/v1/auth/sign-out", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const goToPendingJournal = () => setView("journal");

  return (
    <div className="relative z-10 grid h-[100dvh] max-h-[100dvh] grid-cols-[56px_minmax(0,1fr)] sm:grid-cols-[60px_minmax(0,1fr)] xl:grid-cols-[60px_minmax(0,1fr)_350px]">
      <aside className="rail flex min-h-0 shrink-0 flex-col items-center gap-2 overflow-y-auto border-r border-white/[0.06] bg-black/40 py-5">
        <div
          className="mb-6 flex h-9 w-9 items-center justify-center rounded-[10px] border border-gold/40 bg-gradient-to-br from-gold-pale/20 to-gold-deep/20"
          title="ACTE"
        >
          <span className="font-display text-lg font-semibold text-gold-pale">A</span>
        </div>

        <nav className="flex flex-col gap-1.5" aria-label="Navigation principale">
          {RAIL_ITEMS.map((item) => (
            <button
              key={item.view}
              onClick={() => setView(item.view)}
              title={item.label}
              aria-label={item.label}
              className={`rail-btn flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/[0.05] hover:text-ivory ${
                view === item.view || (item.view === "journal" && view === "home") ? "is-active" : "text-ash"
              }`}
            >
              {item.icon}
            </button>
          ))}
        </nav>

        <div className="mt-auto flex flex-col items-center gap-1.5">
          <button
            onClick={() => setView("settings")}
            title={fr.nav.settings}
            aria-label={fr.nav.settings}
            className={`rail-btn flex h-10 w-10 items-center justify-center rounded-xl transition hover:bg-white/[0.05] hover:text-ivory ${view === "settings" ? "is-active" : "text-ash"}`}
          >
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-col">
        <header className="flex items-center justify-between gap-2 border-b border-white/[0.06] bg-black/30 px-3 py-3 sm:px-7 sm:py-3.5">
          <div className="flex items-center gap-3">
            <h1
              className="flex items-baseline font-display text-[17px] font-extrabold uppercase leading-none tracking-[0.01em] text-ivory sm:text-[21px]"
              aria-label="ACTE — Time Tracking"
            >
              ACT
              <span className="relative pr-1.5">
                E
                <svg className="absolute -right-1 -top-2 h-[13px] w-[13px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4.5" strokeLinecap="square">
                  <path d="M4 13l5 5L20 6" />
                </svg>
              </span>
              <span className="-ml-1">.</span>
            </h1>
            <span className="hidden text-[9px] font-medium uppercase tracking-[0.32em] text-ash sm:block">{fr.header.timeTracking}</span>
          </div>

          <nav className="flex items-center gap-1 rounded-full border border-white/[0.07] bg-white/[0.03] p-1" aria-label="Onglets">
            {(["home", "journal", "billing"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`tab rounded-full px-2.5 py-1.5 text-[12px] font-medium text-ash transition hover:text-ivory sm:px-4 sm:text-[13px] ${view === v ? "is-active" : ""}`}
              >
                {fr.nav.tabs[v]}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isLight ? fr.header.toDark : fr.header.toLight}
              title={fr.header.toggleTheme}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-ash transition hover:border-gold/30 hover:text-gold-pale"
            >
              {isLight ? (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="4" />
                  <path d="M12 2v2" />
                  <path d="M12 20v2" />
                  <path d="m4.93 4.93 1.41 1.41" />
                  <path d="m17.66 17.66 1.41 1.41" />
                  <path d="M2 12h2" />
                  <path d="M20 12h2" />
                  <path d="m6.34 17.66-1.41 1.41" />
                  <path d="m19.07 4.93-1.41 1.41" />
                </svg>
              )}
            </button>

            <div ref={profileMenuRef} className="relative">
              <button
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={profileMenuOpen}
                className={`flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.03] py-1 pl-1 pr-3 transition hover:border-gold/30 ${
                  view === "profile" ? "is-active" : ""
                }`}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-gold-pale to-gold-deep font-display text-[13px] font-semibold text-noir">
                  {d.member.initials}
                </span>
                <span className="hidden text-[13px] text-ivory/90 md:block">{d.member.displayName}</span>
                <svg
                  className="text-ash transition-transform"
                  style={{ transform: profileMenuOpen ? "rotate(180deg)" : undefined }}
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {profileMenuOpen && (
                <div
                  role="menu"
                  aria-label="Menu profil"
                  className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[256px] overflow-hidden rounded-2xl border border-white/[0.1] bg-carbon/95 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
                >
                  <div className="border-b border-white/[0.06] px-4 py-3">
                    <p className="text-[13px] font-medium text-ivory">{d.member.displayName}</p>
                    <p className="mt-0.5 text-[11px] text-ash">{d.member.email}</p>
                  </div>
                  <button
                    onClick={() => {
                      setProfileMenuOpen(false);
                      setView("profile");
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-gold/10 active:bg-gold/[0.16]"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/[0.08] text-gold-pale">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                      </svg>
                    </span>
                    <span>
                      <span className="block text-[13px] font-medium text-ivory/95">{fr.profileMenu.myProfile}</span>
                      <span className="mt-0.5 block text-[11px] text-ash">{fr.profileMenu.myProfileSub}</span>
                    </span>
                  </button>
                  <button
                    onClick={logout}
                    className="flex w-full items-start gap-3 border-t border-white/[0.05] px-4 py-3 text-left transition hover:bg-red-500/10"
                  >
                    <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-red-400/25 bg-red-400/[0.08] text-red-400">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" x2="9" y1="12" y2="12" />
                      </svg>
                    </span>
                    <span className="text-[13px] font-medium text-ivory/95">{fr.profileMenu.logout}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="scroll-thin flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6">
          {view === "home" && (
            <HomeView
              summary={d.summary}
              week={d.week}
              tasks={d.tasks}
              dossiers={d.dossiers}
              averageRateCents={d.member.hourlyRateCents}
              onValidate={d.validateTask}
              onValidateAll={d.validateAll}
              onReassign={d.reassignTask}
              onCreateManualTask={d.createManualTask}
            />
          )}
          {view === "journal" && (
            <JournalView
              tasks={d.tasks}
              dossiers={d.dossiers}
              onValidate={d.validateTask}
              onValidateAll={d.validateAll}
              onReassign={d.reassignTask}
              onCreateManualTask={d.createManualTask}
            />
          )}
          {view === "dossiers" && (
            <DossiersView
              dossiers={d.dossiers}
              onCreate={d.createDossier}
              onUpdateBudget={d.updateDossierBudget}
              onSetStatus={(id, status: DossierStatus) => d.setDossierStatus(id, status)}
              onGoToPending={goToPendingJournal}
            />
          )}
          {view === "stats" && <StatsView stats={d.stats} averageRateCents={d.member.hourlyRateCents} onGoToJournal={goToPendingJournal} />}
          {view === "billing" && <BillingView invoices={d.invoices} dossiers={d.dossiers} onGenerate={d.generateInvoice} />}
          {view === "profile" && <ProfileView member={d.member} />}
          {view === "cloud" && <CloudView complianceClaimsEnabled={complianceClaimsEnabled} />}
          {view === "settings" && <SettingsView member={d.member} />}
        </main>
      </div>

      <BrainPanel open={brainOpen} onClose={() => setBrainOpen(false)} summary={d.summary} dossiers={d.dossiers} insights={d.insights} />

      {!brainOpen && (
        <button
          onClick={() => setBrainOpen(true)}
          className="fixed bottom-5 right-5 z-30 flex items-center gap-2 rounded-full border border-gold/40 bg-gradient-to-br from-gold to-gold-deep px-4 py-3 font-semibold text-noir shadow-[0_10px_35px_-10px_rgba(0,0,0,0.55)] transition hover:brightness-110 active:scale-95 xl:hidden"
          aria-label="Ouvrir le Cerveau d'ACTE"
        >
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z" />
          </svg>
          <span className="text-[13px]">IA</span>
        </button>
      )}

      <Toast message={d.toastMessage} />
    </div>
  );
}
