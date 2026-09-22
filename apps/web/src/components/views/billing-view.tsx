"use client";

import type { ClientInvoiceSummary, DossierUsage } from "@acte/contracts";
import { fmtEurFromCents, fmtMin } from "@/lib/format";

const DOC_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M12 18v-6" />
    <path d="M9 15h6" />
  </svg>
);

export function BillingView({
  invoices,
  dossiers,
  onGenerate,
}: {
  invoices: ClientInvoiceSummary[];
  dossiers: DossierUsage[];
  onGenerate: (dossierId: string) => Promise<void>;
}) {
  const billable = dossiers.filter((d) => d.isBillable && d.status !== "archived" && d.usedMinutes > 0);
  const readySum = invoices.filter((i) => i.status === "draft").reduce((s, i) => s + i.amountCents, 0);

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Facturation</p>
          <h2 className="mt-1 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-ivory">Factures issues du temps validé</h2>
        </div>
        <div className="text-right">
          <p className="eyebrow">Brouillons en attente</p>
          <p className="mt-0.5 font-display text-[20px] font-bold leading-none tracking-tight text-gold-grad">{fmtEurFromCents(readySum)}</p>
        </div>
      </div>

      <div className="glass fade-up overflow-hidden">
        {billable.length === 0 && <p className="px-5 py-6 text-[13px] text-ash">Aucun temps validé à facturer pour le moment.</p>}
        {billable.map((d, i) => {
          const invoice = invoices.find((inv) => inv.dossierId === d.id);
          const ready = d.pendingMinutes === 0;
          return (
            <div key={d.id} className={i > 0 ? "border-t border-white/[0.05]" : ""}>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-4">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gold/25 bg-gold/[0.08] text-gold-pale">{DOC_ICON}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ivory/95">
                    {d.name} {invoice && <span className="ml-1.5 font-mono text-[10.5px] text-ash">{invoice.number}</span>}
                  </p>
                  <p className="mt-0.5 text-[11.5px] text-ash">
                    <span className="font-mono text-ivory/70">{fmtMin(d.usedMinutes)}</span> validées
                  </p>
                </div>
                <p className={`shrink-0 font-display text-[21px] font-semibold ${invoice || ready ? "text-gold-grad" : "text-ivory/50"}`}>
                  {invoice ? fmtEurFromCents(invoice.amountCents) : ""}
                </p>
                <div className="shrink-0">
                  {invoice ? (
                    <span className="flex items-center gap-1.5 text-[12px] text-emerald-300">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                      Générée
                    </span>
                  ) : ready ? (
                    <button
                      onClick={() => onGenerate(d.id)}
                      className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-1.5 text-[12.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
                    >
                      Générer la facture
                    </button>
                  ) : (
                    <span className="text-[11px] text-amber-300">● {fmtMin(d.pendingMinutes)} à valider au journal</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <section className="glass fade-up mt-6 p-5">
        <p className="eyebrow">Exports comptables</p>
        <div className="mt-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-medium text-ivory/95">Temps validés (.csv)</p>
              <p className="mt-0.5 text-[11px] text-ash">Compatible Excel · import de diligences</p>
            </div>
            <a
              href="/v1/exports/validated.csv"
              className="rounded-full border border-gold/35 bg-gold/10 px-3.5 py-1.5 text-[11.5px] font-semibold text-gold-pale transition hover:bg-gold/[0.18]"
            >
              Exporter
            </a>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-ash">
          Factur-X, les connecteurs Secib / Kleos / Jarvis et l&rsquo;abonnement Stripe ne sont pas encore couverts (voir ROADMAP.md).
        </p>
      </section>
    </div>
  );
}
