"use client";

import type { Dossier, Task } from "@acte/contracts";
import { JournalCard, type JournalActions } from "@/components/journal/journal-card";

export function JournalView({
  tasks,
  backlog,
  dateKey,
  dossiers,
  flash,
  actions,
}: {
  tasks: Task[];
  backlog: Task[];
  dateKey: string;
  dossiers: Dossier[];
  flash?: { dossierId: string; seq: number } | null;
  actions: JournalActions;
}) {
  return (
    <div className="mx-auto max-w-[1080px]">
      <JournalCard tasks={tasks} backlog={backlog} dateKey={dateKey} dossiers={dossiers} focused flash={flash} actions={actions} />
    </div>
  );
}
