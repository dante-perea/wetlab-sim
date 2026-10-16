"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useGame, total, FLASK_AREA, CONF_100 } from "@/lib/game";

function rng(seed: number) { let a = seed >>> 0; return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
type Cell = { x: number; y: number; r: number; rot: number; sx: number; off: number; div: boolean };

function Adherent({ n }: { n: number }) {
  const cells = useMemo<Cell[]>(() => { const R = rng(1234); return Array.from({ length: 170 }, () => { const a = R() * 6.283, d = Math.sqrt(R()) * 8.4; return { x: Math.cos(a) * d, y: Math.sin(a) * d, r: 0.5 + R() * 0.25, rot: R() * 3.14, sx: 1.2 + R() * 0.7, off: R() * 12, div: R() < 0.12 }; }); }, []);
  const refs = useRef<(THREE.Group | null)[]>([]);
  useFrame(st => { const t = st.clock.elapsedTime; cells.forEach((c, i) => { const g = refs.current[i]; if (!g) return; g.visible = i < n; if (i >= n) return;
    const ph = c.div ? ((t + c.off) % 12) / 12 : -1; const [body, nuc, body2, nuc2] = g.children as THREE.Mesh[];
    let sep = 0, round = 0; if (ph >= 0) { if (ph < 0.3) round = ph / 0.3; else if (ph < 0.6) { round = 1; sep = (ph - 0.3) / 0.3; } else if (ph < 0.85) { round = 1 - (ph - 0.6) / 0.25; sep = 1; } }
    const sx = c.sx * (1 - round) + 1 * round; body.scale.set(c.r * sx * (1 + sep * 0.2), c.r * (1 - 0.1 * round), c.r * 0.6); nuc.scale.setScalar(c.r * (0.5 - sep * 0.15)); body.position.x = -sep * c.r * 0.9; nuc.position.x = body.position.x;
    body2.visible = nuc2.visible = sep > 0.05; body2.scale.copy(body.scale); body2.position.x = sep * c.r * 0.9; nuc2.scale.copy(nuc.scale); nuc2.position.x = body2.position.x; g.rotation.z = c.rot; g.position.set(c.x, c.y, 0); }); });
  return (<>{cells.map((c, i) => (<group key={i} ref={el => { refs.current[i] = el; }}>
    <mesh><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#c9ccd0" transparent opacity={0.55} roughness={0.5} emissive="#8d9298" emissiveIntensity={0.25} /></mesh>
    <mesh position={[0, 0, 0.05]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#4b4f55" roughness={0.8} /></mesh>
    <mesh><sphereGeometry args={[1, 24, 16]} /><meshStandardMaterial color="#c9ccd0" transparent opacity={0.55} emissive="#8d9298" emissiveIntensity={0.25} /></mesh>
    <mesh position={[0, 0, 0.05]}><sphereGeometry args={[1, 16, 12]} /><meshStandardMaterial color="#4b4f55" /></mesh></group>))}</>);
}
function Bact({ round = false }: { round?: boolean }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]); const pts = useMemo(() => { const R = rng(99); return Array.from({ length: 90 }, () => ({ x: (R() - 0.5) * 16, y: (R() - 0.5) * 16, a: R() * 6.28, v: 0.3 + R() * 0.8, p: R() * 10 })); }, []);
  useFrame(st => { const t = st.clock.elapsedTime; pts.forEach((b, i) => { const m = refs.current[i]; if (!m) return; const a = b.a + Math.sin(t * 0.7 + b.p) * 2.2; m.position.set(((b.x + Math.cos(a) * b.v * t * 0.5 + 9) % 18) - 9, ((b.y + Math.sin(a) * b.v * t * 0.5 + 9) % 18) - 9, 0.2); m.rotation.z = a; }); });
  return (<>{pts.map((_, i) => <mesh key={i} ref={el => { refs.current[i] = el; }}>{round ? <sphereGeometry args={[0.32, 16, 12]} /> : <capsuleGeometry args={[0.08, 0.22, 4, 8]} />}<meshStandardMaterial color={round ? "#e8ecef" : "#d9e07a"} emissive={round ? "#9aa3aa" : "#9aa030"} emissiveIntensity={0.6} /></mesh>)}</>);
}
const SQ = 4.2; const CENTERS: [number, number][] = [[-2.4, 2.4], [2.4, 2.4], [-2.4, -2.4], [2.4, -2.4]];
function Hemo({ live, dead, marks, onMark }: { live: number[][]; dead: number[][]; marks: Set<string>; onMark: (k: string) => void }) {
  const lines = useMemo(() => { const p: number[] = []; const add = (a: number, b: number, c: number, d: number) => p.push(a, b, 0.02, c, d, 0.02); CENTERS.forEach(([cx, cy]) => { const h = SQ / 2; add(cx - h, cy - h, cx + h, cy - h); add(cx + h, cy - h, cx + h, cy + h); add(cx + h, cy + h, cx - h, cy + h); add(cx - h, cy + h, cx - h, cy - h); }); for (let i = -6; i <= 6; i += 1.2) { add(i, -6.5, i, 6.5); add(-6.5, i, 6.5, i); } return new Float32Array(p); }, []);
  return (<>
    <mesh position={[0, 0, -0.1]}><planeGeometry args={[14, 14]} /><meshStandardMaterial color="#8b939a" roughness={0.9} /></mesh>
    <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[lines, 3]} /></bufferGeometry><lineBasicMaterial color="#e8edf0" /></lineSegments>
    {CENTERS.map(([cx, cy], q) => (<mesh key={q} position={[cx, cy, 0.01]}><planeGeometry args={[SQ, SQ]} /><meshBasicMaterial color="#ffffff" transparent opacity={0.12} /></mesh>))}
    {live.map((c, i) => { const k = `l${i}`; return (<group key={k} position={[c[0], c[1], 0.1]}>
      <mesh><circleGeometry args={[0.2, 20]} /><meshBasicMaterial color="#fbfbf6" /></mesh><mesh position={[0, 0, 0.01]}><ringGeometry args={[0.17, 0.23, 20]} /><meshBasicMaterial color="#3a4147" /></mesh>
      {marks.has(k) && <mesh position={[0, 0, 0.03]}><ringGeometry args={[0.24, 0.32, 20]} /><meshBasicMaterial color="#1fbf5b" /></mesh>}</group>); })}
    {dead.map((c, i) => { const k = `d${i}`; return (<group key={k} position={[c[0], c[1], 0.1]}>
      <mesh><circleGeometry args={[0.2, 20]} /><meshStandardMaterial color="#27449e" emissive="#1a2f80" emissiveIntensity={0.4} /></mesh>{marks.has(k) && <mesh position={[0, 0, 0.03]}><ringGeometry args={[0.24, 0.32, 20]} /><meshBasicMaterial color="#1fbf5b" /></mesh>}</group>); })}
  </>);
}
export default function Micro() {
  const s = useGame(); const stage = Object.values(s.items).find(i => i.loc === "scope");
  const [focus, setFocus] = useState(0.38); const [zoom, setZoom] = useState(1); const [marks, setMarks] = useState<Set<string>>(new Set()); const ideal = 0.55;
  const conf = stage?.kind === "cflask" ? Math.min(1, stage.cells / FLASK_AREA / CONF_100) : 0;
  const hemo = useMemo(() => {
    if (!stage || stage.kind !== "hemo") return null; const vol = Math.max(1, total(stage.contents)); const per = ((stage.cells * (stage.via ?? s.viab)) / vol) * 0.1; const perD = ((stage.cells * (1 - (stage.via ?? s.viab))) / vol) * 0.1;
    const R = rng(Math.floor(stage.cells) + 7); const mk = (n: number) => CENTERS.flatMap(([cx, cy]) => Array.from({ length: Math.min(70, Math.max(0, Math.round(n + (R() - 0.5) * 2 * Math.sqrt(n)))) }, () => [cx + (R() - 0.5) * (SQ - 0.5), cy + (R() - 0.5) * (SQ - 0.5)]));
    return { live: mk(per), dead: mk(perD) };
  }, [stage?.id, stage?.cells]); // eslint-disable-line
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if (e.code === "Escape" || e.code === "KeyQ") { useGame.getState().setScope(false); }
      else if (e.code === "Digit1") setZoom(0.7); else if (e.code === "Digit2") setZoom(1); else if (e.code === "Digit3") setZoom(1.7);
      else if (e.code === "Enter" && hemo) { const L = [...marks].filter(k => k[0] === "l").length, D = [...marks].filter(k => k[0] === "d").length; const tot = Math.max(1e-9, hemo.live.length + hemo.dead.length); const st = Object.values(useGame.getState().items).find(i => i.loc === "scope"); const c = st?.contents ?? {}; const t = Math.max(1, total(c)); const fac = t / Math.max(1, t - (c.tripan ?? 0)); useGame.getState().submitCount(L / 4, hemo.live.length / 4, fac, D + L > 0 ? { est: L / (L + D), truth: hemo.live.length / tot } : undefined); }
      else if (e.code === "ArrowUp") setFocus(f => Math.min(1, f + 0.03)); else if (e.code === "ArrowDown") setFocus(f => Math.max(0, f - 0.03));
    };
    const wh = (e: WheelEvent) => setFocus(f => Math.max(0, Math.min(1, f + (e.deltaY > 0 ? -0.03 : 0.03))));
    window.addEventListener("keydown", kd); window.addEventListener("wheel", wh); return () => { window.removeEventListener("keydown", kd); window.removeEventListener("wheel", wh); };
  }, [hemo, marks]); // eslint-disable-line
  useEffect(() => { (window as any).__scope = { live: hemo?.live ?? [], zoom }; }, [hemo, zoom]);
  const blur = Math.abs(focus - ideal) * 26;
  const floating = stage?.kind === "cflask" && stage.detached && (stage.contents.tripsina ?? 0) > 100; const n = Math.round(conf * 170);
  const toggle = (k: string) => setMarks(m => { const x = new Set(m); x.has(k) ? x.delete(k) : x.add(k); return x; });
  return (<div className="scope">
    <div className="eyepiece" style={{ filter: `blur(${blur.toFixed(1)}px)` }} onPointerDown={e => { if (!hemo) return; const r = e.currentTarget.getBoundingClientRect(); const x = (e.clientX - (r.left + r.width / 2)) / (62 * zoom), y = -(e.clientY - (r.top + r.height / 2)) / (62 * zoom); let best = "", bd = 0.3; hemo.live.forEach((c, i) => { const d = Math.hypot(c[0] - x, c[1] - y); if (d < bd) { bd = d; best = `l${i}`; } }); hemo.dead.forEach((c, i) => { const d = Math.hypot(c[0] - x, c[1] - y); if (d < bd) { bd = d; best = `d${i}`; } }); if (best) toggle(best); }}>
      <Canvas orthographic camera={{ zoom: 62 * zoom, position: [0, 0, 10] }} dpr={[1, 1.5]} gl={{ antialias: true }}>
        <color attach="background" args={["#8b939a"]} /><ambientLight intensity={1.4} /><directionalLight position={[2, 3, 6]} intensity={1.6} />
        {stage?.kind === "cflask" && !floating && <Adherent n={n} />}{floating && <Bact round />}{stage?.kind === "cflask" && stage.contaminated && <Bact />}{hemo && <Hemo live={hemo.live} dead={hemo.dead} marks={marks} onMark={toggle} />}
      </Canvas></div>
    <div className="scopeinfo"><b>🔬 Microscopio</b> · {stage?.kind === "cflask" ? `Frasco T25 · confluencia ${(conf * 100).toFixed(0)} %` : "Cámara de Neubauer"}
      <div className="small">Rueda/↑↓ enfoque (nítido ≈ {(blur < 3 ? "✓ enfocado" : "borroso")}) · 1/2/3 aumento · Q/Esc cerrar{hemo ? " · clic: marcar célula viva · Enter: terminar conteo" : ""}</div>
      {stage?.kind === "cflask" && <div className="small">💡 Por qué importa: ver la forma, la densidad y los «redondos brillantes» (células dividiéndose) te dice cuándo pasar el cultivo y si hay contaminación. Busca puntitos que se mueven por su cuenta (bacterias) o hilos (hongos).</div>}
      {hemo && <div className="small">💡 Por qué importa: contar con exactitud permite sembrar el mismo número de células siempre. Azul = muertas (no cuentan). Marcadas: {marks.size} · media/cuadrante {(marks.size / 4).toFixed(1)}{!hemo.live.length && " · (la cámara está vacía: carga 10 µL de la mezcla)"}</div>}
      {s.lastCount && hemo && <div className="small">Último conteo: media {s.lastCount.mean.toFixed(1)} → {s.lastCount.conc.toExponential(2)} células/mL {s.lastCount.ok ? "✓" : "✗"}</div>}</div>
  </div>);
}
