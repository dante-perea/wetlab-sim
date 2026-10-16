"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import { DIM, SUBS, total, Item, Kind } from "@/lib/game";

/* ---------- materiales PBR ---------- */
export const glass = <meshPhysicalMaterial color="#dff1ff" transparent opacity={0.22} roughness={0.04} metalness={0} clearcoat={1} envMapIntensity={1.6} depthWrite={false} side={THREE.DoubleSide} />;
export const Steel = ({ c = "#c9ced3", r = 0.28 }: { c?: string; r?: number }) => <meshStandardMaterial color={c} metalness={0.92} roughness={r} envMapIntensity={1.2} />;
export const Plastic = ({ c, r = 0.45 }: { c: string; r?: number }) => <meshStandardMaterial color={c} roughness={r} metalness={0.02} />;
export const Emit = ({ c, i = 2 }: { c: string; i?: number }) => <meshStandardMaterial color={c} emissive={c} emissiveIntensity={i} toneMapped={false} />;

export function useCanvasTex(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 256, h = 128, deps: unknown[] = []) {
  const tex = useMemo(() => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d")!; draw(g, w, h); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }, deps); // eslint-disable-line
  return tex;
}
export const Label = ({ text, w, h, pos, rot, bg = "#ffffff", fg = "#111", font = 40, emissive = false }: { text: string; w: number; h: number; pos: [number, number, number]; rot?: [number, number, number]; bg?: string; fg?: string; font?: number; emissive?: boolean }) => {
  const t = useCanvasTex((g, W, H) => { g.fillStyle = bg; g.fillRect(0, 0, W, H); g.fillStyle = fg; g.font = `bold ${font}px system-ui,sans-serif`; g.textAlign = "center"; g.textBaseline = "middle"; text.split("\n").forEach((l, i, a) => g.fillText(l, W / 2, H / 2 + (i - (a.length - 1) / 2) * font * 1.15)); }, 256, 128, [text, bg, fg]);
  return <mesh position={pos} rotation={rot}><planeGeometry args={[w, h]} />{emissive ? <meshBasicMaterial map={t} toneMapped={false} /> : <meshStandardMaterial map={t} roughness={0.6} />}</mesh>;
};

/* ---------- perfiles de revolución ---------- */
type Prof = { outer: (y: number) => number; H: number; use: number };
const PROF: Partial<Record<Kind, Prof>> = {
  tube: { H: 0.1, use: 0.092, outer: y => (y < 0.05 ? 0.0035 + 0.0165 * Math.pow(y / 0.05, 0.9) : 0.02) },
  bottle: { H: 0.17, use: 0.135, outer: y => (y < 0.13 ? 0.05 : y < 0.15 ? 0.05 - (0.028 * (y - 0.13)) / 0.02 : 0.022) },
  flask: { H: 0.16, use: 0.115, outer: y => (y < 0.005 ? 0.06 + y * 2 : y < 0.12 ? 0.07 - 0.048 * ((y - 0.005) / 0.115) : 0.022) },
  cryo: { H: 0.07, use: 0.05, outer: y => (y < 0.015 ? 0.004 + 0.012 * (y / 0.015) : 0.016) },
};
const lathe = (f: (y: number) => number, y0: number, y1: number, n = 14, seg = 28) => { const pts: THREE.Vector2[] = []; for (let i = 0; i <= n; i++) { const y = y0 + ((y1 - y0) * i) / n; pts.push(new THREE.Vector2(Math.max(0.0005, f(y)), y)); } return new THREE.LatheGeometry(pts, seg); };

export function liquidColor(it: Item) {
  const t = total(it.contents); const c = new THREE.Color(0, 0, 0); if (t <= 0) return c.set("#ffffff");
  for (const k in it.contents) c.add(new THREE.Color(SUBS[k]?.color ?? "#fff").multiplyScalar(it.contents[k] / t));
  if (it.contaminated) c.lerp(new THREE.Color("#b6a93a"), 0.7);
  return c;
}
function Liquid({ kind, fill, color, contaminated }: { kind: Kind; fill: number; color: THREE.Color; contaminated: boolean }) {
  const P = PROF[kind]!; const shown = useRef(fill); const mesh = useRef<THREE.Mesh>(null); const built = useRef(-1);
  const build = (f: number) => { const h = Math.max(0.004, P.use * f); const g = lathe(y => P.outer(y) - 0.0016, 0.001, h, 10); if (mesh.current) { mesh.current.geometry.dispose(); mesh.current.geometry = g; mesh.current.visible = f > 0.002; } built.current = f; };
  useEffect(() => { build(shown.current); }, []); // eslint-disable-line
  useFrame((_, dt) => { shown.current += (fill - shown.current) * Math.min(1, dt * 7); if (Math.abs(shown.current - built.current) > 0.003) build(shown.current); });
  return <mesh ref={mesh} geometry={useMemo(() => new THREE.BufferGeometry(), [])}><meshPhysicalMaterial color={color} transparent opacity={contaminated ? 0.92 : 0.78} roughness={0.08} clearcoat={0.6} /></mesh>;
}
const Cap = ({ r, y, c, h = 0.014 }: { r: number; y: number; c: string; h?: number }) => (<group position={[0, y, 0]}><mesh><cylinderGeometry args={[r * 1.08, r * 1.08, h, 28]} /><Plastic c={c} /></mesh><mesh position={[0, h / 2, 0]}><cylinderGeometry args={[r * 0.9, r * 1.04, 0.004, 28]} /><Plastic c={c} /></mesh>
  {Array.from({ length: 14 }).map((_, i) => <mesh key={i} position={[Math.cos((i / 14) * 6.283) * r * 1.09, 0, Math.sin((i / 14) * 6.283) * r * 1.09]}><boxGeometry args={[0.003, h * 0.9, 0.003]} /><Plastic c={c} /></mesh>)}</group>);
const Hit = ({ r, h, y = 0 }: { r: number; h: number; y?: number }) => (<mesh position={[0, y + h / 2, 0]}><cylinderGeometry args={[r + 0.02, r + 0.02, h + 0.04, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>);

export function Pipette({ tip, loaded, loadedFrac, plunger = 0, set }: { tip: boolean; loaded: THREE.Color | null; loadedFrac: number; plunger?: number; set: number }) {
  const body = useMemo(() => lathe(y => (y < 0.06 ? 0.011 + 0.006 * (y / 0.06) : y < 0.2 ? 0.017 - 0.002 * ((y - 0.06) / 0.14) : 0.015), 0, 0.26, 16), []);
  const lab = useMemo(() => `${String(set).padStart(4, "0")}`, [set]);
  return (<group>
    <mesh geometry={body} position={[0, 0.07, 0]}><Plastic c="#f2f2f0" r={0.3} /></mesh>
    <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.009, 0.0055, 0.06, 14]} /><Steel c="#8c949b" /></mesh>
    <mesh position={[0, 0.2, 0.0]}><cylinderGeometry args={[0.0185, 0.0185, 0.05, 20]} /><Plastic c="#2f6fd0" /></mesh>
    <mesh position={[0, 0.34 - plunger * 0.012, 0]}><cylinderGeometry args={[0.009, 0.009, 0.04, 14]} /><Plastic c="#e8e8e8" /></mesh>
    <mesh position={[0, 0.363 - plunger * 0.012, 0]}><cylinderGeometry args={[0.012, 0.012, 0.012, 14]} /><Plastic c="#d03030" /></mesh>
    <mesh position={[0.019, 0.17, 0]}><boxGeometry args={[0.006, 0.07, 0.012]} /><Plastic c="#cfcfcf" /></mesh>
    <Label text={lab} w={0.026} h={0.02} pos={[0, 0.255, 0.0175]} bg="#0f1a12" fg="#7dff9a" font={56} emissive />
    {tip && (<group position={[0, 0.0, 0]}>
      <mesh position={[0, -0.02, 0]}><cylinderGeometry args={[0.0075, 0.0018, 0.085, 14]} />{glass}</mesh>
      {loadedFrac > 0.001 && loaded && <mesh position={[0, -0.0525 + 0.04 * Math.min(1, loadedFrac) * 0.5 + 0.005, 0]}><cylinderGeometry args={[0.0042 + 0.0025 * Math.min(1, loadedFrac), 0.0016, 0.04 * Math.min(1, loadedFrac) + 0.006, 12]} /><meshStandardMaterial color={loaded} transparent opacity={0.9} /></mesh>}
    </group>)}
    <Hit r={0.03} h={0.38} y={-0.05} /></group>);
}

export function ItemMesh({ item, tip, loaded, loadedFrac = 0, plunger = 0, set = 200 }: { item: Item; tip?: boolean; loaded?: THREE.Color | null; loadedFrac?: number; plunger?: number; set?: number }) {
  const col = useMemo(() => liquidColor(item), [item]); const fill = item.cap ? Math.min(1, total(item.contents) / item.cap) : 0;
  const k = item.kind; const P = PROF[k as Kind];
  const outer = useMemo(() => (P ? lathe(P.outer, 0, P.H, 16) : null), [k]); // eslint-disable-line
  const warn = item.contaminated && (<>{[0, 1, 2, 3, 4, 5, 6].map(i => (<mesh key={i} position={[Math.cos(i * 1.9) * 0.012, 0.02 + i * 0.012, Math.sin(i * 1.9) * 0.012]}><sphereGeometry args={[0.0045, 8, 8]} /><meshStandardMaterial color="#7a8f1a" emissive="#4a5a05" emissiveIntensity={0.6} /></mesh>))}<mesh position={[0, DIM[k].h + 0.07, 0]}><sphereGeometry args={[0.011, 10, 10]} /><Emit c="#ff3b30" i={2.5} /></mesh></>);
  if (k === "pipette") return <Pipette tip={!!tip} loaded={loaded ?? null} loadedFrac={loadedFrac} plunger={plunger} set={set} />;
  if (k === "ethanol") return (<group>
    <mesh position={[0, 0.095, 0]}><cylinderGeometry args={[0.036, 0.04, 0.19, 24]} /><Plastic c="#f7f7f7" r={0.3} /></mesh>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.018, 0.026, 0.03, 20]} /><Plastic c="#2f6fd0" /></mesh>
    <mesh position={[0.02, 0.225, 0]}><boxGeometry args={[0.07, 0.03, 0.03]} /><Plastic c="#2f6fd0" /></mesh>
    <mesh position={[0.03, 0.195, 0]} rotation={[0, 0, -0.5]}><boxGeometry args={[0.008, 0.045, 0.02]} /><Plastic c="#1a4a9a" /></mesh>
    <Label text={"ETANOL\n70 %"} w={0.05} h={0.08} pos={[0, 0.09, 0.0405]} bg="#ffffff" fg="#c0392b" font={34} /><Hit r={0.04} h={0.24} /></group>);
  if (k === "cflask") return (<group>
    <mesh position={[0, 0.0175, 0]}><boxGeometry args={[0.15, 0.035, 0.09]} />{glass}</mesh>
    {fill > 0 && <mesh position={[0, 0.003 + 0.012 * Math.min(1, fill * 2), 0]}><boxGeometry args={[0.144, 0.006 + 0.024 * Math.min(1, fill * 2), 0.084]} /><meshPhysicalMaterial color={col} transparent opacity={0.82} roughness={0.1} /></mesh>}
    <mesh position={[0.088, 0.02, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.014, 0.014, 0.03, 18]} /><Plastic c="#2b64d8" /></mesh>
    <Label text="T25" w={0.04} h={0.02} pos={[-0.03, 0.0357, 0]} rot={[-Math.PI / 2, 0, 0]} bg="#fff" font={52} />
    {item.contaminated && <mesh position={[0, 0.07, 0]}><sphereGeometry args={[0.011, 10, 10]} /><Emit c="#ff3b30" i={2.5} /></mesh>}
    <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.17, 0.05, 0.11]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh></group>);
  if (k === "hemo") return (<group>
    <mesh position={[0, 0.004, 0]}><boxGeometry args={[0.075, 0.008, 0.032]} />{glass}</mesh>
    <mesh position={[0, 0.0085, 0]}><boxGeometry args={[0.03, 0.0008, 0.02]} /><meshStandardMaterial color="#9fd0c9" metalness={0.6} roughness={0.3} /></mesh>
    {item.cells > 0 && <mesh position={[0, 0.0095, 0]}><boxGeometry args={[0.028, 0.0008, 0.018]} /><meshStandardMaterial color="#3a6ea5" transparent opacity={0.7} /></mesh>}
    <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.1, 0.05, 0.07]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh></group>);
  const cap = k === "tube" ? "#f0f0f0" : k === "bottle" ? (item.id === "tripan" ? "#1b2a9a" : item.id === "stock" ? "#c43a3a" : item.id === "sfb" ? "#d8a438" : "#2b64d8") : k === "cryo" ? "#d03030" : "#f4b400";
  const d = DIM[k]; const fr = k === "tube" ? 0.014 : 0.016;
  return (<group>
    {outer && <mesh geometry={outer}>{glass}</mesh>}
    {fill > 0 && P && <Liquid kind={k} fill={Math.min(1, Math.sqrt(fill) * (k === "tube" ? 0.9 : 1))} color={col} contaminated={item.contaminated} />}
    {k === "tube" && <><Cap r={0.02} y={d.h + 0.003} c={cap} h={0.012} /><mesh position={[0.022, d.h, 0]}><boxGeometry args={[0.012, 0.01, 0.014]} /><Plastic c={cap} /></mesh>
      <Label text={item.id.replace("tube", "")} w={0.026} h={0.026} pos={[0, 0.07, 0.0204]} bg="#fff" font={90} /></>}
    {(k === "bottle" || k === "flask") && <><Cap r={k === "bottle" ? 0.024 : 0.024} y={d.h + 0.004} c={cap} h={0.018} />
      <Label text={item.id === "pbs" ? "PBS" : item.id === "medio" ? "DMEM\n+ rojo fenol" : item.id === "sfb" ? "SFB" : item.id === "stock" ? "STOCK\n10 mg/mL" : item.id === "tripan" ? "TRIPÁN\n0,4 %" : item.label} w={0.07} h={0.06} pos={[0, 0.07, k === "bottle" ? 0.0505 : 0.052]} rot={k === "flask" ? [-0.38, 0, 0] : [0, 0, 0]} font={34} /></>}
    {k === "cryo" && <><Cap r={0.016} y={d.h + 0.005} c={cap} h={0.012} />{item.frozen && <mesh position={[0, 0.03, 0]}><cylinderGeometry args={[0.0125, 0.0105, 0.04, 14]} /><meshStandardMaterial color="#e9f6ff" emissive="#9fd6ff" emissiveIntensity={0.2} roughness={0.9} /></mesh>}<Label text="HeLa\np12" w={0.02} h={0.02} pos={[0, 0.04, 0.0162]} font={40} /></>}
    {warn}{void fr}
    <Hit r={d.r} h={d.h} /></group>);
}

