"use client";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls, Environment, RoundedBox, PerformanceMonitor } from "@react-three/drei";
import { Physics, RigidBody, CuboidCollider, CylinderCollider, RapierRigidBody } from "@react-three/rapier";
import { EffectComposer, Bloom, ToneMapping, SMAA, Vignette, N8AO } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";
import { useGame, initialItems, DIM, SUBS, total, aimRef, livePos, hoodReady, FIXED, MISSIONS, getPos, TIPBOX_POS, HIDDEN } from "@/lib/game";
import { sfx } from "@/lib/sound";
import { ItemMesh, Incubator, Microscope, Hood, TipBox, Waste, Bath, Centrifuge, Thermocycler, GelBox, Freezer, Coat, Steel, Plastic, Label, useCanvasTex } from "./models";

const pickables = new Set<THREE.Object3D>();
function useReg(ref: React.RefObject<THREE.Object3D | null>, deps: unknown[] = []) { useEffect(() => { const o = ref.current; if (o) pickables.add(o); return () => { if (o) pickables.delete(o); }; }, deps); } // eslint-disable-line
const IDS = Object.keys(initialItems());
const motion = { speed: 0 };
const heldRef: { g: THREE.Object3D | null } = { g: null };

const COLL: { p: [number, number, number]; h: [number, number, number] }[] = [
  { p: [0, -0.1, 0], h: [6, 0.1, 5] }, { p: [0.2, 0.45, -3.9], h: [4.8, 0.45, 0.6] }, { p: [-5.5, 0.45, 0.1], h: [0.4, 0.45, 2.4] }, { p: [5.5, 0.45, 0.1], h: [0.4, 0.45, 2.4] },
  { p: [0, 1.35, -4.47], h: [1.2, 0.45, 0.03] }, { p: [-1.17, 1.35, -4.0], h: [0.03, 0.45, 0.5] }, { p: [1.17, 1.35, -4.0], h: [0.03, 0.45, 0.5] }, { p: [0, 1.83, -4.0], h: [1.2, 0.03, 0.5] },
  { p: [5.45, 0.5, 3.7], h: [0.37, 0.5, 0.42] }, { p: [-5.3, 0.65, -4.0], h: [0.42, 0.65, 0.42] }, { p: [0, 1.5, -5.05], h: [6, 1.5, 0.05] }, { p: [0, 1.5, 5.05], h: [6, 1.5, 0.05] }, { p: [-6.05, 1.5, 0], h: [0.05, 1.5, 5] }, { p: [6.05, 1.5, 0], h: [0.05, 1.5, 5] },
];
function Statics() { return <RigidBody type="fixed" colliders={false}>{COLL.map((c, i) => <CuboidCollider key={i} position={c.p} args={c.h} friction={0.8} />)}</RigidBody>; }

function ItemBody({ id }: { id: string }) {
  const item = useGame(s => s.items[id]); const held = useGame(s => s.held === id); const tip = useGame(s => !!s.pip.tip);
  const rb = useRef<RapierRigidBody>(null); const grp = useRef<THREE.Group>(null); useReg(grp, [held, item.loc, item.pos]);
  useFrame(() => { const b = rb.current; if (!b || item.loc || held) return; let t; try { t = b.translation(); } catch { return; } livePos[id] = [t.x, t.y, t.z]; if (t.y < -0.5) { b.setTranslation({ x: 0, y: 1.2, z: -2.5 }, true); b.setLinvel({ x: 0, y: 0, z: 0 }, true); } });
  if (held || HIDDEN.has(item.loc ?? "")) return null; const d = DIM[item.kind];
  const col = item.kind === "cflask" ? <CuboidCollider args={[0.075, 0.018, 0.045]} position={[0, 0.018, 0]} /> : item.kind === "hemo" ? <CuboidCollider args={[0.037, 0.005, 0.016]} position={[0, 0.005, 0]} /> : <CylinderCollider args={[d.h / 2, d.r]} position={[0, d.h / 2, 0]} />;
  return (<RigidBody key={`${item.pos.join(",")}|${item.loc}`} ref={rb} position={item.pos} type={item.loc ? "fixed" : "dynamic"} colliders={false} enabledRotations={[false, true, false]} linearDamping={0.6} angularDamping={2} friction={0.9} canSleep>
    {col}<group ref={grp} userData={{ pk: { type: "item", id } }}><ItemMesh item={item} tip={id === "pipette" && tip} /></group></RigidBody>);
}

