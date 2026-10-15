import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { afterEach, expect, it, vi } from 'vitest'
import { api, TOKEN_KEY, SESSION_EXPIRED_EVENT } from '@/lib/api'

const originalAdapter = api.defaults.adapter
afterEach(() => { api.defaults.adapter = originalAdapter })

it('attaches the current token to each request', async () => {
  localStorage.setItem(TOKEN_KEY, 'admin-token')
  api.defaults.adapter = async config => {
    expect(config.headers.Authorization).toBe('Bearer admin-token')
    return { data: [], status: 200, statusText: 'OK', headers: {}, config }
  }
  await api.get('/api/stepnews')
})

function reject(status: number) {
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => { throw new AxiosError('Rejected', 'ERR_BAD_RESPONSE', config, undefined, { data: { message: 'Rejected' }, status, statusText: 'Rejected', headers: {}, config }) }
}

it('expires protected 401 sessions but keeps a 403 session', async () => {
  const listener = vi.fn()
  window.addEventListener(SESSION_EXPIRED_EVENT, listener)
  localStorage.setItem(TOKEN_KEY, 'admin-token')
  reject(403)
  await expect(api.get('/api/events')).rejects.toThrow()
  expect(localStorage.getItem(TOKEN_KEY)).toBe('admin-token')
  expect(listener).not.toHaveBeenCalled()
  reject(401)
  await expect(api.get('/api/events')).rejects.toThrow()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(listener).toHaveBeenCalledOnce()
  window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
})

it('does not redirect or expire state for incorrect login credentials', async () => {
  const listener = vi.fn()
  window.addEventListener(SESSION_EXPIRED_EVENT, listener)
  reject(401)
  await expect(api.post('/api/auth/sign-in/email', {})).rejects.toThrow()
  expect(listener).not.toHaveBeenCalled()
  window.removeEventListener(SESSION_EXPIRED_EVENT, listener)
})
