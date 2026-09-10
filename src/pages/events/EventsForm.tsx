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
import { ArrowLeft, Loader2, Save, Calendar, MapPin } from 'lucide-react'

// Schema validasi form Event
const eventFormSchema = z.object({
  title: z.string().min(3, 'Judul event minimal 3 karakter'),
  description: z.string().min(5, 'Deskripsi event minimal 5 karakter'),
  dateStart: z.string().min(1, 'Tanggal dan jam mulai wajib ditentukan'),
  dateEnd: z.string().optional(),
  location: z.string().min(2, 'Lokasi pelaksanaan wajib diisi'),
  status: z.string().min(1, 'Status wajib dipilih'),
  flyerUrl: z.string().optional(),
})

type EventFormValues = z.infer<typeof eventFormSchema>

function formatToInputDateTime(dateStr?: string): string {
  if (!dateStr) return ''
  try {
    const d = new Date(dateStr)
    if (isNaN(d.getTime())) return ''
    const pad = (n: number) => n.toString().padStart(2, '0')
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
  } catch {
    return ''
  }
}

export default function EventsForm() {
  const { id } = useParams()
  const navigate = useNavigate()
  const isEdit = !!id
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isFetching, setIsFetching] = useState(false)

  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema) as any,
    defaultValues: {
      title: '',
      description: '',
      dateStart: '',
      dateEnd: '',
      location: '',
      status: 'published',
      flyerUrl: '',
    },
  })

  useEffect(() => {
    if (isEdit) {
      const fetchEvent = async () => {
        try {
          setIsFetching(true)
          const res = await api.get(`/api/events/${id}`)
          const item = res.data?.data || res.data
          form.reset({
            title: item.title || '',
            description: item.description || '',
            dateStart: formatToInputDateTime(item.dateStart),
            dateEnd: formatToInputDateTime(item.dateEnd),
            location: item.location || '',
            status: item.status || 'published',
            flyerUrl: item.flyerUrl || item.imageUrl || '',
          })
        } catch (error) {
          console.error('Gagal mengambil data event:', error)
          alert('Gagal memuat detail event.')
          navigate('/events')
        } finally {
          setIsFetching(false)
        }
      }
      fetchEvent()
    }
  }, [id, isEdit, form, navigate])

  const onSubmit = async (values: EventFormValues) => {
    try {
      setIsSubmitting(true)

      const payload = {
        title: values.title,
        description: values.description,
        dateStart: new Date(values.dateStart).toISOString(),
        dateEnd: values.dateEnd ? new Date(values.dateEnd).toISOString() : null,
        location: values.location,
        status: values.status,
        flyerUrl: values.flyerUrl || null,
      }

      if (isEdit) {
        await api.put(`/api/events/${id}`, payload)
        alert('Event berhasil diperbarui!')
      } else {
        await api.post('/api/events', payload)
        alert('Event baru berhasil ditambahkan!')
      }

      navigate('/events')
    } catch (error: any) {
      console.error('Error menyimpan event:', error)
      const message = error.response?.data?.message || 'Terjadi kesalahan saat menyimpan data event.'
      alert(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isFetching) {
    return (
      <div className="flex flex-col items-center justify-center py-28 text-slate-400">
        <Loader2 className="animate-spin mb-4 text-indigo-500" size={44} />
        <p className="font-semibold text-lg text-slate-600">Memuat formulir data event...</p>
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
            onClick={() => navigate('/events')}
            className="rounded-xl border-slate-200 hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
          </Button>
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">
              {isEdit ? 'Edit Event / Agenda' : 'Tambah Event Baru'}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              Lengkapi informasi kegiatan dan waktu pelaksanaan.
            </p>
          </div>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Kolom Kiri: Detail Event */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Informasi Kegiatan</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Nama / Judul Event</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contoh: Seminar Nasional Kecerdasan Buatan 2026" 
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
                      name="dateStart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar size={15} className="text-indigo-600" />
                            Waktu Mulai
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
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
                      name="dateEnd"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                            <Calendar size={15} className="text-slate-400" />
                            Waktu Selesai (Opsional)
                          </FormLabel>
                          <FormControl>
                            <Input 
                              type="datetime-local" 
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
                    name="location"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700 flex items-center gap-1.5">
                          <MapPin size={15} className="text-rose-500" />
                          Lokasi / Tempat Pelaksanaan
                        </FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Contoh: Auditorium Utama Kampus 1 / Zoom Meeting" 
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
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Deskripsi Lengkap Event</FormLabel>
                        <FormControl>
                          <Textarea 
                            rows={6} 
                            placeholder="Jelaskan agenda acara, pembicara, syarat pendaftaran, dan informasi penting lainnya..." 
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

            {/* Kolom Kanan: Flyer & Status */}
            <div className="space-y-6">
              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Poster / Banner Flyer</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="flyerUrl"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <ImageUpload value={field.value} onChange={field.onChange} />
                        </FormControl>
                        <FormDescription className="text-xs text-slate-400 mt-2">
                          Upload flyer resmi agenda dalam format WEBP, PNG, atau JPG.
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card className="border-slate-200/80 shadow-sm rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold text-slate-900">Pengaturan Publikasi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-semibold text-slate-700">Status Agenda</FormLabel>
                        <FormControl>
                          <Select className="h-11 rounded-xl" {...field}>
                            <option value="published">Published / Upcoming</option>
                            <option value="ongoing">Ongoing</option>
                            <option value="draft">Draft</option>
                            <option value="completed">Completed</option>
                            <option value="archived">Archived</option>
                            <option value="cancelled">Cancelled</option>
                          </Select>
                        </FormControl>
                        <FormDescription className="text-xs text-slate-400">
                          Status menentukan bagaimana acara ditampilkan di website publik.
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
                        Menyimpan Event...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={18} />
                        {isEdit ? 'Simpan Perubahan' : 'Publikasikan Event'}
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
