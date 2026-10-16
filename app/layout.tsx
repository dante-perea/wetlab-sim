import "./globals.css";
export const metadata = { title: "Simulador de Wet Lab", description: "Aprende biología molecular y cultivo celular practicando" };
export default function R({ children }: { children: React.ReactNode }) {
  return <html lang="es"><body><main>{children}</main></body></html>;
}
