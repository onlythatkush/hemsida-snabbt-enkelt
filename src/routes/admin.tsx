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
  ChevronDown, ChevronUp, ExternalLink, FileText, Inbox, LayoutGrid, Loader2, RefreshCw, Sparkles,
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
};

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

  async function update(reference: string, patch: { status?: string; previewUrl?: string }) {
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

                        {(a.status === "reviewing" || a.status === "new") && (
                          <Button className="w-full" onClick={() => createPreview(a.reference)} disabled={buildingRef === a.reference}>
                            {buildingRef === a.reference ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                            Skapa hemsida
                          </Button>
                        )}
                        {a.preview_url && (
                          <Button asChild variant="secondary" className="w-full">
                            <a href={a.preview_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> Öppna kundpreview</a>
                          </Button>
                        )}

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

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground mb-1">{label}</div>
      <div className="text-sm whitespace-pre-wrap break-words">{value}</div>
    </div>
  );
}
