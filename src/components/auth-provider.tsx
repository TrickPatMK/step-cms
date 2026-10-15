import { useEffect, useState, type ReactNode } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { api, TOKEN_KEY, SESSION_EXPIRED_EVENT } from '@/lib/api'
import { authClient } from '@/lib/auth'
import { errorMessage } from '@/lib/errors'
import { ErrorState, LoadingState } from './feedback'
import { Button } from './ui/button'
import { AuthContext, useAuth, type Session } from '@/lib/contexts'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const reset = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); queryClient.clear() }
  useEffect(() => {
    const expire = () => { localStorage.removeItem(TOKEN_KEY); setToken(null); queryClient.clear() }
    const synchronize = (event: StorageEvent) => {
      if (event.key === TOKEN_KEY || event.key === null) { queryClient.clear(); setToken(localStorage.getItem(TOKEN_KEY)) }
    }
    window.addEventListener(SESSION_EXPIRED_EVENT, expire)
    window.addEventListener('storage', synchronize)
    return () => { window.removeEventListener(SESSION_EXPIRED_EVENT, expire); window.removeEventListener('storage', synchronize) }
  }, [queryClient])

  const session = useQuery({
    queryKey: ['auth-session', token], enabled: !!token, retry: false, staleTime: 0,
    refetchOnWindowFocus: true, refetchInterval: 60_000,
    queryFn: async ({ signal }) => {
      const { data } = await api.get<Session | null>('/api/auth/get-session', { signal })
      const expiresAt = data?.session ? new Date(data.session.expiresAt).getTime() : NaN
      if (!data?.user || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
        window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
        return null
      }
      return data
    },
  })
  const login = async (email: string, password: string) => {
    const { data } = await api.post('/api/auth/sign-in/email', { email, password })
    if (typeof data?.token !== 'string' || !data.token) throw new Error('Login berhasil tetapi token tidak tersedia.')
    await queryClient.cancelQueries()
    queryClient.clear()
    localStorage.setItem(TOKEN_KEY, data.token)
    setToken(data.token)
  }
  const logout = async () => {
    try {
      const result = await authClient.signOut()
      if (result.error) throw new Error(result.error.message || 'Pencabutan sesi gagal.')
    } finally { await queryClient.cancelQueries(); reset() }
  }
  return <AuthContext.Provider value={{ user: token ? session.data?.user ?? null : null, loading: !!token && session.isPending, error: session.error, retry: () => { void session.refetch() }, login, logout }}>{children}</AuthContext.Provider>
}

export function RequireAdmin() {
  const auth = useAuth()
  const location = useLocation()
  if (auth.loading) return <LoadingState message="Memeriksa sesi admin..." />
  if (auth.error && localStorage.getItem(TOKEN_KEY)) return <ErrorState message={errorMessage(auth.error)} retry={auth.retry} />
  if (!auth.user) return <Navigate to="/login" replace state={{ from: location.pathname }} />
  if (auth.user.role !== 'admin') return <div className="space-y-4 p-8" role="alert"><h1 className="text-2xl font-bold">Akses ditolak</h1><p>STEP-CMS hanya dapat digunakan oleh administrator.</p><Button onClick={() => { void auth.logout().catch(() => {}) }}>Keluar</Button></div>
  return <Outlet />
}
