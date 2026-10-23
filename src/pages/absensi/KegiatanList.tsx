import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Plus, RotateCcw } from 'lucide-react'
import {
  absensiApi,
  absensiErrorText,
  formatJadwal,
  kegiatanKeys,
  statusKegiatanList,
  STATUS_KEGIATAN_LABELS,
  statusKegiatanColor,
  unikById,
  type KegiatanQuery,
  type StatusKegiatan,
} from '@/lib/absensi'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorState, LoadingState } from '@/components/feedback'

export default function KegiatanList() {
  const [status, setStatus] = useState('')

  const params: KegiatanQuery = { status: (status || undefined) as StatusKegiatan | undefined }

  const query = useInfiniteQuery({
    queryKey: kegiatanKeys.list(params),
    queryFn: ({ pageParam, signal }) => absensiApi.kegiatan({ ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
  })

  const items = unikById(query.data?.pages.flatMap(page => page.data) ?? [])

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-950">Jadwal Kegiatan</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Judul dan waktu pelaksanaan kegiatan mahasiswa. Menerbitkan jadwal tidak membuka pencatatan kehadiran; waktu ditampilkan mengikuti zona waktu perangkat ini.
          </p>
        </div>
        <Link
          to="/absensi/kegiatan/create"
          className="flex h-11 items-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-600"
        >
          <Plus size={18} />
          Tambah Kegiatan
        </Link>
      </div>

      <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-navy-50/40 p-4">
            <Select aria-label="Filter status kegiatan" value={status} onChange={e => setStatus(e.target.value)} className="w-full sm:w-44">
              <option value="">Semua status</option>
              {statusKegiatanList.map(item => (
                <option key={item} value={item}>{STATUS_KEGIATAN_LABELS[item]}</option>
              ))}
            </Select>
            {status !== '' && (
              <Button variant="ghost" size="sm" onClick={() => setStatus('')} className="flex items-center gap-1.5 text-slate-600 hover:text-navy-950">
                <RotateCcw size={14} />
                Reset filter
              </Button>
            )}
          </div>

          {query.isPending ? (
            <LoadingState message="Memuat jadwal kegiatan..." />
          ) : query.isError ? (
            <div className="p-6">
              <ErrorState message={absensiErrorText(query.error)} retry={() => { void query.refetch() }} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              <p className="text-base font-medium">{status !== '' ? 'Tidak ada kegiatan dengan status tersebut.' : 'Belum ada jadwal kegiatan.'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="font-semibold text-slate-700">Kegiatan</TableHead>
                    <TableHead className="font-semibold text-slate-700">Mulai</TableHead>
                    <TableHead className="font-semibold text-slate-700">Selesai</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-medium text-navy-950">{row.title}</TableCell>
                      <TableCell className="text-slate-700">{formatJadwal(row.startsAt)}</TableCell>
                      <TableCell className="text-slate-700">{formatJadwal(row.endsAt)}</TableCell>
                      <TableCell>
                        <span className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusKegiatanColor(row.status)}`}>
                          {STATUS_KEGIATAN_LABELS[row.status]}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/absensi/kegiatan/${row.id}`}
                            className="inline-flex h-9 items-center rounded-lg border border-gold-200 bg-gold-50 px-3.5 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-100"
                          >
                            Detail
                          </Link>
                          <Link
                            to={`/absensi/kegiatan/${row.id}/edit`}
                            className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-medium text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-700"
                          >
                            Ubah
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 bg-navy-50/40 px-4 py-3">
            <span className="text-sm text-slate-600">{items.length > 0 ? `${items.length} kegiatan dimuat` : ''}</span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => { void query.refetch() }} disabled={query.isFetching}>
                Muat ulang
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => { void query.fetchNextPage() }}
                disabled={!query.hasNextPage || query.isFetchingNextPage}
              >
                {query.isFetchingNextPage ? 'Memuat...' : 'Muat berikutnya'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
