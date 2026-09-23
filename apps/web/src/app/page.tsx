import { redirect } from "next/navigation";
import type { Member } from "@acte/contracts";
import { apiServerFetch } from "@/lib/api-server";
import { LandingContent } from "@/components/marketing/landing-content";

async function isSignedIn(): Promise<boolean> {
  try {
    const member = await apiServerFetch<Member>("/v1/me/profile");
    return member !== null;
  } catch {
    // API unreachable or erroring: treat the visitor as signed out rather
    // than breaking the public marketing page over it.
    return false;
  }
}

export default async function LandingPage() {
  if (await isSignedIn()) {
    redirect("/dashboard");
  }

  return <LandingContent />;
}
