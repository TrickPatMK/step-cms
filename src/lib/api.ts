import axios from 'axios'

export const TOKEN_KEY = 'step_api_token'
export const SESSION_EXPIRED_EVENT = 'step:session-expired'

export const api = axios.create({
  timeout: 30_000,
  baseURL: import.meta.env.VITE_API_URL || '', // Kosong agar menggunakan proxy Vite
})

// Tambahkan interceptor untuk mengirim Bearer token otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem(TOKEN_KEY)
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config?.url?.includes('/sign-in/')) {
      localStorage.removeItem(TOKEN_KEY)
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))
    }
    return Promise.reject(error)
  }
)
