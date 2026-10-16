import { create } from "zustand";

export type V3 = [number, number, number];
export type Contents = Record<string, number>;
export type Kind = "tube" | "bottle" | "flask" | "pipette" | "ethanol";
export type Item = { id: string; kind: Kind; label: string; pos: V3; cap: number; contents: Contents; contaminated: boolean; reason?: string };
export type Tip = { contaminated: boolean; lastSource: string | null };
export type Pip = { set: number; tip: Tip | null; loaded: Contents; loadedContam: boolean };
export type Aim = { type: "item" | "fixed" | "surface" | null; id: string; up: boolean };
export type Toast = { id: number; text: string; kind: "ok" | "err" | "info"; at: number };

export const READY_MS = 8000; // campana: 10–15 min reales, acelerado a 8 s
export const SUBS: Record<string, { name: string; color: string }> = {
  medio: { name: "Medio DMEM", color: "#e0507a" },
  pbs: { name: "PBS", color: "#bfe3ff" },
  stock: { name: "Stock 10 mg/mL", color: "#3b6fff" },
  sfb: { name: "SFB (suero)", color: "#c98a3a" },
  etanol: { name: "Etanol 70 %", color: "#dddddd" },
};
export const DIM: Record<Kind, { r: number; h: number }> = {
  tube: { r: 0.02, h: 0.1 }, bottle: { r: 0.05, h: 0.17 }, flask: { r: 0.07, h: 0.16 }, pipette: { r: 0.016, h: 0.3 }, ethanol: { r: 0.035, h: 0.2 },
};
export const FIXED: Record<string, { label: string; hint: string }> = {
  coat: { label: "Perchero: bata y guantes", hint: "[E] Ponerse bata y guantes" },
  hoodSwitch: { label: "Interruptor de la campana", hint: "[E] Encender / apagar" },
  tipbox: { label: "Caja de puntas estériles", hint: "[Clic] con la pipeta: poner punta" },
  waste: { label: "Residuos biológicos", hint: "Las puntas usadas caen aquí con [R]" },
  incubator: { label: "Incubadora 37 °C, 5 % CO₂", hint: "Módulo 3 (próximamente)" },
  microscope: { label: "Microscopio", hint: "Módulo 3 (próximamente)" },
  centrifuge: { label: "Centrífuga", hint: "Módulo 3 (próximamente)" },
  thermocycler: { label: "Termociclador", hint: "Módulo 6 (próximamente)" },
  gel: { label: "Cámara de electroforesis", hint: "Módulo 6 (próximamente)" },
};

export const total = (c: Contents) => Object.values(c).reduce((a, b) => a + b, 0);
export const inHood = (p: V3) => p[0] > -1.1 && p[0] < 1.1 && p[2] > -4.45 && p[2] < -3.62 && p[1] >= 0.85 && p[1] < 1.8;
export const TIPBOX_POS: V3 = [0.55, 0.9, -4.0];
export const aimRef = { point: [0, 0, 0] as V3 };

export function initialItems(): Record<string, Item> {
  const mk = (id: string, kind: Kind, label: string, pos: V3, cap: number, contents: Contents = {}): Item => ({ id, kind, label, pos, cap, contents, contaminated: false });
  return Object.fromEntries([
    mk("pipette", "pipette", "Micropipeta (2–1000 µL)", [-3.2, 0.9, -3.9], 0),
    mk("ethanol", "ethanol", "Spray de etanol 70 %", [-2.7, 0.9, -3.9], 0),
    mk("medio", "flask", "Frasco de medio DMEM", [-2.1, 0.9, -3.9], 100000, { medio: 30000 }),
    mk("pbs", "flask", "Frasco de PBS", [-1.6, 0.9, -3.9], 100000, { pbs: 30000 }),
    mk("sfb", "bottle", "Botella de SFB", [1.8, 0.9, -3.9], 20000, { sfb: 10000 }),
    mk("stock", "bottle", "Stock 10 mg/mL", [2.3, 0.9, -3.9], 10000, { stock: 5000 }),
    mk("tube1", "tube", "Tubo 1", [3.0, 0.9, -3.9], 2000),
    mk("tube2", "tube", "Tubo 2", [3.25, 0.9, -3.9], 2000),
    mk("tube3", "tube", "Tubo 3", [3.5, 0.9, -3.9], 2000),
  ].map(i => [i.id, i]));
}

