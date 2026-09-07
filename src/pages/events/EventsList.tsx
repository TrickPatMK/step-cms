import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Plus, Edit, Trash2, Loader2 } from 'lucide-react'
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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

interface EventData {
  id: number | string
  title: string
  eventDate?: string
  status?: string
}

export default function EventsList() {
  const { data: events, isLoading, isError } = useQuery({
    queryKey: ['events'],
    queryFn: async () => {
      try {
        const response = await api.get('/events')
        return (response.data.data || response.data) as EventData[]
      } catch (error) {
        console.error("Gagal mengambil data event:", error)
        throw error
      }
    },
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Manajemen Event</h1>
          <p className="text-slate-500 mt-1">Kelola agenda dan acara kampus di sini.</p>
        </div>
        <Link to="/events/create">
          <Button className="flex items-center gap-2">
            <Plus size={16} /> Tambah Event
          </Button>
        </Link>
      </div>
      
      <Card className="shadow-sm">
        <CardHeader>
          <CardTitle>Daftar Event</CardTitle>
          <CardDescription>Semua event yang telah dijadwalkan.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="animate-spin mb-4" size={32} />
              <p>Mengambil data dari API...</p>
            </div>
          ) : isError ? (
            <div className="text-center py-12 bg-red-50 rounded-md border border-red-100 text-red-600">
              <p className="font-semibold">Gagal mengambil data event dari API.</p>
              <p className="text-sm mt-1">Pastikan API server (Fastify) sedang berjalan di localhost:3000.</p>
            </div>
          ) : events && events.length > 0 ? (
            <div className="border rounded-md">
              <Table>
                <TableHeader className="bg-slate-50">
                  <TableRow>
                    <TableHead>Nama Event</TableHead>
                    <TableHead>Tanggal Pelaksanaan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {events.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell className="text-slate-500">
                        {item.eventDate ? new Date(item.eventDate).toLocaleDateString('id-ID') : '-'}
                      </TableCell>
                      <TableCell>
                        <span className="px-2.5 py-1 bg-amber-100 text-amber-700 text-xs font-medium rounded-full">
                          {item.status || 'Upcoming'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link to={`/events/edit/${item.id}`}>
                            <Button variant="outline" size="sm" className="h-8 w-8 p-0">
                              <Edit size={14} />
                            </Button>
                          </Link>
                          <Button variant="destructive" size="sm" className="h-8 w-8 p-0">
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center text-slate-500 py-16 border-2 border-dashed rounded-md bg-slate-50/50">
              <p className="mb-4">Belum ada event yang ditemukan.</p>
              <Link to="/events/create">
                <Button variant="outline">Buat Event Pertama</Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
