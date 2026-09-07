import axios from 'axios'

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '', // Kosong agar menggunakan proxy Vite
})

// Tambahkan interceptor untuk mengirim Bearer token otomatis
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('step_api_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('step_api_token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)
