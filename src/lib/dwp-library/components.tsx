import { useState } from "react";
import type { Img, Site } from "./types";

const Wrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`mx-auto w-full max-w-6xl px-5 md:px-8 ${className}`}>{children}</div>
);
const H2 = ({ children }: { children: React.ReactNode }) => (
  <h2 className="dwp-display mb-10 text-4xl md:text-5xl">{children}</h2>
);
const Btn = ({ children, ghost }: { children: React.ReactNode; ghost?: boolean }) => (
  <a href="#kontakt" className={ghost ? "dwp-btn-ghost" : "dwp-btn"}>{children}</a>
);
const Demo = ({ label = "Exempel" }: { label?: string }) => <span className="dwp-example">{label}</span>;

/** Image with robust fallback: shows a tokenised gradient + alt text if the URL fails. */
export function SafeImg({ img, className = "", eager }: { img: Img; className?: string; eager?: boolean }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <div role="img" aria-label={img.alt} className={`dwp-imgfallback ${className}`}>{img.alt}</div>;
  return <img src={img.src} alt={img.alt} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} className={`object-cover ${className}`} />;
}

export function Hero({ s }: { s: Site }) {
  const h = s.hero;
  const ctas = <div className="flex flex-wrap gap-3"><Btn>{h.cta}</Btn>{h.secondary && <Btn ghost>{h.secondary}</Btn>}</div>;
  switch (h.variant) {
    case "editorial":
      return (
        <section className="grid min-h-[85vh] md:grid-cols-2">
          <div className="flex flex-col justify-center gap-6 px-6 py-16 md:px-14">
            <p className="dwp-eyebrow">{h.eyebrow}</p>
            <h1 className="dwp-display text-5xl leading-[1.02] md:text-7xl">{h.title}</h1>
            <p className="max-w-md text-lg opacity-80">{h.lead}</p>{ctas}
          </div>
          <SafeImg eager img={h.image} className="h-[50vh] w-full md:h-full" />
        </section>
      );
    case "architectural":
      return (
        <section>
          <Wrap className="grid gap-8 pb-10 pt-16 md:grid-cols-[1.4fr_1fr] md:pt-24">
            <h1 className="dwp-display text-5xl leading-[0.95] md:text-8xl">{h.title}</h1>
            <div className="flex flex-col justify-end gap-6 border-l border-[var(--dwp-line)] pl-6">
              <p className="dwp-eyebrow">{h.eyebrow}</p><p className="text-lg opacity-80">{h.lead}</p>{ctas}
            </div>
          </Wrap>
          <SafeImg eager img={h.image} className="h-[45vh] w-full md:h-[60vh]" />
        </section>
      );
    case "split":
      return (
        <section><Wrap className="grid items-center gap-10 py-14 md:grid-cols-2 md:py-24">
          <div className="flex flex-col gap-6">
            <p className="dwp-eyebrow">{h.eyebrow}</p>
            <h1 className="dwp-display text-5xl leading-[1.05] md:text-6xl">{h.title}</h1>
            <p className="text-lg opacity-75">{h.lead}</p>{ctas}
            <p className="text-sm opacity-60">★★★★★ 4,9 i snitt · <Demo /></p>
          </div>
          <SafeImg eager img={h.image} className="aspect-[4/5] w-full rounded-[calc(var(--dwp-radius)*2)]" />
        </Wrap></section>
      );
    case "bold":
      return (
        <section className="border-b-2 border-[var(--dwp-line)]">
          <Wrap className="py-14 md:py-20">
            <p className="dwp-eyebrow mb-6">{h.eyebrow}</p>
            <h1 className="dwp-display text-5xl uppercase leading-[1] md:text-[8rem]">{h.title}</h1>
            <div className="mt-10 grid gap-8 md:grid-cols-[1fr_1.3fr]">
              <div className="flex flex-col gap-6"><p className="text-lg">{h.lead}</p>{ctas}</div>
              <SafeImg eager img={h.image} className="aspect-[16/9] w-full border-2 border-[var(--dwp-line)]" />
            </div>
          </Wrap>
        </section>
      );
    default:
      return (
        <section className="relative flex min-h-[min(90vh,760px)] items-end overflow-hidden">
          <SafeImg eager img={h.image} className="absolute inset-0 h-full w-full" />
          <div className="dwp-scrim absolute inset-0" />
          <Wrap className="relative pb-16 md:pb-24">
            <p className="dwp-eyebrow mb-5">{h.eyebrow}</p>
            <h1 className="dwp-display max-w-3xl text-6xl leading-none md:text-8xl">{h.title}</h1>
            <p className="mb-8 mt-6 max-w-xl text-lg opacity-85">{h.lead}</p>{ctas}
          </Wrap>
        </section>
      );
  }
}

