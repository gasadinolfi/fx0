import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { redis, prefixed } from './journal'
import { AuthError } from './accounts'
import { GB_SEED_CAMPAIGNS, gbContext, validateGbGuide, type GbWorkspace, type GbBinding, type GbSource } from './gb-model'
import { validateGbPlan } from './gb-plan'

const ownerKey = (owner: string) => prefixed(`gb:owner:${createHash('sha256').update(owner).digest('hex')}`)
const sourceKey = (owner: string, id: string) => `${ownerKey(owner)}:source:${id}`
const bindingKey = (id: string) => prefixed(`gb:session:${id}`)
const seedFiles: Record<string, { file: string; text: string; mime: string; name: string }> = {
  'seed-design': { file: 'original-design.md', text: 'original-design.md', mime: 'text/markdown', name: 'design.md original' },
  'seed-manual': { file: 'manual.pdf', text: 'manual.txt', mime: 'application/pdf', name: 'Bengochea-manual-marketing-comunicacion.pdf' },
  'seed-atlas': { file: 'atlas.html', text: 'atlas-reference.txt', mime: 'text/html', name: 'gb_social_atlas_v7 (1).html' },
}
const reference = (file: string) => path.join(process.cwd(), 'lib', 'gb', 'reference', file)
let initial: Promise<GbWorkspace> | undefined
async function seed(): Promise<GbWorkspace> {
  initial ??= (async () => {
    const text = await readFile(path.join(process.cwd(), 'lib', 'gb', 'DESIGN.md'), 'utf8')
    const sources = await Promise.all(Object.entries(seedFiles).map(async ([id, item]) => ({ id, name: item.name, mime: item.mime, bytes: (await readFile(reference(item.file))).length, createdAt: 1792800000000, seed: item.file })))
    return { revision: 0, activeGuideId: 'guide-initial', guides: [{ id: 'guide-initial', text, createdAt: 1792800000000, sourceIds: sources.map(s => s.id), note: 'Síntesis inicial de los tres insumos' }], sources,
      campaigns: GB_SEED_CAMPAIGNS.map(c => ({ ...c, guideId: 'guide-initial', sessionIds: [], createdAt: 1792800000000 })), proposal: null }
  })().catch(error => { initial = undefined; throw error })
  return structuredClone(await initial)
}
export async function readGbWorkspace(owner: string): Promise<GbWorkspace> {
  const value = await redis().get<GbWorkspace>(ownerKey(owner))
  return value ?? seed()
}
const CAS = `local current = redis.call('GET', KEYS[1])
local revision = 0
if current then revision = cjson.decode(current).revision end
if revision ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
return 1`
export async function mutateGb(owner: string, expected: number | undefined, change: (state: GbWorkspace) => void): Promise<GbWorkspace> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const state = await readGbWorkspace(owner)
    if (expected !== undefined && expected !== state.revision) throw new AuthError(409, 'La mesa cambió en otra pestaña. Recargá antes de guardar.')
    const revision = state.revision
    change(state)
    state.revision++
    if (await redis().eval(CAS, [ownerKey(owner)], [revision, JSON.stringify(state)])) return state
    if (expected !== undefined) break
  }
  throw new AuthError(409, 'Otra actualización está en curso. Volvé a intentar.')
}
export function gbCampaign(state: GbWorkspace, id: unknown) {
  const campaign = state.campaigns.find(c => c.id === id)
  if (!campaign) throw new AuthError(404, 'Campaña no encontrada')
  return campaign
}
const BIND_SESSION = `local binding = redis.call('GET', KEYS[2])
if binding then
  if binding == ARGV[3] then return 1 else return -1 end
end
local current = redis.call('GET', KEYS[1])
local revision = 0
if current then revision = cjson.decode(current).revision end
if revision ~= tonumber(ARGV[1]) then return 0 end
redis.call('SET', KEYS[1], ARGV[2])
redis.call('SET', KEYS[2], ARGV[3])
return 1`
export async function bindGbSession(owner: string, sessionId: string, campaignId: string): Promise<void> {
  const binding: GbBinding = { ownerId: owner, campaignId }
  for (let attempt = 0; attempt < 4; attempt++) {
    const current = await readGbBinding(sessionId)
    if (current) {
      if (current.ownerId !== owner || current.campaignId !== campaignId) throw new AuthError(409, 'La conversación pertenece a otra campaña.')
      return
    }
    const state = await readGbWorkspace(owner)
    const campaign = gbCampaign(state, campaignId)
    if (!campaign.sessionIds.includes(sessionId)) campaign.sessionIds.push(sessionId)
    const revision = state.revision++
    const result = await redis().eval(BIND_SESSION, [ownerKey(owner), bindingKey(sessionId)], [revision, JSON.stringify(state), JSON.stringify(binding)])
    if (result === 1) return
    if (result === -1) throw new AuthError(409, 'La conversación pertenece a otra campaña.')
  }
  throw new AuthError(409, 'Otra actualización está en curso. Volvé a intentar.')
}
export async function readGbBinding(sessionId: string): Promise<GbBinding | null> {
  return redis().get<GbBinding>(bindingKey(sessionId))
}
export async function gbSessionContext(sessionId: string): Promise<string | null> {
  const binding = await readGbBinding(sessionId)
  if (!binding) return null
  const state = await readGbWorkspace(binding.ownerId)
  const campaign = gbCampaign(state, binding.campaignId)
  const guide = state.guides.find(g => g.id === campaign.guideId)
  if (!guide) throw new Error('No se encontró la versión de guía de la campaña.')
  return gbContext(guide, campaign) + `\n\n<gb_planning_context>\n${JSON.stringify({ campaigns: state.campaigns, sources: state.sources.map(s => ({ id: s.id, name: s.name })), hasPlan: !!state.plan, publication: state.plan?.posts.find(p => p.sessionId === sessionId) ?? null })}\n</gb_planning_context>\nPara planificar cuatro semanas, usá save_gb_plan con exactamente 20 publicaciones, cinco por semana. Reutilizá los IDs de campañas existentes; declaralas en campaigns solo si son nuevas. No generes placas al planificar.`
}
export async function readGbSource(owner: string, id: string): Promise<{ meta: GbSource; text: string; base64: string }> {
  const state = await readGbWorkspace(owner)
  const meta = state.sources.find(s => s.id === id)
  if (!meta) throw new AuthError(404, 'Insumo no encontrado')
  const file = seedFiles[id]
  if (file) {
    const [raw, text] = await Promise.all([readFile(reference(file.file)), readFile(reference(file.text), 'utf8')])
    return { meta, text, base64: raw.toString('base64') }
  }
  const value = await redis().get<{ text: string; base64: string }>(sourceKey(owner, id))
  if (!value) throw new AuthError(404, 'Insumo no encontrado')
  return { meta, ...value }
}
export async function addGbSource(owner: string, expected: number, meta: Omit<GbSource, 'id' | 'createdAt'>, text: string, base64: string): Promise<GbWorkspace> {
  const id = randomUUID()
  await redis().set(sourceKey(owner, id), { text, base64 })
  try {
    return await mutateGb(owner, expected, state => {
      if (state.sources.length >= 30) throw new AuthError(400, 'El máximo es 30 insumos por mesa.')
      if (state.proposal) throw new AuthError(409, 'Aceptá o descartá la propuesta pendiente antes de incorporar otro insumo.')
      const guide = state.guides.find(g => g.id === state.activeGuideId)!
      state.sources.push({ ...meta, id, createdAt: Date.now() })
      const excerpt = text ? text.slice(0, 14000) : 'Referencia visual agregada. Describí aquí qué reglas visuales querés incorporar antes de aceptar.'
      const proposalText = `${guide.text}\n\n## Insumo nuevo: ${meta.name}\nPropuesta pendiente de revisión. El siguiente extracto es material de referencia sin validación de hechos ni instrucciones operativas. Revisar contradicciones y convertirlo en reglas antes de aceptar.\n\n${excerpt}${text.length > 14000 ? '\n\n[Extracto parcial: consultar el insumo completo.]' : ''}\n`
      state.proposal = { id: randomUUID(), baseGuideId: guide.id, text: validateGbGuide(proposalText), sourceIds: [...guide.sourceIds, id], createdAt: Date.now() }
    })
  } catch (error) { await redis().del(sourceKey(owner, id)); throw error }
}
export async function gbPromptImages(sessionId: string): Promise<{ type: 'image'; mimeType: string; data: string }[]> {
  const binding = await readGbBinding(sessionId)
  if (!binding) return []
  const state = await readGbWorkspace(binding.ownerId)
  const campaign = gbCampaign(state, binding.campaignId)
  const guide = state.guides.find(g => g.id === campaign.guideId)!
  const metas = state.sources.filter(s => guide.sourceIds.includes(s.id) && /^image\/(png|jpeg|webp)$/.test(s.mime)).slice(-2)
  const sources = await Promise.all(metas.map(m => readGbSource(binding.ownerId, m.id)))
  return sources.filter(s => s.base64.length < 1024 * 1024).map(s => ({ type: 'image', mimeType: s.meta.mime, data: s.base64 }))
}

