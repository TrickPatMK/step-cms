import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useInfiniteQuery } from '@tanstack/react-query'
import { Plus, RotateCcw } from 'lucide-react'
import { absensiApi, absensiErrorText, studentKeys, unikById, type StudentQuery } from '@/lib/absensi'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ErrorState, LoadingState } from '@/components/feedback'

export default function MahasiswaList() {
  const [active, setActive] = useState('')
  const [mapped, setMapped] = useState('')

  const params: StudentQuery = {
    active: active === '' ? undefined : active === 'true',
    mapped: mapped === '' ? undefined : mapped === 'true',
  }

  const query = useInfiniteQuery({
    queryKey: studentKeys.list(params),
    queryFn: ({ pageParam, signal }) => absensiApi.students({ ...params, cursor: pageParam }, signal),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: last => last.nextCursor ?? undefined,
  })

  const items = unikById(query.data?.pages.flatMap(page => page.data) ?? [])
  const adaFilter = active !== '' || mapped !== ''

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-950">Data Mahasiswa</h1>
          <p className="mt-1.5 max-w-2xl text-sm text-slate-600">
            Master mahasiswa untuk kegiatan kampus. Penghubungan akun dilakukan terpisah dari data profil; menonaktifkan mahasiswa tidak menghapus penghubungan akun.
          </p>
        </div>
        <Link
          to="/absensi/mahasiswa/create"
          className="flex h-11 items-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-600"
        >
          <Plus size={18} />
          Tambah Mahasiswa
        </Link>
      </div>

      <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 bg-navy-50/40 p-4">
            <Select aria-label="Filter status aktif" value={active} onChange={e => setActive(e.target.value)} className="w-full sm:w-44">
              <option value="">Semua status</option>
              <option value="true">Aktif</option>
              <option value="false">Nonaktif</option>
            </Select>
            <Select aria-label="Filter pemetaan akun" value={mapped} onChange={e => setMapped(e.target.value)} className="w-full sm:w-48">
              <option value="">Semua pemetaan</option>
              <option value="true">Sudah terhubung akun</option>
              <option value="false">Belum terhubung akun</option>
            </Select>
            {adaFilter && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setActive('')
                  setMapped('')
                }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-navy-950"
              >
                <RotateCcw size={14} />
                Reset filter
              </Button>
            )}
          </div>

          {query.isPending ? (
            <LoadingState message="Memuat data mahasiswa..." />
          ) : query.isError ? (
            <div className="p-6">
              <ErrorState message={absensiErrorText(query.error)} retry={() => { void query.refetch() }} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              <p className="text-base font-medium">
                {adaFilter ? 'Tidak ada mahasiswa yang cocok dengan filter.' : 'Belum ada data mahasiswa.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="font-semibold text-slate-700">NIM</TableHead>
                    <TableHead className="font-semibold text-slate-700">Nama</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status</TableHead>
                    <TableHead className="font-semibold text-slate-700">Akun terhubung</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(row => (
                    <TableRow key={row.id}>
                      <TableCell className="font-mono text-xs font-semibold text-navy-900">{row.nim}</TableCell>
                      <TableCell className="font-medium text-navy-950">{row.name}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                            row.active ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-slate-300 bg-slate-100 text-slate-700'
                          }`}
                        >
                          {row.active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-700">{row.userId ? 'Sudah terhubung' : 'Belum terhubung'}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            to={`/absensi/mahasiswa/${row.id}`}
                            className="inline-flex h-9 items-center rounded-lg border border-gold-200 bg-gold-50 px-3.5 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-100"
                          >
                            Detail
                          </Link>
                          <Link
                            to={`/absensi/mahasiswa/${row.id}/edit`}
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
            <span className="text-sm text-slate-600">{items.length > 0 ? `${items.length} mahasiswa dimuat` : ''}</span>
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
