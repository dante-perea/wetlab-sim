import { Home } from "@/components/Progress";
import { READING } from "@/lib/modules";
export default function P() {
  return (<><h1>🔬 Simulador de Wet Lab</h1>
    <p>Aprende cultivo celular y biología molecular practicando, paso a paso. Cada bloque: teoría breve → práctica con errores realistas → puntaje.</p>
    <div className="why">💡 Este orden importa: primero técnica estéril, porque sin ella no hay cultivo; después medir, y al final leer qué hacen las células por dentro.</div>
    <div className="card">📚 <b>Lectura inicial:</b> <a href={READING.url} target="_blank" rel="noreferrer">{READING.authors} ({READING.year}). {READING.title}. {READING.journal}</a><div className="small">Por qué: te da el mapa de qué es envejecer y qué medir en los módulos 5 y 6.</div></div>
    <Home /></>);
}
