import { z } from 'zod'
import { api } from '@/lib/api'

export const statusProposalList = ['draft', 'diajukan', 'revisi', 'disetujui', 'ditolak'] as const
export type StatusProposal = (typeof statusProposalList)[number]

export const statusDanaList = ['belum_dicairkan', 'sebagian', 'dicairkan'] as const
export type StatusDana = (typeof statusDanaList)[number]

export const statusLpjList = ['belum_ada', 'diserahkan', 'perlu_revisi', 'diterima'] as const
export type StatusLpj = (typeof statusLpjList)[number]

export const jenisPengajuanList = ['pengadaan', 'kegiatan', 'perjalanan', 'lainnya'] as const
export type JenisPengajuan = (typeof jenisPengajuanList)[number]

export const peranDokumenList = ['proposal', 'lpj', 'nota', 'bukti', 'lainnya'] as const
export type PeranDokumen = (typeof peranDokumenList)[number]

export const STATUS_PROPOSAL_LABELS: Record<StatusProposal, string> = {
  draft: 'Draft',
  diajukan: 'Diajukan',
  revisi: 'Perlu Revisi',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
}

export const STATUS_DANA_LABELS: Record<StatusDana, string> = {
  belum_dicairkan: 'Belum Dicairkan',
  sebagian: 'Dicairkan Sebagian',
  dicairkan: 'Dicairkan Penuh',
}

export const STATUS_LPJ_LABELS: Record<StatusLpj, string> = {
  belum_ada: 'Belum Ada',
  diserahkan: 'Diserahkan',
  perlu_revisi: 'Perlu Revisi',
  diterima: 'Diterima',
}

export const JENIS_LABELS: Record<JenisPengajuan, string> = {
  pengadaan: 'Pengadaan',
  kegiatan: 'Kegiatan',
  perjalanan: 'Perjalanan',
  lainnya: 'Lainnya',
}

export const PERAN_DOKUMEN_LABELS: Record<PeranDokumen, string> = {
  proposal: 'Proposal',
  lpj: 'LPJ',
  nota: 'Nota / Bon',
  bukti: 'Bukti Pembayaran / Kegiatan',
  lainnya: 'Lainnya',
}

export interface PengajuanItem {
  id: string
  pengajuanId: string
  uraian: string
  satuan: string | null
  qtyRencana: string | null
  hargaRencana: string | null
  qtyRealisasi: string | null
  hargaRealisasi: string | null
  createdAt: string
  updatedAt: string
}

export interface PengajuanDokumen {
  id: string
  pengajuanId: string
  documentId: string
  peran: PeranDokumen
  catatan: string | null
  createdAt: string
}

export interface PengajuanRiwayat {
  id: string
  pengajuanId: string
  aksi: string
  aktorId: string | null
  aktorNama: string | null
  nilaiSebelum: string | null
  nilaiSesudah: string | null
  catatan: string | null
  createdAt: string
}

export interface Pengajuan {
  id: string
  nomor: string
  judul: string
  jenis: JenisPengajuan
  unit: string
  pengajuId: string | null
  pengajuNama: string
  tahunAnggaran: number
  estimasiBiaya: string
  tanggalProposal: string | null
  tenggatLpj: string | null
  catatan: string | null
  statusProposal: StatusProposal
  statusDana: StatusDana
  statusLpj: StatusLpj
  jumlahDicairkan: string | null
  tanggalPencairan: string | null
  tanggalLpjDiserahkan: string | null
  tanggalLpjDiterima: string | null
  verifikatorId: string | null
  createdAt: string
  updatedAt: string
}

export interface PengajuanDetail extends Pengajuan {
  item: PengajuanItem[]
  dokumen: PengajuanDokumen[]
  riwayat: PengajuanRiwayat[]
}

export interface PengajuanPeringatanItem extends Pengajuan {
  terlambat: boolean
}

export interface PengajuanListQuery {
  statusProposal?: string
  statusDana?: string
  statusLpj?: string
  unit?: string
  tahunAnggaran?: number
  search?: string
  page?: number
  perPage?: number
}

