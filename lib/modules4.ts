import { Mod } from "./types";
export const m4: Mod = {
  id: "m4", n: 4, title: "Viabilidad y toxicidad", emoji: "💧",
  why: "Para saber si un compuesto es tóxico, o si tus células están sanas, necesitas medir viabilidad con un método válido.",
  blocks: [
    { id: "trypan", title: "Azul de tripán", why: "Es la prueba rápida: las células con la membrana dañada se tiñen; permite calcular % de viabilidad en minutos.",
      theory: ["Las células vivas excluyen el azul de tripán; las muertas (membrana rota) se tiñen de azul.", "Cuenta dentro de 3–5 min: pasado ese tiempo también tiñe células vivas.", "% viabilidad = vivas / (vivas + muertas) × 100"],
      steps: [
        { id: "tb1", kind: "number", prompt: "Cuentas 180 células vivas (no teñidas) y 20 muertas (azules). ¿% de viabilidad?", answer: 90, tol: 0.01, unit: "%", explain: "180/(180+20)=0,9 → 90 %.", wrong: "vivas / total × 100." },
        { id: "tb2", kind: "choice", prompt: "Esperas 30 min antes de contar con el azul de tripán. Resultado:", explain: "El colorante entra a células vivas con el tiempo y subestima la viabilidad.", options: [
          { text: "Subestimo la viabilidad (muestra falsos muertos)", correct: true, feedback: "Correcto." },
          { text: "Es más preciso", feedback: "Al revés: aumenta el sesgo." }] }] },
    { id: "mtt", title: "Ensayo MTT", why: "Mide actividad metabólica de la población; sirve para curvas dosis-respuesta de compuestos.",
      theory: ["MTT (amarillo) se reduce por enzimas mitocondriales a formazán (violeta, insoluble).", "Pasos: sembrar → tratar → añadir MTT 0,5 mg/mL 2–4 h → disolver formazán en DMSO → leer a 570 nm.", "Controles: vehículo (100 %), blanco (solo medio + MTT), positivo de toxicidad.", "Mide metabolismo, no estrictamente células vivas: mitocondrias alteradas dan sesgo."],
      steps: [
        { id: "mtt1", kind: "sequence", prompt: "Ordena el protocolo MTT:", items: ["Sembrar células y dejar adherir", "Tratar con el compuesto y controles", "Añadir MTT e incubar 2–4 h", "Retirar el medio y disolver el formazán en DMSO", "Leer absorbancia a 570 nm"], explain: "El formazán es insoluble: hay que disolverlo antes de leer." },
        { id: "mtt2", kind: "number", prompt: "Control vehículo A570 = 1,00 (blanco restado). Pocillo tratado = 0,35. ¿% de viabilidad relativa?", answer: 35, tol: 0.02, unit: "%", explain: "0,35 / 1,00 × 100 = 35 %.", wrong: "Tratado / control × 100." },
        { id: "mtt3", kind: "choice", prompt: "Tu compuesto es un reductor fuerte y reduce MTT sin células. ¿Qué haces?", explain: "Un control sin células con compuesto detecta interferencia.", options: [
          { text: "Añado pocillos sin células con compuesto y MTT para corregir o cambio de ensayo", correct: true, feedback: "Correcto." },
          { text: "Ignoro: el resultado sale alto = células sanas", feedback: "Falso positivo de viabilidad.", critical: true }] }] }
  ]
};
export const m5: Mod = {
  id: "m5", n: 5, title: "Medición del envejecimiento celular", emoji: "⏳",
  why: "Probar tratamientos contra el envejecimiento exige medirlo; la senescencia es el marcador más usado en cultivo.",
  blocks: [
    { id: "sen", title: "Senescencia celular", why: "Entender qué es una célula senescente evita confundirla con una célula muerta o simplemente en reposo.",
      theory: ["Senescencia: detención estable del ciclo celular con células vivas y metabólicamente activas, que secretan SASP (factores inflamatorios).", "Causas: acortamiento de telómeros (replicativa), daño al DNA, oncogenes, estrés oxidativo.", "Marcadores: SA-β-gal, p16INK4a, p21, pérdida de Lamin B1, γH2AX, morfología grande y aplanada.", "Lectura inicial: López-Otín et al., 2023, Hallmarks of aging: an expanding universe (Cell)."],
      steps: [
        { id: "s1", kind: "choice", prompt: "Una célula senescente es:", explain: "Está viva pero no se divide, y secreta factores (SASP).", options: [
          { text: "Una célula viva en detención estable del ciclo con SASP", correct: true, feedback: "Correcto." },
          { text: "Una célula muerta", feedback: "Sigue metabólicamente activa." },
          { text: "Una célula en reposo temporal (G0 quiescente)", feedback: "La quiescencia es reversible; la senescencia suele ser estable." }] }] },
    { id: "sabgal", title: "Tinción SA-β-gal", why: "Es el ensayo clásico y barato para contar senescentes: se tiñen de azul por actividad de β-galactosidasa a pH 6.",
      theory: ["La β-galactosidasa lisosomal aumenta en senescentes y es activa a pH 6,0 (a pH 4,0 lo es en todas las células).", "Pasos: lavar con PBS → fijar (formaldehído/glutaraldehído 3–5 min) → lavar → X-gal a pH 6,0, 37 °C sin CO₂, 12–16 h → contar azul.", "% senescentes = células azules / total × 100 (≥200 células en varios campos).", "Falso positivo: células confluentes o con medio ácido; usa pH exacto."],
      steps: [
        { id: "sa1", kind: "sequence", prompt: "Ordena la tinción SA-β-gal:", items: ["Lavar con PBS", "Fijar 3–5 min", "Lavar con PBS", "Añadir X-gal pH 6,0 e incubar 12–16 h a 37 °C sin CO₂", "Contar células azules al microscopio"], explain: "Sin CO₂, porque el CO₂ acidifica y daría falsos positivos." },
        { id: "sa2", kind: "choice", prompt: "Ajustas la solución X-gal a pH 4,0 en lugar de 6,0. Resultado:", explain: "A pH 4,0 la β-gal lisosomal de todas las células es activa: no distingues senescentes.", options: [
          { text: "Casi todas las células se tiñen: falso positivo", correct: true, feedback: "Correcto." },
          { text: "Solo las senescentes se tiñen", feedback: "Eso ocurre a pH 6,0." }] },
        { id: "sa3", kind: "number", prompt: "Cuentas 230 azules de 500 células totales. ¿% senescentes?", answer: 46, tol: 0.01, unit: "%", explain: "230/500 × 100 = 46 %.", wrong: "azules / total × 100." }] }
  ]
};
