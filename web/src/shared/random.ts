// Deterministic randomness: the same inputs always give the same numbers,
// so every viewer sees identical simulated values at the same moment.

/** mulberry32 PRNG. Returns a function producing floats in [0, 1). */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** FNV-1a 32-bit hash of a string. */
export function hashString(text: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** A single deterministic float in [0, 1) for a key. */
export function randomFor(key: string): number {
  return mulberry32(hashString(key))();
}

/**
 * Smooth value noise in [0, 1]: random values at knots every `periodMs`,
 * blended with smoothstep so the signal drifts instead of jumping.
 */
export function smoothNoise(key: string, timestampMs: number, periodMs: number): number {
  const position = timestampMs / periodMs;
  const knot = Math.floor(position);
  const frac = position - knot;
  const a = randomFor(`${key}:${knot}`);
  const b = randomFor(`${key}:${knot + 1}`);
  const s = frac * frac * (3 - 2 * frac);
  return a + (b - a) * s;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function round(value: number, decimals = 1): number {
  const f = 10 ** decimals;
  return Math.round(value * f) / f;
}
