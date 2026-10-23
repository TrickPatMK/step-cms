import axios from 'axios'
import { z } from 'zod'
import { api } from '@/lib/api'

// Wire mengikuti docs/api-02a.md (students + activity-occurrences). Tidak ada
// DELETE, total/count/offset, atau field kebijakan yang belum ada di kontrak.

export const statusKegiatanList = ['draft', 'open', 'closed'] as const
export type StatusKegiatan = (typeof statusKegiatanList)[number]

export const STATUS_KEGIATAN_LABELS: Record<StatusKegiatan, string> = {
  draft: 'Draft',
  open: 'Dibuka',
  closed: 'Ditutup',
}

export function statusKegiatanColor(status: StatusKegiatan) {
  if (status === 'open') return 'border-emerald-300 bg-emerald-100 text-emerald-800'
  if (status === 'closed') return 'border-slate-300 bg-slate-100 text-slate-700'
  return 'border-navy-200 bg-navy-50 text-navy-800'
}

export interface Student {
  id: string
  nim: string
  name: string
  active: boolean
  userId: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Kegiatan {
  id: string
  title: string
  startsAt: string
  endsAt: string
  status: StatusKegiatan
  publishedAt: string | null
  version: number
  createdAt: string
  updatedAt: string
}

export interface Page<T> {
  data: T[]
  nextCursor: string | null
}

export interface AkunRingkas {
  id: string
  name: string
  email: string
}

export interface StudentQuery {
  cursor?: string
  active?: boolean
  mapped?: boolean
}

export interface KegiatanQuery {
  cursor?: string
  status?: StatusKegiatan
}

export interface StudentCreate {
  nim: string
  name: string
  active?: boolean
}

export interface StudentPatch {
  expectedVersion: number
  nim?: string
  name?: string
  active?: boolean
}

export interface MappingPut {
  expectedVersion: number
  userId: string | null
}

export interface KegiatanCreate {
  title: string
  startsAt: string
  endsAt: string
}

export interface KegiatanPatch {
  expectedVersion: number
  title?: string
  startsAt?: string
  endsAt?: string
  status?: StatusKegiatan
}

function pageQuery(params: Record<string, string | undefined>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) if (value !== undefined) search.set(key, value)
  const query = search.toString()
  return query ? `?${query}` : ''
}

function flag(value: boolean | undefined) {
  return value === undefined ? undefined : String(value)
}

export const absensiApi = {
  students: async (params: StudentQuery = {}, signal?: AbortSignal): Promise<Page<Student>> => {
    const query = pageQuery({ cursor: params.cursor, active: flag(params.active), mapped: flag(params.mapped) })
    const { data } = await api.get<Page<Student>>(`/api/students${query}`, { signal })
    return data
  },

  student: async (id: string, signal?: AbortSignal): Promise<Student> => {
    const { data } = await api.get<{ data: Student }>(`/api/students/${id}`, { signal })
    return data.data
  },

  createStudent: async (body: StudentCreate): Promise<Student> => {
    const { data } = await api.post<{ data: Student }>('/api/students', body)
    return data.data
  },

  updateStudent: async (id: string, body: StudentPatch): Promise<Student> => {
    const { data } = await api.patch<{ data: Student }>(`/api/students/${id}`, body)
    return data.data
  },

  setStudentAccount: async (id: string, body: MappingPut): Promise<Student> => {
    const { data } = await api.put<{ data: Student }>(`/api/students/${id}/account`, body)
    return data.data
  },

  kegiatan: async (params: KegiatanQuery = {}, signal?: AbortSignal): Promise<Page<Kegiatan>> => {
    const query = pageQuery({ cursor: params.cursor, status: params.status })
    const { data } = await api.get<Page<Kegiatan>>(`/api/activity-occurrences${query}`, { signal })
    return data
  },

  kegiatanDetail: async (id: string, signal?: AbortSignal): Promise<Kegiatan> => {
    const { data } = await api.get<{ data: Kegiatan }>(`/api/activity-occurrences/${id}`, { signal })
    return data.data
  },

  createKegiatan: async (body: KegiatanCreate): Promise<Kegiatan> => {
    const { data } = await api.post<{ data: Kegiatan }>('/api/activity-occurrences', body)
    return data.data
  },

  updateKegiatan: async (id: string, body: KegiatanPatch): Promise<Kegiatan> => {
    const { data } = await api.patch<{ data: Kegiatan }>(`/api/activity-occurrences/${id}`, body)
    return data.data
  },

  // Pemetaan akun memakai daftar user existing (bentuk array, bukan Page).
  accounts: async (signal?: AbortSignal): Promise<AkunRingkas[]> => {
    const { data } = await api.get<AkunRingkas[]>('/api/users', { signal })
    return data
  },
}

export const STUDENT_LIST_KEY = ['students', 'list'] as const
export const KEGIATAN_LIST_KEY = ['activity-occurrences', 'list'] as const

export const studentKeys = {
  list: (params: StudentQuery) => [...STUDENT_LIST_KEY, params] as const,
  detail: (id: string) => ['students', 'detail', id] as const,
  accounts: ['students', 'accounts'] as const,
}

export const kegiatanKeys = {
  list: (params: KegiatanQuery) => [...KEGIATAN_LIST_KEY, params] as const,
  detail: (id: string) => ['activity-occurrences', 'detail', id] as const,
}