function Held() {
  const { camera } = useThree(); const g = useRef<THREE.Group>(null); const inner = useRef<THREE.Group>(null); const id = useGame(s => s.held); const item = useGame(s => (s.held ? s.items[s.held] : null)); const pip = useGame(s => s.pip); const anim = useGame(s => s.pipAnim);
  const plunger = useRef(0); const loadedCol = useMemo(() => { const t = total(pip.loaded); if (!t) return null; const c = new THREE.Color(0, 0, 0); for (const k in pip.loaded) c.add(new THREE.Color(SUBS[k]?.color ?? "#fff").multiplyScalar(pip.loaded[k] / t)); return c; }, [pip.loaded]);
  const [, force] = [0, 0] as const; void force;
  const plRef = useRef<THREE.Group>(null);
  useFrame((st, dt) => {
    const o = g.current; if (!o) return; o.position.copy(camera.position); o.quaternion.copy(camera.quaternion);
    if (inner.current) { const t = st.clock.elapsedTime; inner.current.position.y = (id === "pipette" ? -0.17 : -0.3) + Math.sin(t * 9) * 0.004 * motion.speed; inner.current.position.x = 0.23 + Math.cos(t * 4.5) * 0.004 * motion.speed; }
    const a = useGame.getState().pipAnim; const tt = a ? (Date.now() - a.at) / 1000 : 9; plunger.current = tt < 0.3 ? Math.sin((tt / 0.3) * Math.PI) : 0;
    if (plRef.current) { plRef.current.position.z = plunger.current * 0.03; plRef.current.rotation.x = plunger.current * 0.05; }
    heldRef.g = inner.current;
  });
  if (!item || !id) return <group ref={g} />;
  const p = id === "pipette";
  return (<group ref={g}><group ref={inner} position={[0.23, p ? -0.17 : -0.3, -0.5]} rotation={p ? [-0.95, 0.12, 0.08] : [0.1, 0.4, 0]}><group ref={plRef}><ItemMesh item={item} tip={p && !!pip.tip} loaded={loadedCol} loadedFrac={Math.sqrt(total(pip.loaded) / 1000)} plunger={0} set={pip.set} /></group></group></group>);
}
function Droplet() {
  const ref = useRef<THREE.Mesh>(null); const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => { const m = ref.current; if (!m) return; const a = useGame.getState().pipAnim; const t = a ? (Date.now() - a.at) / 380 : 2; if (!a || t > 1 || !heldRef.g) { m.visible = false; return; }
    heldRef.g.getWorldPosition(v); const tipP = v.clone().add(new THREE.Vector3(0, -0.04, 0)); const tgt = new THREE.Vector3(...aimRef.point);
    const from = a.kind === "disp" ? tipP : tgt, to = a.kind === "disp" ? tgt : tipP; const e = a.kind === "disp" ? t * t : t; m.position.lerpVectors(from, to, e); m.visible = true; m.scale.setScalar(a.kind === "disp" ? 1 - t * 0.3 : 0.7);
    const l = useGame.getState().pip.loaded; const tc = new THREE.Color(0, 0, 0); const tot = total(l) || 1; for (const k in l) tc.add(new THREE.Color(SUBS[k]?.color ?? "#fff").multiplyScalar(l[k] / tot)); if (a.kind === "asp" && total(l)) (m.material as THREE.MeshStandardMaterial).color.copy(tc); });
  return <mesh ref={ref} visible={false}><sphereGeometry args={[0.006, 10, 10]} /><meshStandardMaterial color="#cfe8ff" roughness={0.1} /></mesh>;
}

function Fixed({ id, pos, rot = 0, children }: { id: string; pos: [number, number, number]; rot?: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null); useReg(ref); return <group ref={ref} position={pos} rotation={[0, rot, 0]} userData={{ pk: { type: "fixed", id } }}>{children}</group>;
}
function Surf({ id, pos, size, mat }: { id: string; pos: [number, number, number]; size: [number, number, number]; mat: React.ReactNode }) {
  const ref = useRef<THREE.Mesh>(null); useReg(ref); return <mesh ref={ref} position={pos} userData={{ pk: { type: "surface", id } }}><boxGeometry args={size} />{mat}</mesh>;
}
const BenchMat = <meshStandardMaterial color="#56646d" roughness={0.32} metalness={0.1} envMapIntensity={1.0} />;

