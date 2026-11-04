import { useState } from "react";

export function AiChangeCenter({ reference, company, designSpec, adminKey, reviewNote }: { reference: string; company: string; designSpec?: any; adminKey: string; reviewNote?: string | null }) {
  const [request, setRequest] = useState("");
  const [mode, setMode] = useState<"revise" | "new">("revise");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);
  const [prepared, setPrepared] = useState(Boolean(reviewNote?.includes("Lovable: instruktion förberedd")));
  const brief = [
    "Projekt: " + company + " (" + reference + ")",
    "Uppdrag: " + (mode === "revise" ? "Ändra befintligt Lovable-demo, skapa inte om sidan." : "Skapa alternativt demo utan att skriva över originalet."),
    "Kundens önskemål: " + request,
    "Bevara alla befintliga bilder, texter, företagsuppgifter, sektioner och layout som kunden inte uttryckligen vill ändra.",
    "Befintlig designkontext: " + JSON.stringify({ brand: designSpec?.brand, palette: designSpec?.palette, images: designSpec?.images, sections: designSpec?.sections }).slice(0, 10000),
    "Gör minsta möjliga ändring. Kontrollera före/efter, mobilvy, länkar och kontrast.",
    "Publicera inte, skicka inte kundmejl och ändra inte produktionsdata utan separat godkännande.",
    "Redovisa ändringar, projekt-ID, commit och preview för återimport och kvalitetsgranskning."
  ].join("\n\n");
  return <section className="rounded-xl border p-4 space-y-3">
    <h3 className="font-semibold">AI-ändringscentral</h3>
    <p className="text-xs text-muted-foreground">Förbered en säker Lovable-instruktion för {reference}. Inga krediter används förrän du skickar den.</p>
    <div className="flex gap-2 flex-wrap">
      <button type="button" className="rounded border p-2 text-sm" onClick={() => setMode("revise")}>Ändra befintligt demo {mode === "revise" ? "✓" : ""}</button>
      <button type="button" className="rounded border p-2 text-sm" onClick={() => setMode("new")}>Generera nytt demo {mode === "new" ? "✓" : ""}</button>
    </div>
    <textarea aria-label="Kundens ändringsönskemål" placeholder="Klistra in kundens önskemål" value={request} onChange={e => { setRequest(e.target.value); setPrepared(false); }} className="w-full min-h-24 rounded border bg-background p-2 text-sm" />
    <details><summary className="cursor-pointer text-sm">Granska bygginstruktion</summary><textarea readOnly value={brief} className="w-full min-h-56 rounded border bg-background p-2 text-xs" /></details>
    <div className="flex gap-2 flex-wrap">
    <button type="button" disabled={!request.trim() || busy || mode !== "revise"} className="rounded bg-primary p-2 text-sm text-primary-foreground disabled:opacity-50" onClick={async () => {
      setBusy(true);
      try {
        const response = await fetch("/api/admin/applications", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ reference, action: "ai-adjust", changeRequest: request }) });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Kunde inte skapa version");
        setStatus("Ny version skapad. Granska previewen innan kundutskick.");
        if (result.application?.preview_url) window.open(result.application.preview_url, "_blank", "noopener,noreferrer");
      } catch (error) { setStatus(error instanceof Error ? error.message : "Ett fel uppstod"); }
      finally { setBusy(false); }
    }}>{busy ? "Genererar..." : "Testa med vår AI"}</button>
      <button type="button" disabled={!request.trim()} className="rounded bg-primary p-2 text-sm text-primary-foreground disabled:opacity-50" onClick={async () => { try {
        await navigator.clipboard.writeText(brief);
        const response = await fetch("/api/admin/applications", { method: "POST", headers: { "Content-Type": "application/json", "x-admin-key": adminKey }, body: JSON.stringify({ reference, action: "prepare-lovable", changeRequest: request }) });
        if (!response.ok) throw new Error("Kopierad men status kunde inte sparas");
        setPrepared(true);
        setStatus("Instruktionen är kopierad och registrerad. Den har INTE skickats till Lovable.");
      } catch (error) { setStatus(error instanceof Error ? error.message : "Kopiering misslyckades"); } }}>Godkänn & kopiera</button>
      <button type="button" className="rounded border p-2 text-sm" onClick={() => window.open("https://lovable.dev/", "_blank", "noopener,noreferrer")}>Öppna Lovable</button>
    </div>
    {prepared && <div role="status" className="rounded-lg border border-green-600 bg-green-950/40 p-3 text-sm text-green-200">
      <strong>✓ Lovable-demo väntar på att genereras</strong>
      <p>Instruktionen är förberedd och registrerad för {reference}. Öppna rätt Lovable-projekt och klistra in den. Ingen ny Lovable-preview har skapats ännu.</p>
    </div>}
    {status && <p role="status" className="text-xs">{status}</p>}
  </section>;
}
