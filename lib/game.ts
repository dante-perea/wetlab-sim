import { create } from "zustand";
import { sfx } from "./sound";
import { pcrResult, ctFor, bandsFor, interpSize, travel, PCR_RUN_MS, GEL_FULL_MS, AMPLICON, LADDER, type PcrRes, type Lane } from "./molbio";

export type V3 = [number, number, number];
export type Contents = Record<string, number>;
export type Kind = "tube" | "bottle" | "flask" | "pipette" | "ethanol" | "cryo" | "cflask" | "hemo";
export type Loc = null | "incubator" | "scope" | "bath" | "freezer" | "gone" | "centrifuge" | "thermo" | "gel" | "reader";
export type Item = { id: string; kind: Kind; label: string; pos: V3; cap: number; contents: Contents; contaminated: boolean; reason?: string; cells: number; loc: Loc; bathMs: number; thawed: boolean; frozen: boolean; washed?: boolean; tryMs?: number; detached?: boolean; blind?: boolean; viewed?: boolean; via?: number; frozenOk?: boolean; spun?: boolean; mttMs?: number; extra?: Record<string, number | string | boolean>; pcr?: PcrRes; ct?: { ct: number | null; gene: string | null; sample: string | null; note: string } };
export type Tip = { contaminated: boolean; lastSource: string | null };
export type Pip = { set: number; tip: Tip | null; loaded: Contents; loadedContam: boolean; loadedCells: number; loadedVia: number };
export type Aim = { type: "item" | "fixed" | "surface" | null; id: string; up: boolean };
export type Toast = { id: number; text: string; kind: "ok" | "err" | "info"; at: number };

export const READY_MS = 8000;
export const SIM_H_PER_S = 4; // incubadora: 1 s real = 4 h simuladas
export const FLASK_AREA = 25; // cm² (T25)
export const CONF_100 = 1.2e5; // células/cm² al 100 %
export const SUBS: Record<string, { name: string; color: string }> = {
  medio: { name: "Medio DMEM", color: "#e0507a" }, pbs: { name: "PBS", color: "#bfe3ff" }, stock: { name: "Stock 10 mg/mL", color: "#3b6fff" },
  sfb: { name: "SFB (suero)", color: "#c98a3a" }, celulas: { name: "Suspensión celular + DMSO", color: "#e9a9b8" }, tripan: { name: "Azul de tripán", color: "#1b2a9a" }, tripsina: { name: "Tripsina-EDTA", color: "#f3e3b0" }, dmso: { name: "DMSO", color: "#e8eef2" },
  dna: { name: "ADN molde", color: "#d9d2f2" }, primers: { name: "Cebadores 10 µM", color: "#9fe3c0" }, mm: { name: "Master mix 2×", color: "#f2e6a0" }, agua: { name: "Agua libre de nucleasas", color: "#eaf6ff" },
  ladder: { name: "Marcador 100 pb", color: "#9fb6ff" }, dye: { name: "Tampón de carga 6×", color: "#4ea1ff" }, primT: { name: "Cebadores gen diana", color: "#8be0a8" }, primR: { name: "Cebadores gen referencia", color: "#e6a8f0" },
  cdnaC: { name: "cDNA control", color: "#d8e4ff" }, cdnaT: { name: "cDNA tratado", color: "#ffd8e0" },
};
export const DIM: Record<Kind, { r: number; h: number }> = {
  tube: { r: 0.02, h: 0.1 }, bottle: { r: 0.05, h: 0.17 }, flask: { r: 0.07, h: 0.16 }, pipette: { r: 0.016, h: 0.3 }, ethanol: { r: 0.035, h: 0.2 },
  cryo: { r: 0.016, h: 0.07 }, cflask: { r: 0.06, h: 0.04 }, hemo: { r: 0.04, h: 0.008 },
};
export const FIXED: Record<string, { label: string; hint: string; pos: V3 }> = {
  coat: { label: "Perchero: bata y guantes", hint: "[E] Ponerse bata y guantes", pos: [-5.5, 1.5, 3.4] },
  hoodSwitch: { label: "Interruptor de la campana", hint: "[E] Encender / apagar", pos: [0.9, 1.8, -3.47] },
  tipbox: { label: "Caja de puntas estériles", hint: "[Clic] con la pipeta: poner punta", pos: [0.55, 1.0, -4.0] },
  waste: { label: "Residuos biológicos", hint: "Las puntas usadas caen aquí con [R]", pos: [-0.9, 1.1, -4.1] },
  incubator: { label: "Incubadora 37 °C, 5 % CO₂", hint: "[E] con un frasco de cultivo en la mano: guardarlo", pos: [-5.3, 1.45, -3.95] },
  microscope: { label: "Microscopio", hint: "[E] con la muestra en la mano: platina · sin nada: mirar", pos: [-5.5, 1.35, -0.4] },
  bath: { label: "Baño termostático 37 °C", hint: "[E] con el criovial en la mano: descongelar", pos: [5.45, 1.05, 2.0] },
  freezer: { label: "Congelador −80 °C", hint: "[E] con un criovial en la mano: congelar", pos: [5.45, 1.0, 3.7] },
  centrifuge: { label: "Centrífuga", hint: "(sin uso en las misiones actuales)", pos: [5.5, 1.2, -1.4] },
  thermocycler: { label: "Termociclador / qPCR", hint: "[E] con un tubo: colocarlo · [E] con la mano vacía: programa y arranque", pos: [5.5, 1.1, 0.4] },
  gel: { label: "Cámara de electroforesis (gel 1,5 % agarosa)", hint: "Pipeta cargada: clic para cargar el pocillo · [E] mano vacía: fuente / ver gel", pos: [-5.5, 1.1, 1.4] },
};
export const SLOT: Record<Exclude<Loc, null>, V3> = { incubator: [-5.3, 0.63, -3.95], scope: [-5.46, 1.155, -0.4], bath: [5.5, 0.96, 2.0], freezer: [5.4, 1.0, 3.7], gone: [0, -5, 0], centrifuge: [5.5, 1.13, -1.4], thermo: [5.5, 1.05, 0.4], gel: [-5.5, 0.97, 1.4], reader: [-5.5, 1.0, 2.3] };
export const HIDDEN = new Set<string>(["gone", "freezer"]);

export const total = (c: Contents) => Object.values(c).reduce((a, b) => a + b, 0);
export const inHood = (p: V3) => p[0] > -1.1 && p[0] < 1.1 && p[2] > -4.45 && p[2] < -3.62 && p[1] >= 0.85 && p[1] < 1.8;
export const TIPBOX_POS: V3 = [0.55, 0.9, -4.0];
export const aimRef = { point: [0, 0, 0] as V3 };
export const livePos: Record<string, V3> = {};
export const getPos = (s: Pick<G, "items">, id: string): V3 => livePos[id] ?? s.items[id].pos;

