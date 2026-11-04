'use client'

import { useState } from 'react'

/** Admin-only component. Render only after server-side authorization. */
export function LovableFallbackActions({ orderNumber, buildBrief }: { orderNumber: string; buildBrief: string }) {
  const [copied, setCopied] = useState(false)
  const [message, setMessage] = useState('')
  const valid = /^ORD-[A-Z0-9]{4,20}$/.test(orderNumber) && buildBrief.trim().length > 0
  const prompt = [
    'Du är byggansvarig för Din Webbpartner.',
    'Bygg hemsidan för order ' + orderNumber + ' med min anslutna Lovable-integration.',
    'Skapa eller använd rätt projekt, kontrollera resultatet och rapportera projekt-ID, commit SHA, preview-URL, designidé och komplett fillista för återimport till samma order.',
    'Publicera inte, skicka inga kundmejl och ändra ingen produktionsdatabas utan mitt godkännande.',
    'Här är den granskade bygginstruktionen:', buildBrief,
  ].join('\\n\\n')
  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(prompt)
      setCopied(true)
      setMessage('Instruktionen kopierad. Klistra in den i ChatGPT eller Lovable.')
    } catch {
      setMessage('Kopiering misslyckades. Kontrollera webbläsarens behörigheter.')
    }
  }
  function openChatGPT() {
    // Do not place customer details in the URL; paste the brief after opening.
    window.open('https://chatgpt.com/', '_blank', 'noopener,noreferrer')
    setMessage('ChatGPT öppnad. Kopiera och klistra in instruktionen för att starta bygget.')
  }
  function openLovable() {
    window.open('https://lovable.dev/', '_blank', 'noopener,noreferrer')
    setMessage('Lovable öppnad. Kopiera och klistra in instruktionen för att starta bygget.')
  }
  return (
    <section aria-label="Reservbygge via Lovable" className="rounded-xl border p-4 space-y-3">
      <h3 className="font-semibold">Reservbygge – {orderNumber}</h3>
      <p className="text-sm">Använd när den automatiska designen inte når kvalitetsgränsen eller behöver byggas om. Kopiera instruktionen eller öppna ChatGPT. Ingen kundinformation skickas i länkarna.</p>
      <div className="flex flex-wrap gap-2">
        <button type="button" disabled={!valid} onClick={copyBrief} className="rounded-lg border px-3 py-2">{copied ? 'Kopiera igen' : 'Kopiera bygginstruktion'}</button>
        <button type="button" disabled={!valid} onClick={openChatGPT} className="rounded-lg border px-3 py-2">Be ChatGPT bygga</button>
        <button type="button" disabled={!valid} onClick={openLovable} className="rounded-lg border px-3 py-2">Öppna i Lovable</button>
      </div>
      {message && <p role="status" className="text-sm">{message}</p>}
    </section>
  )
}
