import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Plus, Search, AlertCircle, RotateCcw } from 'lucide-react'
import {
  pengajuanApi,
  pengajuanKeys,
  formatRupiah,
  formatDate,
  isOverdue,
  STATUS_PROPOSAL_LABELS,
  STATUS_DANA_LABELS,
  STATUS_LPJ_LABELS,
  statusProposalList,
  statusDanaList,
  statusLpjList,
  type PengajuanListQuery,
  type StatusProposal,
  type StatusDana,
  type StatusLpj,
} from '@/lib/pengajuan'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingState, ErrorState } from '@/components/feedback'

function statusProposalColor(status: StatusProposal) {
  switch (status) {
    case 'disetujui':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'diajukan':
      return 'bg-gold-50 text-gold-700 border-gold-200'
    case 'revisi':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'ditolak':
      return 'bg-red-100 text-red-800 border-red-300'
    case 'draft':
    default:
      return 'bg-navy-50 text-navy-700 border-navy-200'
  }
}

function statusDanaColor(status: StatusDana) {
  switch (status) {
    case 'dicairkan':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'sebagian':
      return 'bg-gold-50 text-gold-700 border-gold-200'
    case 'belum_dicairkan':
    default:
      return 'bg-navy-50 text-navy-700 border-navy-200'
  }
}

function statusLpjColor(status: StatusLpj) {
  switch (status) {
    case 'diterima':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300'
    case 'diserahkan':
      return 'bg-gold-50 text-gold-700 border-gold-200'
    case 'perlu_revisi':
      return 'bg-amber-100 text-amber-800 border-amber-300'
    case 'belum_ada':
    default:
      return 'bg-navy-50 text-navy-700 border-navy-200'
  }
}

