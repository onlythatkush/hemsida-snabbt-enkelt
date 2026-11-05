'use client'
import { useEffect, useState } from 'react'
import { peterLovableImport } from '@/lib/lovable/peter-import'

/** Known Lovable projects to pre-fill. Nothing is written until an admin confirms. */
const KNOWN_ASSOCIATIONS: Record<string, { projectId: string; commit: string; previewUrl: string }> = {
  'ORD-URCZQH': {
    projectId: '45a285d5-3a58-4e1a-ba0a-b74a660dff3f',
    commit: '38415c39252e9c853755fc627fe13df5af49df8c',
    previewUrl: 'https://id-preview--45a285d5-3a58-4e1a-ba0a-b74a660dff3f.lovable.app',
  },
}
type Props = { reference: string; adminKey: string }
export function LovableImportForm({ reference, adminKey }: Props) {
  const example = reference === peterLovableImport.reference ? peterLovableImport : null
  const known = KNOWN_ASSOCIATIONS[reference]
  const [projectId, setProjectId] = useState(example?.lovableProjectId ?? known?.projectId ?? '')
  const [commit, setCommit] = useState(example?.lovableCommit ?? known?.commit ?? '')
  const [previewUrl, setPreviewUrl] = useState(example?.previewUrl ?? known?.previewUrl ?? '')
  const [build, setBuild] = useState<any>(null)
  const [buildState, setBuildState] = useState('')
  async function loadBuild() {
    const r = await fetch('/api/admin/applications?lovableBuild=' + encodeURIComponent(reference), { headers: { 'x-admin-key': adminKey } })
    const d = await r.json().catch(() => ({}))
    if (!r.ok) { setBuildState(d.error || 'Status kunde inte läsas'); return null }
    setBuild(d.build); return d.build
  }
  useEffect(() => { loadBuild() }, [reference])
  useEffect(() => {
    if (!build?.locked_until) return
    const t = setInterval(() => { loadBuild() }, 4000)
    return () => clearInterval(t)
  }, [build?.locked_until])
  async function associateProject(confirm: boolean) {
    setBusy(true); setMessage('')
    try {
      const r = await fetch('/api/admin/applications', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ reference, action: 'lovable-associate', association: { projectId: projectId.trim(), commit: commit.trim(), previewUrl: previewUrl.trim(), confirm } }) })
      const d = await r.json()
      if (!r.ok) throw new Error(d.error || 'Koppling misslyckades')
      if (d.dryRun) setMessage('Förhandsvisning (inget sparat): ' + d.wouldWrite.projectId + ' @ ' + d.wouldWrite.commit.slice(0, 12) + '. Tryck "Bekräfta koppling" för att spara.')
      else { setMessage('Projektet är kopplat till ordern.'); setBuild(d.build) }
    } catch (e) { setMessage(e instanceof Error ? e.message : 'Fel') } finally { setBusy(false) }
  }
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
      if (result.build) setBuild(result.build)
      if (!response.ok && response.status !== 202) throw new Error(result.message || result.error || 'Lovable-körningen misslyckades')
      setMessage(result.message || result.status)
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
  const verifiedRevision = reference === 'ORD-982DZR' ? {
    commit: '849f15b337f65ae6fcb537de9f66d0e470db4416',
    url: 'https://id-preview--c4c5821b-8445-4392-bd5d-b2c5cacd625f.lovable.app',
    finished: '2026-11-04 22:49'
  } : null
  return <section className="rounded-lg border p-3 space-y-3">
    <div className="font-medium">Lovable-demo · {reference}</div>
    {verifiedRevision && <div className="rounded-lg border border-emerald-600 bg-emerald-950/40 p-3 space-y-2 text-sm">
      <div className="font-bold text-emerald-300">✓ Nytt Lovable-demo klart – väntar på granskning</div>
      <p>Lovable avslutade en ljusare design den {verifiedRevision.finished}. Detta är Lovables senaste preview, ännu inte importerad som ny kundversion i Din Webbpartners databas.</p>
      <p className="text-xs">Verifierad version: {verifiedRevision.commit.slice(0, 12)}</p>
      <a className="inline-block rounded border px-3 py-2 font-medium" href={verifiedRevision.url} target="_blank" rel="noopener noreferrer">Granska nya Lovable-demon ↗</a>
    </div>}

    {buildState && <p className="text-xs text-destructive">{buildState}</p>}
    {build && <div className="rounded border p-2 text-xs space-y-1">
      <div>Status: <b>{build.status}</b>{build.locked_until ? ' · pågår…' : ''} · försök {build.attempt_count}</div>
      {build.lovable_project_id && <div>Projekt: {build.lovable_project_id}</div>}
      {build.lovable_commit && <div>Commit: {String(build.lovable_commit).slice(0, 12)}</div>}
      {build.preview_url && <a className="underline" href={build.preview_url} target="_blank" rel="noopener noreferrer">Öppna Lovable-preview ↗</a>}
      <div>Filer: {build.files_source === 'none' ? 'inga filer importerade' : build.files_source === 'manual_manifest' ? 'endast fillista (metadata), ingen källkod' : 'källkods-ZIP sparad'}</div>
      {build.last_error && <div className="text-destructive">{build.last_error}</div>}
      {build.design_brief && <details><summary className="cursor-pointer">Visa bygg-brief</summary><pre className="whitespace-pre-wrap">{build.design_brief}</pre></details>}
    </div>}
    <button type="button" disabled={busy} onClick={generateDemo} className="w-full rounded-lg border px-3 py-3 font-semibold disabled:opacity-50">Generera Lovable-demo</button> 
    {message && <p role="status" className="text-xs">{message}</p>}
    <details className="rounded-lg border border-white/10 p-3">
      <summary className="cursor-pointer text-sm text-muted-foreground">Visa avancerade inställningar</summary>
      <div className="grid gap-2 pt-3">
      <label className="text-xs">Lovable projekt-ID<input className="w-full rounded border p-2" value={projectId} onChange={e => setProjectId(e.target.value)} placeholder="UUID" /></label>
      <label className="text-xs">Commit SHA<input className="w-full rounded border p-2" value={commit} onChange={e => setCommit(e.target.value)} placeholder="40 tecken" /></label>
      <label className="text-xs">Lovable preview-URL<input className="w-full rounded border p-2" value={previewUrl} onChange={e => setPreviewUrl(e.target.value)} placeholder="https://" /></label>
      <label className="text-xs">Designidé och bygginstruktion<textarea className="w-full rounded border p-2" rows={4} value={brief} onChange={e => setBrief(e.target.value)} /></label>
      <label className="text-xs">Designmetadata (JSON)<textarea className="w-full rounded border p-2 font-mono" rows={3} value={metadata} onChange={e => setMetadata(e.target.value)} /></label>
      <label className="text-xs">Fillista (JSON)<textarea className="w-full rounded border p-2 font-mono" rows={3} value={files} onChange={e => setFiles(e.target.value)} /></label>
      <div className="flex gap-2">
        <button type="button" disabled={busy} onClick={() => associateProject(false)} className="rounded border px-3 py-2 text-sm">Förhandsvisa koppling</button>
        <button type="button" disabled={busy} onClick={() => associateProject(true)} className="rounded border px-3 py-2 text-sm">Bekräfta koppling</button>
      </div>
      <button type="button" disabled={busy} onClick={save} className="rounded border px-3 py-2 text-sm disabled:opacity-50">{busy ? 'Sparar…' : 'Spara Lovable-projektinformation'}</button>
      <input type="file" accept=".zip" onChange={e => setArchive(e.target.files?.[0] ?? null)} />
      <button type="button" disabled={busy || !archive} onClick={uploadArchive}>Spara ZIP på ordern</button>
      {message && <p role="status" className="text-xs">{message}</p>}
      </div>
    </details>
  </section>
}