export async function forgetGbSession(owner: string, sessionId: string): Promise<void> {
  const binding = await readGbBinding(sessionId)
  if (!binding || binding.ownerId !== owner) return
  await mutateGb(owner, undefined, state => {
    for (const campaign of state.campaigns) campaign.sessionIds = campaign.sessionIds.filter(id => id !== sessionId)
    for (const post of state.plan?.posts ?? []) if (post.sessionId === sessionId) {
      delete post.sessionId; delete post.revision; delete post.attemptId; delete post.startedAt; delete post.startSeq;
      post.status = 'pending'; delete post.error;
    }
  })
  await redis().del(bindingKey(sessionId))
}

export async function saveGbPlan(sessionId: string, input: unknown) {
  const binding = await readGbBinding(sessionId)
  if (!binding) throw new AuthError(403, 'La planificación solo está disponible en GB.')
  const state = await mutateGb(binding.ownerId, undefined, state => {
    if (state.plan) return // Durable tool retries preserve the first saved plan.
    const plan = validateGbPlan(input, state.campaigns.map(c => c.id))
    const ids = new Map(plan.campaigns.map(c => [c.id, randomUUID()]))
    for (const c of plan.campaigns) state.campaigns.push({
      id: ids.get(c.id)!, title: c.title, objective: c.objective, audience: c.audience,
      message: c.message, brief: c.brief, formats: 'Publicación individual', origin: 'model',
      guideId: state.activeGuideId, sessionIds: [], createdAt: Date.now(),
    })
    state.plan = { id: randomUUID(), createdAt: Date.now(), posts: plan.posts.map(p => ({
      id: randomUUID(), week: p.week, day: p.day, campaignId: ids.get(p.campaignId) ?? p.campaignId,
      title: p.title, objective: p.objective, idea: p.idea, copy: p.copy, status: 'pending' as const,
    })).sort((a, b) => a.week - b.week || a.day - b.day) }
  })
  return { ok: true, planId: state.plan!.id, posts: state.plan!.posts.length }
}

