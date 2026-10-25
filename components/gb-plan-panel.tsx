'use client'

import { useCallback, useEffect, useState } from 'react'
import { fetchUi } from './auth-ui'
import type { GbWorkspace } from '../lib/gb-model'
import type { GbPlanPost } from '../lib/gb-plan'
import { GB_PLAN_PROMPT } from '../lib/gb-plan'
import { SOCIAL_FORMATS, validSocialSize, type SocialFormat } from '../lib/social-formats'
import { Button } from './ui/button'
import { Skeleton } from './ui/skeleton'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetClose } from './ui/sheet'
import { GbBackgroundExamples } from './gb-workbench'

const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes']
const STATUS = { pending: 'Pendiente', generating: 'Generando…', ready: 'Lista', error: 'Error' }

export default function GbPlanPanel({ open, onOpenChange, busy, format, onGeneratePlan }: {
  open: boolean; onOpenChange: (value: boolean) => void; busy: boolean;
  format?: SocialFormat | null; onGeneratePlan: (prompt: string) => unknown;
}) {
  const [state, setState] = useState<GbWorkspace | null>(null)
  const [error, setError] = useState('')
  const [loadError, setLoadError] = useState('')
  const [sending, setSending] = useState(false)
  const [wide, setWide] = useState(false)
  const [planning, setPlanning] = useState(false)
  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)')
    const update = () => setWide(media.matches)
    update(); media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  const refresh = useCallback(async (signal?: AbortSignal) => {
    const response = await fetchUi('/api/gb', { signal })
    const data = await response.json()
    if (!response.ok) throw new Error(data.error ?? 'No se pudo cargar el plan.')
    setState(data.state); setLoadError('')
    if (data.state.plan) setPlanning(false)
  }, [])
  useEffect(() => {
    if (!open) return
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout>
    async function poll() {
      try { await refresh(controller.signal) } catch (error) { if (!controller.signal.aborted) setLoadError((error as Error).message) }
      if (!controller.signal.aborted) timer = setTimeout(poll, 5000)
    }
    void poll()
    return () => { controller.abort(); clearTimeout(timer) }
  }, [open, refresh])
  useEffect(() => { if (!busy) setPlanning(false) }, [busy])

  async function generate(post: GbPlanPost) {
    if (sending || busy || !validSocialSize(format ?? SOCIAL_FORMATS[0])) return
    setSending(true); setError('')
    try {
      const response = await fetchUi(`/api/prompt?session=${encodeURIComponent(post.sessionId ?? 'new')}`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ text: 'Generar placa del plan', clientId: crypto.randomUUID(), gb: { campaignId: post.campaignId, postId: post.id, format: format ?? SOCIAL_FORMATS[0] } }),
      })
      if (!response.ok) { const data = await response.json(); throw new Error(data.error ?? 'No se pudo iniciar la placa.') }
      const session = response.headers.get('x-fx0-session') ?? post.sessionId
      if (!session) throw new Error('No se recibió la conversación de la placa.')
      // The admitted turn continues through the existing durable followChat worker.
      await response.body?.cancel()
      window.location.assign(`/gb?s=${encodeURIComponent(session)}&view=preview`)
    } catch (error) { setError((error as Error).message); void refresh().catch(() => {}) }
    finally { setSending(false) }
  }
  const content = <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto p-4">
    {(error || loadError) && <div role="alert" className="text-sm text-destructive">{error || loadError}<Button variant="ghost" size="sm" onClick={() => void refresh().then(() => setError('')).catch(e => setLoadError(e.message))}>Reintentar carga</Button></div>}
    {!state ? <Skeleton className="h-40 w-full" /> : !state.plan ? <div className="flex flex-col gap-3">
      <p className="text-sm text-muted-foreground">Cuatro semanas, cinco publicaciones por semana. Las placas se crean cuando las pedís.</p>
      <Button disabled={busy || planning || sending} onClick={() => { if (onGeneratePlan(GB_PLAN_PROMPT) !== false) setPlanning(true) }}>{busy || planning ? 'Preparando plan…' : 'Generar plan'}</Button>
    </div> : [1, 2, 3, 4].map(week => <section key={week} aria-label={`Semana ${week}`} className="flex flex-col gap-4">
      <h3 className="text-sm font-semibold">Semana {week}</h3>
      {state.plan!.posts.filter(p => p.week === week).map(post => <article key={post.id} className="flex flex-col gap-2 border-t border-border pt-3">
        <div className="flex justify-between gap-2 text-xs text-muted-foreground"><span>{DAYS[post.day - 1]}</span><span role="status">{STATUS[post.status]}</span></div>
        <p className="text-xs text-muted-foreground">{state.campaigns.find(c => c.id === post.campaignId)?.title}{state.campaigns.find(c => c.id === post.campaignId)?.origin === 'model' ? ' · Propuesta del modelo' : ''}</p>
        <h4 className="text-sm font-semibold">{post.title}</h4>
        <p className="text-xs leading-5"><strong>Objetivo: </strong>{post.objective}</p>
        <p className="text-xs leading-5"><strong>Placa: </strong>{post.idea}</p>
        <details className="text-xs leading-5"><summary className="cursor-pointer">Copy propuesto</summary><p className="mt-2 whitespace-pre-wrap">{post.copy}</p></details>
        {!!post.revision && post.sessionId && <a href={`/gb?s=${encodeURIComponent(post.sessionId)}&view=preview`} aria-label={`Abrir placa: ${post.title}`} className="relative block overflow-hidden border border-border">
          <div className="pointer-events-none h-64 overflow-hidden" aria-hidden="true"><iframe title={`Miniatura: ${post.title}`} loading="lazy" tabIndex={-1} sandbox="allow-scripts" src={`/api/artifact-frame?session=${encodeURIComponent(post.sessionId)}&revision=${post.revision}`} className="h-[1024px] w-[1280px] origin-top-left scale-[0.25] border-0" /></div>
          <span className="block p-2 text-xs underline">Abrir placa · Editar o exportar</span>
        </a>}
        {post.error && <p role="alert" className="text-xs text-destructive">{post.error}</p>}
        {post.status !== 'ready' && <Button variant="outline" size="sm" disabled={busy || sending || state.plan!.posts.some(p => p.status === 'generating') || !validSocialSize(format ?? SOCIAL_FORMATS[0])} onClick={() => void generate(post)}>{post.status === 'generating' ? 'Generando…' : post.status === 'error' ? 'Reintentar placa' : 'Generar placa'}</Button>}
        {post.sessionId && <a className="text-xs underline" href={`/gb?s=${encodeURIComponent(post.sessionId)}&view=preview`}>Abrir conversación</a>}
      </article>)}
    </section>)}
    <details className="border-t border-border pt-4"><summary className="cursor-pointer text-sm font-medium">Comparar fondos permitidos</summary><div className="mt-4"><GbBackgroundExamples /></div></details>
  </div>
  if (!open) return null
  if (wide) return <aside aria-label="Plan de 4 semanas" className="flex min-h-0 w-[360px] shrink-0 flex-col border-l border-border bg-background">
    <div className="flex items-center justify-between gap-2 border-b border-border p-4"><h2 className="text-sm font-semibold">Plan de 4 semanas</h2><Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cerrar</Button></div>{content}
  </aside>
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent className="w-[min(100vw,360px)]"><SheetHeader className="border-b border-border p-4"><div className="flex items-center justify-between gap-2"><SheetTitle>Plan de 4 semanas</SheetTitle><SheetClose asChild><Button variant="ghost" size="sm">Cerrar</Button></SheetClose></div><SheetDescription>20 publicaciones y sus placas.</SheetDescription></SheetHeader>{content}</SheetContent></Sheet>
}
