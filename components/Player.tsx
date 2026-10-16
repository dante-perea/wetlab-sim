"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { MODULES } from "@/lib/modules";
import { useProgress, MAX } from "@/lib/progress";
import type { Step } from "@/lib/types";
const shuffle = (a: string[], seed: number) => { const r = a.map((t, i) => ({ t, i })); let x = seed + 7; r.sort(() => ((x = (x * 9301 + 49297) % 233280) / 233280) - 0.5); if (r.every((e, i) => e.i === i)) r.reverse(); return r.map(e => e.t); };
export function Player({ mid, bid }: { mid: string; bid: string }) {
  const m = MODULES.find(x => x.id === mid)!; const b = m.blocks.find(x => x.id === bid)!; const { s, update, ready } = useProgress();
  const [i, setI] = useState<number | null>(null); const [fb, setFb] = useState<{ ok: boolean; text: string } | null>(null);
  const [mistakes, setMistakes] = useState(0); const [crit, setCrit] = useState(0); const [lost, setLost] = useState(false); const [seq, setSeq] = useState<string[]>([]); const [num, setNum] = useState("");
  const [solved, setSolved] = useState(false);
  const idx = i ?? 0; const step: Step | undefined = b.steps[idx]; const nxt = m.blocks[m.blocks.findIndex(x => x.id === bid) + 1];
  const shuf = useMemo(() => (step && step.kind === "sequence" ? shuffle(step.items, step.id.length * 13 + idx) : []), [step, idx]);
  if (!ready) return null;
  const finish = (pts: number) => { update(st => ({ ...st, steps: { ...st.steps, [step!.id]: { points: Math.max(st.steps[step!.id]?.points ?? 0, pts), attempts: (st.steps[step!.id]?.attempts ?? 0) + mistakes + 1 } } })); setSolved(true); };
  const fail = (text: string, critical?: boolean) => { setMistakes(x => x + 1); setFb({ ok: false, text }); if (critical) { const c = crit + 1; setCrit(c); if (c >= 2) setLost(true); } };
  const good = (text: string) => { setFb({ ok: true, text }); finish(Math.max(2, MAX - mistakes * 3)); };
  const goNext = () => { setFb(null); setMistakes(0); setSeq([]); setNum(""); setSolved(false); setI(idx + 1); };
  const restart = () => { setLost(false); setCrit(0); setFb(null); setMistakes(0); setSeq([]); setNum(""); setSolved(false); setI(0); update(st => ({ ...st, steps: Object.fromEntries(Object.entries(st.steps).filter(([k]) => !b.steps.some(x => x.id === k))), blocks: { ...st.blocks, [b.id]: { lost: (st.blocks[b.id]?.lost ?? 0) + 1 } } })); };
  const total = b.steps.reduce((a, x) => a + (s.steps[x.id]?.points ?? 0), 0);
  return (<>
    <p><Link href={`/m/${m.id}`}>← {m.title}</Link></p>
    <h1>{b.title}</h1><div className="why">💡 <b>Por qué importa:</b> {b.why}</div>
    {i === null && (<div className="card"><h2>📖 Teoría breve</h2><ul>{b.theory.map(t => <li key={t}>{t}</li>)}</ul>
      {b.id === "sen" && <p className="small">📚 Lectura inicial: <a href="https://doi.org/10.1016/j.cell.2022.11.001" target="_blank" rel="noreferrer">López-Otín et al., 2023, “Hallmarks of aging: An expanding universe” (Cell)</a></p>}
      <button className="primary" onClick={() => setI(0)}>Empezar práctica ({b.steps.length} pasos)</button></div>)}
    {i !== null && idx < b.steps.length && step && !lost && (<div className="card">
      <div className="row"><span className="pill">Paso {idx + 1}/{b.steps.length}</span>
        <span className="meter" title="Contaminación del cultivo (2 = cultivo perdido)">🦠 {[0, 1].map(k => <span key={k} className={k < crit ? "on" : ""} />)}</span></div>
      <h2 style={{ marginTop: 10 }}>{step.prompt}</h2>
      {step.kind === "choice" && step.options.map((o, k) => (<button key={k} disabled={solved} onClick={() => o.correct ? good(o.feedback + " " + step.explain) : fail(o.feedback, o.critical)}>{o.text}</button>))}
      {step.kind === "number" && (<div><input inputMode="decimal" value={num} disabled={solved} onChange={e => setNum(e.target.value)} placeholder="Tu respuesta" /> <span>{step.unit}</span>
        <button className="primary" disabled={solved || !num} style={{ marginTop: 10 }} onClick={() => { const v = parseFloat(num.replace(",", ".")); if (Math.abs(v - step.answer) <= Math.abs(step.answer) * step.tol) good("¡Correcto! " + step.explain); else fail(step.wrong, step.critical); }}>Comprobar</button></div>)}
      {step.kind === "sequence" && (<div><p className="small">Toca los pasos en el orden correcto.</p>
        {shuf.map(t => <button key={t} disabled={solved || seq.includes(t)} onClick={() => { const n = [...seq, t]; setSeq(n); if (step.items[n.length - 1] !== t) { fail(`“${t}” no va en la posición ${n.length}. Reinicia el orden.`, false); setSeq([]); } else if (n.length === step.items.length) good("¡Orden correcto! " + step.explain); }}>{seq.includes(t) ? `${seq.indexOf(t) + 1}. ` : ""}{t}</button>)}</div>)}
      {fb && <div className={`fb ${fb.ok ? "ok" : "bad"}`}>{fb.ok ? "✅" : "⚠️"} {fb.text}</div>}
      {solved && <button className="primary" onClick={goNext}>{idx + 1 < b.steps.length ? "Siguiente →" : "Terminar bloque"}</button>}
    </div>)}
    {lost && (<div className="card"><h2>🦠 Cultivo contaminado</h2><p>Cometiste dos errores críticos de técnica: el cultivo se perdió. En el laboratorio real habría que descartar y empezar de nuevo. Se reinicia este bloque.</p><button className="primary" onClick={restart}>Empezar de nuevo</button></div>)}
    {i !== null && idx >= b.steps.length && !lost && (<div className="card"><h2>🎉 Bloque completado</h2><p>Puntaje: <b>{total}</b>/{b.steps.length * MAX}</p>
      <p className="small">Se guarda automáticamente en tu navegador.</p>
      {nxt ? <Link href={`/m/${m.id}/${nxt.id}`}><button className="primary">Siguiente bloque: {nxt.title}</button></Link> : <Link href="/"><button className="primary">Volver al inicio</button></Link>}</div>)}
  </>);
}
