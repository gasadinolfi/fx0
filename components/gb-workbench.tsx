'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { GB_ACTIONS, GB_SEED_CAMPAIGNS, type GbWorkspace, type GbSource } from '../lib/gb-model'
import { fetchUi } from './auth-ui'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'
import { Skeleton } from './ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from './ui/sheet'
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs'
import Markdown from './markdown'
import { GB_PALETTE, GB_PALETTE_POLICY, gbGuideDownload } from '../lib/gb-palette'
import GbAtlasPoster, { GB_ATLAS_BACKGROUNDS } from './gb-atlas-poster'
import SocialFormatPicker from './social-format-picker'
import { SOCIAL_FORMATS, socialPrompt, validSocialSize, type SocialFormat } from '../lib/social-formats'

export interface GbSelection { sessionId: string; campaignId: string | null }
interface Props {
  sessionId: string; busy: boolean; empty: boolean; enabled: boolean; hasDesign?: boolean;
  onFormat?: (format: SocialFormat) => void;
  onOpenPlan?: () => void; planOpen?: boolean;
  onContext: (selection: GbSelection) => void; onNew: () => void; onSend: (text: string) => unknown;
}
export default function GbWorkbench({ sessionId, busy, empty, enabled, hasDesign = false, onFormat, onOpenPlan, planOpen, onContext, onNew, onSend }: Props) {
  const [state, setState] = useState<GbWorkspace | null>(null)
  const [campaignId, setCampaignId] = useState('entender')
  const [socialFormat, setSocialFormat] = useState<SocialFormat>(SOCIAL_FORMATS[0])
  useEffect(() => { if (enabled) onFormat?.(socialFormat) }, [enabled, socialFormat, onFormat])
  const lastAutoFormat = useRef<string | null>(null)
  useEffect(() => { lastAutoFormat.current = null }, [sessionId])
  const [loadedFor, setLoadedFor] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [tab, setTab] = useState('guide')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [edit, setEdit] = useState('')
  const [editing, setEditing] = useState(false)
  const [source, setSource] = useState<{ meta: GbSource; text: string; base64?: string } | null>(null)
  const [sourceLoading, setSourceLoading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)
  const selected = state?.campaigns.find(c => c.id === campaignId)
  const guide = state?.guides.find(g => g.id === (selected?.guideId ?? state.activeGuideId))
  const activeGuide = state?.guides.find(g => g.id === state.activeGuideId)
  const ready = enabled && loadedFor === sessionId && !!selected && !saving
  const refresh = useCallback(async (signal?: AbortSignal) => {
    if (!enabled) return
    onContext({ sessionId, campaignId: null })
    const response = await fetchUi(`/api/gb?session=${encodeURIComponent(sessionId)}`, { signal })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'No se pudo abrir la mesa.')
    const next = data.state as GbWorkspace
    const requested = new URLSearchParams(window.location.search).get('c')
    const id = data.campaignId ?? (next.campaigns.some(c => c.id === requested) ? requested : 'entender')
    setState(next); setCampaignId(id); setLoadedFor(sessionId); setError('')
    setEdit(next.proposal?.text ?? next.guides.find(g => g.id === next.activeGuideId)!.text)
    onContext({ sessionId, campaignId: id })
  }, [enabled, sessionId, onContext])
  useEffect(() => {
    const controller = new AbortController()
    void refresh(controller.signal).catch(error => { if (!controller.signal.aborted) setError(error.message) })
    return () => controller.abort()
  }, [refresh])
  useEffect(() => { if (!enabled) { setState(null); setSource(null); setOpen(false); setLoadedFor(null) } }, [enabled])

  async function mutate(action: Record<string, unknown>) {
    if (!state || saving) return null
    setSaving(true); setError('')
    try {
      const response = await fetchUi('/api/gb', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ ...action, revision: state.revision }) })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'No se pudo guardar.')
      const next = data.state as GbWorkspace
      setState(next); setEdit(next.proposal?.text ?? next.guides.find(g => g.id === next.activeGuideId)!.text)
      setEditing(false)
      return next
    } catch (error) { setError((error as Error).message); return null } finally { setSaving(false) }
  }
  function adaptFormat(format: SocialFormat, automatic = false) {
    if (!hasDesign || busy || !ready || !validSocialSize(format)) return
    const key = `${sessionId}:${format.id}:${format.width}:${format.height}`
    if (automatic && lastAutoFormat.current === key) return
    const accepted = onSend(socialPrompt('Adaptá automáticamente la pieza visual actual al formato seleccionado. Usá exclusivamente azul oscuro #03065E, celeste #13B4D8 y blanco #FFFFFF. Los tres están permitidos como fondo.', format, true))
    if (accepted !== false) { lastAutoFormat.current = key; setError('') }
    else setError('No se pudo iniciar la adaptación. Volvé a intentarlo cuando termine la operación actual.')
  }
  function changeFormat(format: SocialFormat | null) {
    if (!format || busy || !ready) return
    const changed = format.id !== socialFormat.id || format.width !== socialFormat.width || format.height !== socialFormat.height
    setSocialFormat(format)
    if (changed && format.id !== 'custom') adaptFormat(format, true)
  }
  function choose(id: string) {
    if (busy || saving) return
    const url = new URL(window.location.href); url.searchParams.set('c', id); window.history.replaceState(null, '', url)
    if (sessionId !== 'draft') onNew()
    setCampaignId(id); setLoadedFor('draft'); onContext({ sessionId: 'draft', campaignId: id })
  }
  async function upload(file: File) {
    if (!state || saving) return
    setSaving(true); setError('')
    try {
      if (file.size > 3 * 1024 * 1024) throw new Error('El archivo debe ser menor de 3 MB; las imágenes, de 700 KB.')
      const form = new FormData(); form.set('file', file); form.set('revision', String(state.revision))
      const response = await fetchUi('/api/gb', { method: 'POST', body: form })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'No se pudo incorporar el insumo.')
      setState(data.state); setEdit(data.state.proposal.text); setTab('review'); setSource(null)
    } catch (error) { setError((error as Error).message) } finally { setSaving(false) }
  }
  async function viewSource(id: string) {
    setSourceLoading(true); setError(''); setSource(null)
    try {
      const response = await fetchUi(`/api/gb?source=${encodeURIComponent(id)}`)
      const data = await response.json()
      if (!response.ok) throw new Error(data.error ?? 'No se pudo leer el insumo.')
      setSource(data)
    } catch (error) { setError((error as Error).message) } finally { setSourceLoading(false) }
  }
  function downloadGuide() {
    if (!guide) return
    const url = URL.createObjectURL(new Blob([gbGuideDownload(guide.text)], { type: 'text/markdown;charset=utf-8' }))
    const a = document.createElement('a'); a.href = url; a.download = 'DESIGN.md'; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000)
  }
  async function createCampaign(form: FormData) {
    const next = await mutate({ action: 'campaign', ...Object.fromEntries(form) })
    if (next) { choose(next.campaigns.at(-1)!.id); setOpen(false) }
  }
  function panel(next: string) { setTab(next); setOpen(true) }
  if (!enabled) return null
  return <section aria-label="Mesa de trabajo de Bengochea" className="gb-workbench border-b border-border px-4 py-4 sm:px-5">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-center gap-3"><span className="gb-monogram" aria-hidden="true">GB</span><div><p className="text-sm font-semibold tracking-wide">BENGOCHEA</p><p className="text-xs text-muted-foreground">Mesa de trabajo · Privada</p></div></div>
      {onOpenPlan && <Button id="gb-plan-toggle" variant={planOpen ? 'secondary' : 'default'} size="sm" aria-expanded={planOpen} onClick={onOpenPlan}>Plan de 4 semanas</Button>}
      <Button variant="ghost" size="sm" onClick={() => panel('guide')}>Guía e insumos{state?.proposal ? ' · 1 propuesta' : ''}</Button>
    </div>
    {!state ? <div className="py-5"><Skeleton className="h-8 w-4/5" /><Button variant="ghost" size="sm" onClick={() => void refresh().catch(e => setError(e.message))}>Volver a cargar</Button></div> : <>
      <div className="mt-3"><SocialFormatPicker value={socialFormat} onChange={changeFormat} onCommit={value => { if (value) adaptFormat(value, true) }} disabled={!ready || busy} /></div>
      {hasDesign && <p className="mt-2 text-xs text-muted-foreground">Cambiar red o formato adapta automáticamente la pieza. Las medidas personalizadas se aplican al terminar de editarlas.</p>}
      {selected && <details className="mt-4 border-t border-border pt-3"><summary className="cursor-pointer text-sm font-medium">Crear una pieza fuera del plan</summary><p className="mt-2 text-xs leading-5 text-muted-foreground">Estas acciones crean contenido suelto en esta conversación. Las 20 publicaciones del plan se generan desde la columna «Plan de 4 semanas».</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <label className="sr-only" htmlFor="gb-campaign">Campaña</label>
          <select id="gb-campaign" value={campaignId} disabled={!ready || busy} onChange={e => choose(e.target.value)} className="min-h-9 min-w-0 max-w-full flex-1 border border-input bg-background px-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring">
            {state.campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <Button variant="outline" size="sm" disabled={!ready || busy} onClick={() => panel('campaigns')}>Nueva campaña</Button>
        </div>
        {empty ? <div className="gb-intro py-7"><p className="mb-3 text-xs uppercase tracking-[0.18em] text-muted-foreground">{selected.page ? `Propuesta del manual · Página ${selected.page}` : 'Campaña propia'}</p><h2 className="max-w-lg text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">{selected.title}</h2><p className="mt-4 max-w-lg text-sm leading-6 text-muted-foreground">{selected.message} {selected.objective}</p></div> : <p className="mt-3 text-xs text-muted-foreground">{selected.message}</p>}
        <div className="mt-3 grid grid-cols-2 gap-2">{GB_ACTIONS.map((action, i) => <Button key={action.label} variant={i === 0 ? 'default' : 'outline'} disabled={!ready || busy || !validSocialSize(socialFormat)} className="h-auto min-h-10 justify-start whitespace-normal text-left text-xs sm:text-sm" onClick={() => onSend(i < 2 ? socialPrompt(action.prompt, socialFormat) : action.prompt)}>{action.label}<span className="ml-auto" aria-hidden="true">↗</span></Button>)}</div>
        {hasDesign && <Button variant="outline" size="sm" className="mt-3" disabled={!ready || busy || !validSocialSize(socialFormat)} onClick={() => adaptFormat(socialFormat)}>Adaptar pieza a este formato</Button>}
        {selected.guideId !== state.activeGuideId && <div className="mt-3 flex flex-wrap items-center gap-2"><p className="text-xs text-muted-foreground">Esta campaña conserva una guía anterior.</p><Button variant="ghost" size="sm" disabled={saving || busy} onClick={() => void mutate({ action: 'adopt', campaignId })}>Adoptar guía vigente</Button></div>}
      </details>}
    </>}
    {error && <div role="alert" className="mt-3 text-sm text-destructive">{error} <Button variant="ghost" size="sm" onClick={() => void refresh().catch(e => setError(e.message))}>Recargar</Button></div>}
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="w-[min(96vw,760px)]">
      <SheetHeader className="border-b border-border p-5"><div className="flex items-center justify-between"><SheetTitle>Contexto de Bengochea</SheetTitle><SheetClose asChild><Button variant="ghost" size="sm">Cerrar</Button></SheetClose></div><SheetDescription>Guía, referencias y campañas de tu cuenta.</SheetDescription></SheetHeader>
      {state && <Tabs value={tab} onValueChange={setTab} className="flex min-h-0 flex-1 flex-col gap-4 p-5">
        <TabsList className="h-auto flex-wrap justify-start"><TabsTrigger value="guide">Guía</TabsTrigger><TabsTrigger value="sources">Insumos</TabsTrigger><TabsTrigger value="review">Revisión{state.proposal ? ' · 1' : ''}</TabsTrigger><TabsTrigger value="campaigns">Campañas</TabsTrigger></TabsList>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="min-h-0 flex-1 overflow-y-auto">
          <TabsContent value="guide" className="flex flex-col gap-4">
            <p className="text-xs text-muted-foreground">Versión de la campaña: {state.guides.findIndex(g => g.id === guide?.id) + 1}. Las nuevas campañas usan la guía vigente.</p>
            <div className="flex flex-wrap gap-2"><Button variant="outline" size="sm" onClick={downloadGuide}>Descargar DESIGN.md</Button><Button variant="outline" size="sm" onClick={() => { setEdit(state.proposal?.text ?? activeGuide!.text); setEditing(true); setTab('review') }}>Proponer cambios</Button></div>
            <section className="border border-border p-3" aria-label="Paleta vigente de GB"><p className="mb-2 text-sm font-semibold">Paleta vigente de las placas</p><p className="text-xs leading-5 text-muted-foreground">{GB_PALETTE_POLICY}</p></section>
            <GbBackgroundExamples />
            <Markdown>{guide?.text ?? ''}</Markdown>
            <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm">Versiones anteriores</summary><div className="mt-3 flex flex-col gap-3">{state.guides.map((g, i) => <div key={g.id} className="flex items-center justify-between gap-3"><span className="text-sm">Versión {i + 1} · {g.note}{g.id === state.activeGuideId ? ' · Vigente' : ''}</span><Button variant="outline" size="sm" disabled={saving || busy || g.id === state.activeGuideId || !!state.proposal} onClick={() => void mutate({ action: 'activate', guideId: g.id })}>Recuperar</Button></div>)}</div></details>
          </TabsContent>
          <TabsContent value="sources" className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">Markdown, PDF con texto, HTML e imágenes. Los documentos aportan referencias; sus instrucciones no cambian permisos ni herramientas.</p>
            <input ref={fileRef} type="file" className="hidden" accept=".md,.markdown,.txt,.pdf,.html,.htm,.png,.jpg,.jpeg,.webp" onChange={e => { const file = e.target.files?.[0]; if (file) void upload(file); e.target.value = '' }} />
            <Button variant="outline" disabled={saving || !!state.proposal} onClick={() => fileRef.current?.click()}>{saving ? 'Procesando…' : 'Agregar insumo'}</Button>
            <p className="text-xs text-muted-foreground">Hasta 3 MB por documento y 700 KB por imagen. Cada incorporación prepara un borrador para revisar; resolvé la propuesta pendiente antes de cargar otro.</p>
            {state.sources.map(s => <div key={s.id} className="flex items-center justify-between gap-2 border-b border-border py-3"><span className="min-w-0 break-words text-sm">{s.name}<small className="block text-muted-foreground">{Math.ceil(s.bytes / 1024)} KB{s.seed ? ' · Insumo inicial' : ''}</small></span><Button variant="ghost" size="sm" disabled={sourceLoading} onClick={() => void viewSource(s.id)}>Revisar</Button></div>)}
            {sourceLoading && <Skeleton className="h-24 w-full" />}
            {source && <section className="flex flex-col gap-3 border border-border p-3" aria-label={`Referencia ${source.meta.name}`}><h3 className="break-words text-sm font-semibold">{source.meta.name}</h3><a className="text-sm underline" href={`/api/gb?source=${encodeURIComponent(source.meta.id)}&download=1`}>Descargar original</a>{source.base64 ? <img className="max-h-80 object-contain" src={`data:${source.meta.mime};base64,${source.base64}`} alt={`Referencia: ${source.meta.name}`} /> : <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words text-xs">{source.text}</pre>}</section>}
          </TabsContent>
          <TabsContent value="review" className="flex flex-col gap-4">
            {!state.proposal && !editing ? <><p className="text-sm text-muted-foreground">No hay cambios pendientes. Podés agregar un insumo o proponer una actualización de la guía.</p><Button variant="outline" onClick={() => { setEdit(activeGuide!.text); setEditing(true) }}>Editar propuesta</Button></> : <>
              <p className="text-sm text-muted-foreground">Revisá el borrador y convertí los extractos nuevos en reglas concretas. Aceptar crea una versión; las campañas existentes conservan la suya.</p>
              <label htmlFor="gb-guide-edit" className="text-sm font-medium">Guía propuesta</label><Textarea id="gb-guide-edit" value={edit} onChange={e => setEdit(e.target.value)} className="min-h-72 font-mono text-xs" />
              <details open><summary className="cursor-pointer text-sm">Comparar con la guía vigente</summary><GuideComparison before={activeGuide?.text ?? ''} after={edit} /></details>
              <div className="flex flex-wrap gap-2">{state.proposal ? <><Button disabled={saving || !edit.trim()} onClick={() => void mutate({ action: 'accept', proposalId: state.proposal!.id, text: edit })}>Aceptar nueva versión</Button><Button variant="outline" disabled={saving} onClick={() => void mutate({ action: 'discard' })}>Descartar propuesta</Button></> : <Button disabled={saving || edit === activeGuide?.text || !edit.trim()} onClick={() => void mutate({ action: 'propose', text: edit })}>Guardar para revisión</Button>}</div>
            </>}
          </TabsContent>
          <TabsContent value="campaigns" className="flex flex-col gap-5">
            <form action={form => void createCampaign(form)} className="flex flex-col gap-3"><fieldset disabled={saving || busy} className="flex flex-col gap-3"><legend className="mb-3 text-sm font-semibold">Nueva campaña</legend>{[['title','Nombre'],['objective','Objetivo'],['audience','Público'],['message','Idea central'],['brief','Brief y referencias']].map(([name,label]) => <label key={name} className="flex flex-col gap-1 text-sm" htmlFor={`gb-new-${name}`}>{label}<Textarea id={`gb-new-${name}`} name={name} required maxLength={name === 'brief' ? 6000 : 500} rows={name === 'brief' ? 3 : 1} /></label>)}<Button type="submit">Crear campaña y abrir mesa</Button></fieldset></form>
            <div className="flex flex-col gap-4">{state.campaigns.map(c => <section key={c.id} className="border-t border-border pt-4"><h3 className="text-sm font-semibold">{c.title}</h3><p className="mt-1 text-xs leading-5 text-muted-foreground">{c.objective} {c.audience}</p><div className="mt-2 flex flex-wrap gap-2"><Button variant="outline" size="sm" disabled={busy || saving} onClick={() => { choose(c.id); setOpen(false) }}>Crear en esta campaña</Button>{c.sessionIds.map((id, i) => <a key={id} className="px-2 py-1 text-xs underline" href={`/gb?s=${encodeURIComponent(id)}`}>Conversación {i + 1}</a>)}</div></section>)}</div>
          </TabsContent>
        </div>
      </Tabs>}
    </SheetContent></Sheet>
  </section>
}
export function GbBackgroundExamples() {
  return <section aria-label="Comparación de fondos de GB" className="flex flex-col gap-4">
    <p className="text-xs leading-5 text-muted-foreground">Misma placa, tres fondos permitidos. Ninguno es obligatorio para todas las publicaciones.</p>
    {GB_ATLAS_BACKGROUNDS.map(variant => <figure key={variant.name} className="flex flex-col gap-2">
      <GbAtlasPoster variant={variant} />
      <figcaption className="text-xs text-muted-foreground">{variant.name} · {variant.background}</figcaption>
    </figure>)}
  </section>
}
function GuideComparison({ before, after }: { before: string; after: string }) {
  const a = before.split('\n'), b = after.split('\n')
  let start = 0, end = 0
  while (start < Math.min(a.length, b.length) && a[start] === b[start]) start++
  while (end < Math.min(a.length, b.length) - start && a[a.length - 1 - end] === b[b.length - 1 - end]) end++
  const removed = a.slice(start, a.length - end).join('\n'), added = b.slice(start, b.length - end).join('\n')
  return <div className="mt-3 grid gap-3 text-xs"><p className="text-muted-foreground">{start} líneas iniciales y {end} líneas finales sin cambios.</p>{removed && <div className="border border-border p-3"><p className="mb-2 font-semibold">− Texto anterior</p><pre className="whitespace-pre-wrap break-words">{removed}</pre></div>}{added && <div className="border border-primary p-3"><p className="mb-2 font-semibold">+ Texto propuesto</p><pre className="whitespace-pre-wrap break-words">{added}</pre></div>}{!removed && !added && <p>Sin diferencias.</p>}</div>
}

export function GbEmptyPreview({ campaignId }: { campaignId: string | null }) {
  const title = GB_SEED_CAMPAIGNS.find(c => c.id === campaignId)?.title ?? 'Tu próxima idea'
  return <div className="flex flex-col gap-5" aria-label="Referencia visual de GB">
    <div style={{ backgroundColor: GB_PALETTE.background, color: GB_PALETTE.text }} className="gb-reference-poster overflow-hidden border border-border">
      <GbAtlasPoster title={title} />
    </div>
    <p className="text-xs leading-5 text-muted-foreground">Referencia de estilo. Elegí una acción o contá tu idea; la pieza que creemos aparecerá acá.</p>
  </div>
}
