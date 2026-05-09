import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ArrowLeft, ArrowRight, Check, ExternalLink, Smartphone, Monitor } from "lucide-react";
import { PORTFOLIO_PROJECTS } from "./index";

export const Route = createFileRoute("/portfolio/$slug")({
  head: ({ params }) => {
    const p = PORTFOLIO_PROJECTS.find((x) => x.slug === params.slug);
    const title = p ? `${p.title} — Portfolio · Din Webbpartner` : "Projekt — Din Webbpartner";
    const description = p?.long ?? "Ett projekt levererat av Din Webbpartner.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        ...(p?.image ? [{ property: "og:image", content: p.image }, { name: "twitter:image", content: p.image }] : []),
      ],
    };
  },
  loader: ({ params }) => {
    const project = PORTFOLIO_PROJECTS.find((p) => p.slug === params.slug);
    if (!project) throw notFound();
    return { project };
  },
  notFoundComponent: () => (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 container mx-auto px-4 py-32 text-center">
        <h1 className="text-4xl font-semibold tracking-tight">Projektet hittades inte</h1>
        <p className="text-muted-foreground mt-3">Sidan du letar efter finns inte längre.</p>
        <Button asChild variant="hero" className="mt-8">
          <Link to="/">Tillbaka till startsidan</Link>
        </Button>
      </main>
      <SiteFooter />
    </div>
  ),
  component: ProjectPage,
});

function ProjectPage() {
  const { project } = Route.useLoaderData();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b border-border/60">
          <div className="absolute inset-0 bg-gradient-mesh -z-10" />
          <div className="absolute inset-0 grid-pattern opacity-40 -z-10" />
          <div className="container mx-auto px-4 pt-12 pb-16 md:pt-16 md:pb-20">
            <Button asChild variant="ghost" size="sm" className="mb-6">
              <Link to="/" hash="portfolio"><ArrowLeft /> Tillbaka till portfolio</Link>
            </Button>
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div>
                <Badge variant="secondary" className="rounded-full mb-4">{project.industry}</Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tighter leading-[1.05]">
                  {project.title}
                </h1>
                <p className="text-muted-foreground mt-5 text-lg leading-relaxed">{project.long}</p>
                <div className="mt-7 flex flex-wrap gap-3">
                  <Button asChild variant="hero" size="lg">
                    <Link to="/bestall">Starta liknande projekt <ArrowRight /></Link>
                  </Button>
                  <a
                    href={`https://${project.domain}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-5 py-2.5 text-sm font-medium hover:bg-muted/60 transition-smooth"
                  >
                    {project.domain} <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-6 bg-gradient-primary opacity-25 blur-3xl rounded-3xl" />
                <div className="relative rounded-3xl border border-border/60 bg-card shadow-premium overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-border/60 bg-muted/40">
                    <span className="h-3 w-3 rounded-full bg-destructive/60" />
                    <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
                    <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
                    <div className="ml-3 flex-1 max-w-md mx-auto">
                      <div className="rounded-md bg-background/80 border border-border/60 px-3 py-1 text-xs text-muted-foreground text-center">
                        {project.domain}
                      </div>
                    </div>
                  </div>
                  <div className="relative aspect-[16/10]">
                    <img src={project.image} alt={project.title} className="absolute inset-0 h-full w-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-tr ${project.accent} opacity-25 mix-blend-overlay`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="grid lg:grid-cols-3 gap-10">
            <div className="lg:col-span-1">
              <Badge variant="secondary" className="rounded-full mb-4">Funktioner</Badge>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-[1.1]">
                Vad som ingick i projektet
              </h2>
              <p className="text-muted-foreground mt-4 leading-relaxed">
                Varje projekt skräddarsys efter kundens behov. Här är funktionerna som levererades till {project.title}.
              </p>
            </div>
            <ul className="lg:col-span-2 grid sm:grid-cols-2 gap-3">
              {project.features.map((f: string) => (
                <li key={f} className="flex items-start gap-3 rounded-xl border border-border/60 bg-card p-4 shadow-soft">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                    <Check className="h-3.5 w-3.5" />
                  </span>
                  <span className="text-sm font-medium">{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Mockups */}
        <section className="bg-muted/30 border-y border-border/50">
          <div className="container mx-auto px-4 py-20 md:py-28">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <Badge variant="secondary" className="rounded-full mb-4">Design</Badge>
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter leading-[1.1]">
                Desktop & mobil
              </h2>
              <p className="text-muted-foreground mt-4">Sidan är optimerad för alla skärmstorlekar.</p>
            </div>
            <div className="grid lg:grid-cols-3 gap-8 items-end">
              {/* Desktop */}
              <div className="lg:col-span-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3"><Monitor className="h-4 w-4" /> Desktop</div>
                <div className="rounded-2xl border border-border/60 bg-card shadow-premium overflow-hidden">
                  <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/60 bg-muted/40">
                    <span className="h-2.5 w-2.5 rounded-full bg-destructive/60" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/70" />
                  </div>
                  <div className="relative aspect-[16/10]">
                    <img src={project.image} alt={`${project.title} desktop`} className="absolute inset-0 h-full w-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-tr ${project.accent} opacity-20 mix-blend-overlay`} />
                  </div>
                </div>
              </div>
              {/* Mobile */}
              <div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-3"><Smartphone className="h-4 w-4" /> Mobil</div>
                <div className="mx-auto max-w-[260px] rounded-[2rem] border-[6px] border-foreground/90 bg-foreground/90 shadow-premium overflow-hidden">
                  <div className="relative aspect-[9/19] bg-card">
                    <img src={project.image} alt={`${project.title} mobil`} className="absolute inset-0 h-full w-full object-cover" />
                    <div className={`absolute inset-0 bg-gradient-to-tr ${project.accent} opacity-20 mix-blend-overlay`} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="container mx-auto px-4 py-20 md:py-28">
          <div className="relative overflow-hidden rounded-3xl bg-ink text-ink-foreground shadow-premium">
            <div className="absolute inset-0 grid-pattern opacity-20" />
            <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[800px] rounded-full bg-gradient-primary opacity-30 blur-3xl animate-glow" />
            <div className="relative px-8 py-14 md:px-16 md:py-20 text-center">
              <h2 className="text-3xl md:text-4xl font-semibold tracking-tighter max-w-2xl mx-auto">
                Vill du ha en hemsida som denna?
              </h2>
              <p className="text-ink-foreground/70 mt-4 max-w-xl mx-auto">
                Få en kostnadsfri offert inom 24 timmar — vi bygger din hemsida på 7 dagar.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button asChild variant="hero" size="xl" className="shadow-glow">
                  <Link to="/bestall">Starta ditt projekt <ArrowRight /></Link>
                </Button>
                <Button asChild variant="outline" size="xl" className="bg-white/5 border-white/15 text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
                  <Link to="/" hash="kontakt">Kontakta oss</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
