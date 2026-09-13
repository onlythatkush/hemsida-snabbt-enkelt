export type FamilyId =
  | "warm-craft"
  | "clean-nordic"
  | "trust-professional"
  | "bold-modern"
  | "soft-wellness"
  | "fresh-retail"
  | "night-premium"
  | "cinematic-auto"
  | "industrial-trade"
  | "calm-wellness"
  | "editorial-b2b"
  | "estate-modern"
  | "kinetic-fitness";

export type IndustryId =
  | "bakery"
  | "restaurant"
  | "cafe"
  | "ecommerce"
  | "retail"
  | "legal"
  | "consulting"
  | "beauty"
  | "health"
  | "construction"
  | "fitness"
  | "photography"
  | "cleaning"
  | "realestate"
  | "events"
  | "automotive"
  | "hospitality"
  | "generic";

export type Tone = {
  warmth: number;
  formality: number;
  playfulness: number;
  density: number;
  craft: number;
};

export type Palette = {
  mode: "light" | "dark";
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  muted: string;
  border: string;
  primary: string;
  primarySoft: string;
  onPrimary: string;
  accent: string;
  /** Optional pale brand colour used for tints, washes and soft highlights. */
  tint?: string;
};

export type Typography = {
  headingFamily: string;
  bodyFamily: string;
  headingWeight: number;
  headingTracking: string;
  headingCase: "none" | "upper";
  scale: number;
  eyebrowTracking: string;
};

export type Shape = {
  radius: number;
  radiusSm: number;
  shadow: string;
  imageRadius: number;
  border: string;
  sectionPadding: number;
};

export type ImageRole = "hero" | "feature" | "gallery" | "doc" | "logo";

export type SpecImage = {
  path: string;
  name: string;
  role: ImageRole;
  url?: string;
};

export type SectionType =
  | "hero"
  | "about"
  | "services"
  | "highlight"
  | "local"
  | "gallery"
  | "why"
  | "process"
  | "wishes"
  | "documents"
  | "contact";

export type SectionItem = { title: string; body?: string };

export type Section = {
  id: string;
  type: SectionType;
  eyebrow?: string;
  title?: string;
  body?: string;
  items?: SectionItem[];
  images?: number[];
  layout?: "grid" | "list" | "split" | "split-reverse" | "steps" | "masonry";
  tone?: "base" | "alt" | "contrast";
};

/** Rendering recipe that gives each family its own character. */
export type Motif = {
  hero: "fullbleed" | "cinematic" | "split" | "editorial" | "poster";
  card: "elevated" | "flat" | "outline" | "glass";
  divider: "hairline" | "none" | "rule" | "glow";
  imageFilter?: string;
  /** 0-1, how dark the hero scrim is. */
  overlay: number;
  /** Aspect ratio used for hero media on mobile, e.g. "4 / 5". */
  heroRatio: string;
  ctaStyle: "solid" | "gradient" | "outline" | "pill";
  accentUse: "sparse" | "balanced" | "loud";
};

/** Mobile-safe, clamp based sizing tokens. */
export type Tokens = {
  h1: string;
  h2: string;
  h3: string;
  body: string;
  small: string;
  eyebrow: string;
  sectionY: string;
  gutter: string;
  gap: string;
  maxWidth: string;
  ctaPadding: string;
  measure: string;
};

export type Variation = {
  /** Stable id, e.g. "cinematic-auto/v2". */
  id: string;
  heroAlign: "left" | "center";
  sectionOrder: string[];
  cardColumns: 2 | 3;
  galleryStyle: "mosaic" | "even" | "strip";
  useStatementAccent: boolean;
};

/** Concrete visual direction derived from the customer's own wishes. */
export type ArtDirection = {
  /** Visual subjects to feature, e.g. ["cars", "city", "night", "luxury"]. */
  subjects: string[];
  /** The matched phrases from the customer's text. */
  keywords: string[];
  mood: "night" | "bright" | "neutral";
  /** True when the brief explicitly asks for imagery in the hero/background. */
  requireHeroMedia: boolean;
};

export type QaCheck = {
  id: string;
  label: string;
  level: "pass" | "warn" | "fail";
  detail?: string;
};

export type QaReport = {
  score: number;
  status: "ready" | "review" | "blocked";
  checks: QaCheck[];
  evaluatedAt: string;
};

export type DesignSpec = {
  version: number;
  generatedAt: string;
  seed: number;
  family: FamilyId;
  variant: string;
  industry: IndustryId;
  tone: Tone;
  palette: Palette;
  type: Typography;
  shape: Shape;
  brand: {
    company: string;
    tagline: string;
    heroTitle: string;
    heroSub: string;
    ctaPrimary: string;
    ctaSecondary?: string;
    email?: string;
    phone?: string;
    address?: string;
    socialLinks?: string;
  };
  images: SpecImage[];
  sections: Section[];
  fonts: string[];
  /** Which curated photo set to fall back on when the customer has no own photos. */
  stockSet?: string;
  /** v2 additions — optional so previously stored specs keep rendering. */
  motif?: Motif;
  tokens?: Tokens;
  variation?: Variation;
  qa?: QaReport;
  /** v2.1 — art direction taken from the customer's free-text wishes. */
  art?: ArtDirection;
};

export type ApplicationInput = {
  reference: string;
  company: string;
  description: string;
  website_type?: string | null;
  colors?: string | null;
  extra_requests?: string | null;
  social_links?: string | null;
  address?: string | null;
  email?: string | null;
  phone?: string | null;
  file_names?: string[] | null;
};
