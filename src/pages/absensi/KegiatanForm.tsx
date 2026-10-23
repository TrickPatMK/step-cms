import { useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import {
  absensiApi,
  absensiErrorText,
  isVersionConflict,
  kegiatanFormSchema,
  kegiatanKeys,
  KEGIATAN_LIST_KEY,
  toLocalInput,
  toWireUtc,
  type Kegiatan,
  type KegiatanFormValues,
  type KegiatanPatch,
} from '@/lib/absensi'
import { useNotice } from '@/lib/contexts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/components/feedback'

export default function KegiatanForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notice = useNotice()
  const form = useForm<KegiatanFormValues>({
    resolver: zodResolver(kegiatanFormSchema),
    defaultValues: { title: '', startsAt: '', endsAt: '' },
  })
  const detail = useQuery({
    queryKey: kegiatanKeys.detail(id || ''),
    enabled: !!id,
    queryFn: ({ signal }) => absensiApi.kegiatanDetail(id!, signal),
  })

  // Sama seperti formulir mahasiswa: GET ulang setelah konflik versi tidak
  // boleh menimpa isian pengguna yang belum tersimpan.
  const loaded = useRef<string | null>(null)
  useEffect(() => {
    if (!detail.data || loaded.current === detail.data.id) return
    loaded.current = detail.data.id
    form.reset({
      title: detail.data.title,
      startsAt: toLocalInput(detail.data.startsAt),
      endsAt: toLocalInput(detail.data.endsAt),
    })
  }, [detail.data, form])

  const save = useMutation({
    mutationFn: (values: KegiatanFormValues) => {
      const title = values.title.trim()
      if (!id) return absensiApi.createKegiatan({ title, startsAt: toWireUtc(values.startsAt), endsAt: toWireUtc(values.endsAt) })
      const current = detail.data
      if (!current) throw new Error('Data kegiatan belum dimuat.')
      const patch: KegiatanPatch = { expectedVersion: current.version }
      if (title !== current.title) patch.title = title
      if (values.startsAt !== toLocalInput(current.startsAt)) patch.startsAt = toWireUtc(values.startsAt)
      if (values.endsAt !== toLocalInput(current.endsAt)) patch.endsAt = toWireUtc(values.endsAt)
      return absensiApi.updateKegiatan(id, patch)
    },
    onSuccess: async (kegiatan: Kegiatan) => {
      queryClient.setQueryData(kegiatanKeys.detail(kegiatan.id), kegiatan)
      await queryClient.invalidateQueries({ queryKey: KEGIATAN_LIST_KEY })
      notice(id ? 'Jadwal kegiatan berhasil diperbarui.' : 'Jadwal kegiatan berhasil ditambahkan.')
      navigate(id ? `/absensi/kegiatan/${id}` : '/absensi/kegiatan')
    },
    onError: error => {
      if (isVersionConflict(error) && id) void detail.refetch()
      notice(absensiErrorText(error), 'error')
    },
  })

  if (id && detail.isPending) return <LoadingState message="Memuat formulir kegiatan..." />
  if (id && detail.isError) return <ErrorState message={absensiErrorText(detail.error)} retry={() => { void detail.refetch() }} />

  const submit = form.handleSubmit(values => {
    const current = detail.data
    const tanpaPerubahan =
      current &&
      values.title.trim() === current.title &&
      values.startsAt === toLocalInput(current.startsAt) &&
      values.endsAt === toLocalInput(current.endsAt)
    if (tanpaPerubahan) {
      notice('Tidak ada perubahan untuk disimpan.')
      return
    }
    save.mutate(values)
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link to="/absensi/kegiatan" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
          <ArrowLeft size={16} />
          Kembali ke jadwal kegiatan
        </Link>
        <h1 className="text-3xl font-bold text-navy-950">{id ? 'Ubah Jadwal Kegiatan' : 'Tambah Kegiatan'}</h1>
        <p className="text-sm text-slate-600">
          Jadwal dibuat sebagai draft; penerbitan dilakukan dari halaman detail. Waktu diisi dalam zona waktu perangkat ini.
        </p>
      </div>

      <Card className="rounded-xl border-slate-200">
        <CardContent className="p-6">
          <form noValidate onSubmit={submit} className="space-y-5">
            <fieldset disabled={save.isPending} className="grid min-w-0 gap-5">
              <div className="space-y-2">
                <label htmlFor="title" className="block text-sm font-semibold text-navy-950">Judul kegiatan</label>
                <Input
                  id="title"
                  aria-invalid={!!form.formState.errors.title}
                  aria-describedby="title-error"
                  {...form.register('title')}
                />
                {form.formState.errors.title && (
                  <p id="title-error" role="alert" className="text-xs font-medium text-red-600">{form.formState.errors.title.message}</p>
                )}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div className="space-y-2">
                  <label htmlFor="startsAt" className="block text-sm font-semibold text-navy-950">Waktu mulai</label>
                  <Input
                    id="startsAt"
                    type="datetime-local"
                    aria-invalid={!!form.formState.errors.startsAt}
                    aria-describedby="startsAt-error"
                    {...form.register('startsAt')}
                  />
                  {form.formState.errors.startsAt && (
                    <p id="startsAt-error" role="alert" className="text-xs font-medium text-red-600">{form.formState.errors.startsAt.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="endsAt" className="block text-sm font-semibold text-navy-950">Waktu selesai</label>
                  <Input
                    id="endsAt"
                    type="datetime-local"
                    aria-invalid={!!form.formState.errors.endsAt}
                    aria-describedby="endsAt-error"
                    {...form.register('endsAt')}
                  />
                  {form.formState.errors.endsAt && (
                    <p id="endsAt-error" role="alert" className="text-xs font-medium text-red-600">{form.formState.errors.endsAt.message}</p>
                  )}
                </div>
              </div>
            </fieldset>

            {save.isError && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{absensiErrorText(save.error)}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="gold" type="submit" disabled={save.isPending}>
                {save.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" type="button" onClick={() => navigate(id ? `/absensi/kegiatan/${id}` : '/absensi/kegiatan')}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
