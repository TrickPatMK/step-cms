import { api } from './api'

export const entities = ['news', 'events', 'faculty', 'facilities'] as const
export type Entity = typeof entities[number]
export type EventStatus = 'draft' | 'published' | 'archived'
export type FacilityStatus = 'available' | 'maintenance' | 'closed'

export interface ContentRecord {
  id: string
  title?: string
  content?: string
  category?: string | null
  tags?: string | null
  imageUrl?: string | null
  publishedAt?: string | null
  description?: string
  dateStart?: string
  dateEnd?: string
  location?: string | null
  status?: EventStatus | FacilityStatus
  flyerUrl?: string | null
  name?: string
  role?: string
  department?: string
  email?: string | null
  photoUrl?: string | null
  bio?: string | null
  order?: number
}

export interface NewsArticle extends ContentRecord { title: string; content: string }
export interface CampusEvent extends ContentRecord { title: string; description: string; dateStart: string; dateEnd: string; location: string; status: EventStatus }
export interface FacultyMember extends ContentRecord { name: string; role: string; department: string; order: number }
export interface Facility extends ContentRecord { name: string; description: string; category: string; status: FacilityStatus }

export const contentMeta = {
  news: { label: 'Berita', endpoint: '/api/stepnews', image: 'imageUrl', filters: 'category' },
  events: { label: 'Event', endpoint: '/api/events', image: 'flyerUrl', filters: 'status' },
  faculty: { label: 'Dosen & Staf', endpoint: '/api/faculty', image: 'photoUrl', filters: 'department' },
  facilities: { label: 'Fasilitas Kampus', endpoint: '/api/facilities', image: 'imageUrl', filters: 'category' },
} as const

export const contentKey = (entity: Entity) => ['content', entity] as const
export const detailKey = (entity: Entity, id: string) => [...contentKey(entity), id] as const

function record(value: unknown): ContentRecord {
  if (!value || typeof value !== 'object' || !('id' in value) || typeof value.id !== 'string') {
    throw new Error('Respons API tidak sesuai kontrak konten.')
  }
  return value as ContentRecord
}

export function normalizeList(entity: Entity, body: unknown): ContentRecord[] {
  const items = entity === 'news' ? body : (body as { data?: unknown })?.data
  if (!Array.isArray(items)) throw new Error('Respons daftar API tidak valid.')
  return items.map(record)
}

export function normalizeDetail(entity: Entity, body: unknown): ContentRecord {
  return record(entity === 'news' ? (body as { article?: unknown })?.article : (body as { data?: unknown })?.data)
}

export const contentApi = {
  async list(entity: Entity, signal?: AbortSignal) {
    const { data } = await api.get(contentMeta[entity].endpoint, { signal })
    return normalizeList(entity, data)
  },
  async detail(entity: Entity, id: string, signal?: AbortSignal) {
    const { data } = await api.get(`${contentMeta[entity].endpoint}/${encodeURIComponent(id)}`, { signal })
    return normalizeDetail(entity, data)
  },
  async save(entity: Entity, payload: object, id?: string) {
    const url = contentMeta[entity].endpoint
    const { data } = id ? await api.put(`${url}/${encodeURIComponent(id)}`, payload) : await api.post(url, payload)
    return record(entity === 'news' ? data : data?.data)
  },
  async remove(entity: Entity, id: string) {
    await api.delete(`${contentMeta[entity].endpoint}/${encodeURIComponent(id)}`)
  },
}
