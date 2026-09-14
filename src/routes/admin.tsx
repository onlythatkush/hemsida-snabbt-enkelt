import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  ChevronDown, ChevronUp, Eye, ExternalLink, FileText, Inbox, LayoutGrid, Loader2, Mail, RefreshCw, ShieldCheck, Sparkles,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "Adminpanel — Din Webbpartner" }] }),
  component: Admin,
});

type Application = {
  reference: string;
  company: string;
  name: string;
  email: string;
  phone: string;
  address?: string | null;
  description: string;
  social_links?: string | null;
  website_type: string;
  colors?: string | null;
  extra_requests?: string | null;
  wants_support?: boolean;
  status: string;
  preview_url?: string | null;
  file_names?: string[];
  created_at: string;
  design_family?: string | null;
  design_spec?: any;
  qa_status?: string | null;
  qa_score?: number | null;
  qa_report?: any;
  qa_accepted_at?: string | null;
  design_revision?: number | null;
  customer_approved_at?: string | null;
  review_note?: string | null;
};

const qaStatusLabels: Record<string, string> = {
  ready: "Klar att skicka",
  review: "Kräver granskning",
  blocked: "Blockerad",
};

function qaOf(a: Application) {
  const report = a.qa_report || a.design_spec?.qa || null;
  const status = (a.qa_status || report?.status || null) as "ready" | "review" | "blocked" | null;
  const score = a.qa_score ?? report?.score ?? null;
  const checks = (report?.checks || []) as { id: string; label: string; level: string; detail?: string }[];
  const accepted = Boolean(a.qa_accepted_at);
  const canSend = status === "blocked" ? false : status === "review" ? accepted : true;
  return { status, score, checks, accepted, canSend, evaluatedAt: report?.evaluatedAt as string | undefined };
}

const familyLabels: Record<string, string> = {
  "warm-craft": "Varm hantverk",
  "clean-nordic": "Ren nordisk",
  "trust-professional": "Trygg professionell",
  "bold-modern": "Modern & kraftfull",
  "soft-wellness": "Mjuk wellness",
  "fresh-retail": "Fräsch retail",
  "night-premium": "Mörk premium",
};

const industryLabels: Record<string, string> = {
  bakery: "Bageri", restaurant: "Restaurang", cafe: "Café", ecommerce: "E-handel",
  retail: "Butik", legal: "Juridik", consulting: "Konsult", beauty: "Skönhet",
  health: "Hälsa", construction: "Bygg", fitness: "Träning", photography: "Foto",
  cleaning: "Städ", realestate: "Mäklare", events: "Event", automotive: "Fordon",
  hospitality: "Hotell", generic: "Övrigt",
};

type PreviewLog = {
  id: string;
  reference: string;
  recipient_masked?: string | null;
  provider: string;
  provider_message_id?: string | null;
  status: string;
  error_message?: string | null;
  sent_at?: string | null;
  delivered_at?: string | null;
  created_at: string;
};

const mailStatusLabels: Record<string, string> = {
  queued: "Köad",
  sent: "Skickad",
  delivered: "Levererad",
  failed: "Misslyckad",
};

function isTest(a: Application) {
  return a.company?.startsWith("[TEST]") || a.reference?.startsWith("TEST-");
}

const statuses = ["new","reviewing","building","preview","changes","approved","paid","delivered","archived"];

const statusLabels: Record<string, string> = {
  new: "Ny",
  reviewing: "Granskas",
  building: "Byggs",
  preview: "Preview",
  changes: "Ändringar",
  approved: "Godkänd",
  paid: "Betald",
  delivered: "Levererad",
  archived: "Arkiverad",
};

