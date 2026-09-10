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
import { ArrowLeft, Loader2, Save, Building2, MapPin } from 'lucide-react'

// Schema validasi form Facility
const facilityFormSchema = z.object({
  name: z.string().min(2, 'Nama fasilitas minimal 2 karakter'),
  description: z.string().min(5, 'Deskripsi fasilitas minimal 5 karakter'),
  category: z.string().min(1, 'Kategori fasilitas wajib ditentukan'),
  imageUrl: z.string().optional(),
  location: z.string().optional(),
  status: z.string().default('available'),
  order: z.coerce.number().default(0),
})

type FacilityFormValues = z.infer<typeof facilityFormSchema>

export default function FacilitiesForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const form = useForm<FacilityFormValues>({
    resolver: zodResolver(facilityFormSchema) as any,
    defaultValues: {
      name: '',
      description: '',
      category: 'Laboratorium',
      imageUrl: '',
      location: '',
      status: 'available',
      order: 0,
    },
  })

  useEffect(() => {
    if (isEdit) {
      const fetchFacility = async () => {
        try {
          setIsFetching(true)
          const res = await api.get(`/api/facilities/${id}`)
          const item = res.data?.data || res.data
          form.reset({
            name: item.name || '',
            description: item.description || '',
            category: item.category || 'Laboratorium',
            imageUrl: item.imageUrl || '',
            location: item.location || '',
            status: item.status || 'available',
            order: item.order ?? item.sortOrder ?? 0,
          })
        } catch (error) {
          console.error('Gagal mengambil data fasilitas:', error)
          alert('Gagal memuat detail fasilitas kampus.')
          navigate('/facilities')
        } finally {
          setIsFetching(false)
        }
      }
      fetchFacility()
    }
  }, [id, isEdit, form, navigate])

  const onSubmit = async (values: FacilityFormValues) => {
    try {
      setIsSubmitting(true)

      const payload = {
        name: values.name,
        description: values.description,
        category: values.category,
        imageUrl: values.imageUrl || null,
        location: values.location || null,
        status: values.status,
        order: Number(values.order) || 0,
        sortOrder: Number(values.order) || 0,
      }

      if (isEdit) {
        await api.put(`/api/facilities/${id}`, payload)
        alert('Data fasilitas berhasil diperbarui!')
      } else {
        await api.post('/api/facilities', payload)
        alert('Fasilitas baru berhasil didaftarkan!')
      }

      navigate('/facilities')
    } catch (error: any) {
      console.error('Error menyimpan fasilitas:', error)
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data fasilitas.'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-indigo-500" size={44} />
        <p className="font-semibold text-lg text-slate-600">Memuat detail fasilitas...</p>
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
            onClick={() => navigate('/facilities')}
            className="rounded-xl border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isEdit ? 'Edit Fasilitas Kampus' : 'Tambah Fasilitas Baru'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Lengkapi rincian sarana, foto dokumentasi, dan status ketersediaan fasilitas.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kolom Kiri: Detail Fasilitas */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Informasi Sarana / Fasilitas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Nama Fasilitas</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contoh: Laboratorium Komputer & Sistem Informasi" 
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
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Building2 size={15} className="text-indigo-600" />
                            Kategori Fasilitas
                          </FormLabel>
                          <FormControl>
                            <Select className="h-11 rounded-xl" {...field}>
                              <option value="Laboratorium">Laboratorium</option>
                              <option value="Gedung Perkuliahan">Gedung Perkuliahan</option>
                              <option value="Perpustakaan">Perpustakaan</option>
                              <option value="Olahraga">Fasilitas Olahraga</option>
                              <option value="Fasilitas Umum">Fasilitas Umum</option>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <MapPin size={15} className="text-rose-500" />
                            Lokasi / Gedung (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Contoh: Gedung B Lantai 2" 
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Deskripsi Lengkap & Fasilitas Tersedia</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={6} 
                            placeholder="Jelaskan kapasitas ruangan, perlengkapan yang tersedia, peruntukan penggunaan, dan jam operasional..." 
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

            {/* Kolom Kanan: Foto, Status & Urutan */}
            <div className="space-y-6">
              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Foto Fasilitas</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="imageUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-400 mt-2">
                          Foto ruangan atau gedung fasilitas (WEBP, JPG, PNG).
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Status & Urutan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Status Ketersediaan</FormLabel>
                        <FormControl>
                          <Select className="h-11 rounded-xl" {...field}>
                            <option value="available">Tersedia (Available)</option>
                            <option value="maintenance">Dalam Pemeliharaan (Maintenance)</option>
                            <option value="closed">Ditutup Sementara (Closed)</option>
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
                          Angka lebih kecil akan tampil lebih awal di katalog fasilitas.
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
                        Menyimpan Fasilitas...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={18} />
                        {isEdit ? 'Simpan Perubahan' : 'Daftarkan Fasilitas'}
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
