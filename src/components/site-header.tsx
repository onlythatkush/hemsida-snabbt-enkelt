import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles, Mail, MapPin, Instagram, Linkedin, Facebook } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full">
      <div className="absolute inset-0 bg-background/70 backdrop-blur-xl border-b border-border/60" />
      <div className="container relative mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2.5 font-semibold text-lg">
          <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
            <span className="absolute -inset-1 rounded-xl bg-gradient-primary opacity-30 blur-md -z-10" />
          </span>
          <span className="tracking-tight">Din Webbpartner<span className="text-primary">.</span></span>
        </Link>
        <nav className="hidden lg:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="/#tjanst" className="hover:text-foreground transition-smooth">Så fungerar det</a>
          <a href="/#ingar" className="hover:text-foreground transition-smooth">Vad ingår</a>
          <a href="/#portfolio" className="hover:text-foreground transition-smooth">Portfolio</a>
          <a href="/#upplagg" className="hover:text-foreground transition-smooth">Upplägg</a>
          <a href="/#kontakt" className="hover:text-foreground transition-smooth">Kontakt</a>
          <a href="/#faq" className="hover:text-foreground transition-smooth">FAQ</a>
        </nav>
        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
            <a href="/#kontakt">Kontakt</a>
          </Button>
          <Button asChild variant="hero" size="sm">
            <Link to="/bestall">Kom igång</Link>
          </Button>
        </div>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="relative bg-ink text-ink-foreground overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 h-80 w-[800px] rounded-full bg-gradient-primary opacity-20 blur-3xl" />
      <div className="container relative mx-auto px-4 py-16">
        <div className="grid md:grid-cols-4 gap-10">
          <div className="md:col-span-2">
            <Link to="/" className="flex items-center gap-2.5 font-semibold text-lg">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary shadow-soft">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </span>
              <span>Din Webbpartner<span className="text-primary-glow">.</span></span>
            </Link>
            <p className="mt-4 text-sm text-ink-foreground/70 max-w-md">
              Moderna hemsidor för företag. Vi bygger snabba, snygga och säljande hemsidor åt svenska företag och privatpersoner.
            </p>
            <div className="mt-6 flex gap-3">
              {[Instagram, Linkedin, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-smooth">
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <div className="text-sm font-semibold mb-4">Kontakt</div>
            <ul className="space-y-3 text-sm text-ink-foreground/70">
              <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> dinwebbpartner@hotmail.com</li>
              <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Stockholm, Sverige</li>
            </ul>
          </div>
          <div>
            <div className="text-sm font-semibold mb-4">Snabblänkar</div>
            <ul className="space-y-3 text-sm text-ink-foreground/70">
              <li><a href="/#tjanst" className="hover:text-ink-foreground transition-smooth">Tjänster</a></li>
              <li><a href="/#portfolio" className="hover:text-ink-foreground transition-smooth">Portfolio</a></li>
              <li><a href="/#upplagg" className="hover:text-ink-foreground transition-smooth">Upplägg</a></li>
              <li><a href="/#kontakt" className="hover:text-ink-foreground transition-smooth">Kontakt</a></li>
              <li><Link to="/bestall" className="hover:text-ink-foreground transition-smooth">Beställ hemsida</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-ink-foreground/60">
          <span>© {new Date().getFullYear()} Din Webbpartner. Alla rättigheter förbehållna.</span>
          <span>Org.nr: 559XXX-XXXX · Moms: SE559XXXXXXXX01</span>
        </div>
      </div>
    </footer>
  );
}
