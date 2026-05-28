import { notFound } from "next/navigation";
import { WizardClient } from "./wizard-client";

interface Props {
  params: Promise<{ id: string }>;
}

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Server Component: validates the URL shape only. The session payload lives in
// Dexie (browser IndexedDB), so hydration happens client-side in <WizardClient />.
export default async function SessionPage({ params }: Props) {
  const { id } = await params;
  if (!UUID_REGEX.test(id)) {
    notFound();
  }
  return <WizardClient sessionId={id} />;
}
