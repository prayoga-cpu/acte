"use client";

import type { Dossier, Task } from "@acte/contracts";
import { JournalCard } from "@/components/journal/journal-card";

export function JournalView({
  tasks,
  dossiers,
  onValidate,
  onValidateAll,
  onReassign,
  onCreateManualTask,
}: {
  tasks: Task[];
  dossiers: Dossier[];
  onValidate: (id: string) => void;
  onValidateAll: () => void;
  onReassign: (id: string, dossierId: string) => void;
  onCreateManualTask: (input: { title: string; dossierId: string | null; startedAt: string; durationMin: number }) => Promise<void>;
}) {
  return (
    <div className="mx-auto max-w-[1080px]">
      <JournalCard
        tasks={tasks}
        dossiers={dossiers}
        focused
        onValidate={onValidate}
        onValidateAll={onValidateAll}
        onReassign={onReassign}
        onCreateManualTask={onCreateManualTask}
      />
    </div>
  );
}
