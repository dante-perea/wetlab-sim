"use client";
import dynamic from "next/dynamic";
import { useRef } from "react";
import { Hud } from "./Hud";
const Scene = dynamic(() => import("./Scene"), { ssr: false });
export default function Game() {
  const lockRef = useRef<(() => void) | null>(null);
  return (<><Scene lockRef={lockRef} /><Hud lock={() => lockRef.current?.()} /></>);
}
