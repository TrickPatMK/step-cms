import { describe, expect, it } from 'vitest'
import { editorDefaults, editorPayload, editorSchema, formatInputDateTime } from '@/lib/editor'
import { normalizeDetail, normalizeList } from '@/lib/content'
import { editorImageUrls, imageUrl } from '@/lib/images'

describe('API wire contracts', () => {
  it('normalizes the real list and detail envelopes', () => {
    const article = { id: 'n', title: 'Berita', content: '<p>Teks</p>' }
    expect(normalizeList('news', [article])).toEqual([article])
    expect(normalizeDetail('news', { article, seoStructuredData: {} })).toEqual(article)
    for (const entity of ['events', 'faculty', 'facilities'] as const) {
      expect(normalizeList(entity, { data: [article] })).toEqual([article])
      expect(normalizeDetail(entity, { data: article })).toEqual(article)
    }
  })
  it('rejects an unexpected API shape instead of reporting an empty list', () => {
    expect(() => normalizeList('news', { message: 'Server error' })).toThrow()
    expect(() => normalizeList('faculty', { data: [{ name: 'No ID' }] })).toThrow()
    expect(() => normalizeDetail('news', { data: { id: 'n' } })).toThrow()
  })
})

describe('form validation and round trips', () => {
  it('rejects empty HTML news content', () => {
    const values = { ...editorDefaults('news'), title: 'Judul valid', content: '<p><br></p><p>&nbsp;</p>' }
    expect(editorSchema('news').safeParse(values).success).toBe(false)
  })
  it('keeps news HTML, tags, and cover when reopening and saving', () => {
    const item = { id: 'n', title: 'Judul berita', content: '<p><u>Konten berita panjang</u></p>', tags: 'satu, dua', category: 'Akademik', imageUrl: '/uploads/a.png' }
    expect(editorPayload('news', editorDefaults('news', item))).toEqual({ title: item.title, content: item.content, tags: item.tags, category: item.category, imageUrl: item.imageUrl })
  })
  it('uses the start date for an empty end date, and sends ISO UTC', () => {
    const value = { ...editorDefaults('events'), title: 'Seminar', description: 'Kegiatan kampus', location: 'Semarang', dateStart: '2026-10-09T10:00' }
    const payload = editorPayload('events', value)
    expect(payload.dateStart).toBe(new Date(value.dateStart).toISOString())
    expect(payload.dateEnd).toBe(payload.dateStart)
    expect(payload.dateEnd).not.toBeNull()
  })
  it('rejects invalid dates, reversed date ranges and unsupported statuses', () => {
    const value = { ...editorDefaults('events'), title: 'Seminar', description: 'Kegiatan kampus', location: 'Semarang', dateStart: '2026-10-09T10:00' }
    for (const changed of [{ dateStart: 'invalid' }, { dateEnd: 'invalid' }, { dateEnd: '2026-10-08T10:00' }, { status: 'upcoming' }]) expect(editorSchema('events').safeParse({ ...value, ...changed }).success).toBe(false)
  })
  it('preserves local datetime when reopening API ISO dates', () => {
    const local = '2026-10-09T10:35'
    expect(formatInputDateTime(new Date(local).toISOString())).toBe(local)
  })
  it('faculty payload contains only supported fields and numeric order', () => {
    const item = { id: 'f', name: 'Nama Dosen', role: 'Dosen', department: 'Teologi', order: 3, email: null, bio: 'Biografi', photoUrl: '/uploads/f.webp' }
    expect(editorPayload('faculty', editorDefaults('faculty', item))).toEqual({ name: item.name, role: item.role, department: item.department, order: 3, email: null, bio: item.bio, photoUrl: item.photoUrl })
    expect(editorSchema('faculty').safeParse({ ...editorDefaults('faculty', item), order: '2.5' }).success).toBe(false)
  })
  it('facility payload omits ordering and rejects invalid status', () => {
    const item = { id: 'f', name: 'Laboratorium', description: 'Laboratorium kampus', category: 'Laboratorium', status: 'maintenance' as const, imageUrl: null, location: null }
    expect(editorPayload('facilities', editorDefaults('facilities', item))).toEqual({ name: item.name, description: item.description, category: item.category, status: item.status, imageUrl: null, location: null })
    expect(editorSchema('facilities').safeParse({ ...editorDefaults('facilities', item), status: 'open' }).success).toBe(false)
  })
})

describe('persistent image URLs', () => {
  it('uses the API origin for relative paths and the proxy for an empty origin', () => {
    expect(imageUrl('/uploads/a.png', 'https://api.example.test')).toBe('https://api.example.test/uploads/a.png')
    expect(imageUrl('/uploads/a.png', '')).toBe('/uploads/a.png')
    expect(imageUrl('https://cdn.example.test/a.png', '')).toBe('https://cdn.example.test/a.png')
    for (const value of ['blob:temporary', 'data:image/png;base64,test', 'javascript:alert(1)', '//other.test/file']) expect(imageUrl(value, '')).toBe('')
  })
  it('removes transient images from loaded editor HTML', () => {
    expect(editorImageUrls('<p>Texte<img src="blob:temporary"><img src="/uploads/a.png"></p>')).toBe('<p>Texte<img src="/uploads/a.png"></p>')
  })
})
