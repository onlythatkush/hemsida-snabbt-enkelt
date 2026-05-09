import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  
  MapPin,
  Zap,
  ServerCog,
  
  HeadphonesIcon,
  
  Lock,
  Award,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Din Webbpartner — Moderna hemsidor som säljer" },
      {
        name: "description",
        content:
          "Vi bygger snabba, snygga och mobilanpassade hemsidor åt företag som vill se professionella ut online. Färdig hemsida från 6 999 kr.",
      },
      { property: "og:title", content: "Din Webbpartner — Moderna hemsidor som säljer" },
      {
        property: "og:description",
        content:
          "Snabba, snygga och mobilanpassade hemsidor för företag. Från 6 999 kr — eller delbetala från 249 kr/mån.",
      },
    ],
  }),
  component: Index,
});

type Currency = "SEK" | "EUR";

function Index() {
  const [currency, setCurrency] = useState<Currency>("SEK");
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <Hero />
        <SocialProof />
        <OmOss />
        <SaFungerar />
        <Ownership />
        <VadIngar />
        <Portfolio />
        <Trust />
        <Priser currency={currency} setCurrency={setCurrency} />
        <Abonnemang currency={currency} />
        <Recensioner />
        <FAQ />
        <Kontakt />
        <CTA />
      </main>
      <SiteFooter />
    </div>
  );
}

