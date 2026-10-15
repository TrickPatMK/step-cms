import imageCompression from 'browser-image-compression'
import { api } from './api'

export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const IMAGE_ACCEPT = IMAGE_TYPES.join(',')

export function imageUrl(value?: string | null, base = import.meta.env.VITE_API_URL || ''): string {
  if (!value) return ''
  if (/^https?:\/\//i.test(value)) return value
  if (!value.startsWith('/') || value.startsWith('//')) return ''
  return base ? new URL(value, base).href : value
}

export function editorImageUrls(html: string): string {
  const document = new DOMParser().parseFromString(html, 'text/html')
  document.querySelectorAll('img').forEach(image => {
    const url = imageUrl(image.getAttribute('src'))
    if (url) image.setAttribute('src', url)
    else image.remove()
  })
  return document.body.innerHTML
}

export async function uploadImage(file: File): Promise<string> {
  if (!IMAGE_TYPES.includes(file.type)) throw new Error('Pilih gambar JPEG, PNG, atau WebP.')
  const compressed = await imageCompression(file, { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true })
  if (compressed.size > 1024 * 1024) throw new Error('Gambar setelah kompresi masih melebihi 1 MB.')
  const form = new FormData()
  form.append('file', compressed, file.name)
  const { data } = await api.post('/api/upload', form)
  if (typeof data?.url !== 'string' || !imageUrl(data.url)) throw new Error('API upload tidak mengembalikan URL gambar permanen.')
  return data.url
}
