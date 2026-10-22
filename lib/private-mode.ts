import type { SessionData } from './secure-session'

// Explicit opt-in for a single shared workspace. Never contains the Gateway key.
export const PRIVATE_USER_ID = 'private:workspace'
export const PRIVATE_TOKEN = 'fx0-private-server-key'

export function privateModeEnabled(): boolean {
  return process.env.FX0_PRIVATE_MODE === '1'
}

export function isPrivateCredential(session: { userId?: string; accessToken?: string } | null | undefined): boolean {
  return session?.userId === PRIVATE_USER_ID && session.accessToken === PRIVATE_TOKEN
}

export function privateGatewayKey(): string {
  if (!privateModeEnabled() || !process.env.AI_GATEWAY_API_KEY?.trim()) {
    throw new Error('Private mode requires AI_GATEWAY_API_KEY')
  }
  return process.env.AI_GATEWAY_API_KEY
}

export function privateSession(): SessionData {
  privateGatewayKey()
  return {
    userId: PRIVATE_USER_ID, email: 'private@localhost', name: 'Private workspace',
    loginId: 'f0'.repeat(16), loginAt: 1,
    accessToken: PRIVATE_TOKEN, teamId: 'team_fx0_private', teamSlug: 'Private workspace',
    expiresAt: Date.now() + 30 * 24 * 3600_000, isLoggedIn: true,
  }
}
