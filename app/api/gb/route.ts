import { randomUUID } from 'node:crypto'
import { withUserRoute } from '@/lib/route-auth'
import { AuthError, assertSessionOwner } from '@/lib/accounts'
import { mutateGb, readGbPlanWorkspace, gbCampaign, readGbBinding, readGbSource, addGbSource } from '@/lib/gb-store'
import { validateGbGuide, GB_MAX_FILE_BYTES } from '@/lib/gb-model'
import { extractGbUpload } from '@/lib/gb-upload'

export const maxDuration = 60
export const GET = withUserRoute(async (request, { user }) => {
  const params = new URL(request.url).searchParams
  const sourceId = params.get('source')
  if (sourceId) {
    const source = await readGbSource(user.id, sourceId)
    if (params.get('download') === '1') return new Response(Buffer.from(source.base64, 'base64'), { headers: {
      'content-type': source.meta.mime, 'content-disposition': `attachment; filename*=UTF-8''${encodeURIComponent(source.meta.name)}`,
      'x-content-type-options': 'nosniff', 'content-security-policy': "default-src 'none'; sandbox",
    } })
    // HTML is returned as extracted text in JSON. It is never rendered/executed.
    return Response.json({ ...source, base64: source.meta.mime.startsWith('image/') ? source.base64 : undefined })
  }
  const state = await readGbPlanWorkspace(user.id)
  let binding = null
  const session = params.get('session')
  if (session && session !== 'draft') {
    await assertSessionOwner(user.id, session)
    binding = await readGbBinding(session)
    if (binding && binding.ownerId !== user.id) throw new AuthError(404)
  }
  return Response.json({ state, campaignId: binding?.campaignId ?? null })
})
export const POST = withUserRoute(async (request, { user }) => {
  if (request.headers.get('content-type')?.startsWith('multipart/form-data')) {
    if (Number(request.headers.get('content-length')) > GB_MAX_FILE_BYTES + 16384) throw new AuthError(413, 'El archivo supera 3 MB.')
    const form = await request.formData()
    const file = form.get('file')
    const revision = Number(form.get('revision'))
    if (!(file instanceof File) || !Number.isSafeInteger(revision) || revision < 0) throw new AuthError(400, 'Insumo inválido')
    if (!file.size || file.size > GB_MAX_FILE_BYTES) throw new AuthError(413, 'El archivo debe tener entre 1 byte y 3 MB.')
    const bytes = new Uint8Array(await file.arrayBuffer())
    let extracted
    try { extracted = await extractGbUpload(file.name, bytes) } catch (error) { throw new AuthError(400, error instanceof Error ? error.message : 'No se pudo extraer el archivo.') }
    const name = file.name.split(/[\\/]/).at(-1)!.replace(/[\x00-\x1f]/g, '').slice(0, 160)
    return Response.json({ state: await addGbSource(user.id, revision, { name, mime: extracted.mime, bytes: bytes.length }, extracted.text, Buffer.from(bytes).toString('base64')) })
  }
  let body
  try { body = await request.json() } catch { throw new AuthError(400, 'Solicitud inválida') }
  if (!body || !Number.isSafeInteger(body.revision) || body.revision < 0) throw new AuthError(400, 'Revisión inválida')
  const state = await mutateGb(user.id, body.revision, state => {
    switch (body.action) {
      case 'campaign': {
        if (state.campaigns.length >= 40) throw new AuthError(400, 'El máximo es 40 campañas.')
        const fields = ['title', 'objective', 'audience', 'message', 'brief'] as const
        for (const field of fields) if (typeof body[field] !== 'string' || !body[field].trim() || body[field].length > (field === 'brief' ? 6000 : 500)) throw new AuthError(400, 'Completá título, objetivo, público, idea y brief.')
        state.campaigns.push({ id: randomUUID(), title: body.title.trim(), objective: body.objective.trim(), audience: body.audience.trim(), message: body.message.trim(), brief: body.brief.trim(), formats: 'A definir en la mesa de trabajo', guideId: state.activeGuideId, sessionIds: [], createdAt: Date.now() })
        break
      }
      case 'propose': {
        let text
        try { text = validateGbGuide(body.text) } catch (error) { throw new AuthError(400, (error as Error).message) }
        state.proposal = { id: randomUUID(), baseGuideId: state.activeGuideId, text, sourceIds: state.proposal?.sourceIds ?? state.guides.find(g => g.id === state.activeGuideId)!.sourceIds, createdAt: Date.now() }
        break
      }
      case 'accept': {
        const proposal = state.proposal
        if (!proposal || proposal.id !== body.proposalId || proposal.baseGuideId !== state.activeGuideId) throw new AuthError(409, 'La propuesta cambió. Revisala nuevamente.')
        if (state.guides.length >= 30) throw new AuthError(400, 'El máximo es 30 versiones de guía.')
        let text
        try { text = validateGbGuide(body.text) } catch (error) { throw new AuthError(400, (error as Error).message) }
        const guide = { id: randomUUID(), text, createdAt: Date.now(), sourceIds: proposal.sourceIds, note: 'Versión revisada y aceptada' }
        state.guides.push(guide); state.activeGuideId = guide.id; state.proposal = null
        break
      }
      case 'discard': state.proposal = null; break
      case 'activate': {
        if (!state.guides.some(g => g.id === body.guideId)) throw new AuthError(404, 'Versión no encontrada')
        if (state.proposal) throw new AuthError(409, 'Resolvé la propuesta pendiente antes de recuperar otra versión.')
        state.activeGuideId = body.guideId
        break
      }
      case 'adopt': gbCampaign(state, body.campaignId).guideId = state.activeGuideId; break
      default: throw new AuthError(400, 'Acción desconocida')
    }
  })
  return Response.json({ state })
})
