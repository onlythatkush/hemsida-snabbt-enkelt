import type { CSSProperties } from "react";
import type { DesignSpec, Section, SpecImage } from "@/lib/design/types";

type Props = { spec: DesignSpec };

function styleVars(spec: DesignSpec): CSSProperties {
  const p = spec.palette;
  return {
    "--dw-bg": p.bg,
    "--dw-surface": p.surface,
    "--dw-surface-alt": p.surfaceAlt,
    "--dw-ink": p.ink,
    "--dw-muted": p.muted,
    "--dw-border": p.border,
    "--dw-primary": p.primary,
    "--dw-primary-soft": p.primarySoft,
    "--dw-on-primary": p.onPrimary,
    "--dw-accent": p.accent,
    "--dw-radius": `${spec.shape.radius}px`,
    "--dw-radius-sm": `${spec.shape.radiusSm}px`,
    "--dw-image-radius": `${spec.shape.imageRadius}px`,
    "--dw-shadow": spec.shape.shadow,
    "--dw-heading": spec.type.headingFamily,
    "--dw-body": spec.type.bodyFamily,
    "--dw-heading-weight": String(spec.type.headingWeight),
    "--dw-tracking": spec.type.headingTracking,
    "--dw-eyebrow-tracking": spec.type.eyebrowTracking,
    "--dw-pad": `${spec.shape.sectionPadding}px`,
    backgroundColor: "var(--dw-bg)",
    color: "var(--dw-ink)",
    fontFamily: "var(--dw-body)",
  } as CSSProperties;
}

function imagesFor(spec: DesignSpec, section: Section): SpecImage[] {
  return (section.images || [])
    .map((index) => spec.images[index])
    .filter((image): image is SpecImage => Boolean(image?.url));
}

function sectionBackground(tone: Section["tone"]) {
  if (tone === "alt") return "var(--dw-surface-alt)";
  if (tone === "contrast") return "var(--dw-primary)";
  return "transparent";
}

function Heading({ children, level = 2 }: { children: React.ReactNode; level?: 1 | 2 | 3 }) {
  const Tag = (level === 1 ? "h1" : level === 2 ? "h2" : "h3") as "h1";
  const size = level === 1 ? "clamp(2.3rem, 8vw, 4.4rem)" : level === 2 ? "clamp(1.65rem, 5vw, 2.6rem)" : "1.15rem";
  return (
    <Tag
      style={{
        fontFamily: "var(--dw-heading)",
        fontWeight: "var(--dw-heading-weight)" as unknown as number,
        letterSpacing: "var(--dw-tracking)",
        lineHeight: level === 1 ? 1.03 : 1.15,
        fontSize: size,
        margin: 0,
      }}
    >
      {children}
    </Tag>
  );
}

function Eyebrow({ children, muted }: { children: React.ReactNode; muted?: boolean }) {
  if (!children) return null;
  return (
    <div
      style={{
        textTransform: "uppercase",
        letterSpacing: "var(--dw-eyebrow-tracking)",
        fontSize: "0.7rem",
        fontWeight: 600,
        marginBottom: 14,
        color: muted ? "currentColor" : "var(--dw-primary)",
        opacity: muted ? 0.7 : 1,
      }}
    >
      {children}
    </div>
  );
}

function Cta({ label, variant = "solid" }: { label: string; variant?: "solid" | "ghost" }) {
  const solid = variant === "solid";
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "14px 26px",
        borderRadius: "var(--dw-radius-sm)",
        fontWeight: 600,
        fontSize: "0.98rem",
        background: solid ? "var(--dw-primary)" : "transparent",
        color: solid ? "var(--dw-on-primary)" : "currentColor",
        border: solid ? "1px solid transparent" : "1px solid currentColor",
      }}
    >
      {label}
    </span>
  );
}

