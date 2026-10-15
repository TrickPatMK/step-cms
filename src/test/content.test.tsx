import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '@/lib/api'
import { contentKey, contentMeta, entities, type ContentRecord, type Entity } from '@/lib/content'
import { ContentList } from '@/components/content-list'
import { ContentForm } from '@/components/content-form'
import { NoticeProvider } from '@/components/feedback'
import Dashboard from '@/pages/Dashboard'

vi.mock('@/components/ui/rich-text-editor', () => ({ RichTextEditor: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => <textarea aria-label="Konten Berita" value={value} onChange={event => onChange(event.target.value)} /> }))

const records: Record<Entity, ContentRecord[]> = { news: [], events: [], faculty: [], facilities: [] }
const initial: Record<Entity, ContentRecord> = {
  news: { id: 'news-1', title: 'Berita pertama', content: '<p>Konten berita panjang</p>', category: 'Akademik', tags: 'satu, dua', imageUrl: '/uploads/n.png', publishedAt: '2026-10-09T00:00:00Z' },
  events: { id: 'events-1', title: 'Seminar kampus', description: 'Kegiatan kampus', dateStart: '2026-10-09T03:00:00Z', dateEnd: '2026-10-09T04:00:00Z', location: 'Semarang', status: 'draft', flyerUrl: '/uploads/e.png' },
  faculty: { id: 'faculty-1', name: 'Dosen pertama', role: 'Dosen', department: 'Teologi', email: 'dosen@step.test', bio: 'Biografi lengkap', order: 3, photoUrl: '/uploads/d.webp' },
  facilities: { id: 'facilities-1', name: 'Laboratorium utama', description: 'Laboratorium kampus', category: 'Laboratorium', location: 'Gedung A', status: 'maintenance', imageUrl: '/uploads/f.png' },
}
function routeEntity(url: string) { return entities.find(entity => url.startsWith(contentMeta[entity].endpoint))! }
beforeEach(() => {
  for (const entity of entities) records[entity] = [{ ...initial[entity] }]
  vi.spyOn(api, 'get').mockImplementation(async url => {
    const entity = routeEntity(url)
    const item = records[entity].find(record => url.endsWith('/' + record.id))
    return { data: item ? entity === 'news' ? { article: item } : { data: item } : entity === 'news' ? records[entity] : { data: records[entity] } }
  })
  vi.spyOn(api, 'delete').mockImplementation(async url => {
    const entity = routeEntity(url)
    records[entity] = records[entity].filter(item => !url.endsWith('/' + item.id))
    return { data: { message: 'Deleted' } }
  })
  vi.spyOn(api, 'post').mockImplementation(async (url, payload) => {
    const entity = routeEntity(url)
    const item = { ...(payload as object), id: `${entity}-new` }
    records[entity].push(item)
    return { data: entity === 'news' ? item : { data: item } }
  })
  vi.spyOn(api, 'put').mockImplementation(async (url, payload) => {
    const entity = routeEntity(url)
    const index = records[entity].findIndex(item => url.endsWith('/' + item.id))
    records[entity][index] = { ...records[entity][index], ...(payload as object) }
    return { data: entity === 'news' ? records[entity][index] : { data: records[entity][index] } }
  })
})

function mount(path: string) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  // Also seed the cache used by the dashboard, to assert invalidation after mutation.
  for (const entity of entities) client.setQueryData(contentKey(entity), [{ ...initial[entity] }])
  render(<QueryClientProvider client={client}><MemoryRouter initialEntries={[path]}><NoticeProvider><Routes>
    <Route path="/" element={<Dashboard />} />
    {entities.map(entity => <Route key={entity} path={`/${entity}`} element={<ContentList entity={entity} />} />)}
    {entities.map(entity => <Route key={entity} path={`/${entity}/create`} element={<ContentForm entity={entity} />} />)}
    {entities.map(entity => <Route key={entity} path={`/${entity}/edit/:id`} element={<ContentForm entity={entity} />} />)}
  </Routes></NoticeProvider></MemoryRouter></QueryClientProvider>)
  return client
}

it.each(entities)('%s deletion requires confirmation, refreshes the shared list, and supports cancellation', async entity => {
  const client = mount(`/${entity}`)
  await screen.findByText(initial[entity].title || initial[entity].name!)
  await userEvent.click(screen.getByRole('button', { name: 'Hapus' }))
  await userEvent.click(screen.getByRole('button', { name: 'Batal' }))
  expect(api.delete).not.toHaveBeenCalled()
  await userEvent.click(screen.getByRole('button', { name: 'Hapus' }))
  await userEvent.click(screen.getByRole('button', { name: 'Konfirmasi hapus' }))
  expect(await screen.findByText(`Belum ada data ${contentMeta[entity].label}.`)).toBeInTheDocument()
  expect(client.getQueryData(contentKey(entity))).toEqual([])
  expect(api.delete).toHaveBeenCalledWith(`${contentMeta[entity].endpoint}/${initial[entity].id}`)
})

