"use client";
import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PointerLockControls } from "@react-three/drei";
import { useGame, initialItems, DIM, SUBS, total, aimRef, Item, hoodReady, TIPBOX_POS } from "@/lib/game";

const pickables = new Set<THREE.Object3D>();
function useReg(ref: React.RefObject<THREE.Object3D | null>, deps: unknown[] = []) {
  useEffect(() => { const o = ref.current; if (o) pickables.add(o); return () => { if (o) pickables.delete(o); }; }, deps); // eslint-disable-line
}
const Hit = ({ r, h }: { r: number; h: number }) => (<mesh position={[0, h / 2, 0]}><cylinderGeometry args={[r + 0.02, r + 0.02, h + 0.04, 8]} /><meshBasicMaterial transparent opacity={0} depthWrite={false} /></mesh>);

function liquidColor(it: Item) {
  const t = total(it.contents); const c = new THREE.Color(0, 0, 0); if (t <= 0) return c.set("#ffffff");
  for (const k in it.contents) c.add(new THREE.Color(SUBS[k]?.color ?? "#fff").multiplyScalar(it.contents[k] / t));
  if (it.contaminated) c.lerp(new THREE.Color("#c4b73a"), 0.7);
  return c;
}
function ItemMesh({ item, tip, loaded }: { item: Item; tip?: boolean; loaded?: THREE.Color | null }) {
  const d = DIM[item.kind]; const fill = item.cap ? Math.min(1, total(item.contents) / item.cap) : 0; const col = useMemo(() => liquidColor(item), [item]);
  if (item.kind === "pipette") return (<group>
    <mesh position={[0, 0.2, 0]}><cylinderGeometry args={[0.016, 0.012, 0.2, 12]} /><meshStandardMaterial color="#e8e8e8" /></mesh>
    <mesh position={[0, 0.3, 0]}><cylinderGeometry args={[0.012, 0.012, 0.1, 12]} /><meshStandardMaterial color="#d03030" /></mesh>
    <mesh position={[0, 0.08, 0]}><cylinderGeometry args={[0.012, 0.006, 0.08, 10]} /><meshStandardMaterial color="#555" /></mesh>
    {tip && <mesh position={[0, 0.035, 0]}><coneGeometry args={[0.009, 0.1, 10]} /><meshStandardMaterial color={loaded ? loaded : "#bfe9ff"} transparent opacity={0.6} /></mesh>}
    <Hit r={0.03} h={0.34} /></group>);
  if (item.kind === "ethanol") return (<group>
    <mesh position={[0, 0.09, 0]}><cylinderGeometry args={[0.035, 0.035, 0.18, 12]} /><meshStandardMaterial color="#9ad0ff" transparent opacity={0.7} /></mesh>
    <mesh position={[0, 0.2, 0]}><boxGeometry args={[0.04, 0.05, 0.07]} /><meshStandardMaterial color="#f2f2f2" /></mesh><Hit r={0.04} h={0.24} /></group>);
  const rTop = item.kind === "flask" ? d.r * 0.5 : d.r, rBot = item.kind === "tube" ? d.r * 0.55 : d.r;
  return (<group>
    <mesh position={[0, d.h / 2, 0]}><cylinderGeometry args={[rTop, rBot, d.h, 16]} /><meshStandardMaterial color="#cfe8ff" transparent opacity={0.28} roughness={0.1} /></mesh>
    {fill > 0 && <mesh position={[0, (d.h * 0.92 * Math.max(fill, 0.04)) / 2, 0]}><cylinderGeometry args={[rBot + (rTop - rBot) * Math.max(fill, 0.04) * 0.9 - 0.002, rBot - 0.002, d.h * 0.92 * Math.max(fill, 0.04), 16]} /><meshStandardMaterial color={col} transparent opacity={item.contaminated ? 0.95 : 0.8} /></mesh>}
    <mesh position={[0, d.h + 0.008, 0]}><cylinderGeometry args={[rTop * 1.05, rTop * 1.05, 0.016, 16]} /><meshStandardMaterial color={item.kind === "tube" ? "#f0f0f0" : item.kind === "bottle" ? "#2b64d8" : "#f4b400"} /></mesh>
    {item.contaminated && [0, 1, 2, 3, 4, 5].map(i => (<mesh key={i} position={[Math.cos(i * 1.7) * rBot * 0.5, d.h * (0.15 + 0.1 * i) + 0.01, Math.sin(i * 1.7) * rBot * 0.5]}><sphereGeometry args={[0.006, 6, 6]} /><meshStandardMaterial color="#7a8f1a" emissive="#4a5a05" /></mesh>))}
    {item.contaminated && <mesh position={[0, d.h + 0.06, 0]}><sphereGeometry args={[0.012, 8, 8]} /><meshBasicMaterial color="#ff3b30" /></mesh>}
    <Hit r={Math.max(rTop, rBot)} h={d.h} /></group>);
}
function WorldItem({ id }: { id: string }) {
  const item = useGame(s => s.items[id]); const held = useGame(s => s.held === id); const tip = useGame(s => !!s.pip.tip); const ref = useRef<THREE.Group>(null);
  useReg(ref, [held]);
  if (held) return null;
  return (<group ref={ref} position={item.pos} userData={{ pk: { type: "item", id } }}><ItemMesh item={item} tip={id === "pipette" && tip} /></group>);
}
function Held() {
  const { camera } = useThree(); const g = useRef<THREE.Group>(null); const id = useGame(s => s.held); const item = useGame(s => (s.held ? s.items[s.held] : null)); const pip = useGame(s => s.pip);
  useFrame(() => { const o = g.current; if (!o) return; o.position.copy(camera.position); o.quaternion.copy(camera.quaternion); });
  const loadedCol = useMemo(() => { const t = total(pip.loaded); if (!t) return null; const c = new THREE.Color(0, 0, 0); for (const k in pip.loaded) c.add(new THREE.Color(SUBS[k]?.color ?? "#fff").multiplyScalar(pip.loaded[k] / t)); return c; }, [pip.loaded]);
  if (!item || !id) return <group ref={g} />;
  const p = id === "pipette";
  return (<group ref={g}><group position={[0.22, p ? -0.12 : -0.3, -0.45]} rotation={p ? [-0.9, 0, 0.1] : [0, 0.4, 0]}><ItemMesh item={item} tip={p && !!pip.tip} loaded={loadedCol} /></group></group>);
}
const M = ({ c, ...p }: { c: string; [k: string]: any }) => <meshStandardMaterial color={c} {...p} />;
function Fixed({ id, pos, rot = 0, children }: { id: string; pos: [number, number, number]; rot?: number; children: React.ReactNode }) {
  const ref = useRef<THREE.Group>(null); useReg(ref); return <group ref={ref} position={pos} rotation={[0, rot, 0]} userData={{ pk: { type: "fixed", id } }}>{children}</group>;
}
function Surf({ id, pos, size, color }: { id: string; pos: [number, number, number]; size: [number, number, number]; color: string }) {
  const ref = useRef<THREE.Mesh>(null); useReg(ref); return <mesh ref={ref} position={pos} userData={{ pk: { type: "surface", id } }}><boxGeometry args={size} /><M c={color} roughness={0.6} /></mesh>;
}
function HoodLed() { const on = useGame(s => s.hoodOn); const ready = useGame(s => hoodReady(s)); useGame(s => s.now); return <meshBasicMaterial color={!on ? "#d02020" : ready ? "#20d050" : "#e0b020"} />; }
function HoodFloor() { const clean = useGame(s => s.hoodClean); return <mesh position={[0, 0.903, -4.0]} rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[2.2, 0.8]} /><meshStandardMaterial color={clean ? "#cfe9ff" : "#b8b8b8"} /></mesh>; }
function HoodLight() { const on = useGame(s => s.hoodOn); return <pointLight position={[0, 1.7, -4]} intensity={on ? 3 : 0.4} distance={4} color="#dff1ff" />; }

