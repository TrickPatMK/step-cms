import { createAuthClient } from "better-auth/react"
import { TOKEN_KEY } from './api'

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || '',
  fetchOptions: {
    timeout: 15_000,
    auth: { type: 'Bearer', token: () => localStorage.getItem(TOKEN_KEY) || '' },
  },
})
