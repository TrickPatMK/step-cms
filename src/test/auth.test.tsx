import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { AuthProvider, RequireAdmin } from '@/components/auth-provider'
import { useAuth } from '@/lib/contexts'
import { NoticeProvider } from '@/components/feedback'
import { api, TOKEN_KEY, SESSION_EXPIRED_EVENT } from '@/lib/api'
import Login from '@/pages/Login'
import DashboardLayout from '@/components/layout/DashboardLayout'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authClient: { signOut } }))
beforeEach(() => { signOut.mockResolvedValue({ data: { success: true }, error: null }) })

function session(role = 'admin', expiresAt = new Date(Date.now() + 3600_000).toISOString()) { return { user: { id: '1', name: 'Admin STEP', email: 'admin@step.test', role }, session: { expiresAt } } }
function CheckSession() { const { user } = useAuth(); return <p>Konten privat {user?.name}</p> }
function renderAuth() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  client.setQueryData(['private-data'], ['cached'])
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={['/news']}><NoticeProvider><AuthProvider><Routes>
    <Route path="/login" element={<Login />} />
    <Route element={<RequireAdmin />}><Route element={<DashboardLayout />}><Route path="*" element={<CheckSession />} /></Route></Route>
  </Routes></AuthProvider></NoticeProvider></MemoryRouter></QueryClientProvider>)
  return client
}

it('redirects a direct private URL without a token, without requesting content', async () => {
  const get = vi.spyOn(api, 'get')
  renderAuth()
  expect(await screen.findByText('STEP CMS Login')).toBeInTheDocument()
  expect(get).not.toHaveBeenCalled()
})

it('checks the server session before displaying administrator content', async () => {
  localStorage.setItem(TOKEN_KEY, 'token')
  let resolve!: (value: { data: ReturnType<typeof session> }) => void
  vi.spyOn(api, 'get').mockReturnValue(new Promise(done => { resolve = done }))
  renderAuth()
  expect(screen.getByText('Memeriksa sesi admin...')).toBeInTheDocument()
  expect(screen.queryByText(/Konten privat/)).not.toBeInTheDocument()
  resolve({ data: session() })
  expect(await screen.findByText(/Konten privat Admin STEP/)).toBeInTheDocument()
})

it('denies a normal user without destroying the valid session', async () => {
  localStorage.setItem(TOKEN_KEY, 'token')
  vi.spyOn(api, 'get').mockResolvedValue({ data: session('user') })
  renderAuth()
  expect(await screen.findByText('Akses ditolak')).toBeInTheDocument()
  expect(screen.queryByText(/Konten privat/)).not.toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBe('token')
})

it.each([null, session('admin', '2020-01-01T00:00:00Z'), session('admin', 'invalid')])('clears absent, expired or malformed sessions and cache', async data => {
  localStorage.setItem(TOKEN_KEY, 'token')
  vi.spyOn(api, 'get').mockResolvedValue({ data })
  const client = renderAuth()
  expect(await screen.findByText('STEP CMS Login')).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(client.getQueryData(['private-data'])).toBeUndefined()
})

it('keeps the token and offers retry when session verification is offline', async () => {
  localStorage.setItem(TOKEN_KEY, 'token')
  const get = vi.spyOn(api, 'get').mockRejectedValueOnce(new Error('API offline')).mockResolvedValueOnce({ data: session() })
  renderAuth()
  expect(await screen.findByText('API offline')).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBe('token')
  await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
  expect(await screen.findByText(/Konten privat/)).toBeInTheDocument()
  expect(get).toHaveBeenCalledTimes(2)
})

it('clears token and private cache even when server logout fails', async () => {
  localStorage.setItem(TOKEN_KEY, 'token')
  vi.spyOn(api, 'get').mockResolvedValue({ data: session() })
  signOut.mockRejectedValue(new Error('Network offline'))
  const client = renderAuth()
  await screen.findByText(/Konten privat/)
  await userEvent.click(screen.getByRole('button', { name: 'Keluar Sistem' }))
  expect(await screen.findByText('STEP CMS Login')).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
  expect(client.getQueryData(['private-data'])).toBeUndefined()
  expect(signOut).toHaveBeenCalledOnce()
})

it('logs in using credentials and verifies the new session', async () => {
  vi.spyOn(api, 'post').mockResolvedValue({ data: { token: 'new-admin-token' } })
  vi.spyOn(api, 'get').mockResolvedValue({ data: session() })
  renderAuth()
  await userEvent.type(screen.getByLabelText('Email'), 'admin@step.test')
  await userEvent.type(screen.getByLabelText('Password'), 'password123')
  await userEvent.click(screen.getByRole('button', { name: 'Login' }))
  expect(await screen.findByText(/Konten privat/)).toBeInTheDocument()
  expect(localStorage.getItem(TOKEN_KEY)).toBe('new-admin-token')
  expect(api.post).toHaveBeenCalledWith('/api/auth/sign-in/email', { email: 'admin@step.test', password: 'password123' })
})

it('removes a rendered private page when a protected request expires the session', async () => {
  localStorage.setItem(TOKEN_KEY, 'token')
  vi.spyOn(api, 'get').mockResolvedValue({ data: session() })
  renderAuth()
  await screen.findByText(/Konten privat/)
  window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
  await waitFor(() => expect(screen.getByText('STEP CMS Login')).toBeInTheDocument())
})
