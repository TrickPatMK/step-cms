import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  Plus, Edit, Trash2, Loader2, Search, Building2, 
  MapPin, AlertCircle, CheckCircle2, Wrench, Ban 
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

export interface FacilityItem {
  id: string
  name: string
  description?: string
  category?: string
  imageUrl?: string
  location?: string
  status?: string
  order?: number
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export default function FacilitiesList() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [facilityToDelete, setFacilityToDelete] = useState<FacilityItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: facilities, isLoading, isError } = useQuery<FacilityItem[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const response = await api.get('/api/facilities')
      return (response.data?.data || response.data || []) as FacilityItem[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/facilities/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] })
      setFacilityToDelete(null)
    },
    onError: (error: any) => {
      console.error('Gagal menghapus fasilitas:', error)
      alert(error.response?.data?.message || 'Gagal menghapus data fasilitas.')
    },
    onSettled: () => {
      setIsDeleting(false)
    }
  })

  const handleDeleteConfirm = () => {
    if (!facilityToDelete) return
    setIsDeleting(true)
    deleteMutation.mutate(facilityToDelete.id)
  }

  // Filter facilities by search term and category
  const filteredFacilities = (facilities || []).filter((item) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      item.name.toLowerCase().includes(term) ||
      (item.category && item.category.toLowerCase().includes(term)) ||
      (item.location && item.location.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term))

    const matchesCategory = 
      categoryFilter === 'ALL' || 
      (item.category && item.category.toLowerCase() === categoryFilter.toLowerCase())

    return matchesSearch && matchesCategory
  })

  const getStatusBadge = (status?: string) => {
    const s = (status || 'available').toLowerCase()
    switch (s) {
      case 'available':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
            <CheckCircle2 size={13} className="text-emerald-600" />
            Tersedia
          </span>
        )
      case 'maintenance':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold rounded-full">
            <Wrench size={13} className="text-amber-600" />
            Pemeliharaan
          </span>
        )
      case 'closed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold rounded-full">
            <Ban size={13} className="text-rose-600" />
            Ditutup
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">
            {status}
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Manajemen Fasilitas Kampus</h1>
          <p className="text-slate-500 mt-2 text-lg">Kelola sarana, prasarana, laboratorium, perpustakaan, dan gedung kampus.</p>
        </div>
        <Link to="/facilities/create">
          <Button className="h-11 px-6 rounded-full font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105">
            <Plus size={18} /> Tambah Fasilitas Baru
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari nama fasilitas, kategori, lokasi..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="w-56">
              <Select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="h-11 rounded-xl border-slate-200 text-slate-700 font-medium"
              >
                <option value="ALL">Semua Kategori</option>
                <option value="Laboratorium">Laboratorium</option>
                <option value="Gedung Perkuliahan">Gedung Perkuliahan</option>
                <option value="Perpustakaan">Perpustakaan</option>
                <option value="Olahraga">Fasilitas Olahraga</option>
                <option value="Fasilitas Umum">Fasilitas Umum</option>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4 text-indigo-500" size={40} />
              <p className="font-medium text-lg text-slate-500">Memuat data fasilitas kampus...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-red-50/50">
              <div className="inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <AlertCircle className="text-red-500" size={28} />
              </div>
              <p className="font-bold text-xl text-red-700">Koneksi API Gagal</p>
              <p className="text-red-500/80 mt-2 max-w-md mx-auto">
                Pastikan backend API sedang berjalan di port 8000 dan endpoint /api/facilities dapat diakses.
              </p>
            </div>
          ) : filteredFacilities.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b-slate-200">
                    <TableHead className="font-bold text-slate-600 py-5 px-6">Nama Fasilitas</TableHead>
                    <TableHead className="font-bold text-slate-600">Kategori</TableHead>
                    <TableHead className="font-bold text-slate-600">Lokasi</TableHead>
                    <TableHead className="font-bold text-slate-600">Status Operasional</TableHead>
                    <TableHead className="font-bold text-slate-600 text-center">Urutan</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFacilities.map((item) => {
                    const displayOrder = item.order ?? item.sortOrder ?? 0

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors border-b-slate-100 group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                              {item.imageUrl ? (
                                <img 
                                  src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8000${item.imageUrl.startsWith('/') ? '' : '/'}${item.imageUrl}`} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <Building2 size={22} className="text-indigo-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-xs text-slate-400 font-medium line-clamp-1 max-w-sm">
                                {item.description || 'Tidak ada keterangan tambahan.'}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="px-3 py-1 bg-slate-100 text-slate-700 text-xs font-semibold rounded-md border border-slate-200">
                            {item.category || 'Fasilitas Kampus'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5 text-slate-600 text-sm">
                            <MapPin size={15} className="text-slate-400 flex-shrink-0" />
                            <span className="font-medium truncate max-w-[180px]">{item.location || 'Area Kampus'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(item.status)}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-500 text-sm">
                          {displayOrder}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/facilities/edit/${item.id}`}>
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
                              onClick={() => setFacilityToDelete(item)}
                              className="h-9 px-3 rounded-lg border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 font-medium flex items-center gap-1.5"
                            >
                              <Trash2 size={14} /> Hapus
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 text-indigo-500">
                <Building2 size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {searchTerm || categoryFilter !== 'ALL' ? 'Fasilitas Tidak Ditemukan' : 'Belum Ada Fasilitas Terdaftar'}
              </h3>
              <p className="text-slate-500 max-w-sm mb-6">
                {searchTerm || categoryFilter !== 'ALL' 
                  ? 'Coba sesuaikan kata kunci pencarian atau filter kategori Anda.'
                  : 'Mulai daftarkan gedung kuliah, perpustakaan, laboratorium, atau sarana kampus lainnya.'}
              </p>
              <Link to="/facilities/create">
                <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-semibold px-6 flex items-center gap-2">
                  <Plus size={16} /> Tambah Fasilitas Baru
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!facilityToDelete} onOpenChange={(open) => !open && setFacilityToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Hapus Fasilitas</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              Apakah Anda yakin ingin menghapus sarana/fasilitas <strong className="text-slate-800">"{facilityToDelete?.name}"</strong>? Data yang dihapus tidak dapat dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setFacilityToDelete(null)}
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
