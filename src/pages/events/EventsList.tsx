import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  Plus, Edit, Trash2, Loader2, Search, Calendar, MapPin, 
  AlertCircle 
} from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'

export interface EventItem {
  id: string
  title: string
  description?: string
  dateStart: string
  dateEnd?: string
  location?: string
  status?: string
  flyerUrl?: string
  createdAt?: string
  updatedAt?: string
}

export default function EventsList() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [eventToDelete, setEventToDelete] = useState<EventItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: events, isLoading, isError } = useQuery<EventItem[]>({
    queryKey: ['events'],
    queryFn: async () => {
      const response = await api.get('/api/events')
      return (response.data?.data || response.data || []) as EventItem[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/events/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] })
      setEventToDelete(null)
    },
    onError: (error: any) => {
      console.error('Gagal menghapus event:', error)
      alert(error.response?.data?.message || 'Gagal menghapus event.')
    },
    onSettled: () => {
      setIsDeleting(false)
    }
  })

  const handleDeleteConfirm = () => {
    if (!eventToDelete) return
    setIsDeleting(true)
    deleteMutation.mutate(eventToDelete.id)
  }

  // Filter events by search term and status
  const filteredEvents = (events || []).filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.description && item.description.toLowerCase().includes(searchTerm.toLowerCase()))

    const matchesStatus = 
      statusFilter === 'ALL' || 
      (item.status && item.status.toLowerCase() === statusFilter.toLowerCase())

    return matchesSearch && matchesStatus
  })

  const formatEventDate = (dateStr?: string) => {
    if (!dateStr) return '-'
    try {
      const date = new Date(dateStr)
      return new Intl.DateTimeFormat('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date)
    } catch {
      return dateStr
    }
  }

  const getStatusBadge = (status?: string) => {
    const s = (status || 'published').toLowerCase()
    if (s === 'published' || s === 'upcoming') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
          {status?.toUpperCase() || 'PUBLISHED'}
        </span>
      )
    }
    if (s === 'ongoing') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          ONGOING
        </span>
      )
    }
    if (s === 'draft') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
          DRAFT
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
        {status?.toUpperCase() || 'ARCHIVED'}
      </span>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Manajemen Event & Agenda</h1>
          <p className="text-slate-500 mt-2 text-lg">Kelola agenda, seminar, workshop, dan kegiatan akademik kampus.</p>
        </div>
        <Link to="/events/create">
          <Button className="h-11 px-6 rounded-full font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105">
            <Plus size={18} /> Tambah Event Baru
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari judul atau lokasi event..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-48">
              <Select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="h-11 rounded-xl border-slate-200 text-slate-700 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="published">Published / Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="draft">Draft</option>
                <option value="completed">Completed</option>
                <option value="archived">Archived</option>
                <option value="cancelled">Cancelled</option>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4 text-indigo-500" size={40} />
              <p className="font-medium text-lg text-slate-500">Memuat data agenda & event...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-red-50/50">
              <div className="inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <AlertCircle className="text-red-500" size={28} />
              </div>
              <p className="font-bold text-xl text-red-700">Koneksi API Gagal</p>
              <p className="text-red-500/80 mt-2 max-w-md mx-auto">
                Pastikan backend API sedang berjalan di port 8000 dan endpoint /api/events dapat diakses.
              </p>
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b-slate-200">
                    <TableHead className="font-bold text-slate-600 py-5 px-6">Informasi Event</TableHead>
                    <TableHead className="font-bold text-slate-600">Waktu Pelaksanaan</TableHead>
                    <TableHead className="font-bold text-slate-600">Lokasi</TableHead>
                    <TableHead className="font-bold text-slate-600">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors border-b-slate-100 group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-xl bg-indigo-50 border border-indigo-100 overflow-hidden flex-shrink-0 flex items-center justify-center text-indigo-600">
                            {item.flyerUrl ? (
                              <img 
                                src={item.flyerUrl.startsWith('http') ? item.flyerUrl : `http://localhost:8000${item.flyerUrl.startsWith('/') ? '' : '/'}${item.flyerUrl}`} 
                                alt={item.title} 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <Calendar size={24} />
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-base leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                              {item.title}
                            </p>
                            <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-md">
                              {item.description || 'Tidak ada deskripsi singkat.'}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-slate-600 font-medium text-sm whitespace-nowrap">
                        <div>
                          <p className="font-semibold text-slate-800">{formatEventDate(item.dateStart)}</p>
                          {item.dateEnd && (
                            <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                              <span>s/d</span> {formatEventDate(item.dateEnd)}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                          <MapPin size={15} className="text-slate-400 flex-shrink-0" />
                          <span className="font-medium truncate max-w-[200px]">{item.location || 'Kampus Utama'}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <div className="flex items-center justify-end gap-2">
                          <Link to={`/events/edit/${item.id}`}>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-9 px-3 rounded-lg border-slate-200 text-slate-600 hover:text-indigo-600 hover:border-indigo-200 font-medium flex items-center gap-1.5"
                            >
                              <Edit size={14} /> Edit
                            </Button>
                          </Link>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => setEventToDelete(item)}
                            className="h-9 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium flex items-center gap-1.5"
                          >
                            <Trash2 size={14} /> Hapus
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-500">
                <Calendar size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {searchTerm || statusFilter !== 'ALL' ? 'Event Tidak Ditemukan' : 'Belum Ada Event Terjadwal'}
              </h3>
              <p className="text-slate-500 max-w-sm mb-6">
                {searchTerm || statusFilter !== 'ALL' 
                  ? 'Coba sesuaikan kata kunci pencarian atau filter status Anda.'
                  : 'Mulai publikasikan acara, seminar akademik, atau agenda kampus pertama Anda.'}
              </p>
              <Link to="/events/create">
                <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-semibold px-6 flex items-center gap-2">
                  <Plus size={16} /> Buat Agenda Pertama
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!eventToDelete} onOpenChange={(open) => !open && setEventToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Hapus Event</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              Apakah Anda yakin ingin menghapus agenda <strong className="text-slate-800">"{eventToDelete?.title}"</strong>? Data yang dihapus tidak dapat dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setEventToDelete(null)}
              disabled={isDeleting}
              className="rounded-xl border-slate-200"
            >
              Batal
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="rounded-xl bg-red-600 hover:bg-red-700 font-bold"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="animate-spin mr-2" size={16} /> Menghapus...
                </>
              ) : (
                'Hapus Sekarang'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
