import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import { api } from '@/lib/api'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { RichTextEditor } from '@/components/ui/rich-text-editor'
import { ImageUpload } from '@/components/ui/image-upload'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Loader2, Save } from 'lucide-react'

// Skema validasi menggunakan Zod
const formSchema = z.object({
  title: z.string().min(5, 'Judul minimal 5 karakter'),
  category: z.string().optional(),
  tags: z.string().optional(),
  imageUrl: z.string().optional(),
  content: z.string().min(10, 'Konten berita tidak boleh kosong'),
})

export default function NewsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [isLoading, setIsLoading] = useState(false)

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      category: '',
      tags: '',
      imageUrl: '',
      content: '',
    },
  })

  // Ambil data jika dalam mode Edit
  useEffect(() => {
    if (isEdit) {
      const fetchNews = async () => {
        try {
          const res = await api.get(`/api/stepnews/${id}`)
          const data = res.data.article || res.data
          form.reset({
            title: data.title,
            category: data.category || '',
            tags: data.tags ? (Array.isArray(data.tags) ? data.tags.join(', ') : data.tags) : '',
            imageUrl: data.imageUrl || '',
            content: data.content,
          })
        } catch (error) {
          console.error('Gagal mengambil data berita:', error)
          alert('Gagal memuat data berita untuk di-edit.')
          navigate('/news')
        }
      }
      fetchNews()
    }
  }, [id, isEdit, form, navigate])

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true)
      
      // Jika tags adalah string dipisahkan koma, kita bisa membiarkannya sebagai string 
      // atau mengubahnya menjadi array tergantung ekspektasi API.
      // Berdasarkan skema API sebelumnya, string sudah cukup (atau array of string).
      const payload = {
        ...values,
      }

      if (isEdit) {
        // Asumsi ada endpoint PUT untuk update
        await api.put(`/api/stepnews/${id}`, payload)
        alert('Berita berhasil diperbarui!')
      } else {
        await api.post('/api/stepnews', payload)
        alert('Berita berhasil dipublikasikan!')
      }
      
      navigate('/news')
    } catch (error: any) {
      console.error('Error menyimpan berita:', error)
      alert(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan berita.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="icon" onClick={() => navigate('/news')}>
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">
              {isEdit ? 'Edit Berita' : 'Tulis Berita Baru'}
            </h1>
          </div>
        </div>
      </div>
      
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kolom Kiri: Editor Konten Utama */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Detail Konten</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-base">Judul Berita</FormLabel>
                        <FormControl>
                          <Input placeholder="Masukkan judul berita yang menarik..." className="text-lg py-6" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Isi Berita</FormLabel>
                        <FormControl>
                          <RichTextEditor value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Kolom Kanan: Meta, Kategori, Gambar */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Gambar Utama (Cover)</CardTitle>
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
                        <FormDescription>
                          Gambar ini akan menjadi thumbnail berita. Kompresi otomatis aktif.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Kategorisasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Kategori</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: Akademik, Kegiatan..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="tags"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tags (Label)</FormLabel>
                        <FormControl>
                          <Input placeholder="Contoh: seminar, beasiswa, 2026..." {...field} />
                        </FormControl>
                        <FormDescription>Pisahkan tag dengan tanda koma.</FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <Card className="bg-slate-50 border-none shadow-none">
                <CardContent className="p-0">
                  <Button type="submit" className="w-full py-6 text-lg shadow-md" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={20} />
                        Menyimpan...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={20} />
                        {isEdit ? 'Simpan Perubahan' : 'Publikasikan Berita'}
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