function Room() {
  return (<>
    <mesh rotation={[-Math.PI / 2, 0, 0]}><planeGeometry args={[12, 10]} /><M c="#8d949b" roughness={0.9} /></mesh>
    <Surf id="floor" pos={[0, -0.01, 0]} size={[12, 0.02, 10]} color="#8d949b" />
    <mesh position={[0, 3, 0]}><boxGeometry args={[12, 0.05, 10]} /><M c="#f3f3f1" /></mesh>
    {[[0, 1.5, -5, 12, 3, 0.1], [0, 1.5, 5, 12, 3, 0.1], [-6, 1.5, 0, 0.1, 3, 10], [6, 1.5, 0, 0.1, 3, 10]].map((w, i) => (<mesh key={i} position={[w[0], w[1], w[2]]}><boxGeometry args={[w[3], w[4], w[5]]} /><M c="#dfe6ea" /></mesh>))}
    {[-3, 0, 3].map(x => [-2, 2].map(z => <mesh key={`${x}${z}`} position={[x, 2.97, z]}><boxGeometry args={[1.4, 0.03, 0.4]} /><meshBasicMaterial color="#ffffff" /></mesh>))}
    <mesh position={[0, 0.45, -3.9]}><boxGeometry args={[10, 0.9, 1.2]} /><M c="#eceff1" /></mesh>
    <Surf id="bench" pos={[0, 0.88, -3.9]} size={[10, 0.04, 1.2]} color="#4a5560" />
    <mesh position={[-5.5, 0.45, 0.1]}><boxGeometry args={[0.8, 0.9, 4.8]} /><M c="#eceff1" /></mesh>
    <Surf id="benchL" pos={[-5.5, 0.88, 0.1]} size={[0.8, 0.04, 4.8]} color="#4a5560" />
    <mesh position={[5.5, 0.45, 0.1]}><boxGeometry args={[0.8, 0.9, 4.8]} /><M c="#eceff1" /></mesh>
    <Surf id="benchR" pos={[5.5, 0.88, 0.1]} size={[0.8, 0.04, 4.8]} color="#4a5560" />
    {/* campana */}
    <mesh position={[0, 1.35, -4.47]}><boxGeometry args={[2.4, 0.9, 0.06]} /><M c="#cfd6dc" /></mesh>
    {[-1.17, 1.17].map(x => <mesh key={x} position={[x, 1.35, -4.0]}><boxGeometry args={[0.06, 0.9, 1.0]} /><M c="#cfd6dc" /></mesh>)}
    <mesh position={[0, 1.83, -4.0]}><boxGeometry args={[2.4, 0.06, 1.0]} /><M c="#aab4bb" /></mesh>
    <mesh position={[0, 1.62, -3.5]}><boxGeometry args={[2.3, 0.36, 0.02]} /><meshPhysicalMaterial color="#bfe3ff" transparent opacity={0.18} /></mesh>
    <mesh position={[0, 1.44, -3.5]}><boxGeometry args={[2.4, 0.04, 0.05]} /><M c="#8a959d" /></mesh>
    <HoodFloor /><HoodLight />
    <Fixed id="hoodSwitch" pos={[0.9, 1.72, -3.47]}><mesh><boxGeometry args={[0.3, 0.1, 0.04]} /><M c="#2c3338" /></mesh><mesh position={[-0.08, 0, 0.025]}><sphereGeometry args={[0.02, 8, 8]} /><HoodLed /></mesh><mesh position={[0.06, 0, 0.025]}><boxGeometry args={[0.1, 0.05, 0.01]} /><M c="#888" /></mesh></Fixed>
    <Fixed id="tipbox" pos={TIPBOX_POS}><mesh position={[0, 0.03, 0]}><boxGeometry args={[0.16, 0.06, 0.1]} /><M c="#5ec2b7" /></mesh><mesh position={[0, 0.065, 0]}><boxGeometry args={[0.15, 0.01, 0.09]} /><M c="#e9fffb" /></mesh></Fixed>
    <Fixed id="waste" pos={[-0.9, 0.9, -4.1]}><mesh position={[0, 0.07, 0]}><cylinderGeometry args={[0.08, 0.06, 0.14, 14]} /><M c="#d8431f" /></mesh></Fixed>
    {/* perchero */}
    <Fixed id="coat" pos={[-5.7, 0, 3.4]}><mesh position={[0, 0.9, 0]}><cylinderGeometry args={[0.03, 0.03, 1.8, 8]} /><M c="#555" /></mesh><mesh position={[0.12, 1.5, 0]}><boxGeometry args={[0.16, 0.9, 0.5]} /><M c="#ffffff" /></mesh><mesh position={[0.1, 1.0, 0.1]}><boxGeometry args={[0.12, 0.14, 0.14]} /><M c="#4aa3ff" /></mesh></Fixed>
    {/* estaciones */}
    <Fixed id="incubator" pos={[-5.3, 0, -4.0]}><mesh position={[0, 0.6, 0]}><boxGeometry args={[0.8, 1.2, 0.8]} /><M c="#b9c4ca" /></mesh><mesh position={[0, 0.6, 0.41]}><boxGeometry args={[0.6, 0.9, 0.02]} /><meshPhysicalMaterial color="#9fd6ff" transparent opacity={0.45} /></mesh></Fixed>
    <Fixed id="microscope" pos={[-5.5, 0.9, -0.4]} rot={Math.PI / 2}><mesh position={[0, 0.02, 0]}><boxGeometry args={[0.2, 0.04, 0.3]} /><M c="#2c3338" /></mesh><mesh position={[0, 0.2, -0.08]}><boxGeometry args={[0.05, 0.36, 0.05]} /><M c="#2c3338" /></mesh><mesh position={[0, 0.34, 0.02]} rotation={[0.6, 0, 0]}><cylinderGeometry args={[0.035, 0.035, 0.2, 10]} /><M c="#e5e5e5" /></mesh><mesh position={[0, 0.12, 0.04]}><cylinderGeometry args={[0.02, 0.02, 0.1, 10]} /><M c="#888" /></mesh></Fixed>
    <Fixed id="gel" pos={[-5.5, 0.9, 1.4]} rot={Math.PI / 2}><mesh position={[0, 0.04, 0]}><boxGeometry args={[0.3, 0.08, 0.22]} /><meshPhysicalMaterial color="#d7e6f2" transparent opacity={0.6} /></mesh><mesh position={[0.1, 0.1, 0]}><boxGeometry args={[0.04, 0.04, 0.04]} /><M c="#d02020" /></mesh></Fixed>
    <Fixed id="centrifuge" pos={[5.5, 0.9, -1.4]} rot={-Math.PI / 2}><mesh position={[0, 0.12, 0]}><cylinderGeometry args={[0.28, 0.3, 0.24, 20]} /><M c="#f0f0f0" /></mesh><mesh position={[0, 0.26, 0]}><cylinderGeometry args={[0.26, 0.26, 0.04, 20]} /><M c="#3a6ea5" /></mesh></Fixed>
    <Fixed id="thermocycler" pos={[5.5, 0.9, 0.4]} rot={-Math.PI / 2}><mesh position={[0, 0.08, 0]}><boxGeometry args={[0.4, 0.16, 0.34]} /><M c="#33383d" /></mesh><mesh position={[0, 0.17, 0]}><boxGeometry args={[0.3, 0.02, 0.2]} /><M c="#6f7c85" /></mesh></Fixed>
  </>);
}
const IDS = Object.keys(initialItems());
const keys = new Set<string>();
function Player() {
  const { camera, gl } = useThree(); const dir = useMemo(() => new THREE.Vector3(), []); const right = useMemo(() => new THREE.Vector3(), []); const ray = useMemo(() => new THREE.Raycaster(), []); const last = useRef("");
  useEffect(() => { camera.position.set(0, 1.65, 3); camera.rotation.set(-0.35, 0, 0, "YXZ"); }, [camera]);
  useEffect(() => {
    const G = () => useGame.getState();
    const kd = (e: KeyboardEvent) => {
      keys.add(e.code); if (!G().locked) return;
      if (e.code === "KeyE") G().interact(); else if (e.code === "KeyR") G().eject(); else if (e.code === "KeyN") G().reset();
      else if (e.code === "ArrowUp") { G().adjust(100); e.preventDefault(); } else if (e.code === "ArrowDown") { G().adjust(-100); e.preventDefault(); }
      else if (e.code === "ArrowRight") { G().adjust(1); e.preventDefault(); } else if (e.code === "ArrowLeft") { G().adjust(-1); e.preventDefault(); }
    };
    const ku = (e: KeyboardEvent) => keys.delete(e.code);
    const md = (e: MouseEvent) => { if (e.button === 0 && G().locked) G().use(); };
    const wh = (e: WheelEvent) => { if (!G().locked) return; const dy = e.deltaY || e.deltaX; G().adjust((dy < 0 ? 1 : -1) * (e.shiftKey ? 1 : 10)); };
    window.addEventListener("keydown", kd); window.addEventListener("keyup", ku); window.addEventListener("mousedown", md); window.addEventListener("wheel", wh);
    (window as any).__cam = camera;
    return () => { window.removeEventListener("keydown", kd); window.removeEventListener("keyup", ku); window.removeEventListener("mousedown", md); window.removeEventListener("wheel", wh); };
  }, [camera, gl]);
  useFrame((_, dt) => {
    if (useGame.getState().locked) {
      camera.getWorldDirection(dir); dir.y = 0; dir.normalize(); right.set(-dir.z, 0, dir.x);
      const sp = (keys.has("ShiftLeft") ? 4.2 : 2.6) * Math.min(dt, 0.05); let f = 0, r = 0;
      if (keys.has("KeyW")) f += 1; if (keys.has("KeyS")) f -= 1; if (keys.has("KeyD")) r += 1; if (keys.has("KeyA")) r -= 1;
      camera.position.addScaledVector(dir, f * sp).addScaledVector(right, r * sp);
    }
    camera.position.x = Math.max(-4.6, Math.min(4.6, camera.position.x)); camera.position.z = Math.max(-2.85, Math.min(4.6, camera.position.z)); camera.position.y = 1.65;
    ray.setFromCamera(new THREE.Vector2(0, 0), camera); ray.far = 3.6;
    const hits = ray.intersectObjects([...pickables], true); let a = { type: null as any, id: "", up: false };
    for (const h of hits) { let o: THREE.Object3D | null = h.object; while (o && !o.userData.pk) o = o.parent; if (!o) continue; const pk = o.userData.pk; const up = !!h.face && h.face.normal.y > 0.5; a = { type: pk.type, id: pk.id, up }; aimRef.point = [h.point.x, h.point.y, h.point.z]; break; }
    const key = `${a.type}|${a.id}|${a.up}`; if (key !== last.current) { last.current = key; useGame.getState().setAim(a); }
  });
  return null;
}
export default function Scene({ lockRef }: { lockRef: React.MutableRefObject<(() => void) | null> }) {
  const ids = IDS;
  const ctl = useRef<any>(null);
  useEffect(() => { lockRef.current = () => ctl.current?.lock(); }, [lockRef]);
  return (<Canvas dpr={[1, 1.75]} camera={{ fov: 70, near: 0.05, far: 40 }} gl={{ antialias: true, preserveDrawingBuffer: true }}>
    <color attach="background" args={["#dfe6ea"]} />
    <ambientLight intensity={1.1} /><hemisphereLight args={["#ffffff", "#8a949b", 0.9]} /><directionalLight position={[2, 4, 3]} intensity={1.1} />
    <Room />{ids.map(id => <WorldItem key={id} id={id} />)}<Held />
    <Player /><PointerLockControls ref={ctl} onLock={() => useGame.getState().setLocked(true)} onUnlock={() => useGame.getState().setLocked(false)} />
  </Canvas>);
}
