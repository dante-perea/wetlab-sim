export type Option = { text: string; correct?: boolean; feedback: string; critical?: boolean };
export type Step =
  | { id: string; kind: "choice"; prompt: string; options: Option[]; explain: string }
  | { id: string; kind: "number"; prompt: string; answer: number; tol: number; unit: string; explain: string; wrong: string; critical?: boolean }
  | { id: string; kind: "sequence"; prompt: string; items: string[]; explain: string };
export type Block = { id: string; title: string; why: string; theory: string[]; steps: Step[] };
export type Mod = { id: string; n: number; title: string; emoji: string; why: string; blocks: Block[] };
