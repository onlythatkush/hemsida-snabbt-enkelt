import { ArrowRight } from "lucide-react";
import { type Ctx, ctaStyle, headingStyle, rgba } from "./theme";

/** Shared media layer: ratio driven on mobile, min-height driven on desktop. */
function HeroMedia({ ctx, src, className = "" }: { ctx: Ctx; src: string; className?: string }) {
  return (
    <img
      src={src}
      alt={ctx.spec.brand.company}
      className={`h-full w-full object-cover ${className}`}
      style={{ filter: "var(--img-filter)" }}
    />
  );
}

function Eyebrow({ ctx, onDark }: { ctx: Ctx; onDark: boolean }) {
  const p = ctx.spec.palette;
  return (
    <div
      className="inline-flex max-w-full items-center gap-2 rounded-full px-3 py-1.5 font-semibold"
      style={{
        background: onDark ? rgba("#ffffff", 0.12) : rgba(p.primary, 0.1),
        border: `1px solid ${onDark ? rgba("#ffffff", 0.26) : rgba(p.primary, 0.2)}`,
        color: onDark ? "#ffffff" : p.primary,
        letterSpacing: ctx.spec.type.eyebrowTracking,
        textTransform: "uppercase",
        fontSize: "var(--t-eyebrow)",
      }}
    >
      <span
        className="inline-block h-1.5 w-1.5 shrink-0 rounded-full"
        style={{ background: onDark ? p.tint || p.accent : p.primary }}
      />
      <span className="truncate">{ctx.spec.brand.tagline}</span>
    </div>
  );
}

function Ctas({ ctx, onDark }: { ctx: Ctx; onDark: boolean }) {
  const b = ctx.spec.brand;
  const p = ctx.spec.palette;
  return (
    <div className="mt-7 flex flex-wrap items-center gap-3">
      <a
        href="#kontakt"
        className="inline-flex items-center gap-2 transition-transform hover:-translate-y-0.5"
        style={ctaStyle(ctx, onDark)}
      >
        {b.ctaPrimary} <ArrowRight className="h-4 w-4 shrink-0" />
      </a>
      {b.ctaSecondary ? (
        <a
          href="#om"
          className="inline-flex items-center gap-2"
          style={{
            padding: "var(--t-cta-pad)",
            borderRadius: ctx.motif.ctaStyle === "pill" ? "999px" : "var(--r-sm)",
            fontSize: "var(--t-small)",
            fontWeight: 600,
            background: onDark ? rgba("#ffffff", 0.1) : "transparent",
            border: `1px solid ${onDark ? rgba("#ffffff", 0.28) : p.border}`,
            color: onDark ? "#ffffff" : p.ink,
          }}
        >
          {b.ctaSecondary}
        </a>
      ) : null}
    </div>
  );
}