it.each(entities)('%s edit reopens the actual API data and refreshes the list after saving', async entity => {
  const client = mount(`/${entity}/edit/${initial[entity].id}`)
  const name = entity === 'news' ? 'Judul Berita' : entity === 'events' ? 'Judul Event' : entity === 'faculty' ? 'Nama' : 'Nama Fasilitas'
  const input = await screen.findByLabelText(name)
  expect(input).toHaveValue(initial[entity].title || initial[entity].name)
  await userEvent.clear(input)
  await userEvent.type(input, 'Konten diperbarui')
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText(`Manajemen ${contentMeta[entity].label}`)).toBeInTheDocument()
  expect(await screen.findByText('Konten diperbarui')).toBeInTheDocument()
  const payload = vi.mocked(api.put).mock.calls[0][1]
  expect(payload).not.toHaveProperty('nip')
  expect(payload).not.toHaveProperty('sortOrder')
  if (entity === 'faculty') { expect(payload).toHaveProperty('order', 3); expect(payload).not.toHaveProperty('category') }
  if (entity === 'facilities') expect(payload).not.toHaveProperty('order')
  expect(client.getQueryState(contentKey(entity))?.isInvalidated).toBe(false)
})

it.each(entities)('%s create sends supported fields and updates the shared count', async entity => {
  const client = mount(`/${entity}/create`)
  const type = async (label: string, value: string) => userEvent.type(screen.getByLabelText(label), value)
  if (entity === 'news') {
    await type('Judul Berita', 'Berita baru')
    await type('Konten Berita', '<p>Konten berita baru cukup panjang</p>')
  } else if (entity === 'events') {
    await type('Judul Event', 'Seminar baru'); await type('Deskripsi', 'Kegiatan kampus')
    await type('Lokasi', 'Semarang')
    // Native datetime input typing differs by browser; use its supported change event.
    const { fireEvent } = await import('@testing-library/react')
    fireEvent.change(screen.getByLabelText('Tanggal dan jam mulai'), { target: { value: '2026-10-10T10:00' } })
  } else if (entity === 'faculty') {
    await type('Nama', 'Dosen baru'); await type('Jabatan', 'Dosen'); await type('Departemen / Program Studi', 'Teologi')
  } else {
    await type('Nama Fasilitas', 'Laboratorium baru'); await type('Deskripsi', 'Fasilitas kampus'); await type('Kategori', 'Laboratorium')
  }
  await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))
  expect(await screen.findByText(`Manajemen ${contentMeta[entity].label}`)).toBeInTheDocument()
  await waitFor(() => expect(client.getQueryData<ContentRecord[]>(contentKey(entity))).toHaveLength(2))
  expect(api.post).toHaveBeenCalledOnce()
})

it('news title search and category filter operate on loaded API data', async () => {
  records.news.push({ ...initial.news, id: 'news-2', title: 'Pengumuman kedua', category: 'Pengumuman' })
  mount('/news')
  await screen.findByText('Pengumuman kedua')
  await userEvent.type(screen.getByRole('textbox', { name: 'Cari Berita' }), 'kedua')
  expect(screen.queryByText('Berita pertama')).not.toBeInTheDocument()
  await userEvent.clear(screen.getByRole('textbox', { name: 'Cari Berita' }))
  await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter category' }), 'Akademik')
  expect(screen.getByText('Berita pertama')).toBeInTheDocument()
  expect(screen.queryByText('Pengumuman kedua')).not.toBeInTheDocument()
})

it('shows delete failure without removing the record and allows retry', async () => {
  vi.mocked(api.delete).mockRejectedValueOnce(new Error('Delete failed'))
  mount('/faculty')
  await screen.findByText('Dosen pertama')
  await userEvent.click(screen.getByRole('button', { name: 'Hapus' }))
  await userEvent.click(screen.getByRole('button', { name: 'Konfirmasi hapus' }))
  expect(await within(screen.getByRole('dialog')).findByText('Delete failed')).toBeInTheDocument()
  expect(records.faculty).toHaveLength(1)
  await userEvent.click(screen.getByRole('button', { name: 'Konfirmasi hapus' }))
  expect(await screen.findByText('Belum ada data Dosen & Staf.')).toBeInTheDocument()
})

it('failed list requests are errors with retry, not zero or empty success', async () => {
  vi.mocked(api.get).mockRejectedValueOnce(new Error('Server unavailable'))
  mount('/events')
  expect(await screen.findByText('Server unavailable')).toBeInTheDocument()
  expect(screen.queryByText('Belum ada data Event.')).not.toBeInTheDocument()
  await userEvent.click(screen.getByRole('button', { name: 'Coba lagi' }))
  expect(await screen.findByText('Seminar kampus')).toBeInTheDocument()
})

it('dashboard displays four API counts and represents failed requests as errors', async () => {
  vi.mocked(api.get).mockImplementation(async url => {
    if (url === '/api/events') throw new Error('Events offline')
    const entity = routeEntity(url)
    return { data: entity === 'news' ? records[entity] : { data: records[entity] } }
  })
  mount('/')
  expect(await screen.findByText('Events offline')).toBeInTheDocument()
  expect(screen.getAllByText('1')).toHaveLength(3)
  expect(screen.queryByText('0')).not.toBeInTheDocument()
  expect(screen.queryByText('24.5k')).not.toBeInTheDocument()
})
