// Client-only: HTTP disimulasikan pada adapter axios milik klien sendiri, bukan
// server nyata. Integrasi dengan API lokal nyata diuji terpisah (t_235697be).
import { render, screen, waitFor, within, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { api, TOKEN_KEY } from '@/lib/api'
import { AuthProvider } from '@/components/auth-provider'
import { NoticeProvider } from '@/components/feedback'
import { AuthContext } from '@/lib/contexts'
import DashboardLayout from '@/components/layout/DashboardLayout'
import App from '@/App'
import MahasiswaList from '@/pages/absensi/MahasiswaList'
import MahasiswaDetail from '@/pages/absensi/MahasiswaDetail'
import MahasiswaForm from '@/pages/absensi/MahasiswaForm'
import KegiatanList from '@/pages/absensi/KegiatanList'
import KegiatanDetail from '@/pages/absensi/KegiatanDetail'
import KegiatanForm from '@/pages/absensi/KegiatanForm'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authClient: { signOut } }))

interface WireRequest {
  method: string
  url: string
  body?: unknown
}

type Reply = { status?: number; data?: unknown } | 'offline'

const originalAdapter = api.defaults.adapter
const requests: WireRequest[] = []
let handler: (request: WireRequest) => Reply = () => ({ status: 404, data: { message: 'Not found' } })

function serve(reply: (request: WireRequest) => Reply) {
  handler = reply
}

function jsonBody(config: InternalAxiosRequestConfig) {
  return typeof config.data === 'string' ? JSON.parse(config.data) : config.data
}

beforeEach(() => {
  requests.length = 0
  signOut.mockResolvedValue({ data: { success: true }, error: null })
  api.defaults.adapter = async (config: InternalAxiosRequestConfig) => {
    const request: WireRequest = { method: (config.method || 'get').toUpperCase(), url: config.url || '', body: jsonBody(config) }
    requests.push(request)
    const reply = handler(request)
    if (reply === 'offline') throw new AxiosError('Network Error', 'ERR_NETWORK', config)
    const status = reply.status ?? 200
    const response = { data: reply.data, status, statusText: String(status), headers: {}, config }
    if (status >= 400) throw new AxiosError('Request failed', 'ERR_BAD_RESPONSE', config, undefined, response)
    return response
  }
})

afterEach(() => {
  api.defaults.adapter = originalAdapter
})

const student = {
  id: '8f1d1c9e-0000-4000-8000-000000000001',
  nim: 'SYN-API02A-001',
  name: 'Mahasiswa Sintetis Satu',
  active: true,
  userId: null as string | null,
  version: 3,
  createdAt: '2026-10-23T01:00:00.000Z',
  updatedAt: '2026-10-23T01:00:00.000Z',
}

const kegiatan = {
  id: '8f1d1c9e-0000-4000-8000-000000000002',
  title: 'Kegiatan Sintetis',
  startsAt: '2026-10-24T01:00:00.000Z',
  endsAt: '2026-10-24T02:00:00.000Z',
  status: 'draft' as 'draft' | 'open' | 'closed',
  publishedAt: null as string | null,
  version: 2,
  createdAt: '2026-10-23T00:00:00.000Z',
  updatedAt: '2026-10-23T00:00:00.000Z',
}

const accounts = [
  { id: 'user-1', name: 'Akun Satu', email: 'satu@step.test', role: 'admin' },
  { id: 'user-2', name: 'Akun Dua', email: 'dua@step.test', role: 'user' },
]

function session() {
  return {
    user: { id: 'admin-1', name: 'Admin STEP', email: 'admin@step.test', role: 'admin' },
    session: { expiresAt: new Date(Date.now() + 3600_000).toISOString() },
  }
}

function client() {
  return new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
}

