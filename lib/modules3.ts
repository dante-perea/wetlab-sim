import { Mod } from "./types";
export const m3: Mod = {
  id: "m3", n: 3, title: "Cultivo celular", emoji: "🧫",
  why: "Mantener células sanas y limpias es el trabajo diario; todo ensayo depende de que las células estén vivas, en fase exponencial y sin contaminar.",
  blocks: [
    { id: "thaw", title: "Descongelar", why: "Las células salen del criovial con DMSO tóxico a temperatura ambiente; la rapidez decide si sobreviven.",
      theory: ["Descongela rápido a 37 °C (1–2 min) hasta que quede un cristal de hielo.", "Diluye lentamente en medio y centrifuga (≈ 300 g, 5 min) para retirar el DMSO.", "Siembra en frasco con medio completo atemperado."],
      steps: [
        { id: "t1", kind: "sequence", prompt: "Ordena el descongelado:", items: ["Sacar el criovial del nitrógeno líquido o hielo seco", "Descongelar rápido en baño a 37 °C hasta un cristal de hielo", "Desinfectar el vial con etanol 70 % y pasar a la campana", "Pasar a tubo con medio completo atemperado", "Centrifugar y resuspender en medio fresco; sembrar"], explain: "Rápido para evitar cristales de hielo y para sacar el DMSO." },
        { id: "t2", kind: "choice", prompt: "Dejas el criovial 20 min a temperatura ambiente antes de procesarlo. Resultado:", explain: "El DMSO es tóxico a temperatura ambiente: la viabilidad cae.", options: [
          { text: "La viabilidad cae por toxicidad de DMSO", correct: true, feedback: "Correcto." },
          { text: "Mejora porque se descongela despacio", feedback: "Descongelar lento forma cristales de hielo, mala técnica." }] }] },
    { id: "pass", title: "Pasar (subcultivar)", why: "Pasar mantiene las células en crecimiento exponencial; pasarlas tarde las estresa y las envejece.",
      theory: ["Pasa a 70–80 % de confluencia para no saturar.", "Lava con PBS (sin Ca/Mg), tripsina 37 °C 2–5 min, neutraliza con medio con suero, centrifuga, resiembra.", "Anota pase (P) y fecha: más pases = más deriva y senescencia."],
      steps: [
        { id: "p1", kind: "sequence", prompt: "Ordena el pase de células adherentes:", items: ["Retirar el medio", "Lavar con PBS", "Añadir tripsina y incubar a 37 °C", "Neutralizar con medio con suero", "Centrifugar y resuspender", "Sembrar nueva proporción y rotular el pase"], explain: "El suero del medio contiene inhibidores que frenan la tripsina." },
        { id: "p2", kind: "choice", prompt: "Dejas la tripsina 30 min en las células. Resultado:", explain: "La tripsina en exceso daña proteínas de membrana y mata células.", options: [
          { text: "Daño de membrana y muerte celular", correct: true, feedback: "Correcto." },
          { text: "Se despegan mejor, sin problema", feedback: "Se despegan, pero dañas receptores y viabilidad.", critical: true }] }] },
    { id: "count", title: "Contar con hemocitómetro", why: "Sembrar un número conocido de células hace que los experimentos sean reproducibles.",
      theory: ["Cámara de Neubauer: cada cuadrante grande de 1 mm × 1 mm × 0,1 mm = 10⁻⁴ mL.", "Células/mL = promedio por cuadrante × factor de dilución × 10⁴.", "Cuenta solo células que tocan el borde superior e izquierdo (no inferior/derecho)."],
      steps: [
        { id: "c1", kind: "number", prompt: "Mezclas 1:1 con azul tripán (factor 2). Cuentas 4 cuadrantes: 45, 52, 48, 55 células vivas. ¿Células/mL?", answer: 1000000, tol: 0.02, unit: "cél/mL", explain: "Media = (45+52+48+55)/4 = 50; 50 × 2 × 10⁴ = 1×10⁶ cél/mL.", wrong: "Media de los cuadrantes × factor × 10 000." },
        { id: "c2", kind: "number", prompt: "Con 1×10⁶ cél/mL, quieres sembrar 2×10⁵ células en un pocillo. ¿Cuántos µL de suspensión?", answer: 200, tol: 0.02, unit: "µL", explain: "2×10⁵ / 10⁶ cél/mL = 0,2 mL = 200 µL.", wrong: "Células deseadas / concentración (cél/mL)." }] },
    { id: "freeze", title: "Congelar", why: "Un banco de células congeladas es tu seguro: si se contamina o envejece, vuelves a un pase temprano.",
      theory: ["Células sanas en fase exponencial (>90 % viables).", "Medio de congelación: 90 % SFB + 10 % DMSO (o 70 % medio + 20 % SFB + 10 % DMSO).", "1×10⁶–5×10⁶ cél/mL; enfría a −1 °C/min (caja tipo Mr. Frosty a −80 °C) y luego a nitrógeno líquido."],
      steps: [
        { id: "f1", kind: "choice", prompt: "¿Cómo enfrías los crioviales?", explain: "Enfriamiento lento previene cristales de hielo intracelulares.", options: [
          { text: "Mr. Frosty a −80 °C toda la noche y luego a nitrógeno líquido", correct: true, feedback: "Correcto." },
          { text: "Directo al nitrógeno líquido", feedback: "Cristales de hielo letales para las células.", critical: true },
          { text: "En el congelador a −20 °C", feedback: "No es estable para almacenamiento celular." }] }] },
    { id: "contam", title: "Detectar contaminación", why: "Detectarla pronto ahorra semanas y evita que se propague a otros cultivos.",
      theory: ["Bacterias: medio turbio, amarillo (pH ácido), puntos móviles al microscopio.", "Levaduras: gemas ovales que brotan, medio turbio poco a poco.", "Hongos: filamentos (hifas), a veces colonias flotantes.", "Micoplasma: sin turbidez visible; requiere PCR/DAPI/kit. Afecta mucho el comportamiento celular."],
      steps: [
        { id: "k1", kind: "choice", prompt: "Mañana el medio está amarillo y turbio, hay puntos finos que se mueven. ¿Qué es?", explain: "Acidificación (rojo fenol → amarillo) + turbidez + movimiento = bacterias.", options: [
          { text: "Contaminación bacteriana", correct: true, feedback: "Correcto." },
          { text: "Micoplasma", feedback: "El micoplasma no suele enturbiar el medio." },
          { text: "Células muy contentas", feedback: "Eso no es buena señal." }] },
        { id: "k2", kind: "choice", prompt: "Tienes el cultivo contaminado con bacterias. ¿Qué haces?", explain: "Descartar y desinfectar evita contaminar el resto; rescatar con antibióticos normalmente enmascara el problema.", options: [
          { text: "Aíslo, descarto con lejía, desinfecto incubadora y campana", correct: true, feedback: "Correcto." },
          { text: "Lo dejo en la incubadora a ver si mejora", feedback: "Contamina las demás placas.", critical: true },
          { text: "Le echo más antibiótico y sigo", feedback: "Rara vez funciona y enmascara el problema." }] }] }
  ]
};
