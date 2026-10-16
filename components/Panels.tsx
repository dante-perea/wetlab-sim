"use client";
import { useEffect, useRef, useState } from "react";
import { useGame, total } from "@/lib/game";
import { PCR_RUN_MS, travel, interpSize, PRIMER_TM } from "@/lib/molbio";

const COLORS = ["#ff7a59", "#ffd166", "#06d6a0", "#4cc9f0", "#c77dff", "#f15bb5"];
function useKeys(h: (e: KeyboardEvent) => void, deps: unknown[]) { useEffect(() => { window.addEventListener("keydown", h); return () => window.removeEventListener("keydown", h); }, deps); } // eslint-disable-line

export function ThermoPanel() {
  const s = useGame(); const th = s.thermo; const tubes = Object.values(s.items).filter(i => i.loc === "thermo"); const hasCt = th.mode === "qpcr" && tubes.some(t => t.ct);
  const [dial, setDial] = useState(0); const cv = useRef<HTMLCanvasElement>(null);
  const prog = th.runStart ? Math.min(1, (s.now - th.runStart) / (th.mode === "pcr" ? PCR_RUN_MS : 8000)) : 0;
  const cyc = th.runStart ? Math.min(th.cycles, Math.floor(prog * th.cycles) + 1) : 0; const phase = th.runStart ? ["Desnaturalización 95 °C", `Hibridación ${th.anneal} °C`, "Extensión 72 °C"][Math.floor((prog * th.cycles * 3) % 3)] : "";
  useKeys(e => { const g = useGame.getState(); const t = g.thermo;
    if (e.code === "Escape" || e.code === "KeyQ") g.closePanel();
    else if (e.code === "ArrowLeft") { hasCt ? setDial(d => Math.max(-6, d - 0.25)) : g.setThermo({ anneal: t.anneal - 1 }); } else if (e.code === "ArrowRight") { hasCt ? setDial(d => Math.min(6, d + 0.25)) : g.setThermo({ anneal: t.anneal + 1 }); }
    else if (e.code === "ArrowUp") g.setThermo({ cycles: t.cycles + 1 }); else if (e.code === "ArrowDown") g.setThermo({ cycles: t.cycles - 1 });
    else if (e.code === "KeyM") g.setThermo({ mode: t.mode === "pcr" ? "qpcr" : "pcr" });
    else if (e.code === "KeyR") { const items = { ...g.items }; for (const id in items) if (items[id].loc === "thermo" && items[id].ct) items[id] = { ...items[id], ct: undefined }; useGame.setState({ items }); }
    else if (e.code === "Enter") { const has = Object.values(g.items).some(i => i.loc === "thermo" && i.ct); if (t.mode === "qpcr" && has) g.qAnswer(dial); else g.startThermo(); } }, [dial, hasCt]);
  useEffect(() => { const c = cv.current; if (!c) return; const g = c.getContext("2d")!; g.fillStyle = "#06130b"; g.fillRect(0, 0, c.width, c.height); g.strokeStyle = "#1c3a2a"; for (let i = 0; i <= 5; i++) { g.beginPath(); g.moveTo(0, (i * c.height) / 5); g.lineTo(c.width, (i * c.height) / 5); g.stroke(); }
    const thr = c.height * 0.8; g.strokeStyle = "#7fd3ff"; g.setLineDash([4, 4]); g.beginPath(); g.moveTo(0, thr); g.lineTo(c.width, thr); g.stroke(); g.setLineDash([]); g.fillStyle = "#7fd3ff"; g.font = "11px monospace"; g.fillText("umbral", 4, thr - 3);
    if (th.mode !== "qpcr") return; tubes.forEach((t, k) => { if (!t.ct?.ct) return; const ct = t.ct.ct; g.strokeStyle = COLORS[k % 6]; g.lineWidth = 2; g.beginPath(); const maxC = th.runStart ? prog * 40 : 40; for (let cc = 0; cc <= maxC; cc += 0.5) { const y = 1 / (1 + Math.exp(-0.8 * (cc - (ct + 2.17)))); const px = (cc / 40) * c.width, py = c.height - (c.height * 0.05 + y * c.height * 0.55 + (cc < ct ? 0 : 0)); const yy = c.height - (y * c.height * 0.95) * 1; void py; cc === 0 ? g.moveTo(px, yy) : g.lineTo(px, yy); } g.stroke(); });
    g.fillStyle = "#6dff9b"; g.fillText("ciclos →", c.width - 60, c.height - 4); });
  const rows = tubes.map(t => ({ id: t.id, label: t.label, ct: t.ct, pcr: t.pcr }));
  return (<div className="panelov"><div className="dev">
    <div className="devhead">🧬 Termociclador · modo <b>{th.mode === "pcr" ? "PCR" : "qPCR"}</b> <span className="small">(M cambia)</span></div>
    <div className="lcd">
      <div>Desnat. 95 °C 3 min → [ 95 °C 30 s → <b className={th.anneal < 50 || th.anneal > 60 ? "warn" : ""}>{th.anneal} °C</b> 30 s → 72 °C 45 s ] × <b>{th.cycles}</b> → 72 °C 5 min</div>
      <div className="small">Tm de los cebadores: {PRIMER_TM} °C · ← → hibridación · ↑ ↓ ciclos</div>
      {th.runStart ? <div className="run"><div className="bar"><i style={{ width: `${prog * 100}%` }} /></div>{th.mode === "pcr" ? <>Ciclo {cyc}/{th.cycles} · {phase}</> : <>Ciclo {Math.min(40, Math.floor(prog * 40))}/40 · midiendo fluorescencia</>}</div> : <div className="run">{th.runs + th.mqpcr ? "Listo." : "Esperando inicio"} Enter {hasCt ? "confirma tu respuesta" : "inicia"} · R borra Ct · Esc cierra</div>}
    </div>
    {th.mode === "qpcr" && <canvas ref={cv} width={520} height={150} className="amp" />}
    <table className="tbl"><thead><tr><th>Tubo</th><th>Contenido</th>{th.mode === "qpcr" ? <th>Ct</th> : <th>Resultado</th>}</tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.label}</td><td>{Object.entries(s.items[r.id].contents).filter(([, v]) => v > 0.2).map(([k, v]) => `${k} ${v.toFixed(0)}`).join(" · ")}</td><td>{th.mode === "qpcr" ? (r.ct ? (r.ct.ct ? r.ct.ct.toFixed(2) : "indet.") : "—") : r.pcr ? "ver gel" : "—"}</td></tr>)}</tbody></table>
    {hasCt && <div className="dial">Cambio de expresión estimado (tratado vs control): <b>{Math.pow(2, dial).toFixed(2)}×</b> (log₂ = {dial.toFixed(2)}) · ← → ajusta · Enter confirma{s.qa.ok > 0 && " ✓"}</div>}
    <div className="why">💡 Por qué importa: el termociclador copia el ADN exponencialmente (2ⁿ). Cada parámetro (temperatura de hibridación, ciclos) cambia la especificidad y el rendimiento; la qPCR mide el ciclo en que se cruza el umbral (Ct).</div>
  </div></div>);
}