export function Hero({ ctx }: { ctx: Ctx }) {
  const { spec, motif, variation } = ctx;
  const p = spec.palette;
  const b = spec.brand;
  const heroSection = spec.sections.find((s) => s.type === "hero") || { id: "hero", type: "hero" as const };
  const imgs = ctx.imagesFor(heroSection, 0, motif.hero === "split" || motif.hero === "editorial" ? 2 : 1);
  const center = variation.heroAlign === "center" && motif.hero !== "split";

  /* ------------------------------------------------- split / editorial hero */
  if (motif.hero === "split" || motif.hero === "editorial") {
    const editorial = motif.hero === "editorial";
    return (
      <header
        className="relative overflow-hidden"
        style={{ background: p.bg, color: p.ink }}
        id="hero"
      >
        <div
          className="mx-auto grid w-full items-center gap-8 lg:grid-cols-2"
          style={{
            maxWidth: "var(--t-max)",
            paddingInline: "var(--t-gutter)",
            paddingBlock: "calc(var(--t-section-y) * 0.9)",
          }}
        >
          <div className={editorial ? "order-1" : "order-1"}>
            <Eyebrow ctx={ctx} onDark={p.mode === "dark"} />
            <h1 className="mt-5" style={headingStyle(ctx, "h1", p.ink)}>
              {b.heroTitle}
            </h1>
            {editorial ? (
              <div className="mt-6 h-px w-24" style={{ background: p.primary }} />
            ) : null}
            <p
              className="mt-5 leading-relaxed"
              style={{ color: p.muted, fontSize: "var(--t-body)", maxWidth: "var(--t-measure)" }}
            >
              {b.heroSub}
            </p>
            <Ctas ctx={ctx} onDark={false} />
          </div>
          <div className="order-2 grid gap-3">
            <div
              className="relative overflow-hidden"
              style={{
                aspectRatio: motif.heroRatio,
                borderRadius: "var(--r-img)",
                boxShadow: "var(--shadow)",
              }}
            >
              <HeroMedia ctx={ctx} src={imgs[0]} />
            </div>
            {imgs[1] ? (
              <div
                className="relative hidden overflow-hidden sm:block"
                style={{ aspectRatio: "16 / 7", borderRadius: "var(--r-img)" }}
              >
                <HeroMedia ctx={ctx} src={imgs[1]} />
              </div>
            ) : null}
          </div>
        </div>
      </header>
    );
  }

  /* ------------------------------------- cinematic / fullbleed / poster hero */
  const cinematic = motif.hero === "cinematic";
  const poster = motif.hero === "poster";

  return (
    <header className="relative isolate overflow-hidden" id="hero" style={{ background: p.ink }}>
      <div className="absolute inset-0">
        <HeroMedia ctx={ctx} src={imgs[0]} />
      </div>
      <div
        className="absolute inset-0"
        style={{
          background: cinematic
            ? `linear-gradient(180deg, ${rgba("#000000", motif.overlay)} 0%, ${rgba("#000000", motif.overlay * 0.5)} 45%, ${rgba("#000000", 0.94)} 100%)`
            : `linear-gradient(180deg, ${rgba(p.ink, motif.overlay)} 0%, ${rgba(p.ink, motif.overlay * 0.62)} 42%, ${rgba(p.ink, 0.9)} 100%)`,
        }}
      />
      {poster ? (
        <div
          aria-hidden
          className="absolute inset-y-0 left-0 w-1.5"
          style={{ background: p.primary }}
        />
      ) : (
        <div
          aria-hidden
          className="absolute inset-0"
          style={{ background: `radial-gradient(120% 80% at 15% 12%, ${rgba(p.primary, 0.26)} 0%, transparent 62%)` }}
        />
      )}

      <div
        className={`relative mx-auto flex w-full flex-col ${center ? "items-center text-center" : "items-start"}`}
        style={{
          maxWidth: "var(--t-max)",
          paddingInline: "var(--t-gutter)",
          paddingBlock: "calc(var(--t-section-y) * 1.15)",
          minHeight: cinematic ? "min(88svh, 780px)" : "min(72svh, 680px)",
          justifyContent: cinematic ? "flex-end" : "center",
        }}
      >
        <Eyebrow ctx={ctx} onDark />
        <h1
          className="mt-5"
          style={{ ...headingStyle(ctx, "h1", "#ffffff"), maxWidth: "18ch", textShadow: `0 2px 30px ${rgba("#000000", 0.5)}` }}
        >
          {b.heroTitle}
        </h1>
        <p
          className="mt-5 leading-relaxed"
          style={{ color: rgba("#ffffff", 0.88), fontSize: "var(--t-body)", maxWidth: "var(--t-measure)" }}
        >
          {b.heroSub}
        </p>
        <Ctas ctx={ctx} onDark />
      </div>
    </header>
  );
}

/** Contact strip directly under the hero. Stacks safely on small screens. */
export function HeroStrip({ ctx }: { ctx: Ctx }) {
  const p = ctx.spec.palette;
  const b = ctx.spec.brand;
  const points = [
    b.address ? { label: "Hos oss", value: b.address } : null,
    b.phone ? { label: "Ring oss", value: b.phone } : null,
    b.email ? { label: "Mejla oss", value: b.email } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (!points.length) return null;

  return (
    <div style={{ background: p.bg }}>
      <div
        className="mx-auto grid w-full gap-px overflow-hidden sm:grid-cols-3"
        style={{
          maxWidth: "var(--t-max)",
          marginInline: "auto",
          background: p.border,
          borderTop: `1px solid ${p.border}`,
          borderBottom: `1px solid ${p.border}`,
        }}
      >
        {points.map((point) => (
          <div key={point.label} className="px-5 py-4" style={{ background: p.surface }}>
            <div
              className="font-semibold uppercase"
              style={{ fontSize: "var(--t-eyebrow)", letterSpacing: "0.2em", color: p.primary }}
            >
              {point.label}
            </div>
            <div
              className="mt-1 font-medium"
              style={{ color: p.ink, fontSize: "var(--t-small)", overflowWrap: "anywhere" }}
            >
              {point.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
