import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Edit, Trash2, Loader2, Search, Filter, MoreHorizontal, Newspaper } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent } from '@/components/ui/card'

interface News {
  id: number | string
  title: string
  publishedAt?: string
  status?: string
  imageUrl?: string
  category?: string
}

export default function NewsList() {
  const { data: news, isLoading, isError } = useQuery({
    queryKey: ['news'],
    queryFn: async () => {
      try {
        const response = await api.get('/api/stepnews')
        return (response.data.data || response.data) as News[]
      } catch (error) {
        console.error("Gagal mengambil data:", error)
        throw error
      }
    },
  })

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Manajemen Berita</h1>
          <p className="text-slate-500 mt-2 text-lg">Kelola dan publikasikan artikel, pengumuman, dan berita kampus.</p>
        </div>
        <Link to="/news/create">
          <Button className="h-11 px-6 rounded-full font-bold bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all hover:scale-105">
            <Plus size={18} /> Tulis Berita Baru
          </Button>
        </Link>
      </div>
      
      <Card className="border-none shadow-xl shadow-slate-200/40 rounded-2xl overflow-hidden bg-white">
        {/* Table Toolbar */}
        <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-4 justify-between bg-slate-50/50">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input 
              placeholder="Cari judul berita..." 
              className="pl-10 h-11 bg-white border-slate-200 rounded-xl focus-visible:ring-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <Button variant="outline" className="h-11 rounded-xl border-slate-200 text-slate-600 font-medium flex items-center gap-2">
              <Filter size={16} /> Filter Kategori
            </Button>
          </div>
        </div>

        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-400">
              <Loader2 className="animate-spin mb-4 text-indigo-500" size={40} />
              <p className="font-medium text-lg text-slate-500">Memuat data artikel...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-20 bg-red-50/50">
              <div className="inline-flex w-16 h-16 rounded-full bg-red-100 items-center justify-center mb-4">
                <Trash2 className="text-red-500" size={24} />
              </div>
              <p className="font-bold text-xl text-red-700">Koneksi API Gagal</p>
              <p className="text-red-500/80 mt-2 max-w-md mx-auto">Pastikan API server sedang berjalan dan terhubung dengan benar ke database.</p>
            </div>
          ) : news && news.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50/80 hover:bg-slate-50/80 border-b-slate-200">
                    <TableHead className="font-bold text-slate-600 py-5 px-6">Informasi Artikel</TableHead>
                    <TableHead className="font-bold text-slate-600">Kategori</TableHead>
                    <TableHead className="font-bold text-slate-600">Tanggal Rilis</TableHead>
                    <TableHead className="font-bold text-slate-600">Status</TableHead>
                    <TableHead className="text-right font-bold text-slate-600 px-6">Opsi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {news.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60 transition-colors border-b-slate-100 group">
                      <TableCell className="px-6 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-12 rounded-lg bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                            {item.imageUrl ? (
                              <img src={item.imageUrl.startsWith('http') ? item.imageUrl : `http://localhost:8000${item.imageUrl}`} alt="cover" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-300">
                                <Newspaper size={20} />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="font-bold text-slate-800 text-base leading-tight mb-1 group-hover:text-indigo-600 transition-colors">{item.title}</p>
                            <p className="text-xs text-slate-400 font-medium">ID: {String(item.id).substring(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="px-3 py-1 bg-slate-100 text-slate-600 text-xs font-semibold rounded-md border border-slate-200">
                          {item.category || 'Umum'}
                        </span>
                      </TableCell>
                      <TableCell className="text-slate-500 font-medium">
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                          {item.status || 'Published'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right px-6">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-700 rounded-lg">
                              <MoreHorizontal size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 rounded-xl">
                            <Link to={`/news/edit/${item.id}`}>
                              <DropdownMenuItem className="cursor-pointer font-medium text-slate-600">
                                <Edit className="mr-2 h-4 w-4 text-slate-400" /> Edit Artikel
                              </DropdownMenuItem>
                            </Link>
                            <DropdownMenuItem className="cursor-pointer font-medium text-red-600 focus:text-red-700 focus:bg-red-50 mt-1">
                              <Trash2 className="mr-2 h-4 w-4" /> Hapus
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                <Newspaper className="text-slate-300" size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Belum Ada Berita</h3>
              <p className="text-slate-500 max-w-sm mb-6">Portal berita Anda masih kosong. Mulailah dengan menulis artikel atau pengumuman pertama Anda.</p>
              <Link to="/news/create">
                <Button className="rounded-full bg-indigo-600 hover:bg-indigo-700 font-semibold px-6">Tulis Artikel Baru</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