export interface PeringatanQuery {
  dalamHari?: number
  termasukTerlambat?: boolean
}

// Item form schema
export const itemInputSchema = z.object({
  uraian: z.string().trim().min(1, 'Uraian wajib diisi').max(255),
  satuan: z.string().trim().max(50).optional().nullable(),
  qtyRencana: z.union([z.string(), z.number()]).optional().nullable(),
  hargaRencana: z.union([z.string(), z.number()]).optional().nullable(),
  qtyRealisasi: z.union([z.string(), z.number()]).optional().nullable(),
  hargaRealisasi: z.union([z.string(), z.number()]).optional().nullable(),
})

export type ItemFormValues = z.infer<typeof itemInputSchema>

// Form values schema
export const pengajuanFormSchema = z.object({
  nomor: z.string().trim().min(1, 'Nomor pengajuan wajib diisi').max(50),
  judul: z.string().trim().min(1, 'Judul pengajuan wajib diisi').max(255),
  jenis: z.enum(jenisPengajuanList),
  unit: z.string().trim().min(1, 'Unit pengaju wajib diisi').max(150),
  pengajuNama: z.string().trim().min(1, 'Nama pengaju wajib diisi').max(150),
  pengajuId: z.string().optional().nullable(),
  tahunAnggaran: z.union([z.string(), z.number()]).refine(val => {
    const num = Number(val)
    return Number.isInteger(num) && num >= 2000 && num <= 2100
  }, 'Tahun anggaran harus antara 2000 - 2100'),
  estimasiBiaya: z.union([z.string(), z.number()]).refine(val => {
    const num = typeof val === 'number' ? val : parseFloat(val)
    return !isNaN(num) && num >= 0
  }, 'Estimasi biaya harus angka valid ≥ 0'),
  tanggalProposal: z.string().optional().nullable(),
  tenggatLpj: z.string().optional().nullable(),
  catatan: z.string().max(65535).optional().nullable(),
  item: z.array(itemInputSchema).optional(),
})

export type PengajuanFormValues = z.infer<typeof pengajuanFormSchema>

// Action types
export type AksiType =
  | 'ajukan'
  | 'minta_revisi'
  | 'setujui'
  | 'tolak'
  | 'cairkan'
  | 'serahkan_lpj'
  | 'revisi_lpj'
  | 'serahkan_ulang_lpj'
  | 'terima_lpj'
  | 'ubah_tenggat'

export interface AksiPayloadBase {
  catatan?: string
}

export type AksiPayload =
  | { aksi: 'ajukan'; catatan?: string }
  | { aksi: 'minta_revisi'; catatan?: string }
  | { aksi: 'setujui'; catatan?: string }
  | { aksi: 'tolak'; catatan?: string }
  | { aksi: 'cairkan'; statusDana: 'sebagian' | 'dicairkan'; jumlahDicairkan: string; tanggalPencairan: string; catatan?: string }
  | { aksi: 'serahkan_lpj'; tanggalLpjDiserahkan: string; catatan?: string }
  | { aksi: 'revisi_lpj'; catatan?: string }
  | { aksi: 'serahkan_ulang_lpj'; catatan?: string }
  | { aksi: 'terima_lpj'; tanggalLpjDiterima: string; catatan?: string }
  | { aksi: 'ubah_tenggat'; tenggatLpj: string; catatan: string }

export interface TambahDokumenPayload {
  documentId: string
  peran: PeranDokumen
  catatan?: string | null
}

// Helpers
export function formatRupiah(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === '') return 'Rp 0'
  const num = typeof value === 'number' ? value : parseFloat(value)
  if (isNaN(num)) return 'Rp 0'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(num)
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function isOverdue(tenggatLpj: string | null | undefined, statusLpj: StatusLpj): boolean {
  if (statusLpj === 'diterima' || !tenggatLpj) return false
  const today = new Date().toISOString().slice(0, 10)
  return tenggatLpj < today
}

