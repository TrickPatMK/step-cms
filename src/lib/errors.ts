import axios from 'axios'

export function errorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (error.response?.status === 403) return error.response.data?.message || 'Anda tidak memiliki izin untuk tindakan ini.'
    if (!error.response) return 'Tidak dapat terhubung ke API. Periksa koneksi lalu coba lagi.'
    return error.response.data?.message || 'Request gagal. Silakan coba lagi.'
  }
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'
}
