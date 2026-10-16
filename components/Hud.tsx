"use client";
import { useEffect } from "react";
import { useGame, MISSIONS, FIXED, SUBS, total, hoodReady, READY_MS } from "@/lib/game";
import { READING } from "@/lib/reading";

const fmt = (c: Record<string, number>) => Object.entries(c).filter(([, v]) => v > 0.5).map(([k, v]) => `${SUBS[k]?.name ?? k} ${Math.round(v)} µL`).join(" + ") || "vacío";
export function Hud({ lock }: { lock: () => void }) {
  const s = useGame(); const m = MISSIONS[s.missionIdx];
  useEffect(() => { s.init(); const t = setInterval(() => useGame.getState().tick(), 400); return () => clearInterval(t); }, []); // eslint-disable-line
  const score = Object.values(s.completed).reduce((a, b) => a + b, 0);
  const a = s.aim; const it = a.type === "item" ? s.items[a.id] : null; const held = s.held ? s.items[s.held] : null;
  const ready = hoodReady(s); const warm = s.hoodOn && !ready ? Math.max(0, Math.ceil((READY_MS - (s.now - s.hoodOnAt)) / 1000)) : 0;
  let aimTxt = ""; if (it) aimTxt = `${it.label}${it.cap ? " · " + fmt(it.contents) : ""}${it.contaminated ? " · ⚠ CONTAMINADO (" + it.reason + ")" : ""}`; else if (a.type === "fixed") aimTxt = `${FIXED[a.id].label} — ${FIXED[a.id].hint}`; else if (a.type === "surface" && held && a.up) aimTxt = "[E] Dejar aquí";
  const act = it && !held ? "[E] Coger" : "";
  return (<div className="hud">
    <div className="cross" />
    {s.loaded && <div className="mission">
      <div className="mhead">Módulo {m ? m.module : "—"} · Misión {Math.min(s.missionIdx + 1, MISSIONS.length)}/{MISSIONS.length} <b style={{ float: "right" }}>⭐ {score}</b></div>
      {m ? (<><h3>{m.title}</h3><p>{m.todo}</p><p className="why">💡 <b>Por qué importa:</b> {m.why}</p><p className="hint">🧭 {m.hint}</p></>) : (<><h3>🎉 Fin del prototipo</h3><p>Completaste todas las misiones disponibles. Los módulos 3–6 (cultivo, viabilidad, senescencia, PCR/gel/qPCR/Western) están en desarrollo. Puntaje: {score}.</p></>)}
      <div className="status">🥼 {s.ppe ? "EPP ✓" : "sin EPP"} · 🌀 Campana: {!s.hoodOn ? "apagada" : ready ? "lista" : `estabilizando ${warm}s`} · 🧴 {s.hoodClean ? "desinfectada" : "sin desinfectar"}</div>
    </div>}
    {(aimTxt || act) && <div className="aim">{act} {aimTxt}</div>}
    {held?.kind === "pipette" && (<div className="pip"><b>Micropipeta</b><div className="vol">{s.pip.set} µL</div>
      <div>Punta: {s.pip.tip ? (s.pip.tip.contaminated ? "⚠ contaminada" : "estéril ✓") : "ninguna"}</div><div>Cargado: {total(s.pip.loaded) ? fmt(s.pip.loaded) : "nada"}</div>
      <div className="small">Rueda ±10 · Shift+rueda ±1 · ↑↓ ±100 · ←→ ±1 · clic: aspirar/dispensar · R: expulsar punta</div></div>)}
    {held && held.kind !== "pipette" && <div className="pip"><b>{held.label}</b><div className="small">[E] apuntando a una superficie para dejarlo</div></div>}
    <div className="toasts">{s.toasts.filter(t => s.now - t.at < 7000).map(t => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div>
    {!s.locked && (<div className="overlay" onClick={() => lock()}><div className="panel" onClick={e => e.stopPropagation()}>
      <h1>🔬 Simulador de Wet Lab</h1>
      <p>Laboratorio en primera persona. Aprenderás técnica estéril, pipeteo y diluciones haciéndolos, con errores reales y consecuencias visibles.</p>
      <button className="go" onClick={() => lock()}>{s.loaded && Object.keys(s.completed).length ? "Continuar" : "Entrar al laboratorio"}</button>
      <table className="ctl"><tbody>
        <tr><td>W A S D</td><td>moverse (Shift: rápido)</td></tr><tr><td>Ratón</td><td>mirar</td></tr><tr><td>E</td><td>coger / dejar / usar interruptor</td></tr>
        <tr><td>Clic izq.</td><td>usar lo que llevas (pipeta: aspirar/dispensar; spray; punta)</td></tr><tr><td>Rueda · ↑↓ ←→</td><td>volumen de la pipeta</td></tr><tr><td>R</td><td>expulsar punta</td></tr><tr><td>N</td><td>reponer laboratorio</td></tr><tr><td>Esc</td><td>pausa</td></tr></tbody></table>
      <p className="small">📚 Lectura inicial: <a href={READING.url} target="_blank" rel="noreferrer">{READING.authors} ({READING.year}). {READING.title}. {READING.journal}</a></p>
      <p className="small">Disponible: módulo 1 completo y parte del 2. Pendiente: 3–6, microscopio 3D, centrífuga, termociclador, gel. Progreso guardado en este navegador. <a href="#" onClick={e => { e.preventDefault(); if (confirm("¿Borrar progreso?")) s.wipe(); }}>Borrar progreso</a></p>
    </div></div>)}
  </div>);
}
