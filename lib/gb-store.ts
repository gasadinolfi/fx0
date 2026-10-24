import { createHash, randomUUID } from 'node:crypto'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { redis, prefixed } from './journal'
import { AuthError } from './accounts'
import { GB_SEED_CAMPAIGNS, gbContext, validateGbGuide, type GbWorkspace, type GbBinding, type GbSource } from './gb-model'

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
  return gbContext(guide, campaign)
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
  })
  await redis().del(bindingKey(sessionId))
}