export function initialItems(): Record<string, Item> {
  const mk = (id: string, kind: Kind, label: string, pos: V3, cap: number, contents: Contents = {}, extra: Partial<Item> = {}): Item => ({ id, kind, label, pos, cap, contents, contaminated: false, cells: 0, loc: null, bathMs: 0, thawed: false, frozen: false, ...extra });
  return Object.fromEntries([
    mk("pipette", "pipette", "Micropipeta (1–1000 µL)", [-3.2, 0.9, -3.9], 0),
    mk("ethanol", "ethanol", "Spray de etanol 70 %", [-2.7, 0.9, -3.9], 0),
    mk("medio", "flask", "Frasco de medio DMEM", [-2.1, 0.9, -3.9], 100000, { medio: 30000 }),
    mk("pbs", "flask", "Frasco de PBS", [-1.6, 0.9, -3.9], 100000, { pbs: 30000 }),
    mk("sfb", "bottle", "Botella de SFB", [1.8, 0.9, -3.9], 20000, { sfb: 10000 }),
    mk("stock", "bottle", "Stock 10 mg/mL", [2.3, 0.9, -3.9], 10000, { stock: 5000 }),
    mk("tripan", "bottle", "Azul de tripán 0,4 %", [-1.1, 0.9, -3.9], 10000, { tripan: 5000 }),
    mk("tripsina", "bottle", "Tripsina-EDTA 0,25 %", [2.75, 0.9, -3.55], 10000, { tripsina: 5000 }),
    mk("dmso", "bottle", "DMSO (crioprotector)", [4.75, 0.9, -3.9], 10000, { dmso: 5000 }),
    mk("cryo2", "cryo", "Criovial 2 (vacío, para congelar)", [4.1, 0.9, -3.6], 1500),
    mk("cA", "cflask", "Frasco A (otro grupo)", [-4.7, 0.9, -3.5], 12000, { medio: 3000 }, { cells: 1.2e6, blind: true }),
    mk("cB", "cflask", "Frasco B (otro grupo)", [-4.3, 0.9, -3.5], 12000, { medio: 3000 }, { cells: 1.2e6, contaminated: true, reason: "contaminación bacteriana", blind: true }),
    mk("cC", "cflask", "Frasco C (otro grupo)", [-3.9, 0.9, -3.5], 12000, { medio: 3000 }, { cells: 1.2e6, blind: true }),
    mk("mm", "bottle", "Master mix 2× (Taq, dNTP, MgCl₂)", [-3.55, 0.9, -3.5], 5000, { mm: 2000 }),
    mk("primers", "tube", "Cebadores 10 µM (producto de 500 pb)", [-3.25, 0.9, -3.5], 1000, { primers: 200 }),
    mk("dna", "tube", "ADN molde (plásmido)", [-2.95, 0.9, -3.5], 1000, { dna: 200 }),
    mk("agua", "bottle", "Agua libre de nucleasas", [-2.65, 0.9, -3.5], 10000, { agua: 5000 }),
    mk("ladder", "tube", "Marcador de peso molecular 100 pb", [-2.35, 0.9, -3.5], 500, { ladder: 40, dye: 10 }),
    mk("dye", "tube", "Tampón de carga 6×", [-2.05, 0.9, -3.5], 500, { dye: 200 }),
    mk("tubeP1", "tube", "Tubo PCR 1 (muestra)", [-1.75, 0.9, -3.5], 300),
    mk("tubeP2", "tube", "Tubo PCR 2 (control negativo)", [-1.45, 0.9, -3.5], 300),
    mk("primT", "tube", "Cebadores gen diana", [1.6, 0.9, -3.5], 1000, { primT: 200 }),
    mk("primR", "tube", "Cebadores gen referencia", [1.9, 0.9, -3.5], 1000, { primR: 200 }),
    mk("cdnaC", "tube", "cDNA control", [2.2, 0.9, -3.5], 1000, { cdnaC: 200 }),
    mk("cdnaT", "tube", "cDNA tratado (fármaco)", [2.5, 0.9, -3.5], 1000, { cdnaT: 200 }),
    mk("tubeQ1", "tube", "qPCR 1", [3.3, 0.9, -3.5], 300), mk("tubeQ2", "tube", "qPCR 2", [3.6, 0.9, -3.5], 300), mk("tubeQ3", "tube", "qPCR 3", [3.9, 0.9, -3.5], 300), mk("tubeQ4", "tube", "qPCR 4", [4.2, 0.9, -3.5], 300),
    mk("tube1", "tube", "Tubo 1", [3.0, 0.9, -3.9], 2000),
    mk("tube2", "tube", "Tubo 2", [3.25, 0.9, -3.9], 2000),
    mk("tube3", "tube", "Tubo 3", [3.5, 0.9, -3.9], 2000),
    mk("tube4", "tube", "Tubo 4 (mezcla con tripán)", [3.75, 0.9, -3.9], 2000),
    mk("tube5", "tube", "Tubo 5 (siembra)", [4.0, 0.9, -3.9], 2000),
    mk("cryo", "cryo", "Criovial: células congeladas", [4.4, 0.9, -3.6], 1500, { celulas: 1000 }, { cells: 3e5, frozen: true }),
    mk("cflask", "cflask", "Frasco de cultivo T25", [4.3, 0.9, -3.95], 12000, { medio: 1000 }),
    mk("hemo", "hemo", "Cámara de Neubauer", [-4.2, 0.9, -3.9], 20),
  ].map(i => [i.id, i]));
}