export function isItemOutOfPlan(item: PengajuanItem | ItemFormValues): boolean {
  const qtyRencana = Number(item.qtyRencana || 0)
  const hargaRencana = Number(item.hargaRencana || 0)
  const qtyRealisasi = Number(item.qtyRealisasi || 0)
  const hargaRealisasi = Number(item.hargaRealisasi || 0)
  return (qtyRencana === 0 || hargaRencana === 0) && (qtyRealisasi > 0 || hargaRealisasi > 0)
}

// Determine which actions are valid for the current state
export function getValidActions(pengajuan: Pengajuan): AksiType[] {
  const actions: AksiType[] = []

  // Proposal transitions
  if (pengajuan.statusProposal === 'draft') {
    actions.push('ajukan')
  } else if (pengajuan.statusProposal === 'diajukan') {
    actions.push('setujui', 'minta_revisi', 'tolak')
  }

  // Dana transitions
  if (pengajuan.statusProposal === 'disetujui') {
    actions.push('cairkan')
  }

  // LPJ transitions
  if (pengajuan.statusProposal === 'disetujui' && pengajuan.statusLpj === 'belum_ada') {
    actions.push('serahkan_lpj')
  } else if (pengajuan.statusLpj === 'diserahkan') {
    actions.push('terima_lpj', 'revisi_lpj')
  } else if (pengajuan.statusLpj === 'perlu_revisi') {
    actions.push('serahkan_ulang_lpj')
  }

  // ubah_tenggat: valid on any state EXCEPT when LPJ is 'diterima'
  if (pengajuan.statusLpj !== 'diterima') {
    actions.push('ubah_tenggat')
  }

  return actions
}