function Room() {
  const floorTex = useCanvasTex((g, w, h) => { g.fillStyle = "#9aa1a7"; g.fillRect(0, 0, w, h); g.strokeStyle = "#7d858b"; g.lineWidth = 3; for (let i = 0; i <= 4; i++) { g.beginPath(); g.moveTo((i * w) / 4, 0); g.lineTo((i * w) / 4, h); g.stroke(); g.beginPath(); g.moveTo(0, (i * h) / 4); g.lineTo(w, (i * h) / 4); g.stroke(); } for (let i = 0; i < 1200; i++) { g.fillStyle = `rgba(${90 + Math.random() * 60},${95 + Math.random() * 60},${100 + Math.random() * 60},.12)`; g.fillRect(Math.random() * w, Math.random() * h, 3, 3); } }, 512, 512, []);
  floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping; floorTex.repeat.set(6, 5);
  const poster = useCanvasTex((g, w, h) => { g.fillStyle = "#12304a"; g.fillRect(0, 0, w, h); g.fillStyle = "#fff"; g.font = "bold 34px system-ui"; g.textAlign = "center"; g.fillText("BIOSEGURIDAD", w / 2, 46); g.font = "22px system-ui"; ["1 · Bata y guantes", "2 · Campana encendida", "3 · Etanol 70 %", "4 · Una punta, un reactivo", "5 · Residuos al contenedor"].forEach((t, i) => g.fillText(t, w / 2, 100 + i * 34)); }, 256, 256, []);
  return (<>
    <Surf id="floor" pos={[0, -0.01, 0]} size={[12, 0.02, 10]} mat={<meshStandardMaterial map={floorTex} roughness={0.55} metalness={0.05} />} />
    <mesh position={[0, 3.02, 0]}><boxGeometry args={[12, 0.05, 10]} /><meshStandardMaterial color="#f4f4f2" roughness={1} envMapIntensity={0.25} /></mesh>
    {[[0, 1.5, -5, 12, 3, 0.1], [0, 1.5, 5, 12, 3, 0.1], [-6, 1.5, 0, 0.1, 3, 10], [6, 1.5, 0, 0.1, 3, 10]].map((w, i) => (<mesh key={i} position={[w[0], w[1], w[2]]}><boxGeometry args={[w[3], w[4], w[5]]} /><meshStandardMaterial color={i === 0 ? "#dde5ea" : "#e6eaec"} roughness={0.85} /></mesh>))}
    {[[0, 0.08, -4.94, 12, 0.16, 0.04], [0, 0.08, 4.94, 12, 0.16, 0.04], [-5.94, 0.08, 0, 0.04, 0.16, 10], [5.94, 0.08, 0, 0.04, 0.16, 10]].map((w, i) => (<mesh key={i} position={[w[0], w[1], w[2]]}><boxGeometry args={[w[3], w[4], w[5]]} /><meshStandardMaterial color="#aab3b9" roughness={0.6} /></mesh>))}
    {[-3.5, 0, 3.5].map(x => [-2.5, 1.5].map(z => <group key={`${x}${z}`} position={[x, 2.97, z]}><mesh><boxGeometry args={[1.5, 0.04, 0.5]} /><meshStandardMaterial color="#fff" emissive="#fff" emissiveIntensity={2.2} toneMapped={false} /></mesh><pointLight position={[0, -0.3, 0]} intensity={4} distance={7} color="#f4f8ff" /></group>))}
    <mesh position={[0.2, 0.43, -3.9]}><boxGeometry args={[9.6, 0.86, 1.2]} /><meshStandardMaterial color="#e9edf0" roughness={0.5} /></mesh>
    {[-4, -2, 2, 4].map(x => <mesh key={x} position={[x, 0.45, -3.29]}><boxGeometry args={[1.9, 0.8, 0.02]} /><meshStandardMaterial color="#cfd6db" roughness={0.5} /></mesh>)}
    <Surf id="bench" pos={[0.2, 0.88, -3.9]} size={[9.6, 0.04, 1.2]} mat={BenchMat} />
    {[-5.5, 5.5].map(x => <group key={x}><mesh position={[x, 0.43, 0.1]}><boxGeometry args={[0.8, 0.86, 4.8]} /><meshStandardMaterial color="#e9edf0" roughness={0.5} /></mesh><Surf id={x < 0 ? "benchL" : "benchR"} pos={[x, 0.88, 0.1]} size={[0.8, 0.04, 4.8]} mat={BenchMat} /></group>)}
    <mesh position={[0, 2.15, -4.82]}><boxGeometry args={[9.6, 0.04, 0.3]} /><meshStandardMaterial color="#dfe4e7" /></mesh>
    {[-4.3, -3.6, -2.9, 3.0, 3.7, 4.4].map((x, i) => (<mesh key={x} position={[x, 2.3, -4.82]}><cylinderGeometry args={[0.05, 0.05, 0.26, 14]} /><meshStandardMaterial color={["#c0392b", "#2b64d8", "#f4b400", "#3aa89c", "#8e44ad", "#e67e22"][i]} roughness={0.4} /></mesh>))}
    <mesh position={[3.5, 1.7, 4.9]}><planeGeometry args={[1.2, 1.2]} /><meshStandardMaterial map={poster} /></mesh>
    <mesh position={[0, 1.2, 4.93]}><boxGeometry args={[1.0, 2.2, 0.06]} /><meshStandardMaterial color="#8fa6b3" roughness={0.5} /></mesh>
  </>);
}
function HoodLive() {
  const on = useGame(s => s.hoodOn); const clean = useGame(s => s.hoodClean); const ready = useGame(s => { void s.now; return hoodReady(s); });
  return (<><group><Hood on={on} ready={ready} clean={clean} /></group>
    <pointLight position={[0, 1.65, -4]} intensity={on ? 2.2 : 0.3} distance={3.5} color="#e4f4ff" /></>);
}
function Station() {
  const ready = useGame(s => { void s.now; return Object.values(s.items).some(i => i.loc === "incubator"); });
  const lit = useGame(s => Object.values(s.items).some(i => i.loc === "scope")); const bath = useGame(s => Object.values(s.items).some(i => i.loc === "bath"));
  return (<>
    <Fixed id="hoodSwitch" pos={[0.9, 1.72, -3.405]}><mesh><boxGeometry args={[0.26, 0.09, 0.02]} /><meshStandardMaterial color="#20262a" roughness={0.4} /></mesh><mesh position={[0.05, 0, 0.012]}><boxGeometry args={[0.06, 0.04, 0.012]} /><Plastic c="#9aa3a9" /></mesh></Fixed>
    <Fixed id="tipbox" pos={TIPBOX_POS}><TipBox /></Fixed>
    <Fixed id="waste" pos={[-0.9, 0.9, -4.1]}><Waste /></Fixed>
    <Fixed id="coat" pos={[-5.5, 0, 3.4]}><Coat /></Fixed>
    <Fixed id="incubator" pos={[-5.3, 0, -4.0]}><Incubator ready={ready} /></Fixed>
    <Fixed id="microscope" pos={[-5.5, 0.9, -0.4]} rot={Math.PI / 2}><Microscope lit={lit} /></Fixed>
    <Fixed id="freezer" pos={[5.5, 0, 3.7]}><Freezer /></Fixed>
    <Fixed id="gel" pos={[-5.5, 0.9, 1.4]} rot={Math.PI / 2}><GelBox /></Fixed>
    <Fixed id="bath" pos={[5.5, 0.9, 2.0]} rot={-Math.PI / 2}><Bath running={true} />{void bath}</Fixed>
    <Fixed id="centrifuge" pos={[5.5, 0.9, -1.4]} rot={-Math.PI / 2}><Centrifuge /></Fixed>
    <Fixed id="thermocycler" pos={[5.5, 0.9, 0.4]} rot={-Math.PI / 2}><Thermocycler /></Fixed>
  </>);
}
function Marker() {
  const key = useGame(s => { const m = MISSIONS[s.missionIdx]; return m?.target ? m.target(s).join(",") : ""; }); const refs = useRef<(THREE.Group | null)[]>([]); const ids = key ? key.split(",") : [];
  useFrame(st => { ids.forEach((id, i) => { const g = refs.current[i]; if (!g) return; const s = useGame.getState(); const f = FIXED[id]; const p = f ? f.pos : s.items[id] ? getPos(s, id) : null; if (!p) { g.visible = false; return; } g.visible = !(s.held === id);
    const it = s.items[id]; const yoff = f ? 0.25 : (it ? DIM[it.kind].h + 0.14 : 0.3); g.position.set(p[0], p[1] + yoff + Math.sin(st.clock.elapsedTime * 3 + i) * 0.03, p[2]); g.rotation.y = st.clock.elapsedTime * 1.5; }); });
  return <>{ids.map((id, i) => (<group key={id} ref={el => { refs.current[i] = el; }}><mesh><octahedronGeometry args={[0.04, 0]} /><meshStandardMaterial color="#ffc400" emissive="#ffb000" emissiveIntensity={2.5} toneMapped={false} /></mesh><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.07, 0.004, 8, 24]} /><meshBasicMaterial color="#ffd54a" toneMapped={false} /></mesh></group>))}</>;
}

