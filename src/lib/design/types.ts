export type FamilyId =
  | "warm-craft"
  | "clean-nordic"
  | "trust-professional"
  | "bold-modern"
  | "soft-wellness"
  | "fresh-retail"
  | "night-premium";

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

export type ImageRole = "hero" | "feature" | "gallery" | "doc";

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