function SectionShell({ section, children }: { section: Section; children: React.ReactNode }) {
  const contrast = section.tone === "contrast";
  return (
    <section
      style={{
        background: sectionBackground(section.tone),
        color: contrast ? "var(--dw-on-primary)" : "var(--dw-ink)",
        paddingTop: "var(--dw-pad)",
        paddingBottom: "var(--dw-pad)",
      }}
    >
      <div style={{ maxWidth: 1120, margin: "0 auto", padding: "0 20px" }}>{children}</div>
    </section>
  );
}

function Hero({ spec, section }: { spec: DesignSpec; section: Section }) {
  const [image] = imagesFor(spec, section);
  const dark = spec.palette.mode === "dark";
  return (
    <section style={{ position: "relative", overflow: "hidden", background: image ? "#000" : "var(--dw-surface-alt)" }}>
      {image && (
        <img
          src={image.url}
          alt=""
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: dark ? 0.5 : 0.62 }}
        />
      )}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: image
            ? `linear-gradient(180deg, rgba(0,0,0,0.28), rgba(0,0,0,0.66))`
            : `linear-gradient(160deg, var(--dw-primary-soft), var(--dw-bg))`,
        }}
      />
      <div
        style={{
          position: "relative",
          maxWidth: 1120,
          margin: "0 auto",
          padding: "clamp(84px, 18vw, 168px) 20px clamp(64px, 12vw, 132px)",
          color: image ? "#fff" : "var(--dw-ink)",
        }}
      >
        <div style={{ maxWidth: 680 }}>
          <Eyebrow muted={Boolean(image)}>{spec.brand.tagline}</Eyebrow>
          <Heading level={1}>{spec.brand.heroTitle}</Heading>
          <p style={{ marginTop: 20, fontSize: "clamp(1.02rem, 2.6vw, 1.2rem)", lineHeight: 1.65, opacity: 0.92 }}>
            {spec.brand.heroSub}
          </p>
          <div style={{ marginTop: 30, display: "flex", flexWrap: "wrap", gap: 12 }}>
            <Cta label={spec.brand.ctaPrimary} />
            {spec.brand.ctaSecondary && <Cta label={spec.brand.ctaSecondary} variant="ghost" />}
          </div>
        </div>
      </div>
    </section>
  );
}

function About({ spec, section }: { spec: DesignSpec; section: Section }) {
  const [image] = imagesFor(spec, section);
  return (
    <SectionShell section={section}>
      <div
        style={{
          display: "grid",
          gap: 32,
          gridTemplateColumns: image ? "repeat(auto-fit, minmax(280px, 1fr))" : "1fr",
          alignItems: "center",
        }}
      >
        <div style={{ maxWidth: 620 }}>
          <Eyebrow>{section.eyebrow}</Eyebrow>
          <Heading>{section.title}</Heading>
          <p style={{ marginTop: 18, lineHeight: 1.75, color: "var(--dw-muted)", fontSize: "1.03rem" }}>{section.body}</p>
        </div>
        {image && (
          <img
            src={image.url}
            alt=""
            loading="lazy"
            style={{ width: "100%", aspectRatio: "4 / 3", objectFit: "cover", borderRadius: "var(--dw-image-radius)", boxShadow: "var(--dw-shadow)" }}
          />
        )}
      </div>
    </SectionShell>
  );
}

