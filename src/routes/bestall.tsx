import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { ArrowLeft, ArrowRight, Check, Upload, X, Info } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/bestall")({
  head: () => ({
    meta: [
      { title: "Begär offert — Din Webbpartner" },
      { name: "description", content: "Skicka in en kostnadsfri offertförfrågan — vi kontaktar dig och skickar en offert. Ingen betalning vid förfrågan." },
    ],
  }),
  component: OrderPage,
});

const schema = z.object({
  foretagsnamn: z.string().trim().min(1, "Ange företagsnamn").max(120),
  namn: z.string().trim().min(1, "Ange ditt namn").max(120),
  epost: z.string().trim().email("Ogiltig e-post").max(255),
  telefon: z.string().trim().min(4, "Ange telefonnummer").max(40),
  adress: z.string().trim().max(200).optional().or(z.literal("")),
  beskrivning: z.string().trim().min(10, "Beskriv ditt företag kort").max(2000),
  sociala: z.string().trim().max(500).optional().or(z.literal("")),
  farger: z.string().trim().max(200).optional().or(z.literal("")),
  typ: z.string().min(1, "Välj typ av hemsida"),
  extra: z.string().trim().max(2000).optional().or(z.literal("")),
  support: z.boolean(),
});

type FormData = z.infer<typeof schema>;

const initial: FormData = {
  foretagsnamn: "", namn: "", epost: "", telefon: "", adress: "",
  beskrivning: "", sociala: "", farger: "#2563eb", typ: "", extra: "", support: true,
};

const steps = ["Om dig", "Om företaget", "Stil & material", "Granska & skicka"];

function OrderPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<FormData>(initial);
  const [files, setFiles] = useState<{ name: string; size: number; progress: number }[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setData((d) => ({ ...d, [k]: v }));

  const validateStep = (): boolean => {
    const fields: (keyof FormData)[][] = [
      ["namn", "epost", "telefon"],
      ["foretagsnamn", "beskrivning"],
      ["typ"],
      [],
    ];
    const partial: Partial<FormData> = {};
    fields[step].forEach((f) => ((partial as any)[f] = data[f]));
    const subset = schema.pick(Object.fromEntries(fields[step].map((f) => [f, true])) as any);
    const result = subset.safeParse(partial);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (!validateStep()) return;
    setStep((s) => Math.min(s + 1, steps.length - 1));
  };

  const handleFiles = (selected: FileList | null) => {
    if (!selected) return;
    const arr = Array.from(selected).slice(0, 10);
    arr.forEach((f) => {
      const item = { name: f.name, size: f.size, progress: 0 };
      setFiles((prev) => [...prev, item]);
      let p = 0;
      const t = setInterval(() => {
        p += 10 + Math.random() * 25;
        setFiles((prev) =>
          prev.map((x) => (x.name === f.name ? { ...x, progress: Math.min(100, p) } : x)),
        );
        if (p >= 100) clearInterval(t);
      }, 180);
    });
  };

  const handleSubmit = async () => {
    const result = schema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1400));
    const order = {
      id: "ORD-" + Math.random().toString(36).slice(2, 8).toUpperCase(),
      ...data,
      files: files.map((f) => f.name),
      total: 499 + (data.support ? 39.9 : 0),
      datum: new Date().toISOString(),
    };
    if (typeof window !== "undefined") {
      const list = JSON.parse(localStorage.getItem("dwp-orders") || "[]");
      list.push(order);
      localStorage.setItem("dwp-orders", JSON.stringify(list));
    }
    toast.success("Förfrågan skickad!", {
      description: "Vi återkommer inom 24 timmar (vardagar).",
    });
    navigate({ to: "/bekraftelse", search: { id: order.id } });
  };

  const progressPct = ((step + 1) / steps.length) * 100;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1 bg-gradient-hero">
        <div className="container mx-auto px-4 py-12 md:py-16 max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight">Begär offert</h1>
            <p className="text-muted-foreground mt-2">Fyll i steg för steg — kostnadsfritt och utan förpliktelser. Vi hör av oss inom 24 timmar.</p>
          </div>

          <div className="mb-8">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              {steps.map((s, i) => (
                <span key={s} className={i <= step ? "text-foreground font-medium" : ""}>
                  {i + 1}. {s}
                </span>
              ))}
            </div>
            <Progress value={progressPct} className="h-2" />
          </div>

          <Card className="border-border/60 shadow-elegant">
            <CardContent className="pt-6 animate-fade-up" key={step}>
              {step === 0 && (
                <div className="space-y-4">
                  <Field label="Ditt namn" required>
                    <Input value={data.namn} onChange={(e) => set("namn", e.target.value)} placeholder="Förnamn Efternamn" />
                  </Field>
                  <Field label="E-postadress" required>
                    <Input type="email" value={data.epost} onChange={(e) => set("epost", e.target.value)} placeholder="din@epost.se" />
                  </Field>
                  <Field label="Telefonnummer" required>
                    <Input value={data.telefon} onChange={(e) => set("telefon", e.target.value)} placeholder="+46 70 123 45 67" />
                  </Field>
                  <Field label="Adress (valfritt)">
                    <Input value={data.adress} onChange={(e) => set("adress", e.target.value)} placeholder="Gata, postnr, ort" />
                  </Field>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <Field label="Företagsnamn" required>
                    <Input value={data.foretagsnamn} onChange={(e) => set("foretagsnamn", e.target.value)} />
                  </Field>
                  <Field label="Företagsbeskrivning" required hint="Berätta vad ni gör, vilka ni hjälper och vad som är speciellt med er.">
                    <Textarea rows={5} value={data.beskrivning} onChange={(e) => set("beskrivning", e.target.value)} />
                  </Field>
                  <Field label="Sociala medier (valfritt)" hint="Länkar till Instagram, Facebook m.m.">
                    <Textarea rows={3} value={data.sociala} onChange={(e) => set("sociala", e.target.value)} placeholder="https://instagram.com/..." />
                  </Field>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-5">
                  <Field label="Typ av hemsida" required>
                    <Select value={data.typ} onValueChange={(v) => set("typ", v)}>
                      <SelectTrigger><SelectValue placeholder="Välj typ" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="foretag">Företagshemsida</SelectItem>
                        <SelectItem value="portfolio">Portfolio</SelectItem>
                        <SelectItem value="restaurang">Restaurang / Café</SelectItem>
                        <SelectItem value="tjanst">Tjänsteföretag</SelectItem>
                        <SelectItem value="privatperson">Privatperson</SelectItem>
                        <SelectItem value="annat">Annat</SelectItem>
                      </SelectContent>
                    </Select>
                  </Field>
                  <Field label="Önskade färger / temafärger" hint="Välj en huvudfärg eller skriv in egna färgkoder.">
                    <div className="flex gap-3 items-center">
                      <input
                        type="color"
                        value={data.farger?.startsWith("#") ? data.farger : "#2563eb"}
                        onChange={(e) => set("farger", e.target.value)}
                        className="h-10 w-14 rounded-md border border-border cursor-pointer"
                      />
                      <Input value={data.farger} onChange={(e) => set("farger", e.target.value)} placeholder="#2563eb, vit, svart" />
                    </div>
                  </Field>
                  <Field label="Ladda upp bilder / logga" hint="Upp till 10 filer. JPG, PNG eller PDF.">
                    <label className="flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-muted/30 px-6 py-10 cursor-pointer hover:border-primary hover:bg-primary/5 transition-smooth">
                      <Upload className="h-6 w-6 text-muted-foreground" />
                      <span className="text-sm font-medium">Klicka för att ladda upp</span>
                      <span className="text-xs text-muted-foreground">eller dra och släpp filerna här</span>
                      <input
                        type="file"
                        multiple
                        accept="image/*,application/pdf"
                        className="hidden"
                        onChange={(e) => handleFiles(e.target.files)}
                      />
                    </label>
                    {files.length > 0 && (
                      <div className="mt-4 space-y-2">
                        {files.map((f, i) => (
                          <div key={i} className="rounded-lg border border-border/60 bg-card p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="truncate">{f.name}</span>
                              <button onClick={() => setFiles((prev) => prev.filter((_, j) => j !== i))} className="text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                            <Progress value={f.progress} className="h-1.5 mt-2" />
                          </div>
                        ))}
                      </div>
                    )}
                  </Field>
                  <Field label="Extra önskemål (valfritt)">
                    <Textarea rows={4} value={data.extra} onChange={(e) => set("extra", e.target.value)} placeholder="Inspiration, sidor du gillar, specifika funktioner..." />
                  </Field>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Sammanfattning av din förfrågan</h3>
                  <div className="rounded-xl border border-border/60 divide-y divide-border/60 text-sm">
                    <Row label="Namn" value={data.namn} />
                    <Row label="E-post" value={data.epost} />
                    <Row label="Telefon" value={data.telefon} />
                    <Row label="Företag" value={data.foretagsnamn} />
                    <Row label="Typ" value={data.typ || "—"} />
                    <Row label="Färger" value={data.farger || "—"} />
                    <Row label="Filer" value={files.length ? `${files.length} st` : "Inga"} />
                  </div>

                  <label className="flex items-start gap-3 rounded-xl border border-border/60 p-4 cursor-pointer hover:bg-muted/50 transition-smooth">
                    <Checkbox checked={data.support} onCheckedChange={(v) => set("support", Boolean(v))} className="mt-0.5" />
                    <div>
                      <div className="font-medium">Intresserad av Support & Hosting (39.90 USD/mån)</div>
                      <div className="text-sm text-muted-foreground">Vi sköter hosting, ändringar och support löpande. Inkluderas i offerten — inget bindande val nu.</div>
                    </div>
                  </label>

                  <div className="rounded-xl border border-border/60 p-4 bg-muted/30 flex gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-medium">Ingen betalning sker nu</div>
                      <p className="text-muted-foreground mt-1">
                        Att skicka in en offertförfrågan är helt kostnadsfritt. Vi kontaktar dig för en kort genomgång och skickar därefter en offert.
                        En liten uppstartsavgift kan tillkomma först efter att du godkänt offerten — då börjar vi bygga och du får se en preview.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex items-center justify-between gap-3">
                {step > 0 ? (
                  <Button variant="outline" onClick={() => setStep((s) => s - 1)}>
                    <ArrowLeft /> Tillbaka
                  </Button>
                ) : (
                  <Button asChild variant="ghost">
                    <Link to="/"><ArrowLeft /> Avbryt</Link>
                  </Button>
                )}
                {step < steps.length - 1 ? (
                  <Button variant="hero" onClick={handleNext}>
                    Nästa <ArrowRight />
                  </Button>
                ) : (
                  <Button variant="hero" size="lg" onClick={handleSubmit} disabled={submitting}>
                    {submitting ? "Skickar..." : <>Skicka offertförfrågan <Check /></>}
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function Field({ label, required, hint, children }: { label: string; required?: boolean; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-sm font-medium">
        {label} {required && <span className="text-primary">*</span>}
      </Label>
      <div className="mt-1.5">{children}</div>
      {hint && <p className="text-xs text-muted-foreground mt-1.5">{hint}</p>}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between p-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
