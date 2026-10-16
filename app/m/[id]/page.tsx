import { MODULES } from "@/lib/modules"; import { ModuleView } from "@/components/Progress"; import Link from "next/link"; import { notFound } from "next/navigation";
export function generateStaticParams() { return MODULES.map(m => ({ id: m.id })); }
export default async function P({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const m = MODULES.find(x => x.id === id); if (!m) notFound();
  return (<><p><Link href="/">← Inicio</Link></p><h1>{m.emoji} {m.n}. {m.title}</h1><div className="why">💡 {m.why}</div><ModuleView id={m.id} /></>);
}
