import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Link2, Link2Off } from 'lucide-react'
import {
  absensiApi,
  absensiErrorText,
  formatJadwal,
  isVersionConflict,
  studentKeys,
  STUDENT_LIST_KEY,
  type Student,
} from '@/lib/absensi'
import { useNotice } from '@/lib/contexts'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ErrorState, LoadingState } from '@/components/feedback'

type Aksi = 'aktifkan' | 'nonaktifkan' | 'petakan' | 'lepas'

export default function MahasiswaDetail() {
  const { id = '' } = useParams()
  const queryClient = useQueryClient()
  const notice = useNotice()
  const [akunId, setAkunId] = useState('')

  const detail = useQuery({
    queryKey: studentKeys.detail(id),
    enabled: !!id,
    queryFn: ({ signal }) => absensiApi.student(id, signal),
  })
  const accounts = useQuery({
    queryKey: studentKeys.accounts,
    queryFn: ({ signal }) => absensiApi.accounts(signal),
  })

  const simpan = useMutation({
    mutationFn: (aksi: Aksi) => {
      const student = detail.data
      if (!student) throw new Error('Data mahasiswa belum dimuat.')
      if (aksi === 'aktifkan') return absensiApi.updateStudent(id, { expectedVersion: student.version, active: true })
      if (aksi === 'nonaktifkan') return absensiApi.updateStudent(id, { expectedVersion: student.version, active: false })
      if (aksi === 'petakan') return absensiApi.setStudentAccount(id, { expectedVersion: student.version, userId: akunId })
      return absensiApi.setStudentAccount(id, { expectedVersion: student.version, userId: null })
    },
    onSuccess: async (student: Student) => {
      queryClient.setQueryData(studentKeys.detail(id), student)
      setAkunId('')
      await queryClient.invalidateQueries({ queryKey: STUDENT_LIST_KEY })
      notice('Perubahan data mahasiswa tersimpan.')
    },
    onError: error => {
      if (isVersionConflict(error)) void detail.refetch()
      notice(absensiErrorText(error), 'error')
    },
  })

  if (detail.isPending) return <LoadingState message="Memuat data mahasiswa..." />
  if (detail.isError) return <ErrorState message={absensiErrorText(detail.error)} retry={() => { void detail.refetch() }} />

  const student = detail.data
  const akunTerhubung = accounts.data?.find(akun => akun.id === student.userId)
  const labelAkun = akunTerhubung ? `${akunTerhubung.name} (${akunTerhubung.email})` : student.userId ? `ID akun ${student.userId}` : null

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="space-y-2">
        <Link to="/absensi/mahasiswa" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gold-700 hover:text-gold-600 hover:underline">
          <ArrowLeft size={16} />
          Kembali ke daftar mahasiswa
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold text-navy-950">{student.name}</h1>
            <p className="mt-1 font-mono text-sm text-slate-600">{student.nim}</p>
          </div>
          <Link
            to={`/absensi/mahasiswa/${student.id}/edit`}
            className="inline-flex h-11 items-center rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-700"
          >
            Ubah data
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-navy-950">Data mahasiswa</CardTitle>
            <CardDescription>Versi data: {student.version}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Status</span>
              <span
                className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                  student.active ? 'border-emerald-300 bg-emerald-100 text-emerald-800' : 'border-slate-300 bg-slate-100 text-slate-700'
                }`}
              >
                {student.active ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Dibuat</span>
              <span className="text-navy-950">{formatJadwal(student.createdAt)}</span>
            </div>
            <div className="flex items-center justify-between gap-3 border-b border-slate-100 pb-2">
              <span className="text-slate-600">Diperbarui</span>
              <span className="text-navy-950">{formatJadwal(student.updatedAt)}</span>
            </div>
            <p className="pt-1 text-xs leading-relaxed text-slate-600">
              Menonaktifkan mahasiswa tidak menghapus penghubungan akun maupun riwayat kegiatan. Penghubungan akun lama muncul kembali saat mahasiswa diaktifkan.
            </p>
            {simpan.isError && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">{absensiErrorText(simpan.error)}</p>}
            <Button
              variant="outline"
              type="button"
              disabled={simpan.isPending}
              onClick={() => simpan.mutate(student.active ? 'nonaktifkan' : 'aktifkan')}
            >
              {simpan.isPending ? 'Menyimpan...' : student.active ? 'Nonaktifkan mahasiswa' : 'Aktifkan mahasiswa'}
            </Button>
          </CardContent>
        </Card>

        <Card className="rounded-xl border-slate-200">
          <CardHeader>
            <CardTitle className="text-lg font-bold text-navy-950">Akun terhubung</CardTitle>
            <CardDescription>Pemetaan satu akun ke satu mahasiswa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p className="text-navy-950">{labelAkun ?? 'Belum terhubung ke akun mana pun.'}</p>
            {accounts.isError ? (
              <div className="space-y-2">
                <p role="alert" className="text-sm text-red-600">{absensiErrorText(accounts.error)}</p>
                <Button variant="outline" size="sm" type="button" onClick={() => { void accounts.refetch() }}>Coba lagi</Button>
              </div>
            ) : (
              <>
                <label htmlFor="akun" className="block text-sm font-semibold text-navy-950">Pilih akun</label>
                <Select id="akun" value={akunId} onChange={event => setAkunId(event.target.value)} disabled={accounts.isPending || simpan.isPending}>
                  <option value="">{accounts.isPending ? 'Memuat daftar akun...' : 'Pilih akun pengguna'}</option>
                  {(accounts.data ?? []).map(akun => (
                    <option key={akun.id} value={akun.id}>{akun.name} — {akun.email}</option>
                  ))}
                </Select>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="gold"
                    type="button"
                    disabled={!akunId || akunId === student.userId || simpan.isPending}
                    onClick={() => simpan.mutate('petakan')}
                  >
                    <Link2 size={15} />
                    {student.userId ? 'Ganti akun terhubung' : 'Hubungkan akun'}
                  </Button>
                  {student.userId && (
                    <Button variant="outline" type="button" disabled={simpan.isPending} onClick={() => simpan.mutate('lepas')}>
                      <Link2Off size={15} />
                      Lepas penghubungan
                    </Button>
                  )}
                </div>
                {!student.active && (
                  <p className="text-xs leading-relaxed text-slate-600">
                    Mahasiswa nonaktif tidak dapat dihubungkan ke akun baru. Aktifkan mahasiswa lebih dahulu; melepas penghubungan tetap boleh.
                  </p>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
