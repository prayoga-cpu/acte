"use client";

import { useState } from "react";
import type { MemberRole } from "@acte/contracts";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { useI18n } from "@/i18n/locale-context";
import { ApiError } from "@/lib/api-client";

const ROLES: MemberRole[] = ["associe", "collaborateur", "juriste_stagiaire"];
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function InviteMemberModal({ onClose, onInvite }: { onClose: () => void; onInvite: (email: string, role: MemberRole) => Promise<void> }) {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<MemberRole>("collaborateur");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t.admin.invite.invalidEmail);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onInvite(trimmed, role);
      onClose();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "";
      setError(
        code === "already_member"
          ? t.admin.invite.alreadyMember
          : code === "invite_pending"
            ? t.admin.invite.invitePending
            : code === "email_unavailable"
              ? t.admin.invite.emailUnavailable
              : t.admin.invite.sendError,
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">{t.admin.title}</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{t.admin.invite.title}</h3>

      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="inv-email">
        {t.admin.invite.emailLabel}
      </label>
      <input
        id="inv-email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t.admin.invite.emailPlaceholder}
        autoComplete="off"
        className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/50 outline-none transition focus:border-gold/40"
      />

      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="inv-role">
        {t.admin.invite.roleLabel}
      </label>
      <select
        id="inv-role"
        value={role}
        onChange={(e) => setRole(e.target.value as MemberRole)}
        className="mt-1.5 w-full cursor-pointer rounded-xl border border-white/[0.09] bg-carbon px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
      >
        {ROLES.map((r) => (
          <option key={r} value={r}>
            {t.admin.roles[r]}
          </option>
        ))}
      </select>

      <p className="mt-3 text-[11px] leading-relaxed text-ash">{t.admin.invite.hint}</p>
      {error && <p className="mt-2 text-[11.5px] text-red-400">{error}</p>}

      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={submit} disabled={saving || !email.trim()}>
          {t.admin.invite.submit}
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
