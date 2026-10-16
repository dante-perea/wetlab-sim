// Sonido procedural (WebAudio), sin archivos de audio.
let ctx: AudioContext | null = null; let master: GainNode; let hoodGain: GainNode; let hoodTarget = 0; let started = false;
function noiseBuf(c: AudioContext, sec = 2) { const b = c.createBuffer(1, c.sampleRate * sec, c.sampleRate); const d = b.getChannelData(0); let l = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } return b; }
export const sfx = {
  start() {
    if (typeof window === "undefined" || started) return; started = true;
    try {
      ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
      // zumbido de la campana: ruido marrón filtrado + 100 Hz
      const src = ctx.createBufferSource(); src.buffer = noiseBuf(ctx, 3); src.loop = true; const lp = ctx.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 600;
      const o = ctx.createOscillator(); o.frequency.value = 100; const og = ctx.createGain(); og.gain.value = 0.05; hoodGain = ctx.createGain(); hoodGain.gain.value = 0;
      src.connect(lp).connect(hoodGain); o.connect(og).connect(hoodGain); hoodGain.connect(master); src.start(); o.start();
      // ambiente del laboratorio: murmullo muy bajo
      const a = ctx.createBufferSource(); a.buffer = noiseBuf(ctx, 3); a.loop = true; const ag = ctx.createGain(); ag.gain.value = 0.018; const hp = ctx.createBiquadFilter(); hp.type = "lowpass"; hp.frequency.value = 300; a.connect(hp).connect(ag).connect(master); a.start();
    } catch { ctx = null; }
  },
  hood(on: boolean, ready = false) { if (!ctx) return; hoodTarget = on ? (ready ? 0.22 : 0.1) : 0; hoodGain.gain.setTargetAtTime(hoodTarget, ctx.currentTime, 0.4); },
  tone(f: number, d = 0.08, type: OscillatorType = "sine", v = 0.15, f2?: number) {
    if (!ctx) return; const o = ctx.createOscillator(); const g = ctx.createGain(); o.type = type; o.frequency.setValueAtTime(f, ctx.currentTime); if (f2) o.frequency.exponentialRampToValueAtTime(f2, ctx.currentTime + d);
    g.gain.setValueAtTime(v, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + d); o.connect(g).connect(master); o.start(); o.stop(ctx.currentTime + d + 0.02);
  },
  click() { this.tone(1800, 0.03, "square", 0.08, 900); },
  pipette(asp: boolean) { this.tone(asp ? 500 : 800, 0.12, "triangle", 0.12, asp ? 800 : 400); this.click(); },
  tip() { this.tone(1200, 0.05, "square", 0.1, 600); },
  clink() { this.tone(2400, 0.15, "sine", 0.1, 2000); this.tone(3300, 0.1, "sine", 0.06); },
  grab() { this.tone(300, 0.06, "triangle", 0.1, 200); },
  error() { this.tone(180, 0.35, "sawtooth", 0.14, 90); },
  chime() { this.tone(660, 0.18, "sine", 0.15); setTimeout(() => this.tone(990, 0.3, "sine", 0.15), 110); },
  step() { if (!ctx) return; const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx, 1); const g = ctx.createGain(); const f = ctx.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 400; g.gain.setValueAtTime(0.25, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.12); s.connect(f).connect(g).connect(master); s.start(0, Math.random()); s.stop(ctx.currentTime + 0.14); },
  spray() { if (!ctx) return; const s = ctx.createBufferSource(); s.buffer = noiseBuf(ctx, 1); const g = ctx.createGain(); const f = ctx.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 3000; g.gain.setValueAtTime(0.15, ctx.currentTime); g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4); s.connect(f).connect(g).connect(master); s.start(0, Math.random()); s.stop(ctx.currentTime + 0.45); },
};
