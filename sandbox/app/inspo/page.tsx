import { listInspo } from "@/lib/queries";
import { InspoScreen } from "@/components/InspoScreen";

export const dynamic = "force-dynamic";

export default async function InspoPage({ searchParams }: { searchParams: Promise<{ id?: string; add?: string }> }) {
  const { id, add } = await searchParams;
  const items = listInspo();
  return <InspoScreen items={items} initialId={id ? Number(id) : null} openAdd={add === "1"} />;
}