export function GelRunPanel() {
  const s = useGame(); const g = s.gel;
  useKeys(e => { const x = useGame.getState(); if (e.code === "Escape" || e.code === "KeyQ") x.closePanel(); else if (e.code === "ArrowUp") x.gelVolt(10); else if (e.code === "ArrowDown") x.gelVolt(-10); else if (e.code === "Enter") x.gelToggle(); else if (e.code === "KeyG") x.gelClear(); }, []);
  return (<div className="panelov"><div className="dev">
    <div className="devhead">⚡ Fuente de poder · electroforesis</div>
    <div className="lcd"><div className="vol">{g.volt} V</div><div className="small">↑↓ voltaje (antes de empezar) · Enter {g.running ? "detiene" : "inicia"} · G gel nuevo · Esc cierra</div>
      <div className="gelsim"><div className="gelbox">{g.lanes.map((l, i) => <div key={i} className="well" style={{ left: 8 + i * 42 }} title={l.label} />)}<div className="front" style={{ top: `${Math.min(100, g.T * 100 * 0.9)}%` }} /></div>
        <div className="small">Frente de azul: {Math.round(g.T * 100)} % {g.running ? "· corriendo…" : ""} {g.volt > 150 ? "· ⚠ voltaje alto: el gel se calienta" : ""}</div></div>
      <table className="tbl"><tbody>{g.lanes.map((l, i) => <tr key={i}><td>Pocillo {i + 1}</td><td>{l.label}</td><td>{Math.round(l.vol)} µL{l.lost ? " ⚠ sin tampón: perdida" : ""}{l.spill ? " ⚠ derrame" : ""}</td></tr>)}{!g.lanes.length && <tr><td>Gel vacío: carga los pocillos con la pipeta</td></tr>}</tbody></table></div>
    <div className="why">💡 Por qué importa: el ADN tiene carga negativa y migra hacia el + a través de la agarosa; los fragmentos pequeños corren más lejos. Por eso la distancia recorrida se relaciona con log₁₀(tamaño).</div>
  </div></div>);
}

