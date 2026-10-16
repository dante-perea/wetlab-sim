import { Mod } from "./types";
export const m2: Mod = {
  id: "m2", n: 2, title: "Medios, soluciones y diluciones", emoji: "🧪",
  why: "Los cultivos viven en lo que tú preparas; un error de concentración o de esterilidad arruina semanas de trabajo.",
  blocks: [
    { id: "media", title: "Preparar medio completo", why: "El medio completo aporta nutrientes, factores de crecimiento y antibiótico; la proporción cambia cómo crecen las células.",
      theory: ["DMEM base + 10 % SFB (suero fetal bovino) + 1 % penicilina/estreptomicina (100 U/mL / 100 µg/mL finales).", "Todo en campana. Filtra con 0,22 µm si añades componentes no estériles.", "Rotula: nombre, fecha, tus iniciales. Guarda a 4 °C y atempera a 37 °C solo lo que vayas a usar."],
      steps: [
        { id: "me1", kind: "number", prompt: "Quieres 500 mL de medio con 10 % de SFB. ¿Cuántos mL de SFB añades (el resto es DMEM)?", answer: 50, tol: 0.02, unit: "mL", explain: "500 mL × 0,10 = 50 mL de suero; el resto, 450 mL de DMEM.", wrong: "Calcula el 10 % del volumen final: 0,10 × 500 mL." },
        { id: "me2", kind: "choice", prompt: "Tu solución de HEPES no es estéril. ¿Cómo la añades?", explain: "El filtro de 0,22 µm retiene bacterias; autoclavar puede degradar componentes termosensibles.", options: [
          { text: "La paso por un filtro de 0,22 µm en la campana", correct: true, feedback: "Correcto." },
          { text: "La añado directamente", feedback: "Contaminaste 500 mL de medio.", critical: true },
          { text: "La caliento en el microondas", feedback: "No esteriliza de forma fiable." }] }] },
    { id: "dil", title: "Cálculo de diluciones", why: "Casi todo reactivo viene concentrado; saber diluir exactamente decide si tu experimento mide lo que quieres.",
      theory: ["C1·V1 = C2·V2", "Dilución seriada 1:10: 100 µL + 900 µL de diluyente cada paso.", "Molaridad: g = M × L × masa molar (g/mol)."],
      steps: [
        { id: "d1", kind: "number", prompt: "Tienes stock de 10 mg/mL y quieres 1 mL a 100 µg/mL. ¿Cuántos µL de stock tomas?", answer: 10, tol: 0.02, unit: "µL", explain: "C1V1=C2V2 → 10 000 µg/mL × V1 = 100 µg/mL × 1000 µL → V1 = 10 µL.", wrong: "Pasa todo a las mismas unidades: 10 mg/mL = 10 000 µg/mL." },
        { id: "d2", kind: "number", prompt: "Stock 1 M de NaCl. Necesitas 50 mL a 150 mM. ¿Cuántos mL de stock?", answer: 7.5, tol: 0.02, unit: "mL", explain: "1000 mM × V1 = 150 mM × 50 mL → V1 = 7,5 mL.", wrong: "1 M = 1000 mM; usa C1V1=C2V2." },
        { id: "d3", kind: "number", prompt: "Dilución seriada 1:10 cuatro veces desde 10⁶ células/mL. ¿Qué concentración final (células/mL)?", answer: 100, tol: 0.01, unit: "cél/mL", explain: "10⁶ / 10⁴ = 100 células/mL.", wrong: "Cuatro pasos de 1:10 = factor 10⁴." },
        { id: "d4", kind: "number", prompt: "¿Cuántos gramos de Tris (121,14 g/mol) para 200 mL de solución 1 M?", answer: 24.228, tol: 0.01, unit: "g", explain: "1 mol/L × 0,2 L × 121,14 g/mol = 24,23 g.", wrong: "g = M × L × masa molar." }] }
  ]
};