export type Mission = { id: string; module: number; title: string; todo: string; why: string; hint: string; check: (s: G) => boolean; apply?: (p: Partial<G>, s: G) => void };
const near = (v: number | undefined, t: number, tol: number) => v !== undefined && Math.abs(v - t) <= tol;
const clean = (i: Item) => !i.contaminated;
export const MISSIONS: Mission[] = [
  { id: "m1-1", module: 1, title: "Bata y guantes", todo: "Ve al perchero (pared izquierda, cerca de la entrada) y póntelos.", why: "Son tu primera barrera: te protegen a ti y evitan que tu piel y ropa contaminen las células.", hint: "Perchero a tu izquierda, junto a la pared. Apúntalo y pulsa E.", check: s => s.ppe, apply: p => { p.ppe = true; } },
  { id: "m1-2", module: 1, title: "Enciende la campana", todo: "Pulsa el interruptor de la campana (arriba a la derecha de la campana) y espera a que el aire se estabilice.", why: "El flujo laminar con filtro HEPA tarda en estabilizarse; antes de eso no protege tu cultivo.", hint: "Interruptor en el marco de la campana. Espera ~8 s (en la vida real 10–15 min).", check: s => hoodReady(s), apply: p => { p.hoodOn = true; p.hoodOnAt = Date.now() - READY_MS; } },
  { id: "m1-3", module: 1, title: "Desinfecta la campana", todo: "Coge el spray de etanol (E), apunta al interior de la campana y haz clic.", why: "El etanol al 70 % mata microorganismos en la superficie que si no acabarían en tu medio.", hint: "Spray en el banco, a la izquierda. Apunta a la superficie dentro de la campana.", check: s => s.hoodClean, apply: p => { p.hoodClean = true; } },
  { id: "m1-4", module: 1, title: "Material dentro de la campana", todo: "Coloca el frasco de medio y el Tubo 1 dentro de la campana (E para coger, E para dejar).", why: "Solo el aire dentro de la campana es estéril. Todo lo abierto debe estar ahí, sin bloquear las rejillas.", hint: "Apunta a la superficie de trabajo dentro de la campana para dejarlos.", check: s => inHood(s.items.medio.pos) && inHood(s.items.tube1.pos) && s.held !== "medio" && s.held !== "tube1", apply: (p, s) => { p.items = { ...s.items, medio: { ...s.items.medio, pos: [-0.6, 0.9, -4.05] }, tube1: { ...s.items.tube1, pos: [0.1, 0.9, -3.85] } }; } },
  { id: "m1-5", module: 1, title: "Pipeteo preciso", todo: "Con la pipeta: ajusta 200 µL (rueda), coloca una punta de la caja, aspira del medio y dispensa en el Tubo 1.", why: "Un error de volumen se arrastra a toda la concentración final; la técnica estéril evita contaminar el frasco.", hint: "Rueda: ±10 µL (Shift ±1), flechas ↑↓ ±100. Clic en la caja = punta; clic en el frasco = aspirar; clic en el tubo = dispensar.", check: s => near(s.items.tube1.contents.medio, 200, 10) && clean(s.items.tube1) },
  { id: "m1-6", module: 1, title: "Descarta la punta", todo: "Expulsa la punta usada con R (cae a residuos).", why: "Una punta usada ya no es estéril: reutilizarla contamina el siguiente reactivo.", hint: "Pulsa R con la pipeta en la mano.", check: s => s.ejects > s.base.ejects },
  { id: "m1-7", module: 1, title: "Provoca un error (a propósito)", todo: "Saca el Tubo 2 de la campana, déjalo en el banco y pipetea 100 µL de medio en él fuera de la campana. Mira qué pasa.", why: "Ver una contaminación te enseña a reconocerla: el medio se enturbia, amarillea y aparecen partículas.", hint: "Necesitas una punta nueva y el tubo fuera de la campana (por ejemplo en el banco a la derecha).", check: s => Object.values(s.items).some(i => i.contaminated) },
  { id: "m1-8", module: 1, title: "Reinicia el laboratorio", todo: "Pulsa N para descartar el material contaminado y reponer todo desde cero.", why: "En el laboratorio real, un cultivo contaminado se descarta con lejía y se empieza de nuevo.", hint: "Tecla N.", check: s => s.resets > s.base.resets },
  { id: "m2-1", module: 2, title: "Medio completo (10 % SFB)", todo: "En el Tubo 2 (dentro de la campana) prepara 1000 µL: 900 µL de medio + 100 µL de SFB. Cambia de punta entre reactivos.", why: "El suero aporta factores de crecimiento; la proporción cambia cómo crecen las células.", hint: "Mueve SFB, medio y Tubo 2 a la campana. Cada reactivo con punta nueva (R expulsa).", check: s => near(s.items.tube2.contents.medio, 900, 45) && near(s.items.tube2.contents.sfb, 100, 10) && clean(s.items.tube2) },
  { id: "m2-2", module: 2, title: "Dilución 1:100", todo: "En el Tubo 3 haz 1000 µL a 100 µg/mL desde el stock de 10 mg/mL: C₁V₁ = C₂V₂ → 10 µL de stock + 990 µL de PBS.", why: "Casi todo reactivo viene concentrado; diluir con exactitud decide si tu experimento mide lo que crees.", hint: "10 000 µg/mL × V₁ = 100 µg/mL × 1000 µL → V₁ = 10 µL. Primero PBS, punta nueva para el stock.", check: s => near(s.items.tube3.contents.pbs, 990, 30) && near(s.items.tube3.contents.stock, 10, 1) && clean(s.items.tube3) },
];
export const hoodReady = (s: Pick<G, "hoodOn" | "hoodOnAt">) => s.hoodOn && Date.now() - s.hoodOnAt >= READY_MS;