/* ----------------------- HERO ----------------------- */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      {/* Cinematic Stockholm skyline at night */}
      <div className="absolute inset-0 -z-20 overflow-hidden">
        <img
          src="https://images.unsplash.com/photo-1509356843151-3e7d96241e11?auto=format&fit=crop&w=2400&q=80"
          alt="Stockholms skyline på natten"
          className="absolute inset-0 h-full w-full object-cover opacity-40 animate-city-pan will-change-transform"
        />
        {/* Layered gradients for cinematic depth */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/55 to-black" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_70%_50%_at_50%_0%,oklch(0.7_0.19_55_/_0.28),transparent_70%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_80%_20%,oklch(0.82_0.16_80_/_0.22),transparent_70%)]" />
      </div>
      {/* Subtle twinkling lights */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-[18%] left-[12%] h-1.5 w-1.5 rounded-full bg-amber-300 animate-twinkle shadow-[0_0_12px_2px_oklch(0.85_0.16_80_/_0.7)]" />
        <div className="absolute top-[34%] left-[28%] h-1 w-1 rounded-full bg-orange-300 animate-twinkle shadow-[0_0_10px_2px_oklch(0.78_0.18_60_/_0.7)]" style={{ animationDelay: "1.2s" }} />
        <div className="absolute top-[24%] right-[18%] h-1.5 w-1.5 rounded-full bg-amber-200 animate-twinkle shadow-[0_0_14px_3px_oklch(0.88_0.14_85_/_0.7)]" style={{ animationDelay: "2.4s" }} />
        <div className="absolute top-[50%] right-[32%] h-1 w-1 rounded-full bg-amber-300 animate-twinkle shadow-[0_0_10px_2px_oklch(0.85_0.16_80_/_0.7)]" style={{ animationDelay: "0.6s" }} />
        <div className="absolute top-[46%] left-[44%] h-1 w-1 rounded-full bg-orange-200 animate-twinkle shadow-[0_0_8px_2px_oklch(0.82_0.16_70_/_0.6)]" style={{ animationDelay: "3s" }} />
      </div>

      <div className="container relative mx-auto px-4 pt-20 pb-24 md:pt-28 md:pb-32 text-center">
        <div className="animate-fade-up inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium bg-white/5 border border-white/10 backdrop-blur">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
          </span>
          Tar emot nya projekt — leverans inom 7 dagar
        </div>

        <h1 className="animate-fade-up mt-7 text-5xl md:text-6xl lg:text-7xl font-semibold tracking-tighter max-w-5xl mx-auto leading-[1.05]" style={{ animationDelay: "0.1s" }}>
          Din webbpartner för{" "}
          <span className="text-gradient-primary">moderna hemsidor</span>
          <br className="hidden sm:block" />
          som säljer
        </h1>

        <p className="animate-fade-up mt-8 text-lg md:text-xl text-ink-foreground/75 max-w-2xl mx-auto leading-relaxed" style={{ animationDelay: "0.2s" }}>
          Professionella hemsidor för företag som vill synas bättre, skapa förtroende och få fler kunder online.
        </p>

        <div className="animate-fade-up mt-10 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.3s" }}>
          <Button asChild variant="hero" size="xl" className="shadow-glow">
            <Link to="/bestall">
              Starta ditt projekt <ArrowRight className="ml-1" />
            </Link>
          </Button>
          <Button asChild variant="outline" size="xl" className="bg-white/5 border-white/15 text-ink-foreground hover:bg-white/10 hover:text-ink-foreground backdrop-blur">
            <a href="#portfolio">Se portfolio</a>
          </Button>
        </div>

        {/* Floating trust badges */}
        <div className="animate-fade-up mt-14 flex flex-wrap justify-center gap-3" style={{ animationDelay: "0.4s" }}>
          {[
            { icon: Zap, label: "Klar inom 7 dagar" },
            { icon: Smartphone, label: "Mobilanpassad" },
            { icon: Search, label: "SEO-optimerad" },
            { icon: HeadphonesIcon, label: "Full support" },
          ].map(({ icon: Icon, label }, i) => (
            <div
              key={label}
              className="rounded-full px-4 py-2.5 text-sm flex items-center gap-2 shadow-soft animate-float bg-white/5 border border-white/10 backdrop-blur"
              style={{ animationDelay: `${i * 0.4}s` }}
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gradient-primary">
                <Icon className="h-3 w-3 text-primary-foreground" />
              </span>
              <span className="font-medium">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SocialProof() {
  return (
    <section className="border-y border-border/50 bg-muted/30">
      <div className="container mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
        {[
          ["120+", "Hemsidor levererade"],
          ["4.9/5", "Snittbetyg från kunder"],
          ["7 dagar", "Snabb leverans"],
          ["100%", "Nöjd-kund-garanti"],
        ].map(([value, label]) => (
          <div key={label}>
            <div className="text-3xl md:text-4xl font-semibold text-gradient-primary tracking-tight">{value}</div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">{label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

function OmOss() {
  return (
    <section id="om" className="container mx-auto px-4 py-24 md:py-32">
      <div className="grid md:grid-cols-2 gap-16 items-center">
        <div>
          <Badge variant="secondary" className="rounded-full mb-4">Om oss</Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter mb-6 leading-[1.1]">
            En premium webbyrå — utan premiumkrångel.
          </h2>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Vi är ett litet, drivet team som hjälper svenska företag se proffsiga ut på nätet.
            Du behöver inte kunna något om kod eller design — vi sköter allt från första skiss till
            publicering, hosting och löpande underhåll.
          </p>
          <div className="mt-8 grid grid-cols-2 gap-3">
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
          <div className="absolute -inset-8 bg-gradient-primary opacity-20 blur-3xl rounded-3xl" />
          <div className="relative rounded-3xl border border-border/60 bg-card shadow-premium p-6">
            <div className="flex gap-2 mb-4">
              <span className="h-3 w-3 rounded-full bg-destructive/60" />
              <span className="h-3 w-3 rounded-full bg-yellow-400/70" />
              <span className="h-3 w-3 rounded-full bg-emerald-400/70" />
            </div>
            <div className="rounded-2xl bg-gradient-mesh p-6 border border-border/40 relative overflow-hidden">
              <div className="absolute inset-0 grid-pattern opacity-30" />
              <div className="relative">
                <div className="h-3 w-32 rounded bg-foreground/80 mb-3" />
                <div className="h-2 w-48 rounded bg-muted-foreground/40 mb-2" />
                <div className="h-2 w-40 rounded bg-muted-foreground/40 mb-6" />
                <div className="flex gap-2 mb-6">
                  <div className="h-8 w-24 rounded-lg bg-gradient-primary shadow-soft" />
                  <div className="h-8 w-24 rounded-lg border border-border bg-background/60" />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-primary/30 to-primary-glow/30" />
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-rose-400/30 to-amber-400/30" />
                  <div className="aspect-square rounded-lg bg-gradient-to-br from-emerald-400/30 to-cyan-400/30" />
                </div>
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
    { icon: Upload, title: "1. Du skickar material", text: "Bilder, text, logotyp och dina önskemål — vi guidar dig genom hela processen." },
    { icon: Palette, title: "2. Vi designar din hemsida", text: "En unik design anpassad efter ditt företag, varumärke och målgrupp." },
    { icon: Check, title: "3. Du granskar och godkänner", text: "Du får en länk att se sidan live. Vi gör justeringar tills du är 100 % nöjd." },
    { icon: Rocket, title: "4. Vi publicerar sidan", text: "Domän, SSL och allt tekniskt ingår — vi sköter lanseringen åt dig." },
    { icon: HeartHandshake, title: "5. Support & vidareutveckling", text: "Vi finns kvar efter lansering med uppdateringar, support och löpande förbättringar." },
  ];
  return (
    <section id="tjanst" className="bg-muted/30 border-y border-border/50 relative overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="container relative mx-auto px-4 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="rounded-full mb-4">Så fungerar det</Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">
            Från första kontakt till färdig hemsida
          </h2>
          <p className="text-muted-foreground mt-5 text-lg">Fem tydliga steg. Vi guidar dig hela vägen.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {steps.map(({ icon: Icon, title, text }, i) => (
            <Card key={title} className="border-border/60 bg-card/80 backdrop-blur transition-smooth hover:shadow-elegant hover:-translate-y-2 relative overflow-hidden group">
              <div className="absolute top-0 right-0 text-7xl font-bold text-primary/5 leading-none p-3 transition-smooth group-hover:text-primary/10">{i + 1}</div>
              <CardHeader className="pb-3">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-soft mb-3">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </span>
                <CardTitle className="text-base">{title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground leading-relaxed">{text}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- OWNERSHIP ----------------------- */
function Ownership() {
  const items = [
    {
      icon: Award,
      title: "Äger jag hemsidan?",
      text: "Ja. Du äger din hemsida och allt innehåll. Vi kan överföra hela projektet till dig när som helst om du önskar — utan extra kostnad.",
    },
    {
      icon: HeadphonesIcon,
      title: "Kan ni hjälpa till med drift och support?",
      text: "Ja. Vi erbjuder löpande support, hosting, säkerhetsuppdateringar och förbättringar via våra abonnemang — från 299 kr/mån.",
    },
  ];
  return (
    <section id="agande" className="container mx-auto px-4 py-20 md:py-28">
      <div className="grid md:grid-cols-2 gap-6">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="relative rounded-3xl border border-border/60 bg-gradient-to-br from-card to-muted/40 p-8 shadow-soft transition-smooth hover:shadow-elegant hover:-translate-y-1 overflow-hidden">
            <div className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-gradient-primary opacity-10 blur-2xl" />
            <span className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary shadow-soft mb-5">
              <Icon className="h-5 w-5 text-primary-foreground" />
            </span>
            <h3 className="relative text-xl md:text-2xl font-semibold tracking-tight">{title}</h3>
            <p className="relative text-muted-foreground mt-3 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------- VAD INGÅR ----------------------- */
function VadIngar() {
  const items = [
    { icon: Palette, title: "Skräddarsydd design", text: "Unik design som matchar ditt varumärke — inte en mall." },
    { icon: Smartphone, title: "Mobilanpassad", text: "Sidan ser perfekt ut på mobil, surfplatta och dator." },
    { icon: Search, title: "SEO från start", text: "Strukturerad data, snabb laddtid och Google-optimering." },
    { icon: ServerCog, title: "Hosting & domän", text: "Vi sköter hosting, SSL och e-post — du behöver inte tänka." },
    { icon: Zap, title: "Snabb laddtid", text: "Optimerade bilder och kod — under 1 sekunds laddtid." },
    { icon: Lock, title: "GDPR & säkerhet", text: "Cookie-banner, krypterade formulär och daglig backup." },
    { icon: Mail, title: "Kontaktformulär", text: "Mail, bokning eller offertformulär — kopplat till din e-post." },
    { icon: HeadphonesIcon, title: "Personlig support", text: "Riktiga människor på svenska — alltid när du behöver." },
  ];
  return (
    <section id="ingar" className="container mx-auto px-4 py-24 md:py-32">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Badge variant="secondary" className="rounded-full mb-4">Vad ingår</Badge>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">
          Allt du behöver — i ett paket
        </h2>
        <p className="text-muted-foreground mt-5 text-lg">
          Inga dolda kostnader. Du får en komplett, färdig hemsida redo att börja generera kunder.
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {items.map(({ icon: Icon, title, text }) => (
          <div key={title} className="group rounded-2xl border border-border/60 bg-card p-6 transition-smooth hover:shadow-elegant hover:-translate-y-1">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary mb-4 transition-smooth group-hover:bg-gradient-primary group-hover:text-primary-foreground">
              <Icon className="h-5 w-5" />
            </span>
            <div className="font-semibold">{title}</div>
            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ----------------------- PORTFOLIO ----------------------- */
export const PORTFOLIO_PROJECTS = [
  {
    slug: "scandy-candy",
    title: "Scandy Candy",
    tag: "E-handel · Godismärke",
    industry: "E-handel",
    desc: "Färgstark webshop med produktfokus, prenumerationsboxar och Klarna-checkout.",
    long: "En lekfull, färgstark e-handel byggd för att maxa konvertering. Fokus på produktbilder, snabba köp och prenumerationsboxar via Klarna. Integrerad lagerhantering och nyhetsbrev.",
    image: "https://images.unsplash.com/photo-1581798459219-318e76aecc7b?auto=format&fit=crop&w=1600&q=80",
    accent: "from-rose-400 to-amber-300",
    domain: "scandycandy.se",
    features: ["Webshop med Klarna", "Prenumerationsboxar", "Produktfilter & sök", "Nyhetsbrev & kampanjer", "Mobil-först design"],
  },
  {
    slug: "lokal-restaurang",
    title: "Restaurang Klippan",
    tag: "Restaurang & café",
    industry: "Restaurang",
    desc: "Värmande, bildtung restaurangsida med digital meny och online-bordsbokning.",
    long: "En atmosfärisk restaurangsida som lyfter köket genom storformatsbilder och en stilren digital meny. Inkluderar online-bordsbokning, öppettider och presentkortsförsäljning.",
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1600&q=80",
    accent: "from-amber-500 to-orange-400",
    domain: "klippan.se",
    features: ["Online-bordsbokning", "Digital meny", "Eventkalender", "Google Maps & öppettider", "Presentkort"],
  },
  {
    slug: "byggfirma",
    title: "NorrBygg AB",
    tag: "Bygg & hantverk",
    industry: "Byggfirma",
    desc: "Förtroendeingivande byggsida med projektgalleri, certifieringar och offertformulär.",
    long: "Robust och pålitlig sida som stärker förtroendet hos både privatkunder och företag. Tydligt projektgalleri, certifieringar och ROT-information samt smidigt offertformulär.",
    image: "https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80",
    accent: "from-yellow-500 to-amber-700",
    domain: "norrbygg.se",
    features: ["Projektgalleri", "Offertformulär", "Certifieringar & ROT", "Tjänstesidor", "Recensioner från kunder"],
  },
  {
    slug: "salong-skonhet",
    title: "Salong Lykke",
    tag: "Salong & skönhet",
    industry: "Skönhet & wellness",
    desc: "Elegant salong- och wellness-sida med online-bokning och Instagram-galleri.",
    long: "En lugn och elegant designvärld som speglar varumärket. Komplett online-bokning, behandlingsmeny med priser, presentkortsköp och Instagram-feed.",
    image: "https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&w=1600&q=80",
    accent: "from-pink-300 to-rose-400",
    domain: "salonglykke.se",
    features: ["Online-bokningssystem", "Behandlingsmeny & priser", "Presentkort online", "Instagram-galleri", "Personalprofiler"],
  },
  {
    slug: "jurist-konsult",
    title: "Lindberg Juridik",
    tag: "Konsult · Juristbyrå",
    industry: "Juridik & konsult",
    desc: "Premium corporate-sida med ren typografi, teampresentation och säkert kontaktflöde.",
    long: "En sofistikerad corporate-sida som signalerar professionalism och förtroende. Fokus på typografi, fallstudier och ett krypterat kontaktflöde för känsliga ärenden.",
    image: "https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1600&q=80",
    accent: "from-slate-500 to-indigo-500",
    domain: "lindbergjuridik.se",
    features: ["Teampresentation", "Tjänsteområden", "Krypterat kontaktformulär", "Fallstudier & artiklar", "Bokning av rådgivning"],
  },
] as const;

function Portfolio() {
  return (
    <section id="portfolio" className="bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="rounded-full mb-4">Portfolio</Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">
            Hemsidor vi nyligen levererat
          </h2>
          <p className="text-muted-foreground mt-5 text-lg">
            Verkliga projekt åt verkliga företag. Varje sida är skräddarsydd efter kundens varumärke.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PORTFOLIO_PROJECTS.map((it) => (
            <article
              key={it.slug}
              className="group flex flex-col rounded-3xl border border-border/60 overflow-hidden bg-card transition-smooth hover:shadow-premium hover:-translate-y-2"
            >
              <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-1.5 px-3 py-2 bg-card/95 backdrop-blur border-b border-border/60">
                  <span className="h-2 w-2 rounded-full bg-destructive/60" />
                  <span className="h-2 w-2 rounded-full bg-yellow-400/70" />
                  <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                  <div className="ml-3 flex-1 max-w-[180px]">
                    <div className="rounded-sm bg-background/80 border border-border/60 px-2 py-0.5 text-[10px] text-muted-foreground text-center truncate">
                      {it.domain}
                    </div>
                  </div>
                </div>
                <img
                  src={it.image}
                  alt={`Hemsida för ${it.title}`}
                  loading="lazy"
                  className="absolute inset-0 h-full w-full object-cover transition-smooth group-hover:scale-[1.04]"
                />
                <div className={`absolute inset-0 bg-gradient-to-tr ${it.accent} opacity-25 mix-blend-overlay`} />
                <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3 text-white">
                  <div className="text-[10px] uppercase tracking-wider opacity-80">{it.tag}</div>
                  <div className="font-semibold text-lg leading-tight drop-shadow">{it.title}</div>
                </div>
              </div>
              <div className="flex flex-col flex-1 p-6">
                <p className="text-sm text-muted-foreground leading-relaxed flex-1">{it.desc}</p>
                <Button asChild variant="soft" size="sm" className="mt-5 self-start group/btn">
                  <Link to="/portfolio/$slug" params={{ slug: it.slug }}>
                    Se projekt
                    <ArrowRight className="h-3.5 w-3.5 transition-smooth group-hover/btn:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ----------------------- TRUST ----------------------- */
function Trust() {
  const items = [
    { icon: Award, title: "100% nöjd-kund-garanti", text: "Är du inte nöjd? Vi jobbar tills du är det — eller pengarna tillbaka." },
    { icon: HeadphonesIcon, title: "Personlig support", text: "Riktiga människor på riktig svenska. Inga supportbottar." },
    { icon: ServerCog, title: "Svensk hosting", text: "Driftad i Sverige med GDPR-säkra leverantörer." },
    { icon: Lock, title: "Säker & snabb hemsida", text: "SSL, daglig backup och under 1 sek laddtid." },
  ];
  return (
    <section className="relative overflow-hidden bg-ink text-ink-foreground">
      <div className="absolute inset-0 grid-pattern opacity-20" />
      <div className="absolute -top-20 left-1/2 -translate-x-1/2 h-96 w-[900px] rounded-full bg-gradient-primary opacity-25 blur-3xl" />
      <div className="container relative mx-auto px-4 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <Badge variant="secondary" className="rounded-full mb-4 bg-white/10 text-ink-foreground border-white/10 hover:bg-white/15">
            Trygghet
          </Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">
            Premium känsla — på riktigt.
          </h2>
          <p className="text-ink-foreground/70 mt-5 text-lg">
            Vi tar hand om allt det viktiga som inte syns. Så att du kan fokusera på din affär.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {items.map(({ icon: Icon, title, text }) => (
            <div key={title} className="relative rounded-2xl glass-dark p-6 transition-smooth hover:-translate-y-1 hover:shadow-glow">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-primary shadow-soft mb-4">
                <Icon className="h-5 w-5 text-primary-foreground" />
              </span>
              <div className="font-semibold text-lg">{title}</div>
              <p className="text-sm text-ink-foreground/70 mt-2 leading-relaxed">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------- PRISER ----------------------- */
const RATE_EUR = 0.087; // approx
function fmt(amountSek: number, c: Currency) {
  if (c === "SEK") return new Intl.NumberFormat("sv-SE").format(amountSek) + " kr";
  return "€" + new Intl.NumberFormat("sv-SE", { maximumFractionDigits: 0 }).format(Math.round(amountSek * RATE_EUR));
}

function CurrencySwitcher({ currency, setCurrency }: { currency: Currency; setCurrency: (c: Currency) => void }) {
  return (
    <div className="inline-flex items-center rounded-full border border-border bg-card p-1 shadow-soft">
      {(["SEK", "EUR"] as Currency[]).map((c) => (
        <button
          key={c}
          onClick={() => setCurrency(c)}
          className={`px-4 py-1.5 text-xs font-medium rounded-full transition-smooth ${
            currency === c ? "bg-gradient-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          {c}
        </button>
      ))}
    </div>
  );
}

function Priser({ currency, setCurrency }: { currency: Currency; setCurrency: (c: Currency) => void }) {
  const plans = [
    {
      name: "Starter",
      price: 6999,
      monthly: 249,
      desc: "Perfekt för enmansföretag och privatpersoner som vill komma igång.",
      features: ["1–3 sidor", "Mobilanpassad design", "Kontaktformulär", "Grundläggande SEO", "Klar inom 7 dagar"],
      popular: false,
    },
    {
      name: "Growth",
      price: 12999,
      monthly: 499,
      desc: "Det vanligaste valet för småföretag som vill växa via webben.",
      features: ["Upp till 7 sidor", "Anpassad design & animationer", "Bokning / formulär", "SEO + Google Business", "Premium support", "Bloggfunktion"],
      popular: true,
    },
    {
      name: "Premium",
      price: 24999,
      monthly: 999,
      desc: "För företag som vill ha en hemsida i absolut toppklass.",
      features: ["Obegränsat antal sidor", "Skräddarsydd design", "E-handel / bokningssystem", "Avancerad SEO & analytics", "Copywriting ingår", "Dedikerad projektledare"],
      popular: false,
    },
  ];
  return (
    <section id="priser" className="relative bg-muted/30 border-y border-border/50">
      <div className="absolute inset-0 grid-pattern opacity-30" />
      <div className="container relative mx-auto px-4 py-24 md:py-32">
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="rounded-full mb-4">Priser</Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">
            Tydliga priser, inga överraskningar
          </h2>
          <p className="text-muted-foreground mt-5 text-lg">
            Fast engångskostnad — eller delbetala bekvämt över 24 eller 36 månader.
          </p>
          <div className="mt-6">
            <CurrencySwitcher currency={currency} setCurrency={setCurrency} />
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {plans.map((p) => (
            <Card
              key={p.name}
              className={`relative border-border/60 transition-smooth hover:-translate-y-2 ${
                p.popular ? "shadow-premium border-primary/40 bg-gradient-to-b from-primary/5 to-transparent scale-[1.02]" : "hover:shadow-elegant"
              }`}
            >
              {p.popular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground border-0 shadow-soft">
                  Populärast
                </Badge>
              )}
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl">{p.name}</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
                <div className="mt-5 flex items-baseline gap-2">
                  <span className="text-4xl md:text-5xl font-semibold tracking-tight">{fmt(p.price, currency)}</span>
                </div>
                <div className="text-sm text-muted-foreground mt-1">
                  eller från <span className="font-medium text-foreground">{fmt(p.monthly, currency)}/mån</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                        <Check className="h-3 w-3" />
                      </span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Button asChild className="w-full mt-7" variant={p.popular ? "hero" : "outline"} size="lg">
                  <Link to="/bestall">Välj {p.name}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-12 max-w-4xl mx-auto">
          <div className="text-center text-sm font-medium text-muted-foreground mb-4">Flexibla betalalternativ</div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Engångsbetalning", value: "från 6 999 kr" },
              { label: "Delbetalning 24 mån", value: "från 349 kr/mån" },
              { label: "Delbetalning 36 mån", value: "från 249 kr/mån" },
              { label: "Support & drift", value: "från 299 kr/mån" },
            ].map((o) => (
              <div key={o.label} className="rounded-xl border border-border/60 bg-card px-4 py-3 text-center shadow-soft">
                <div className="text-xs text-muted-foreground">{o.label}</div>
                <div className="font-semibold text-sm mt-1">{o.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


/* ----------------------- ABONNEMANG ----------------------- */
function Abonnemang({ currency }: { currency: Currency }) {
  const plans = [
    {
      name: "Start",
      price: 299,
      desc: "För dig som vill ha tryggheten på plats.",
      features: ["Hosting & domän", "SSL & säkerhet", "Daglig backup", "E-post support"],
    },
    {
      name: "Growth",
      price: 599,
      desc: "Vårt populäraste abonnemang.",
      features: ["Allt i Start", "Mindre uppdateringar", "Prioriterad support", "Månatlig SEO-rapport", "Hastighetsövervakning"],
      popular: true,
    },
    {
      name: "Premium",
      price: 999,
      desc: "Komplett trygghet med AI och proaktiv optimering.",
      features: ["Allt i Growth", "AI-övervakning 24/7", "Löpande SEO-förbättringar", "Innehållsuppdateringar", "Dedikerad kontakt"],
    },
  ];
  return (
    <section id="abonnemang" className="container mx-auto px-4 py-24 md:py-32">
      <div className="text-center max-w-2xl mx-auto mb-14">
        <Badge variant="secondary" className="rounded-full mb-4">Abonnemang</Badge>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">
          Support & hosting som följer med
        </h2>
        <p className="text-muted-foreground mt-5 text-lg">
          Hemsidan stannar inte vid lansering. Välj ett abonnemang så ser vi till att den fortsätter prestera.
        </p>
      </div>
      <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {plans.map((p) => (
          <Card
            key={p.name}
            className={`relative border-border/60 transition-smooth hover:-translate-y-2 ${
              p.popular ? "shadow-premium border-primary/40 bg-gradient-to-b from-primary/5 to-transparent" : "hover:shadow-elegant"
            }`}
          >
            {p.popular && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-primary text-primary-foreground border-0 shadow-soft">
                Populärast
              </Badge>
            )}
            <CardHeader className="pb-4">
              <CardTitle className="text-2xl">{p.name}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">{p.desc}</p>
              <div className="mt-5 flex items-baseline gap-1">
                <span className="text-4xl font-semibold tracking-tight">{fmt(p.price, currency)}</span>
                <span className="text-muted-foreground text-sm">/mån</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Säg upp när du vill.</p>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary mt-0.5 shrink-0">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </li>
                ))}
              </ul>
              <Button asChild className="w-full mt-7" variant={p.popular ? "hero" : "outline"} size="lg">
                <Link to="/bestall">Välj {p.name}</Link>
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

/* ----------------------- RECENSIONER ----------------------- */
function Recensioner() {
  const items = [
    { name: "Anna L.", role: "Ägare, Café Lyckan", text: "Otroligt smidigt. Jag laddade upp några bilder och fick en hemsida på en vecka som ser proffsig ut." },
    { name: "Markus B.", role: "NorrBygg AB", text: "Behövde inte göra något krångligt. De fixade allt och nu ringer kunder via hemsidan varje vecka." },
    { name: "Lina S.", role: "Yogainstruktör", text: "Älskar designen. Det känns som en riktigt dyr hemsida — men priset var helt okej." },
  ];
  return (
    <section className="bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <Badge variant="secondary" className="rounded-full mb-4">Recensioner</Badge>
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">Kunder som litat på oss</h2>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((r) => (
            <Card key={r.name} className="border-border/60 bg-card/80 backdrop-blur transition-smooth hover:shadow-elegant hover:-translate-y-1">
              <CardContent className="pt-6">
                <div className="flex gap-0.5 mb-3 text-primary">
                  {Array.from({ length: 5 }).map((_, i) => <Star key={i} className="h-4 w-4 fill-current" />)}
                </div>
                <p className="text-foreground leading-relaxed">"{r.text}"</p>
                <div className="mt-5 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-primary flex items-center justify-center text-primary-foreground text-sm font-medium shadow-soft">
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
      </div>
    </section>
  );
}

/* ----------------------- FAQ ----------------------- */
function FAQ() {
  const faqs: [string, string][] = [
    ["Hur lång tid tar det?", "Normalt levererar vi din hemsida inom 7 dagar från att vi mottagit ditt material. För större projekt 2–3 veckor."],
    ["Kan jag delbetala?", "Ja. Vi erbjuder delbetalning över 24 eller 36 månader via vår betalningspartner. Du ser månadskostnaden direkt vid varje paket."],
    ["Hjälper ni med Google?", "Absolut. Alla hemsidor är SEO-optimerade från start. I Growth- och Premium-paketen ingår även Google Business-uppsättning."],
    ["Ingår support?", "Vi har personlig support på svenska via mejl och telefon. Med ett abonnemang får du även löpande underhåll, uppdateringar och AI-övervakning."],
    ["Kan ni uppdatera sidan åt mig senare?", "Ja, det är vad våra abonnemang är till för. Mindre ändringar (text, bilder, kontaktuppgifter) ingår — större ändringar offereras separat."],
    ["Får jag äga hemsidan?", "Ja. Engångskostnaden gör att hemsidan är din. Abonnemanget täcker bara hosting, support och löpande förbättringar."],
  ];
  return (
    <section id="faq" className="container mx-auto px-4 py-24 md:py-32 max-w-3xl">
      <div className="text-center mb-14">
        <Badge variant="secondary" className="rounded-full mb-4">Vanliga frågor</Badge>
        <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1]">Bra att veta innan du beställer</h2>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map(([q, a], i) => (
          <AccordionItem key={i} value={`item-${i}`} className="border-border/60">
            <AccordionTrigger className="text-left text-base md:text-lg font-medium">{q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

/* ----------------------- KONTAKT ----------------------- */
function Kontakt() {
  return (
    <section id="kontakt" className="bg-muted/30 border-y border-border/50">
      <div className="container mx-auto px-4 py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          <div>
            <Badge variant="secondary" className="rounded-full mb-4">Kontakt</Badge>
            <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter mb-5 leading-[1.1]">Få en kostnadsfri offert inom 24 timmar.</h2>
            <p className="text-muted-foreground text-lg leading-relaxed">
              Berätta kort om ditt projekt — vi återkommer med förslag, prisidé och tidsplan inom 24 timmar. Helt kostnadsfritt och utan förpliktelser.
            </p>
            <div className="mt-8 space-y-4 text-sm">
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><Mail className="h-4 w-4" /></span> dinwebbpartner@hotmail.com</div>
              <div className="flex items-center gap-3"><span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><MapPin className="h-4 w-4" /></span> Stockholm, Sverige</div>
            </div>
            <Button asChild variant="hero" size="lg" className="mt-8">
              <Link to="/bestall">Starta din beställning <ArrowRight /></Link>
            </Button>
          </div>
          <Card className="border-border/60 shadow-elegant bg-card/90 backdrop-blur">
            <CardContent className="pt-6">
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault();
                  toast.success("Tack! Vi hör av oss inom 24 timmar.");
                  (e.target as HTMLFormElement).reset();
                }}
              >
                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium">Namn</label>
                    <Input required className="mt-1" placeholder="Ditt namn" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Företag</label>
                    <Input className="mt-1" placeholder="Företagsnamn (valfritt)" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">E-post</label>
                    <Input required type="email" className="mt-1" placeholder="din@epost.se" />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Telefon</label>
                    <Input type="tel" className="mt-1" placeholder="+46 70 ..." />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Meddelande</label>
                  <Textarea required rows={5} className="mt-1" placeholder="Berätta kort om ditt projekt — vad behöver du hjälp med?" />
                </div>
                <Button type="submit" variant="hero" className="w-full" size="lg">Skicka meddelande</Button>
                <p className="text-xs text-muted-foreground text-center">Vi svarar inom 24 timmar — ofta samma dag.</p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

/* ----------------------- CTA ----------------------- */
function CTA() {
  return (
    <section className="container mx-auto px-4 py-24 md:py-32">
      <div className="relative overflow-hidden rounded-3xl bg-ink text-ink-foreground shadow-premium">
        <div className="absolute inset-0 grid-pattern opacity-20" />
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 h-96 w-[800px] rounded-full bg-gradient-primary opacity-30 blur-3xl animate-glow" />
        <div className="relative px-8 py-16 md:px-16 md:py-24 text-center">
          <h2 className="text-3xl md:text-5xl font-semibold tracking-tighter leading-[1.1] max-w-3xl mx-auto">
            Redo att se proffsig ut online?
          </h2>
          <p className="text-ink-foreground/70 mt-5 text-lg max-w-xl mx-auto">
            Starta din beställning idag — vi har din hemsida klar inom 7 dagar.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
            <Button asChild variant="hero" size="xl" className="shadow-glow">
              <Link to="/bestall">Kom igång <ArrowRight /></Link>
            </Button>
            <Button asChild variant="outline" size="xl" className="bg-white/5 border-white/15 text-ink-foreground hover:bg-white/10 hover:text-ink-foreground">
              <a href="#portfolio">Se portfolio</a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
