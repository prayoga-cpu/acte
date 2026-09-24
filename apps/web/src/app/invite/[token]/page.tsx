import type { InvitationPreview } from "@acte/contracts";
import { LocaleToggleButton } from "@/components/locale-toggle-button";
import { InviteForm } from "./invite-form";

const API_ORIGIN = process.env.API_ORIGIN ?? "http://localhost:4000";

async function fetchPreview(token: string): Promise<InvitationPreview | null> {
  const res = await fetch(`${API_ORIGIN}/v1/invitations/${encodeURIComponent(token)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json() as Promise<InvitationPreview>;
}

export default async function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const preview = await fetchPreview(token);

  return (
    <main className="relative flex h-[100dvh] items-center justify-center p-4">
      <div className="absolute right-4 top-4">
        <LocaleToggleButton />
      </div>
      <InviteForm token={token} preview={preview} />
    </main>
  );
}
