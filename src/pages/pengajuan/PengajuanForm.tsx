import { useEffect } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2 } from 'lucide-react'
import {
  pengajuanApi,
  pengajuanKeys,
  pengajuanFormSchema,
  jenisPengajuanList,
  JENIS_LABELS,
  formatRupiah,
  type PengajuanFormValues,
} from '@/lib/pengajuan'
import { useNotice } from '@/lib/contexts'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { LoadingState, ErrorState } from '@/components/feedback'

const defaultValues: PengajuanFormValues = {
  nomor: '',
  judul: '',
  jenis: 'pengadaan',
  unit: '',
  pengajuNama: '',
  pengajuId: '',
  tahunAnggaran: new Date().getFullYear(),
  estimasiBiaya: '',
  tanggalProposal: new Date().toISOString().slice(0, 10),
  tenggatLpj: '',
  catatan: '',
  item: [],
}

export default function PengajuanForm() {
  const { id } = useParams<{ id: string }>()
  const isEdit = !!id
  const navigate = useNavigate()
  const notice = useNotice()
  const queryClient = useQueryClient()

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<PengajuanFormValues>({
    resolver: zodResolver(pengajuanFormSchema),
    defaultValues,
  })

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'item',
  })

  // Watch items for live totals
  const watchedItems = watch('item') || []
  const liveTotalRencana = watchedItems.reduce((sum, it) => {
    const qty = it?.qtyRencana ? Number(it.qtyRencana) : 0
    const price = it?.hargaRencana ? Number(it.hargaRencana) : 0
    return sum + (isNaN(qty * price) ? 0 : qty * price)
  }, 0)

  const detailQuery = useQuery({
    queryKey: pengajuanKeys.detail(id || ''),
    queryFn: ({ signal }) => pengajuanApi.detail(id!, signal),
    enabled: isEdit,
  })

  useEffect(() => {
    if (detailQuery.data) {
      const p = detailQuery.data
      reset({
        nomor: p.nomor,
        judul: p.judul,
        jenis: p.jenis,
        unit: p.unit,
        pengajuNama: p.pengajuNama,
        pengajuId: p.pengajuId || '',
        tahunAnggaran: p.tahunAnggaran,
        estimasiBiaya: p.estimasiBiaya,
        tanggalProposal: p.tanggalProposal || '',
        tenggatLpj: p.tenggatLpj || '',
        catatan: p.catatan || '',
        item:
          p.item.length > 0
            ? p.item.map(it => ({
                uraian: it.uraian,
                satuan: it.satuan || '',
                qtyRencana: it.qtyRencana || '',
                hargaRencana: it.hargaRencana || '',
                qtyRealisasi: it.qtyRealisasi || '',
                hargaRealisasi: it.hargaRealisasi || '',
              }))
            : defaultValues.item,
      })
    }
  }, [detailQuery.data, reset])

  const saveMutation = useMutation({
    mutationFn: (values: PengajuanFormValues) =>
      isEdit ? pengajuanApi.update(id!, values) : pengajuanApi.create(values),
    onSuccess: async createdOrUpdated => {
      await queryClient.invalidateQueries({ queryKey: pengajuanKeys.all })
      notice(`Pengajuan dana berhasil ${isEdit ? 'diperbarui' : 'dibuat'}.`)
      navigate(isEdit ? `/pengajuan/${id}` : `/pengajuan/${createdOrUpdated.id}`)
    },
    onError: error => {
      notice(errorMessage(error), 'error')
    },
  })

  if (isEdit && detailQuery.isPending) {
    return <LoadingState message="Memuat data pengajuan..." />
  }

  if (isEdit && detailQuery.isError) {
    return (
      <div className="space-y-4">
        <Link to="/pengajuan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
          <ArrowLeft size={16} /> Kembali ke daftar
        </Link>
        <ErrorState message={errorMessage(detailQuery.error)} retry={() => { void detailQuery.refetch() }} />
      </div>
    )
  }

  const onSubmit = (values: PengajuanFormValues) => {
    saveMutation.mutate(values)
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <Link
            to={isEdit ? `/pengajuan/${id}` : '/pengajuan'}
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline"
          >
            <ArrowLeft size={16} /> {isEdit ? 'Kembali ke detail' : 'Kembali ke daftar'}
          </Link>
          <h1 className="mt-2 text-3xl font-bold text-navy-950">
            {isEdit ? 'Ubah Pengajuan Dana' : 'Buat Pengajuan Dana Baru'}
          </h1>
          <p className="mt-1.5 text-sm text-slate-600">
            {isEdit
              ? 'Ubah informasi proposal atau rincian pos anggaran.'
              : 'Daftarkan proposal pengajuan dana baru dalam status draft.'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Data Dasar Pengajuan */}
        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-navy-950">Data Proposal Pengajuan</CardTitle>
            <p className="text-xs text-slate-600">
              Catatan: Status pengajuan dikendalikan melalui transisi status terpisah dan tidak dapat diubah dari form ini.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="nomor" className="text-sm font-semibold text-navy-950">
                  Nomor Pengajuan <span className="text-red-600">*</span>
                </label>
                <Input
                  id="nomor"
                  placeholder="Contoh: 014/BAAK/STEP/2026"
                  aria-invalid={!!errors.nomor}
                  aria-describedby="nomor-error"
                  {...register('nomor')}
                />
                {errors.nomor && (
                  <p id="nomor-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.nomor.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="jenis" className="text-sm font-semibold text-navy-950">
                  Jenis Pengajuan <span className="text-red-600">*</span>
                </label>
                <Select id="jenis" aria-invalid={!!errors.jenis} {...register('jenis')}>
                  {jenisPengajuanList.map(j => (
                    <option key={j} value={j}>
                      {JENIS_LABELS[j]}
                    </option>
                  ))}
                </Select>
                {errors.jenis && (
                  <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.jenis.message}
                  </p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="judul" className="text-sm font-semibold text-navy-950">
                Judul Pengajuan <span className="text-red-600">*</span>
              </label>
              <Input
                id="judul"
                placeholder="Contoh: Pengadaan SSD PC BAAK dan Webcam Kantor STEP Semarang"
                aria-invalid={!!errors.judul}
                aria-describedby="judul-error"
                {...register('judul')}
              />
              {errors.judul && (
                <p id="judul-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                  {errors.judul.message}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="unit" className="text-sm font-semibold text-navy-950">
                  Unit Pengaju <span className="text-red-600">*</span>
                </label>
                <Input
                  id="unit"
                  placeholder="Contoh: Biro IT / BAAK"
                  aria-invalid={!!errors.unit}
                  aria-describedby="unit-error"
                  {...register('unit')}
                />
                {errors.unit && (
                  <p id="unit-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.unit.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="pengajuNama" className="text-sm font-semibold text-navy-950">
                  Nama Pengaju (Tercetak) <span className="text-red-600">*</span>
                </label>
                <Input
                  id="pengajuNama"
                  placeholder="Nama staf pengaju..."
                  aria-invalid={!!errors.pengajuNama}
                  aria-describedby="pengajuNama-error"
                  {...register('pengajuNama')}
                />
                {errors.pengajuNama && (
                  <p id="pengajuNama-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.pengajuNama.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <label htmlFor="tahunAnggaran" className="text-sm font-semibold text-navy-950">
                  Tahun Anggaran <span className="text-red-600">*</span>
                </label>
                <Input
                  id="tahunAnggaran"
                  type="number"
                  aria-invalid={!!errors.tahunAnggaran}
                  aria-describedby="tahunAnggaran-error"
                  {...register('tahunAnggaran')}
                />
                {errors.tahunAnggaran && (
                  <p id="tahunAnggaran-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.tahunAnggaran.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="estimasiBiaya" className="text-sm font-semibold text-navy-950">
                  Estimasi Biaya Total (Rp) <span className="text-red-600">*</span>
                </label>
                <Input
                  id="estimasiBiaya"
                  placeholder="Contoh: 1400000"
                  aria-invalid={!!errors.estimasiBiaya}
                  aria-describedby="estimasiBiaya-error"
                  {...register('estimasiBiaya')}
                />
                {errors.estimasiBiaya && (
                  <p id="estimasiBiaya-error" role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                    {errors.estimasiBiaya.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="tanggalProposal" className="text-sm font-semibold text-navy-950">
                  Tanggal Proposal
                </label>
                <Input id="tanggalProposal" type="date" {...register('tanggalProposal')} />
              </div>
            </div>

            {!isEdit && (
              <div className="space-y-2">
                <label htmlFor="tenggatLpj" className="text-sm font-semibold text-navy-950">
                  Tenggat LPJ Awal (Opsional)
                </label>
                <Input id="tenggatLpj" type="date" {...register('tenggatLpj')} />
                <p className="text-xs text-slate-600">
                  Dapat ditentukan nanti saat persetujuan proposal.
                </p>
              </div>
            )}

            {isEdit && (
              <div className="rounded-lg border border-gold-200 bg-gold-50 p-3 text-xs font-medium text-gold-700">
                Untuk mengubah tenggat LPJ pada pengajuan yang sudah ada, gunakan tombol aksi <strong>Ubah Tenggat LPJ</strong> di halaman detail dengan alasan perubahan tercatat.
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="catatan" className="text-sm font-semibold text-navy-950">
                Catatan Pengajuan (Opsional)
              </label>
              <Textarea
                id="catatan"
                rows={3}
                placeholder="Tambahkan catatan latar belakang atau tautan dokumen luar..."
                {...register('catatan')}
              />
            </div>
          </CardContent>
        </Card>

        {/* Pos Anggaran (RAB vs Realisasi) */}
        <Card className="rounded-xl border-slate-200">
          <CardHeader className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <CardTitle className="text-lg font-bold text-navy-950">Rincian Pos Anggaran (RAB & Realisasi)</CardTitle>
              <p className="text-xs text-slate-600">
                Daftarkan pos belanja proposal (rencana) dan pengeluaran nyata (realisasi bila sudah ada).
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                append({
                  uraian: '',
                  satuan: '',
                  qtyRencana: '',
                  hargaRencana: '',
                  qtyRealisasi: '',
                  hargaRealisasi: '',
                })
              }
              className="flex items-center gap-1.5"
            >
              <Plus size={16} /> Tambah Baris Pos
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {fields.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-600">
                Belum ada rincian pos belanja proposal. Klik tombol <strong>Tambah Baris Pos</strong> di atas untuk menambahkan pos belanja.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50/60">
                      <TableHead className="w-10 font-semibold text-slate-700">No</TableHead>
                      <TableHead className="min-w-[200px] font-semibold text-slate-700">Uraian Belanja *</TableHead>
                      <TableHead className="w-24 font-semibold text-slate-700">Satuan</TableHead>
                      <TableHead className="w-28 font-semibold text-slate-700">Qty Rencana</TableHead>
                      <TableHead className="w-36 font-semibold text-slate-700">Harga Rencana</TableHead>
                      <TableHead className="w-28 font-semibold text-slate-700">Qty Realisasi</TableHead>
                      <TableHead className="w-36 font-semibold text-slate-700">Harga Realisasi</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell className="text-center font-medium text-slate-500">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Nama pos / barang / kegiatan..."
                            aria-label={`Uraian pos ${index + 1}`}
                            {...register(`item.${index}.uraian` as const)}
                          />
                          {errors.item?.[index]?.uraian && (
                            <p role="alert" className="mt-1.5 text-xs font-medium text-red-600">
                              {errors.item[index]?.uraian?.message}
                            </p>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            placeholder="Unit, buah..."
                            aria-label={`Satuan pos ${index + 1}`}
                            {...register(`item.${index}.satuan` as const)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="1"
                            aria-label={`Qty rencana pos ${index + 1}`}
                            {...register(`item.${index}.qtyRencana` as const)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="Rp..."
                            aria-label={`Harga rencana pos ${index + 1}`}
                            {...register(`item.${index}.hargaRencana` as const)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="0"
                            aria-label={`Qty realisasi pos ${index + 1}`}
                            {...register(`item.${index}.qtyRealisasi` as const)}
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            placeholder="Rp..."
                            aria-label={`Harga realisasi pos ${index + 1}`}
                            {...register(`item.${index}.hargaRealisasi` as const)}
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            aria-label={`Hapus baris ${index + 1}`}
                            onClick={() => remove(index)}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between border-t border-slate-200 bg-navy-50/40 px-6 py-3.5 text-sm">
              <span className="font-medium text-slate-700">
                Total Rencana Pos yang Terinput:
              </span>
              <span className="font-bold tabular-nums text-navy-950">{formatRupiah(liveTotalRencana)}</span>
            </div>
          </CardContent>
        </Card>

        {saveMutation.isError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
            {errorMessage(saveMutation.error)}
          </p>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          <Link
            to={isEdit ? `/pengajuan/${id}` : '/pengajuan'}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-5 text-sm font-semibold text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-700"
          >
            Batal
          </Link>
          <Button
            type="submit"
            variant="gold"
            disabled={saveMutation.isPending}
            className="px-6 font-semibold"
          >
            {saveMutation.isPending ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Buat Pengajuan'}
          </Button>
        </div>
      </form>
    </div>
  )
}
