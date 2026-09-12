export type Hsl = { h: number; s: number; l: number };

const NAMED: Record<string, string> = {
  röd: "#c0392b",
  rod: "#c0392b",
  rött: "#c0392b",
  tomatröd: "#d0402f",
  korall: "#f0715c",
  orange: "#e8802a",
  gul: "#e8b93a",
  solgul: "#f2c033",
  varningsgul: "#f2c200",
  guld: "#c9a227",
  gyllene: "#c9a227",
  mässing: "#b5883b",
  champagne: "#e6d5b8",
  beige: "#d9c7ad",
  linbeige: "#ddd0b8",
  benvit: "#efe9dd",
  sand: "#d8c3a5",
  ockra: "#c98f2b",
  brun: "#8b5e3c",
  trä: "#a4713f",
  choklad: "#5a3825",
  grön: "#3f7d54",
  gron: "#3f7d54",
  mossgrön: "#5b7a4b",
  bladgrön: "#4f8a46",
  mörkgrön: "#27503a",
  neongrön: "#49d63a",
  mint: "#8fd0bb",
  mintgrön: "#8fd0bb",
  turkos: "#2ca6a4",
  blå: "#2b5fa8",
  bla: "#2b5fa8",
  marinblå: "#1d3557",
  mörkblå: "#1b3a63",
  djupblå: "#173059",
  klarblå: "#1f7fd1",
  "elektrisk blå": "#1e7ae0",
  ljusblå: "#6aa9e0",
  indigo: "#3a3d84",
  lila: "#6b4a9c",
  lavendel: "#a893cf",
  rosa: "#d98ca6",
  puderrosa: "#e3b9c2",
  cerise: "#c2185b",
  svart: "#141414",
  grafit: "#2c2f33",
  antracit: "#32363b",
  charcoal: "#2b2e31",
  stålgrå: "#7c858f",
  silver: "#aab0b6",
  grå: "#6b7280",
  gra: "#6b7280",
  ljusgrå: "#c9ced4",
  varmgrå: "#9b9086",
  mörkgrå: "#4a4f55",
  vit: "#f7f5f2",
  "off-white": "#f4f1ec",
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

/**
 * Extracts hex codes and Swedish colour words from free text.
 * Longer words win: "marinblå" must not be read as plain "blå".
 */
export function extractColors(text?: string | null): string[] {
  if (!text) return [];
  const out: string[] = [];
  const hexes = text.match(/#[0-9a-fA-F]{6}|#[0-9a-fA-F]{3}\b/g) || [];
  for (const hex of hexes) {
    const full = hex.length === 4 ? "#" + hex.slice(1).split("").map((c) => c + c).join("") : hex;
    out.push(full.toLowerCase());
  }
  let haystack = text.toLowerCase();
  const words = Object.keys(NAMED).sort((a, b) => b.length - a.length);
  for (const word of words) {
    if (!haystack.includes(word)) continue;
    // Consume the match so a shorter word inside it cannot match again.
    haystack = haystack.split(word).join(" ");
    const hex = NAMED[word];
    if (!out.includes(hex)) out.push(hex);
  }
  return out.slice(0, 4);
}