export function Services({ s }: { s: Site }) {
  return (
    <section className="py-20 md:py-28"><Wrap>
      <H2>{s.services.heading}</H2>
      <div className="grid gap-6 md:grid-cols-3">
        {s.services.items.map((x) => (
          <article key={x.title} className="dwp-card overflow-hidden">
            <SafeImg img={x.image} className="aspect-[4/3] w-full" />
            <div className="p-6"><h3 className="dwp-display text-2xl">{x.title}</h3><p className="mt-2 opacity-75">{x.text}</p></div>
          </article>
        ))}
      </div>
    </Wrap></section>
  );
}

/** Archetype-specific conversion section. Quote-led industries never show price lists. */
export function Offer({ s }: { s: Site }) {
  const o = s.offer;
  const shell = (children: React.ReactNode, wide = true) => (
    <section className="bg-[var(--dwp-surface)] py-20 md:py-28"><Wrap className={wide ? "" : "max-w-3xl"}><H2>{o.heading}</H2>{children}</Wrap></section>
  );
  switch (o.kind) {
    case "quote":
      return shell(<>
        <div className="grid gap-6 md:grid-cols-3">
          {o.projects.map((p) => (
            <figure key={p.title}>
              <SafeImg img={p.image} className="aspect-[3/4] w-full" />
              <figcaption className="mt-3 flex justify-between gap-3 border-t border-[var(--dwp-line)] pt-3">
                <span className="font-semibold">{p.title} <Demo /></span><span className="text-right text-sm opacity-60">{p.meta}</span>
              </figcaption>
            </figure>
          ))}
        </div>
        <ul className="mt-12 flex flex-wrap gap-3">{o.credentials.map((c) => <li key={c} className="dwp-btn-ghost text-sm">✓ {c}</li>)}</ul>
        <div className="mt-10"><Btn>{s.hero.cta}</Btn></div>
      </>);
    case "appointment":
      return shell(<>
        <ul className="divide-y divide-[var(--dwp-line)]">
          {o.rows.map((r) => (
            <li key={r.name} className="flex items-baseline justify-between gap-6 py-4">
              <div><p className="font-semibold">{r.name}</p>{r.note && <p className="text-sm opacity-60">{r.note}</p>}</div>
              <span className="whitespace-nowrap font-semibold text-[var(--dwp-accent)]">{r.price}</span>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex items-center justify-between gap-4"><span className="dwp-badge">Demopriser</span><Btn>{s.hero.cta}</Btn></div>
      </>, false);
    case "package":
      return shell(<>
        <div className="grid gap-6 md:grid-cols-3">
          {o.tiers.map((p) => (
            <div key={p.name} className={`dwp-card p-8 ${p.featured ? "dwp-featured" : ""}`}>
              <p className="dwp-eyebrow">{p.name}</p>
              <p className="dwp-display mt-3 text-4xl">{p.price}<span className="text-base opacity-60"> {o.unit}</span></p>
              <ul className="mt-6 space-y-2 opacity-80">{p.features.map((f) => <li key={f}>— {f}</li>)}</ul>
              <div className="mt-8"><Btn ghost={!p.featured}>{s.hero.cta}</Btn></div>
            </div>
          ))}
        </div>
        <p className="mt-6"><span className="dwp-badge">Demopriser · Exempel</span></p>
      </>);
    case "product":
      return shell(<>
        <div className={`grid gap-6 ${o.items.some((i) => i.image) ? "grid-cols-2 md:grid-cols-4" : "md:grid-cols-2"}`}>
          {o.items.map((m) => m.image ? (
            <article key={m.name} className="dwp-card overflow-hidden">
              <SafeImg img={m.image} className="aspect-square w-full" />
              <div className="p-4"><p className="font-semibold">{m.name}</p><p className="text-sm opacity-60">{m.desc}</p>
                <p className="mt-2 font-semibold text-[var(--dwp-accent)]">{m.price}</p></div>
            </article>
          ) : (
            <div key={m.name} className="flex items-baseline justify-between gap-4 border-b border-[var(--dwp-line)] pb-4">
              <div><p className="dwp-display text-2xl">{m.name}</p><p className="opacity-70">{m.desc}</p></div>
              <span className="whitespace-nowrap font-semibold text-[var(--dwp-accent)]">{m.price}</span>
            </div>
          ))}
        </div>
        <p className="mt-6"><span className="dwp-badge">Demopriser · Exempel</span></p>
      </>);
    case "property":
      return shell(
        <div className="grid gap-6 md:grid-cols-3">
          {o.listings.map((l) => (
            <article key={l.title} className="dwp-card overflow-hidden">
              <div className="relative"><SafeImg img={l.image} className="aspect-[4/3] w-full" />
                <span className="dwp-btn absolute left-3 top-3 !px-3 !py-1 text-xs">{l.status}</span></div>
              <div className="p-6"><h3 className="dwp-display text-2xl">{l.title}</h3><p className="mt-1 opacity-70">{l.meta}</p>
                <p className="mt-4 flex justify-between font-semibold"><span>{l.price}</span><Demo /></p></div>
            </article>
          ))}
        </div>
      );
  }
}

export function References({ s }: { s: Site }) {
  return (
    <section className="border-y border-[var(--dwp-line)] py-20"><Wrap className="grid gap-10 md:grid-cols-2">
      {s.references.map((r) => (
        <blockquote key={r.author}>
          <p className="dwp-display text-3xl leading-snug">“{r.quote}”</p>
          <footer className="mt-4 text-sm opacity-70">{r.author} <Demo /></footer>
        </blockquote>
      ))}
    </Wrap></section>
  );
}

export function Contact({ s }: { s: Site }) {
  const c = s.contact;
  return (
    <section id="kontakt" className="py-20 md:py-28"><Wrap className="grid gap-10 md:grid-cols-2">
      <div><H2>{c.heading}</H2><p className="text-lg opacity-80">{c.text}</p>
        <p className="mt-6">{c.phone}<br /><span className="opacity-70">{c.address}</span></p></div>
      <form className="dwp-card grid gap-4 p-8" onSubmit={(e) => e.preventDefault()}>
        <input className="dwp-input" placeholder="Namn" aria-label="Namn" />
        <input className="dwp-input" placeholder="E-post eller telefon" aria-label="E-post eller telefon" />
        <textarea className="dwp-input min-h-28" placeholder="Meddelande" aria-label="Meddelande" />
        <button className="dwp-btn justify-center">{s.hero.cta}</button>
      </form>
    </Wrap></section>
  );
}

/** Renders a full site from a Site record. */
export function DwpPage({ site: s }: { site: Site }) {
  return (
    <div data-dwp-theme={s.theme} className="dwp-root" style={s.accent ? ({ "--dwp-accent": s.accent } as React.CSSProperties) : undefined}>
      <header className="dwp-header sticky top-0 z-20"><Wrap className="flex h-16 items-center justify-between gap-4">
        <span className="dwp-display truncate text-xl">{s.brand}</span><Btn>{s.hero.cta}</Btn>
      </Wrap></header>
      <Hero s={s} /><Services s={s} /><Offer s={s} /><References s={s} /><Contact s={s} />
      <footer className="py-10 text-center text-sm opacity-60">© {s.brand} · Exempelsajt – alla uppgifter är fiktiva</footer>
    </div>
  );
}