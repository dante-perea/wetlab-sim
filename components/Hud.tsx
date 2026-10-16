"use client";
import { useEffect } from "react";
import { useGame, MISSIONS, FIXED, SUBS, total, hoodReady, READY_MS, FLASK_AREA, CONF_100 } from "@/lib/game";
import { READING } from "@/lib/reading";
import Micro from "./Micro";

const fmt = (c: Record<string, number>) => Object.entries(c).filter(([, v]) => v > 0.5).map(([k, v]) => `${SUBS[k]?.name ?? k} ${Math.round(v)} µL`).join(" + ") || "vacío";
export function Hud({ lock }: { lock: () => void }) {
  const s = useGame(); const m = MISSIONS[s.missionIdx];
  useEffect(() => { s.init(); const t = setInterval(() => useGame.getState().tick(), 400); return () => clearInterval(t); }, []); // eslint-disable-line
  useEffect(() => { if (s.scopeOpen && document.pointerLockElement) document.exitPointerLock(); }, [s.scopeOpen]);
  useEffect(() => { const k = (e: KeyboardEvent) => { if (e.code === "Delete" && !useGame.getState().locked && !useGame.getState().scopeOpen) useGame.getState().wipe(); }; window.addEventListener("keydown", k); return () => window.removeEventListener("keydown", k); }, []);
  const score = Object.values(s.completed).reduce((a, b) => a + b, 0);
  const a = s.aim; const it = a.type === "item" ? s.items[a.id] : null; const held = s.held ? s.items[s.held] : null;
  const ready = hoodReady(s); const warm = s.hoodOn && !ready ? Math.max(0, Math.ceil((READY_MS - (s.now - s.hoodOnAt)) / 1000)) : 0;
  let aimTxt = ""; let act = "";
  if (it) { const c = it.kind === "cflask" ? ` · ${Math.min(100, Math.round((it.cells / FLASK_AREA / CONF_100) * 100))} % confluencia` : ""; aimTxt = `${it.label}${it.cap ? " · " + fmt(it.contents) : ""}${c}${it.frozen ? " · ❄ congelado" : ""}${it.contaminated ? " · ⚠ CONTAMINADO (" + it.reason + ")" : ""}`; act = !held ? "[E] Coger" : ""; }
  else if (a.type === "fixed") aimTxt = `${FIXED[a.id].label} — ${FIXED[a.id].hint}`; else if (a.type === "surface" && held && a.up) aimTxt = "[E] Dejar aquí";
  const incub = Object.values(s.items).find(i => i.loc === "incubator" && i.kind === "cflask");
  return (<div className="hud">
    <div className="cross" />
    {s.loaded && !s.scopeOpen && <div className="mission">
      <div className="mhead">Módulo {m ? m.module : "—"} · Misión {Math.min(s.missionIdx + 1, MISSIONS.length)}/{MISSIONS.length} <b style={{ float: "right" }}>⭐ {score}</b></div>
      <div className="bar"><i style={{ width: `${(Object.keys(s.completed).length / MISSIONS.length) * 100}%` }} /></div>
      {m ? (<><h3>{m.title}</h3><p>{m.todo}</p><p className="why">💡 <b>Por qué importa:</b> {m.why}</p><p className="hint">🧭 {m.hint} <span className="small">(el rombo amarillo marca el objetivo)</span></p></>) : (<><h3>🎉 Fin del prototipo</h3><p>Completaste todas las misiones disponibles (módulos 1–3 parcial). Faltan: pasar y congelar células, contaminación en cultivo, MTT/tripán, SA-β-gal, PCR, gel, qPCR y Western. Puntaje: {score}.</p></>)}
      <div className="status">🥼 {s.ppe ? "EPP ✓" : "sin EPP"} · 🌀 Campana: {!s.hoodOn ? "apagada" : ready ? "lista" : `estabilizando ${warm}s`} · 🧴 {s.hoodClean ? "desinfectada" : "sin desinfectar"}{incub ? ` · 🧫 incubando ${Math.round((incub.cells / FLASK_AREA / CONF_100) * 100)} %` : ""}</div>
    </div>}
    {(aimTxt || act) && !s.scopeOpen && <div className="aim">{act} {aimTxt}</div>}
    {held?.kind === "pipette" && !s.scopeOpen && (<div className="pip"><b>Micropipeta</b><div className="vol">{s.pip.set} µL</div>
      <div>Punta: {s.pip.tip ? (s.pip.tip.contaminated ? "⚠ contaminada" : "estéril ✓") : "ninguna"}</div><div>Cargado: {total(s.pip.loaded) ? fmt(s.pip.loaded) : "nada"}</div>
      <div className="small">Rueda ±10 · Shift+rueda ±1 · ↑↓ ±100 · ←→ ±1 · clic: aspirar/dispensar · R: expulsar punta</div></div>)}
    {held && held.kind !== "pipette" && !s.scopeOpen && <div className="pip"><b>{held.label}</b><div className="small">[E] apuntando a una superficie para dejarlo, o a un equipo para usarlo</div></div>}
    <div className="toasts">{s.toasts.filter(t => s.now - t.at < 7000).map(t => <div key={t.id} className={`toast ${t.kind}`}>{t.text}</div>)}</div>
    {s.scopeOpen && <Micro />}
    {!s.locked && !s.scopeOpen && (<div className="overlay" onClick={() => lock()}><div className="panel" onClick={e => e.stopPropagation()}>
      <h1>🔬 Simulador de Wet Lab</h1>
      <p>Laboratorio 3D en primera persona. Aprenderás técnica estéril, pipeteo, diluciones y cultivo celular haciéndolos, con errores reales y consecuencias visibles.</p>
      <p className="go" onClick={() => lock()}>{s.loaded && Object.keys(s.completed).length ? "▶ Haz clic para continuar" : "▶ Haz clic para entrar al laboratorio"}</p>
      <table className="ctl"><tbody>
        <tr><td>W A S D</td><td>moverse (Shift: rápido)</td></tr><tr><td>Ratón</td><td>mirar</td></tr><tr><td>E</td><td>coger / dejar / usar equipo</td></tr>
        <tr><td>Clic izq.</td><td>usar lo que llevas (pipeta, spray, punta)</td></tr><tr><td>Rueda · ↑↓ ←→</td><td>volumen de la pipeta</td></tr><tr><td>R</td><td>expulsar punta</td></tr><tr><td>N</td><td>reponer laboratorio</td></tr><tr><td>Esc</td><td>pausa</td></tr><tr><td>Supr (en pausa)</td><td>borrar progreso</td></tr></tbody></table>
      <p className="small">📚 Lectura inicial: <a href={READING.url} target="_blank" rel="noreferrer">{READING.authors} ({READING.year}). {READING.title}. {READING.journal}</a></p>
      <p className="small">Módulo 1 completo, módulo 2 parcial, módulo 3 parcial (descongelar, sembrar, incubadora, microscopio, hemocitómetro). Pendiente: pasar/congelar células, 4–6. Progreso guardado en este navegador.</p>
    </div></div>)}
  </div>);
}
