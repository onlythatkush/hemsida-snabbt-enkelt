import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { PreviewRenderer } from "@/components/preview/PreviewRenderer";
import type { DesignSpec } from "@/lib/design/types";

export const Route = createFileRoute("/kund-preview/$reference")({
  head: () => ({
    meta: [
      { title: "Förhandsvisning av din hemsida — Din Webbpartner" },
      { name: "description", content: "Ett första designförslag framtaget utifrån ditt underlag." },
      { name: "robots", content: "noindex" },
      { property: "og:title", content: "Förhandsvisning av din hemsida" },
      { property: "og:description", content: "Ett första designförslag framtaget utifrån ditt underlag." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=Playfair+Display:wght@500;600;700&family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  component: CustomerPreview,
});

function CustomerPreview() {
  const { reference } = Route.useParams();
  const [spec, setSpec] = useState<DesignSpec | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token") || "";
    fetch(`/api/public/project-preview/${encodeURIComponent(reference)}?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        if (!res.ok || !body?.spec) throw new Error(body?.error || "Preview kunde inte öppnas");
        setSpec(body.spec as DesignSpec);
      })
      .catch((e) => setError(e.message || "Preview kunde inte öppnas"))
      .finally(() => setLoading(false));
  }, [reference]);

  if (loading) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (error || !spec) {
    return (
      <div className="min-h-screen grid place-items-center bg-slate-950 px-6 text-center text-white">
        <div>
          <h1 className="text-3xl font-semibold">Preview kunde inte öppnas</h1>
          <p className="mt-3 text-white/60">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="border-b border-white/10 bg-[#0b0d12] text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div>
            <div className="text-[0.66rem] uppercase tracking-[0.24em] text-white/45">Förhandsvisning</div>
            <div className="text-sm font-semibold">Din Webbpartner</div>
          </div>
          <div className="font-mono text-xs text-white/45">{spec.brand.company} · {reference}</div>
        </div>
      </div>

      <PreviewRenderer spec={spec} />

      <div className="bg-[#0b0d12] px-5 py-6 text-center text-sm text-white/55">
        Det här är ett första förslag. Layout, texter, färger och bilder justeras innan sidan godkänns.
      </div>
    </div>
  );
}
