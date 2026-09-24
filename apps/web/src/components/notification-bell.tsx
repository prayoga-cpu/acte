"use client";

import { useRef, useState } from "react";
import type { NotificationView } from "@acte/contracts";
import { useOutsideClick } from "@/lib/use-outside-click";
import { useI18n } from "@/i18n/locale-context";

function relativeTime(iso: string, t: ReturnType<typeof useI18n>["t"]): string {
  const minutes = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (minutes < 60) return t.notifications.minutesAgo(minutes);
  const hours = Math.round(minutes / 60);
  if (hours < 24) return t.notifications.hoursAgo(hours);
  return t.notifications.daysAgo(Math.round(hours / 24));
}

export function NotificationBell({
  notifications,
  onMarkRead,
  onMarkAllRead,
  onOpen,
}: {
  notifications: NotificationView[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onOpen: () => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(ref, () => setOpen(false), open);
  const unread = notifications.filter((n) => !n.readAt);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => {
          const next = !open;
          setOpen(next);
          if (next) onOpen();
        }}
        aria-label={t.notifications.bellAria}
        aria-haspopup="menu"
        className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] text-ash transition hover:border-gold/30 hover:text-gold-pale"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
        {unread.length > 0 && (
          <span className="absolute right-0.5 top-0.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-gold px-1 font-mono text-[9px] font-bold text-noir">
            {unread.length > 9 ? "9+" : unread.length}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          aria-label={t.notifications.title}
          className="absolute right-0 top-[calc(100%+8px)] z-[70] w-[320px] overflow-hidden rounded-2xl border border-white/[0.1] bg-carbon/95 shadow-[0_18px_50px_-12px_rgba(0,0,0,0.85)] backdrop-blur-xl"
        >
          <div className="flex items-center justify-between border-b border-white/[0.06] px-4 py-3">
            <p className="text-[13px] font-medium text-ivory">{t.notifications.title}</p>
            {unread.length > 0 && (
              <button type="button" onClick={onMarkAllRead} className="text-[11px] text-gold-pale transition hover:text-gold">
                {t.notifications.markAllRead}
              </button>
            )}
          </div>
          <div className="scroll-thin max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="px-4 py-6 text-center text-[12.5px] text-ash">{t.notifications.empty}</p>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => !n.readAt && onMarkRead(n.id)}
                  className={`flex w-full items-start gap-2.5 border-b border-white/[0.04] px-4 py-3 text-left transition last:border-b-0 hover:bg-white/[0.04] ${n.readAt ? "opacity-55" : ""}`}
                >
                  <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${n.readAt ? "bg-white/20" : "bg-gold pulse-gold"}`} />
                  <span className="min-w-0 flex-1">
                    <span className="block text-[12.5px] leading-snug text-ivory/90">{n.message}</span>
                    <span className="mt-0.5 block font-mono text-[10.5px] text-ash">{relativeTime(n.createdAt, t)}</span>
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
