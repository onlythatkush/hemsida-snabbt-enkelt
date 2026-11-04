'use client'
import { useState } from 'react'
import { peterLovableImport } from '@/lib/lovable/peter-import'

type Props = { reference: string; adminKey: string }
export function LovableImportForm({ reference, adminKey }: Props) {
  const example = reference === peterLovableImport.reference ? peterLovableImport : null
  const [projectId, setProjectId] = useState(example?.lovableProjectId ?? '')
  const [commit, setCommit] = useState(example?.lovableCommit ?? '')
  const [previewUrl, setPreviewUrl] = useState(example?.previewUrl ?? '')
  const [brief, setBrief] = useState<string>(example?.designBrief ?? '')
  const [metadata, setMetadata] = useState(example ? JSON.stringify(example.designMetadata, null, 2) : '{}')
  const [files, setFiles] = useState(example ? JSON.stringify(example.files, null, 2) : '[]')
  const [archive, setArchive] = useState<File | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  async function generateDemo() {
    setBusy(true); setMessage('')
    try {
      const response = await fetch('/api/admin/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ reference, action: 'lovable-demo' }),
      })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error || 'Kunde inte skapa Lovable-demo')
      setMessage('Kundkopplad förhandsgranskning skapad.')
      if (result.application?.preview_url) window.open(result.application.preview_url, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Kunde inte skapa demo')
    } finally { setBusy(false) }
  }
  async function save() {
    setBusy(true); setMessage('')
    try {
      const payload = {
        reference, lovableProjectId: projectId.trim(), lovableCommit: commit.trim(),
        previewUrl: previewUrl.trim(), designBrief: brief.trim(),
        designMetadata: JSON.parse(metadata), files: JSON.parse(files),
      }
      const response = await fetch('/api/admin/lovable-import', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(payload),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(body.error || 'Kunde inte spara')
      setMessage('Projektinformation sparad. Källkod och bilder måste fortfarande importeras separat.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Fel vid import')
    } finally { setBusy(false) }
  }
  async function uploadArchive() {
    if (!archive) return
    setBusy(true)
    try {
      const form = new FormData()
      form.append('reference', reference)
      form.append('commit', commit.trim())
      form.append('archive', archive)
      const res = await fetch('/api/admin/lovable-import', { method: 'PUT', headers: { 'x-admin-key': adminKey }, body: form })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Upload failed')
      setMessage('ZIP sparad privat på ordern.')
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Fel') }
    finally { setBusy(false) }
  }
  return <section className="rounded-lg border p-3 space-y-3">
    <div className="font-medium">Lovable-demo · {reference}</div>

    <button type="button" disabled={busy} onClick={generateDemo} className="w-full rounded-lg border px-3 py-3 font-semibold disabled:opacity-50">Generera Lovable-demo</button>\n    <details className="rounded-lg border border-white/10 p-3">\n      <summary className="cursor-pointer text-sm text-muted-foreground">Visa avancerade inställningar</summary>\n      <div className="grid gap-2 pt-3">
      <label className="text-xs">Lovable projekt-ID<input className="w-full rounded border p-2" value={projectId} onChange={e => setProjectId(e.target.value)} placeholder="UUID" /></label>
      <label className="text-xs">Commit SHA<input className="w-full rounded border p-2" value={commit} onChange={e => setCommit(e.target.value)} placeholder="40 tecken" /></label>
      <label className="text-xs">Lovable preview-URL<input className="w-full rounded border p-2" value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} placeholder="https://" /></label>
      <label className="text-xs">Designidé och bygginstruktion<textarea className="w-full rounded border p-2" rows={4} value={brief} onChange={e => setBrief(e.target.value)} /></label>
      <label className="text-xs">Designmetadata (JSON)<textarea className="w-full rounded border p-2 font-mono" rows={3} value={metadata} onChange={e => setMetadata(e.target.value)} /></label>
      <label className="text-xs">Fillista (JSON)<textarea className="w-full rounded border p-2 font-mono" rows={3} value={files} onChange={e => setFiles(e.target.value)} /></label>
      <button type="button" disabled={busy} onClick={save} className="rounded border px-3 py-2 text-sm disabled:opacity-50">{busy ? 'Sparar…' : 'Spara Lovable-projektinformation'}</button>
      <input type="file" accept=".zip" onChange={e => setArchive(e.target.files?.[0] ?? null)} />
      <button type="button" disabled={busy || !archive} onClick={uploadArchive}>Spara ZIP på ordern</button>
      {message && <p role="status" className="text-xs">{message}</p>}
      </div>
    </details>
  </section>
}