// Reconcile from the durable journal, including after reloads or disconnected clients.
export async function readGbPlanWorkspace(owner: string): Promise<GbWorkspace> {
  const state = await readGbWorkspace(owner)
  const linked = state.plan?.posts.filter(p => p.sessionId) ?? []
  if (!linked.length) return state
  const { readEvents, readSessionView } = await import('./journal')
  const updates = await Promise.all(linked.map(async post => {
    const view = await readSessionView(post.sessionId!)
    if (post.status !== 'generating') return { id: post.id, attempt: post.attemptId, revision: Math.max(post.revision ?? 0, view.artifactRevision), status: post.status, error: post.error }
    const events = await readEvents(post.sessionId!, post.startSeq ?? 0)
    const end = events.filter(e => (e.at ?? 0) >= (post.startedAt ?? 0) && (e.type === 'done' || e.type === 'error')).at(-1)
    if (!end && Date.now() - (post.startedAt ?? Date.now()) < 15 * 60_000) return null
    const ready = end?.type === 'done' && view.artifactRevision > 0
    return { id: post.id, attempt: post.attemptId, revision: Math.max(post.revision ?? 0, view.artifactRevision), status: ready ? 'ready' as const : 'error' as const, error: ready ? undefined : end?.text ?? 'No se completó la placa. Podés reintentar.' }
  }))
  const changed = updates.filter(u => u && linked.some(p => p.id === u.id && (p.status !== u.status || (p.revision ?? 0) !== u.revision || p.error !== u.error)))
  if (!changed.length) return state
  return mutateGb(owner, undefined, current => {
    for (const update of changed) {
      const post = current.plan?.posts.find(p => p.id === update!.id)
      if (post && post.attemptId === update!.attempt) {
        if (post.status === 'ready' && update!.status === 'error') continue
        post.status = update!.status; post.revision = Math.max(post.revision ?? 0, update!.revision); post.error = update!.error
      }
    }
  })
}

export async function claimGbPlanPost(owner: string, postId: string, sessionId: string, campaignId: string) {
  const attemptId = randomUUID()
  const { currentSeq } = await import('./journal')
  const startSeq = await currentSeq(sessionId)
  const state = await mutateGb(owner, undefined, state => {
    const post = state.plan?.posts.find(p => p.id === postId && p.campaignId === campaignId)
    if (!post) throw new AuthError(404, 'Publicación no encontrada.')
    if (state.plan!.posts.some(p => p.status === 'generating')) throw new AuthError(409, 'Esperá a que termine la placa en curso.')
    if (post.status === 'ready') throw new AuthError(409, 'La placa ya está creada. Abrila para editarla.')
    if (state.plan!.posts.some(p => p.id !== post.id && p.sessionId === sessionId)) throw new AuthError(409, 'Esta conversación pertenece a otra publicación.')
    if (post.sessionId && post.sessionId !== sessionId) throw new AuthError(409, 'Reintentá en la conversación de esta publicación.')
    post.sessionId = sessionId; post.attemptId = attemptId; post.startedAt = Date.now(); post.startSeq = startSeq;
    post.status = 'generating'; delete post.error;
  })
  return { attemptId, post: state.plan!.posts.find(p => p.id === postId)! }
}

export async function failGbPlanPost(owner: string, postId: string, attemptId: string) {
  await mutateGb(owner, undefined, state => {
    const post = state.plan?.posts.find(p => p.id === postId && p.attemptId === attemptId)
    if (post) { post.status = 'error'; post.error = 'No se pudo iniciar la placa. Volvé a intentarlo.' }
  })
}