function mountApp(path: string) {
  localStorage.setItem(TOKEN_KEY, 'admin-token')
  render(
    <QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={[path]}>
        <NoticeProvider>
          <AuthProvider>
            <App />
          </AuthProvider>
        </NoticeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function mountPage(path: string) {
  const auth = {
    user: { id: 'admin-1', name: 'Admin STEP', email: 'admin@step.test', role: 'admin' },
    loading: false,
    error: null,
    retry: () => {},
    login: async () => {},
    logout: async () => {},
  }
  render(
    <QueryClientProvider client={client()}>
      <MemoryRouter initialEntries={[path]}>
        <NoticeProvider>
          <AuthContext.Provider value={auth}>
            <Routes>
              <Route element={<DashboardLayout />}>
                <Route path="/absensi/mahasiswa" element={<MahasiswaList />} />
                <Route path="/absensi/mahasiswa/create" element={<MahasiswaForm />} />
                <Route path="/absensi/mahasiswa/:id" element={<MahasiswaDetail />} />
                <Route path="/absensi/mahasiswa/:id/edit" element={<MahasiswaForm />} />
                <Route path="/absensi/kegiatan" element={<KegiatanList />} />
                <Route path="/absensi/kegiatan/create" element={<KegiatanForm />} />
                <Route path="/absensi/kegiatan/:id" element={<KegiatanDetail />} />
                <Route path="/absensi/kegiatan/:id/edit" element={<KegiatanForm />} />
              </Route>
            </Routes>
          </AuthContext.Provider>
        </NoticeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
}

function adminSessionArrow(request: WireRequest) {
  return request.url === '/api/auth/get-session' && request.method === 'GET'
}

describe('Klien mahasiswa & jadwal kegiatan (client-only, transport disimulasikan)', () => {
  it('navigasi sidebar membuka halaman mahasiswa lalu jadwal kegiatan melalui rute asli', async () => {
    serve(request => {
      if (adminSessionArrow(request)) return { data: session() }
      if (request.url === '/api/students') return { data: { data: [student], nextCursor: null } }
      if (request.url === '/api/activity-occurrences') return { data: { data: [kegiatan], nextCursor: null } }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountApp('/')

    await userEvent.click(await screen.findByRole('link', { name: 'Data Mahasiswa' }))
    expect(await screen.findByRole('heading', { name: 'Data Mahasiswa' })).toBeInTheDocument()
    expect(await screen.findByText('SYN-API02A-001')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('link', { name: 'Jadwal Kegiatan' }))
    expect(await screen.findByRole('heading', { name: 'Jadwal Kegiatan' })).toBeInTheDocument()
    expect(await screen.findByText('Kegiatan Sintetis')).toBeInTheDocument()
  })

  it('membedakan daftar kosong dari layanan tidak tersedia, tanpa angka rekaan', async () => {
    serve(request => {
      if (request.url === '/api/students') return { data: { data: [], nextCursor: null } }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage('/absensi/mahasiswa')
    expect(await screen.findByText('Belum ada data mahasiswa.')).toBeInTheDocument()

    serve(() => 'offline')
    mountPage('/absensi/mahasiswa')
    const offline = await screen.findAllByText(/Tidak dapat terhubung ke layanan API/)
    expect(offline.length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Belum ada data mahasiswa.')).toHaveLength(1)
  })

  it('memuat halaman berikutnya dengan cursor opaque dari respons sebelumnya', async () => {
    serve(request => {
      if (request.url === '/api/students') return { data: { data: [student], nextCursor: 'cursor-2' } }
      if (request.url === '/api/students?cursor=cursor-2') {
        return { data: { data: [{ ...student, id: '8f1d1c9e-0000-4000-8000-000000000003', nim: 'SYN-API02A-002' }], nextCursor: null } }
      }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage('/absensi/mahasiswa')

    expect(await screen.findByText('SYN-API02A-001')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Muat berikutnya' }))
    expect(await screen.findByText('SYN-API02A-002')).toBeInTheDocument()
    expect(screen.getByText('SYN-API02A-001')).toBeInTheDocument()
    expect(requests.some(request => request.url === '/api/students?cursor=cursor-2')).toBe(true)
    expect(screen.getByRole('button', { name: 'Muat berikutnya' })).toBeDisabled()
  })

  it('mengirim filter status dan pemetaan sebagai literal query, bukan angka', async () => {
    serve(() => ({ data: { data: [], nextCursor: null } }))
    mountPage('/absensi/mahasiswa')

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter status aktif' }), 'true')
    await waitFor(() => expect(requests.some(request => request.url === '/api/students?active=true')).toBe(true))

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter pemetaan akun' }), 'false')
    await waitFor(() => expect(requests.some(request => request.url === '/api/students?active=true&mapped=false')).toBe(true))
  })

  it('form tambah mahasiswa mengirim body wire tanpa field karangan lalu kembali ke daftar', async () => {
    serve(request => {
      if (request.method === 'POST' && request.url === '/api/students') {
        return { status: 201, data: { data: { ...student, id: 'baru', nim: 'SYN-API02A-010', name: 'Nama Baru' } } }
      }
      if (request.url === '/api/students') return { data: { data: [], nextCursor: null } }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage('/absensi/mahasiswa/create')

    await userEvent.type(screen.getByLabelText('NIM'), 'syn-api02a-010')
    await userEvent.type(screen.getByLabelText('Nama'), 'Nama Baru')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(await screen.findByRole('heading', { name: 'Data Mahasiswa' })).toBeInTheDocument()
    const post = requests.find(request => request.method === 'POST')
    expect(post?.body).toEqual({ nim: 'SYN-API02A-010', name: 'Nama Baru', active: true })
  })

  it('konflik versi 409 memuat ulang data tanpa menimpa isian pengguna dan tanpa retry otomatis', async () => {
    let detailCalls = 0
    serve(request => {
      if (request.method === 'GET' && request.url === `/api/students/${student.id}`) {
        detailCalls += 1
        return { data: { data: detailCalls === 1 ? student : { ...student, version: 9, name: 'Nama Dari Admin Lain' } } }
      }
      if (request.method === 'PATCH') return { status: 409, data: { error: { code: 'VERSION_CONFLICT', message: 'Version conflict' } } }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage(`/absensi/mahasiswa/${student.id}/edit`)

    const nama = await screen.findByLabelText('Nama')
    expect(nama).toHaveValue('Mahasiswa Sintetis Satu')
    await userEvent.clear(nama)
    await userEvent.type(nama, 'Isian Pengguna')
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))

    expect((await screen.findAllByText(/Data sudah berubah sejak terakhir dimuat/)).length).toBeGreaterThan(0)
    await waitFor(() => expect(detailCalls).toBe(2))
    expect(screen.getByLabelText('Nama')).toHaveValue('Isian Pengguna')
    const patchCalls = requests.filter(request => request.method === 'PATCH')
    expect(patchCalls).toHaveLength(1)
    expect(patchCalls[0].body).toEqual({ expectedVersion: 3, name: 'Isian Pengguna' })
  })

  it('detail mahasiswa menyimpan status aktif dan pemetaan akun lewat endpoint terpisah', async () => {
    let current = { ...student }
    serve(request => {
      if (request.method === 'GET' && request.url === `/api/students/${student.id}`) return { data: { data: current } }
      if (request.method === 'GET' && request.url === '/api/users') return { data: accounts }
      if (request.method === 'PATCH') {
        current = { ...current, active: false, version: current.version + 1 }
        return { data: { data: current } }
      }
      if (request.method === 'PUT') {
        const body = request.body as { userId: string | null }
        current = { ...current, userId: body.userId, version: current.version + 1 }
        return { data: { data: current } }
      }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage(`/absensi/mahasiswa/${student.id}`)

    expect(await screen.findByText('Belum terhubung ke akun mana pun.')).toBeInTheDocument()
    await userEvent.selectOptions(screen.getByLabelText('Pilih akun'), 'user-2')
    await userEvent.click(screen.getByRole('button', { name: 'Hubungkan akun' }))

    await waitFor(() => expect(requests.some(request => request.method === 'PUT')).toBe(true))
    const put = requests.filter(request => request.method === 'PUT')[0]
    expect(put.url).toBe(`/api/students/${student.id}/account`)
    expect(put.body).toEqual({ expectedVersion: 3, userId: 'user-2' })
    expect(await screen.findByText('Akun Dua (dua@step.test)')).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Nonaktifkan mahasiswa' }))
    await waitFor(() => expect(requests.some(request => request.method === 'PATCH')).toBe(true))
    const patch = requests.filter(request => request.method === 'PATCH')[0]
    expect(patch.body).toEqual({ expectedVersion: 4, active: false })
    expect(await screen.findByRole('button', { name: 'Aktifkan mahasiswa' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Lepas penghubungan' }))
    await waitFor(() => expect(requests.filter(request => request.method === 'PUT')).toHaveLength(2))
    expect(requests.filter(request => request.method === 'PUT')[1].body).toEqual({ expectedVersion: 5, userId: null })
  })

  it('menampilkan pesan 403 dan 401 sebagai kegagalan, bukan daftar kosong', async () => {
    serve(() => ({ status: 403, data: { message: 'Forbidden: Admin Only' } }))
    mountPage('/absensi/mahasiswa')
    expect(await screen.findByText('Anda tidak memiliki izin untuk tindakan ini.')).toBeInTheDocument()
    expect(screen.queryByText('Belum ada data mahasiswa.')).not.toBeInTheDocument()

    serve(() => ({ status: 401, data: { statusCode: 401, error: 'Unauthorized', message: 'Unauthorized' } }))
    mountPage('/absensi/kegiatan')
    expect(await screen.findByText('Sesi berakhir. Silakan masuk kembali.')).toBeInTheDocument()
  })

  it('endpoint yang belum tersedia tampil sebagai belum tersedia, bukan kosong atau sukses', async () => {
    serve(() => ({ status: 404, data: { statusCode: 404, error: 'Not Found', message: 'Route GET:/api/students not found' } }))
    mountPage('/absensi/mahasiswa')
    expect(await screen.findByText('Layanan API belum menyediakan data ini (HTTP 404).')).toBeInTheDocument()
    expect(screen.queryByText(/Route GET/)).not.toBeInTheDocument()
    expect(screen.queryByText('Belum ada data mahasiswa.')).not.toBeInTheDocument()
  })

  it('form jadwal mengirim judul dan waktu ISO UTC bermilidetik, menolak waktu terbalik', async () => {
    serve(request => {
      if (request.method === 'POST' && request.url === '/api/activity-occurrences') {
        return { status: 201, data: { data: kegiatan } }
      }
      if (request.url === '/api/activity-occurrences') return { data: { data: [], nextCursor: null } }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage('/absensi/kegiatan/create')

    await userEvent.type(screen.getByLabelText('Judul kegiatan'), 'Kegiatan Sintetis')
    fireEvent.change(screen.getByLabelText('Waktu mulai'), { target: { value: '2026-10-24T08:00' } })
    fireEvent.change(screen.getByLabelText('Waktu selesai'), { target: { value: '2026-10-24T07:00' } })
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))

    expect(await screen.findByText('Waktu selesai harus setelah waktu mulai.')).toBeInTheDocument()
    expect(requests.some(request => request.method === 'POST')).toBe(false)

    fireEvent.change(screen.getByLabelText('Waktu selesai'), { target: { value: '2026-10-24T09:30' } })
    await userEvent.click(screen.getByRole('button', { name: 'Simpan' }))

    await waitFor(() => expect(requests.some(request => request.method === 'POST')).toBe(true))
    const post = requests.find(request => request.method === 'POST')
    expect(post?.body).toEqual({
      title: 'Kegiatan Sintetis',
      startsAt: new Date('2026-10-24T08:00').toISOString(),
      endsAt: new Date('2026-10-24T09:30').toISOString(),
    })
    expect(post?.body).toMatchObject({ startsAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/) })
  })

  it('detail kegiatan hanya menawarkan transisi draft ke open lalu open ke closed', async () => {
    let current = { ...kegiatan }
    serve(request => {
      if (request.method === 'GET' && request.url === `/api/activity-occurrences/${kegiatan.id}`) return { data: { data: current } }
      if (request.method === 'PATCH') {
        const body = request.body as { status: 'open' | 'closed' }
        current = { ...current, status: body.status, publishedAt: body.status === 'open' ? '2026-10-24T00:00:00.000Z' : current.publishedAt, version: current.version + 1 }
        return { data: { data: current } }
      }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage(`/absensi/kegiatan/${kegiatan.id}`)

    await userEvent.click(await screen.findByRole('button', { name: 'Buka jadwal' }))
    await waitFor(() => expect(requests.some(request => request.method === 'PATCH')).toBe(true))
    expect(requests.find(request => request.method === 'PATCH')?.body).toEqual({ expectedVersion: 2, status: 'open' })

    const tutup = await screen.findByRole('button', { name: 'Tutup jadwal' })
    await userEvent.click(tutup)
    await waitFor(() => expect(requests.filter(request => request.method === 'PATCH')).toHaveLength(2))
    expect(requests.filter(request => request.method === 'PATCH')[1].body).toEqual({ expectedVersion: 3, status: 'closed' })

    await screen.findByText(/Jadwal ditutup dan tetap terlihat oleh mahasiswa/)
    expect(screen.queryByRole('button', { name: 'Buka jadwal' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Tutup jadwal' })).not.toBeInTheDocument()
  })

  it('halaman absensi tidak menampilkan jadwal contoh dan menampilkan dashboard tanpa teks development', async () => {
    serve(request => {
      if (adminSessionArrow(request)) return { data: session() }
      return { data: { data: [], nextCursor: null } }
    })
    mountApp('/absensi')

    expect(await screen.findByRole('heading', { name: 'Absensi Mahasiswa' })).toBeInTheDocument()
    expect(screen.queryByText('Doa Pagi Kampus STEP')).not.toBeInTheDocument()
    expect(screen.queryByText(/Selfie Kamera \+ Identitas \+ GPS/)).not.toBeInTheDocument()
    expect(screen.queryByText(/status modul/i)).not.toBeInTheDocument()
    expect(screen.getByText('Validasi Foto & Retensi')).toBeInTheDocument()
    expect(screen.getByText(/belum ditetapkan oleh layanan data/)).toBeInTheDocument()
    expect(screen.getByText(/Pengumpulan foto dan pencatatan kehadiran belum aktif/)).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })
})

describe('Klien jadwal kegiatan: daftar dan filter status', () => {
  it('menampilkan status kegiatan dan mengirim filter status ke query', async () => {
    serve(request => {
      if (request.url === '/api/activity-occurrences') return { data: { data: [kegiatan], nextCursor: null } }
      if (request.url === '/api/activity-occurrences?status=open') return { data: { data: [], nextCursor: null } }
      return { status: 404, data: { message: 'Not found' } }
    })
    mountPage('/absensi/kegiatan')

    expect(await screen.findByText('Kegiatan Sintetis')).toBeInTheDocument()
    expect(within(screen.getByRole('table')).getByText('Draft')).toBeInTheDocument()

    await userEvent.selectOptions(screen.getByRole('combobox', { name: 'Filter status kegiatan' }), 'open')
    expect(await screen.findByText('Tidak ada kegiatan dengan status tersebut.')).toBeInTheDocument()
  })
})
