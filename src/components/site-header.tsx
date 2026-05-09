import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/70 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-lg">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-primary shadow-soft">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </span>
          <span>Sidly</span>
        </Link>
        <nav className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
          <a href="/#tjanst" className="hover:text-foreground transition-smooth">Så fungerar det</a>
          <a href="/#portfolio" className="hover:text-foreground transition-smooth">Portfolio</a>
          <a href="/#priser" className="hover:text-foreground transition-smooth">Priser</a>
          <a href="/#faq" className="hover:text-foreground transition-smooth">FAQ</a>
          <Link to="/admin" className="hover:text-foreground transition-smooth">Admin</Link>
        </nav>
        <Button asChild variant="hero" size="sm">
          <Link to="/bestall">Kom igång</Link>
        </Button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="border-t border-border/50 bg-background">
      <div className="container mx-auto px-4 py-10 text-sm text-muted-foreground flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-primary">
            <Sparkles className="h-3 w-3 text-primary-foreground" />
          </span>
          <span>© {new Date().getFullYear()} Sidly. Alla rättigheter förbehållna.</span>
        </div>
        <div className="flex gap-6">
          <a href="/#kontakt" className="hover:text-foreground transition-smooth">Kontakt</a>
          <a href="/#priser" className="hover:text-foreground transition-smooth">Priser</a>
          <Link to="/bestall" className="hover:text-foreground transition-smooth">Beställ</Link>
        </div>
      </div>
    </footer>
  );
}
