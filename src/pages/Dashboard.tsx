import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Newspaper, Calendar, Loader2 } from 'lucide-react'

export default function Dashboard() {
  const { data: newsCount, isLoading: loadingNews } = useQuery({
    queryKey: ['news-count'],
    queryFn: async () => {
      const res = await api.get('/api/stepnews')
      const newsArray = res.data.data || res.data
      return Array.isArray(newsArray) ? newsArray.length : 0
    }
  })

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight text-slate-800">Dashboard Utama</h1>
      <p className="text-slate-500">Selamat datang di panel admin STEP CMS.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Berita</CardTitle>
            <Newspaper className="text-blue-500" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800">
              {loadingNews ? <Loader2 className="animate-spin" size={24} /> : (newsCount || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1">Artikel dipublikasikan</p>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-500 uppercase tracking-wider">Total Event</CardTitle>
            <Calendar className="text-amber-500" size={24} />
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-slate-800">0</div>
            <p className="text-xs text-slate-400 mt-1">Acara terjadwal (Segera hadir)</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
