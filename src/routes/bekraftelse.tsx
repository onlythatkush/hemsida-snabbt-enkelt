import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Check, Mail, ArrowRight, Clock } from "lucide-react";

export const Route = createFileRoute("/bekraftelse")({
  validateSearch: z.object({ id: z.string().optional() }),
  head: () => ({
    meta: [{ title: "Tack för din förfrågan — Din Webbpartner" }],
  }),
  component: ConfirmPage,
});

function ConfirmPage() {
  const { id } = Route.useSearch();
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 bg-gradient-hero">
        <div className="container mx-auto px-4 py-20 max-w-2xl">
          <Card className="border-border/60 shadow-elegant text-center">
            <CardContent className="pt-10 pb-10">
              <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center shadow-elegant animate-fade-up">
                <Check className="h-8 w-8 text-primary-foreground" />
              </div>
              <h1 className="mt-6 text-3xl md:text-4xl font-semibold tracking-tight animate-fade-up" style={{ animationDelay: "0.1s" }}>
                Tack — din förfrågan är skickad!
              </h1>
              <p className="mt-3 text-muted-foreground text-lg animate-fade-up" style={{ animationDelay: "0.2s" }}>
                Vi har tagit emot dina uppgifter och hör av oss med en personlig offert.
              </p>

              <div className="mt-6 mx-auto inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-5 py-2.5 text-primary font-medium animate-fade-up" style={{ animationDelay: "0.25s" }}>
                <Clock className="h-4 w-4" />
                Svarstid: inom 24 timmar (vardagar)
              </div>

              {id && (
                <div className="mt-4 inline-block rounded-full bg-muted px-4 py-2 text-sm">
                  Referens: <span className="font-mono font-medium">{id}</span>
                </div>
              )}
              <div className="mt-8 grid sm:grid-cols-3 gap-4 text-left">
                {[
                  { t: "1. Bekräftelse", d: "Du får en kvittens på e-post inom kort." },
                  { t: "2. Offert", d: "Vi återkommer inom 24 timmar med pris och förslag." },
                  { t: "3. Vi bygger", d: "Vid godkänd offert sätter vi igång direkt." },
                ].map((s) => (
                  <div key={s.t} className="rounded-xl border border-border/60 p-4 bg-card">
                    <div className="text-sm font-semibold">{s.t}</div>
                    <div className="text-sm text-muted-foreground mt-1">{s.d}</div>
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
                <Button asChild variant="hero" size="lg">
                  <Link to="/">Tillbaka till startsidan <ArrowRight /></Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <a href="mailto:dinwebbpartner@hotmail.com"><Mail /> Kontakta oss</a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
