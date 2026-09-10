import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select } from '@/components/ui/select'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ImageUpload } from '@/components/ui/image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save, GraduationCap, Mail, Hash } from 'lucide-react'

// Schema validasi form Faculty
const facultyFormSchema = z.object({
  name: z.string().min(2, 'Nama dosen/staf minimal 2 karakter'),
  role: z.string().min(2, 'Jabatan atau peran akademik wajib diisi'),
  department: z.string().min(2, 'Departemen atau program studi wajib diisi'),
  category: z.string().min(1, 'Kategori kepegawaian wajib ditentukan'),
  email: z.string().email('Format email tidak valid').optional().or(z.literal('')),
  nip: z.string().optional(),
  photoUrl: z.string().optional(),
  bio: z.string().optional(),
  order: z.coerce.number().default(0),
})

type FacultyFormValues = z.infer<typeof facultyFormSchema>

export default function FacultyForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const form = useForm<FacultyFormValues>({
    resolver: zodResolver(facultyFormSchema) as any,
    defaultValues: {
      name: '',
      role: '',
      department: '',
      category: 'DOSEN_TETAP',
      email: '',
      nip: '',
      photoUrl: '',
      bio: '',
      order: 0,
    },
  })

  useEffect(() => {
    if (isEdit) {
      const fetchFaculty = async () => {
        try {
          setIsFetching(true)
          const res = await api.get(`/api/faculty/${id}`)
          const item = res.data?.data || res.data
          form.reset({
            name: item.name || '',
            role: item.role || item.title || '',
            department: item.department || '',
            category: item.category || 'DOSEN_TETAP',
            email: item.email || '',
            nip: item.nip || '',
            photoUrl: item.photoUrl || '',
            bio: item.bio || '',
            order: item.order ?? item.sortOrder ?? 0,
          })
        } catch (error) {
          console.error('Gagal mengambil data dosen/staf:', error)
          alert('Gagal memuat detail profil dosen/staf.')
          navigate('/faculty')
        } finally {
          setIsFetching(false)
        }
      }
      fetchFaculty()
    }
  }, [id, isEdit, form, navigate])

  const onSubmit = async (values: FacultyFormValues) => {
    try {
      setIsSubmitting(true)

      const payload = {
        name: values.name,
        role: values.role,
        title: values.role,
        department: values.department,
        category: values.category,
        email: values.email || null,
        nip: values.nip || null,
        photoUrl: values.photoUrl || null,
        bio: values.bio || null,
        order: Number(values.order) || 0,
        sortOrder: Number(values.order) || 0,
      }

      if (isEdit) {
        await api.put(`/api/faculty/${id}`, payload)
        alert('Data dosen/staf berhasil diperbarui!')
      } else {
        await api.post('/api/faculty', payload)
        alert('Dosen/staf baru berhasil ditambahkan!')
      }

      navigate('/faculty')
    } catch (error: any) {
      console.error('Error menyimpan data dosen/staf:', error)
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data.'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-indigo-500" size={44} />
        <p className="font-semibold text-lg text-slate-600">Memuat profil dosen/staf...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Top Bar */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate('/faculty')}
            className="rounded-xl border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isEdit ? 'Edit Profil Dosen / Staf' : 'Tambah Dosen / Staf Baru'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Lengkapi biodata akademik, kontak, dan jabatan dosen atau staf.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kolom Kiri: Informasi Pribadi & Akademik */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Identitas & Jabatan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Nama Lengkap & Gelar</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contoh: Dr. Samuel Hadi, M.Th." 
                            className="h-11 rounded-xl"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <GraduationCap size={15} className="text-indigo-600" />
                            Jabatan / Peran
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Contoh: Wakil Ketua I / Dosen Tetap" 
                              className="h-11 rounded-xl"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700">Departemen / Prodi</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Contoh: Program Studi Sarjana Teologi" 
                              className="h-11 rounded-xl"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="nip"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Hash size={15} className="text-slate-400" />
                            NIDN / NIP (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Contoh: 2301048201" 
                              className="h-11 rounded-xl"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Mail size={15} className="text-slate-400" />
                            Email Resmi (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="Contoh: samuel.hadi@step.ac.id" 
                              className="h-11 rounded-xl"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Biografi Singkat / Profil Akademik</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={5} 
                            placeholder="Tuliskan latar belakang pendidikan, bidang keahlian pengajaran, atau riset..." 
                            className="rounded-xl resize-none"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Kolom Kanan: Foto Profil, Kategori & Urutan */}
            <div className="space-y-6">
              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Foto Profil Resmi</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="photoUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-400 mt-2">
                          Disarankan foto formal rasio 1:1 atau 3:4 dengan resolusi jelas.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Kategori & Urutan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Kategori Kepegawaian</FormLabel>
                        <FormControl>
                          <Select className="h-11 rounded-xl" {...field}>
                            <option value="PIMPINAN">Pimpinan Kampus</option>
                            <option value="DOSEN_TETAP">Dosen Tetap</option>
                            <option value="DOSEN_TIDAK_TETAP">Dosen Luar Biasa</option>
                            <option value="STAF">Staf Kependidikan</option>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="order"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Urutan Tampilan (Sort Order)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            min={0}
                            placeholder="0" 
                            className="h-11 rounded-xl"
                            {...field} 
                          />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-400">
                          Angka lebih kecil akan tampil lebih awal di halaman profil website.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Submit Button */}
              <Card className="bg-slate-50 border-none shadow-none">
                <CardContent className="p-0">
                  <Button 
                    type="submit" 
                    className="w-full h-12 rounded-xl text-base font-bold bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/25" 
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={18} />
                        Menyimpan Profil...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={18} />
                        {isEdit ? 'Simpan Perubahan' : 'Daftarkan Dosen / Staf'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </Form>
    </div>
  )
}