/* ---------- equipo ---------- */
export function Incubator({ ready }: { ready: boolean }) {
  const S = <Steel c="#b5bcc2" r={0.38} />;
  return (<group>
    <mesh position={[0, 0.65, -0.4]}><boxGeometry args={[0.84, 1.3, 0.04]} />{S}</mesh>
    {[-0.4, 0.4].map(x => <mesh key={x} position={[x, 0.65, 0]}><boxGeometry args={[0.04, 1.3, 0.84]} />{S}</mesh>)}
    <mesh position={[0, 1.28, 0]}><boxGeometry args={[0.84, 0.04, 0.84]} />{S}</mesh><mesh position={[0, 0.03, 0]}><boxGeometry args={[0.84, 0.06, 0.84]} />{S}</mesh>
    <mesh position={[0, 0.65, 0.0]} raycast={() => null}><boxGeometry args={[0.76, 1.2, 0.76]} /><meshStandardMaterial color="#d9dee1" roughness={0.5} side={THREE.BackSide} /></mesh>
    <mesh position={[0, 0.62, 0.41]} raycast={() => null}><boxGeometry args={[0.72, 0.9, 0.02]} /><meshPhysicalMaterial color="#cfe9ff" transparent opacity={0.22} roughness={0.05} clearcoat={1} depthWrite={false} /></mesh>
    {[[0, 1.085, 0.41, 0.8, 0.03], [0, 0.155, 0.41, 0.8, 0.03]].map((f, i) => <mesh key={i} position={[f[0], f[1], f[2]]}><boxGeometry args={[f[3], f[4], 0.03]} /><Steel c="#8d959b" /></mesh>)}
    {[-0.37, 0.37].map(x => <mesh key={x} position={[x, 0.62, 0.41]}><boxGeometry args={[0.06, 0.95, 0.03]} /><Steel c="#8d959b" /></mesh>)}
    {[0.38, 0.62, 0.86].map(y => <mesh key={y} position={[0, y, -0.02]} raycast={() => null}><boxGeometry args={[0.7, 0.012, 0.72]} /><Steel c="#dfe3e6" r={0.2} /></mesh>)}
    <mesh position={[0.34, 0.62, 0.44]}><boxGeometry args={[0.018, 0.34, 0.03]} /><Steel c="#6c757b" /></mesh>
    <mesh position={[0, 1.2, 0.42]}><boxGeometry args={[0.7, 0.1, 0.02]} /><meshStandardMaterial color="#0b0f0d" roughness={0.3} /></mesh>
    <Label text={"37.0 °C   CO₂ 5.0 %"} w={0.46} h={0.07} pos={[-0.06, 1.2, 0.432]} bg="#06130b" fg="#6dff9b" font={34} emissive />
    <mesh position={[0.28, 1.2, 0.432]}><circleGeometry args={[0.014, 12]} /><Emit c={ready ? "#27d36a" : "#f0b020"} i={2} /></mesh>
    <pointLight position={[0, 0.9, 0.1]} intensity={0.6} distance={1.2} color="#fff4e0" />
  </group>);
}
export function Microscope({ lit }: { lit: boolean }) {
  return (<group>
    <RoundedBox args={[0.26, 0.04, 0.34]} radius={0.012} smoothness={3} position={[0, 0.02, 0]}><Plastic c="#22272b" r={0.35} /></RoundedBox>
    <mesh position={[0, 0.07, 0.05]}><cylinderGeometry args={[0.035, 0.045, 0.05, 20]} /><Plastic c="#2d3338" /></mesh>
    <mesh position={[0, 0.095, 0.05]}><circleGeometry args={[0.025, 20]} /><Emit c={lit ? "#fff6d0" : "#555"} i={lit ? 3 : 0.1} /></mesh>
    <RoundedBox args={[0.06, 0.36, 0.07]} radius={0.015} smoothness={3} position={[0, 0.2, -0.12]}><Plastic c="#e9ebee" r={0.3} /></RoundedBox>
    <RoundedBox args={[0.06, 0.07, 0.2]} radius={0.015} smoothness={3} position={[0, 0.375, -0.04]}><Plastic c="#e9ebee" r={0.3} /></RoundedBox>
    <mesh position={[0, 0.245, 0.04]}><boxGeometry args={[0.16, 0.012, 0.15]} /><Steel c="#2a2f33" r={0.4} /></mesh>
    <mesh position={[0, 0.2, 0.04]} rotation={[0, 0, 0]}><boxGeometry args={[0.1, 0.02, 0.12]} /><Steel c="#4a5258" /></mesh>
    <mesh position={[0, 0.254, 0.04]}><boxGeometry args={[0.035, 0.002, 0.035]} />{glass}</mesh>
    {[-0.4, 0, 0.4].map((a, i) => (<mesh key={i} position={[Math.sin(a) * 0.028, 0.33, 0.045 + Math.cos(a) * 0.018 - 0.018]} rotation={[0, 0, a * 0.3]}><cylinderGeometry args={[0.009 + i * 0.002, 0.007, 0.06 + i * 0.01, 14]} /><Steel c="#9aa2a8" /></mesh>))}
    <mesh position={[0, 0.34, 0.045]}><cylinderGeometry args={[0.045, 0.045, 0.02, 24]} /><Plastic c="#22272b" /></mesh>
    {[-0.025, 0.025].map(x => <mesh key={x} position={[x, 0.46, 0.0]} rotation={[-0.5, 0, 0]}><cylinderGeometry args={[0.018, 0.016, 0.12, 16]} /><Plastic c="#22272b" /></mesh>)}
    {[-0.025, 0.025].map(x => <mesh key={x} position={[x, 0.53, 0.05]} rotation={[-0.5, 0, 0]}><cylinderGeometry args={[0.021, 0.021, 0.025, 16]} /><Steel c="#111" /></mesh>)}
    {[-1, 1].map(s => <mesh key={s} position={[s * 0.04, 0.13, -0.1]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.028, 0.028, 0.025, 20]} /><Plastic c="#4a5258" r={0.5} /></mesh>)}
  </group>);
}
export function Hood({ on, ready, clean }: { on: boolean; ready: boolean; clean: boolean }) {
  return (<group>
    <mesh position={[0, 1.35, -4.47]}><boxGeometry args={[2.4, 0.9, 0.06]} /><Steel c="#d5dadd" r={0.35} /></mesh>
    {[-1.17, 1.17].map(x => <group key={x}><mesh position={[x, 1.35, -4.0]}><boxGeometry args={[0.06, 0.9, 1.0]} /><Steel c="#d5dadd" r={0.35} /></mesh><mesh position={[x * 0.985, 1.35, -3.98]} raycast={() => null}><boxGeometry args={[0.004, 0.84, 0.9]} />{glass}</mesh></group>)}
    <mesh position={[0, 1.83, -4.0]}><boxGeometry args={[2.4, 0.06, 1.0]} /><Steel c="#b9c0c5" /></mesh>
    <RoundedBox args={[2.4, 0.23, 0.12]} radius={0.015} smoothness={3} position={[0, 1.72, -3.47]}><Plastic c="#e8ecee" r={0.35} /></RoundedBox>
    <mesh position={[0, 1.5, -3.5]} raycast={() => null}><boxGeometry args={[2.3, 0.3, 0.012]} />{glass}</mesh>
    <mesh position={[0, 1.34, -3.5]}><boxGeometry args={[2.34, 0.03, 0.04]} /><Steel c="#8a959d" /></mesh>
    <mesh position={[0, 1.74, -4.0]} raycast={() => null}><boxGeometry args={[2.0, 0.015, 0.2]} /><Emit c={on ? "#e8f6ff" : "#556"} i={on ? 3 : 0.2} /></mesh>
    <mesh position={[0, 0.905, -3.62]} raycast={() => null}><boxGeometry args={[2.2, 0.012, 0.08]} /><meshStandardMaterial color="#1b1f22" roughness={0.6} /></mesh>
    <mesh position={[0, 0.905, -4.42]} raycast={() => null}><boxGeometry args={[2.2, 0.012, 0.08]} /><meshStandardMaterial color="#1b1f22" roughness={0.6} /></mesh>
    <mesh position={[0, 0.9035, -4.0]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}><planeGeometry args={[2.2, 0.72]} /><meshStandardMaterial color={clean ? "#e4f2fb" : "#b9bfc4"} metalness={0.55} roughness={clean ? 0.14 : 0.35} envMapIntensity={1.3} /></mesh>
    <Label text={"FLUJO LAMINAR\nCLASE II · HEPA"} w={0.5} h={0.09} pos={[-0.55, 1.72, -3.405]} bg="#0b1520" fg="#7ec8ff" font={24} emissive />
    <mesh position={[-0.12, 1.72, -3.405]}><circleGeometry args={[0.012, 12]} /><Emit c={!on ? "#d02020" : ready ? "#27d36a" : "#f0b020"} i={2.5} /></mesh>
  </group>);
}
export function TipBox() {
  const pts = useMemo(() => { const a: [number, number][] = []; for (let i = 0; i < 8; i++) for (let j = 0; j < 4; j++) a.push([-0.07 + i * 0.02, -0.04 + j * 0.025 + 0.01]); return a; }, []);
  return (<group>
    <mesh position={[0, 0.025, 0]}><boxGeometry args={[0.18, 0.05, 0.12]} /><Plastic c="#3aa89c" /></mesh>
    <mesh position={[0, 0.0505, 0]}><boxGeometry args={[0.172, 0.002, 0.112]} /><Plastic c="#e9fffb" /></mesh>
    {pts.map(([x, z], i) => <mesh key={i} position={[x, 0.07, z]}><cylinderGeometry args={[0.0058, 0.0014, 0.045, 8]} />{glass}</mesh>)}
    <mesh position={[0, 0.07, 0.07]} rotation={[0.2, 0, 0]}><boxGeometry args={[0.18, 0.005, 0.04]} /><Plastic c="#2f8d83" /></mesh>
    <mesh position={[0, 0.1, 0]}><boxGeometry args={[0.2, 0.1, 0.14]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>
  </group>);
}
export function Waste() {
  return (<group><mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.1, 0.085, 0.18, 24, 1, true]} /><meshStandardMaterial color="#d8431f" roughness={0.5} side={THREE.DoubleSide} /></mesh>
    <mesh position={[0, 0.002, 0]}><cylinderGeometry args={[0.085, 0.085, 0.004, 24]} /><Plastic c="#a8341a" /></mesh>
    <Label text="☣ BIO" w={0.1} h={0.05} pos={[0, 0.09, 0.0985]} bg="#d8431f" fg="#111" font={50} />
    <mesh position={[0, 0.1, 0]}><cylinderGeometry args={[0.11, 0.11, 0.22, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh></group>);
}
export function Bath({ running }: { running: boolean }) {
  return (<group>
    <RoundedBox args={[0.4, 0.1, 0.3]} radius={0.01} smoothness={3} position={[0, 0.05, 0]}><Steel c="#c4cacf" r={0.3} /></RoundedBox>
    <mesh position={[0, 0.099, 0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[0.35, 0.25]} /><meshPhysicalMaterial color="#3b8fd0" transparent opacity={0.85} roughness={0.05} clearcoat={1} /></mesh>
    <Label text={running ? "37.0 °C" : "OFF"} w={0.12} h={0.04} pos={[0.12, 0.05, 0.1505]} bg="#06130b" fg="#6dff9b" font={46} emissive />
  </group>);
}
export function Centrifuge() {
  return (<group><RoundedBox args={[0.5, 0.22, 0.46]} radius={0.04} smoothness={4} position={[0, 0.11, 0]}><Plastic c="#eef1f3" r={0.3} /></RoundedBox>
    <mesh position={[0, 0.235, 0]}><sphereGeometry args={[0.2, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2]} /><meshPhysicalMaterial color="#9fb5c4" transparent opacity={0.55} roughness={0.1} clearcoat={1} /></mesh>
    <Label text="CENTRÍFUGA" w={0.22} h={0.035} pos={[0, 0.07, 0.2325]} bg="#20262b" fg="#9fd0ff" font={28} emissive /></group>);
}
export function Thermocycler() {
  return (<group><RoundedBox args={[0.38, 0.14, 0.36]} radius={0.02} smoothness={4} position={[0, 0.07, 0]}><Plastic c="#2b3036" r={0.35} /></RoundedBox>
    <mesh position={[0, 0.15, -0.02]}><boxGeometry args={[0.28, 0.025, 0.2]} /><Steel c="#8b949a" /></mesh>
    <Label text={"PCR  95 °C\nCiclo 0/30"} w={0.12} h={0.05} pos={[0.1, 0.09, 0.1805]} bg="#06130b" fg="#6dff9b" font={24} emissive /></group>);
}
export function GelBox() {
  return (<group><mesh position={[0, 0.03, 0]}><boxGeometry args={[0.26, 0.06, 0.18]} />{glass}</mesh>
    <mesh position={[0, 0.02, 0]}><boxGeometry args={[0.2, 0.016, 0.12]} /><meshPhysicalMaterial color="#c9f0d8" transparent opacity={0.7} /></mesh>
    <mesh position={[0.13, 0.065, 0.05]}><cylinderGeometry args={[0.005, 0.005, 0.02, 8]} /><Emit c="#d02020" i={1} /></mesh><mesh position={[0.13, 0.065, -0.05]}><cylinderGeometry args={[0.005, 0.005, 0.02, 8]} /><meshStandardMaterial color="#222" /></mesh></group>);
}
export function Coat() {
  return (<group><mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.025, 0.03, 1.8, 12]} /><Steel c="#6b7278" /></mesh>
    <mesh position={[0, 0.02, 0]}><cylinderGeometry args={[0.2, 0.22, 0.04, 20]} /><Steel c="#454b50" /></mesh>
    {[0, 1, 2, 3].map(i => <mesh key={i} position={[Math.cos(i * 1.57) * 0.1, 1.78, Math.sin(i * 1.57) * 0.1]} rotation={[0, 0, 0]}><sphereGeometry args={[0.02, 8, 8]} /><Steel c="#6b7278" /></mesh>)}
    <RoundedBox args={[0.42, 0.78, 0.14]} radius={0.04} smoothness={3} position={[0.16, 1.32, 0]}><meshStandardMaterial color="#f7f8f8" roughness={0.85} /></RoundedBox>
    {[-1, 1].map(s => <RoundedBox key={s} args={[0.12, 0.62, 0.12]} radius={0.04} smoothness={3} position={[0.16 + s * 0.27, 1.33, 0]} rotation={[0, 0, s * 0.08]}><meshStandardMaterial color="#f7f8f8" roughness={0.85} /></RoundedBox>)}
    <mesh position={[0.16, 1.6, 0.075]}><boxGeometry args={[0.18, 0.05, 0.01]} /><meshStandardMaterial color="#f7f8f8" roughness={0.85} /></mesh>
    <mesh position={[0.1, 0.55, 0.12]}><boxGeometry args={[0.2, 0.12, 0.14]} /><Plastic c="#4aa3ff" /></mesh>
    <Label text={"GUANTES\nNITRILO"} w={0.16} h={0.08} pos={[0.1, 0.55, 0.1915]} bg="#4aa3ff" fg="#fff" font={26} /></group>);
}
