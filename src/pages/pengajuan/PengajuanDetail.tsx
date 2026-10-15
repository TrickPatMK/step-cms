import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Clock,
  Download,
  Paperclip,
  Trash2,
  Edit,
  History,
  CheckCircle2,
  XCircle,
  RotateCcw,
} from 'lucide-react'
import {
  pengajuanApi,
  pengajuanKeys,
  formatRupiah,
  formatDate,
  isOverdue,
  isItemOutOfPlan,
  getValidActions,
  STATUS_PROPOSAL_LABELS,
  STATUS_DANA_LABELS,
  STATUS_LPJ_LABELS,
  JENIS_LABELS,
  PERAN_DOKUMEN_LABELS,
  peranDokumenList,
  type AksiType,
  type AksiPayload,
  type PeranDokumen,
  type PengajuanDokumen,
} from '@/lib/pengajuan'
import { useNotice } from '@/lib/contexts'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { LoadingState, ErrorState } from '@/components/feedback'

function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return dateStr
  return d.toLocaleString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export default function PengajuanDetail() {
  const { id = '' } = useParams<{ id: string }>()
  const notice = useNotice()
  const queryClient = useQueryClient()

  // Modals state
  const [activeAksi, setActiveAksi] = useState<AksiType | null>(null)
  const [catatanAksi, setCatatanAksi] = useState('')
  const [cairkanStatusDana, setCairkanStatusDana] = useState<'dicairkan' | 'sebagian'>('dicairkan')
  const [cairkanNominal, setCairkanNominal] = useState('')
  const [cairkanTanggal, setCairkanTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [serahkanTanggal, setSerahkanTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [terimaTanggal, setTerimaTanggal] = useState(() => new Date().toISOString().slice(0, 10))
  const [tenggatBaru, setTenggatBaru] = useState('')
  const [actionError, setActionError] = useState<string | null>(null)

  // Document attachment modal
  const [docModalOpen, setDocModalOpen] = useState(false)
  const [docPeran, setDocPeran] = useState<PeranDokumen>('proposal')
  const [docCatatan, setDocCatatan] = useState('')
  const [docFile, setDocFile] = useState<File | null>(null)
  const [docIdInput, setDocIdInput] = useState('')
  const [docUploading, setDocUploading] = useState(false)
  const [docError, setDocError] = useState<string | null>(null)

  // Document detach modal
  const [detachTarget, setDetachTarget] = useState<PengajuanDokumen | null>(null)

  const detailQuery = useQuery({
    queryKey: pengajuanKeys.detail(id),
    queryFn: ({ signal }) => pengajuanApi.detail(id, signal),
    enabled: !!id,
  })

  const aksiMutation = useMutation({
    mutationFn: (payload: AksiPayload) => pengajuanApi.aksi(id, payload),
    onSuccess: async () => {
      setActiveAksi(null)
      setCatatanAksi('')
      setActionError(null)
      await queryClient.invalidateQueries({ queryKey: pengajuanKeys.detail(id) })
      await queryClient.invalidateQueries({ queryKey: pengajuanKeys.all })
      notice('Aksi berhasil dijalankan.')
    },
    onError: error => {
      setActionError(errorMessage(error))
    },
  })

  const detachMutation = useMutation({
    mutationFn: (dokumenId: string) => pengajuanApi.hapusDokumen(id, dokumenId),
    onSuccess: async () => {
      setDetachTarget(null)
      await queryClient.invalidateQueries({ queryKey: pengajuanKeys.detail(id) })
      notice('Lampiran dokumen berhasil dilepas.')
    },
    onError: error => notice(errorMessage(error), 'error'),
  })

  if (detailQuery.isPending) {
    return <LoadingState message="Memuat detail pengajuan..." />
  }

  if (detailQuery.isError || !detailQuery.data) {
    return (
      <div className="space-y-4">
        <Link to="/pengajuan" className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
          <ArrowLeft size={16} /> Kembali ke daftar pengajuan
        </Link>
        <ErrorState message={errorMessage(detailQuery.error)} retry={() => { void detailQuery.refetch() }} />
      </div>
    )
  }

  const p = detailQuery.data
  const validActions = getValidActions(p)
  const overdue = isOverdue(p.tenggatLpj, p.statusLpj)

  // Compute item totals
  const totalRencana = p.item.reduce((sum, it) => {
    const qty = it.qtyRencana ? Number(it.qtyRencana) : 1
    const price = Number(it.hargaRencana || 0)
    return sum + qty * price
  }, 0)

  const totalRealisasi = p.item.reduce((sum, it) => {
    const qty = it.qtyRealisasi ? Number(it.qtyRealisasi) : 1
    const price = Number(it.hargaRealisasi || 0)
    return sum + qty * price
  }, 0)

  const estimasi = Number(p.estimasiBiaya || 0)
  const dicairkan = Number(p.jumlahDicairkan || 0)
  const selisihEstimasiRealisasi = estimasi - totalRealisasi
  const selisihDicairkanRealisasi = dicairkan - totalRealisasi

  const handleExecuteAksi = () => {
    setActionError(null)
    if (!activeAksi) return

    switch (activeAksi) {
      case 'ajukan':
      case 'minta_revisi':
      case 'setujui':
      case 'tolak':
      case 'revisi_lpj':
      case 'serahkan_ulang_lpj':
        aksiMutation.mutate({ aksi: activeAksi, catatan: catatanAksi.trim() || undefined })
        break

      case 'cairkan':
        if (!cairkanNominal || isNaN(Number(cairkanNominal)) || Number(cairkanNominal) <= 0) {
          setActionError('Jumlah pencairan harus angka valid > 0')
          return
        }
        if (!cairkanTanggal) {
          setActionError('Tanggal pencairan wajib diisi')
          return
        }
        aksiMutation.mutate({
          aksi: 'cairkan',
          statusDana: cairkanStatusDana,
          jumlahDicairkan: String(cairkanNominal),
          tanggalPencairan: cairkanTanggal,
          catatan: catatanAksi.trim() || undefined,
        })
        break

      case 'serahkan_lpj':
        if (!serahkanTanggal) {
          setActionError('Tanggal LPJ diserahkan wajib diisi')
          return
        }
        aksiMutation.mutate({
          aksi: 'serahkan_lpj',
          tanggalLpjDiserahkan: serahkanTanggal,
          catatan: catatanAksi.trim() || undefined,
        })
        break

      case 'terima_lpj':
        if (!terimaTanggal) {
          setActionError('Tanggal LPJ diterima wajib diisi')
          return
        }
        aksiMutation.mutate({
          aksi: 'terima_lpj',
          tanggalLpjDiterima: terimaTanggal,
          catatan: catatanAksi.trim() || undefined,
        })
        break

      case 'ubah_tenggat':
        if (!tenggatBaru) {
          setActionError('Tenggat baru wajib diisi')
          return
        }
        if (!catatanAksi.trim()) {
          setActionError('Alasan / catatan perubahan tenggat wajib diisi')
          return
        }
        aksiMutation.mutate({
          aksi: 'ubah_tenggat',
          tenggatLpj: tenggatBaru,
          catatan: catatanAksi.trim(),
        })
        break
    }
  }

  const handleAttachDocument = async () => {
    setDocError(null)
    let finalDocId = docIdInput.trim()

    if (!finalDocId && !docFile) {
      setDocError('Pilih berkas untuk diunggah atau masukkan ID dokumen')
      return
    }

    setDocUploading(true)
    try {
      if (docFile) {
        const uploadRes = await pengajuanApi.uploadDokumen(docFile)
        finalDocId = uploadRes.id
      }
      await pengajuanApi.tambahDokumen(id, {
        documentId: finalDocId,
        peran: docPeran,
        catatan: docCatatan.trim() || null,
      })
      await queryClient.invalidateQueries({ queryKey: pengajuanKeys.detail(id) })
      notice('Dokumen berhasil dilampirkan.')
      setDocModalOpen(false)
      setDocFile(null)
      setDocIdInput('')
      setDocCatatan('')
    } catch (err) {
      setDocError(errorMessage(err))
    } finally {
      setDocUploading(false)
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Header & Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/pengajuan" className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:underline">
            <ArrowLeft size={16} /> Kembali ke daftar pengajuan
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="font-mono text-sm font-bold text-indigo-700 bg-indigo-50 px-2.5 py-1 rounded">
              {p.nomor}
            </span>
            <h1 className="text-2xl font-bold text-slate-900">{p.judul}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/pengajuan/edit/${p.id}`}
            className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Edit size={16} /> Edit Data
          </Link>
        </div>
      </div>

      {/* 3 Status Terpisah (Proposal, Dana, LPJ) */}
      <div>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-500">Status Pengajuan (3 Bagian Terpisah)</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Status 1: Proposal */}
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase">1. Status Proposal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold text-slate-900">{STATUS_PROPOSAL_LABELS[p.statusProposal]}</p>
              <p className="text-xs text-slate-500">
                Tanggal Proposal: <span className="font-medium text-slate-700">{formatDate(p.tanggalProposal)}</span>
              </p>
            </CardContent>
          </Card>

          {/* Status 2: Dana */}
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase">2. Status Dana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold text-slate-900">{STATUS_DANA_LABELS[p.statusDana]}</p>
              <p className="text-xs text-slate-500">
                Pencairan: <span className="font-medium text-slate-700">{formatDate(p.tanggalPencairan)}</span>
                {p.jumlahDicairkan && <span> ({formatRupiah(p.jumlahDicairkan)})</span>}
              </p>
            </CardContent>
          </Card>

          {/* Status 3: LPJ */}
          <Card className="rounded-2xl border-slate-200">
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-semibold text-slate-500 uppercase">3. Status LPJ</CardTitle>
              {overdue && (
                <span className="rounded bg-red-600 px-2 py-0.5 text-xs font-bold text-white" role="status">
                  Terlambat
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-2xl font-bold text-slate-900">{STATUS_LPJ_LABELS[p.statusLpj]}</p>
              <div className="text-xs text-slate-500 space-y-0.5">
                <p>
                  Tenggat LPJ: <span className={`font-medium ${overdue ? 'text-red-600 font-bold' : 'text-slate-700'}`}>{formatDate(p.tenggatLpj)}</span>
                </p>
                {p.tanggalLpjDiserahkan && (
                  <p>Diserahkan: <span className="font-medium text-slate-700">{formatDate(p.tanggalLpjDiserahkan)}</span></p>
                )}
                {p.tanggalLpjDiterima && (
                  <p>Diterima: <span className="font-medium text-slate-700">{formatDate(p.tanggalLpjDiterima)}</span></p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons Toolbar (Only valid actions for current state) */}
      <Card className="rounded-2xl border-indigo-100 bg-indigo-50/50 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-indigo-950">Aksi Status Saat Ini</h3>
            <p className="text-xs text-indigo-700">Tombol aksi status sesuai aturan transisi resmi (POST /api/pengajuan/:id/aksi).</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {validActions.length === 0 ? (
              <span className="text-xs text-slate-500 italic">Tidak ada aksi status lanjutan untuk status saat ini.</span>
            ) : (
              validActions.map(act => {
                switch (act) {
                  case 'ajukan':
                    return (
                      <Button key={act} onClick={() => { setActiveAksi('ajukan'); setCatatanAksi('') }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Ajukan Proposal
                      </Button>
                    )
                  case 'setujui':
                    return (
                      <Button key={act} onClick={() => { setActiveAksi('setujui'); setCatatanAksi('') }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 size={16} className="mr-1.5" /> Setujui
                      </Button>
                    )
                  case 'minta_revisi':
                    return (
                      <Button key={act} variant="outline" onClick={() => { setActiveAksi('minta_revisi'); setCatatanAksi('') }} className="border-amber-400 text-amber-800 hover:bg-amber-100">
                        <RotateCcw size={16} className="mr-1.5" /> Minta Revisi
                      </Button>
                    )
                  case 'tolak':
                    return (
                      <Button key={act} variant="destructive" onClick={() => { setActiveAksi('tolak'); setCatatanAksi('') }}>
                        <XCircle size={16} className="mr-1.5" /> Tolak
                      </Button>
                    )
                  case 'cairkan':
                    return (
                      <Button
                        key={act}
                        onClick={() => {
                          setActiveAksi('cairkan')
                          setCairkanNominal(p.estimasiBiaya)
                          setCatatanAksi('')
                        }}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white"
                      >
                        Pencairan Dana
                      </Button>
                    )
                  case 'serahkan_lpj':
                    return (
                      <Button key={act} onClick={() => { setActiveAksi('serahkan_lpj'); setCatatanAksi('') }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Serahkan LPJ
                      </Button>
                    )
                  case 'revisi_lpj':
                    return (
                      <Button key={act} variant="outline" onClick={() => { setActiveAksi('revisi_lpj'); setCatatanAksi('') }} className="border-amber-400 text-amber-800 hover:bg-amber-100">
                        Minta Revisi LPJ
                      </Button>
                    )
                  case 'serahkan_ulang_lpj':
                    return (
                      <Button key={act} onClick={() => { setActiveAksi('serahkan_ulang_lpj'); setCatatanAksi('') }} className="bg-blue-600 hover:bg-blue-700 text-white">
                        Serahkan Ulang LPJ
                      </Button>
                    )
                  case 'terima_lpj':
                    return (
                      <Button key={act} onClick={() => { setActiveAksi('terima_lpj'); setCatatanAksi('') }} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                        <CheckCircle2 size={16} className="mr-1.5" /> Terima LPJ
                      </Button>
                    )
                  case 'ubah_tenggat':
                    return (
                      <Button key={act} variant="outline" onClick={() => { setActiveAksi('ubah_tenggat'); setTenggatBaru(p.tenggatLpj || ''); setCatatanAksi('') }}>
                        <Clock size={16} className="mr-1.5" /> Ubah Tenggat LPJ
                      </Button>
                    )
                  default:
                    return null
                }
              })
            )}
          </div>
        </div>
      </Card>

      {/* Ringkasan Nominal & Identitas */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Identitas Card */}
        <Card className="rounded-2xl border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Identitas Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Nomor</span>
              <span className="font-mono font-medium text-slate-800">{p.nomor}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Jenis</span>
              <span className="font-medium text-slate-800">{JENIS_LABELS[p.jenis]}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Unit Pengaju</span>
              <span className="font-medium text-slate-800">{p.unit}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Nama Pengaju</span>
              <span className="font-medium text-slate-800">{p.pengajuNama}</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span className="text-slate-500">Tahun Anggaran</span>
              <span className="font-medium text-slate-800">{p.tahunAnggaran}</span>
            </div>
            {p.catatan && (
              <div className="pt-2">
                <span className="block text-xs font-semibold text-slate-500 uppercase">Catatan Proposal</span>
                <p className="mt-1 text-slate-700 whitespace-pre-wrap">{p.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ringkasan Nominal & Selisih Card */}
        <Card className="rounded-2xl border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Ringkasan Keuangan & Realisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Estimasi Biaya</p>
                <p className="mt-1 text-xl font-bold text-slate-900">{formatRupiah(p.estimasiBiaya)}</p>
                <p className="text-xs text-slate-500 mt-1">Total rencana proposal</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Jumlah Dicairkan</p>
                <p className="mt-1 text-xl font-bold text-slate-900">
                  {p.jumlahDicairkan ? formatRupiah(p.jumlahDicairkan) : 'Rp 0'}
                </p>
                <p className="text-xs text-slate-500 mt-1">Status: {STATUS_DANA_LABELS[p.statusDana]}</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Total Realisasi</p>
                <p className="mt-1 text-xl font-bold text-indigo-700">{formatRupiah(totalRealisasi)}</p>
                <p className="text-xs text-slate-500 mt-1">{p.item.length} pos rincian belanja</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-500">Selisih (Cair vs Realisasi)</p>
                <p className={`mt-1 text-xl font-bold ${selisihDicairkanRealisasi < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {formatRupiah(selisihDicairkanRealisasi)}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  {selisihDicairkanRealisasi < 0 ? 'Realisasi melebihi dana cair' : 'Sisa dana pencairan'}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border bg-slate-50/70 p-3 text-xs text-slate-600 flex justify-between items-center">
              <span>Selisih Estimasi Proposal vs Total Realisasi:</span>
              <span className={`font-semibold ${selisihEstimasiRealisasi < 0 ? 'text-red-600' : 'text-slate-800'}`}>
                {selisihEstimasiRealisasi < 0 ? 'Lebih: ' : 'Hemat: '}
                {formatRupiah(Math.abs(selisihEstimasiRealisasi))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Pos (Rencana vs Realisasi) */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Rincian Pos Anggaran & Realisasi</CardTitle>
            <p className="text-sm text-slate-500">Perbandingan per pos antara rencana proposal dan bukti realisasi.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {p.item.length === 0 ? (
            <p className="p-8 text-center text-slate-500">Belum ada rincian pos anggaran.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">No</TableHead>
                    <TableHead>Uraian Pos</TableHead>
                    <TableHead>Satuan</TableHead>
                    <TableHead className="text-right">Qty Rencana</TableHead>
                    <TableHead className="text-right">Harga Rencana</TableHead>
                    <TableHead className="text-right">Total Rencana</TableHead>
                    <TableHead className="text-right">Qty Realisasi</TableHead>
                    <TableHead className="text-right">Harga Realisasi</TableHead>
                    <TableHead className="text-right">Total Realisasi</TableHead>
                    <TableHead className="text-center">Keterangan Pos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.item.map((it, idx) => {
                    const outOfPlan = isItemOutOfPlan(it)
                    const rencanaSubtotal = Number(it.qtyRencana || 1) * Number(it.hargaRencana || 0)
                    const realisasiSubtotal = Number(it.qtyRealisasi || 1) * Number(it.hargaRealisasi || 0)

                    return (
                      <TableRow key={it.id} className={outOfPlan ? 'bg-amber-50/50' : undefined}>
                        <TableCell className="text-slate-400">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-slate-900">{it.uraian}</TableCell>
                        <TableCell className="text-slate-500">{it.satuan || '—'}</TableCell>
                        <TableCell className="text-right">{it.qtyRencana ?? '—'}</TableCell>
                        <TableCell className="text-right">{it.hargaRencana ? formatRupiah(it.hargaRencana) : '—'}</TableCell>
                        <TableCell className="text-right font-medium">{formatRupiah(rencanaSubtotal)}</TableCell>
                        <TableCell className="text-right">{it.qtyRealisasi ?? '—'}</TableCell>
                        <TableCell className="text-right">{it.hargaRealisasi ? formatRupiah(it.hargaRealisasi) : '—'}</TableCell>
                        <TableCell className="text-right font-medium text-indigo-700">{formatRupiah(realisasiSubtotal)}</TableCell>
                        <TableCell className="text-center">
                          {outOfPlan && (
                            <span className="inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-bold text-amber-800">
                              Di luar rencana
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Totals Row */}
                  <TableRow className="bg-slate-50 font-bold">
                    <TableCell colSpan={5} className="text-right">Total Keseluruhan:</TableCell>
                    <TableCell className="text-right">{formatRupiah(totalRencana)}</TableCell>
                    <TableCell colSpan={2} />
                    <TableCell className="text-right text-indigo-700">{formatRupiah(totalRealisasi)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dokumen Lampiran */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold">Dokumen Lampiran</CardTitle>
            <p className="text-sm text-slate-500">Berkas proposal, LPJ, nota belanja, dan bukti pendukung.</p>
          </div>
          <Button onClick={() => setDocModalOpen(true)} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Paperclip size={16} /> Lampirkan Dokumen
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {p.dokumen.length === 0 ? (
            <p className="p-8 text-center text-slate-500">Belum ada dokumen yang dilampirkan.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Peran Dokumen</TableHead>
                    <TableHead>ID Dokumen</TableHead>
                    <TableHead>Catatan</TableHead>
                    <TableHead>Tanggal Dilampirkan</TableHead>
                    <TableHead className="text-right">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.dokumen.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <span className="inline-block rounded-md border border-slate-300 bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-800">
                          {PERAN_DOKUMEN_LABELS[doc.peran]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`/api/documents/${doc.documentId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 font-mono text-sm text-indigo-600 hover:underline"
                        >
                          <Download size={14} />
                          {doc.documentId}
                        </a>
                      </TableCell>
                      <TableCell className="text-slate-600">{doc.catatan || '—'}</TableCell>
                      <TableCell className="text-slate-500">{formatDateTime(doc.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetachTarget(doc)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={16} className="mr-1" /> Lepas
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Riwayat Aksi (Append-only Audit Trail) */}
      <Card className="rounded-2xl border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="text-slate-400" size={20} />
            <CardTitle className="text-lg font-bold">Riwayat Aksi (Audit Trail)</CardTitle>
          </div>
          <p className="text-sm text-slate-500">Catatan kronologis perubahan dan transisi status (bersifat append-only).</p>
        </CardHeader>
        <CardContent>
          {p.riwayat.length === 0 ? (
            <p className="p-4 text-center text-slate-500">Belum ada catatan riwayat aksi.</p>
          ) : (
            <div className="space-y-4">
              {p.riwayat.map((r, idx) => (
                <div key={r.id} className="relative flex gap-4 pb-4 border-b last:border-0 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-indigo-600" />
                    {idx < p.riwayat.length - 1 && <div className="h-full w-0.5 bg-slate-200 mt-1" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold text-slate-900 capitalize">{r.aksi.replace(/_/g, ' ')}</span>
                      <span className="text-xs text-slate-400">{formatDateTime(r.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-500">
                      Oleh: <span className="font-medium text-slate-700">{r.aktorNama || r.aktorId || 'Sistem'}</span>
                    </p>
                    {r.catatan && (
                      <p className="mt-1 rounded-lg bg-slate-50 p-2 text-sm text-slate-700">{r.catatan}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Eksekusi Aksi Status */}
      <Dialog open={!!activeAksi} onOpenChange={open => { if (!open && !aksiMutation.isPending) setActiveAksi(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Aksi: {activeAksi?.replace(/_/g, ' ')}</DialogTitle>
            <DialogDescription>
              {activeAksi === 'ubah_tenggat'
                ? 'Perubahan tenggat LPJ mewajibkan pencatatan alasan resmi.'
                : activeAksi === 'cairkan'
                ? 'Isi nominal pencairan dan tanggal pencairan dana.'
                : activeAksi === 'serahkan_lpj' || activeAksi === 'terima_lpj'
                ? 'Tentukan tanggal pencatatan LPJ.'
                : 'Aksi ini akan mengubah status pengajuan secara permanen.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Cairkan inputs */}
            {activeAksi === 'cairkan' && (
              <>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Status Dana</label>
                  <Select
                    value={cairkanStatusDana}
                    onChange={e => setCairkanStatusDana(e.target.value as 'dicairkan' | 'sebagian')}
                  >
                    <option value="dicairkan">Dicairkan Penuh</option>
                    <option value="sebagian">Dicairkan Sebagian</option>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Jumlah Dicairkan (Rp)</label>
                  <Input
                    type="number"
                    value={cairkanNominal}
                    onChange={e => setCairkanNominal(e.target.value)}
                    placeholder="Contoh: 1400000"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold">Tanggal Pencairan</label>
                  <Input
                    type="date"
                    value={cairkanTanggal}
                    onChange={e => setCairkanTanggal(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Serahkan LPJ inputs */}
            {activeAksi === 'serahkan_lpj' && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Tanggal LPJ Diserahkan</label>
                <Input
                  type="date"
                  value={serahkanTanggal}
                  onChange={e => setSerahkanTanggal(e.target.value)}
                />
              </div>
            )}

            {/* Terima LPJ inputs */}
            {activeAksi === 'terima_lpj' && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Tanggal LPJ Diterima</label>
                <Input
                  type="date"
                  value={terimaTanggal}
                  onChange={e => setTerimaTanggal(e.target.value)}
                />
              </div>
            )}

            {/* Ubah Tenggat inputs */}
            {activeAksi === 'ubah_tenggat' && (
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Tenggat LPJ Baru</label>
                <Input
                  type="date"
                  value={tenggatBaru}
                  onChange={e => setTenggatBaru(e.target.value)}
                />
              </div>
            )}

            {/* Catatan input (mandatory for ubah_tenggat, optional for others) */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">
                Catatan {activeAksi === 'ubah_tenggat' ? <span className="text-red-600">* (Wajib)</span> : '(Opsional)'}
              </label>
              <Textarea
                rows={3}
                placeholder={activeAksi === 'ubah_tenggat' ? 'Wajib menuliskan alasan perubahan tenggat...' : 'Tambahkan catatan jika diperlukan...'}
                value={catatanAksi}
                onChange={e => setCatatanAksi(e.target.value)}
              />
            </div>

            {actionError && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {actionError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={aksiMutation.isPending} onClick={() => setActiveAksi(null)}>
              Batal
            </Button>
            <Button
              className="bg-indigo-600 hover:bg-indigo-700"
              disabled={aksiMutation.isPending}
              onClick={handleExecuteAksi}
            >
              {aksiMutation.isPending ? 'Menyimpan...' : 'Konfirmasi Aksi'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Lampirkan Dokumen */}
      <Dialog open={docModalOpen} onOpenChange={open => { if (!open && !docUploading) setDocModalOpen(false) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lampirkan Dokumen</DialogTitle>
            <DialogDescription>
              Unggah berkas baru atau kaitkan berkas yang sudah ada di tabel Dokumen.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Peran Dokumen</label>
              <Select value={docPeran} onChange={e => setDocPeran(e.target.value as PeranDokumen)}>
                {peranDokumenList.map(peran => (
                  <option key={peran} value={peran}>
                    {PERAN_DOKUMEN_LABELS[peran]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Unggah File</label>
              <Input
                type="file"
                onChange={e => {
                  const f = e.target.files?.[0] || null
                  setDocFile(f)
                }}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Atau Masukkan ID Dokumen (UUID)</label>
              <Input
                placeholder="ID dokumen yang sudah tersimpan..."
                value={docIdInput}
                onChange={e => setDocIdInput(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-semibold">Catatan Lampiran (Opsional)</label>
              <Input
                placeholder="Keterangan dokumen..."
                value={docCatatan}
                onChange={e => setDocCatatan(e.target.value)}
              />
            </div>

            {docError && (
              <p role="alert" className="text-sm text-red-600 bg-red-50 p-2 rounded border border-red-200">
                {docError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={docUploading} onClick={() => setDocModalOpen(false)}>
              Batal
            </Button>
            <Button className="bg-indigo-600 hover:bg-indigo-700" disabled={docUploading} onClick={handleAttachDocument}>
              {docUploading ? 'Mengunggah & Menyimpan...' : 'Lampirkan'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal Lepas Dokumen */}
      <Dialog open={!!detachTarget} onOpenChange={open => { if (!open && !detachMutation.isPending) setDetachTarget(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Lepas Dokumen?</DialogTitle>
            <DialogDescription>
              Kaitan dokumen ({detachTarget ? PERAN_DOKUMEN_LABELS[detachTarget.peran] : ''}) akan dilepas dari pengajuan ini. Berkas asli di sistem penyimpanan dokumen tidak akan dihapus.
            </DialogDescription>
          </DialogHeader>

          {detachMutation.isError && (
            <p role="alert" className="text-sm text-red-600">
              {errorMessage(detachMutation.error)}
            </p>
          )}

          <DialogFooter>
            <Button variant="outline" disabled={detachMutation.isPending} onClick={() => setDetachTarget(null)}>
              Batal
            </Button>
            <Button
              variant="destructive"
              disabled={detachMutation.isPending}
              onClick={() => {
                if (detachTarget) detachMutation.mutate(detachTarget.id)
              }}
            >
              {detachMutation.isPending ? 'Melepas...' : 'Konfirmasi Lepas'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