export default function PengajuanList() {
  const [search, setSearch] = useState('')
  const [statusProposal, setStatusProposal] = useState('')
  const [statusDana, setStatusDana] = useState('')
  const [statusLpj, setStatusLpj] = useState('')
  const [unit, setUnit] = useState('')
  const [tahunAnggaran, setTahunAnggaran] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 20

  const queryParams: PengajuanListQuery = {
    search: search.trim() || undefined,
    statusProposal: statusProposal || undefined,
    statusDana: statusDana || undefined,
    statusLpj: statusLpj || undefined,
    unit: unit.trim() || undefined,
    tahunAnggaran: tahunAnggaran ? Number(tahunAnggaran) : undefined,
    page,
    perPage,
  }

  const query = useQuery({
    queryKey: pengajuanKeys.list(queryParams),
    queryFn: ({ signal }) => pengajuanApi.list(queryParams, signal),
  })

  const resetFilters = () => {
    setSearch('')
    setStatusProposal('')
    setStatusDana('')
    setStatusLpj('')
    setUnit('')
    setTahunAnggaran('')
    setPage(1)
  }

  const items = query.data || []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-950">Pengajuan Dana & LPJ</h1>
          <p className="mt-1.5 text-sm text-slate-600">Kelola siklus pengajuan dana dari proposal hingga LPJ diterima.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/pengajuan/peringatan"
            className="flex h-11 items-center gap-2 rounded-lg border border-gold-200 bg-gold-50 px-4 text-sm font-semibold text-gold-700 transition-colors hover:bg-gold-100"
          >
            <AlertCircle size={18} className="text-gold-600" />
            Kewajiban LPJ
          </Link>
          <Link
            to="/pengajuan/create"
            className="flex h-11 items-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-600"
          >
            <Plus size={18} />
            Tambah Pengajuan
          </Link>
        </div>
      </div>

      <Card className="overflow-hidden rounded-xl border-slate-200 shadow-sm">
        <CardContent className="p-0">
          {/* Filters Bar */}
          <div className="space-y-3 border-b border-slate-200 bg-navy-50/40 p-4">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative min-w-[240px] flex-1">
                <Search className="absolute left-3.5 top-3 text-slate-400" size={18} />
                <Input
                  aria-label="Cari pengajuan"
                  placeholder="Cari nomor, judul, atau pengaju..."
                  value={search}
                  onChange={e => {
                    setSearch(e.target.value)
                    setPage(1)
                  }}
                  className="pl-10"
                />
              </div>

              <Select
                aria-label="Filter status proposal"
                value={statusProposal}
                onChange={e => {
                  setStatusProposal(e.target.value)
                  setPage(1)
                }}
                className="w-full sm:w-44"
              >
                <option value="">Semua Proposal</option>
                {statusProposalList.map(s => (
                  <option key={s} value={s}>
                    {STATUS_PROPOSAL_LABELS[s]}
                  </option>
                ))}
              </Select>

              <Select
                aria-label="Filter status dana"
                value={statusDana}
                onChange={e => {
                  setStatusDana(e.target.value)
                  setPage(1)
                }}
                className="w-full sm:w-44"
              >
                <option value="">Semua Dana</option>
                {statusDanaList.map(s => (
                  <option key={s} value={s}>
                    {STATUS_DANA_LABELS[s]}
                  </option>
                ))}
              </Select>

              <Select
                aria-label="Filter status LPJ"
                value={statusLpj}
                onChange={e => {
                  setStatusLpj(e.target.value)
                  setPage(1)
                }}
                className="w-full sm:w-44"
              >
                <option value="">Semua LPJ</option>
                {statusLpjList.map(s => (
                  <option key={s} value={s}>
                    {STATUS_LPJ_LABELS[s]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <Input
                aria-label="Filter unit"
                placeholder="Unit (mis. Biro IT)..."
                value={unit}
                onChange={e => {
                  setUnit(e.target.value)
                  setPage(1)
                }}
                className="w-full sm:w-48"
              />

              <Input
                aria-label="Filter tahun anggaran"
                type="number"
                placeholder="Tahun Anggaran..."
                value={tahunAnggaran}
                onChange={e => {
                  setTahunAnggaran(e.target.value)
                  setPage(1)
                }}
                className="w-full sm:w-44"
              />

              {(search || statusProposal || statusDana || statusLpj || unit || tahunAnggaran) && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={resetFilters}
                  className="flex items-center gap-1.5 text-slate-600 hover:text-navy-950"
                >
                  <RotateCcw size={14} />
                  Reset Filter
                </Button>
              )}
            </div>
          </div>

          {/* Table Content */}
          {query.isPending ? (
            <LoadingState message="Memuat daftar pengajuan..." />
          ) : query.isError ? (
            <div className="p-6">
              <ErrorState message={errorMessage(query.error)} retry={() => { void query.refetch() }} />
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-slate-600">
              <p className="text-base font-medium">
                {search || statusProposal || statusDana || statusLpj || unit || tahunAnggaran
                  ? 'Tidak ada pengajuan yang cocok dengan filter pencarian.'
                  : 'Belum ada data pengajuan dana.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/60">
                    <TableHead className="font-semibold text-slate-700">Nomor & Judul</TableHead>
                    <TableHead className="font-semibold text-slate-700">Unit & Pengaju</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tahun</TableHead>
                    <TableHead className="font-semibold text-slate-700">Estimasi</TableHead>
                    <TableHead className="font-semibold text-slate-700">Dicairkan</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status Proposal</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status Dana</TableHead>
                    <TableHead className="font-semibold text-slate-700">Status LPJ</TableHead>
                    <TableHead className="font-semibold text-slate-700">Tenggat LPJ</TableHead>
                    <TableHead className="text-right font-semibold text-slate-700">Tindakan</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map(row => {
                    const overdue = isOverdue(row.tenggatLpj, row.statusLpj)
                    return (
                      <TableRow key={row.id} className={overdue ? 'bg-red-50/40 hover:bg-red-50/70' : undefined}>
                        <TableCell>
                          <div>
                            <span className="inline-block rounded-full border border-navy-200 bg-navy-50 px-2.5 py-0.5 font-mono text-xs font-semibold text-navy-900">
                              {row.nomor}
                            </span>
                            <p className="mt-1 font-medium text-navy-950 line-clamp-2">{row.judul}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium text-navy-950">{row.unit}</p>
                            <p className="text-xs text-slate-600">{row.pengajuNama}</p>
                          </div>
                        </TableCell>
                        <TableCell className="tabular-nums text-slate-700">{row.tahunAnggaran}</TableCell>
                        <TableCell className="font-medium tabular-nums text-navy-950">{formatRupiah(row.estimasiBiaya)}</TableCell>
                        <TableCell className="font-medium tabular-nums text-navy-950">
                          {row.jumlahDicairkan ? formatRupiah(row.jumlahDicairkan) : '—'}
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusProposalColor(
                              row.statusProposal
                            )}`}
                          >
                            {STATUS_PROPOSAL_LABELS[row.statusProposal]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusDanaColor(
                              row.statusDana
                            )}`}
                          >
                            {STATUS_DANA_LABELS[row.statusDana]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span
                            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${statusLpjColor(
                              row.statusLpj
                            )}`}
                          >
                            {STATUS_LPJ_LABELS[row.statusLpj]}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <span className="text-slate-700">{formatDate(row.tenggatLpj)}</span>
                            {overdue && (
                              <span className="block w-fit rounded-full bg-red-600 px-2.5 py-0.5 text-xs font-bold text-white" role="status" aria-label="Terlambat">
                                Terlambat
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Link
                              to={`/pengajuan/${row.id}`}
                              className="inline-flex h-9 items-center rounded-lg border border-gold-200 bg-gold-50 px-3.5 text-xs font-semibold text-gold-700 transition-colors hover:bg-gold-100"
                            >
                              Detail
                            </Link>
                            <Link
                              to={`/pengajuan/edit/${row.id}`}
                              className="inline-flex h-9 items-center rounded-lg border border-slate-300 bg-white px-3.5 text-xs font-medium text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-700"
                            >
                              Edit
                            </Link>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-slate-200 bg-navy-50/40 px-4 py-3">
            <span className="text-sm font-medium text-slate-600">Halaman {page}</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page <= 1 || query.isPending}
              >
                Sebelumnya
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(p => p + 1)}
                disabled={items.length < perPage || query.isPending}
              >
                Berikutnya
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
