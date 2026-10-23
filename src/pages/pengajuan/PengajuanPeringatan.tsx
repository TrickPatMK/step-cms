import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, AlertTriangle, Clock, RotateCcw } from 'lucide-react'
import {
  pengajuanApi,
  pengajuanKeys,
  formatRupiah,
  formatDate,
  STATUS_DANA_LABELS,
  STATUS_LPJ_LABELS,
  type PeringatanQuery,
} from '@/lib/pengajuan'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingState, ErrorState } from '@/components/feedback'

export default function PengajuanPeringatan() {
  const [dalamHari, setDalamHari] = useState<number>(14)
  const [termasukTerlambat, setTermasukTerlambat] = useState<boolean>(true)

  const queryParams: PeringatanQuery = {
    dalamHari,
    termasukTerlambat,
  }

  const query = useQuery({
    queryKey: pengajuanKeys.peringatan(queryParams),
    queryFn: ({ signal }) => pengajuanApi.peringatan(queryParams, signal),
  })

  const items = query.data || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link to="/pengajuan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
            <ArrowLeft size={16} /> Kembali ke daftar pengajuan
          </Link>
          <div className="mt-2 flex items-center gap-2.5">
            <AlertTriangle className="text-gold-600" size={28} />
            <h1 className="text-3xl font-bold text-navy-950">Kewajiban LPJ & Peringatan Tenggat</h1>
          </div>
          <p className="mt-1.5 text-sm text-slate-600">
            Daftar pengajuan yang terlambat, mendekati batas waktu penyerahan LPJ, atau sudah dicairkan tanpa LPJ.
          </p>
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-navy-50/40 p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <label htmlFor="dalamHari" className="text-sm font-semibold text-navy-950">
                  Tenggat Dalam:
                </label>
                <div className="flex items-center gap-1.5">
                  <Input
                    id="dalamHari"
                    type="number"
                    min={0}
                    max={365}
                    value={dalamHari}
                    onChange={e => setDalamHari(Math.max(0, Number(e.target.value) || 0))}
                    className="w-20"
                  />
                  <span className="text-sm text-slate-600">hari ke depan</span>
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-navy-950">
                <input
                  type="checkbox"
                  checked={termasukTerlambat}
                  onChange={e => setTermasukTerlambat(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-gold-600 focus:ring-gold-500"
                />
                <span>Termasuk yang sudah terlambat</span>
              </label>
            </div>

            {(dalamHari !== 14 || !termasukTerlambat) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setDalamHari(14)
                  setTermasukTerlambat(true)
                }}
                className="flex items-center gap-1.5 text-slate-600 hover:text-navy-950"
              >
                <RotateCcw size={14} /> Reset ke Bawaan (14 hari)
              </Button>
            )}
          </div>

          {/* Table */}
          {query.isPending ? (
            <LoadingState message="Memeriksa kewajiban LPJ..." />
          ) : query.isError ? (
            <div className="p-6">
              <ErrorState message={errorMessage(query.error)} retry={() => { void query.refetch() }} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              <p className="text-base font-medium text-navy-950">Tidak ada kewajiban LPJ yang memerlukan perhatian saat ini.</p>
              <p className="text-sm text-slate-600 mt-1">
                Semua dana yang dicairkan telah memiliki LPJ atau belum mendekati batas waktu {dalamHari} hari.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="font-semibold text-slate-700">Nomor & Judul</TableHead>
                    <TableHead className="font-semibold text-slate-700">Unit & Pengaju</TableHead>
                    <TableHead className="font-semibold text-slate-700">Jumlah Dicairkan</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status Dana</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status LPJ</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tenggat LPJ</TableHead>
                    <TableHead className="font-semibold text-slate-700">Kondisi Kewajiban</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(row => (
                    <TableRow
                      key={row.id}
                      className={row.terlambat ? 'bg-red-50/50 hover:bg-red-50/80' : undefined}
                    >
                      <TableCell>
                        <span className="inline-block rounded-full border border-navy-200 bg-navy-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-navy-900">
                          {row.nomor}
                        </span>
                        <p className="mt-1 font-medium text-navy-950 line-clamp-2">{row.judul}</p>
                      </TableCell>
                      <TableCell>
                        <p className="font-medium text-navy-950">{row.unit}</p>
                        <p className="text-xs text-slate-600">{row.pengajuNama}</p>
                      </TableCell>
                      <TableCell className="font-medium tabular-nums text-navy-950">
                        {row.jumlahDicairkan ? formatRupiah(row.jumlahDicairkan) : formatRupiah(row.estimasiBiaya)}
                      </TableCell>
                      <TableCell>
                        <span className="inline-block rounded-full border border-navy-200 bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                          {STATUS_DANA_LABELS[row.statusDana]}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="inline-block rounded-full border border-navy-200 bg-navy-50 px-2.5 py-0.5 text-xs font-semibold text-navy-700">
                          {STATUS_LPJ_LABELS[row.statusLpj]}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium text-slate-700">{formatDate(row.tenggatLpj)}</TableCell>
                      <TableCell>
                        {row.terlambat ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white" role="status">
                            Terlambat
                          </span>
                        ) : row.statusLpj === 'belum_ada' && row.statusDana !== 'belum_dicairkan' ? (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-700">
                            Cair tanpa LPJ
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full border border-gold-200 bg-gold-50 px-2.5 py-1 text-xs font-bold text-gold-700">
                            <Clock size={12} /> Mendekati Tenggat
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Link
                          to={`/pengajuan/${row.id}`}
                          className="inline-flex h-9 items-center rounded-lg border border-gold-200 bg-gold-50 px-3.5 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-100"
                        >
                          Periksa
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
