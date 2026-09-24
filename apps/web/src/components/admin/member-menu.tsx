"use client";

import { useRef, useState } from "react";
import type { TeamMemberSummary } from "@acte/contracts";
import { useOutsideClick } from "@/lib/use-outside-click";
import { useI18n } from "@/i18n/locale-context";

const EDIT_IC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
  </svg>
);
const BELL_IC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </svg>
);
const POWER_IC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2v10" />
    <path d="M18.4 6.6a9 9 0 1 1-12.77.04" />
  </svg>
);
const CHECK_IC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);
const MAIL_IC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const X_IC = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </svg>
);

export function MemberMenu({
  member,
  onEdit,
  onRemind,
  onSuspend,
  onReactivate,
  onResendInvitation,
  onCancelInvitation,
}: {
  member: TeamMemberSummary;
  onEdit: () => void;
  onRemind: () => void | Promise<void>;
  onSuspend: () => void | Promise<void>;
  onReactivate: () => void | Promise<void>;
  onResendInvitation: () => void | Promise<void>;
  onCancelInvitation: () => void | Promise<void>;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false), open);
  const pending = member.status === "invited";
  const suspended = member.status === "suspended";

  // Failures are reported by use-dashboard's runAdminAction (toast), so a click never rejects unhandled.
  const item = (onClick: () => void | Promise<void>, icon: React.ReactNode, label: string, cls = "text-ivory/90 hover:bg-white/[0.05]") => (
    <button
      type="button"
      onClick={() => {
        setOpen(false);
        void onClick();
      }}
      className={`flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] ${cls} transition`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-label={t.admin.actionsAria(member.displayName)}
        aria-haspopup="menu"
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-ash transition hover:border-gold/35 hover:text-gold-pale"
      >
        <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div className="dossier-menu member-menu fade-up absolute right-0 top-[calc(100%+6px)] z-[70] w-[248px] overflow-hidden rounded-xl border border-white/[0.1] bg-carbon/95 shadow-[0_14px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <p className="truncate border-b border-white/[0.06] px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] text-ash">{member.displayName}</p>
          {pending ? (
            <>
              {item(onResendInvitation, MAIL_IC, t.admin.menu.resend)}
              {item(onCancelInvitation, X_IC, t.admin.menu.cancelInvite, "text-red-400 hover:bg-red-500/10")}
            </>
          ) : (
            <>
              {item(onEdit, EDIT_IC, t.admin.menu.edit)}
              {item(onRemind, BELL_IC, t.admin.menu.remind)}
              {suspended
                ? item(onReactivate, CHECK_IC, t.admin.menu.reactivate, "text-emerald-300 hover:bg-emerald-400/10")
                : item(onSuspend, POWER_IC, t.admin.menu.suspend, "text-red-400 hover:bg-red-500/10")}
            </>
          )}
        </div>
      )}
    </div>
  );
}