export type Tier = "low" | "high";
export function detectTier(): Tier {
  if (typeof window === "undefined") return "high"; const q = /[?&]q=(low|high)/.exec(location.search); if (q) return q[1] as Tier;
  try { const c = document.createElement("canvas"); const g = c.getContext("webgl2") || c.getContext("webgl"); const ext = g?.getExtension("WEBGL_debug_renderer_info"); const r = ext ? String(g!.getParameter(ext.UNMASKED_RENDERER_WEBGL)) : ""; if (/swiftshader|llvmpipe|software|basic render|mali-[0-4]|adreno \(tm\) [1-3]\d\d|intel\(r\) hd/i.test(r)) return "low"; } catch {}
  if (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2) return "low"; return "high";
}
const keys = new Set<string>();
function Player() {
  const { camera } = useThree(); const dir = useMemo(() => new THREE.Vector3(), []); const right = useMemo(() => new THREE.Vector3(), []); const vel = useMemo(() => new THREE.Vector3(), []); const want = useMemo(() => new THREE.Vector3(), []);
  const dragging = useRef(false); const dragAt = useRef(0); const ray = useMemo(() => new THREE.Raycaster(), []); const last = useRef(""); const phase = useRef(0); const stepSide = useRef(0);
  useEffect(() => { camera.position.set(0, 1.65, 3); camera.rotation.set(-0.35, 0, 0, "YXZ"); (window as any).__cam = camera; }, [camera]);
  useEffect(() => {
    const G = () => useGame.getState();
    const kd = (e: KeyboardEvent) => {
      keys.add(e.code); if (!G().locked) return;
      if (e.code === "KeyE") G().interact(); else if (e.code === "KeyR") G().eject(); else if (e.code === "KeyN") G().reset();
      else if (e.code === "ArrowUp") { G().adjust(100); e.preventDefault(); } else if (e.code === "ArrowDown") { G().adjust(-100); e.preventDefault(); }
      else if (e.code === "ArrowRight") { G().adjust(1); e.preventDefault(); } else if (e.code === "ArrowLeft") { G().adjust(-1); e.preventDefault(); }
    };
    const ku = (e: KeyboardEvent) => keys.delete(e.code); const md = (e: MouseEvent) => { if (e.button !== 0 || !G().locked) return; const g = G(); if (!g.held && g.aim.type === "item") { g.interact(); dragging.current = g.held === null && !!G().held; dragAt.current = Date.now(); } else g.use(); };
    const mu = (e: MouseEvent) => { if (e.button === 0 && dragging.current && G().locked && Date.now() - dragAt.current > 350) { G().interact(); } dragging.current = false; };
    const wh = (e: WheelEvent) => { if (!G().locked) return; const dy = e.deltaY || e.deltaX; G().adjust((dy < 0 ? 1 : -1) * (e.shiftKey ? 1 : 10)); };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku); window.addEventListener("mousedown", md); window.addEventListener("mouseup", mu); window.addEventListener("wheel", wh);
    return () => { window.removeEventListener("mouseup", mu); window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("mousedown", md); window.removeEventListener("wheel", wh); };
  }, []);
  useFrame((_, dtRaw) => {
    const dt = Math.min(dtRaw, 0.05); camera.getWorldDirection(dir); dir.y = 0; dir.normalize(); right.set(-dir.z, 0, dir.x);
    let f = 0, r = 0; if (useGame.getState().locked) { if (keys.has("KeyW")) f += 1; if (keys.has("KeyS")) f -= 1; if (keys.has("KeyD")) r += 1; if (keys.has("KeyA")) r -= 1; }
    const sp = keys.has("ShiftLeft") ? 3.8 : 2.4; want.set(0, 0, 0).addScaledVector(dir, f).addScaledVector(right, r); if (want.lengthSq() > 0) want.normalize().multiplyScalar(sp);
    vel.lerp(want, 1 - Math.exp(-9 * dt)); camera.position.addScaledVector(vel, dt);
    camera.position.x = Math.max(-4.6, Math.min(4.6, camera.position.x)); camera.position.z = Math.max(-2.85, Math.min(4.6, camera.position.z));
    const spd = vel.length(); motion.speed = spd / 2.4; phase.current += spd * dt * 2.6; camera.position.y = 1.65 + Math.sin(phase.current) * 0.014 * Math.min(1, spd / 2);
    const s = Math.sin(phase.current) > 0 ? 1 : -1; if (spd > 0.8 && s !== stepSide.current) { stepSide.current = s; sfx.step(); }
    ray.setFromCamera(new THREE.Vector2(0, 0), camera); ray.far = 3.6; const hits = ray.intersectObjects([...pickables], true); let a = { type: null as any, id: "", up: false };
    for (const h of hits) { let o: THREE.Object3D | null = h.object; while (o && !o.userData.pk) o = o.parent; if (!o) continue; const pk = o.userData.pk; const up = !!h.face && h.face.normal.y > 0.5; a = { type: pk.type, id: pk.id, up }; aimRef.point = [h.point.x, h.point.y, h.point.z]; break; }
    const key = `${a.type}|${a.id}|${a.up}`; if (key !== last.current) { last.current = key; useGame.getState().setAim(a); }
  });
  return null;
}
function Diag() { const { gl } = useThree(); useEffect(() => { (window as any).__gl = gl; }, [gl]); return null; }
function PerfGuard({ tier, setTier }: { tier: Tier; setTier: (t: Tier) => void }) {
  return <PerformanceMonitor flipflops={2} onDecline={() => { if (tier === "high") setTier("low"); }} />;
}
function Shadowify() {
  const { scene } = useThree();
  useEffect(() => { const run = () => scene.traverse(o => { const m = o as THREE.Mesh; if (m.isMesh && m.material) { const mat = m.material as THREE.Material; const tr = mat.transparent && (mat as any).opacity < 0.9; m.castShadow = !tr; m.receiveShadow = true; } }); run(); const t = setInterval(run, 1500); return () => clearInterval(t); }, [scene]);
  return null;
}
function Effects({ tier }: { tier: Tier }) {
  const low = tier === "low";
  if (low) return <EffectComposer multisampling={0}><ToneMapping mode={ToneMappingMode.ACES_FILMIC} /></EffectComposer>;
  return (<EffectComposer multisampling={0}>
    <N8AO aoRadius={0.45} distanceFalloff={0.8} intensity={2.4} quality="medium" />
    <Bloom intensity={0.45} luminanceThreshold={1.0} luminanceSmoothing={0.2} mipmapBlur />
    <ToneMapping mode={ToneMappingMode.ACES_FILMIC} /><SMAA /><Vignette eskil={false} offset={0.25} darkness={0.5} />
  </EffectComposer>);
}
export default function Scene({ lockRef }: { lockRef: React.MutableRefObject<(() => void) | null> }) {
  const [tier, setTier] = useState<Tier>("high"); useEffect(() => { setTier(detectTier()); }, []); const scope = useGame(s => s.scopeOpen); const ctl = useRef<any>(null); useEffect(() => { lockRef.current = () => ctl.current?.lock(); }, [lockRef]);
  return (<Canvas frameloop={scope ? "never" : "always"} shadows="soft" dpr={tier === "low" ? [0.75, 1] : [1, 1.5]} camera={{ fov: 68, near: 0.04, far: 40 }} gl={{ antialias: false, powerPreference: "high-performance", preserveDrawingBuffer: true }}>
    <color attach="background" args={["#cfd8dd"]} />
    <Suspense fallback={null}>
      <Environment files="/hdri/lab.hdr" environmentIntensity={0.55} />
      <hemisphereLight args={["#ffffff", "#8a949b", 0.35]} />
      <directionalLight castShadow position={[3, 6, 4]} intensity={1.6} shadow-mapSize={tier === "low" ? [1024, 1024] : [2048, 2048]} shadow-camera-left={-7} shadow-camera-right={7} shadow-camera-top={6} shadow-camera-bottom={-6} shadow-camera-near={0.5} shadow-camera-far={18} shadow-bias={-0.0005} shadow-radius={5} />
      <Physics gravity={[0, -9.81, 0]}>
        <Statics /><Room /><HoodLive /><Station />{IDS.map(id => <ItemBody key={id} id={id} />)}
      </Physics>
      <Held /><Droplet /><Marker /><Shadowify /><Effects tier={tier} /><Diag />
    </Suspense>
    <Player /><PerfGuard tier={tier} setTier={setTier} />{!scope && <PointerLockControls ref={ctl} pointerSpeed={0.8} onLock={() => useGame.getState().setLocked(true)} onUnlock={() => useGame.getState().setLocked(false)} />}
  </Canvas>);
}
void RoundedBox; void Steel; void Label;