const PESAN_DOMAIN: Record<string, string> = {
  VERSION_CONFLICT: 'Data sudah berubah sejak terakhir dimuat. Data terbaru dimuat ulang, periksa kembali lalu simpan lagi.',
  VERSION_EXHAUSTED: 'Versi data mencapai batas maksimum sehingga tidak dapat diubah lagi.',
  NIM_ALREADY_EXISTS: 'NIM tersebut sudah dipakai mahasiswa lain, termasuk yang nonaktif.',
  ACCOUNT_ALREADY_MAPPED: 'Akun tersebut sudah terhubung ke mahasiswa lain.',
  ACCOUNT_NOT_FOUND: 'Akun tidak ditemukan.',
  STUDENT_NOT_FOUND: 'Mahasiswa tidak ditemukan.',
  STUDENT_INACTIVE: 'Mahasiswa nonaktif tidak dapat dihubungkan ke akun. Aktifkan mahasiswa lebih dahulu.',
  OCCURRENCE_NOT_FOUND: 'Kegiatan tidak ditemukan.',
  INVALID_TRANSITION: 'Perubahan status tersebut tidak diizinkan dari status saat ini.',
  INVALID_SCHEDULE: 'Waktu selesai harus setelah waktu mulai.',
  INVALID_CURSOR: 'Penanda halaman tidak valid. Muat ulang dari halaman pertama.',
}

type ErrorPayload = { error?: { code?: string; message?: string }; message?: string }

function payloadOf(error: unknown): ErrorPayload | undefined {
  return axios.isAxiosError(error) ? (error.response?.data as ErrorPayload | undefined) : undefined
}

export function domainCode(error: unknown): string | null {
  return payloadOf(error)?.error?.code ?? null
}

export function isVersionConflict(error: unknown): boolean {
  return domainCode(error) === 'VERSION_CONFLICT'
}

// Pesan yang ditampilkan ke pengguna. Kode domain dipetakan ke kalimat sendiri;
// pesan teknis mentah server tidak ditampilkan di UI admin.
export function absensiErrorText(error: unknown): string {
  if (axios.isAxiosError(error)) {
    if (!error.response) return 'Tidak dapat terhubung ke layanan API. Data belum dimuat dan tidak ada perubahan yang dianggap tersimpan.'
    const status = error.response.status
    if (status === 401) return 'Sesi berakhir. Silakan masuk kembali.'
    if (status === 403) return 'Anda tidak memiliki izin untuk tindakan ini.'
    const payload = payloadOf(error)
    const code = payload?.error?.code
    if (code && PESAN_DOMAIN[code]) return PESAN_DOMAIN[code]
    if (status === 400) return 'Permintaan ditolak oleh layanan API. Periksa kembali isian.'
    if (status === 404) return 'Layanan API belum menyediakan data ini (HTTP 404).'
    if (status === 409) return 'Data tidak dapat disimpan karena konflik. Muat ulang lalu coba lagi.'
    if (status === 500) return 'Layanan API gagal memproses permintaan.'
    return `Permintaan gagal (HTTP ${status}). Silakan coba lagi.`
  }
  return error instanceof Error ? error.message : 'Terjadi kesalahan. Silakan coba lagi.'
}

const pad = (value: number) => String(value).padStart(2, '0')

// UI memakai waktu lokal perangkat; wire kontrak memakai ISO UTC dengan milidetik.
export function toLocalInput(iso: string | null): string {
  if (!iso) return ''
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

export function toWireUtc(local: string): string {
  return new Date(local).toISOString()
}

export function formatJadwal(iso: string | null): string {
  if (!iso) return '—'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return iso
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}

export function unikById<T extends { id: string }>(rows: T[]): T[] {
  return [...new Map(rows.map(row => [row.id, row])).values()]
}

// Validasi lokal mengikuti aturan kontrak; server tetap otoritas akhir.
export const studentFormSchema = z.object({
  nim: z
    .string()
    .trim()
    .min(1, 'NIM wajib diisi.')
    .max(50, 'NIM maksimal 50 karakter.')
    .regex(/^[A-Za-z0-9][A-Za-z0-9-]{0,49}$/, 'NIM hanya boleh huruf, angka, dan tanda hubung.'),
  name: z.string().trim().min(1, 'Nama wajib diisi.').max(255, 'Nama maksimal 255 karakter.'),
  active: z.boolean().optional(),
})

export type StudentFormValues = z.infer<typeof studentFormSchema>

const waktuLokal = (pesanWajib: string) =>
  z
    .string()
    .min(1, pesanWajib)
    .refine(value => !Number.isNaN(new Date(value).getTime()), 'Waktu tidak valid.')

export const kegiatanFormSchema = z
  .object({
    title: z.string().trim().min(1, 'Judul kegiatan wajib diisi.').max(255, 'Judul maksimal 255 karakter.'),
    startsAt: waktuLokal('Waktu mulai wajib diisi.'),
    endsAt: waktuLokal('Waktu selesai wajib diisi.'),
  })
  .refine(values => new Date(values.startsAt) < new Date(values.endsAt), {
    message: 'Waktu selesai harus setelah waktu mulai.',
    path: ['endsAt'],
  })

export type KegiatanFormValues = z.infer<typeof kegiatanFormSchema>
