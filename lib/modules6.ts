import { Mod } from "./types";
export const m6: Mod = {
  id: "m6", n: 6, title: "Biología molecular básica", emoji: "🧬",
  why: "Medir DNA, RNA y proteínas te dice qué hace la célula por dentro: la lectura molecular del envejecimiento.",
  blocks: [
    { id: "ext", title: "Extracción de DNA y RNA", why: "Todo lo demás (PCR, qPCR) depende de partir de ácidos nucleicos puros e intactos.",
      theory: ["Lisis → unión a columna de sílice → lavados → elución. TRIzol/fenol-cloroformo es la alternativa.", "RNA: se degrada con RNasas: guantes, material libre de RNasas, hielo.", "Pureza (NanoDrop): A260/280 ≈ 1,8 (DNA) / 2,0 (RNA); A260/230 ≈ 2,0–2,2."],
      steps: [
        { id: "e1", kind: "choice", prompt: "Tu RNA tiene A260/280 = 1,3. ¿Qué indica?", explain: "Valores bajos indican contaminación por proteínas o fenol.", options: [
          { text: "Contaminación por proteínas/fenol; repetir o limpiar", correct: true, feedback: "Correcto." },
          { text: "RNA perfecto", feedback: "El esperado es ≈ 2,0." }] },
        { id: "e2", kind: "choice", prompt: "Trabajas con RNA en la mesa con las manos sin guantes. ¿Qué pasa?", explain: "Las RNasas de la piel degradan el RNA rápidamente.", options: [
          { text: "Las RNasas de la piel degradan el RNA", correct: true, feedback: "Correcto." },
          { text: "Nada: el RNA es estable", feedback: "El RNA es muy lábil.", critical: true }] }] },
    { id: "pcr", title: "PCR", why: "La PCR amplifica un fragmento específico de DNA para poder detectarlo o clonarlo.",
      theory: ["Ciclo: desnaturalización 95 °C → alineamiento (Tm − 5 °C) → extensión 72 °C (≈1 min/kb para Taq).", "Mezcla: buffer, dNTPs, MgCl₂, cebadores, polimerasa, molde.", "Controles: sin molde (NTC) y positivo.", "Cada ciclo duplica: tras n ciclos ≈ 2ⁿ copias."],
      steps: [
        { id: "pcr1", kind: "sequence", prompt: "Ordena un ciclo de PCR:", items: ["Desnaturalización 95 °C", "Alineamiento de cebadores", "Extensión a 72 °C"], explain: "Separar → unir cebadores → copiar." },
        { id: "pcr2", kind: "number", prompt: "¿Cuántas copias teóricas surgen de 1 molécula tras 10 ciclos?", answer: 1024, tol: 0.01, unit: "copias", explain: "2¹⁰ = 1024.", wrong: "2 elevado al número de ciclos." },
        { id: "pcr3", kind: "choice", prompt: "El control sin molde (NTC) muestra banda. ¿Qué significa?", explain: "Contaminación de reactivos con DNA o amplicones previos.", options: [
          { text: "Contaminación de reactivos: repetir con reactivos nuevos", correct: true, feedback: "Correcto." },
          { text: "El experimento funcionó", feedback: "Un NTC debe quedar vacío.", critical: true }] }] },
    { id: "gel", title: "Electroforesis en gel", why: "Muestra si la PCR funcionó y el tamaño del producto: es la lectura visual de tu DNA.",
      theory: ["Agarosa 1–2 % en TAE/TBE con tinte (SYBR Safe/GelRed).", "El DNA es negativo y migra hacia el ánodo (+).", "Los fragmentos pequeños migran más rápido. Se compara con un marcador de peso molecular."],
      steps: [
        { id: "g1", kind: "choice", prompt: "Conectas los electrodos al revés (el DNA queda cerca del polo +). ¿Qué pasa?", explain: "El DNA va del polo − (cátodo) al + (ánodo); debes cargar en el lado negativo.", options: [
          { text: "El DNA sale del gel por el pocillo hacia el buffer", correct: true, feedback: "Correcto." },
          { text: "Nada", feedback: "Lo pierdes.", critical: true }] },
        { id: "g2", kind: "choice", prompt: "Ves una banda en 500 pb donde esperabas 1000 pb. ¿Conclusión?", explain: "El tamaño no coincide: producto no específico o cebadores erróneos.", options: [
          { text: "No es el producto esperado; revisar cebadores/condiciones", correct: true, feedback: "Correcto." },
          { text: "Es lo mismo, las bandas varían", feedback: "El tamaño es la información.", critical: true }] }] },
    { id: "qpcr", title: "qPCR", why: "Cuantifica expresión génica (p. ej. p16, p21) en tiempo real, clave para validar senescencia.",
      theory: ["Se mide fluorescencia en cada ciclo; el Ct es el ciclo donde cruza el umbral. Menor Ct = más molde.", "ΔΔCt: ΔCt = Ct(gen) − Ct(referencia); ΔΔCt = ΔCt(tratado) − ΔCt(control); cambio = 2^−ΔΔCt.", "Siempre: curva de fusión (SYBR), NTC, RT− para RNA."],
      steps: [
        { id: "q1", kind: "number", prompt: "Control: Ct gen 25, Ct ref 18. Tratado: Ct gen 23, Ct ref 18. ¿Cambio relativo (veces)?", answer: 4, tol: 0.02, unit: "×", explain: "ΔCt control=7; tratado=5; ΔΔCt=−2; 2²=4.", wrong: "Calcula ΔCt, luego ΔΔCt y 2^−ΔΔCt." },
        { id: "q2", kind: "choice", prompt: "La curva de fusión muestra dos picos. ¿Qué indica?", explain: "Dos picos: dímeros de cebadores o productos inespecíficos.", options: [
          { text: "Productos inespecíficos o dímeros", correct: true, feedback: "Correcto." },
          { text: "Doble de señal: mejor", feedback: "Hay que optimizar.", critical: true }] }] },
    { id: "wb", title: "Western blot", why: "Detecta una proteína concreta y su cantidad: confirma a nivel proteico lo que vio el qPCR.",
      theory: ["Pasos: lisis → cuantificación (BCA) → SDS-PAGE → transferencia a membrana → bloqueo → anticuerpo primario → secundario → detección.", "Cargas la misma cantidad total y normalizas con control de carga (β-actina, GAPDH, proteína total).", "Bloqueo con leche o BSA reduce el fondo."],
      steps: [
        { id: "wb1", kind: "sequence", prompt: "Ordena el Western blot:", items: ["Lisar y cuantificar proteína", "Correr SDS-PAGE", "Transferir a membrana", "Bloquear", "Incubar anticuerpo primario y luego secundario", "Detectar señal"], explain: "Bloquear antes de los anticuerpos evita unión inespecífica." },
        { id: "wb2", kind: "choice", prompt: "Tu banda es más fuerte en tratado, pero la β-actina también. ¿Qué haces?", explain: "Si el control de carga difiere, hay distinta cantidad cargada; normaliza.", options: [
          { text: "Normalizo la banda al control de carga", correct: true, feedback: "Correcto." },
          { text: "Concluyo que el tratamiento sube la proteína", feedback: "Quizá solo cargaste más.", critical: true }] }] }
  ]
};