// API methods
export const pengajuanApi = {
  list: async (params: PengajuanListQuery = {}, signal?: AbortSignal): Promise<Pengajuan[]> => {
    const searchParams = new URLSearchParams()
    if (params.statusProposal) searchParams.set('statusProposal', params.statusProposal)
    if (params.statusDana) searchParams.set('statusDana', params.statusDana)
    if (params.statusLpj) searchParams.set('statusLpj', params.statusLpj)
    if (params.unit) searchParams.set('unit', params.unit)
    if (params.tahunAnggaran) searchParams.set('tahunAnggaran', String(params.tahunAnggaran))
    if (params.search) searchParams.set('search', params.search)
    if (params.page) searchParams.set('page', String(params.page))
    if (params.perPage) searchParams.set('perPage', String(params.perPage))

    const queryStr = searchParams.toString()
    const url = `/api/pengajuan${queryStr ? `?${queryStr}` : ''}`
    const { data } = await api.get<{ data: Pengajuan[] }>(url, { signal })
    return data.data
  },

  detail: async (id: string, signal?: AbortSignal): Promise<PengajuanDetail> => {
    const { data } = await api.get<{ data: PengajuanDetail }>(`/api/pengajuan/${id}`, { signal })
    return data.data
  },

  create: async (values: PengajuanFormValues): Promise<Pengajuan> => {
    // Format numeric values and serialize items cleanly
    const items = (values.item || [])
      .filter(it => it.uraian && it.uraian.trim().length > 0)
      .map(it => ({
        uraian: it.uraian.trim(),
        satuan: it.satuan?.trim() || null,
        qtyRencana: it.qtyRencana !== null && it.qtyRencana !== undefined && it.qtyRencana !== '' ? String(it.qtyRencana) : null,
        hargaRencana: it.hargaRencana !== null && it.hargaRencana !== undefined && it.hargaRencana !== '' ? String(it.hargaRencana) : null,
        qtyRealisasi: it.qtyRealisasi !== null && it.qtyRealisasi !== undefined && it.qtyRealisasi !== '' ? String(it.qtyRealisasi) : null,
        hargaRealisasi: it.hargaRealisasi !== null && it.hargaRealisasi !== undefined && it.hargaRealisasi !== '' ? String(it.hargaRealisasi) : null,
      }))

    const payload = {
      nomor: values.nomor.trim(),
      judul: values.judul.trim(),
      jenis: values.jenis,
      unit: values.unit.trim(),
      pengajuNama: values.pengajuNama.trim(),
      pengajuId: values.pengajuId || null,
      tahunAnggaran: Number(values.tahunAnggaran),
      estimasiBiaya: String(values.estimasiBiaya),
      tanggalProposal: values.tanggalProposal || null,
      tenggatLpj: values.tenggatLpj || null,
      catatan: values.catatan?.trim() || null,
      item: items.length > 0 ? items : undefined,
    }

    const { data } = await api.post<{ data: Pengajuan; message: string }>('/api/pengajuan', payload)
    return data.data
  },

  update: async (id: string, values: PengajuanFormValues): Promise<Pengajuan> => {
    const items = (values.item || [])
      .filter(it => it.uraian && it.uraian.trim().length > 0)
      .map(it => ({
        uraian: it.uraian.trim(),
        satuan: it.satuan?.trim() || null,
        qtyRencana: it.qtyRencana !== null && it.qtyRencana !== undefined && it.qtyRencana !== '' ? String(it.qtyRencana) : null,
        hargaRencana: it.hargaRencana !== null && it.hargaRencana !== undefined && it.hargaRencana !== '' ? String(it.hargaRencana) : null,
        qtyRealisasi: it.qtyRealisasi !== null && it.qtyRealisasi !== undefined && it.qtyRealisasi !== '' ? String(it.qtyRealisasi) : null,
        hargaRealisasi: it.hargaRealisasi !== null && it.hargaRealisasi !== undefined && it.hargaRealisasi !== '' ? String(it.hargaRealisasi) : null,
      }))

    // tenggatLpj is omitted on update (must use ubah_tenggat)
    const payload = {
      nomor: values.nomor.trim(),
      judul: values.judul.trim(),
      jenis: values.jenis,
      unit: values.unit.trim(),
      pengajuNama: values.pengajuNama.trim(),
      pengajuId: values.pengajuId || null,
      tahunAnggaran: Number(values.tahunAnggaran),
      estimasiBiaya: String(values.estimasiBiaya),
      tanggalProposal: values.tanggalProposal || null,
      catatan: values.catatan?.trim() || null,
      item: items,
    }

    const { data } = await api.put<{ data: Pengajuan; message: string }>(`/api/pengajuan/${id}`, payload)
    return data.data
  },

  aksi: async (id: string, payload: AksiPayload): Promise<Pengajuan> => {
    const { data } = await api.post<{ data: Pengajuan; message: string }>(`/api/pengajuan/${id}/aksi`, payload)
    return data.data
  },

  tambahDokumen: async (id: string, payload: TambahDokumenPayload): Promise<PengajuanDokumen> => {
    const { data } = await api.post<{ data: PengajuanDokumen; message: string }>(`/api/pengajuan/${id}/dokumen`, payload)
    return data.data
  },

  hapusDokumen: async (id: string, dokumenId: string): Promise<void> => {
    await api.delete(`/api/pengajuan/${id}/dokumen/${dokumenId}`)
  },

  peringatan: async (params: PeringatanQuery = {}, signal?: AbortSignal): Promise<PengajuanPeringatanItem[]> => {
    const searchParams = new URLSearchParams()
    if (params.dalamHari !== undefined) searchParams.set('dalamHari', String(params.dalamHari))
    if (params.termasukTerlambat !== undefined) searchParams.set('termasukTerlambat', params.termasukTerlambat ? 'true' : 'false')

    const queryStr = searchParams.toString()
    const url = `/api/pengajuan/peringatan${queryStr ? `?${queryStr}` : ''}`
    const { data } = await api.get<{ data: PengajuanPeringatanItem[] }>(url, { signal })
    return data.data
  },

  uploadDokumen: async (file: File): Promise<{ id: string; filename: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const { data } = await api.post<{ id: string; filename: string }>('/api/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}

export const pengajuanKeys = {
  all: ['pengajuan'] as const,
  list: (params: PengajuanListQuery) => ['pengajuan', 'list', params] as const,
  detail: (id: string) => ['pengajuan', 'detail', id] as const,
  peringatan: (params: PeringatanQuery) => ['pengajuan', 'peringatan', params] as const,
}
