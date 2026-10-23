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
  type Pengajuan,
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

// Menentukan aksi utama berdasarkan status saat ini agar tidak ada 2 tombol kuat yang bersaing
function getPrimaryAction(p: Pengajuan): AksiType | null {
  if (p.statusProposal === 'draft') return 'ajukan'
  if (p.statusProposal === 'diajukan') return 'setujui'
  if (p.statusProposal === 'disetujui') {
    if (p.statusDana !== 'dicairkan') return 'cairkan'
    if (p.statusLpj === 'belum_ada') return 'serahkan_lpj'
    if (p.statusLpj === 'diserahkan') return 'terima_lpj'
    if (p.statusLpj === 'perlu_revisi') return 'serahkan_ulang_lpj'
  }
  return null
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
        <Link to="/pengajuan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
          <ArrowLeft size={16} /> Kembali ke daftar pengajuan
        </Link>
        <ErrorState message={errorMessage(detailQuery.error)} retry={() => { void detailQuery.refetch() }} />
      </div>
    )
  }

  const p = detailQuery.data
  const validActions = getValidActions(p)
  const primaryAction = getPrimaryAction(p)
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
          <Link to="/pengajuan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
            <ArrowLeft size={16} /> Kembali ke daftar pengajuan
          </Link>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <span className="inline-block rounded-full border border-navy-200 bg-navy-50 px-3 py-1 font-mono text-sm font-bold text-navy-950">
              {p.nomor}
            </span>
            <h1 className="text-2xl font-bold text-navy-950">{p.judul}</h1>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            to={`/pengajuan/edit/${p.id}`}
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-700"
          >
            <Edit size={16} /> Edit Data
          </Link>
        </div>
      </div>

      {/* 3 Status Terpisah (Proposal, Dana, LPJ) dengan hierarki visual tahapan */}
      <div>
        <h2 className="mb-3 font-sans text-sm font-semibold text-slate-700">Tahapan Status Pengajuan</h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {/* Status 1: Proposal */}
          <Card className={`rounded-xl ${p.statusProposal !== 'disetujui' ? 'border-gold-400 bg-gold-50/20' : 'border-slate-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="font-sans text-xs font-semibold uppercase tracking-wide text-slate-600">Status Proposal</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-playfair text-2xl font-bold text-navy-950">{STATUS_PROPOSAL_LABELS[p.statusProposal]}</p>
              <p className="text-xs text-slate-600">
                Tanggal Proposal: <span className="font-semibold text-navy-950">{formatDate(p.tanggalProposal)}</span>
              </p>
            </CardContent>
          </Card>

          {/* Status 2: Dana */}
          <Card className={`rounded-xl ${p.statusProposal === 'disetujui' && p.statusDana !== 'dicairkan' ? 'border-gold-400 bg-gold-50/20' : 'border-slate-200'}`}>
            <CardHeader className="pb-2">
              <CardTitle className="font-sans text-xs font-semibold uppercase tracking-wide text-slate-600">Status Dana</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-playfair text-2xl font-bold text-navy-950">{STATUS_DANA_LABELS[p.statusDana]}</p>
              <p className="text-xs text-slate-600">
                Pencairan: <span className="font-semibold text-navy-950">{formatDate(p.tanggalPencairan)}</span>
                {p.jumlahDicairkan && <span className="font-medium text-slate-700"> ({formatRupiah(p.jumlahDicairkan)})</span>}
              </p>
            </CardContent>
          </Card>

          {/* Status 3: LPJ */}
          <Card className={`rounded-xl ${p.statusDana === 'dicairkan' && p.statusLpj !== 'diterima' ? 'border-gold-400 bg-gold-50/20' : 'border-slate-200'}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="font-sans text-xs font-semibold uppercase tracking-wide text-slate-600">Status LPJ</CardTitle>
              {overdue && (
                <span className="rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white" role="status">
                  Terlambat
                </span>
              )}
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="font-playfair text-2xl font-bold text-navy-950">{STATUS_LPJ_LABELS[p.statusLpj]}</p>
              <div className="space-y-0.5 text-xs text-slate-600">
                <p>
                  Tenggat LPJ: <span className={`font-semibold ${overdue ? 'text-red-600 font-bold' : 'text-navy-950'}`}>{formatDate(p.tenggatLpj)}</span>
                </p>
                {p.tanggalLpjDiserahkan && (
                  <p>Diserahkan: <span className="font-semibold text-navy-950">{formatDate(p.tanggalLpjDiserahkan)}</span></p>
                )}
                {p.tanggalLpjDiterima && (
                  <p>Diterima: <span className="font-semibold text-navy-950">{formatDate(p.tanggalLpjDiterima)}</span></p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Action Buttons Toolbar (Satu aksi utama menonjol dengan gold, sisanya sekunder/outline) */}
      <Card className="rounded-xl border-navy-200 bg-navy-50/60 p-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-sans text-sm font-bold text-navy-950">Tindakan Status Saat Ini</h3>
            <p className="text-xs text-slate-600">Pilih tindakan yang sesuai dengan tahapan pengajuan saat ini.</p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            {validActions.length === 0 ? (
              <span className="text-xs font-medium text-slate-600 italic">Tidak ada aksi status lanjutan untuk status saat ini.</span>
            ) : (
              validActions.map(act => {
                const isPrimary = act === primaryAction
                const btnVariant = isPrimary ? 'gold' : 'outline'
                switch (act) {
                  case 'ajukan':
                    return (
                      <Button key={act} variant={btnVariant} onClick={() => { setActiveAksi('ajukan'); setCatatanAksi('') }}>
                        Ajukan Proposal
                      </Button>
                    )
                  case 'setujui':
                    return (
                      <Button key={act} variant={btnVariant} onClick={() => { setActiveAksi('setujui'); setCatatanAksi('') }}>
                        <CheckCircle2 size={16} /> Setujui
                      </Button>
                    )
                  case 'minta_revisi':
                    return (
                      <Button key={act} variant="outline" onClick={() => { setActiveAksi('minta_revisi'); setCatatanAksi('') }}>
                        <RotateCcw size={16} /> Minta Revisi
                      </Button>
                    )
                  case 'tolak':
                    return (
                      <Button
                        key={act}
                        variant="outline"
                        onClick={() => { setActiveAksi('tolak'); setCatatanAksi('') }}
                        className="border-red-300 text-red-700 hover:border-red-400 hover:bg-red-50 hover:text-red-800"
                      >
                        <XCircle size={16} /> Tolak
                      </Button>
                    )
                  case 'cairkan':
                    return (
                      <Button
                        key={act}
                        variant={btnVariant}
                        onClick={() => {
                          setActiveAksi('cairkan')
                          setCairkanNominal(p.estimasiBiaya)
                          setCatatanAksi('')
                        }}
                      >
                        Pencairan Dana
                      </Button>
                    )
                  case 'serahkan_lpj':
                    return (
                      <Button key={act} variant={btnVariant} onClick={() => { setActiveAksi('serahkan_lpj'); setCatatanAksi('') }}>
                        Serahkan LPJ
                      </Button>
                    )
                  case 'revisi_lpj':
                    return (
                      <Button key={act} variant="outline" onClick={() => { setActiveAksi('revisi_lpj'); setCatatanAksi('') }}>
                        Minta Revisi LPJ
                      </Button>
                    )
                  case 'serahkan_ulang_lpj':
                    return (
                      <Button key={act} variant={btnVariant} onClick={() => { setActiveAksi('serahkan_ulang_lpj'); setCatatanAksi('') }}>
                        Serahkan Ulang LPJ
                      </Button>
                    )
                  case 'terima_lpj':
                    return (
                      <Button key={act} variant={btnVariant} onClick={() => { setActiveAksi('terima_lpj'); setCatatanAksi('') }}>
                        <CheckCircle2 size={16} /> Terima LPJ
                      </Button>
                    )
                  case 'ubah_tenggat':
                    return (
                      <Button key={act} variant="outline" onClick={() => { setActiveAksi('ubah_tenggat'); setTenggatBaru(p.tenggatLpj || ''); setCatatanAksi('') }}>
                        <Clock size={16} /> Ubah Tenggat LPJ
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
        <Card className="rounded-xl border-slate-200 lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base font-bold text-navy-950">Identitas Pengajuan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">Nomor</span>
              <span className="font-mono font-semibold text-navy-950">{p.nomor}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">Jenis</span>
              <span className="font-medium text-navy-950">{JENIS_LABELS[p.jenis]}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">Unit Pengaju</span>
              <span className="font-medium text-navy-950">{p.unit}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">Nama Pengaju</span>
              <span className="font-medium text-navy-950">{p.pengajuNama}</span>
            </div>
            <div className="flex justify-between border-b border-slate-100 pb-2">
              <span className="text-slate-600">Tahun Anggaran</span>
              <span className="font-medium tabular-nums text-navy-950">{p.tahunAnggaran}</span>
            </div>
            {p.catatan && (
              <div className="pt-2">
                <span className="block text-xs font-semibold uppercase text-slate-600">Catatan Proposal</span>
                <p className="mt-1 whitespace-pre-wrap text-slate-700">{p.catatan}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ringkasan Nominal & Selisih Card */}
        <Card className="rounded-xl border-slate-200 lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base font-bold text-navy-950">Ringkasan Keuangan & Realisasi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-xl border border-slate-200 bg-navy-50/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-600">Estimasi Biaya</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-navy-950">{formatRupiah(p.estimasiBiaya)}</p>
                <p className="mt-1 text-xs text-slate-600">Total rencana proposal</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-navy-50/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-600">Jumlah Dicairkan</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-navy-950">
                  {p.jumlahDicairkan ? formatRupiah(p.jumlahDicairkan) : 'Rp 0'}
                </p>
                <p className="mt-1 text-xs text-slate-600">Status: {STATUS_DANA_LABELS[p.statusDana]}</p>
              </div>
              <div className="rounded-xl border border-gold-200 bg-gold-50/50 p-4">
                <p className="text-xs font-semibold uppercase text-gold-700">Total Realisasi</p>
                <p className="mt-1 text-xl font-bold tabular-nums text-gold-700">{formatRupiah(totalRealisasi)}</p>
                <p className="mt-1 text-xs text-slate-600">{p.item.length} pos rincian belanja</p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-navy-50/40 p-4">
                <p className="text-xs font-semibold uppercase text-slate-600">Selisih (Cair vs Realisasi)</p>
                <p className={`mt-1 text-xl font-bold tabular-nums ${selisihDicairkanRealisasi < 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                  {formatRupiah(selisihDicairkanRealisasi)}
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  {selisihDicairkanRealisasi < 0 ? 'Realisasi melebihi dana cair' : 'Sisa dana pencairan'}
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-xl border border-slate-200 bg-navy-50/30 p-3 text-xs text-slate-700">
              <span className="font-medium">Selisih Estimasi Proposal vs Total Realisasi:</span>
              <span className={`font-semibold tabular-nums ${selisihEstimasiRealisasi < 0 ? 'text-red-600' : 'text-navy-950'}`}>
                {selisihEstimasiRealisasi < 0 ? 'Lebih: ' : 'Hemat: '}
                {formatRupiah(Math.abs(selisihEstimasiRealisasi))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabel Pos (Rencana vs Realisasi) */}
      <Card className="rounded-xl border-slate-200">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-navy-950">Rincian Pos Anggaran & Realisasi</CardTitle>
            <p className="text-sm text-slate-600">Perbandingan per pos antara rencana proposal dan bukti realisasi.</p>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {p.item.length === 0 ? (
            <p className="p-8 text-center text-slate-600">Belum ada rincian pos anggaran.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="w-12 font-semibold text-slate-700">No</TableHead>
                    <TableHead className="font-semibold text-slate-700">Uraian Pos</TableHead>
                    <TableHead className="font-semibold text-slate-700">Satuan</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Qty Rencana</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Harga Rencana</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Total Rencana</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Qty Realisasi</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Harga Realisasi</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Total Realisasi</TableHead>
                    <TableHead className="text-center font-semibold text-slate-700">Keterangan Pos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.item.map((it, idx) => {
                    const outOfPlan = isItemOutOfPlan(it)
                    const rencanaSubtotal = Number(it.qtyRencana || 1) * Number(it.hargaRencana || 0)
                    const realisasiSubtotal = Number(it.qtyRealisasi || 1) * Number(it.hargaRealisasi || 0)

                    return (
                      <TableRow key={it.id} className={outOfPlan ? 'bg-gold-50/50' : undefined}>
                        <TableCell className="text-slate-600">{idx + 1}</TableCell>
                        <TableCell className="font-medium text-navy-950">{it.uraian}</TableCell>
                        <TableCell className="text-slate-600">{it.satuan || '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">{it.qtyRencana ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">{it.hargaRencana ? formatRupiah(it.hargaRencana) : '—'}</TableCell>
                        <TableCell className="text-right font-medium tabular-nums text-navy-950">{formatRupiah(rencanaSubtotal)}</TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">{it.qtyRealisasi ?? '—'}</TableCell>
                        <TableCell className="text-right tabular-nums text-slate-700">{it.hargaRealisasi ? formatRupiah(it.hargaRealisasi) : '—'}</TableCell>
                        <TableCell className="text-right font-semibold tabular-nums text-gold-700">{formatRupiah(realisasiSubtotal)}</TableCell>
                        <TableCell className="text-center">
                          {outOfPlan && (
                            <span className="inline-block rounded-full border border-gold-200 bg-gold-50 px-2.5 py-0.5 text-xs font-bold text-gold-700">
                              Di luar rencana
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                  {/* Totals Row */}
                  <TableRow className="bg-navy-50/50 font-bold">
                    <TableCell colSpan={5} className="text-right text-navy-950">Total Keseluruhan:</TableCell>
                    <TableCell className="text-right tabular-nums text-navy-950">{formatRupiah(totalRencana)}</TableCell>
                    <TableCell colSpan={2} />
                    <TableCell className="text-right tabular-nums text-gold-700">{formatRupiah(totalRealisasi)}</TableCell>
                    <TableCell />
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dokumen Lampiran */}
      <Card className="rounded-xl border-slate-200">
        <CardHeader className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <CardTitle className="text-lg font-bold text-navy-950">Dokumen Lampiran</CardTitle>
            <p className="text-sm text-slate-600">Berkas proposal, LPJ, nota belanja, dan bukti pendukung.</p>
          </div>
          <Button variant="gold" onClick={() => setDocModalOpen(true)}>
            <Paperclip size={16} /> Lampirkan Dokumen
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {p.dokumen.length === 0 ? (
            <p className="p-8 text-center text-slate-600">Belum ada dokumen yang dilampirkan.</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="font-semibold text-slate-700">Peran Dokumen</TableHead>
                    <TableHead className="font-semibold text-slate-700">ID Dokumen</TableHead>
                    <TableHead className="font-semibold text-slate-700">Catatan</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tanggal Dilampirkan</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {p.dokumen.map(doc => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <span className="inline-block rounded-full border border-navy-200 bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-900">
                          {PERAN_DOKUMEN_LABELS[doc.peran]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={`/api/documents/${doc.documentId}/download`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 font-mono text-sm font-medium text-gold-700 hover:text-gold-600 hover:underline"
                        >
                          <Download size={14} />
                          {doc.documentId}
                        </a>
                      </TableCell>
                      <TableCell className="text-slate-700">{doc.catatan || '—'}</TableCell>
                      <TableCell className="text-slate-600">{formatDateTime(doc.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDetachTarget(doc)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                          <Trash2 size={16} /> Lepas
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
      <Card className="rounded-xl border-slate-200">
        <CardHeader>
          <div className="flex items-center gap-2">
            <History className="text-navy-700" size={20} />
            <CardTitle className="text-lg font-bold text-navy-950">Riwayat Aksi (Audit Trail)</CardTitle>
          </div>
          <p className="text-sm text-slate-600">Catatan kronologis perubahan dan transisi status (bersifat append-only).</p>
        </CardHeader>
        <CardContent>
          {p.riwayat.length === 0 ? (
            <p className="p-4 text-center text-slate-600">Belum ada catatan riwayat aksi.</p>
          ) : (
            <div className="space-y-4">
              {p.riwayat.map((r, idx) => (
                <div key={r.id} className="relative flex gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="h-3 w-3 rounded-full bg-gold-500" />
                    {idx < p.riwayat.length - 1 && <div className="mt-1 h-full w-0.5 bg-navy-100" />}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold capitalize text-navy-950">{r.aksi.replace(/_/g, ' ')}</span>
                      <span className="text-xs font-medium text-slate-600">{formatDateTime(r.createdAt)}</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Oleh: <span className="font-semibold text-navy-950">{r.aktorNama || r.aktorId || 'Sistem'}</span>
                    </p>
                    {r.catatan && (
                      <p className="mt-1 rounded-lg border border-slate-200 bg-navy-50/40 p-2.5 text-sm text-slate-700">{r.catatan}</p>
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
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-navy-950">Status Dana</label>
                  <Select
                    value={cairkanStatusDana}
                    onChange={e => setCairkanStatusDana(e.target.value as 'dicairkan' | 'sebagian')}
                  >
                    <option value="dicairkan">Dicairkan Penuh</option>
                    <option value="sebagian">Dicairkan Sebagian</option>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-navy-950">Jumlah Dicairkan (Rp)</label>
                  <Input
                    type="number"
                    value={cairkanNominal}
                    onChange={e => setCairkanNominal(e.target.value)}
                    placeholder="Contoh: 1400000"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-navy-950">Tanggal Pencairan</label>
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
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-950">Tanggal LPJ Diserahkan</label>
                <Input
                  type="date"
                  value={serahkanTanggal}
                  onChange={e => setSerahkanTanggal(e.target.value)}
                />
              </div>
            )}

            {/* Terima LPJ inputs */}
            {activeAksi === 'terima_lpj' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-950">Tanggal LPJ Diterima</label>
                <Input
                  type="date"
                  value={terimaTanggal}
                  onChange={e => setTerimaTanggal(e.target.value)}
                />
              </div>
            )}

            {/* Ubah Tenggat inputs */}
            {activeAksi === 'ubah_tenggat' && (
              <div className="space-y-2">
                <label className="text-sm font-semibold text-navy-950">Tenggat LPJ Baru</label>
                <Input
                  type="date"
                  value={tenggatBaru}
                  onChange={e => setTenggatBaru(e.target.value)}
                />
              </div>
            )}

            {/* Catatan input (mandatory for ubah_tenggat, optional for others) */}
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-950">
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
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                {actionError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={aksiMutation.isPending} onClick={() => setActiveAksi(null)}>
              Batal
            </Button>
            <Button
              variant={activeAksi === 'tolak' ? 'destructive' : 'gold'}
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
            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-950">Peran Dokumen</label>
              <Select value={docPeran} onChange={e => setDocPeran(e.target.value as PeranDokumen)}>
                {peranDokumenList.map(peran => (
                  <option key={peran} value={peran}>
                    {PERAN_DOKUMEN_LABELS[peran]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-950">Unggah File</label>
              <Input
                type="file"
                onChange={e => {
                  const f = e.target.files?.[0] || null
                  setDocFile(f)
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-950">Atau Masukkan ID Dokumen (UUID)</label>
              <Input
                placeholder="ID dokumen yang sudah tersimpan..."
                value={docIdInput}
                onChange={e => setDocIdInput(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-navy-950">Catatan Lampiran (Opsional)</label>
              <Input
                placeholder="Keterangan dokumen..."
                value={docCatatan}
                onChange={e => setDocCatatan(e.target.value)}
              />
            </div>

            {docError && (
              <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
                {docError}
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" disabled={docUploading} onClick={() => setDocModalOpen(false)}>
              Batal
            </Button>
            <Button variant="gold" disabled={docUploading} onClick={handleAttachDocument}>
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
            <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
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
