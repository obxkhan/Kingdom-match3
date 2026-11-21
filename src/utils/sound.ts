let audioCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctx) return null;
  if (!audioCtx) {
    audioCtx = new Ctx();
  }
  if (audioCtx.state === "suspended") {
    void audioCtx.resume();
  }
  return audioCtx;
}

function tone(
  freq: number,
  dur: number,
  type: OscillatorType,
  peak: number,
  delay = 0
) {
  try {
    const ctx = getCtx();
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peak, t + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  } catch {
    // Audio unavailable
  }
}

export function playSwapSound(muted: boolean) {
  if (muted) return;
  tone(440, 0.07, "sine", 0.05);
}

export function playInvalidSwapSound(muted: boolean) {
  if (muted) return;
  tone(190, 0.09, "triangle", 0.05, 0);
  tone(155, 0.1, "triangle", 0.04, 0.06);
}

export function playMatchSound(muted: boolean, combo: number) {
  if (muted) return;
  const base = 440 * Math.pow(1.12, Math.min(combo - 1, 6));
  tone(base, 0.11, "sine", 0.06, 0);
  tone(base * 1.25, 0.14, "sine", 0.05, 0.05);
}

export function playBuildSound(muted: boolean) {
  if (muted) return;
  tone(330, 0.09, "triangle", 0.07, 0);
  tone(495, 0.13, "sine", 0.07, 0.06);
}

export function playUpgradeSound(muted: boolean) {
  if (muted) return;
  tone(523.25, 0.1, "sine", 0.07, 0);
  tone(659.25, 0.1, "sine", 0.07, 0.07);
  tone(783.99, 0.18, "sine", 0.08, 0.14);
}

export function playWinSound(muted: boolean) {
  if (muted) return;
  tone(523.25, 0.15, "sine", 0.08, 0);
  tone(659.25, 0.15, "sine", 0.08, 0.09);
  tone(783.99, 0.18, "sine", 0.08, 0.18);
  tone(1046.5, 0.34, "sine", 0.09, 0.27);
}

export function playGameOverSound(muted: boolean) {
  if (muted) return;
  tone(392.0, 0.16, "triangle", 0.06, 0);
  tone(349.23, 0.16, "triangle", 0.06, 0.12);
  tone(293.66, 0.28, "triangle", 0.06, 0.24);
}