export interface G {
  items: Record<string, Item>; held: string | null; pip: Pip; ppe: boolean; hoodOn: boolean; hoodOnAt: number; hoodClean: boolean;
  ejects: number; resets: number; errors: number; completed: Record<string, number>; missionIdx: number; base: { ejects: number; resets: number; errors: number };
  toasts: Toast[]; aim: Aim; now: number; locked: boolean; loaded: boolean;
  init(): void; tick(): void; setLocked(b: boolean): void; setAim(a: Aim): void;
  interact(): void; use(): void; eject(): void; adjust(d: number): void; reset(): void; wipe(): void;
}

const KEY = "wetlab3d-v1";
let tid = 1;
const fresh = () => ({ items: initialItems(), held: null as string | null, pip: { set: 200, tip: null, loaded: {}, loadedContam: false } as Pip, ppe: false, hoodOn: false, hoodOnAt: 0, hoodClean: false });

function workCheck(s: G, pos: V3): string | null {
  if (!s.ppe) return "sin bata ni guantes";
  if (!s.hoodOn) return "campana apagada";
  if (!hoodReady(s)) return "la campana aún no se estabilizó";
  if (!s.hoodClean) return "superficie sin desinfectar";
  if (!inHood(pos)) return "fuera de la campana";
  return null;
}
const contaminate = (i: Item, why: string): Item => (i.contaminated ? i : { ...i, contaminated: true, reason: why });
const mix = (a: Contents, b: Contents, f = 1) => { const o = { ...a }; for (const k in b) o[k] = (o[k] || 0) + b[k] * f; return o; };

