import { expect, it, vi } from 'vitest'
import { TOKEN_KEY } from '@/lib/api'

it('the real Better Auth client sends the stored Bearer token when revoking a session', async () => {
  localStorage.setItem(TOKEN_KEY, 'session-to-revoke')
  const fetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200, headers: { 'content-type': 'application/json' } }))
  const { authClient } = await import('@/lib/auth')
  await authClient.signOut()
  const request = fetch.mock.calls.find(([url]) => String(url).endsWith('/api/auth/sign-out'))
  expect(request).toBeDefined()
  expect(request?.[1]?.method).toBe('POST')
  expect(new Headers(request?.[1]?.headers).get('Authorization')).toBe('Bearer session-to-revoke')
})
