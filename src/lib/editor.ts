import { z } from 'zod'
import type { ContentRecord, Entity } from './content'

const editorValuesSchema = z.object({
  title: z.string(), content: z.string(), category: z.string(), tags: z.string(), imageUrl: z.string(),
  description: z.string(), dateStart: z.string(), dateEnd: z.string(), location: z.string(), status: z.string(), flyerUrl: z.string(),
  name: z.string(), role: z.string(), department: z.string(), email: z.string(), photoUrl: z.string(), bio: z.string(), order: z.string(),
})
export type EditorValues = z.infer<typeof editorValuesSchema>
export type EditorField = keyof EditorValues

export function textContent(html: string) {
  const document = new DOMParser().parseFromString(html, 'text/html')
  return document.body.textContent?.replace(/\u00a0/g, ' ').trim() || ''
}

export function editorSchema(entity: Entity) {
  return editorValuesSchema.superRefine((values, ctx) => {
    const issue = (field: EditorField, message: string) => ctx.addIssue({ code: 'custom', path: [field], message })
    const required = (field: EditorField, min = 1, max?: number) => {
      const length = values[field].trim().length
      if (length < min) issue(field, `Wajib diisi, minimal ${min} karakter.`)
      if (max && length > max) issue(field, `Maksimal ${max} karakter.`)
    }
    if (entity === 'news') {
      required('title', 5, 255)
      if (textContent(values.content).length < 10) issue('content', 'Konten minimal 10 karakter teks.')
      if (values.category.length > 100) issue('category', 'Maksimal 100 karakter.')
      if (values.tags.length > 255) issue('tags', 'Maksimal 255 karakter.')
    } else if (entity === 'events') {
      required('title', 3, 255); required('description', 5); required('location', 2, 255)
      const start = new Date(values.dateStart).getTime()
      const end = values.dateEnd ? new Date(values.dateEnd).getTime() : start
      if (!Number.isFinite(start)) issue('dateStart', 'Tanggal mulai tidak valid.')
      if (!Number.isFinite(end)) issue('dateEnd', 'Tanggal akhir tidak valid.')
      if (end < start) issue('dateEnd', 'Tanggal akhir tidak boleh sebelum tanggal mulai.')
      if (!['draft', 'published', 'archived'].includes(values.status)) issue('status', 'Status event tidak valid.')
    } else if (entity === 'faculty') {
      required('name', 2, 255); required('role', 2, 255); required('department', 2, 255)
      if (values.email && !z.email().safeParse(values.email).success) issue('email', 'Format email tidak valid.')
      const order = Number(values.order)
      if (!values.order.trim() || !Number.isInteger(order) || order < 0 || order > 2147483647) issue('order', 'Urutan harus bilangan bulat 0–2147483647.')
    } else {
      required('name', 2, 255); required('description', 5); required('category', 1, 100)
      if (values.location.length > 255) issue('location', 'Maksimal 255 karakter.')
      if (!['available', 'maintenance', 'closed'].includes(values.status)) issue('status', 'Status fasilitas tidak valid.')
    }
  })
}

export function formatInputDateTime(value?: string) {
  if (!value) return ''
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return ''
  const pad = (number: number) => String(number).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function editorDefaults(entity: Entity, item?: ContentRecord): EditorValues {
  const empty = { title: '', content: '', category: '', tags: '', imageUrl: '', description: '', dateStart: '', dateEnd: '', location: '', status: entity === 'events' ? 'published' : 'available', flyerUrl: '', name: '', role: '', department: '', email: '', photoUrl: '', bio: '', order: '0' }
  if (!item) return empty
  return Object.fromEntries(Object.entries(empty).map(([key, fallback]) => {
    const value = item[key as keyof ContentRecord]
    return [key, key === 'dateStart' || key === 'dateEnd' ? formatInputDateTime(value as string | undefined) : value == null ? fallback : String(value)]
  })) as EditorValues
}

export function editorPayload(entity: Entity, input: EditorValues) {
  const value = editorSchema(entity).parse(input)
  const nullable = (field: EditorField) => value[field].trim() || null
  if (entity === 'news') return { title: value.title.trim(), content: value.content, category: value.category.trim(), tags: value.tags.trim(), imageUrl: value.imageUrl }
  if (entity === 'events') return { title: value.title.trim(), description: value.description.trim(), dateStart: new Date(value.dateStart).toISOString(), dateEnd: new Date(value.dateEnd || value.dateStart).toISOString(), location: value.location.trim(), status: value.status, flyerUrl: nullable('flyerUrl') }
  if (entity === 'faculty') return { name: value.name.trim(), role: value.role.trim(), department: value.department.trim(), email: nullable('email'), photoUrl: nullable('photoUrl'), bio: nullable('bio'), order: Number(value.order) }
  return { name: value.name.trim(), description: value.description.trim(), category: value.category.trim(), imageUrl: nullable('imageUrl'), location: nullable('location'), status: value.status }
}
