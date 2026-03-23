export function createRng(seed: number): () => number {
  let t = seed >>> 0;
  return () => {
    t += 0x6d2b79f5;
    let next = Math.imul(t ^ (t >>> 15), t | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}

export function nextSeed(previous?: number): number {
  const base = previous ?? Math.floor(Math.random() * 0xffffffff);
  return (base * 1664525 + 1013904223) >>> 0;
}