export function GelView() {
  const s = useGame(); const g = s.gel; const cv = useRef<HTMLCanvasElement>(null); const W = 560, H = 460, x0 = 70, x1 = 530, y0 = 50, y1 = 430; const LW = 52;
  const laneX = (i: number) => x0 + 12 + i * ((x1 - x0 - 24) / 6) + 12;
  useKeys(e => { const x = useGame.getState(); if (e.code === "Escape" || e.code === "KeyQ") x.closePanel(); else if (e.code === "KeyG") { x.gelClear(); x.closePanel(); } }, []);
  useEffect(() => { const c = cv.current; if (!c) return; const k = c.getContext("2d")!; k.fillStyle = "#0b0f14"; k.fillRect(0, 0, W, H); k.fillStyle = "#12261b"; k.fillRect(x0, y0, x1 - x0, y1 - y0);
    g.lanes.forEach((l, i) => { const lx = laneX(i); k.fillStyle = "#050a07"; k.fillRect(lx - LW / 2 + 4, y0 - 6, LW - 8, 8); k.fillStyle = "#9fb"; k.font = "10px sans-serif"; k.textAlign = "center"; k.fillText(l.kind === "ladder" ? "M" : l.src.replace("tubeP", "P"), lx, y0 - 12);
      const blur = g.volt > 150 ? 6 : 0; if (l.smear) { const gr = k.createLinearGradient(0, y0 + travel(1500, g.T) * (y1 - y0), 0, y0 + travel(200, g.T) * (y1 - y0)); gr.addColorStop(0, "rgba(255,160,60,0)"); gr.addColorStop(0.5, "rgba(255,160,60,0.5)"); gr.addColorStop(1, "rgba(255,160,60,0)"); k.fillStyle = gr; k.fillRect(lx - LW / 2 + 6, y0 + travel(1500, g.T) * (y1 - y0), LW - 12, (travel(200, g.T) - travel(1500, g.T)) * (y1 - y0)); }
      l.bands.forEach(b => { const d = travel(b.size, g.T); if (d > 0.98) return; const y = y0 + d * (y1 - y0); k.shadowColor = "#ffa23a"; k.shadowBlur = 8 + blur; k.fillStyle = `rgba(255,${170 + 60 * b.i | 0},80,${0.25 + 0.75 * b.i})`; k.fillRect(lx - LW / 2 + 6, y - 2 - blur / 3, LW - 12, 4 + blur / 1.5); k.shadowBlur = 0; if (l.kind === "ladder") { k.fillStyle = "#cfe"; k.textAlign = "right"; k.font = "10px sans-serif"; k.fillText(`${b.size}`, lx - LW / 2 - 2, y + 3); } }); });
    if (g.est) { const l = g.lanes[g.est.lane]; if (l) { k.fillStyle = "#7fd3ff"; k.font = "12px sans-serif"; k.textAlign = "left"; k.fillText(`≈ ${Math.round(g.est.size)} pb`, x1 + 4 > W - 70 ? W - 70 : x1 + 4, y0 + 20); } } }, [g, s.now]); // eslint-disable-line
  const onClick = (e: React.MouseEvent) => { const r = cv.current!.getBoundingClientRect(); const x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H; let li = -1; g.lanes.forEach((_, i) => { if (Math.abs(x - laneX(i)) < LW / 2) li = i; }); if (li < 0 || g.lanes[li].kind === "ladder") return;
    const lad = g.lanes.find(l => l.kind === "ladder" && !l.lost); if (!lad) return useGame.getState().gelEst(li, 0);
    const L = g.lanes[li]; let best: number | null = null, bd = 14; L.bands.forEach(b => { const by = y0 + travel(b.size, g.T) * (y1 - y0); if (Math.abs(by - y) < bd) { bd = Math.abs(by - y); best = by; } }); if (best === null) return;
    const pos = lad.bands.map(b => ({ size: b.size, y: travel(b.size, g.T) })).filter(p => p.y <= 0.98); const sz = interpSize(pos, (best - y0) / (y1 - y0)); if (sz) useGame.getState().gelEst(li, sz); };
  return (<div className="panelov"><div className="dev wide"><div className="devhead">🔦 Transiluminador (UV) · gel 1,5 % agarosa · recorrido {Math.round(g.T * 100)} % a {g.volt} V</div>
    <canvas ref={cv} width={W} height={H} className="gelc" onClick={onClick} />
    <div className="small">Clic en una banda de la muestra para medir su tamaño con el marcador (escala log) · G: gel nuevo · Esc cierra{g.est ? ` · último: ${Math.round(g.est.size)} pb` : ""}</div>
    <div className="why">💡 Por qué importa: una banda única del tamaño esperado = PCR específica. Bandas extra = hibridación poco estricta; manchón = demasiados ciclos; banda en el control negativo = contaminación.</div></div></div>);
}

