import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import {
  ArrowRight,
  Check,
  Upload,
  Palette,
  Rocket,
  Shield,
  Smartphone,
  Search,
  HeartHandshake,
  Star,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Sidly — Få en professionell hemsida snabbt och enkelt" },
      {
        name: "description",
        content:
          "Vi bygger moderna, mobilanpassade hemsidor åt små företag och privatpersoner. Ladda upp ditt material — vi gör resten.",
      },
      { property: "og:title", content: "Sidly — Hemsidor som känns proffsiga" },
      {
        property: "og:description",
        content:
          "Beställ din hemsida på 5 minuter. Vi designar, bygger och publicerar åt dig.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <OmOss />
        <SaFungerar />
        <Portfolio />
        <Priser />
        <Recensioner />
        <FAQ />
        <Kontakt />
      </main>
      <SiteFooter />
    </div>
  );
}

function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-hero">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-20 left-1/4 h-72 w-72 rounded-full bg-primary/30 blur-3xl animate-glow" />
        <div className="absolute top-40 right-1/4 h-72 w-72 rounded-full bg-primary-glow/30 blur-3xl animate-glow" style={{ animationDelay: "2s" }} />
      </div>
      <div className="container mx-auto px-4 py-24 md:py-32 text-center">
        <Badge variant="secondary" className="mb-6 animate-fade-up rounded-full px-4 py-1.5">
          <Sparkle /> Nu med leverans inom 7 dagar
        </Badge>
        <h1 className="animate-fade-up text-4xl md:text-6xl lg:text-7xl font-semibold tracking-tight max-w-4xl mx-auto" style={{ animationDelay: "0.1s" }}>
          Få en <span className="text-gradient-primary">professionell hemsida</span> snabbt och enkelt
        </h1>
        <p className="animate-fade-up mt-6 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto" style={{ animationDelay: "0.2s" }}>
          Ladda upp dina bilder, företagsinformation och färger — vi bygger hemsidan åt dig.
        </p>
        <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.3s" }}>
          <Button asChild variant="hero" size="xl">
            <Link to="/bestall">
              Kom igång <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl">
            <a href="#priser">Se priser</a>
          </Button>
        </div>
        <div className="animate-fade-up mt-10 flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground" style={{ animationDelay: "0.4s" }}>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Klart inom 7 dagar</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Mobilanpassad</span>
          <span className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Inga tekniska kunskaper krävs</span>
        </div>
      </div>
    </section>
  );
}

function Sparkle() {
  return <span className="mr-2 inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />;
}