export type Mission = { id: string; module: number; title: string; todo: string; why: string; hint: string; target?: (s: G) => string[]; check: (s: G) => boolean; apply?: (p: Partial<G>, s: G) => void };
const near = (v: number | undefined, t: number, tol: number) => v !== undefined && Math.abs(v - t) <= tol;
const clean = (i: Item) => !i.contaminated;
const conf = (i: Item) => Math.min(1, i.cells / FLASK_AREA / CONF_100);
export const hoodReady = (s: Pick<G, "hoodOn" | "hoodOnAt">) => s.hoodOn && Date.now() - s.hoodOnAt >= READY_MS;
export const MISSIONS: Mission[] = [
  { id: "m1-1", module: 1, title: "Bata y guantes", todo: "Ve al perchero (pared izquierda, cerca de la entrada) y póntelos.", why: "Son tu primera barrera: te protegen a ti y evitan que tu piel y ropa contaminen las células.", hint: "Perchero a tu izquierda, junto a la pared. Apúntalo y pulsa E.", target: () => ["coat"], check: s => s.ppe, apply: p => { p.ppe = true; } },
  { id: "m1-2", module: 1, title: "Enciende la campana", todo: "Pulsa el interruptor de la campana y espera a que el aire se estabilice (luz verde).", why: "El flujo laminar con filtro HEPA tarda en estabilizarse; antes de eso no protege tu cultivo.", hint: "Interruptor en el marco superior derecho. Espera ~8 s (en la vida real 10–15 min).", target: () => ["hoodSwitch"], check: s => hoodReady(s), apply: p => { p.hoodOn = true; p.hoodOnAt = Date.now() - READY_MS; } },
  { id: "m1-3", module: 1, title: "Desinfecta la campana", todo: "Coge el spray de etanol (E), apunta al interior de la campana y haz clic.", why: "El etanol al 70 % mata microorganismos en la superficie que si no acabarían en tu medio.", hint: "El spray está en el banco, a la izquierda.", target: s => (s.held === "ethanol" ? ["hoodSwitch"] : ["ethanol"]), check: s => s.hoodClean, apply: p => { p.hoodClean = true; } },
  { id: "m1-4", module: 1, title: "Material dentro de la campana", todo: "Coloca el frasco de medio y el Tubo 1 dentro de la campana (E para coger, E para dejar).", why: "Solo el aire dentro de la campana es estéril. Todo lo abierto debe estar ahí, sin bloquear las rejillas.", hint: "Apunta a la superficie de trabajo dentro de la campana para dejarlos.", target: s => (inHood(getPos(s, "medio")) ? ["tube1"] : ["medio"]), check: s => inHood(getPos(s, "medio")) && inHood(getPos(s, "tube1")) && s.held !== "medio" && s.held !== "tube1", apply: (p, s) => { p.items = { ...s.items, medio: { ...s.items.medio, pos: [-0.6, 0.9, -4.05] }, tube1: { ...s.items.tube1, pos: [0.1, 0.9, -3.85] } }; } },
  { id: "m1-5", module: 1, title: "Pipeteo preciso", todo: "Con la pipeta: ajusta 200 µL, coloca una punta de la caja, aspira del medio y dispensa en el Tubo 1.", why: "Un error de volumen se arrastra a toda la concentración final; la técnica estéril evita contaminar el frasco.", hint: "Rueda ±10 µL (Shift ±1), ↑↓ ±100. Clic en caja = punta; en el frasco = aspirar; en el tubo = dispensar.", target: s => (s.held !== "pipette" ? ["pipette"] : !s.pip.tip ? ["tipbox"] : total(s.pip.loaded) ? ["tube1"] : ["medio"]), check: s => near(s.items.tube1.contents.medio, 200, 10) && clean(s.items.tube1) },
  { id: "m1-6", module: 1, title: "Descarta la punta", todo: "Expulsa la punta usada con R (cae a residuos).", why: "Una punta usada ya no es estéril: reutilizarla contamina el siguiente reactivo.", hint: "Pulsa R con la pipeta en la mano.", target: () => ["waste"], check: s => s.ejects > s.base.ejects },
  { id: "m1-7", module: 1, title: "Provoca un error (a propósito)", todo: "Saca el Tubo 2 de la campana, déjalo en el banco y pipetea 100 µL de medio en él fuera de la campana. Mira qué pasa.", why: "Ver una contaminación te enseña a reconocerla: el medio se enturbia, amarillea y aparecen partículas.", hint: "Necesitas una punta nueva y el tubo fuera de la campana.", target: () => ["tube2"], check: s => Object.values(s.items).some(i => i.contaminated) },
  { id: "m1-8", module: 1, title: "Reinicia el laboratorio", todo: "Pulsa N para descartar el material contaminado y reponer todo desde cero.", why: "En el laboratorio real, un cultivo contaminado se descarta con lejía y se empieza de nuevo.", hint: "Tecla N.", check: s => s.resets > s.base.resets },
  { id: "m2-1", module: 2, title: "Medio completo (10 % SFB)", todo: "En el Tubo 2 (dentro de la campana) prepara 1000 µL: 900 µL de medio + 100 µL de SFB. Cambia de punta entre reactivos.", why: "El suero aporta factores de crecimiento; la proporción cambia cómo crecen las células.", hint: "Mueve SFB, medio y Tubo 2 a la campana. Cada reactivo con punta nueva (R expulsa).", target: () => ["tube2", "sfb", "medio"], check: s => near(s.items.tube2.contents.medio, 900, 45) && near(s.items.tube2.contents.sfb, 100, 10) && clean(s.items.tube2) },
  { id: "m2-2", module: 2, title: "Dilución 1:100", todo: "En el Tubo 3 haz 1000 µL a 100 µg/mL desde el stock de 10 mg/mL: C₁V₁ = C₂V₂ → 10 µL de stock + 990 µL de PBS.", why: "Casi todo reactivo viene concentrado; diluir con exactitud decide si tu experimento mide lo que crees.", hint: "10 000 µg/mL × V₁ = 100 µg/mL × 1000 µL → V₁ = 10 µL. Primero PBS, punta nueva para el stock.", target: () => ["tube3", "pbs", "stock"], check: s => near(s.items.tube3.contents.pbs, 990, 30) && near(s.items.tube3.contents.stock, 10, 1) && clean(s.items.tube3) },
  { id: "m3-1", module: 3, title: "Descongela las células", todo: "Mete el criovial en el baño a 37 °C y sácalo cuando el hielo se haya fundido (≈6 s). No lo dejes de más.", why: "El DMSO del congelado es tóxico a temperatura ambiente: descongelar rápido y sacarlo a tiempo salva las células.", hint: "Coge el criovial (E), apunta al baño de la derecha y pulsa E. Sácalo apuntándolo y pulsando E.", target: s => (s.items.cryo.thawed ? ["cryo"] : s.held === "cryo" ? ["bath"] : s.items.cryo.loc === "bath" ? ["cryo"] : ["cryo"]), check: s => s.items.cryo.thawed && s.items.cryo.loc === null && s.held !== "cryo", apply: (p, s) => { p.items = { ...s.items, cryo: { ...s.items.cryo, thawed: true, frozen: false } }; } },
  { id: "m3-2", module: 3, title: "Siembra en el frasco T25", todo: "En la campana: pasa el contenido del criovial (1000 µL) al frasco de cultivo con medio (frasco y criovial dentro de la campana, desinfecta el criovial = está dentro).", why: "Sembrar con técnica estéril pone las células en medio fresco y diluye el DMSO tóxico.", hint: "Pipeta a 1000 µL, punta nueva. Mueve criovial y frasco T25 a la campana.", target: () => ["cryo", "cflask"], check: s => s.items.cflask.cells > 2e5 && clean(s.items.cflask), apply: (p, s) => { p.items = { ...(p.items ?? s.items), cflask: { ...s.items.cflask, cells: 3e5, detached: true, contents: { medio: 1000, celulas: 1000 } } }; } },
  { id: "m3-3", module: 3, title: "Incuba hasta ~70 % de confluencia", todo: "Guarda el frasco en la incubadora (E apuntándola) y espera. El tiempo corre ×14 400. Sácalo al 70 %.", why: "Las células se pasan a 70–80 % de confluencia: más tarde dejan de dividirse y empiezan a envejecer.", hint: "Mira el porcentaje en pantalla. Mira el frasco con el microscopio mientras tanto.", target: s => (s.items.cflask.loc === "incubator" ? ["cflask"] : ["incubator"]), check: s => conf(s.items.cflask) >= 0.7 && s.items.cflask.loc !== "incubator" && s.held !== "cflask", apply: (p, s) => { p.items = { ...(p.items ?? s.items), cflask: { ...s.items.cflask, cells: 2.2e6, detached: false, contents: { medio: 1000, celulas: 1000 } } }; } },
  { id: "m3-4", module: 3, title: "Mira las células al microscopio", todo: "Pon el frasco en la platina (E con el frasco en la mano) y mira (E con la mano vacía). Enfoca con la rueda.", why: "Antes de seguir, observa: forma, densidad y contaminación solo se ven al microscopio.", hint: "Microscopio en la pared izquierda del fondo.", target: s => (s.items.cflask.loc === "scope" ? ["microscope"] : s.held === "cflask" ? ["microscope"] : ["cflask"]), check: s => s.scopeViews > s.base.scopeViews && s.items.cflask.loc === "scope" },
  { id: "m3-5", module: 3, title: "Pasar células: retira el medio y lava con PBS", todo: "En la campana, con el frasco T25: aspira y descarta el medio gastado (clic en «Residuos» con la pipeta cargada para vaciarla). Luego añade 1000 µL de PBS, aspíralo y descártalo.", why: "El suero del medio inactiva la tripsina: sin lavar con PBS no se despegarían las células. Es el primer paso de cada pasaje.", hint: "Pipeta a 1000 µL, punta nueva. Frasco T25 dentro de la campana. El medio gastado son ~2 mL: dos aspiraciones.", target: s => (total(s.items.cflask.contents) > 150 && !s.items.cflask.washed ? ["cflask", "waste"] : ["cflask", "pbs"]), check: s => !!s.items.cflask.washed && total(s.items.cflask.contents) < 150 && s.items.cflask.cells > 1e6 && clean(s.items.cflask) && total(s.pip.loaded) === 0, apply: (p, s) => { p.items = { ...(p.items ?? s.items), cflask: { ...s.items.cflask, washed: true, contents: {} } }; } },
  { id: "m3-6", module: 3, title: "Despega con tripsina", todo: "Añade 500 µL de tripsina-EDTA al frasco, ponlo en la incubadora ≈4 s (≈5 min reales) y sácalo cuando las células se hayan despegado. Si te pasas (>12 s) la tripsina las daña.", why: "La tripsina corta las proteínas que pegan la célula al plástico. Poco tiempo: siguen pegadas; demasiado: se digieren las propias células.", hint: "Tripsina en el banco derecho (cerca del Tubo 1). Mira el aviso en pantalla: «se despegaron».", target: s => (!(s.items.cflask.contents.tripsina > 300) ? ["cflask", "tripsina"] : s.items.cflask.detached ? ["cflask"] : ["incubator"]), check: s => !!s.items.cflask.detached && s.items.cflask.loc !== "incubator" && s.held !== "cflask" && (s.items.cflask.contents.tripsina ?? 0) > 300, apply: (p, s) => { p.items = { ...(p.items ?? s.items), cflask: { ...s.items.cflask, detached: true, contents: { tripsina: 500 }, tryMs: 4500 } }; } },
  { id: "m3-7", module: 3, title: "Neutraliza la tripsina", todo: "Añade 1000 µL de medio con suero al frasco para frenar la tripsina y resuspende (dispensa y aspira).", why: "Si dejas la tripsina activa sigue digiriendo la membrana: las células se mueren. El suero la inactiva.", hint: "Punta nueva. Medio DMEM del frasco grande.", target: () => ["cflask", "medio"], check: s => !!s.items.cflask.detached && (s.items.cflask.contents.medio ?? 0) >= 900 && (s.items.cflask.contents.tripsina ?? 0) > 100 && clean(s.items.cflask), apply: (p, s) => { p.items = { ...(p.items ?? s.items), cflask: { ...s.items.cflask, contents: { tripsina: 500, medio: 1000 } } }; } },
  { id: "m3-8", module: 3, title: "Cuenta con el hemocitómetro", todo: "Saca el frasco. En el Tubo 4 mezcla 20 µL de células + 180 µL de azul de tripán (1:10). Carga 10 µL en la cámara de Neubauer, ponla en la platina y haz clic en cada célula viva (blanca) de los 4 cuadrantes. Enter termina.", why: "Contar con exactitud permite sembrar el mismo número de células en cada experimento. El azul entra solo en las muertas.", hint: "Células/mL = media por cuadrante × factor de dilución × 10 000 (el juego lo calcula con tu mezcla).", target: s => (s.items.hemo.loc === "scope" ? ["microscope"] : total(s.items.tube4.contents) > 150 ? ["hemo"] : ["tube4"]), check: s => s.countOk > s.base.countOk },
  { id: "m3-9", module: 3, title: "Siembra 2×10⁵ células", todo: "Con tu conteo, pipetea al Tubo 5 el volumen del frasco que contenga ≈ 2×10⁵ células vivas (±20 %).", why: "Sembrar un número conocido de células hace los experimentos reproducibles.", hint: "Volumen (µL) = 2×10⁵ ÷ (células vivas/mL) × 1000.", target: () => ["tube5", "cflask"], check: s => near(s.items.tube5.cells * (s.items.tube5.via ?? s.viab), 2e5, 4e4) && clean(s.items.tube5) },
  { id: "m3-10", module: 3, title: "Congela células (criopreservación)", todo: "En el Criovial 2 prepara 1000 µL: 450 µL de células del frasco + 450 µL de medio + 100 µL de DMSO (10 %). Ponlo ya en el congelador −80 °C (E apuntándolo).", why: "Sin crioprotector se forman cristales de hielo que rompen las células; con demasiado DMSO es tóxico. Se añade en frío y se congela enseguida.", hint: "Congelador en la pared derecha, al fondo cerca de ti. Punta nueva entre reactivos; DMSO cerca del Tubo 5.", target: s => (s.items.cryo2.loc === "freezer" ? [] : ["cryo2", "dmso", "freezer"]), check: s => s.items.cryo2.loc === "freezer" && !!s.items.cryo2.frozenOk, apply: (p, s) => { p.items = { ...(p.items ?? s.items), cryo2: { ...s.items.cryo2, loc: "freezer", pos: SLOT.freezer, frozen: true, frozenOk: true, cells: 5e5, contents: { medio: 450, dmso: 100, celulas: 450 } } }; } },
  { id: "m3-11", module: 3, title: "Detecta el cultivo contaminado", todo: "Tres frascos de otros compañeros (A, B, C, banco izquierdo). Mira cada uno al microscopio y tira a residuos (E apuntando «Residuos» con el frasco en la mano) solo el contaminado.", why: "Una contaminación bacteriana no siempre se ve a simple vista; si no la detectas, infecta todo tu cultivo. Se descarta y se desinfecta.", hint: "Bacterias: puntitos que se mueven; el medio puede verse turbio. No tires un frasco sano: cuenta como error.", target: s => ["cA", "cB", "cC"].filter(id => s.items[id].loc !== "gone"), check: s => s.items.cB.loc === "gone" && s.items.cA.loc !== "gone" && s.items.cC.loc !== "gone", apply: (p, s) => { p.items = { ...(p.items ?? s.items), cB: { ...s.items.cB, loc: "gone", pos: SLOT.gone } }; } },
  { id: "m6-1", module: 6, title: "PCR: prepara la mezcla (20 µL)", todo: "En el Tubo PCR 1, dentro de la campana: 10 µL master mix 2× + 2 µL cebadores + 1 µL ADN molde + 7 µL agua. Punta nueva para cada reactivo.", why: "La PCR es muy sensible: una proporción mala de Mg²⁺/cebadores baja el rendimiento o crea productos falsos. Primero lo barato (agua), el ADN al final.", hint: "Pipeta a 10, 2, 1 y 7 µL. Reactivos en el banco, fila delantera izquierda (master mix, cebadores, ADN, agua).", target: s => ["tubeP1", "mm", "primers", "dna", "agua"].filter(id => !s.items[id].loc), check: s => { const c = s.items.tubeP1.contents; return near(c.mm, 10, 1.2) && near(c.primers, 2, 0.6) && near(c.dna, 1, 0.6) && near(c.agua, 7, 1.5) && clean(s.items.tubeP1); }, apply: (p, s) => { p.items = { ...(p.items ?? s.items), tubeP1: { ...s.items.tubeP1, contents: { mm: 10, primers: 2, dna: 1, agua: 7 } } }; } },
  { id: "m6-2", module: 6, title: "Control negativo", todo: "En el Tubo PCR 2 prepara lo mismo pero SIN ADN: 10 µL master mix + 2 µL cebadores + 8 µL agua.", why: "Si el control negativo da banda, hay contaminación con ADN (de un amplicón previo, de tus guantes…) y el resultado de la muestra no vale nada.", hint: "El agua sustituye al ADN. Cambia de punta.", target: s => ["tubeP2", "mm", "primers", "agua"].filter(id => !s.items[id].loc), check: s => { const c = s.items.tubeP2.contents; return near(c.mm, 10, 1.2) && near(c.primers, 2, 0.6) && (c.dna ?? 0) < 0.3 && near(c.agua, 8, 1.5) && clean(s.items.tubeP2); }, apply: (p, s) => { p.items = { ...(p.items ?? s.items), tubeP2: { ...s.items.tubeP2, contents: { mm: 10, primers: 2, agua: 8 } } }; } },
  { id: "m6-3", module: 6, title: "Termociclador", todo: "Pon los dos tubos en el bloque (E), abre el programa con la mano vacía (E): elige hibridación ≈ Tm−5 °C (los cebadores tienen Tm 58 °C) y 25–35 ciclos. Enter arranca.", why: "Desnaturaliza (95 °C) → hibrida (Tm−5) → extiende (72 °C). Si hibridas muy frío, los cebadores se pegan donde no deben; muy caliente, no se pegan.", hint: "←→ temperatura de hibridación, ↑↓ ciclos, Enter inicia. Espera ~9 s.", target: s => (Object.values(s.items).filter(i => i.loc === "thermo").length < 2 ? ["tubeP1", "tubeP2", "thermocycler"] : ["thermocycler"]), check: s => !!s.items.tubeP1.pcr && !!s.items.tubeP2.pcr, apply: (p, s) => { p.items = { ...(p.items ?? s.items), tubeP1: { ...s.items.tubeP1, loc: "thermo", pos: SLOT.thermo, pcr: { yield: 0.95, nonspec: false, smear: false, falsePos: false, dimers: false, note: "ok" } }, tubeP2: { ...s.items.tubeP2, loc: "thermo", pos: SLOT.thermo, pcr: { yield: 0, nonspec: false, smear: false, falsePos: false, dimers: false, note: "sin molde" } } }; } },
  { id: "m6-4", module: 6, title: "Tampón de carga", todo: "Saca los tubos y añade 4 µL de tampón de carga 6× a cada uno (punta nueva).", why: "El tampón da densidad (la muestra se hunde en el pocillo) y un colorante para ver cuánto ha corrido.", hint: "Tubos en la campana; tampón de carga en el banco (fila delantera).", target: s => ["tubeP1", "tubeP2", "dye"].filter(id => (s.items[id].contents.dye ?? 0) < 3 || id === "dye"), check: s => ["tubeP1", "tubeP2"].every(id => near(s.items[id].contents.dye, 4, 1.2) && clean(s.items[id])), apply: (p, s) => { const it = (p.items ?? s.items); p.items = { ...it, tubeP1: { ...it.tubeP1, contents: { ...it.tubeP1.contents, dye: 4 } }, tubeP2: { ...it.tubeP2, contents: { ...it.tubeP2.contents, dye: 4 } } }; } },
  { id: "m6-5", module: 6, title: "Carga el gel", todo: "Con 6–12 µL por pocillo carga, en este orden: marcador, Tubo PCR 1, Tubo PCR 2 (punta nueva cada vez; clic en la cámara de electroforesis).", why: "El marcador de peso te permite saber el tamaño del fragmento; sin él no puedes interpretar la banda.", hint: "Aspira → apunta a la cámara (pared izquierda) → clic. Máx. ~15 µL por pocillo.", target: s => ["ladder", "tubeP1", "tubeP2", "gel"], check: s => s.gel.lanes.some(l => l.kind === "ladder" && !l.lost) && ["tubeP1", "tubeP2"].every(id => s.gel.lanes.some(l => l.src === id && !l.lost)), apply: (p, s) => { p.gel = { ...s.gel, lanes: [{ src: "ladder", label: "Marcador", kind: "ladder", vol: 8, lost: false, bands: bandsFor("ladder", 8).bands, smear: false, spill: false }, { src: "tubeP1", label: "Muestra", kind: "sample", vol: 10, lost: false, bands: [{ size: 500, i: 0.95 }], smear: false, spill: false }, { src: "tubeP2", label: "Control negativo", kind: "sample", vol: 10, lost: false, bands: [], smear: false, spill: false }] }; } },
  { id: "m6-6", module: 6, title: "Corre el gel", todo: "Con la mano vacía [E] en la cámara: fuente de poder. ≈100 V; Enter para empezar y Enter otra vez cuando el frente del azul llegue ~3/4 del gel (no más de 150 V).", why: "Voltaje alto calienta y deforma las bandas; parar tarde saca los fragmentos pequeños del gel; parar pronto no los separa.", hint: "↑↓ voltaje (antes de empezar). Corre ~7–9 s a 100 V.", target: () => ["gel"], check: s => s.gel.done && s.gel.T >= 0.45 && s.gel.T <= 1.0 && s.gel.volt <= 150, apply: (p, s) => { p.gel = { ...(p.gel ?? s.gel), done: true, T: 0.8, volt: 100 }; } },
  { id: "m6-7", module: 6, title: "Lee el gel", todo: "[E] en la cámara: transiluminador. Haz clic en la banda de tu muestra: el juego interpola su tamaño con el marcador (debe ser ≈500 pb) y el control negativo debe salir limpio.", why: "El tamaño se lee comparando con el marcador en escala logarítmica. Una banda en el control negativo invalida todo.", hint: "Si ves banda en el control negativo o bandas extra, repite la PCR (gel nuevo con G en la fuente, otro programa).", target: () => ["gel"], check: s => s.gel.estOk > 0 && s.gel.lanes.filter(l => l.src === "tubeP2").every(l => l.bands.length === 0), apply: (p, s) => { p.gel = { ...(p.gel ?? s.gel), estOk: 1 }; } },
  { id: "m6-8", module: 6, title: "qPCR: prepara 4 reacciones (10 µL)", todo: "qPCR 1: 5 µL master mix + 1 µL cebadores diana + 1 µL cDNA control + 3 µL agua. qPCR 2: igual con cDNA tratado. qPCR 3 y 4: cebadores referencia con cDNA control y tratado.", why: "Un gen de referencia (que no cambia) corrige diferencias de cantidad de cDNA entre muestras: sin él no puedes comparar.", hint: "Diana+control, diana+tratado, referencia+control, referencia+tratado.", target: () => ["tubeQ1", "mm", "primT", "primR", "cdnaC", "cdnaT"], check: s => { const ok = (id: string, pr: string, cd: string) => { const c = s.items[id].contents; return near(c.mm, 5, 0.9) && near(c[pr], 1, 0.45) && near(c[cd], 1, 0.45) && near(c.agua, 3, 1.1) && (c[pr === "primT" ? "primR" : "primT"] ?? 0) < 0.2 && (c[cd === "cdnaC" ? "cdnaT" : "cdnaC"] ?? 0) < 0.2 && clean(s.items[id]); }; return ok("tubeQ1", "primT", "cdnaC") && ok("tubeQ2", "primT", "cdnaT") && ok("tubeQ3", "primR", "cdnaC") && ok("tubeQ4", "primR", "cdnaT"); }, apply: (p, s) => { const it = { ...(p.items ?? s.items) }; const mkq = (id: string, pr: string, cd: string) => { it[id] = { ...s.items[id], contents: { mm: 5, [pr]: 1, [cd]: 1, agua: 3 } }; }; mkq("tubeQ1", "primT", "cdnaC"); mkq("tubeQ2", "primT", "cdnaT"); mkq("tubeQ3", "primR", "cdnaC"); mkq("tubeQ4", "primR", "cdnaT"); p.items = it; } },
  { id: "m6-9", module: 6, title: "qPCR: corre y calcula ΔΔCt", todo: "Pon los 4 tubos en el bloque, abre el equipo, pulsa M para modo qPCR y Enter. Con los Ct calcula el cambio de expresión: ΔCt = Ct diana − Ct ref; ΔΔCt = ΔCt tratado − ΔCt control; cambio = 2^(−ΔΔCt). Ajústalo con ←→ y confirma con Enter.", why: "El Ct es el ciclo donde la fluorescencia cruza el umbral: cada ciclo menos = el doble de molde. Así se mide expresión génica relativa.", hint: "Los 4 tubos juntos en el bloque. La tabla de Ct aparece al terminar (≈8 s).", target: () => ["thermocycler"], check: s => s.qa.ok > 0 },
];