export const useGame = create<G>((set, get) => {
  const say = (text: string, kind: Toast["kind"] = "info") => set(s => ({ toasts: [...s.toasts.slice(-3), { id: tid++, text, kind, at: Date.now() }] }));
  const bad = (text: string) => { set(s => ({ errors: s.errors + 1 })); say("⚠ " + text, "err"); };
  const evaluate = () => {
    const s = get(); const m = MISSIONS[s.missionIdx]; if (!m || !s.loaded) return;
    if (!m.check(s)) return;
    const pts = Math.max(20, 100 - 20 * (s.errors - s.base.errors));
    const completed = { ...s.completed, [m.id]: Math.max(s.completed[m.id] ?? 0, pts) };
    try { localStorage.setItem(KEY, JSON.stringify({ completed })); } catch {}
    set({ completed, missionIdx: s.missionIdx + 1, base: { ejects: s.ejects, resets: s.resets, errors: s.errors } });
    say(`✅ Misión completada: ${m.title} (+${pts} pts)`, "ok");
    evaluate();
  };
  const upd = (p: Partial<G>) => { set(p as any); evaluate(); };
  return {
    ...fresh(), ejects: 0, resets: 0, errors: 0, completed: {}, missionIdx: 0, base: { ejects: 0, resets: 0, errors: 0 }, toasts: [], aim: { type: null, id: "", up: false }, now: Date.now(), locked: false, loaded: false,
    init() {
      let completed: Record<string, number> = {};
      try { completed = JSON.parse(localStorage.getItem(KEY) || "{}").completed || {}; } catch {}
      let idx = 0; while (idx < MISSIONS.length && completed[MISSIONS[idx].id] !== undefined) idx++;
      const p: Partial<G> = {}; const base = { ...get(), ...fresh() } as G;
      Object.assign(p, fresh());
      for (let i = 0; i < idx; i++) MISSIONS[i].apply?.(p, { ...base, ...p } as G);
      set({ ...p, completed, missionIdx: idx, loaded: true, base: { ejects: 0, resets: 0, errors: 0 } } as any);
    },
    tick() { set({ now: Date.now() }); evaluate(); },
    setLocked(b) { set({ locked: b }); },
    setAim(a) { set({ aim: a }); },
    wipe() { try { localStorage.removeItem(KEY); } catch {} set({ ...fresh(), completed: {}, missionIdx: 0, errors: 0, ejects: 0, resets: 0, base: { ejects: 0, resets: 0, errors: 0 } } as any); },
    reset() { set({ ...fresh(), resets: get().resets + 1 } as any); say("Laboratorio repuesto: material nuevo y estéril (se descartó el anterior).", "info"); evaluate(); },
    adjust(d) { const p = get().pip; set({ pip: { ...p, set: Math.max(2, Math.min(1000, p.set + d)) } }); },
    eject() {
      const s = get(); if (s.held !== "pipette") return;
      if (!s.pip.tip) return say("La pipeta no tiene punta.", "info");
      set({ pip: { ...s.pip, tip: null, loaded: {}, loadedContam: false }, ejects: s.ejects + 1 }); say("Punta descartada en residuos.", "ok"); evaluate();
    },
    interact() {
      const s = get(); const a = s.aim;
      if (!s.held) {
        if (a.type === "item") { upd({ held: a.id }); return; }
        if (a.type === "fixed") {
          if (a.id === "coat") { if (s.ppe) say("Ya llevas bata y guantes.", "info"); else { upd({ ppe: true }); say("Te pusiste bata y guantes.", "ok"); } }
          else if (a.id === "hoodSwitch") { if (s.hoodOn) { upd({ hoodOn: false }); say("Campana apagada.", "info"); } else { upd({ hoodOn: true, hoodOnAt: Date.now() }); say("Campana encendida: espera a que se estabilice (~8 s).", "info"); } }
          else say(`${FIXED[a.id].label}: ${FIXED[a.id].hint}`, "info");
        }
        return;
      }
      if (a.type === "surface" && a.up) {
        const [x, y, z] = aimRef.point; const it = s.items[s.held]; let items = { ...s.items, [s.held]: { ...it, pos: [x, y + 0.002, z] as V3 } };
        let pip = s.pip;
        if (s.held === "pipette" && pip.tip && !pip.tip.contaminated) { pip = { ...pip, tip: { ...pip.tip, contaminated: true } }; bad("Apoyaste la pipeta con la punta puesta: la punta ya no es estéril."); }
        upd({ items, held: null, pip }); return;
      }
      if (a.type === "fixed" && a.id === "hoodSwitch") { get().setAim(a); }
      say("Apunta a una superficie plana para dejarlo.", "info");
    },
    use() {
      const s = get(); const a = s.aim;
      if (s.held === "ethanol") {
        if (!inHood(aimRef.point) || a.type === null) { say("Rocías etanol, pero fuera de la campana no sirve.", "info"); return; }
        if (!s.hoodClean) { upd({ hoodClean: true }); say("Interior de la campana desinfectado.", "ok"); } else say("Ya está desinfectada.", "info");
        return;
      }
      if (s.held !== "pipette") { if (s.held) say("Pulsa E apuntando a una superficie para dejarlo.", "info"); return; }
      const pip = s.pip;
      if (a.type === "fixed" && a.id === "tipbox") {
        if (pip.tip) return say("Ya tienes una punta puesta (R para descartarla).", "info");
        const why = workCheck(s, TIPBOX_POS);
        set({ pip: { ...pip, tip: { contaminated: !!why, lastSource: null } } });
        if (why) bad(`Tocaste una punta estéril en malas condiciones (${why}): la punta está contaminada.`); else say("Punta estéril colocada.", "ok");
        evaluate(); return;
      }
      if (a.type === "item") {
        const t = s.items[a.id]; if (!t || !["tube", "bottle", "flask"].includes(t.kind)) return;
        if (!pip.tip) return bad("Necesitas una punta (clic en la caja de puntas).");
        const problems: string[] = []; let tip = { ...pip.tip }; let tg = { ...t };
        const why = workCheck(s, t.pos);
        if (total(pip.loaded) === 0) { // aspirar
          if (why) { tg = contaminate(tg, why); tip.contaminated = true; problems.push(`Pipeteaste en malas condiciones (${why}): ${t.label} contaminado.`); }
          if (tip.lastSource && tip.lastSource !== t.id) { tg = contaminate(tg, "contaminación cruzada por reutilizar la punta"); problems.push("Reutilizaste la punta con otro reactivo: contaminación cruzada."); }
          if (tip.contaminated && !tg.contaminated) { tg = contaminate(tg, "punta contaminada"); problems.push("La punta estaba contaminada: contaminaste el recipiente."); }
          const avail = total(tg.contents); if (avail <= 0) return bad(`${t.label} está vacío.`);
          const take = Math.min(pip.set, avail); const f = take / avail;
          const loaded = mix({}, tg.contents, f); const left: Contents = {}; for (const k in tg.contents) left[k] = tg.contents[k] * (1 - f);
          tg = { ...tg, contents: left }; if (take < pip.set) problems.push(`Aspiraste aire: solo había ${Math.round(take)} µL.`);
          if (tg.contaminated) tip.contaminated = true; tip.lastSource = t.id;
          set({ items: { ...s.items, [t.id]: tg }, pip: { ...pip, tip, loaded, loadedContam: tg.contaminated } });
          if (problems.length) bad(problems.join(" ")); else say(`Aspirados ${Math.round(take)} µL.`, "info");
        } else { // dispensar
          if (why) { tg = contaminate(tg, why); problems.push(`Dispensaste en malas condiciones (${why}): ${t.label} contaminado.`); }
          if (tip.contaminated || pip.loadedContam) { tg = contaminate(tg, "líquido o punta contaminados"); problems.push("El líquido o la punta venían contaminados."); }
          if (tg.contaminated) tip.contaminated = true;
          const L = total(pip.loaded); const room = Math.max(0, t.cap - total(tg.contents)); const put = Math.min(L, room); const f = L > 0 ? put / L : 0;
          tg = { ...tg, contents: mix(tg.contents, pip.loaded, f) };
          if (put < L) problems.push(`Se derramó: ${t.label} se llenó (${Math.round(L - put)} µL fuera).`);
          set({ items: { ...s.items, [t.id]: tg }, pip: { ...pip, tip, loaded: {}, loadedContam: false } });
          if (problems.length) bad(problems.join(" ")); else say(`Dispensados ${Math.round(put)} µL en ${t.label}.`, "ok");
        }
        evaluate();
      }
    },
  };
});
if (typeof window !== "undefined") (window as any).__wl = useGame;