function SocialProof() {
  return (
    <section className="border-y border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-8 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          ["120+", "Hemsidor levererade"],
          ["4.9/5", "Snittbetyg från kunder"],
          ["7 dagar", "Snabb leverans"],
          ["100%", "Nöjd-kund-garanti"],
        ].map(([value, label]) => (
          <div key={label}>
            <div className="text-2xl md:text-3xl font-semibold text-gradient-primary">{value}</div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OmOss() {
  return (
    <section id="om" className="container mx-auto px-4 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-12 items-center">
        <div>
          <Badge variant="secondary" className="rounded-full mb-4">Om oss</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">
            Hemsidor som känns lika proffsiga som de stora — utan krångel.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Vi är ett litet team som älskar att hjälpa företag och privatpersoner komma igång på nätet.
            Du behöver inte kunna något om kod eller design — fyll i formuläret, ladda upp ditt material,
            så bygger vi en modern hemsida som du kan vara stolt över.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {[
              { icon: Shield, label: "Trygg leverans" },
              { icon: Smartphone, label: "Mobilanpassad" },
              { icon: Search, label: "Bra på Google" },
              { icon: HeartHandshake, label: "Personlig support" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-4 transition-smooth hover:shadow-soft hover:-translate-y-0.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Icon className="h-4 w-4" />
                </span>
                <span className="text-sm font-medium">{label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="relative animate-float">
          <div className="absolute -inset-4 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
          <div className="relative rounded-3xl border border-border/60 bg-card shadow-elegant p-6">
            <div className="flex gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-destructive/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
            </div>
            <div className="rounded-xl bg-gradient-hero p-6 border border-border/40">
              <div className="h-3 w-32 rounded bg-foreground/80 mb-3" />
              <div className="h-2 w-48 rounded bg-muted-foreground/40 mb-2" />
              <div className="h-2 w-40 rounded bg-muted-foreground/40 mb-6" />
              <div className="flex gap-2">
                <div className="h-8 w-24 rounded-lg bg-gradient-primary" />
                <div className="h-8 w-24 rounded-lg border border-border" />
              </div>
              <div className="mt-6 grid grid-cols-3 gap-2">
                <div className="aspect-square rounded-lg bg-muted" />
                <div className="aspect-square rounded-lg bg-muted" />
                <div className="aspect-square rounded-lg bg-muted" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SaFungerar() {
  const steps = [
    { icon: Upload, title: "1. Fyll i formuläret", text: "Berätta om ditt företag, ladda upp bilder och välj färger. Tar bara några minuter." },
    { icon: Palette, title: "2. Vi designar", text: "Vårt team bygger en modern hemsida anpassad efter ditt material och din stil." },
    { icon: Rocket, title: "3. Publicera & klart", text: "Du får en länk att granska. När du är nöjd publicerar vi sidan och du är igång." },
  ];
  return (
    <section id="tjanst" className="bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="rounded-full mb-4">Så fungerar det</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Från beställning till färdig hemsida — på 7 dagar</h2>
          <p className="text-muted-foreground mt-4">Tre enkla steg. Vi sköter resten.</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <Card key={title} className="border-border/60 transition-smooth hover:shadow-elegant hover:-translate-y-1 relative overflow-hidden">
              <div className="absolute top-0 right-0 text-7xl font-bold text-primary/5 leading-none p-4">{i + 1}</div>
              <CardHeader>
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-soft mb-3">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <CardTitle className="text-xl">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

function Portfolio() {
  const items = [
    { title: "Café Lyckan", tag: "Restaurang", grad: "from-amber-400/40 to-rose-400/40" },
    { title: "NorrBygg AB", tag: "Hantverkare", grad: "from-sky-400/40 to-indigo-500/40" },
    { title: "Yoga med Lina", tag: "Privatperson", grad: "from-emerald-400/40 to-teal-500/40" },
    { title: "Klippoteket", tag: "Frisör", grad: "from-pink-400/40 to-purple-500/40" },
    { title: "Konsult Eriksson", tag: "Konsult", grad: "from-blue-500/40 to-cyan-400/40" },
    { title: "Hundpensionatet", tag: "Tjänst", grad: "from-orange-400/40 to-red-400/40" },
  ];
  return (
    <section id="portfolio" className="container mx-auto px-4 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Badge variant="secondary" className="rounded-full mb-4">Portfolio</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Några exempel på vad vi byggt</h2>
        <p className="text-muted-foreground mt-4">Alla hemsidor är skräddarsydda efter kundens stil och behov.</p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((it) => (
          <div key={it.title} className="group rounded-2xl border border-border/60 overflow-hidden bg-card transition-smooth hover:shadow-elegant hover:-translate-y-1">
            <div className={`aspect-[4/3] bg-gradient-to-br ${it.grad} relative overflow-hidden`}>
              <div className="absolute inset-6 rounded-xl bg-background/80 backdrop-blur-sm border border-border/60 p-4 flex flex-col">
                <div className="h-2 w-16 rounded bg-foreground/70 mb-2" />
                <div className="h-1.5 w-24 rounded bg-muted-foreground/40 mb-1" />
                <div className="h-1.5 w-20 rounded bg-muted-foreground/40" />
                <div className="mt-auto flex gap-1.5">
                  <div className="h-5 w-12 rounded-md bg-foreground/80" />
                  <div className="h-5 w-12 rounded-md border border-border" />
                </div>
              </div>
            </div>
            <div className="p-5 flex items-center justify-between">
              <div>
                <div className="font-medium">{it.title}</div>
                <div className="text-sm text-muted-foreground">{it.tag}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-smooth" />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Priser() {
  return (
    <section id="priser" className="bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 py-20 md:py-28">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="rounded-full mb-4">Priser</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Tydliga priser, inga överraskningar</h2>
          <p className="text-muted-foreground mt-4">En engångskostnad för hemsidan, sedan ett enkelt månadspris för hosting och support.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          <Card className="border-border/60 relative">
            <CardHeader>
              <div className="text-sm font-medium text-muted-foreground">Engångspris</div>
              <CardTitle className="text-2xl">Hemsida</CardTitle>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">499</span>
                <span className="text-muted-foreground">USD</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Engångskostnad. Hemsidan är din.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {["Modern hemsida","Mobilanpassad design","Kontaktformulär","Grundläggande SEO","Snabb leverans","Hjälp att komma igång"].map(f => (
                  <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full mt-6" variant="outline" size="lg">
                <Link to="/bestall">Beställ hemsida</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-primary/40 relative shadow-elegant bg-gradient-to-b from-primary/5 to-transparent">
            <Badge className="absolute -top-3 left-6 bg-gradient-primary text-primary-foreground border-0">Populärt val</Badge>
            <CardHeader>
              <div className="text-sm font-medium text-muted-foreground">Löpande</div>
              <CardTitle className="text-2xl">Support & Hosting</CardTitle>
              <div className="mt-3 flex items-baseline gap-1">
                <span className="text-4xl font-semibold">39.90</span>
                <span className="text-muted-foreground">USD/mån</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">Säg upp när du vill.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {["Hosting av hemsidan","Mindre ändringar","Byta adress","Byta telefonnummer","Byta e-postadress","Enkel support och underhåll"].map(f => (
                  <li key={f} className="flex items-start gap-2"><Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />{f}</li>
                ))}
              </ul>
              <Button asChild className="w-full mt-6" variant="hero" size="lg">
                <Link to="/bestall">Lägg till support</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
        <p className="text-center text-sm text-muted-foreground mt-8 max-w-2xl mx-auto">
          Större ändringar, ny design eller nya funktioner räknas som en ny hemsida och debiteras separat.
        </p>
      </div>
    </section>
  );
}

function Recensioner() {
  const items = [
    { name: "Anna L.", role: "Ägare, Café Lyckan", text: "Otroligt smidigt. Jag laddade upp några bilder och fick en hemsida på en vecka som ser proffsig ut." },
    { name: "Markus B.", role: "NorrBygg AB", text: "Behövde inte göra något krångligt. De fixade allt och nu ringer kunder via hemsidan varje vecka." },
    { name: "Lina S.", role: "Yogainstruktör", text: "Älskar designen. Det känns som en riktigt dyr hemsida — men priset var helt okej." },
  ];
  return (
    <section className="container mx-auto px-4 py-20 md:py-28">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Badge variant="secondary" className="rounded-full mb-4">Recensioner</Badge>
        <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Kunder som litat på oss</h2>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        {items.map((r) => (
          <Card key={r.name} className="border-border/60 transition-smooth hover:shadow-soft">
            <CardContent className="pt-6">
              <div className="flex gap-0.5 mb-3 text-primary">
                {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
              </div>
              <p className="text-foreground">"{r.text}"</p>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                  {r.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-medium">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.role}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function FAQ() {
  const faqs = [
    ["Hur lång tid tar det att få min hemsida?", "Normalt levererar vi inom 7 dagar från att vi mottagit ditt material. Ibland snabbare."],
    ["Vad händer om jag vill ändra något senare?", "Mindre ändringar (text, bilder, kontaktuppgifter) ingår i ditt månadsabonnemang. Större ändringar offereras separat."],
    ["Behöver jag kunna något tekniskt?", "Nej. Du fyller bara i formuläret och laddar upp dina bilder. Vi sköter allt det tekniska."],
    ["Får jag äga hemsidan?", "Ja. Engångskostnaden gör att hemsidan är din. Månadsavgiften täcker bara hosting och löpande support."],
    ["Vad ingår i SEO?", "Grundläggande optimering: titlar, beskrivningar, struktur och hastighet — så att Google hittar dig."],
  ];
  return (
    <section id="faq" className="bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 py-20 md:py-28 max-w-3xl">
        <div className="text-center mb-12">
          <Badge variant="secondary" className="rounded-full mb-4">Vanliga frågor</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight">Bra att veta innan du beställer</h2>
        </div>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map(([q, a], i) => (
            <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
              <AccordionTrigger className="text-left text-base font-medium">{q}</AccordionTrigger>
              <AccordionContent className="text-muted-foreground">{a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}

function Kontakt() {
  return (
    <section id="kontakt" className="container mx-auto px-4 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-10 items-start">
        <div>
          <Badge variant="secondary" className="rounded-full mb-4">Kontakt</Badge>
          <h2 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4">Har du frågor? Vi finns här.</h2>
          <p className="text-muted-foreground text-lg">
            Skicka ett meddelande så återkommer vi inom 24 timmar. Eller hoppa direkt till beställningen.
          </p>
          <div className="mt-8 space-y-4 text-sm">
            <div className="flex items-center gap-3"><Mail className="h-4 w-4 text-primary" /> hej@sidly.se</div>
            <div className="flex items-center gap-3"><Phone className="h-4 w-4 text-primary" /> +46 70 123 45 67</div>
            <div className="flex items-center gap-3"><MapPin className="h-4 w-4 text-primary" /> Stockholm, Sverige</div>
          </div>
          <Button asChild variant="hero" size="lg" className="mt-8">
            <Link to="/bestall">Starta din beställning <ArrowRight /></Link>
          </Button>
        </div>
        <Card className="border-border/60 shadow-soft">
          <CardContent className="pt-6">
            <form
              className="space-y-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast.success("Tack! Vi hör av oss snart.");
                (e.target as HTMLFormElement).reset();
              }}
            >
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium">Namn</label>
                  <Input required className="mt-1" placeholder="Ditt namn" />
                </div>
                <div>
                  <label className="text-sm font-medium">E-post</label>
                  <Input required type="email" className="mt-1" placeholder="din@epost.se" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Meddelande</label>
                <Textarea required rows={5} className="mt-1" placeholder="Hur kan vi hjälpa dig?" />
              </div>
              <Button type="submit" className="w-full" size="lg">Skicka meddelande</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