export type Panel = null | "thermo" | "gel" | "gelview" | "cf" | "reader";
export type Thermo = { mode: "pcr" | "qpcr"; anneal: number; cycles: number; runStart: number | null; runs: number; mqpcr: number };
export type GelS = { lanes: Lane[]; volt: number; running: boolean; T: number; done: boolean; est: { lane: number; size: number } | null; estOk: number; startedAt: number | null };
export type Cf = { rpm: number; min: number; runStart: number | null; runMs: number; runs: number; last: string };
export type Qa = { fold: number | null; ok: number };
export interface G {
  panel: Panel; thermo: Thermo; gel: GelS; cf: Cf; qa: Qa;
  openPanel(p: Panel): void; closePanel(): void; setThermo(p: Partial<Thermo>): void; startThermo(): void; setCf(p: Partial<Cf>): void; startCf(): void; gelVolt(d: number): void; gelToggle(): void; gelClear(): void; gelEst(lane: number, size: number): void; qAnswer(l2: number): void;
  items: Record<string, Item>; held: string | null; pip: Pip; ppe: boolean; hoodOn: boolean; hoodOnAt: number; hoodClean: boolean; viab: number;
  ejects: number; resets: number; errors: number; scopeViews: number; countOk: number; lastCount: { mean: number; conc: number; ok: boolean; via?: number } | null; viabOk: number;
  completed: Record<string, number>; missionIdx: number; base: { ejects: number; resets: number; errors: number; scopeViews: number; countOk: number };
  toasts: Toast[]; aim: Aim; now: number; locked: boolean; loaded: boolean; scopeOpen: boolean; pipAnim: { kind: "asp" | "disp"; at: number } | null; lastTick: number;
  init(): void; tick(): void; setLocked(b: boolean): void; setAim(a: Aim): void; setScope(b: boolean): void; submitCount(mean: number, truth: number, factor?: number, via?: { est: number; truth: number }): void;
  interact(): void; use(): void; eject(): void; adjust(d: number): void; reset(): void; wipe(): void;
}
const KEY = "wetlab3d-v2";
let tid = 1;
const fresh = () => ({ panel: null as Panel, thermo: { mode: "pcr", anneal: 50, cycles: 20, runStart: null, runs: 0, mqpcr: 0 } as Thermo, gel: { lanes: [], volt: 100, running: false, T: 0, done: false, est: null, estOk: 0, startedAt: null } as GelS, cf: { rpm: 3000, min: 5, runStart: null, runMs: 0, runs: 0, last: "" } as Cf, qa: { fold: null, ok: 0 } as Qa, items: initialItems(), held: null as string | null, pip: { set: 200, tip: null, loaded: {}, loadedContam: false, loadedCells: 0, loadedVia: 0.93 } as Pip, ppe: false, hoodOn: false, hoodOnAt: 0, hoodClean: false, viab: 0.93 });
const clearLive = () => { for (const k of Object.keys(livePos)) delete livePos[k]; };

