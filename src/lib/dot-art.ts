// Deterministic generative dot field, seeded by a string.
export type Dot = { cx: number; cy: number; r: string; d: number };

function hash(text: string) {
  let h = 2166136261;
  for (const char of text) {
    h ^= char.charCodeAt(0);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function dotField(seed: string, cols = 20, rows = 12, step = 16) {
  const h = hash(seed);
  const variant = h % 4;
  const fx = 0.25 + ((h >> 4) % 100) / 200;
  const fy = 0.2 + ((h >> 12) % 100) / 220;
  const phase = ((h >> 20) % 628) / 100;

  const dots: Dot[] = [];
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const nx = x / cols - 0.5;
      const ny = y / rows - 0.5;
      let v: number;
      if (variant === 0) v = Math.sin(x * fx + phase) * Math.cos(y * fy * 1.6 + phase);
      else if (variant === 1) v = Math.cos(Math.hypot(nx * 1.6, ny) * (10 + fx * 10) - phase);
      else if (variant === 2) v = Math.sin((x + y * 1.3) * fx + phase) * 0.8 + Math.cos(y * fy) * 0.2;
      else v = Math.sin(Math.atan2(ny, nx) * 3 + phase) * Math.cos(Math.hypot(nx, ny) * 8);
      const r = Math.max(0.35, ((v + 1) / 2) * 3.2);
      dots.push({ cx: step / 2 + x * step, cy: step / 2 + y * step, r: r.toFixed(2), d: (x + y) * 18 });
    }
  }

  return { dots, width: cols * step, height: rows * step };
}
