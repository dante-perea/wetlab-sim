import { MODULES } from "@/lib/modules"; import { Player } from "@/components/Player"; import { notFound } from "next/navigation";
export function generateStaticParams() { return MODULES.flatMap(m => m.blocks.map(b => ({ id: m.id, block: b.id }))); }
export default async function P({ params }: { params: Promise<{ id: string; block: string }> }) {
  const { id, block } = await params; const m = MODULES.find(x => x.id === id); if (!m || !m.blocks.some(b => b.id === block)) notFound();
  return <Player mid={id} bid={block} />;
}