function workCheck(s: G, pos: V3): string | null {
  if (!s.ppe) return "sin bata ni guantes"; if (!s.hoodOn) return "campana apagada"; if (!hoodReady(s)) return "la campana aún no se estabilizó";
  if (!s.hoodClean) return "superficie sin desinfectar"; if (!inHood(pos)) return "fuera de la campana"; return null;
}
const contaminate = (i: Item, why: string): Item => (i.contaminated ? i : { ...i, contaminated: true, reason: why });
const mix = (a: Contents, b: Contents, f = 1) => { const o = { ...a }; for (const k in b) o[k] = (o[k] || 0) + b[k] * f; return o; };

export const useGame = create<G>((set, get) => {
  const say = (text: string, kind: Toast["kind"] = "info") => set(s => ({ toasts: [...s.toasts.slice(-3), { id: tid++, text, kind, at: Date.now() }] }));
  const bad = (text: string) => { set(s => ({ errors: s.errors + 1 })); say("⚠ " + text, "err"); sfx.error(); };
  const snap = (s: G) => ({ ejects: s.ejects, resets: s.resets, errors: s.errors, scopeViews: s.scopeViews, countOk: s.countOk });
  const evaluate = () => {
    const s = get(); const m = MISSIONS[s.missionIdx]; if (!m || !s.loaded) return; if (!m.check(s)) return;
    const pts = Math.max(20, 100 - 20 * (s.errors - s.base.errors));
    const completed = { ...s.completed, [m.id]: Math.max(s.completed[m.id] ?? 0, pts) };
    try { localStorage.setItem(KEY, JSON.stringify({ completed })); } catch {}
    set({ completed, missionIdx: s.missionIdx + 1, base: snap(s) });
    say(`✅ Misión completada: ${m.title} (+${pts} pts)`, "ok"); sfx.chime(); evaluate();
  };
  const upd = (p: Partial<G>) => { set(p as any); evaluate(); };
  const syncHood = () => { const s = get(); sfx.hood(s.hoodOn, hoodReady(s)); };
  return {
    ...fresh(), ejects: 0, resets: 0, errors: 0, scopeViews: 0, countOk: 0, viabOk: 0, lastCount: null, completed: {}, missionIdx: 0, base: { ejects: 0, resets: 0, errors: 0, scopeViews: 0, countOk: 0 },
    toasts: [], aim: { type: null, id: "", up: false }, now: Date.now(), locked: false, loaded: false, scopeOpen: false, pipAnim: null, lastTick: Date.now(),
    init() {
      let completed: Record<string, number> = {};
      try { completed = JSON.parse(localStorage.getItem(KEY) || "{}").completed || {}; } catch {}
      let idx = 0; while (idx < MISSIONS.length && completed[MISSIONS[idx].id] !== undefined) idx++;
      const p: Partial<G> = {}; Object.assign(p, fresh()); clearLive();
      for (let i = 0; i < idx; i++) MISSIONS[i].apply?.(p, { ...get(), ...p } as G);
      set({ ...p, completed, missionIdx: idx, loaded: true, base: snap(get()) } as any); syncHood();
    },
    tick() {
      const now = Date.now(); const s0 = get(); const dtS = Math.min(2, (now - s0.lastTick) / 1000); let items = s0.items; let changed = false; const msgs: string[] = [];
      for (const id in items) {
        const it = items[id];
        if (it.loc === "incubator" && it.kind === "cflask" && (it.contents.tripsina ?? 0) > 300) { const t = (it.tryMs ?? 0) + dtS * 1000; let n = { ...items[id], tryMs: t }; if (t >= 4000 && !it.detached) { n.detached = true; msgs.push("Las células se despegaron (se ven redondas y flotando). Sácalas y neutraliza."); } if (t > 12000 && !n.via) { n.via = 0.55; msgs.push("Demasiado tiempo con tripsina: se dañó la membrana, viabilidad baja."); } items = { ...items, [id]: n }; changed = true; }
        else if (it.loc === "incubator" && it.cells > 0 && !it.contaminated && it.detached !== true) { const capC = CONF_100 * FLASK_AREA; const nc = Math.min(capC, it.cells * Math.pow(2, (dtS * SIM_H_PER_S) / 24)); if (nc !== it.cells) { items = { ...items, [id]: { ...items[id], cells: nc } }; changed = true; } }
        if (it.loc === "bath" && it.frozen) { const b = it.bathMs + dtS * 1000; const th = b >= 6000; items = { ...items, [id]: { ...items[id], bathMs: b, frozen: !th, thawed: th || it.thawed } }; changed = true; if (th) msgs.push("El hielo se fundió: saca el criovial ya."); }
        else if (it.loc === "bath" && it.thawed) { const b = it.bathMs + dtS * 1000; items = { ...items, [id]: { ...items[id], bathMs: b } }; changed = true; if (b > 14000 && it.bathMs <= 14000) { set({ viab: 0.55 }); msgs.push("Demasiado tiempo a 37 °C con DMSO: viabilidad baja."); } }
      }
      const sx = get();
      if (sx.thermo.runStart && now - sx.thermo.runStart >= (sx.thermo.mode === "pcr" ? PCR_RUN_MS : 8000)) {
        const th = sx.thermo; let n = 0;
        for (const id in items) { const it = items[id]; if (it.loc !== "thermo") continue; n++; items = { ...items, [id]: th.mode === "pcr" ? { ...it, pcr: pcrResult(it.contents, it.contaminated, th.anneal, th.cycles) } : { ...it, ct: ctFor(it.contents, id) } }; }
        changed = true; set({ thermo: { ...th, runStart: null, runs: th.runs + (th.mode === "pcr" ? 1 : 0), mqpcr: th.mqpcr + (th.mode === "qpcr" ? 1 : 0) } }); msgs.push(th.mode === "pcr" ? `PCR terminada (${n} tubos). El resultado se ve en el gel.` : `qPCR terminada: revisa los Ct en la pantalla del equipo.`); sfx.chime();
      }
      if (sx.gel.running) { const g = sx.gel; const T = g.T + (g.volt / 100) * ((now - s0.lastTick) / GEL_FULL_MS) * 0.85; set({ gel: { ...g, T } }); }
      if (sx.cf.runStart && now - sx.cf.runStart >= sx.cf.runMs) {
        const c = sx.cf; let notes = ""; for (const id in items) { const it = items[id]; if (it.loc !== "centrifuge") continue; const good = c.rpm >= 3000 && c.min >= 3; items = { ...items, [id]: { ...it, spun: good, ...(c.rpm > 5000 && it.cells > 0 && !it.via ? { via: 0.5 } : {}) } }; notes = good ? "pellet formado" : "poco tiempo/velocidad: sin pellet claro"; }
        changed = true; set({ cf: { ...c, runStart: null, runs: c.runs + 1, last: notes } }); msgs.push(`Centrifugación terminada: ${notes}.`); sfx.chime();
      }
      set({ now, lastTick: now, ...(changed ? { items } : {}) });
      msgs.forEach(m => say(m, "info")); syncHood(); evaluate();
    },
    openPanel(p) { set({ panel: p, locked: false }); },
    closePanel() { set({ panel: null }); },
    setThermo(p) { if (get().thermo.runStart) return; set(s => ({ thermo: { ...s.thermo, ...p, anneal: Math.max(40, Math.min(72, p.anneal ?? s.thermo.anneal)), cycles: Math.max(5, Math.min(45, p.cycles ?? s.thermo.cycles)) } })); sfx.click(); },
    startThermo() {
      const s = get(); if (s.thermo.runStart) return; const tubes = Object.values(s.items).filter(i => i.loc === "thermo"); if (!tubes.length) return say("Coloca primero los tubos en el bloque (E con el tubo en la mano).", "info");
      set({ thermo: { ...s.thermo, runStart: Date.now() } }); sfx.click(); say(s.thermo.mode === "pcr" ? `Programa PCR: 95 °C → ${s.thermo.anneal} °C → 72 °C × ${s.thermo.cycles} ciclos.` : "qPCR en marcha: se mide la fluorescencia en cada ciclo.", "info");
    },
    setCf(p) { if (get().cf.runStart) return; set(s => ({ cf: { ...s.cf, ...p, rpm: Math.max(1000, Math.min(15000, p.rpm ?? s.cf.rpm)), min: Math.max(1, Math.min(20, p.min ?? s.cf.min)) } })); sfx.click(); },
    startCf() {
      const s = get(); if (s.cf.runStart) return; const t = Object.values(s.items).filter(i => i.loc === "centrifuge"); if (!t.length) return say("Pon tubos en el rotor (E con el tubo en la mano).", "info");
      if (t.length % 2) return bad("Rotor desbalanceado: pon un número par de tubos, uno frente a otro (usa un tubo con agua como contrapeso).");
      const v = t.map(i => total(i.contents)).sort((a, b) => a - b); for (let i = 0; i < v.length; i += 2) if (Math.abs(v[i] - v[i + 1]) > 20) return bad("Rotor desbalanceado: los tubos opuestos deben pesar casi igual (±20 µL). A alta velocidad se rompe el rotor.");
      const ms = 2000 + s.cf.min * 300; set({ cf: { ...s.cf, runStart: Date.now(), runMs: ms } }); sfx.click(); say(`Centrifugando ${s.cf.rpm} rpm · ${s.cf.min} min (acelerado).`, "info");
    },
    gelVolt(d) { const g = get().gel; if (g.running || g.done) return; set({ gel: { ...g, volt: Math.max(30, Math.min(200, g.volt + d)) } }); sfx.click(); },
    gelToggle() {
      const g = get().gel; if (g.done) return;
      if (!g.running) { if (!g.lanes.length) return say("Carga primero el gel con la pipeta.", "info"); set({ gel: { ...g, running: true, startedAt: Date.now() } }); say("Electroforesis en marcha: el ADN (carga −) migra hacia el polo +. Para cuando el frente llegue ~3/4.", "info"); }
      else { set({ gel: { ...g, running: false, done: true } }); say(`Electroforesis detenida (recorrido ${Math.round(g.T * 100)} %). Mira el gel con [E].`, "ok"); }
      evaluate();
    },
    gelClear() { const g = get().gel; if (g.running) return; set({ gel: { ...g, lanes: [], T: 0, done: false, est: null, running: false, startedAt: null } }); say("Gel nuevo colocado (pocillos vacíos).", "info"); },
    gelEst(lane, size) {
      const g = get().gel; const L = g.lanes[lane]; set({ gel: { ...g, est: { lane, size } } });
      const ok = L && L.kind === "sample" && L.bands.length && Math.abs(size - AMPLICON) / AMPLICON <= 0.15; if (ok) { set({ gel: { ...get().gel, estOk: get().gel.estOk + 1 } }); say(`Tamaño estimado ${Math.round(size)} pb ≈ producto esperado (500 pb) ✓`, "ok"); } else say(`Estimado ${Math.round(size)} pb: no coincide con el producto esperado (500 pb).`, "info"); evaluate();
    },
    qAnswer(l2) { const t = Math.log2(4); const ok = Math.abs(l2 - t) <= 0.5; set(s => ({ qa: { fold: Math.pow(2, l2), ok: s.qa.ok + (ok ? 1 : 0) } })); if (ok) say(`Cambio de expresión ≈ ${Math.pow(2, l2).toFixed(1)}× ✓ (2^−ΔΔCt)`, "ok"); else bad(`Con ${Math.pow(2, l2).toFixed(1)}× no cuadra: ΔΔCt = (Ct diana−Ct ref)tratado − (Ct diana−Ct ref)control; cambio = 2^(−ΔΔCt).`); evaluate(); },
    setLocked(b) { set({ locked: b }); if (b) sfx.start(); },
    setAim(a) { set({ aim: a }); },
    setScope(b) { set({ scopeOpen: b, ...(b ? { locked: false } : {}) }); if (b) { set(s => { const st = Object.values(s.items).find(i => i.loc === "scope"); return { scopeViews: s.scopeViews + 1, items: st ? { ...s.items, [st.id]: { ...st, viewed: true } } : s.items }; }); evaluate(); } },
    submitCount(mean, truth, factor = 2, via) {
      const conc = mean * factor * 1e4; const ok = truth > 0 && Math.abs(mean - truth) / truth <= 0.15; set(s => ({ lastCount: { mean, conc, ok, via: via?.est }, countOk: s.countOk + (ok ? 1 : 0), viabOk: s.viabOk + (via && Math.abs(via.est - via.truth) <= 0.12 ? 1 : 0) }));
      if (ok) say(`Conteo correcto: media ${mean.toFixed(1)} → ${conc.toExponential(2)} células/mL`, "ok"); else bad(`Tu conteo se desvía mucho (media ${mean.toFixed(1)}). Revisa: solo cuentas las blancas (vivas) y en los 4 cuadrantes.`);
      evaluate();
    },
    wipe() { try { localStorage.removeItem(KEY); } catch {} clearLive(); set({ ...fresh(), viabOk: 0, completed: {}, missionIdx: 0, errors: 0, ejects: 0, resets: 0, scopeViews: 0, countOk: 0, lastCount: null, base: { ejects: 0, resets: 0, errors: 0, scopeViews: 0, countOk: 0 } } as any); syncHood(); },
    reset() { clearLive(); set({ ...fresh(), ppe: get().ppe, hoodOn: get().hoodOn, hoodOnAt: get().hoodOnAt, hoodClean: get().hoodClean, resets: get().resets + 1 } as any); say("Laboratorio repuesto: material nuevo y estéril (se descartó el anterior).", "info"); evaluate(); },
    adjust(d) { const p = get().pip; const v = Math.max(1, Math.min(1000, p.set + d)); if (v !== p.set) sfx.click(); set({ pip: { ...p, set: v } }); },
    eject() {
      const s = get(); if (s.held !== "pipette") return; if (!s.pip.tip) return say("La pipeta no tiene punta.", "info");
      sfx.tip(); set({ pip: { ...s.pip, tip: null, loaded: {}, loadedContam: false, loadedCells: 0, loadedVia: 0.93 }, ejects: s.ejects + 1 }); say("Punta descartada en residuos.", "ok"); evaluate();
    },
    interact() {
      const s = get(); const a = s.aim; const here = (id: string) => livePos[id] ?? s.items[id].pos;
      if (!s.held) {
        if (a.type === "item") { const it = s.items[a.id]; if ((it.loc === "thermo" && s.thermo.runStart) || (it.loc === "centrifuge" && s.cf.runStart)) return say("El equipo está en marcha: espera a que termine.", "info"); sfx.grab(); const items = it.loc ? { ...s.items, [a.id]: { ...it, loc: null } } : s.items; upd({ held: a.id, items }); return; }
        if (a.type === "fixed") {
          if (a.id === "coat") { if (s.ppe) say("Ya llevas bata y guantes.", "info"); else { upd({ ppe: true }); sfx.grab(); say("Te pusiste bata y guantes.", "ok"); } }
          else if (a.id === "hoodSwitch") { sfx.click(); if (s.hoodOn) { upd({ hoodOn: false }); say("Campana apagada.", "info"); } else { upd({ hoodOn: true, hoodOnAt: Date.now() }); say("Campana encendida: espera a que se estabilice (~8 s).", "info"); } syncHood(); }
          else if (a.id === "microscope") { const st = Object.values(s.items).find(i => i.loc === "scope"); if (!st) say("Coloca primero una muestra en la platina (frasco de cultivo o cámara de Neubauer).", "info"); else get().setScope(true); }
          else if (a.id === "thermocycler") { if (!Object.values(s.items).some(i => i.loc === "thermo")) say("Coloca primero tubos en el bloque (E con el tubo en la mano).", "info"); else get().openPanel("thermo"); }
          else if (a.id === "gel") get().openPanel(s.gel.done ? "gelview" : "gel");
          else if (a.id === "centrifuge") get().openPanel("cf");
          else say(`${FIXED[a.id].label}: ${FIXED[a.id].hint}`, "info");
        }
        return;
      }
      const it = s.items[s.held];
      if (a.type === "fixed" && a.id === "waste" && s.held !== "pipette") {
        if (it.kind !== "cflask") return say("Eso no va a residuos. (Solo frascos de cultivo.)", "info");
        if (it.blind && !it.contaminated) return bad("¡Ese cultivo estaba sano! No se tira.");
        if (it.blind && !it.viewed) bad("Lo descartaste sin mirarlo al microscopio: acertaste de casualidad, comprueba siempre antes.");
        sfx.clink(); upd({ held: null, items: { ...s.items, [it.id]: { ...it, loc: "gone", pos: SLOT.gone } } }); say(it.contaminated ? "Cultivo contaminado descartado en residuos (en el lab real: lejía antes de tirarlo)." : "Frasco descartado.", "ok"); return;
      }
      if (a.type === "fixed" && ["incubator", "microscope", "bath", "freezer", "thermocycler", "centrifuge"].includes(a.id)) {
        const loc: Exclude<Loc, null> = a.id === "incubator" ? "incubator" : a.id === "bath" ? "bath" : a.id === "freezer" ? "freezer" : a.id === "thermocycler" ? "thermo" : a.id === "centrifuge" ? "centrifuge" : "scope";
        if ((loc === "thermo" && s.thermo.runStart) || (loc === "centrifuge" && s.cf.runStart)) return say("El equipo está en marcha.", "info");
        const ok = loc === "thermo" || loc === "centrifuge" ? it.kind === "tube" || it.kind === "cryo" : loc === "incubator" ? it.kind === "cflask" || it.kind === "tube" : loc === "bath" ? it.kind === "cryo" : loc === "freezer" ? it.kind === "cryo" : it.kind === "cflask" || it.kind === "hemo";
        if (!ok) return say(`${FIXED[a.id].label}: eso no va aquí. ${FIXED[a.id].hint}`, "info");
        if (Object.values(s.items).some(i => i.loc === loc && i.id !== it.id) && loc === "scope") return say("La platina ya está ocupada.", "info");
        sfx.clink(); const n = Object.values(s.items).filter(i => i.loc === loc && i.id !== it.id).length; const b = SLOT[loc]; const pos: V3 = loc === "incubator" || loc === "bath" ? [b[0], b[1], b[2] + [0, 0.11, -0.11, 0.22][n % 4]] : loc === "thermo" || loc === "centrifuge" ? [b[0] + [-0.06, 0.06, -0.02, 0.02, -0.1, 0.1][n % 6] * 0.5, b[1], b[2] + [-0.08, -0.04, 0, 0.04, 0.08, 0.12][n % 6]] : b; livePos[it.id] = pos;
        let nit: Item = { ...it, pos, loc };
        if (loc === "incubator" && it.kind === "cflask" && it.cells > 0 && it.detached && !((it.contents.tripsina ?? 0) > 300)) nit.detached = false;
        if (loc === "freezer") { const t = Math.max(1, total(it.contents)); const f = (it.contents.dmso ?? 0) / t; const good = f >= 0.05 && f <= 0.15 && it.cells > 0; nit = { ...nit, frozen: true, frozenOk: good, via: good ? it.via : 0.3 };
          if (!good) bad(f < 0.05 ? "Sin (suficiente) DMSO: se formarán cristales de hielo y las células morirán al descongelar." : f > 0.15 ? "Demasiado DMSO: es tóxico para las células." : "El criovial no tiene células."); else say("Criovial a −80 °C. En el lab real: caja con isopropanol (−1 °C/min) y luego nitrógeno líquido.", "ok"); upd({ held: null, items: { ...s.items, [it.id]: nit } }); return; }
        upd({ held: null, items: { ...s.items, [it.id]: nit } });
        say(loc === "thermo" ? "Tubo en el bloque. Con la mano vacía, [E] abre el programa." : loc === "centrifuge" ? "Tubo en el rotor. [E] con la mano vacía: velocidad y tiempo." : loc === "incubator" ? "Frasco en la incubadora: el tiempo corre ×14 400." : loc === "bath" ? "Criovial en el baño: espera a que se funda el hielo." : "Muestra en la platina. Sin nada en la mano, pulsa E para mirar.", "info"); return;
      }
      if (a.type === "surface" && a.up) {
        const [x, y, z] = aimRef.point; sfx.clink(); let pip = s.pip; const pos: V3 = [x, y + 0.01, z]; livePos[it.id] = pos;
        if (s.held === "pipette" && pip.tip && !pip.tip.contaminated) { pip = { ...pip, tip: { ...pip.tip, contaminated: true } }; bad("Apoyaste la pipeta con la punta puesta: la punta ya no es estéril."); }
        upd({ items: { ...s.items, [s.held]: { ...it, pos } }, held: null, pip }); return;
      }
      if (a.type === null) { sfx.clink(); const c = (window as any).__cam; if (c) { const p: V3 = [c.position.x - Math.sin(c.rotation.y) * 0.6, 1.2, c.position.z - Math.cos(c.rotation.y) * 0.6]; livePos[it.id] = p; upd({ items: { ...s.items, [s.held]: { ...it, pos: p } }, held: null }); say("Soltaste el objeto: cae al suelo.", "info"); return; } }
      say("Apunta a una superficie plana para dejarlo.", "info"); void here;
    },
    use() {
      const s = get(); const a = s.aim;
      if (s.held === "ethanol") {
        sfx.spray();
        if (!inHood(aimRef.point) || a.type === null) { say("Rocías etanol, pero fuera de la campana no sirve.", "info"); return; }
        if (!s.hoodClean) { upd({ hoodClean: true }); say("Interior de la campana desinfectado.", "ok"); syncHood(); } else say("Ya está desinfectada.", "info"); return;
      }
      if (s.held !== "pipette") { if (s.held) say("Pulsa E apuntando a una superficie para dejarlo.", "info"); return; }
      const pip = s.pip;
      if (a.type === "fixed" && a.id === "waste") {
        if (!total(pip.loaded)) return say("La pipeta está vacía. Aspira algo y vacíalo aquí.", "info");
        sfx.pipette(false); set({ pip: { ...pip, loaded: {}, loadedCells: 0, loadedContam: false }, pipAnim: { kind: "disp", at: Date.now() } }); say("Líquido descartado en residuos.", "ok"); evaluate(); return;
      }
      if (a.type === "fixed" && a.id === "gel") {
        if (!total(pip.loaded) || !pip.tip) return say("Aspira antes la muestra con una punta nueva y luego carga el pocillo.", "info");
        const g = s.gel; if (g.running || g.done) return say("El gel ya corrió o está corriendo. Pon un gel nuevo desde la fuente (tecla G en el panel).", "info"); if (g.lanes.length >= 6) return say("El gel solo tiene 6 pocillos.", "info");
        const vol = total(pip.loaded); const srcId = pip.tip.lastSource ?? ""; const src = s.items[srcId]; const kind: "ladder" | "sample" = srcId === "ladder" ? "ladder" : "sample";
        const dyeF = (pip.loaded.dye ?? 0) / vol; const problems: string[] = []; let lost = false; let eff = vol;
        if (dyeF < 0.08) { lost = true; problems.push("Sin tampón de carga la muestra no se hunde en el pocillo: se difunde y se pierde."); }
        if (vol > 15) { eff = 15; problems.push(`El pocillo admite ~15 µL: se derramaron ${Math.round(vol - 15)} µL.`); } if (vol < 3) problems.push("Volumen muy pequeño: la banda saldrá muy tenue.");
        const bb = bandsFor(kind, eff, src?.pcr); const lane: Lane = { src: srcId, label: kind === "ladder" ? "Marcador" : src?.label ?? srcId, kind, vol, lost, bands: lost ? [] : bb.bands, smear: lost ? false : bb.smear, spill: vol > 15 };
        sfx.pipette(false); set({ gel: { ...g, lanes: [...g.lanes, lane] }, pip: { ...pip, loaded: {}, loadedCells: 0, loadedContam: false }, pipAnim: { kind: "disp", at: Date.now() } });
        if (problems.length) bad(problems.join(" ")); else say(`Pocillo ${g.lanes.length + 1} cargado (${Math.round(vol)} µL de ${kind === "ladder" ? "marcador" : src?.label ?? srcId}).`, "ok"); evaluate(); return;
      }
      if (a.type === "fixed" && a.id === "tipbox") {
        if (pip.tip) return say("Ya tienes una punta puesta (R para descartarla).", "info");
        sfx.tip(); const why = workCheck(s, TIPBOX_POS); set({ pip: { ...pip, tip: { contaminated: !!why, lastSource: null } } });
        if (why) bad(`Tocaste una punta estéril en malas condiciones (${why}): la punta está contaminada.`); else say("Punta estéril colocada.", "ok"); evaluate(); return;
      }
      if (a.type === "item") {
        const t = s.items[a.id]; if (!t || !["tube", "bottle", "flask", "cryo", "cflask", "hemo"].includes(t.kind)) return;
        if (!pip.tip) return bad("Necesitas una punta (clic en la caja de puntas).");
        const problems: string[] = []; const tip = { ...pip.tip }; let tg = { ...t }; const why = workCheck(s, livePos[t.id] ?? t.pos);
        if (total(pip.loaded) === 0) {
          if (t.frozen) return bad("El criovial sigue congelado: descongélalo en el baño a 37 °C.");
          if (why) { tg = contaminate(tg, why); tip.contaminated = true; problems.push(`Pipeteaste en malas condiciones (${why}): ${t.label} contaminado.`); }
          if (tip.lastSource && tip.lastSource !== t.id) { tg = contaminate(tg, "contaminación cruzada por reutilizar la punta"); problems.push("Reutilizaste la punta con otro reactivo: contaminación cruzada."); }
          if (tip.contaminated && !tg.contaminated) { tg = contaminate(tg, "punta contaminada"); problems.push("La punta estaba contaminada: contaminaste el recipiente."); }
          const avail = total(tg.contents); if (avail <= 0) return bad(`${t.label} está vacío.`);
          const take = Math.min(pip.set, avail); const f = take / avail; const loaded = mix({}, tg.contents, f); const left: Contents = {}; for (const k in tg.contents) left[k] = tg.contents[k] * (1 - f);
          const attached = t.kind === "cflask" && t.cells > 0 && !t.detached; const movedCells = attached ? 0 : tg.cells * f; if (t.kind === "cflask" && (t.contents.pbs ?? 0) >= 600) tg.washed = true; if (attached && !problems.length) say("Las células siguen adheridas al plástico: solo aspiras líquido (hace falta tripsina).", "info"); tg = { ...tg, contents: left, cells: tg.cells - movedCells }; if (take < pip.set) problems.push(`Aspiraste aire: solo había ${Math.round(take)} µL.`);
          if (tg.contaminated) tip.contaminated = true; tip.lastSource = t.id;
          sfx.pipette(true);
          set({ items: { ...s.items, [t.id]: tg }, pip: { ...pip, tip, loaded, loadedContam: tg.contaminated, loadedCells: movedCells, loadedVia: tg.via ?? s.viab }, pipAnim: { kind: "asp", at: Date.now() } });
          if (problems.length) bad(problems.join(" ")); else say(`Aspirados ${Math.round(take)} µL.`, "info");
        } else {
          if (why) { tg = contaminate(tg, why); problems.push(`Dispensaste en malas condiciones (${why}): ${t.label} contaminado.`); }
          if (tip.contaminated || pip.loadedContam) { tg = contaminate(tg, "líquido o punta contaminados"); problems.push("El líquido o la punta venían contaminados."); }
          if (tg.contaminated) tip.contaminated = true;
          const L = total(pip.loaded); const room = Math.max(0, t.cap - total(tg.contents)); const put = Math.min(L, room); const f = L > 0 ? put / L : 0;
          const mc = pip.loadedCells * f; const nc = tg.cells + mc; tg = { ...tg, contents: mix(tg.contents, pip.loaded, f), cells: nc, ...(mc > 0 ? { via: (tg.cells * (tg.via ?? s.viab) + mc * pip.loadedVia) / nc } : {}), ...(mc > 0 && t.kind === "cflask" ? { detached: true } : {}) };
          if (put < L) problems.push(`Se derramó: ${t.label} se llenó (${Math.round(L - put)} µL fuera).`);
          sfx.pipette(false);
          set({ items: { ...s.items, [t.id]: tg }, pip: { ...pip, tip, loaded: {}, loadedContam: false, loadedCells: 0 }, pipAnim: { kind: "disp", at: Date.now() } });
          if (problems.length) bad(problems.join(" ")); else say(`Dispensados ${Math.round(put)} µL en ${t.label}.`, "ok");
        }
        evaluate();
      }
    },
  };
});
if (typeof window !== "undefined") { (window as any).__wl = useGame; (window as any).__lp = livePos; }
if (typeof window !== "undefined") {
  // ganchos de prueba (Playwright): fijan la mira y teletransportan objetos; no se usan en el juego normal
  (window as any).__aimSet = (type: Aim["type"], id: string, up: boolean, pt: V3) => { aimRef.point = pt; useGame.getState().setAim({ type, id, up }); };
  (window as any).__tp = (id: string, pos: V3) => { const s = useGame.getState(); delete livePos[id]; useGame.setState({ items: { ...s.items, [id]: { ...s.items[id], pos } } }); };
}
