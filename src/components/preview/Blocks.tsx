import { ArrowRight, Check, Mail, MapPin, Phone } from "lucide-react";
import type { Section } from "@/lib/design/types";
import { type Ctx, cardStyle, ctaStyle, headingStyle, rgba } from "./theme";

export function Heading({
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
  const p = ctx.spec.palette;
  return (
    <div className={center ? "mx-auto text-center" : ""} style={{ maxWidth: "var(--t-measure)" }}>
      {section.eyebrow ? (
        <div
          className="font-semibold uppercase"
          style={{
            fontSize: "var(--t-eyebrow)",
            letterSpacing: ctx.spec.type.eyebrowTracking,
            color: contrast ? rgba(p.onPrimary, 0.82) : p.primary,
            overflowWrap: "anywhere",
          }}
        >
          {section.eyebrow}
        </div>
      ) : null}
      {section.title ? (
        <h2 className="mt-3" style={headingStyle(ctx, "h2", contrast ? p.onPrimary : p.ink)}>
          {section.title}
        </h2>
      ) : null}
      {section.body ? (
        <p
          className="mt-4 leading-relaxed"
          style={{ color: contrast ? rgba(p.onPrimary, 0.88) : p.muted, fontSize: "var(--t-body)" }}
        >
          {section.body}
        </p>
      ) : null}
    </div>
  );
}

export function SplitBlock({ ctx, section, index }: { ctx: Ctx; section: Section; index: number }) {
  const p = ctx.spec.palette;
  const img = ctx.imagesFor(section, index, 1)[0];
  return (
    <div className="grid items-center gap-8 lg:grid-cols-2" style={{ gap: "calc(var(--t-gap) * 2)" }}>
      <div>
        <Heading ctx={ctx} section={section} contrast={false} />
        <ul className="mt-7 space-y-3">
          {["Personlig kontakt", "Genuint hantverk", "Trygga leveranser"].map((line) => (
            <li
              key={line}
              className="flex items-start gap-3"
              style={{ color: p.ink, fontSize: "var(--t-small)" }}
            >
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
      <div className="relative">
        <div
          aria-hidden
          className="absolute -inset-3 -z-10 hidden sm:block"
          style={{ background: p.tint || p.primarySoft, borderRadius: "var(--r-img)", transform: "rotate(-2deg)" }}
        />
        <div
          className="overflow-hidden"
          style={{ aspectRatio: "4 / 3", borderRadius: "var(--r-img)", boxShadow: "var(--shadow)" }}
        >
          <img
            src={img}
            alt={section.title || ctx.spec.brand.company}
            loading="lazy"
            className="h-full w-full object-cover"
            style={{ filter: "var(--img-filter)" }}
          />
        </div>
      </div>
    </div>
  );
}

export function HighlightBlock({ ctx, section, index }: { ctx: Ctx; section: Section; index: number }) {
  const p = ctx.spec.palette;
  const imgs = ctx.imagesFor(section, index, 2);
  return (
    <div className="relative">
      <div
        className="relative overflow-hidden"
        style={{ borderRadius: "var(--r-lg)", boxShadow: "var(--shadow)", minHeight: "clamp(320px, 62vw, 520px)" }}
      >
        <img
          src={imgs[0]}
          alt={section.title || ""}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover"
          style={{ filter: "var(--img-filter)" }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: `linear-gradient(120deg, ${rgba(p.ink, 0.88)} 0%, ${rgba(p.ink, 0.42)} 62%, ${rgba(p.ink, 0.2)} 100%)`,
          }}
        />
        <div
          className="relative flex items-end"
          style={{ minHeight: "clamp(320px, 62vw, 520px)", padding: "clamp(1.25rem, 5vw, 3rem)" }}
        >
          <div style={{ maxWidth: "var(--t-measure)" }}>
            <div
              className="font-semibold uppercase"
              style={{
                fontSize: "var(--t-eyebrow)",
                letterSpacing: ctx.spec.type.eyebrowTracking,
                color: p.tint || "#ffffff",
              }}
            >
              {section.eyebrow}
            </div>
            <h2 className="mt-3" style={headingStyle(ctx, "h2", "#ffffff")}>
              {section.title}
            </h2>
            <p
              className="mt-4 leading-relaxed"
              style={{ color: rgba("#ffffff", 0.88), fontSize: "var(--t-body)" }}
            >
              {section.body}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function CardsBlock({
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
  const cols = ctx.variation.cardColumns === 2 ? "lg:grid-cols-2" : "lg:grid-cols-3";
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} center />
      <div className={`mt-10 grid sm:grid-cols-2 ${cols}`} style={{ gap: "var(--t-gap)" }}>
        {items.map((item, i) => (
          <article
            key={item.title + i}
            className="flex flex-col overflow-hidden transition-transform hover:-translate-y-1"
            style={cardStyle(ctx)}
          >
            {withImages ? (
              <div className="relative overflow-hidden" style={{ aspectRatio: "16 / 10" }}>
                <img
                  src={imgs[i % imgs.length]}
                  alt={item.title}
                  loading="lazy"
                  className="h-full w-full object-cover"
                  style={{ filter: "var(--img-filter)" }}
                />
                <div
                  className="absolute inset-0"
                  style={{ background: `linear-gradient(180deg, transparent, ${rgba(p.ink, 0.28)})` }}
                />
              </div>
            ) : null}
            <div className="flex flex-1 flex-col" style={{ padding: "clamp(1.1rem, 3.5vw, 1.6rem)" }}>
              {!withImages ? (
                <span
                  className="mb-4 grid h-9 w-9 place-items-center text-xs font-bold"
                  style={{ background: p.primarySoft, color: p.primary, borderRadius: "var(--r-sm)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
              ) : null}
              <h3 style={headingStyle(ctx, "h3", p.ink)}>{item.title}</h3>
              {item.body ? (
                <p className="mt-2 leading-relaxed" style={{ color: p.muted, fontSize: "var(--t-small)" }}>
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

export function StepsBlock({ ctx, section }: { ctx: Ctx; section: Section }) {
  const p = ctx.spec.palette;
  const items = section.items || [];
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} />
      <ol className="relative mt-10 space-y-6 sm:grid sm:grid-cols-3 sm:gap-6 sm:space-y-0">
        <div
          aria-hidden
          className="absolute left-0 hidden h-px w-full sm:block"
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
            <div className="min-w-0 sm:mt-5">
              <h3 style={headingStyle(ctx, "h3", p.ink)}>{item.title}</h3>
              {item.body ? (
                <p className="mt-1.5 leading-relaxed" style={{ color: p.muted, fontSize: "var(--t-small)" }}>
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

export function GalleryBlock({ ctx, section, index }: { ctx: Ctx; section: Section; index: number }) {
  const p = ctx.spec.palette;
  const own = (section.images || [])
    .map((i) => ctx.spec.images[i])
    .filter((img) => img && img.role !== "logo" && img.url)
    .map((img) => img.url as string);
  const imgs = own.length >= 3 ? own : ctx.imagesFor(section, index, Math.max(3, own.length));
  const style = ctx.variation.galleryStyle;

  if (style === "strip") {
    return (
      <div>
        <Heading ctx={ctx} section={section} contrast={false} />
        <div className="mt-9 grid grid-cols-2 sm:grid-cols-4" style={{ gap: "var(--t-gap)" }}>
          {imgs.slice(0, 8).map((src, i) => (
            <figure
              key={src + i}
              className="overflow-hidden"
              style={{ aspectRatio: "3 / 4", borderRadius: "var(--r-img)", background: p.surfaceAlt }}
            >
              <img
                src={src}
                alt={ctx.spec.brand.company}
                loading="lazy"
                className="h-full w-full object-cover"
                style={{ filter: "var(--img-filter)" }}
              />
            </figure>
          ))}
        </div>
      </div>
    );
  }

  const mosaic = style === "mosaic" && imgs.length >= 5;
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} />
      <div
        className={`mt-9 grid grid-cols-2 ${mosaic ? "sm:grid-cols-4" : "sm:grid-cols-3"}`}
        style={{ gap: "var(--t-gap)" }}
      >
        {imgs.slice(0, 8).map((src, i) => {
          const big = mosaic && i % 5 === 0;
          return (
            <figure
              key={src + i}
              className={`overflow-hidden ${big ? "col-span-2 row-span-2" : ""}`}
              style={{
                aspectRatio: big ? "1 / 1" : "4 / 3",
                borderRadius: "var(--r-img)",
                boxShadow: "var(--shadow)",
                background: p.surfaceAlt,
              }}
            >
              <img
                src={src}
                alt={ctx.spec.brand.company}
                loading="lazy"
                className="h-full w-full object-cover"
                style={{ filter: "var(--img-filter)" }}
              />
            </figure>
          );
        })}
      </div>
    </div>
  );
}

export function StatementBlock({ ctx, section, contrast }: { ctx: Ctx; section: Section; contrast: boolean }) {
  const p = ctx.spec.palette;
  return (
    <div
      className="relative overflow-hidden"
      style={{
        ...cardStyle(ctx, contrast),
        background: contrast ? rgba("#ffffff", 0.1) : cardStyle(ctx).background,
        padding: "clamp(1.5rem, 6vw, 3.5rem)",
      }}
    >
      {ctx.variation.useStatementAccent ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full"
          style={{
            background: contrast ? rgba("#ffffff", 0.1) : rgba(p.tint || p.primarySoft, 0.55),
            filter: "blur(38px)",
          }}
        />
      ) : null}
      <div className="relative">
        <Heading ctx={ctx} section={section} contrast={contrast} />
      </div>
    </div>
  );
}

export function DocumentsBlock({ ctx, section }: { ctx: Ctx; section: Section }) {
  const p = ctx.spec.palette;
  const docs = ctx.spec.images.filter((i) => i.role === "doc");
  return (
    <div>
      <Heading ctx={ctx} section={section} contrast={false} />
      <div className="mt-7 grid sm:grid-cols-2" style={{ gap: "var(--t-gap)" }}>
        {docs.map((doc) => (
          <div
            key={doc.path}
            className="flex items-center gap-3"
            style={{
              background: p.surface,
              border: `1px solid ${p.border}`,
              borderRadius: "var(--r-sm)",
              color: p.ink,
              padding: "0.75rem 1rem",
              fontSize: "var(--t-small)",
            }}
          >
            <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: p.accent }} />
            <span className="truncate">{doc.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ContactBlock({ ctx, section }: { ctx: Ctx; section: Section }) {
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
        <p
          className="mt-4 leading-relaxed"
          style={{ color: rgba(p.onPrimary, 0.86), fontSize: "var(--t-body)", maxWidth: "var(--t-measure)" }}
        >
          Skriv några rader om vad du behöver så hör vi av oss. Vi svarar oftast samma dag.
        </p>
        <a
          href={b.email ? `mailto:${b.email}` : "#"}
          className="mt-7 inline-flex items-center gap-2"
          style={{ ...ctaStyle(ctx, true), background: p.onPrimary, color: p.primary, border: "none" }}
        >
          {b.ctaPrimary} <ArrowRight className="h-4 w-4 shrink-0" />
        </a>
      </div>
      <div
        className="space-y-3"
        style={{
          background: rgba("#ffffff", 0.12),
          border: `1px solid ${rgba("#ffffff", 0.24)}`,
          borderRadius: "var(--r-lg)",
          padding: "clamp(1.25rem, 4vw, 1.6rem)",
        }}
      >
        {rows.map((row) => (
          <div
            key={row.value}
            className="flex items-center gap-3"
            style={{ color: p.onPrimary, fontSize: "var(--t-small)" }}
          >
            <span
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
              style={{ background: rgba("#ffffff", 0.18) }}
            >
              <row.icon className="h-4 w-4" />
            </span>
            <span style={{ overflowWrap: "anywhere" }}>{row.value}</span>
          </div>
        ))}
        {b.socialLinks ? (
          <div
            className="pt-2"
            style={{ color: rgba(p.onPrimary, 0.75), fontSize: "var(--t-eyebrow)", overflowWrap: "anywhere" }}
          >
            {b.socialLinks}
          </div>
        ) : null}
      </div>
    </div>
  );
}
