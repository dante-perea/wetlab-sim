import type { Contents } from "./game";
const tot = (c: Contents) => Object.values(c).reduce((a, b) => a + b, 0);
export const AMPLICON = 500; // pb: producto esperado
export const PRIMER_TM = 58; // °C
export const LADDER = [100, 200, 300, 400, 500, 600, 800, 1000, 1500];
export const PCR_RUN_MS = 9000; // 1 ciclo ≈ 2 min reales → se acelera
export const GEL_FULL_MS = 9000; // 100 V durante ≈45 min simulados
export type PcrRes = { yield: number; nonspec: boolean; smear: boolean; falsePos: boolean; dimers: boolean; note: string };
export function pcrResult(c: Contents, contaminated: boolean, anneal: number, cycles: number): PcrRes {
  const t = Math.max(1e-6, tot(c)); const mm = c.mm ?? 0, pr = c.primers ?? 0, dna = c.dna ?? 0;
  let y = 1; const notes: string[] = []; let nonspec = false, smear = false, dimers = false, falsePos = false;
  if (mm / t < 0.05 || pr / t < 0.02) { return { yield: 0, nonspec: false, smear: false, falsePos: false, dimers: false, note: mm / t < 0.05 ? "sin master mix (sin polimerasa ni dNTP)" : "sin cebadores" }; }
  const fm = mm / t; if (fm < 0.4 || fm > 0.6) { y *= 0.4; notes.push("master mix fuera de 1×"); }
  const fp = pr / t; if (fp < 0.05) { y *= 0.5; notes.push("pocos cebadores"); } if (fp > 0.2) { y *= 0.6; dimers = true; notes.push("demasiados cebadores: dímeros"); }
  let tm = 0; if (dna > 0.3) tm = Math.min(1, 0.55 + dna / 2); else if (contaminated) { tm = 0.35; falsePos = true; notes.push("contaminación con ADN: falso positivo"); }
  y *= tm; if (y === 0) return { yield: 0, nonspec, smear, falsePos, dimers, note: "sin molde" };
  if (cycles < 15) { y *= 0.05; notes.push("pocos ciclos"); } else if (cycles < 25) y *= 0.2 + (0.8 * (cycles - 15)) / 10; else if (cycles > 35) { smear = true; notes.push("demasiados ciclos: plateau y manchón"); }
  if (anneal < 50) { nonspec = true; notes.push("hibridación muy baja: bandas inespecíficas"); } else if (anneal > 62) { y *= 0.08; notes.push("hibridación muy alta: los cebadores no se pegan"); } else if (anneal > 60) y *= 0.6;
  return { yield: Math.min(1, y), nonspec, smear, falsePos, dimers, note: notes.join("; ") || "reacción óptima" };
}
export type Band = { size: number; i: number };
export type Lane = { src: string; label: string; kind: "ladder" | "sample"; vol: number; lost: boolean; bands: Band[]; smear: boolean; spill: boolean };
export function bandsFor(kind: "ladder" | "sample", vol: number, pcr?: PcrRes): { bands: Band[]; smear: boolean } {
  const f = Math.min(1, vol / 10);
  if (kind === "ladder") return { bands: LADDER.map(s => ({ size: s, i: 0.85 * f })), smear: false };
  if (!pcr || pcr.yield < 0.05) return { bands: [], smear: false };
  const b: Band[] = [{ size: AMPLICON, i: Math.min(1, pcr.yield) * f }];
  if (pcr.nonspec) b.push({ size: 280, i: 0.55 * f }, { size: 900, i: 0.45 * f });
  if (pcr.dimers) b.push({ size: 60, i: 0.7 * f });
  return { bands: b, smear: pcr.smear };
}
// movilidad: distancia (0..1 del gel) de un fragmento tras T; ∝ log10(tamaño) decreciente
export const travel = (size: number, T: number) => (T * (3.6 - Math.log10(size))) / 1.6;
export function interpSize(ladderPos: { size: number; y: number }[], y: number): number | null {
  const L = [...ladderPos].sort((a, b) => a.y - b.y); if (L.length < 2) return null;
  let i = 0; while (i < L.length - 2 && y > L[i + 1].y) i++;
  const a = L[i], b = L[i + 1]; const f = (y - a.y) / (b.y - a.y || 1e-9); return Math.pow(10, Math.log10(a.size) + f * (Math.log10(b.size) - Math.log10(a.size)));
}
// qPCR: Ct = 32 − log2(cantidad relativa) (eficiencia 100 %)
export function ctFor(c: Contents, seedKey: string): { ct: number | null; gene: "T" | "R" | null; sample: "C" | "T" | null; note: string } {
  const t = Math.max(1e-6, tot(c)); const mm = c.mm ?? 0, pT = c.primT ?? 0, pR = c.primR ?? 0, cC = c.cdnaC ?? 0, cT = c.cdnaT ?? 0;
  if (mm / t < 0.3) return { ct: null, gene: null, sample: null, note: "sin master mix" };
  if ((pT > 0.2 && pR > 0.2) || (cC > 0.2 && cT > 0.2)) return { ct: null, gene: null, sample: null, note: "mezcla de genes o muestras: no interpretable" };
  const gene = pT > 0.2 ? "T" : pR > 0.2 ? "R" : null; const sample = cT > 0.2 ? "T" : cC > 0.2 ? "C" : null; if (!gene || !sample) return { ct: null, gene, sample, note: "sin cebadores o sin cDNA" };
  const amount = (sample === "T" ? cT : cC) * (gene === "T" && sample === "T" ? 4 : 1);
  let h = 0; for (const ch of seedKey) h = (h * 31 + ch.charCodeAt(0)) % 997; const noise = ((h % 21) - 10) / 100;
  return { ct: 32 - Math.log2(Math.max(0.05, amount)) + noise, gene, sample, note: "" };
}
