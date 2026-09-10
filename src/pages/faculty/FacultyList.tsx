import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import { 
  Plus, Edit, Trash2, Loader2, Search, Users, Mail, 
  GraduationCap, AlertCircle, Award 
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

export interface FacultyMember {
  id: string
  name: string
  role?: string
  title?: string
  department?: string
  email?: string
  nip?: string
  category?: string
  photoUrl?: string
  bio?: string
  order?: number
  sortOrder?: number
  createdAt?: string
  updatedAt?: string
}

export default function FacultyList() {
  const queryClient = useQueryClient()
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [memberToDelete, setMemberToDelete] = useState<FacultyMember | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const { data: facultyList, isLoading, isError } = useQuery<FacultyMember[]>({
    queryKey: ['faculty'],
    queryFn: async () => {
      const response = await api.get('/api/faculty')
      return (response.data?.data || response.data || []) as FacultyMember[]
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/faculty/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faculty'] })
      setMemberToDelete(null)
    },
    onError: (error: any) => {
      console.error('Gagal menghapus dosen/staf:', error)
      alert(error.response?.data?.message || 'Gagal menghapus data dosen/staf.')
    },
    onSettled: () => {
      setIsDeleting(false)
    }
  })

  const handleDeleteConfirm = () => {
    if (!memberToDelete) return
    setIsDeleting(true)
    deleteMutation.mutate(memberToDelete.id)
  }

  // Filter faculty members by search term and category
  const filteredFaculty = (facultyList || []).filter((item) => {
    const term = searchTerm.toLowerCase()
    const matchesSearch = 
      item.name.toLowerCase().includes(term) ||
      (item.role && item.role.toLowerCase().includes(term)) ||
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.department && item.department.toLowerCase().includes(term)) ||
      (item.nip && item.nip.toLowerCase().includes(term)) ||
      (item.email && item.email.toLowerCase().includes(term))

    const cat = (item.category || '').toUpperCase()
    const matchesCategory = 
      categoryFilter === 'ALL' || 
      cat === categoryFilter.toUpperCase()

    return matchesSearch && matchesCategory
  })

  const getCategoryBadge = (category?: string) => {
    const c = (category || 'DOSEN_TETAP').toUpperCase()
    switch (c) {
      case 'PIMPINAN':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-purple-50 text-purple-700 border border-purple-200 text-xs font-bold rounded-full">
            <Award size={13} className="text-purple-600" />
            Pimpinan
          </span>
        )
      case 'DOSEN_TETAP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
            Dosen Tetap
          </span>
        )
      case 'DOSEN_TIDAK_TETAP':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-50 text-cyan-700 border border-cyan-200 text-xs font-bold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
            Dosen Luar Biasa
          </span>
        )
      case 'STAF':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            Staf & Tenaga Kependidikan
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-700 border border-slate-200 text-xs font-bold rounded-full">
            {category}
          </span>
        )
    }
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Manajemen Dosen & Staf</h1>
          <p className="text-slate-500 mt-2 text-lg">Kelola profil pimpinan akademik, dosen pengajar, dan staf kependidikan.</p>
        </div>
        <Link to="/faculty/create">
          <Button className="h-11 px-6 rounded-full font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105">
            <Plus size={18} /> Tambah Dosen / Staf
          </Button>
        </Link>
      </div>

      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari nama, NIDN, prodi, atau jabatan..." 
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
                <option value="PIMPINAN">Pimpinan Kampus</option>
                <option value="DOSEN_TETAP">Dosen Tetap</option>
                <option value="DOSEN_TIDAK_TETAP">Dosen Luar Biasa</option>
                <option value="STAF">Staf Kependidikan</option>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4 text-indigo-500" size={40} />
              <p className="font-medium text-lg text-slate-500">Memuat data dosen dan staf...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-red-50/50">
              <div className="inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <AlertCircle className="text-red-500" size={28} />
              </div>
              <p className="font-bold text-xl text-red-700">Koneksi API Gagal</p>
              <p className="text-red-500/80 mt-2 max-w-md mx-auto">
                Pastikan backend API sedang berjalan di port 8000 dan endpoint /api/faculty dapat diakses.
              </p>
            </div>
          ) : filteredFaculty.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b-slate-200">
                    <TableHead className="font-bold text-slate-600 py-5 px-6">Dosen / Staf</TableHead>
                    <TableHead className="font-bold text-slate-600">Departemen / Prodi</TableHead>
                    <TableHead className="font-bold text-slate-600">Kontak & NIP</TableHead>
                    <TableHead className="font-bold text-slate-600">Kategori</TableHead>
                    <TableHead className="font-bold text-slate-600 text-center">Urutan</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 px-6">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFaculty.map((item) => {
                    const roleTitle = item.role || item.title || 'Dosen Pengajar'
                    const displayOrder = item.order ?? item.sortOrder ?? 0

                    return (
                      <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors border-b-slate-100 group">
                        <TableCell className="px-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-13 h-13 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0 flex items-center justify-center text-slate-400">
                              {item.photoUrl ? (
                                <img 
                                  src={item.photoUrl.startsWith('http') ? item.photoUrl : `http://localhost:8000${item.photoUrl.startsWith('/') ? '' : '/'}${item.photoUrl}`} 
                                  alt={item.name} 
                                  className="w-full h-full object-cover" 
                                />
                              ) : (
                                <GraduationCap size={22} className="text-indigo-500" />
                              )}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800 text-base leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                                {item.name}
                              </p>
                              <p className="text-xs text-indigo-600 font-semibold">
                                {roleTitle}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-slate-600 font-medium text-sm">
                          {item.department || '-'}
                        </TableCell>
                        <TableCell className="text-slate-600 text-sm">
                          <div className="space-y-0.5">
                            {item.email && (
                              <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                                <Mail size={12} className="text-slate-400 flex-shrink-0" />
                                <span className="truncate max-w-[180px]">{item.email}</span>
                              </div>
                            )}
                            {item.nip && (
                              <p className="text-xs font-medium text-slate-400">
                                NIP/NIDN: {item.nip}
                              </p>
                            )}
                            {!item.email && !item.nip && <span className="text-slate-400">-</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          {getCategoryBadge(item.category)}
                        </TableCell>
                        <TableCell className="text-center font-semibold text-slate-500 text-sm">
                          {displayOrder}
                        </TableCell>
                        <TableCell className="text-right px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Link to={`/faculty/edit/${item.id}`}>
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
                              onClick={() => setMemberToDelete(item)}
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
                <Users size={36} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">
                {searchTerm || categoryFilter !== 'ALL' ? 'Dosen / Staf Tidak Ditemukan' : 'Belum Ada Dosen / Staf'}
              </h3>
              <p className="text-slate-500 max-w-sm mb-6">
                {searchTerm || categoryFilter !== 'ALL' 
                  ? 'Coba sesuaikan kata kunci pencarian atau filter kategori Anda.'
                  : 'Mulai daftarkan dosen pengajar, pimpinan prodi, atau staf kependidikan pertama.'}
              </p>
              <Link to="/faculty/create">
                <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-semibold px-6 flex items-center gap-2">
                  <Plus size={16} /> Tambah Dosen Baru
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!memberToDelete} onOpenChange={(open) => !open && setMemberToDelete(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-900">Konfirmasi Hapus Dosen / Staf</DialogTitle>
            <DialogDescription className="text-slate-500 mt-2">
              Apakah Anda yakin ingin menghapus data profil <strong className="text-slate-800">"{memberToDelete?.name}"</strong>? Data yang dihapus tidak dapat dipulihkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setMemberToDelete(null)}
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