function Admin() {
  const [key, setKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);
  const [openRef, setOpenRef] = useState<string | null>(null);
  const [buildingRef, setBuildingRef] = useState<string | null>(null);
  const [showGallery, setShowGallery] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [sendingRef, setSendingRef] = useState<string | null>(null);
  const [logVersion, setLogVersion] = useState(0);
  const [mailPreview, setMailPreview] = useState<{ reference: string; subject: string; html: string } | null>(null);
  const [previewingRef, setPreviewingRef] = useState<string | null>(null);
  const realItems = items.filter((a) => !isTest(a));
  const testItems = items.filter(isTest);

  useEffect(() => {
    const existing = sessionStorage.getItem("dwp-admin-key") || "";
    if (existing) {
      setKey(existing);
      setSavedKey(existing);
    }
  }, []);

  useEffect(() => {
    if (savedKey) load(savedKey);
  }, [savedKey]);

  async function load(accessKey = savedKey) {
    if (!accessKey) return;
    setLoading(true);
    try {
      const res = await fetch("/api/admin/applications", { headers: { "x-admin-key": accessKey } });
      if (res.status === 401) throw new Error("Fel adminnyckel");
      if (!res.ok) throw new Error("Kunde inte hämta ansökningar");
      const body = await res.json();
      setItems(body.applications || []);
    } catch (e: any) {
      toast.error(e.message || "Något gick fel");
    } finally {
      setLoading(false);
    }
  }

  function login() {
    const trimmed = key.trim();
    if (!trimmed) return;
    sessionStorage.setItem("dwp-admin-key", trimmed);
    setSavedKey(trimmed);
  }

  async function update(reference: string, patch: { status?: string; previewUrl?: string; acceptQa?: boolean }) {
    const res = await fetch("/api/admin/applications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-key": savedKey },
      body: JSON.stringify({ reference, ...patch }),
    });
    if (!res.ok) {
      toast.error("Kunde inte uppdatera");
      return;
    }
    const body = await res.json();
    setItems((prev) => prev.map((x) => x.reference === reference ? body.application : x));
    toast.success("Sparat");
  }

  async function createPreview(reference: string, action: "create-preview" | "regenerate-design" = "create-preview") {
    setBuildingRef(reference);
    setItems((prev) => prev.map((x) => x.reference === reference ? { ...x, status: "building" } : x));
    try {
      const res = await fetch("/api/admin/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": savedKey },
        body: JSON.stringify({ reference, action }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Kunde inte skapa preview");
      setItems((prev) => prev.map((x) => x.reference === reference ? body.application : x));
      toast.success("Första hemsideförslaget är klart");
      if (body.application?.preview_url) window.open(body.application.preview_url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message || "Kunde inte skapa preview");
      await load();
    } finally {
      setBuildingRef(null);
    }
  }

  async function sendPreviewEmail(a: Application) {
    if (!a.preview_url) return;
    const qa = qaOf(a);
    if (!qa.canSend) {
      toast.error(
        qa.status === "blocked"
          ? "Kvalitetskontrollen blockerar previewen — åtgärda felen och gör en ny hemsida."
          : "Previewen har varningar. Godkänn den i QA-rutan innan du skickar.",
      );
      return;
    }
    let recipient: string | undefined;
    if (isTest(a)) {
      const input = window.prompt(
        "Testansökan: ange en säker mottagaradress (aldrig testfallets fejkadress)",
        "",
      );
      if (!input) return;
      recipient = input.trim();
    } else if (!window.confirm(`Skicka previewmail till ${a.email}?`)) {
      return;
    }
    setSendingRef(a.reference);
    try {
      const res = await fetch("/api/admin/send-preview", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-key": savedKey },
        body: JSON.stringify({ reference: a.reference, recipient }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(
          body?.missingEnv
            ? `${body.error} Saknad konfiguration: ${body.missingEnv}`
            : body?.detail
              ? `${body.error} (${body.detail})`
              : body?.error || "Kunde inte skicka previewmailet",
        );
      }

      toast.success(`Previewmail skickat till ${body.recipient}`);
      setLogVersion((v) => v + 1);
    } catch (e: any) {
      toast.error(e.message || "Kunde inte skicka previewmailet");
    } finally {
      setSendingRef(null);
    }
  }

  async function acceptQa(reference: string, accept: boolean) {
    await update(reference, { acceptQa: accept });
  }

  async function openMailPreview(reference: string) {
    setPreviewingRef(reference);
    try {
      const res = await fetch(`/api/admin/send-preview?mode=html&reference=${encodeURIComponent(reference)}`, {
        headers: { "x-admin-key": savedKey },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Kunde inte visa mailet");
      setMailPreview({ reference, subject: body.subject, html: body.html });
    } catch (e: any) {
      toast.error(e.message || "Kunde inte visa mailet");
    } finally {
      setPreviewingRef(null);
    }
  }

  async function seedTestGallery() {
    setSeeding(true);
    try {
      const res = await fetch("/api/admin/seed-test-gallery", {
        method: "POST",
        headers: { "x-admin-key": savedKey },
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Kunde inte skapa testexempel");
      toast.success(`${body.seeded ?? 20} testexempel skapade`);
      await load();
    } catch (e: any) {
      toast.error(e.message || "Kunde inte skapa testexempel");
    } finally {
      setSeeding(false);
    }
  }

  async function openFile(path: string) {
    try {
      const res = await fetch(`/api/admin/applications?file=${encodeURIComponent(path)}`, {
        headers: { "x-admin-key": savedKey },
      });
      if (!res.ok) throw new Error("Kunde inte öppna filen");
      const body = await res.json();
      if (!body.url) throw new Error("Filen saknar länk");
      window.open(body.url, "_blank", "noopener,noreferrer");
    } catch (e: any) {
      toast.error(e.message || "Kunde inte öppna filen");
    }
  }

  if (!savedKey) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <SiteHeader />
        <main className="flex-1">
          <div className="container mx-auto px-4 py-16 max-w-md">
            <Card><CardContent className="pt-6 space-y-4">
              <div>
                <h1 className="text-2xl font-semibold">Adminpanel</h1>
                <p className="text-sm text-muted-foreground mt-1">Ange adminnyckeln för att öppna kundansökningar.</p>
              </div>
              <Input type="password" value={key} onChange={(e) => setKey(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} placeholder="Adminnyckel" />
              <Button onClick={login} className="w-full">Öppna admin</Button>
            </CardContent></Card>
          </div>
        </main>
        {mailPreview && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3"
          onClick={() => setMailPreview(null)}
        >
          <div className="flex h-[90vh] w-full max-w-[680px] flex-col overflow-hidden rounded-xl bg-background" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-3 border-b p-4">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Förhandsgranskning · {mailPreview.reference}</div>
                <div className="truncate text-sm font-medium">{mailPreview.subject}</div>
              </div>
              <Button size="sm" variant="outline" onClick={() => setMailPreview(null)}>Stäng</Button>
            </div>
            <iframe title="Mailförhandsgranskning" srcDoc={mailPreview.html} className="h-full w-full flex-1 bg-white" />
          </div>
        </div>
      )}
      <SiteFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SiteHeader />
      <main className="flex-1">
        <div className="container mx-auto px-4 py-8 md:py-12 max-w-7xl">
          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3 mb-6 md:mb-8">
            <div className="min-w-0">
              <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight truncate">Projektansökningar</h1>
              <p className="text-muted-foreground mt-1 text-sm sm:text-base">Hantera kundens väg från ansökan till leverans.</p>
            </div>
            <Button variant="outline" size="sm" className="shrink-0" onClick={() => load()} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Uppdatera
            </Button>
          </div>

          <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 mb-6">
            <Card>
              <CardContent className="pt-5 flex items-center gap-3">
                <Inbox className="text-primary shrink-0" />
                <div className="min-w-0"><div className="text-2xl font-semibold">{realItems.length}</div><div className="text-sm text-muted-foreground truncate">ansökningar</div></div>
              </CardContent>
            </Card>
            <Button variant={showGallery ? "default" : "outline"} onClick={() => setShowGallery((v) => !v)} className="shrink-0">
              <LayoutGrid className="h-4 w-4" /> Testgalleri ({testItems.length})
            </Button>
          </div>

          <EmailHealth adminKey={savedKey} />

          {showGallery && (
            <Card className="mb-8">
              <CardContent className="pt-6">
                <div className="mb-4">
                  <h2 className="text-xl font-semibold">Testgalleri</h2>
                  <p className="text-sm text-muted-foreground">Demo-exempel för att jämföra designer. Påverkar inte riktiga kunder.</p>
                </div>
                {!testItems.length && (
                  <div className="py-6 space-y-3">
                    <p className="text-sm text-muted-foreground">Inga testexempel hittades i den här miljön.</p>
                    <Button onClick={seedTestGallery} disabled={seeding}>
                      {seeding ? <Loader2 className="h-4 w-4 animate-spin" /> : <LayoutGrid className="h-4 w-4" />} Skapa testexempel
                    </Button>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {testItems.map((a) => {
                    const spec = a.design_spec || {};
                    const palette = spec.palette || {};
                    const family = a.design_family || spec.family;
                    const industry = spec.industry as string | undefined;
                    return (
                      <div key={a.reference} className="rounded-xl border overflow-hidden bg-card flex flex-col">
                        <div
                          className="h-24 w-full"
                          style={{ background: `linear-gradient(135deg, ${palette.primary || "hsl(var(--primary))"} 0%, ${palette.accent || palette.primary || "hsl(var(--muted))"} 100%)` }}
                        />
                        <div className="p-4 flex flex-col gap-3 flex-1">
                          <div className="min-w-0">
                            <div className="font-semibold leading-tight break-words">{a.company.replace("[TEST] ", "")}</div>
                            <div className="font-mono text-xs text-muted-foreground mt-1">{a.reference}</div>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs">
                            {industry && <span className="rounded-full border px-2 py-0.5">{industryLabels[industry] || industry}</span>}
                            {family && <span className="rounded-full border px-2 py-0.5">{familyLabels[family] || family}</span>}
                            {palette.primary && (
                              <span className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 font-mono">
                                <span className="h-3 w-3 rounded-full border shrink-0" style={{ background: palette.primary }} />
                                {palette.primary}
                              </span>
                            )}
                          </div>
                          <Button asChild size="sm" className="mt-auto w-full" disabled={!a.preview_url}>
                            <a href={a.preview_url || "#"} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" /> Öppna preview
                            </a>
                          </Button>
                          {a.preview_url && (
                            <Button size="sm" variant="outline" className="w-full" onClick={() => sendPreviewEmail(a)} disabled={sendingRef === a.reference}>
                              {sendingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                              Skicka preview
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}

          <div className="md:hidden space-y-3">
            {realItems.map((a) => {
              const isOpen = openRef === a.reference;
              return (
                <Card key={a.reference}>
                  <CardContent className="pt-5 space-y-4">
                    <button className="w-full text-left" onClick={() => setOpenRef(isOpen ? null : a.reference)}>
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-lg truncate">{a.company || a.name}</div>
                          <div className="text-sm text-muted-foreground">{a.name}</div>
                          <div className="font-mono text-xs mt-2">{a.reference}</div>
                        </div>
                        {isOpen ? <ChevronUp className="h-5 w-5 shrink-0" /> : <ChevronDown className="h-5 w-5 shrink-0" />}
                      </div>
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-xs text-muted-foreground">Typ</div>
                        <div className="text-sm capitalize">{a.website_type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Datum</div>
                        <div className="text-sm">{new Date(a.created_at).toLocaleDateString("sv-SE")}</div>
                      </div>
                    </div>

                    <ReviewState app={a} />

                    <Select value={a.status} onValueChange={(v) => update(a.reference, { status: v })}>
                      <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{statusLabels[s] || s}</SelectItem>)}</SelectContent>
                    </Select>

                    {isOpen && (
                      <div className="space-y-4 border-t pt-4">
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Kontakt</div>
                          <a className="text-sm underline break-all" href={`mailto:${a.email}`}>{a.email}</a>
                          <div><a className="text-sm underline" href={`tel:${a.phone}`}>{a.phone}</a></div>
                        </div>
                        {a.address && <Info label="Adress" value={a.address} />}
                        <Info label="Beskrivning" value={a.description} />
                        {a.social_links && <Info label="Sociala medier" value={a.social_links} />}
                        {a.colors && <Info label="Färger" value={a.colors} />}
                        {a.extra_requests && <Info label="Extra önskemål" value={a.extra_requests} />}
                        <Info label="Support & hosting" value={a.wants_support ? "Ja" : "Nej"} />

                        <QaPanel app={a} onAccept={acceptQa} />
                        <DesignDiagnostics app={a} />

                        {(a.status === "reviewing" || a.status === "new") ? (
                          <Button className="w-full" onClick={() => createPreview(a.reference)} disabled={buildingRef === a.reference}>
                            {buildingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Skapa hemsida
                          </Button>
                        ) : (
                          <Button className="w-full" variant="outline" onClick={() => createPreview(a.reference, "regenerate-design")} disabled={buildingRef === a.reference}>
                            {buildingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Gör ny hemsida
                          </Button>
                        )}
                        {a.preview_url && (
                          <>
                            <Button asChild variant="secondary" className="w-full">
                              <a href={a.preview_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Öppna kundpreview</a>
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => openMailPreview(a.reference)} disabled={previewingRef === a.reference}>
                              {previewingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                              Förhandsgranska mail
                            </Button>
                            <Button variant="outline" className="w-full" onClick={() => sendPreviewEmail(a)} disabled={sendingRef === a.reference || !qaOf(a).canSend}>
                              {sendingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                              {a.status === "changes" ? "Skicka uppdaterad preview" : "Skicka preview"}
                            </Button>
                          </>
                        )}

                        <PreviewMailLog reference={a.reference} adminKey={savedKey} version={logVersion} />
                        <RevisionTimeline reference={a.reference} adminKey={savedKey} version={logVersion} />

                        {!!a.file_names?.length && (
                          <div>
                            <div className="text-xs text-muted-foreground mb-2">Filer</div>
                            <div className="space-y-2">
                              {a.file_names.map((path) => (
                                <Button key={path} type="button" variant="outline" className="w-full justify-start" onClick={() => openFile(path)}>
                                  <FileText className="h-4 w-4" />
                                  <span className="truncate">{path.split("/").pop()?.replace(/^[0-9a-f-]+-/, "") || "Fil"}</span>
                                </Button>
                              ))}
                            </div>
                          </div>
                        )}

                        <div>
                          <div className="text-xs text-muted-foreground mb-2">Preview-länk</div>
                          <div className="flex gap-2">
                            <Input defaultValue={a.preview_url || ""} placeholder="https://preview..." onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value !== (a.preview_url || "")) update(a.reference, { previewUrl: value });
                            }} />
                            {a.preview_url && (
                              <Button asChild variant="outline" size="icon">
                                <a href={a.preview_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
            {!realItems.length && !loading && <Card><CardContent className="py-10 text-center text-muted-foreground">Inga ansökningar ännu.</CardContent></Card>}
          </div>

          <Card className="hidden md:block">
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Referens</TableHead><TableHead>Företag / kund</TableHead><TableHead>Kontakt</TableHead>
                    <TableHead>Typ</TableHead><TableHead>Status</TableHead><TableHead>Preview</TableHead><TableHead>Datum</TableHead><TableHead>Åtgärd</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {realItems.map((a) => (
                      <TableRow key={a.reference}>
                        <TableCell className="font-mono text-xs">{a.reference}</TableCell>
                        <TableCell><div className="font-medium">{a.company}</div><div className="text-xs text-muted-foreground">{a.name}</div></TableCell>
                        <TableCell><div className="text-sm">{a.email}</div><div className="text-xs text-muted-foreground">{a.phone}</div></TableCell>
                        <TableCell className="capitalize">{a.website_type}</TableCell>
                        <TableCell>
                          <Select value={a.status} onValueChange={(v) => update(a.reference, { status: v })}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{statusLabels[s] || s}</SelectItem>)}</SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 min-w-[240px]">
                            <Input defaultValue={a.preview_url || ""} placeholder="https://preview..." onBlur={(e) => {
                              const value = e.target.value.trim();
                              if (value !== (a.preview_url || "")) update(a.reference, { previewUrl: value });
                            }} />
                            {a.preview_url && <a href={a.preview_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /></a>}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{new Date(a.created_at).toLocaleDateString("sv-SE")}</TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-2">
                          {(a.status === "reviewing" || a.status === "new") ? (
                            <Button size="sm" onClick={() => createPreview(a.reference)} disabled={buildingRef === a.reference}>
                              {buildingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              Skapa hemsida
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" onClick={() => createPreview(a.reference, "regenerate-design")} disabled={buildingRef === a.reference}>
                              {buildingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                              Ny design
                            </Button>
                          )}
                          {a.preview_url && (
                            <Button size="sm" variant="outline" onClick={() => openMailPreview(a.reference)} disabled={previewingRef === a.reference}>
                              {previewingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                              Förhandsgranska mail
                            </Button>
                          )}
                          {a.preview_url && (
                            <Button size="sm" variant="secondary" onClick={() => sendPreviewEmail(a)} disabled={sendingRef === a.reference || !qaOf(a).canSend} title={qaOf(a).canSend ? undefined : "Kvalitetskontrollen tillåter inte utskick"}>
                              {sendingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                              Skicka preview
                            </Button>
                          )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                    {!realItems.length && !loading && <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground">Inga ansökningar ännu.</TableCell></TableRow>}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function PreviewMailLog({ reference, adminKey, version }: { reference: string; adminKey: string; version: number }) {
  const [logs, setLogs] = useState<PreviewLog[] | null>(null);

  useEffect(() => {
    let active = true;
    if (!adminKey) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/send-preview?reference=${encodeURIComponent(reference)}`, {
          headers: { "x-admin-key": adminKey },
        });
        if (!res.ok) throw new Error("fel");
        const body = await res.json();
        if (active) setLogs(body.logs || []);
      } catch {
        if (active) setLogs([]);
      }
    })();
    return () => { active = false; };
  }, [reference, adminKey, version]);

  const latest = logs?.[0];

  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs text-muted-foreground mb-2">Previewmail</div>
      {!logs && <div className="text-sm text-muted-foreground">Hämtar…</div>}
      {logs && !latest && <div className="text-sm text-muted-foreground">Inget previewmail skickat ännu.</div>}
      {latest && (
        <div className="space-y-1 text-sm">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
              {mailStatusLabels[latest.status] || latest.status}
            </span>
            <span className="text-xs text-muted-foreground">{latest.provider}</span>
          </div>
          <div className="break-all">{latest.recipient_masked}</div>
          <div className="text-xs text-muted-foreground">
            {new Date(latest.sent_at || latest.created_at).toLocaleString("sv-SE")}
          </div>
          {latest.error_message && (
            <div className="text-xs text-destructive break-words">{latest.error_message}</div>
          )}
          {logs.length > 1 && (
            <div className="text-xs text-muted-foreground">+{logs.length - 1} tidigare försök</div>
          )}
        </div>
      )}
    </div>
  );
}

type TimelineEvent = { id: string; event_type: string; label: string; created_at: string; details?: any };
type ChangeRequest = {
  id: string;
  raw_text: string;
  status: string;
  revision: number | null;
  received_at: string;
  matched_via: string | null;
  intent?: string | null;
  intent_reason?: string | null;
  directives?: { summary?: string[] } | null;
  category?: string | null;
  confidence?: number | null;
  classifier?: string | null;
  routing?: string | null;
  last_error?: string | null;
};
type DesignVersion = {
  revision: number;
  design_family: string | null;
  preview_url: string | null;
  qa_status: string | null;
  qa_score: number | null;
  source: string | null;
  created_at: string;
};
type RevisionJob = {
  id: string;
  status: string;
  revision: number | null;
  retry_count: number;
  last_error: string | null;
  created_at: string;
  finished_at: string | null;
};

const categoryLabels: Record<string, string> = {
  design_changes: "Ändringar önskas",
  design_approved: "Godkännande",
  question_design: "Fråga om designen",
  question_process: "Fråga om processen",
  question_payment: "Fråga om betalning",
  question_other: "Övrig fråga",
  unclear: "Oklart – granska",
};

const jobStatusLabels: Record<string, string> = {
  queued: "I kö",
  processing: "Pågår",
  succeeded: "Klar",
  failed: "Misslyckades",
  needs_review: "Kräver granskning",
};

const intentLabels: Record<string, string> = {
  approved: "Godkännande",
  changes: "Ändringar önskas",
  unclear: "Oklart – granska",
};

const requestStatusLabels: Record<string, string> = {
  received: "Mottaget",
  applied: "Ny version skapad",
  approved: "Godkänd av kund",
  needs_review: "Behöver granskas",
  skipped: "Ej behandlat",
  failed: "Misslyckades",
};

/** Current design-review state: version, approval and pending review note. */
function ReviewState({ app }: { app: Application }) {
  const revision = app.design_revision ?? app.design_spec?.revision ?? null;
  const approved = Boolean(app.customer_approved_at);
  if (!revision && !approved && !app.review_note) return null;
  return (
    <div
      className={
        "rounded-lg border p-3 text-sm " +
        (approved
          ? "border-emerald-500/60 bg-emerald-500/10"
          : app.review_note
            ? "border-amber-500/60 bg-amber-500/10"
            : "bg-muted/40")
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        {revision ? <span className="rounded-full bg-background px-2 py-0.5 text-xs">Version {revision}</span> : null}
        {approved && <span className="font-medium">Godkänd av kund</span>}
        {approved && app.customer_approved_at && (
          <span className="text-xs text-muted-foreground">
            {new Date(app.customer_approved_at).toLocaleString("sv-SE")}
          </span>
        )}
      </div>
      {!approved && app.review_note && (
        <div className="mt-1 text-xs text-muted-foreground">{app.review_note}</div>
      )}
    </div>
  );
}

/** Customer replies and the full history for one application. */
function RevisionTimeline({ reference, adminKey, version }: { reference: string; adminKey: string; version: number }) {
  const [events, setEvents] = useState<TimelineEvent[] | null>(null);
  const [requests, setRequests] = useState<ChangeRequest[]>([]);
  const [versions, setVersions] = useState<DesignVersion[]>([]);
  const [jobs, setJobs] = useState<RevisionJob[]>([]);
  const [busy, setBusy] = useState<string | null>(null);
  const [reload, setReload] = useState(0);

  useEffect(() => {
    let active = true;
    if (!adminKey) return;
    (async () => {
      try {
        const res = await fetch(`/api/admin/applications?timeline=${encodeURIComponent(reference)}`, {
          headers: { "x-admin-key": adminKey },
        });
        if (!res.ok) throw new Error("fel");
        const body = await res.json();
        if (!active) return;
        setEvents(body.events || []);
        setRequests(body.changeRequests || []);
        setVersions(body.versions || []);
        setJobs(body.jobs || []);
      } catch {
        if (active) setEvents([]);
      }
    })();
    return () => { active = false; };
  }, [reference, adminKey, version, reload]);

  async function reprocess(changeRequestId: string) {
    setBusy(changeRequestId);
    try {
      const res = await fetch("/api/admin/reprocess", {
        method: "POST",
        headers: { "content-type": "application/json", "x-admin-key": adminKey },
        body: JSON.stringify({ reference, changeRequestId }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body?.error || "Kunde inte köra om");
      toast.success(body?.skipped === "already_processed"
        ? "Redan behandlat – inget dubbelarbete gjordes"
        : `Ny version ${body.revision} skapad (kvalitet: ${body.qaStatus || "okänd"})`);
      setReload((n) => n + 1);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Kunde inte köra om");
    } finally {
      setBusy(null);
    }
  }

  if (!events || (!events.length && !requests.length && !versions.length && !jobs.length)) return null;

  return (
    <div className="rounded-lg border p-3 space-y-4">
      {!!requests.length && (
        <div className="space-y-2">
          <div className="text-xs text-muted-foreground">Kundens meddelanden</div>
          {requests.map((r) => {
            const retryable = ["failed", "needs_review", "received", "skipped"].includes(r.status);
            return (
              <div key={r.id} className="rounded-md bg-muted/50 p-2 text-sm space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span className="rounded-full bg-background px-2 py-0.5">{requestStatusLabels[r.status] || r.status}</span>
                  {r.category ? <span className="rounded-full bg-background px-2 py-0.5">{categoryLabels[r.category] || r.category}</span> : null}
                  {!r.category && r.intent ? <span className="rounded-full bg-background px-2 py-0.5">{intentLabels[r.intent] || r.intent}</span> : null}
                  {typeof r.confidence === "number" ? <span>säkerhet {Math.round(r.confidence * 100)}%</span> : null}
                  {r.revision ? <span>version {r.revision}</span> : null}
                  {r.matched_via ? <span>matchad via {r.matched_via}</span> : null}
                  <span>{new Date(r.received_at).toLocaleString("sv-SE")}</span>
                </div>
                <div className="break-words">{r.raw_text}</div>
                {r.intent_reason ? <div className="text-xs text-muted-foreground">Bedömning: {r.intent_reason}</div> : null}
                {!!r.directives?.summary?.length && (
                  <ul className="list-disc pl-4 text-xs text-muted-foreground">
                    {r.directives.summary.map((s) => <li key={s}>{s}</li>)}
                  </ul>
                )}
                {r.last_error ? <div className="text-xs text-destructive break-words">Fel: {r.last_error}</div> : null}
                {retryable && (
                  <Button size="sm" variant="outline" className="mt-1" disabled={busy === r.id} onClick={() => reprocess(r.id)}>
                    {busy === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    Kör om ändringarna
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {!!versions.length && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Versioner</div>
          <ul className="space-y-1 text-xs">
            {versions.map((v) => (
              <li key={v.revision} className="flex flex-wrap items-center gap-2">
                <span className="text-foreground font-medium">Version {v.revision}</span>
                {v.design_family ? <span className="text-muted-foreground">{v.design_family}</span> : null}
                {v.qa_status ? <span className="text-muted-foreground">kvalitet: {qaLabels[v.qa_status] || v.qa_status}{typeof v.qa_score === "number" ? ` ${v.qa_score}` : ""}</span> : null}
                <span className="text-muted-foreground">{new Date(v.created_at).toLocaleString("sv-SE")}</span>
                {v.preview_url ? (
                  <a className="underline" href={v.preview_url} target="_blank" rel="noreferrer">Öppna</a>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!jobs.length && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Jobb</div>
          <ul className="space-y-1 text-xs text-muted-foreground">
            {jobs.map((j) => (
              <li key={j.id} className="flex flex-wrap gap-2">
                <span className="text-foreground">{jobStatusLabels[j.status] || j.status}</span>
                {j.revision ? <span>version {j.revision}</span> : null}
                {j.retry_count ? <span>försök {j.retry_count + 1}</span> : null}
                <span>{new Date(j.created_at).toLocaleString("sv-SE")}</span>
                {j.last_error ? <span className="text-destructive break-words">{j.last_error}</span> : null}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!events.length && (
        <div className="space-y-1">
          <div className="text-xs text-muted-foreground">Händelser</div>
          <ol className="space-y-1 text-xs text-muted-foreground">
            {events.map((e) => (
              <li key={e.id} className="flex flex-wrap gap-2">
                <span className="text-foreground">{e.label}</span>
                <span>{new Date(e.created_at).toLocaleString("sv-SE")}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

/** Automatic QA gate result for the current generated preview. */
function QaPanel({ app, onAccept }: { app: Application; onAccept: (reference: string, accept: boolean) => void }) {
  const qa = qaOf(app);
  if (!qa.status) return null;
  const issues = qa.checks.filter((c) => c.level === "fail" || c.level === "warn");
  const tone =
    qa.status === "blocked" ? "border-destructive/60 bg-destructive/10"
    : qa.status === "review" ? "border-amber-500/60 bg-amber-500/10"
    : "border-emerald-500/60 bg-emerald-500/10";
  return (
    <div className={`rounded-lg border p-3 ${tone}`}>
      <div className="flex flex-wrap items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0" />
        <span className="text-sm font-medium">Kvalitetskontroll: {qaStatusLabels[qa.status] || qa.status}</span>
        {qa.score !== null && <span className="rounded-full bg-background/60 px-2 py-0.5 text-xs font-mono">{qa.score}/100</span>}
      </div>
      {!!issues.length && (
        <ul className="mt-2 space-y-1 text-xs">
          {issues.map((c) => (
            <li key={c.id} className="break-words">
              <span className="font-medium">{c.level === "fail" ? "Fel" : "Varning"}:</span> {c.label}
              {c.detail ? ` — ${c.detail}` : ""}
            </li>
          ))}
        </ul>
      )}
      {qa.status === "blocked" && (
        <p className="mt-2 text-xs">Previewen kan inte skickas till kund förrän felen är åtgärdade. Gör en ny hemsida.</p>
      )}
      {qa.status === "review" && (
        <div className="mt-2">
          {qa.accepted ? (
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span>Godkänd av admin {new Date(app.qa_accepted_at as string).toLocaleString("sv-SE")}.</span>
              <Button size="sm" variant="outline" onClick={() => onAccept(app.reference, false)}>Ångra godkännande</Button>
            </div>
          ) : (
            <Button size="sm" onClick={() => onAccept(app.reference, true)}>Godkänn trots varningar</Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Proof of exactly which generation produced the current preview. */
function DesignDiagnostics({ app }: { app: Application }) {
  const spec = app.design_spec || {};
  const e = spec.engine || {};
  if (!spec.version && !e.version) return null;
  const rows: [string, string][] = [
    ["Revision", String(spec.revision ?? e.revision ?? 1)],
    ["Motorversion", String(spec.version ?? e.version ?? "–")],
    ["Genererad", spec.generatedAt ? new Date(spec.generatedAt).toLocaleString("sv-SE") : "–"],
    ["Designfamilj", String(app.design_family || spec.family || "–")],
    ["Bransch", String(spec.industry || "–")],
    ["Hero-bild", e.heroSource === "customer" ? `Kundens bild: ${e.heroAsset}` : e.heroSource === "curated" ? `Kurerad bild (${e.stockSet || "–"})` : "Ingen"],
    ["QA", spec.qa ? `${spec.qa.status} · ${spec.qa.score}` : "–"],
    ["Bortvalda filer", (e.rejectedAssets || []).length ? (e.rejectedAssets as string[]).join(", ") : "Inga"],
  ];
  return (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="text-xs font-medium mb-2">Designdiagnostik</div>
      <dl className="grid grid-cols-1 gap-1 text-xs sm:grid-cols-2">
        {rows.map(([k, v]) => (
          <div key={k} className="flex flex-wrap gap-1">
            <dt className="text-muted-foreground">{k}:</dt>
            <dd className="break-all font-mono">{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}

function EmailHealth({ adminKey }: { adminKey: string }) {
  const [health, setHealth] = useState<any | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await fetch("/api/admin/email-health", { headers: { "x-admin-key": adminKey } });
        if (!res.ok) throw new Error("fel");
        const body = await res.json();
        if (active) setHealth(body);
      } catch {
        if (active) setHealth({ error: true });
      }
    })();
    return () => { active = false; };
  }, [adminKey]);

  if (!health) return null;

  type HealthCheck = { id: string; label: string; status: "green" | "yellow" | "red"; detail?: string; action?: string };
  const checks: HealthCheck[] = health.error
    ? [{ id: "error", label: "Kunde inte läsa e-poststatus", status: "red" }]
    : (health.checks || []);
  const overall: "green" | "yellow" | "red" = health.error
    ? "red"
    : checks.some((c) => c.status === "red")
      ? "red"
      : checks.some((c) => c.status === "yellow")
        ? "yellow"
        : "green";
  const dot = (s: string) => (s === "green" ? "bg-emerald-500" : s === "yellow" ? "bg-amber-500" : "bg-red-500");
  const headline = overall === "green" ? "klart" : overall === "yellow" ? "fungerar med varningar" : "behöver åtgärd";

  return (
    <Card className="mb-6">
      <CardContent className="pt-5">
        <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between gap-3 text-left">
          <span className="flex items-center gap-2 text-sm font-medium">
            <span className={`h-2.5 w-2.5 rounded-full ${dot(overall)}`} />
            E-postflöde {headline}
          </span>
          <span className="text-xs text-muted-foreground">{open ? "Dölj" : "Visa"}</span>
        </button>
        {open && (
          <ul className="mt-3 space-y-3">
            {checks.map((c) => (
              <li key={c.id} className="flex gap-2 text-sm">
                <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${dot(c.status)}`} />
                <span className="min-w-0">
                  <span className="block">{c.label}</span>
                  {c.detail && <span className="block text-xs text-muted-foreground break-words">{c.detail}</span>}
                  {c.action && <span className="block text-xs text-amber-600 break-words">Åtgärd: {c.action}</span>}
                </span>
              </li>
            ))}
            {health.replyAddressExample && (
              <li className="text-xs text-muted-foreground break-all">Svarsadress: {health.replyAddressExample}</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

