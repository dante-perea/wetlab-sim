"use client";
import { useProgress, MAX } from "@/lib/progress";
import { MODULES } from "@/lib/modules";
import Link from "next/link";
export function modStats(s: any, m: (typeof MODULES)[number]) {
  const steps = m.blocks.flatMap(b => b.steps); const done = steps.filter(x => s.steps[x.id]); 
  return { total: steps.length, done: done.length, pts: done.reduce((a, x) => a + s.steps[x.id].points, 0), max: steps.length * MAX };
}
export function Home() {
  const { s, reset, ready } = useProgress();
  let tp = 0, tm = 0, td = 0, tt = 0;
  const cards = MODULES.map(m => { const st = modStats(s, m); tp += st.pts; tm += st.max; td += st.done; tt += st.total;
    return (<Link key={m.id} href={`/m/${m.id}`}><div className="card"><div className="row"><h2>{m.emoji} {m.n}. {m.title}</h2><span className="pill">{ready ? `${st.done}/${st.total}` : "…"}</span></div>
      <div className="small">{m.why}</div><div className="bar" style={{ marginTop: 10 }}><i style={{ width: `${(st.done / st.total) * 100}%` }} /></div>
      <div className="small" style={{ marginTop: 6 }}>Puntaje: {st.pts}/{st.max}</div></div></Link>); });
  return (<><div className="card"><div className="row"><b>Progreso total</b><span className="pill">{td}/{tt} pasos · {tp}/{tm} pts</span></div>
    <div className="bar" style={{ marginTop: 8 }}><i style={{ width: `${(td / tt) * 100}%` }} /></div></div>
    <div className="grid">{cards}</div>
    <p className="small">Tu progreso se guarda solo en este navegador. <button style={{ display: "inline", width: "auto", padding: "4px 10px" }} onClick={() => { if (confirm("¿Borrar todo el progreso?")) reset(); }}>Reiniciar progreso</button></p></>);
}
export function ModuleView({ id }: { id: string }) {
  const { s, ready } = useProgress(); const m = MODULES.find(x => x.id === id)!;
  return (<div className="grid">{m.blocks.map((b, i) => { const d = b.steps.filter(x => s.steps[x.id]).length;
    return (<Link key={b.id} href={`/m/${m.id}/${b.id}`}><div className="card"><div className="row"><h2>{i + 1}. {b.title}</h2><span className="pill">{ready ? `${d}/${b.steps.length}` : "…"}</span></div>
      <div className="why">💡 {b.why}</div></div></Link>); })}</div>);
}
