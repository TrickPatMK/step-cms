import { createContext, useContext } from 'react'

export interface Session {
  user: { id: string; name: string; email: string; role: string }
  session: { expiresAt: string }
}
export interface AuthState {
  user: Session['user'] | null
  loading: boolean
  error: unknown
  retry: () => void
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
}
export const AuthContext = createContext<AuthState | null>(null)
export const NoticeContext = createContext<(message: string, kind?: 'success' | 'error') => void>(() => {})
export const UploadContext = createContext<{ pending: number; begin: () => () => void }>({ pending: 0, begin: () => () => {} })

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('AuthProvider tidak tersedia.')
  return context
}
export function useNotice() { return useContext(NoticeContext) }
export function useUploads() { return useContext(UploadContext) }
