import type { DesignSpec, Section } from "@/lib/design/types";
import {
  CardsBlock,
  ContactBlock,
  DocumentsBlock,
  GalleryBlock,
  Heading,
  HighlightBlock,
  SplitBlock,
  StatementBlock,
  StepsBlock,
} from "./Blocks";
import { Hero, HeroStrip } from "./Hero";
import { type Ctx, buildCtx, rgba, themeVars } from "./theme";

export function PreviewRenderer({ spec }: { spec: DesignSpec }) {
  const ctx = buildCtx(spec);
  const p = spec.palette;
  const body = spec.sections.filter((s) => s.type !== "hero");

  return (
    <div style={themeVars(ctx)} className="w-full max-w-full overflow-x-hidden">
      <div style={{ background: p.bg, color: p.ink, fontFamily: "var(--f-body)", fontSize: "var(--t-body)" }}>
        <BrandBar ctx={ctx} />
        <Hero ctx={ctx} />
        <HeroStrip ctx={ctx} />
        {body.map((section, i) => (
          <SectionBlock key={section.id + i} ctx={ctx} section={section} index={i + 1} />
        ))}
        <Footer ctx={ctx} />
      </div>
    </div>
  );
}

/** Customer logo gets its own quiet brand bar instead of ending up in a gallery. */
function BrandBar({ ctx }: { ctx: Ctx }) {
  const p = ctx.spec.palette;
  if (!ctx.logo?.url) return null;
  return (
    <div style={{ background: p.surface, borderBottom: `1px solid ${p.border}` }}>
      <div
        className="mx-auto flex w-full items-center gap-3 py-3"
        style={{ maxWidth: "var(--t-max)", paddingInline: "var(--t-gutter)" }}
      >
        <img
          src={ctx.logo.url}
          alt={ctx.spec.brand.company}
          className="h-9 w-auto max-w-[160px] object-contain"
        />
        <span className="sr-only">{ctx.spec.brand.company}</span>
      </div>
    </div>
  );
}

function sectionBackground(section: Section, ctx: Ctx) {
  const p = ctx.spec.palette;
  if (section.tone === "contrast") {
    return {
      background: `linear-gradient(145deg, ${p.primary} 0%, ${p.primary} 34%, ${p.accent} 140%)`,
      color: p.onPrimary,
    };
  }
  if (section.tone === "alt") {
    return {
      background: `linear-gradient(180deg, ${p.surfaceAlt} 0%, ${p.bg} 100%)`,
      color: p.ink,
    };
  }
  return { background: p.bg, color: p.ink };
}

function SectionBlock({ ctx, section, index }: { ctx: Ctx; section: Section; index: number }) {
  const style = sectionBackground(section, ctx);
  const contrast = section.tone === "contrast";
  const divider = ctx.motif.divider;
  const p = ctx.spec.palette;

  return (
    <section
      id={section.type === "contact" ? "kontakt" : section.type === "about" ? "om" : section.id}
      className="relative w-full max-w-full overflow-hidden"
      style={{ ...style, paddingBlock: "var(--t-section-y)" }}
    >
      {!contrast && divider !== "none" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0"
          style={
            divider === "glow"
              ? { height: 1, background: `linear-gradient(90deg, transparent, ${rgba(p.primary, 0.5)}, transparent)` }
              : divider === "rule"
                ? { height: 1, background: p.border }
                : { height: 1, background: `linear-gradient(90deg, transparent, ${p.border}, transparent)` }
          }
        />
      ) : null}
      <div className="mx-auto w-full" style={{ maxWidth: "var(--t-max)", paddingInline: "var(--t-gutter)" }}>
        <SectionBody ctx={ctx} section={section} index={index} contrast={contrast} />
      </div>
    </section>
  );
}

function SectionBody({
  ctx,
  section,
  index,
  contrast,
}: {
  ctx: Ctx;
  section: Section;
  index: number;
  contrast: boolean;
}) {
  switch (section.type) {
    case "about":
      return <SplitBlock ctx={ctx} section={section} index={index} />;
    case "highlight":
      return <HighlightBlock ctx={ctx} section={section} index={index} />;
    case "services":
      return <CardsBlock ctx={ctx} section={section} index={index} withImages />;
    case "why":
      return <CardsBlock ctx={ctx} section={section} index={index} />;
    case "process":
      return <StepsBlock ctx={ctx} section={section} />;
    case "gallery":
      return <GalleryBlock ctx={ctx} section={section} index={index} />;
    case "local":
    case "wishes":
      return <StatementBlock ctx={ctx} section={section} contrast={contrast} />;
    case "documents":
      return <DocumentsBlock ctx={ctx} section={section} />;
    case "contact":
      return <ContactBlock ctx={ctx} section={section} />;
    default:
      return <Heading ctx={ctx} section={section} contrast={contrast} />;
  }
}

function Footer({ ctx }: { ctx: Ctx }) {
  const p = ctx.spec.palette;
  const b = ctx.spec.brand;
  // On dark pages the ink colour is light, so the footer uses the deep surface instead.
  const bg = p.mode === "dark" ? p.surface : p.ink;
  return (
    <footer style={{ background: bg, color: rgba("#ffffff", 0.72) }}>
      <div
        className="mx-auto flex w-full flex-col gap-3 py-10 sm:flex-row sm:items-center sm:justify-between"
        style={{ maxWidth: "var(--t-max)", paddingInline: "var(--t-gutter)" }}
      >
        <div className="flex items-center gap-3">
          {ctx.logo?.url ? (
            <img src={ctx.logo.url} alt="" className="h-8 w-auto max-w-[120px] object-contain" />
          ) : null}
          <div style={{ fontFamily: "var(--f-head)", color: "#ffffff", fontSize: "var(--t-h3)" }}>{b.company}</div>
        </div>
        <div style={{ fontSize: "var(--t-small)", overflowWrap: "anywhere" }}>{b.tagline}</div>
      </div>
    </footer>
  );
}
