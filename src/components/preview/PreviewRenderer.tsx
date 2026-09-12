import type { CSSProperties } from "react";
import { ArrowRight, Check, Mail, MapPin, Phone } from "lucide-react";
import type { DesignSpec, Section } from "@/lib/design/types";
import { stockImages } from "@/lib/design/stock";

function rgba(hex: string, alpha: number) {
  let h = (hex || "#000000").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const r = parseInt(h.slice(0, 2), 16) || 0;
  const g = parseInt(h.slice(2, 4), 16) || 0;
  const b = parseInt(h.slice(4, 6), 16) || 0;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

type Ctx = {
  spec: DesignSpec;
  stock: string[];
  imagesFor: (section: Section, index: number, count: number) => string[];
};

function buildCtx(spec: DesignSpec): Ctx {
  const stock = stockImages(spec.stockSet, spec.industry);
  const imagesFor = (section: Section, index: number, count: number) => {
    const own = (section.images || [])
      .map((i) => spec.images[i]?.url)
      .filter((u): u is string => Boolean(u));
    const out = own.slice(0, count);
    for (let k = 0; out.length < count; k++) {
      const start = index === 0 ? 0 : 1;
      out.push(stock[(start + index + k + out.length) % stock.length]);
      if (k > 8) break;
    }
    return out;
  };
  return { spec, stock, imagesFor };
}

export function PreviewRenderer({ spec }: { spec: DesignSpec }) {
  const ctx = buildCtx(spec);
  const p = spec.palette;
  const t = spec.type;
  const s = spec.shape;

  const vars = {
    "--p-bg": p.bg,
    "--p-surface": p.surface,
    "--p-surface-alt": p.surfaceAlt,
    "--p-ink": p.ink,
    "--p-muted": p.muted,
    "--p-border": p.border,
    "--p-primary": p.primary,
    "--p-primary-soft": p.primarySoft,
    "--p-on-primary": p.onPrimary,
    "--p-accent": p.accent,
    "--p-tint": p.tint || p.primarySoft,
    "--f-head": t.headingFamily,
    "--f-body": t.bodyFamily,
    "--r-lg": `${s.radius}px`,
    "--r-sm": `${s.radiusSm}px`,
    "--r-img": `${s.imageRadius}px`,
    "--shadow": s.shadow,
    "--pad": `${s.sectionPadding}px`,
  } as CSSProperties;

  return (
    <div
      style={vars}
      className="w-full overflow-x-hidden"
    >
      <div style={{ background: p.bg, color: p.ink, fontFamily: "var(--f-body)" }}>
        <Hero ctx={ctx} />
        {spec.sections.slice(1).map((section, i) => (
          <SectionBlock key={section.id + i} ctx={ctx} section={section} index={i + 1} />
        ))}
        <Footer ctx={ctx} />
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ hero */

function Hero({ ctx }: { ctx: Ctx }) {
  const { spec } = ctx;
  const p = spec.palette;
  const b = spec.brand;
  const hero = ctx.imagesFor(spec.sections[0] || { id: "hero", type: "hero" }, 0, 1)[0];
  const upper = spec.type.headingCase === "upper";

  return (
    <>
    <header className="relative isolate overflow-hidden" style={{ background: p.ink }}>
      <img
        src={hero}
        alt={b.company}
        className="absolute inset-0 h-full w-full object-cover"
        style={{ transform: "scale(1.04)" }}
      />
      <div
        className="absolute inset-0"
        style={{
          background: `linear-gradient(180deg, ${rgba(p.ink, 0.62)} 0%, ${rgba(p.ink, 0.38)} 38%, ${rgba(p.ink, 0.88)} 100%)`,
        }}
      />
      <div
        className="absolute inset-0"
        style={{ background: `radial-gradient(120% 80% at 15% 15%, ${rgba(p.primary, 0.32)} 0%, transparent 60%)` }}
      />

      <div className="relative mx-auto w-full max-w-6xl px-5 pb-28 pt-24 sm:px-8 sm:pb-36 sm:pt-32">
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[0.68rem] font-semibold backdrop-blur"
          style={{
            background: rgba(p.tint || "#ffffff", 0.22),
            border: `1px solid ${rgba("#ffffff", 0.28)}`,
            color: "#ffffff",
            letterSpacing: spec.type.eyebrowTracking,
            textTransform: "uppercase",
          }}
        >
          <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: p.tint || p.accent }} />
          {b.tagline}
        </div>

        <h1
          className="mt-6 max-w-3xl text-[2.4rem] leading-[1.03] sm:text-6xl"
          style={{
            fontFamily: "var(--f-head)",
            fontWeight: spec.type.headingWeight,
            letterSpacing: spec.type.headingTracking,
            textTransform: upper ? "uppercase" : "none",
            color: "#ffffff",
            textShadow: `0 2px 30px ${rgba(p.ink, 0.55)}`,
          }}
        >
          {b.heroTitle}
        </h1>

        <p className="mt-5 max-w-xl text-base leading-relaxed sm:text-lg" style={{ color: rgba("#ffffff", 0.86) }}>
          {b.heroSub}
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <a
            href="#kontakt"
            className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold transition-transform hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${p.primary}, ${p.accent})`,
              color: p.onPrimary,
              borderRadius: "var(--r-sm)",
              boxShadow: `0 18px 40px -18px ${rgba(p.primary, 0.9)}`,
            }}
          >
            {b.ctaPrimary} <ArrowRight className="h-4 w-4" />
          </a>
          {b.ctaSecondary ? (
            <a
              href="#om"
              className="inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold backdrop-blur"
              style={{
                background: rgba("#ffffff", 0.12),
                border: `1px solid ${rgba("#ffffff", 0.3)}`,
                color: "#ffffff",
                borderRadius: "var(--r-sm)",
              }}
            >
              {b.ctaSecondary}
            </a>
          ) : null}
        </div>
      </div>

    </header>
    <HeroStrip ctx={ctx} />
    </>
  );
}

function HeroStrip({ ctx }: { ctx: Ctx }) {
  const p = ctx.spec.palette;
  const points = [
    ctx.spec.brand.address ? { label: "Hos oss", value: ctx.spec.brand.address } : null,
    ctx.spec.brand.phone ? { label: "Ring oss", value: ctx.spec.brand.phone } : null,
    ctx.spec.brand.email ? { label: "Mejla oss", value: ctx.spec.brand.email } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  if (!points.length) return null;

  return (
    <div className="relative z-20 mx-auto -mb-16 -mt-16 w-full max-w-5xl px-5 sm:px-8">
      <div
        className="grid gap-px overflow-hidden sm:grid-cols-3"
        style={{
          background: p.border,
          borderRadius: "var(--r-lg)",
          boxShadow: "var(--shadow)",
        }}
      >
        {points.map((point) => (
          <div key={point.label} className="px-5 py-4" style={{ background: p.surface }}>
            <div className="text-[0.64rem] font-semibold uppercase tracking-[0.2em]" style={{ color: p.primary }}>
              {point.label}
            </div>
            <div className="mt-1 text-sm font-medium break-words" style={{ color: p.ink }}>
              {point.value}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* -------------------------------------------------------------- sections */

function sectionBackground(section: Section, spec: DesignSpec) {
  const p = spec.palette;
  if (section.tone === "contrast") {
    return {
      background: `linear-gradient(145deg, ${p.primary} 0%, ${p.primary} 32%, ${p.accent} 135%)`,
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
  const { spec } = ctx;
  const style = sectionBackground(section, spec);
  const contrast = section.tone === "contrast";
  const extraTop = index === 1 ? 84 : 0;

  return (
    <section
      id={section.type === "contact" ? "kontakt" : section.id}
      className="relative"
      style={{
        ...style,
        paddingTop: `calc(var(--pad) + ${extraTop}px)`,
        paddingBottom: "var(--pad)",
      }}
    >
      {section.tone !== "contrast" ? (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 h-px"
          style={{ background: `linear-gradient(90deg, transparent, ${spec.palette.border}, transparent)` }}
        />
      ) : null}
      <div className="mx-auto w-full max-w-6xl px-5 sm:px-8">
        <SectionBody ctx={ctx} section={section} index={index} contrast={contrast} />
      </div>
    </section>
  );
}

function Heading({
  ctx,
  section,
  contrast,
  center,
}: {
  ctx: Ctx;
  section: Section;
  contrast: boolean;
  center?: boolean;
}) {
  const spec = ctx.spec;
  const p = spec.palette;
  const upper = spec.type.headingCase === "upper";
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      {section.eyebrow ? (
        <div
          className="text-[0.66rem] font-semibold uppercase"
          style={{ letterSpacing: spec.type.eyebrowTracking, color: contrast ? rgba(p.onPrimary, 0.8) : p.primary }}
        >
          {section.eyebrow}
        </div>
      ) : null}
      {section.title ? (
        <h2
          className="mt-3 text-[1.75rem] leading-tight sm:text-4xl"
          style={{
            fontFamily: "var(--f-head)",
            fontWeight: spec.type.headingWeight,
            letterSpacing: spec.type.headingTracking,
            textTransform: upper ? "uppercase" : "none",
            color: contrast ? p.onPrimary : p.ink,
          }}
        >
          {section.title}
        </h2>
      ) : null}
      {section.body ? (
        <p
          className="mt-4 text-[0.98rem] leading-relaxed sm:text-lg"
          style={{ color: contrast ? rgba(p.onPrimary, 0.86) : p.muted }}
        >
          {section.body}
        </p>
      ) : null}
    </div>
  );
}

function SectionBody({ ctx, section, index, contrast }: { ctx: Ctx; section: Section; index: number; contrast: boolean }) {
  switch (section.type) {
    case "about":
      return <SplitBlock ctx={ctx} section={section} index={index} reverse={false} />;
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

/* ------------------------------------------------------------- building blocks */

function SplitBlock({ ctx, section, index, reverse }: { ctx: Ctx; section: Section; index: number; reverse: boolean }) {
  const p = ctx.spec.palette;
  const img = ctx.imagesFor(section, index, 1)[0];
  return (
    <div className={`grid items-center gap-10 lg:grid-cols-2 ${reverse ? "lg:[direction:rtl]" : ""}`}>
      <div className="lg:[direction:ltr]">
        <Heading ctx={ctx} section={section} contrast={false} />
        <ul className="mt-7 space-y-3">
          {["Personlig kontakt", "Genuint hantverk", "Trygga leveranser"].map((line) => (
            <li key={line} className="flex items-start gap-3 text-sm" style={{ color: p.ink }}>
              <span
                className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                style={{ background: p.primarySoft, color: p.primary }}
              >
                <Check className="h-3 w-3" />
              </span>
              {line}
            </li>
          ))}
        </ul>
      </div>
      <div className="relative lg:[direction:ltr]">
        <div
          aria-hidden
          className="absolute -inset-3 -z-10 hidden sm:block"
          style={{ background: p.tint || p.primarySoft, borderRadius: "var(--r-img)", transform: "rotate(-2deg)" }}
        />
        <img
          src={img}
          alt={section.title || ctx.spec.brand.company}
          loading="lazy"
          className="h-[280px] w-full object-cover sm:h-[420px]"
          style={{ borderRadius: "var(--r-img)", boxShadow: "var(--shadow)" }}
        />
      </div>
    </div>
  );
}

function HighlightBlock({ ctx, section, index }: { ctx: Ctx; section: Section; index: number }) {
  const p = ctx.spec.palette;
  const imgs = ctx.imagesFor(section, index, 2);
  return (
    <div className="relative">
      <div className="relative overflow-hidden" style={{ borderRadius: "var(--r-lg)", boxShadow: "var(--shadow)" }}>
        <img src={imgs[0]} alt={section.title || ""} loading="lazy" className="h-[360px] w-full object-cover sm:h-[520px]" />
        <div
          className="absolute inset-0"
          style={{ background: `linear-gradient(120deg, ${rgba(p.ink, 0.82)} 0%, ${rgba(p.ink, 0.25)} 70%)` }}
        />
        <div className="absolute inset-0 flex items-end p-6 sm:items-center sm:p-12">
          <div className="max-w-md">
            <div
              className="text-[0.66rem] font-semibold uppercase"
              style={{ letterSpacing: ctx.spec.type.eyebrowTracking, color: p.tint || "#ffffff" }}
            >
              {section.eyebrow}
            </div>
            <h2
              className="mt-3 text-2xl leading-tight sm:text-4xl"
              style={{ fontFamily: "var(--f-head)", fontWeight: ctx.spec.type.headingWeight, color: "#ffffff" }}
            >
              {section.title}
            </h2>
            <p className="mt-4 text-sm leading-relaxed sm:text-base" style={{ color: rgba("#ffffff", 0.86) }}>
              {section.body}
            </p>
          </div>
        </div>
      </div>
      <img
        src={imgs[1]}
        alt=""
        loading="lazy"
        className="absolute -bottom-10 right-4 hidden h-40 w-40 object-cover lg:block"
        style={{ borderRadius: "var(--r-img)", boxShadow: "var(--shadow)", border: `6px solid ${p.bg}` }}
      />
    </div>
  );
}

function CardsBlock({
  ctx,
  section,
  index,
  withImages,
}: {
  ctx: Ctx;
  section: Section;
  index: number;
  withImages?: boolean;
}) {
  const p = ctx.spec.palette;
  const items = section.items || [];
  const imgs = withImages ? ctx.imagesFor(section, index, Math.max(items.length, 1)) : [];
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} center />
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <article
            key={item.title + i}
            className="group flex flex-col overflow-hidden transition-transform hover:-translate-y-1"
            style={{
              background: p.surface,
              border: `1px solid ${p.border}`,
              borderRadius: "var(--r-lg)",
              boxShadow: "var(--shadow)",
            }}
          >
            {withImages ? (
              <div className="relative h-40 overflow-hidden">
                <img src={imgs[i % imgs.length]} alt={item.title} loading="lazy" className="h-full w-full object-cover" />
                <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, transparent, ${rgba(p.ink, 0.25)})` }} />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col p-6">
              {!withImages ? (
                <span
                  className="mb-4 grid h-9 w-9 place-items-center text-xs font-bold"
                  style={{ background: p.primarySoft, color: p.primary, borderRadius: "var(--r-sm)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              ) : null}
              <h3
                className="text-lg"
                style={{ fontFamily: "var(--f-head)", fontWeight: ctx.spec.type.headingWeight, color: p.ink }}
              >
                {item.title}
              </h3>
              {item.body ? (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: p.muted }}>
                  {item.body}
                </p>
              ) : null}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function StepsBlock({ ctx, section }: { ctx: Ctx; section: Section }) {
  const p = ctx.spec.palette;
  const items = section.items || [];
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} />
      <ol className="relative mt-10 space-y-6 sm:space-y-0 sm:grid sm:grid-cols-3 sm:gap-6">
        <div
          aria-hidden
          className="absolute left-[19px] top-2 hidden h-px w-full sm:block"
          style={{ background: `linear-gradient(90deg, ${p.primary}, ${rgba(p.primary, 0)})`, top: 20 }}
        />
        {items.map((item, i) => (
          <li key={item.title} className="relative flex gap-4 sm:block">
            <span
              className="z-10 grid h-10 w-10 shrink-0 place-items-center text-sm font-bold"
              style={{
                background: p.primary,
                color: p.onPrimary,
                borderRadius: "999px",
                boxShadow: `0 0 0 6px ${p.bg}`,
              }}
            >
              {i + 1}
            </span>
            <div className="sm:mt-5">
              <h3 className="text-base font-semibold" style={{ fontFamily: "var(--f-head)", color: p.ink }}>
                {item.title}
              </h3>
              {item.body ? (
                <p className="mt-1.5 text-sm leading-relaxed" style={{ color: p.muted }}>
                  {item.body}
                </p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function GalleryBlock({ ctx, section, index }: { ctx: Ctx; section: Section; index: number }) {
  const p = ctx.spec.palette;
  const own = (section.images || []).map((i) => ctx.spec.images[i]?.url).filter((u): u is string => Boolean(u));
  const imgs = own.length >= 3 ? own : ctx.imagesFor(section, index, Math.max(3, own.length));
  const big = imgs.length >= 5;
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} />
      <div className={`mt-9 grid grid-cols-2 gap-3 sm:gap-4 ${big ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}>
        {imgs.slice(0, 8).map((src, i) => (
          <figure
            key={src + i}
            className={`overflow-hidden ${big && i % 5 === 0 ? "col-span-2 row-span-2" : ""}`}
            style={{ borderRadius: "var(--r-img)", boxShadow: "var(--shadow)", background: p.surfaceAlt }}
          >
            <img
              src={src}
              alt={ctx.spec.brand.company}
              loading="lazy"
              className={`w-full object-cover ${big && i % 5 === 0 ? "h-56 sm:h-[26rem]" : "h-40 sm:h-[13rem]"}`}
            />
          </figure>
        ))}
      </div>
    </div>
  );
}

function StatementBlock({ ctx, section, contrast }: { ctx: Ctx; section: Section; contrast: boolean }) {
  const p = ctx.spec.palette;
  return (
    <div
      className="relative overflow-hidden px-6 py-10 sm:px-12 sm:py-14"
      style={{
        background: contrast ? rgba("#ffffff", 0.1) : p.surface,
        border: `1px solid ${contrast ? rgba("#ffffff", 0.2) : p.border}`,
        borderRadius: "var(--r-lg)",
        boxShadow: contrast ? "none" : "var(--shadow)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
        style={{ background: contrast ? rgba("#ffffff", 0.1) : rgba(p.tint || p.primarySoft, 0.55), filter: "blur(38px)" }}
      />
      <div className="relative">
        <Heading ctx={ctx} section={section} contrast={contrast} />
      </div>
    </div>
  );
}

function DocumentsBlock({ ctx, section }: { ctx: Ctx; section: Section }) {
  const p = ctx.spec.palette;
  const docs = ctx.spec.images.filter((i) => i.role === "doc");
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} />
      <div className="mt-7 grid gap-3 sm:grid-cols-2">
        {docs.map((doc) => (
          <div
            key={doc.path}
            className="flex items-center gap-3 px-4 py-3 text-sm"
            style={{ background: p.surface, border: `1px solid ${p.border}`, borderRadius: "var(--r-sm)", color: p.ink }}
          >
            <span className="h-2 w-2 rounded-full" style={{ background: p.accent }} />
            <span className="truncate">{doc.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ContactBlock({ ctx, section }: { ctx: Ctx; section: Section }) {
  const p = ctx.spec.palette;
  const b = ctx.spec.brand;
  const rows = [
    b.email ? { icon: Mail, value: b.email } : null,
    b.phone ? { icon: Phone, value: b.phone } : null,
    b.address ? { icon: MapPin, value: b.address } : null,
  ].filter(Boolean) as { icon: typeof Mail; value: string }[];

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
      <div>
        <Heading ctx={ctx} section={section} contrast />
        <p className="mt-4 max-w-md text-sm leading-relaxed sm:text-base" style={{ color: rgba(p.onPrimary, 0.85) }}>
          Skriv några rader om vad du behöver så hör vi av oss. Vi svarar oftast samma dag.
        </p>
        <a
          href={b.email ? `mailto:${b.email}` : "#"}
          className="mt-7 inline-flex items-center gap-2 px-6 py-3.5 text-sm font-semibold"
          style={{ background: p.onPrimary, color: p.primary, borderRadius: "var(--r-sm)" }}
        >
          {b.ctaPrimary} <ArrowRight className="h-4 w-4" />
        </a>
      </div>
      <div
        className="space-y-3 p-6"
        style={{ background: rgba("#ffffff", 0.12), border: `1px solid ${rgba("#ffffff", 0.24)}`, borderRadius: "var(--r-lg)" }}
      >
        {rows.map((row) => (
          <div key={row.value} className="flex items-center gap-3 text-sm" style={{ color: p.onPrimary }}>
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{ background: rgba("#ffffff", 0.18) }}
            >
              <row.icon className="h-4 w-4" />
            </span>
            <span className="break-all">{row.value}</span>
          </div>
        ))}
        {b.socialLinks ? (
          <div className="pt-2 text-xs break-words" style={{ color: rgba(p.onPrimary, 0.75) }}>
            {b.socialLinks}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Footer({ ctx }: { ctx: Ctx }) {
  const p = ctx.spec.palette;
  const b = ctx.spec.brand;
  return (
    <footer style={{ background: p.ink, color: rgba("#ffffff", 0.72) }} className="px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div style={{ fontFamily: "var(--f-head)", color: "#ffffff" }} className="text-lg">
          {b.company}
        </div>
        <div className="text-xs">{b.tagline}</div>
      </div>
    </footer>
  );
}
