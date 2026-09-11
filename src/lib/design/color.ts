export type Hsl = { h: number; s: number; l: number };

const NAMED: Record<string, string> = {
  röd: "#c0392b",
  rod: "#c0392b",
  rött: "#c0392b",
  orange: "#e8802a",
  gul: "#e8b93a",
  guld: "#c9a227",
  gyllene: "#c9a227",
  beige: "#d9c7ad",
  sand: "#d8c3a5",
  brun: "#8b5e3c",
  choklad: "#5a3825",
  grön: "#3f7d54",
  gron: "#3f7d54",
  mossgrön: "#5b7a4b",
  turkos: "#2ca6a4",
  blå: "#2b5fa8",
  bla: "#2b5fa8",
  marinblå: "#1d3557",
  ljusblå: "#6aa9e0",
  lila: "#6b4a9c",
  rosa: "#d98ca6",
  cerise: "#c2185b",
  svart: "#141414",
  grå: "#6b7280",
  gra: "#6b7280",
  vit: "#f7f5f2",
  krämvit: "#f5efe4",
  kram: "#f5efe4",
  pastell: "#e6d7e0",
  koppar: "#b4703a",
  terrakotta: "#c1663f",
};

export function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function hexToHsl(hex: string): Hsl {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = ((g - b) / d + (g < b ? 6 : 0)) * 60;
    else if (max === g) hue = ((b - r) / d + 2) * 60;
    else hue = ((r - g) / d + 4) * 60;
  }
  return { h: hue, s: s * 100, l: l * 100 };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sat = clamp(s, 0, 100) / 100;
  const lig = clamp(l, 0, 100) / 100;
  const a = sat * Math.min(lig, 1 - lig);
  const f = (n: number) => {
    const k = (n + ((h % 360) + 360) / 30) % 12;
    const color = lig - a * Math.max(-1, Math.min(k - 3, Math.min(9 - k, 1)));
    return Math.round(255 * color)
      .toString(16)
      .padStart(2, "0");
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

export function adjust(hex: string, delta: Partial<Hsl>): string {
  const base = hexToHsl(hex);
  return hslToHex({
    h: base.h + (delta.h ?? 0),
    s: clamp(base.s + (delta.s ?? 0), 0, 100),
    l: clamp(base.l + (delta.l ?? 0), 0, 100),
  });
}

export function withLightness(hex: string, l: number): string {
  const base = hexToHsl(hex);
  return hslToHex({ h: base.h, s: base.s, l });
}

export function luminance(hex: string): number {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const channel = (v: number) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  const r = channel(parseInt(h.slice(0, 2), 16));
  const g = channel(parseInt(h.slice(2, 4), 16));
  const b = channel(parseInt(h.slice(4, 6), 16));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrast(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/** Returns a near-black or near-white ink that reads on the given background. */
export function readableOn(bg: string, dark = "#161310", light = "#fffaf3"): string {
  return contrast(bg, dark) >= contrast(bg, light) ? dark : light;
}

/** Nudges `fg` lighter/darker until it reaches the requested contrast on `bg`. */
export function ensureContrast(fg: string, bg: string, ratio = 4.5): string {
  let current = fg;
  const bgLum = luminance(bg);
  const step = bgLum > 0.5 ? -4 : 4;
  for (let i = 0; i < 24 && contrast(current, bg) < ratio; i++) {
    current = adjust(current, { l: step });
  }
  return current;
}

/** Extracts hex codes and Swedish colour words from free text. */
export function extractColors(text?: string | null): string[] {
  if (!text) return [];
  const out: string[] = [];
  const hexes = text.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b/g) || [];
  for (const hex of hexes) {
    const full = hex.length === 4 ? "#" + hex.slice(1).split("").map((c) => c + c).join("") : hex;
    out.push(full.toLowerCase());
  }
  const lower = text.toLowerCase();
  for (const [word, hex] of Object.entries(NAMED)) {
    if (lower.includes(word) && !out.includes(hex)) out.push(hex);
  }
  return out.slice(0, 4);
}
