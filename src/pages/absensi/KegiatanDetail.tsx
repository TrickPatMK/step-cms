import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import {
  absensiApi,
  absensiErrorText,
  formatJadwal,
  isVersionConflict,
  kegiatanKeys,
  KEGIATAN_LIST_KEY,
  STATUS_KEGIATAN_LABELS,
  statusKegiatanColor,
  type Kegiatan,
  type StatusKegiatan,
} from '@/lib/absensi'
import { useNotice } from '@/lib/contexts'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/components/feedback'

const KETERANGAN: Record<StatusKegiatan, string> = {
  draft: 'Jadwal masih draft sehingga belum terlihat oleh mahasiswa.',
  open: 'Jadwal sudah dipublikasikan dan terlihat oleh mahasiswa. Pencatatan kehadiran tetap belum aktif.',
  closed: 'Jadwal ditutup dan tetap terlihat oleh mahasiswa. Jadwal yang ditutup tidak dapat dibuka kembali.',
}

export default function KegiatanDetail() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const notice = useNotice()

  const detail = useQuery({
    queryKey: kegiatanKeys.detail(id),
    enabled: !!id,
    queryFn: ({ signal }) => absensiApi.kegiatanDetail(id, signal),
  })

  const simpan = useMutation({
    mutationFn: (status: 'open' | 'closed') => {
      const kegiatan = detail.data
      if (!kegiatan) throw new Error('Data kegiatan belum dimuat.')
      return absensiApi.updateKegiatan(id, { expectedVersion: kegiatan.version, status })
    },
    onSuccess: async (kegiatan: Kegiatan) => {
      queryClient.setQueryData(kegiatanKeys.detail(id), kegiatan)
      await queryClient.invalidateQueries({ queryKey: KEGIATAN_LIST_KEY })
      notice('Status kegiatan tersimpan.')
    },
    onError: error => {
      if (isVersionConflict(error)) void detail.refetch()
      notice(absensiErrorText(error), 'error')
    },
  })

  if (detail.isPending) return <LoadingState message="Memuat detail kegiatan..." />
  if (detail.isError) return <ErrorState message={absensiErrorText(detail.error)} retry={() => { void detail.refetch() }} />

  const kegiatan = detail.data
  const buka = kegiatan.status === 'draft'

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link to="/absensi/kegiatan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
          <ArrowLeft size={16} />
          Kembali ke jadwal kegiatan
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-navy-950">{kegiatan.title}</h1>
            <p className="mt-1.5 flex items-center gap-2 text-sm text-slate-600">
              <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusKegiatanColor(kegiatan.status)}`}>
                {STATUS_KEGIATAN_LABELS[kegiatan.status]}
              </span>
              Versi data: {kegiatan.version}
            </p>
          </div>
          <Link
            to={`/absensi/kegiatan/${kegiatan.id}/edit`}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-700"
          >
            Ubah judul & waktu
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-navy-950">Waktu pelaksanaan</CardTitle>
            <CardDescription>Ditampilkan dalam zona waktu perangkat ini.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Mulai</span>
              <span className="text-navy-950">{formatJadwal(kegiatan.startsAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Selesai</span>
              <span className="text-navy-950">{formatJadwal(kegiatan.endsAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Dipublikasikan</span>
              <span className="text-navy-950">{formatJadwal(kegiatan.publishedAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="text-slate-600">Diperbarui</span>
              <span className="text-navy-950">{formatJadwal(kegiatan.updatedAt)}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-navy-950">Status pelaksanaan</CardTitle>
            <CardDescription>{KETERANGAN[kegiatan.status]}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {simpan.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{absensiErrorText(simpan.error)}</p>}
            {buka && (
              <Button variant="gold" type="button" disabled={simpan.isPending} onClick={() => simpan.mutate('open')}>
                {simpan.isPending ? 'Menyimpan...' : 'Buka jadwal'}
              </Button>
            )}
            {kegiatan.status === 'open' && (
              <Button variant="outline" type="button" disabled={simpan.isPending} onClick={() => simpan.mutate('closed')}>
                {simpan.isPending ? 'Menyimpan...' : 'Tutup jadwal'}
              </Button>
            )}
            <p className="text-xs leading-relaxed text-slate-600">
              Pencatatan kehadiran mahasiswa belum diaktifkan pada modul ini, sehingga membuka jadwal tidak menerima kehadiran atau bukti foto.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