export function CfPanel() {
  const s = useGame(); const c = s.cf; const tubes = Object.values(s.items).filter(i => i.loc === "centrifuge");
  useKeys(e => { const x = useGame.getState(); const q = x.cf; if (e.code === "Escape" || e.code === "KeyQ") x.closePanel(); else if (e.code === "ArrowUp") x.setCf({ rpm: q.rpm + 500 }); else if (e.code === "ArrowDown") x.setCf({ rpm: q.rpm - 500 }); else if (e.code === "ArrowRight") x.setCf({ min: q.min + 1 }); else if (e.code === "ArrowLeft") x.setCf({ min: q.min - 1 }); else if (e.code === "Enter") x.startCf(); }, []);
  const pr = c.runStart ? Math.min(1, (s.now - c.runStart) / c.runMs) : 0;
  return (<div className="panelov"><div className="dev"><div className="devhead">🌀 Centrífuga</div>
    <div className="lcd"><div className="vol">{c.rpm} rpm · {c.min} min</div><div className="small">↑↓ rpm (±500) · ←→ minutos · Enter inicia · Esc cierra</div>
      {c.runStart ? <div className="run"><div className="bar"><i style={{ width: `${pr * 100}%` }} /></div>Girando…</div> : <div className="run">{c.last ? `Última: ${c.last}` : "Reposo"}</div>}</div>
    <table className="tbl"><thead><tr><th>Tubo en el rotor</th><th>Volumen</th><th>Estado</th></tr></thead><tbody>{tubes.map(t => <tr key={t.id}><td>{t.label}</td><td>{Math.round(total(t.contents))} µL</td><td>{t.spun ? "pellet" : "—"}</td></tr>)}{!tubes.length && <tr><td>Rotor vacío</td></tr>}</tbody></table>
    <div className="why">💡 Por qué importa: el rotor debe estar balanceado (tubos opuestos con igual peso) o vibra y se daña. La fuerza centrífuga junta las células/precipitado en un pellet y deja el sobrenadante limpio.</div></div></div>);
}