function Cards({ spec, section }: { spec: DesignSpec; section: Section }) {
  const images = imagesFor(spec, section);
  return (
    <SectionShell section={section}>
      <div style={{ maxWidth: 620, marginBottom: 34 }}>
        <Eyebrow>{section.eyebrow}</Eyebrow>
        <Heading>{section.title}</Heading>
        {section.body && <p style={{ marginTop: 14, lineHeight: 1.7, color: "var(--dw-muted)" }}>{section.body}</p>}
      </div>
      <div style={{ display: "grid", gap: 18, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {(section.items || []).map((item, index) => {
          const image = images[index];
          return (
            <article
              key={item.title}
              style={{
                background: "var(--dw-surface)",
                borderRadius: "var(--dw-radius)",
                border: "1px solid var(--dw-border)",
                boxShadow: "var(--dw-shadow)",
                overflow: "hidden",
                color: "var(--dw-ink)",
              }}
            >
              {image && (
                <img src={image.url} alt="" loading="lazy" style={{ width: "100%", aspectRatio: "3 / 2", objectFit: "cover" }} />
              )}
              <div style={{ padding: 22 }}>
                <Heading level={3}>{item.title}</Heading>
                {item.body && <p style={{ marginTop: 10, lineHeight: 1.65, color: "var(--dw-muted)", fontSize: "0.96rem" }}>{item.body}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </SectionShell>
  );
}

function Highlight({ spec, section }: { spec: DesignSpec; section: Section }) {
  const images = imagesFor(spec, section);
  return (
    <SectionShell section={section}>
      <div style={{ display: "grid", gap: 32, gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", alignItems: "center" }}>
        <div style={{ display: "grid", gap: 14, order: section.layout === "split-reverse" ? 1 : 0 }}>
          {images.slice(0, 2).map((image) => (
            <img
              key={image.path}
              src={image.url}
              alt=""
              loading="lazy"
              style={{ width: "100%", aspectRatio: "16 / 10", objectFit: "cover", borderRadius: "var(--dw-image-radius)", boxShadow: "var(--dw-shadow)" }}
            />
          ))}
        </div>
        <div style={{ maxWidth: 560 }}>
          <Eyebrow>{section.eyebrow}</Eyebrow>
          <Heading>{section.title}</Heading>
          <p style={{ marginTop: 18, lineHeight: 1.75, color: "var(--dw-muted)" }}>{section.body}</p>
        </div>
      </div>
    </SectionShell>
  );
}

function Steps({ section }: { section: Section }) {
  return (
    <SectionShell section={section}>
      <div style={{ maxWidth: 620, marginBottom: 32 }}>
        <Eyebrow>{section.eyebrow}</Eyebrow>
        <Heading>{section.title}</Heading>
      </div>
      <ol style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 16, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {(section.items || []).map((item, index) => (
          <li key={item.title} style={{ padding: 22, background: "var(--dw-surface)", border: "1px solid var(--dw-border)", borderRadius: "var(--dw-radius)" }}>
            <div style={{ fontFamily: "var(--dw-heading)", fontSize: "1.7rem", color: "var(--dw-primary)", lineHeight: 1 }}>{index + 1}</div>
            <div style={{ marginTop: 12, fontWeight: 600 }}>{item.title}</div>
            {item.body && <p style={{ marginTop: 8, lineHeight: 1.6, color: "var(--dw-muted)", fontSize: "0.94rem" }}>{item.body}</p>}
          </li>
        ))}
      </ol>
    </SectionShell>
  );
}

function Statement({ section }: { section: Section }) {
  return (
    <SectionShell section={section}>
      <div style={{ maxWidth: 720 }}>
        <Eyebrow muted>{section.eyebrow}</Eyebrow>
        <Heading>{section.title}</Heading>
        {section.body && (
          <p style={{ marginTop: 18, lineHeight: 1.75, fontSize: "1.05rem", opacity: 0.92, whiteSpace: "pre-wrap" }}>{section.body}</p>
        )}
      </div>
    </SectionShell>
  );
}

function Gallery({ spec, section }: { spec: DesignSpec; section: Section }) {
  const images = imagesFor(spec, section);
  if (!images.length) return null;
  return (
    <SectionShell section={section}>
      <div style={{ maxWidth: 620, marginBottom: 26 }}>
        <Eyebrow>{section.eyebrow}</Eyebrow>
        <Heading>{section.title}</Heading>
      </div>
      <div style={{ display: "grid", gap: 14, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
        {images.map((image, index) => (
          <img
            key={image.path}
            src={image.url}
            alt=""
            loading="lazy"
            style={{
              width: "100%",
              aspectRatio: index % 5 === 0 ? "4 / 5" : "1 / 1",
              objectFit: "cover",
              borderRadius: "var(--dw-image-radius)",
            }}
          />
        ))}
      </div>
    </SectionShell>
  );
}

function Documents({ spec, section }: { spec: DesignSpec; section: Section }) {
  const docs = spec.images.filter((image) => image.role === "doc" && image.url);
  if (!docs.length) return null;
  return (
    <SectionShell section={section}>
      <Eyebrow>{section.eyebrow}</Eyebrow>
      <Heading>{section.title}</Heading>
      <div style={{ marginTop: 20, display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
        {docs.map((doc) => (
          <a
            key={doc.path}
            href={doc.url}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "block",
              padding: 16,
              borderRadius: "var(--dw-radius-sm)",
              border: "1px solid var(--dw-border)",
              background: "var(--dw-surface)",
              color: "var(--dw-ink)",
              textDecoration: "none",
              fontSize: "0.95rem",
            }}
          >
            {doc.name}
          </a>
        ))}
      </div>
    </SectionShell>
  );
}

function Contact({ spec, section }: { spec: DesignSpec; section: Section }) {
  const rows = [
    spec.brand.email && { label: "E-post", value: spec.brand.email },
    spec.brand.phone && { label: "Telefon", value: spec.brand.phone },
    spec.brand.address && { label: "Adress", value: spec.brand.address },
    spec.brand.socialLinks && { label: "Sociala medier", value: spec.brand.socialLinks },
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <SectionShell section={section}>
      <div style={{ display: "grid", gap: 30, gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))" }}>
        <div>
          <Eyebrow muted>{section.eyebrow}</Eyebrow>
          <Heading>{section.title}</Heading>
          <p style={{ marginTop: 16, lineHeight: 1.7, opacity: 0.9 }}>
            Skriv eller ring så återkommer vi så snart vi kan.
          </p>
          <div style={{ marginTop: 22 }}>
            <span
              style={{
                display: "inline-flex",
                padding: "14px 26px",
                borderRadius: "var(--dw-radius-sm)",
                background: "var(--dw-on-primary)",
                color: "var(--dw-primary)",
                fontWeight: 600,
              }}
            >
              {spec.brand.ctaPrimary}
            </span>
          </div>
        </div>
        <dl style={{ margin: 0, display: "grid", gap: 14, alignContent: "start" }}>
          {rows.map((row) => (
            <div key={row.label} style={{ borderTop: "1px solid rgba(255,255,255,0.25)", paddingTop: 12 }}>
              <dt style={{ fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "0.16em", opacity: 0.7 }}>{row.label}</dt>
              <dd style={{ margin: "6px 0 0", wordBreak: "break-word" }}>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </SectionShell>
  );
}

export function PreviewRenderer({ spec }: Props) {
  return (
    <div style={styleVars(spec)}>
      {spec.sections.map((section) => {
        switch (section.type) {
          case "hero":
            return <Hero key={section.id} spec={spec} section={section} />;
          case "about":
            return <About key={section.id} spec={spec} section={section} />;
          case "services":
          case "why":
            return <Cards key={section.id} spec={spec} section={section} />;
          case "highlight":
            return <Highlight key={section.id} spec={spec} section={section} />;
          case "process":
            return <Steps key={section.id} section={section} />;
          case "local":
          case "wishes":
            return <Statement key={section.id} section={section} />;
          case "gallery":
            return <Gallery key={section.id} spec={spec} section={section} />;
          case "documents":
            return <Documents key={section.id} spec={spec} section={section} />;
          case "contact":
            return <Contact key={section.id} spec={spec} section={section} />;
          default:
            return null;
        }
      })}
      <footer style={{ background: "var(--dw-surface-alt)", color: "var(--dw-muted)", padding: "28px 20px", textAlign: "center", fontSize: "0.85rem" }}>
        {spec.brand.company} — förslag framtaget av Din Webbpartner.
      </footer>
    </div>
  );
}

export default PreviewRenderer;
