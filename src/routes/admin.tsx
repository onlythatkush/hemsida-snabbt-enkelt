import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteHeader, SiteFooter } from "@/components/site-header";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Inbox, Loader2, RefreshCw, ExternalLink } from "lucide-react";
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
  website_type: string;
  status: string;
  preview_url?: string | null;
  file_names?: string[];
  created_at: string;
};

const statuses = ["new","reviewing","building","preview","changes","approved","paid","delivered","archived"];

function Admin() {
  const [key, setKey] = useState("");
  const [savedKey, setSavedKey] = useState("");
  const [items, setItems] = useState<Application[]>([]);
  const [loading, setLoading] = useState(false);

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
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="flex items-center justify-between gap-3 mb-8">
            <div>
              <h1 className="text-3xl font-semibold tracking-tight">Projektansökningar</h1>
              <p className="text-muted-foreground mt-1">Hantera kundens väg från ansökan till leverans.</p>
            </div>
            <Button variant="outline" onClick={() => load()} disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : <RefreshCw />} Uppdatera
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="pt-5 flex items-center gap-3">
              <Inbox className="text-primary" />
              <div><div className="text-2xl font-semibold">{items.length}</div><div className="text-sm text-muted-foreground">ansökningar</div></div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader><TableRow>
                    <TableHead>Referens</TableHead><TableHead>Företag / kund</TableHead><TableHead>Kontakt</TableHead>
                    <TableHead>Typ</TableHead><TableHead>Status</TableHead><TableHead>Preview</TableHead><TableHead>Datum</TableHead>
                  </TableRow></TableHeader>
                  <TableBody>
                    {items.map((a) => (
                      <TableRow key={a.reference}>
                        <TableCell className="font-mono text-xs">{a.reference}</TableCell>
                        <TableCell><div className="font-medium">{a.company}</div><div className="text-xs text-muted-foreground">{a.name}</div></TableCell>
                        <TableCell><div className="text-sm">{a.email}</div><div className="text-xs text-muted-foreground">{a.phone}</div></TableCell>
                        <TableCell className="capitalize">{a.website_type}</TableCell>
                        <TableCell>
                          <Select value={a.status} onValueChange={(v) => update(a.reference, { status: v })}>
                            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                            <SelectContent>{statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
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
                      </TableRow>
                    ))}
                    {!items.length && !loading && <TableRow><TableCell colSpan={7} className="text-center py-10 text-muted-foreground">Inga ansökningar ännu.</TableCell></TableRow>}
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
