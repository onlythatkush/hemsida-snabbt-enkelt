import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, FileText, Loader2 } from "lucide-react";

type PreviewData = {
  reference: string;
  company: string;
  description: string;
  socialLinks?: string | null;
  websiteType: string;
  colors?: string | null;
  extraRequests?: string | null;
  files?: { name: string; url: string; type: "image" | "file" }[];
};

export const Route = createFileRoute("/kund-preview/$reference")({
  head: () => ({ meta: [{ title: "Kundpreview — Din Webbpartner" }] }),
  component: CustomerPreview,
});

function CustomerPreview() {
  const { reference } = Route.useParams();
  const [project, setProject] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    fetch(`/api/public/project-preview/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(body?.error || "Preview kunde inte öppnas");
        setProject(body.project);
      })
      .catch((e) => setError(e.message || "Preview kunde inte öppnas"))
      .finally(() => setLoading(false));
  }, [reference]);

  const accent = useMemo(() => {
    const raw = project?.colors?.match(/#[0-9a-fA-F]{6}/)?.[0];
    return raw || "#f59e0b";
  }, [project]);

  if (loading) return <div className="min-h-screen grid place-items-center bg-slate-950 text-white"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  if (error || !project) return <div className="min-h-screen grid place-items-center bg-slate-950 text-white px-6 text-center"><div><h1 className="text-3xl font-semibold">Preview kunde inte öppnas</h1><p className="mt-3 text-white/60">{error}</p></div></div>;

  const images = (project.files || []).filter((f) => f.type === "image");
  const docs = (project.files || []).filter((f) => f.type === "file");

  return (
    <div className="min-h-screen bg-[#080b12] text-white">
      <div className="border-b border-white/10 bg-black/20 backdrop-blur">
        <div className="mx-auto max-w-6xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <div className="text-xs uppercase tracking-[0.22em] text-white/45">Förhandsvisning</div>
            <div className="font-semibold">Din Webbpartner</div>
          </div>
          <div className="text-xs text-white/45 font-mono">{project.reference}</div>
        </div>
      </div>

      <main>
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 opacity-25" style={{ background: `radial-gradient(circle at 65% 15%, ${accent}, transparent 35%)` }} />
          <div className="mx-auto max-w-6xl px-5 py-20 md:py-28 relative">
            <div className="max-w-3xl">
              <div className="text-sm font-medium mb-4" style={{ color: accent }}>{project.websiteType}</div>
              <h1 className="text-5xl md:text-7xl font-semibold tracking-tight leading-[0.98]">{project.company}</h1>
              <p className="mt-6 text-lg md:text-xl text-white/70 leading-relaxed max-w-2xl">{project.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="lg" style={{ backgroundColor: accent, color: "#0a0a0a" }}>Kontakta oss</Button>
                {project.socialLinks && <Button size="lg" variant="outline" className="border-white/20 bg-white/5 text-white">Sociala medier</Button>}
              </div>
            </div>
          </div>
        </section>

        {!!images.length && (
          <section className="mx-auto max-w-6xl px-5 py-10">
            <div className="grid md:grid-cols-2 gap-4">
              {images.slice(0, 4).map((image, i) => (
                <div key={image.url} className={i === 0 ? "md:col-span-2" : ""}>
                  <img src={image.url} alt="" className="w-full rounded-3xl border border-white/10 object-cover max-h-[520px]" />
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mx-auto max-w-6xl px-5 py-16">
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-white/[0.04] border-white/10 text-white">
              <CardContent className="pt-6">
                <div className="text-sm mb-2" style={{ color: accent }}>Om företaget</div>
                <h2 className="text-3xl font-semibold">Tydligt. Modernt. Fokuserat.</h2>
                <p className="mt-4 text-white/65 leading-relaxed">{project.description}</p>
              </CardContent>
            </Card>
            <Card className="bg-white/[0.04] border-white/10 text-white">
              <CardContent className="pt-6">
                <div className="text-sm mb-2" style={{ color: accent }}>Nästa steg</div>
                <h2 className="text-3xl font-semibold">Det här är första förslaget.</h2>
                <p className="mt-4 text-white/65 leading-relaxed">Layout, texter, färger och bildval kan justeras innan sidan godkänns.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        {project.extraRequests && (
          <section className="mx-auto max-w-6xl px-5 pb-12">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
              <div className="text-xs uppercase tracking-[0.2em] text-white/40">Önskemål från underlaget</div>
              <p className="mt-3 text-white/70 whitespace-pre-wrap">{project.extraRequests}</p>
            </div>
          </section>
        )}

        {!!docs.length && (
          <section className="mx-auto max-w-6xl px-5 pb-20">
            <h3 className="text-lg font-semibold mb-3">Bifogat material</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {docs.map((file) => (
                <a key={file.url} href={file.url} target="_blank" rel="noreferrer" className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 flex items-center gap-3 hover:bg-white/[0.06]">
                  <FileText className="h-5 w-5" />
                  <span className="truncate flex-1">{file.name}</span>
                  <ExternalLink className="h-4 w-4 text-white/40" />
                </a>
              ))}
            </div>
          </section>
        )}
      </main>

      <footer className="border-t border-white/10">
        <div className="mx-auto max-w-6xl px-5 py-8 text-sm text-white/40">Preview skapad av Din Webbpartner.</div>
      </footer>
    </div>
  );
}
