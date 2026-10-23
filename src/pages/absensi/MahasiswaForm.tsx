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
  studentFormSchema,
  studentKeys,
  STUDENT_LIST_KEY,
  type Student,
  type StudentPatch,
  type StudentFormValues,
} from '@/lib/absensi'
import { useNotice } from '@/lib/contexts'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/components/feedback'

export default function MahasiswaForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const notice = useNotice()
  const form = useForm<StudentFormValues>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: { nim: '', name: '', active: true },
  })
  const detail = useQuery({
    queryKey: studentKeys.detail(id || ''),
    enabled: !!id,
    queryFn: ({ signal }) => absensiApi.student(id!, signal),
  })

  // GET ulang setelah konflik versi memperbarui versi di cache, bukan menimpa
  // isian pengguna: reset hanya terjadi saat data pertama untuk id ini tiba.
  const loaded = useRef<string | null>(null)
  useEffect(() => {
    if (!detail.data || loaded.current === detail.data.id) return
    loaded.current = detail.data.id
    form.reset({ nim: detail.data.nim, name: detail.data.name, active: detail.data.active })
  }, [detail.data, form])

  const save = useMutation({
    mutationFn: (values: StudentFormValues) => {
      const nim = values.nim.trim().toUpperCase()
      const name = values.name.trim()
      if (!id) return absensiApi.createStudent({ nim, name, active: values.active ?? true })
      const current = detail.data
      if (!current) throw new Error('Data mahasiswa belum dimuat.')
      const patch: StudentPatch = { expectedVersion: current.version }
      if (nim !== current.nim) patch.nim = nim
      if (name !== current.name) patch.name = name
      return absensiApi.updateStudent(id, patch)
    },
    onSuccess: async (student: Student) => {
      queryClient.setQueryData(studentKeys.detail(student.id), student)
      await queryClient.invalidateQueries({ queryKey: STUDENT_LIST_KEY })
      notice(id ? 'Data mahasiswa berhasil diperbarui.' : 'Mahasiswa berhasil ditambahkan.')
      navigate(id ? `/absensi/mahasiswa/${id}` : '/absensi/mahasiswa')
    },
    onError: error => {
      if (isVersionConflict(error) && !id) return notice(absensiErrorText(error), 'error')
      if (isVersionConflict(error)) void detail.refetch()
      notice(absensiErrorText(error), 'error')
    },
  })

  if (id && detail.isPending) return <LoadingState message="Memuat formulir mahasiswa..." />
  if (id && detail.isError) return <ErrorState message={absensiErrorText(detail.error)} retry={() => { void detail.refetch() }} />

  const submit = form.handleSubmit(values => {
    const current = detail.data
    if (current && values.nim.trim().toUpperCase() === current.nim && values.name.trim() === current.name) {
      notice('Tidak ada perubahan untuk disimpan.')
      return
    }
    save.mutate(values)
  })

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="space-y-2">
        <Link to="/absensi/mahasiswa" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
          <ArrowLeft size={16} />
          Kembali ke daftar mahasiswa
        </Link>
        <h1 className="text-3xl font-bold text-navy-950">{id ? 'Ubah Data Mahasiswa' : 'Tambah Mahasiswa'}</h1>
        <p className="text-sm text-slate-600">
          NIM dan nama saja. Status aktif diubah dari halaman detail; penghubungan akun dipisahkan dari formulir ini.
        </p>
      </div>

      <Card className="rounded-xl border-slate-200">
        <CardContent className="p-6">
          <form noValidate onSubmit={submit} className="space-y-5">
            <fieldset disabled={save.isPending} className="grid min-w-0 gap-5">
              <div className="space-y-2">
                <label htmlFor="nim" className="block text-sm font-semibold text-navy-950">NIM</label>
                <Input
                  id="nim"
                  aria-invalid={!!form.formState.errors.nim}
                  aria-describedby="nim-error"
                  {...form.register('nim')}
                />
                {form.formState.errors.nim && (
                  <p id="nim-error" role="alert" className="text-xs font-medium text-red-600">{form.formState.errors.nim.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="name" className="block text-sm font-semibold text-navy-950">Nama</label>
                <Input
                  id="name"
                  aria-invalid={!!form.formState.errors.name}
                  aria-describedby="name-error"
                  {...form.register('name')}
                />
                {form.formState.errors.name && (
                  <p id="name-error" role="alert" className="text-xs font-medium text-red-600">{form.formState.errors.name.message}</p>
                )}
              </div>

              {!id && (
                <label className="flex items-center gap-2.5 text-sm font-medium text-navy-950">
                  <input type="checkbox" className="h-4 w-4 rounded border-slate-300 text-gold-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/30" {...form.register('active')} />
                  Mahasiswa aktif
                </label>
              )}
            </fieldset>

            {save.isError && (
              <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{absensiErrorText(save.error)}</p>
            )}

            <div className="flex flex-wrap gap-3">
              <Button variant="gold" type="submit" disabled={save.isPending}>
                {save.isPending ? 'Menyimpan...' : 'Simpan'}
              </Button>
              <Button variant="outline" type="button" onClick={() => navigate(id ? `/absensi/mahasiswa/${id}` : '/absensi/mahasiswa')}>
                Batal
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
