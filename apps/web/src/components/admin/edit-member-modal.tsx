"use client";

import { useState } from "react";
import type { MemberRole, TeamMemberSummary } from "@acte/contracts";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { useI18n } from "@/i18n/locale-context";

const ROLES: MemberRole[] = ["associe", "associee", "collaborateur", "collaboratrice", "juriste_stagiaire"];

export function EditMemberModal({
  member,
  onClose,
  onSave,
}: {
  member: TeamMemberSummary;
  onClose: () => void;
  onSave: (patch: { role: MemberRole; hourlyRateCents: number }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [role, setRole] = useState<MemberRole>(member.role);
  const [rate, setRate] = useState(Math.round(member.hourlyRateCents / 100));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setSaving(true);
    setError(null);
    try {
      await onSave({ role, hourlyRateCents: Math.min(5000, Math.max(50, rate)) * 100 });
      onClose();
    } catch {
      setError(t.admin.edit.saveError);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">{t.admin.edit.title}</p>
      <h3 className="mt-1 truncate font-display text-[20px] font-semibold text-ivory">{member.displayName}</h3>

      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="ed-role">
        {t.admin.edit.roleLabel}
      </label>
      <select
        id="ed-role"
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

      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="ed-rate">
        {t.admin.edit.rateLabel}
      </label>
      <div className="mt-1.5 flex items-center gap-3">
        <input
          id="ed-rate"
          type="number"
          min={50}
          step={10}
          value={rate}
          onChange={(e) => setRate(parseInt(e.target.value, 10) || 50)}
          className="w-28 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 font-mono text-[15px] text-ivory outline-none transition focus:border-gold/40"
        />
        <span className="text-[13px] text-ash">{t.admin.edit.rateUnit}</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ash">{t.admin.edit.hint}</p>
      {error && <p className="mt-2 text-[11.5px] text-red-400">{error}</p>}

      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={submit} disabled={saving}>
          {t.admin.edit.submit}
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
