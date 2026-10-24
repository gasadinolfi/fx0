import { readGbBinding, forgetGbSession } from '../../../lib/gb-store'
import { readTranscript } from '../../../lib/journal'
import { deleteDesignSession } from '../../../lib/agent'
import { removeOwnedSession } from '../../../lib/accounts'
import { withSessionRoute } from '../../../lib/route-auth'
import { after } from 'next/server.js'

export const maxDuration = 300

export const GET = withSessionRoute(async (_request, { id }) => {
  const [transcript, binding] = await Promise.all([readTranscript(id, after), readGbBinding(id)])
  return Response.json(transcript, { headers: { 'x-fx0-workspace': binding ? 'gb' : 'general' } })
})

export const DELETE = withSessionRoute(async (_request, { host, id, user }) => {
  // Runtime owns cancellation, config/agent-start fencing, and durable Redis
  // deletion. An exception or busy result retains Neon ownership for retry.
  if (!await deleteDesignSession(host)) {
    return Response.json({ error: 'Chat is busy; stop the active turn and retry' }, { status: 409 })
  }
  await removeOwnedSession(user.id, id)
  await forgetGbSession(user.id, id).catch(() => console.error('[gb] could not remove deleted conversation from campaign'))
  return Response.json({ ok: true })
})
