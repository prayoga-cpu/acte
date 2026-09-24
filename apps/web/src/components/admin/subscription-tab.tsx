"use client";

import { useState } from "react";
import type { TeamMemberSummary } from "@acte/contracts";
import { Modal } from "@/components/modal";
import { useI18n } from "@/i18n/locale-context";

const SEAT_PRICE_EUR = 50;
const SEATS_INCLUDED = 8;

/**
 * Stripe wiring is stage 6 (ROADMAP.md) — this tab is UI only, same
 * "simulée" disclaimer the prototype itself already carries (not something
 * this port added), same pattern as billing-view.tsx's downloadInvoiceDemo.
 */
export function SubscriptionTab({
  team,
  firmName,
  onToast,
  onAddSeat,
}: {
  team: TeamMemberSummary[];
  firmName: string;
  onToast: (msg: string) => void;
  onAddSeat: () => void;
}) {
  const { t } = useI18n();
  const [stripeModalOpen, setStripeModalOpen] = useState(false);
  const seats = team.filter((m) => m.status !== "invited").length;
  const pending = team.filter((m) => m.status === "invited").length;
  const price = seats * SEAT_PRICE_EUR;
  const pct = Math.min(100, Math.round((seats / SEATS_INCLUDED) * 100));

  const downloadDemo = (id: string, dateLabel: string, amount: number) => {
    const lines = [
      `ACTE — Facture d'abonnement ${id}`,
      `${t.admin.subscription.invoiceFirmLine} · ${firmName}`,
      `Date : ${dateLabel}`,
      "",
      `Licences          : ${Math.round(amount / SEAT_PRICE_EUR)} × ${SEAT_PRICE_EUR} € / mois`,
      `TOTAL TTC         : ${amount} €`,
      "Moyen de paiement : Visa •••• 4242 (via Stripe)",
      "",
      `— ${t.admin.subscription.demoDocumentCaption} —`,
    ];
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${id}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    onToast(t.admin.subscription.invoiceDownloaded(id));
  };

  return (
    <div className="px-5 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-display text-[21px] font-semibold text-ivory">
            {t.admin.subscription.planLabel} <span className="text-gold-grad">{t.admin.subscription.activeBadge}</span>
          </p>
          <p className="mt-1 text-[12.5px] text-ash">
            {t.admin.subscription.seatsUsed(seats)} · <span className="font-mono text-gold-pale">{t.admin.subscription.pricePerMonth(price)}</span> ·{" "}
            {t.admin.subscription.perSeat(SEAT_PRICE_EUR)}
          </p>
          <p className="mt-1 text-[11.5px] text-ash">
            {t.admin.subscription.soloPre}
            <b className="text-ivory/90">{t.admin.subscription.soloName}</b>
            {t.admin.subscription.soloMid}
            <span className="font-mono text-gold-pale">{t.admin.subscription.soloPrice}</span>
            {t.admin.subscription.soloPost}
          </p>
          {pending > 0 && <p className="mt-1 text-[11.5px] text-amber-300">{t.admin.subscription.pendingNote(pending)}</p>}
        </div>
        <div className="w-full max-w-[220px]">
          <div className="flex items-baseline justify-between text-[11px] text-ash">
            <span>{t.admin.subscription.seatsLabel}</span>
            <span className="font-mono">{t.admin.subscription.seatsIncluded(seats, SEATS_INCLUDED)}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
            <div className="hbar h-full rounded-full bg-gradient-to-r from-gold-pale to-gold-deep" style={{ width: `${pct}%` }} />
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="glass-soft rounded-xl px-4 py-3">
          <p className="text-[11px] text-ash">{t.admin.subscription.nextCharge}</p>
          <p className="mt-1 text-[13px] text-ivory/95">
            {t.admin.subscription.nextChargeDate} · <span className="font-mono text-gold-pale">{price} €</span>
          </p>
        </div>
        <div className="glass-soft rounded-xl px-4 py-3">
          <p className="text-[11px] text-ash">{t.admin.subscription.paymentMethod}</p>
          <p className="mt-1 text-[13px] text-ivory/95">
            Visa <span className="font-mono">•••• 4242</span> · {t.admin.subscription.paymentExpiry}
          </p>
        </div>
        <div className="glass-soft rounded-xl px-4 py-3">
          <p className="text-[11px] text-ash">{t.admin.subscription.customerSince}</p>
          <p className="mt-1 text-[13px] text-ivory/95">
            {t.admin.subscription.customerSinceDate} · <span className="font-mono text-gold-pale">{t.admin.subscription.invoiceCount}</span>
          </p>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/[0.05] pt-4">
        <button
          type="button"
          onClick={() => setStripeModalOpen(true)}
          className="flex cursor-pointer items-center gap-2 rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2 text-[12.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="20" height="14" x="2" y="5" rx="2" />
            <line x1="2" x2="22" y1="10" y2="10" />
          </svg>
          {t.admin.subscription.managePayment}
          <span className="text-[10px] font-medium opacity-70">{t.admin.subscription.viaStripe}</span>
        </button>
        <button
          type="button"
          onClick={onAddSeat}
          className="cursor-pointer rounded-full border border-white/[0.12] px-4 py-2 text-[12.5px] text-ivory/85 transition hover:border-gold/35 hover:text-gold-pale"
        >
          {t.admin.subscription.addSeat}
        </button>
      </div>

      {stripeModalOpen && (
        <Modal onClose={() => setStripeModalOpen(false)}>
          <p className="eyebrow">{t.admin.subscription.modalEyebrow}</p>
          <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{t.admin.subscription.modalTitle}</h3>
          <p className="mt-1.5 text-[11px] leading-relaxed text-ash">
            {t.admin.subscription.stripeNotePre}
            <b className="text-ivory/80">Stripe</b>
            {t.admin.subscription.stripeNotePost}
          </p>
          <div className="glass-soft mt-4 flex items-center gap-3 rounded-xl px-3.5 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-gold/25 bg-gold/[0.08] text-gold-pale">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2" />
                <line x1="2" x2="22" y1="10" y2="10" />
              </svg>
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-ivory/95">
                Visa <span className="font-mono">•••• 4242</span>
              </p>
              <p className="text-[11px] text-ash">{t.admin.subscription.cardDetail}</p>
            </div>
            <button
              type="button"
              onClick={() => onToast(t.admin.subscription.cardUpdateToast)}
              className="cursor-pointer rounded-full border border-white/[0.12] px-3 py-1.5 text-[11.5px] text-ivory/85 transition hover:border-gold/35 hover:text-gold-pale"
            >
              {t.admin.subscription.updateCard}
            </button>
          </div>
          <p className="mt-4 eyebrow">{t.admin.subscription.recentInvoices}</p>
          <div className="mt-2 space-y-1.5">
            {[
              { id: "ACTE-SUB-2026-07", d: t.admin.subscription.sampleInvoiceDates[0] ?? "", a: price },
              { id: "ACTE-SUB-2026-06", d: t.admin.subscription.sampleInvoiceDates[1] ?? "", a: 250 },
              { id: "ACTE-SUB-2026-05", d: t.admin.subscription.sampleInvoiceDates[2] ?? "", a: 200 },
            ].map((f) => (
              <div key={f.id} className="flex items-center gap-2.5 px-1 py-1 text-[12px]">
                <span className="font-mono text-[11px] text-ash">{f.id}</span>
                <span className="flex-1 truncate text-ash">{f.d}</span>
                <span className="font-mono text-ivory/90">{f.a} €</span>
                <span className="text-[10.5px] text-emerald-300">{t.admin.subscription.paid}</span>
                <button
                  type="button"
                  onClick={() => downloadDemo(f.id, f.d, f.a)}
                  className="cursor-pointer rounded-full border border-white/[0.12] px-2.5 py-1 text-[10.5px] text-ivory/80 transition hover:border-gold/35 hover:text-gold-pale"
                >
                  {t.admin.subscription.download}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setStripeModalOpen(false)}
              className="cursor-pointer rounded-full border border-white/[0.12] px-4 py-1.5 text-[12.5px] text-ivory/80 transition hover:border-white/25"
            >
              {t.admin.subscription.close}
            </button>
            <button
              type="button"
              onClick={() => {
                onToast(t.admin.subscription.portalRedirectToast);
                setStripeModalOpen(false);
              }}
              className="cursor-pointer rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-1.5 text-[12.5px] font-semibold text-noir transition hover:brightness-110"
            >
              {t.admin.subscription.openPortal}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
