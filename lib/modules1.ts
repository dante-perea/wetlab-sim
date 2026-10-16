import { Mod } from "./types";
export const m1: Mod = {
  id: "m1", n: 1, title: "Seguridad y técnica estéril", emoji: "🧤",
  why: "Sin buena técnica estéril cada experimento posterior se contamina; es la base de todo el laboratorio.",
  blocks: [
    { id: "ppe", title: "Seguridad y EPP", why: "Tu protección y la del cultivo son la misma barrera: bata, guantes y orden evitan accidentes y contaminación.",
      theory: ["Bata cerrada, guantes de nitrilo y gafas; pelo recogido; sin joyas en las manos.", "Rocía los guantes con etanol al 70 % antes de trabajar en la campana.", "Residuos biológicos: bolsa de riesgo biológico; líquidos con lejía al 10 % (≥20 min) antes de desechar; agujas en contenedor rígido."],
      steps: [
        { id: "ppe1", kind: "choice", prompt: "Vas a entrar al cuarto de cultivo. ¿Qué haces primero?", explain: "Bata y guantes primero: son la primera barrera, para ti y para las células.", options: [
          { text: "Me pongo bata, guantes y recojo el pelo", correct: true, feedback: "Correcto: barrera básica antes de tocar nada." },
          { text: "Entro con la ropa de calle, solo me pongo guantes", feedback: "La ropa de calle trae polvo y microorganismos al cuarto de cultivo.", critical: true },
          { text: "Entro y me pongo guantes cuando abra la campana", feedback: "Demasiado tarde: ya contaminaste el entorno y te expusiste." }] },
        { id: "ppe2", kind: "choice", prompt: "Se te cae medio mililitro de cultivo con células humanas en la mesa. ¿Qué haces?", explain: "Desinfectar con tiempo de contacto adecuado mata patógenos potenciales en el derrame.", options: [
          { text: "Cubro con papel, añado lejía al 10 %, espero ≥20 min y limpio", correct: true, feedback: "Correcto: el tiempo de contacto importa." },
          { text: "Lo seco con papel y sigo", feedback: "Dejas material biológico vivo en la mesa.", critical: true },
          { text: "Lo ignoro: son solo células", feedback: "Las células humanas pueden portar virus; se tratan como riesgo biológico." }] }] },
    { id: "hood", title: "Campana de flujo laminar", why: "La campana crea una zona de aire filtrado (HEPA) donde las células no se contaminan; usarla mal anula su función.",
      theory: ["Bioseguridad clase II: aire filtrado HEPA, protege la muestra y al operador.", "Enciende 10–15 min antes. Limpia con etanol al 70 % de adentro hacia afuera.", "No bloquees las rejillas frontal y trasera. Trabaja a ≥10 cm del borde. Zona limpia (atrás) y zona sucia (adelante) separadas.", "Nunca pases la mano sobre un frasco abierto; no hables encima del cultivo."],
      steps: [
        { id: "hood1", kind: "sequence", prompt: "Ordena la preparación de la campana:", items: ["Encender la campana y esperar 10–15 min", "Limpiar la superficie con etanol al 70 %", "Rociar con etanol todo lo que entra (frascos, cajas)", "Colocar los materiales sin bloquear las rejillas", "Comenzar el trabajo"], explain: "Primero el flujo estable, luego desinfectar, luego cargar el material organizado." },
        { id: "hood2", kind: "choice", prompt: "Colocas una caja de puntas grande delante de la rejilla frontal. ¿Qué pasa?", explain: "Bloquear rejillas rompe la cortina de aire y deja entrar aire sin filtrar.", options: [
          { text: "Rompe la cortina de aire y la campana pierde protección", correct: true, feedback: "Correcto." },
          { text: "Nada, es solo una caja", feedback: "Sí cambia: bloquea el flujo.", critical: true },
          { text: "Mejora el flujo", feedback: "Al contrario: genera turbulencias." }] },
        { id: "hood3", kind: "choice", prompt: "Con un frasco abierto, necesitas coger una pipeta del fondo. ¿Cómo?", explain: "Pasar el brazo sobre un frasco abierto deja caer partículas y células de piel dentro.", options: [
          { text: "Cierro el frasco antes y rodeo, sin pasar sobre él", correct: true, feedback: "Correcto: nunca pases sobre recipientes abiertos." },
          { text: "Paso el brazo por encima rápido", feedback: "Contaminaste el frasco con partículas de tu manga.", critical: true }] }] },
    { id: "pip", title: "Pipeteo", why: "El pipeteo preciso garantiza que las concentraciones sean las que crees; un 10 % de error se arrastra en todo el experimento.",
      theory: ["Micropipeta: rango adecuado (P2, P20, P200, P1000); elige el que contenga tu volumen en su rango medio-alto.", "Dos paradas: primera para aspirar, segunda (expulsión) solo para vaciar.", "Punta nueva y estéril por cada reactivo. Nunca pongas el émbolo hacia abajo con el líquido dentro.", "Pipetas serológicas con pipeteador: volúmenes mayores, también estériles, un solo uso."],
      steps: [
        { id: "pip1", kind: "choice", prompt: "Debes medir 150 µL. ¿Qué micropipeta usas?", explain: "Cada pipeta es más exacta cerca de su rango alto; P200 cubre 20–200 µL.", options: [
          { text: "P200", correct: true, feedback: "Correcto." },
          { text: "P1000", feedback: "Funciona pero es menos preciso a 15 % de su rango." },
          { text: "P20", feedback: "No llega: máximo 20 µL, dañarías el émbolo si forzaras." }] },
        { id: "pip2", kind: "sequence", prompt: "Ordena el pipeteo correcto:", items: ["Poner punta estéril", "Presionar hasta la primera parada", "Sumergir la punta unos mm y soltar despacio", "Dispensar contra la pared hasta la segunda parada", "Expulsar la punta en el residuo"], explain: "Soltar despacio evita burbujas; la segunda parada solo al dispensar." },
        { id: "pip3", kind: "choice", prompt: "Terminaste de tomar medio del frasco A y vas a tomar suero del frasco B con la misma punta. ¿Qué haces?", explain: "Una punta por reactivo evita contaminación cruzada.", options: [
          { text: "Cambio de punta", correct: true, feedback: "Correcto." },
          { text: "Uso la misma, es todo líquido", feedback: "Contaminación cruzada: el suero ahora puede tener medio de otro frasco y microbios.", critical: true }] }] }
  ]
};
