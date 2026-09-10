import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Newspaper, Calendar, Loader2, ArrowUpRight, Users, Activity } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Dashboard() {
  const { data: newsCount, isLoading: loadingNews } = useQuery({
    queryKey: ['news-count'],
    queryFn: async () => {
      const res = await api.get('/api/stepnews')
      const newsArray = res.data.data || res.data
      return Array.isArray(newsArray) ? newsArray.length : 0
    }
  })

  const { data: eventsCount, isLoading: loadingEvents } = useQuery({
    queryKey: ['events-count'],
    queryFn: async () => {
      try {
        const res = await api.get('/api/events')
        const eventsArray = res.data?.data || res.data
        return Array.isArray(eventsArray) ? eventsArray.length : 0
      } catch {
        return 0
      }
    }
  })

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900">Dashboard Utama</h1>
          <p className="text-slate-500 mt-2 text-lg">Ikhtisar data dan aktivitas portal STEP Foundation.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="h-11 px-6 rounded-full font-semibold border-slate-300">Download Laporan</Button>
          <Button className="h-11 px-6 rounded-full font-semibold bg-indigo-600 hover:bg-indigo-700">Analytics Detail</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-2">
        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Berita</CardTitle>
            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center">
              <Newspaper className="text-indigo-600" size={20} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black text-slate-800 tracking-tight">
              {loadingNews ? <Loader2 className="animate-spin text-slate-300" size={32} /> : (newsCount || 0)}
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm font-medium text-emerald-600">
              <ArrowUpRight size={16} />
              <span>+12% dari bulan lalu</span>
            </div>
          </CardContent>
        </Card>
        
        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Total Event</CardTitle>
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
              <Calendar className="text-amber-600" size={20} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black text-slate-800 tracking-tight">
              {loadingEvents ? <Loader2 className="animate-spin text-slate-300" size={32} /> : (eventsCount || 0)}
            </div>
            <div className="flex items-center gap-1 mt-3 text-sm font-medium text-amber-600">
              <Calendar size={16} />
              <span>Agenda terdaftar</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Pengunjung</CardTitle>
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
              <Users className="text-emerald-600" size={20} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black text-slate-800 tracking-tight">24.5k</div>
            <div className="flex items-center gap-1 mt-3 text-sm font-medium text-emerald-600">
              <ArrowUpRight size={16} />
              <span>+8.2% minggu ini</span>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 overflow-hidden relative group hover:shadow-md transition-all">
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-50 rounded-bl-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
          <CardHeader className="flex flex-row items-center justify-between pb-2 relative z-10">
            <CardTitle className="text-sm font-bold text-slate-500 uppercase tracking-wider">Aktivitas</CardTitle>
            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center">
              <Activity className="text-rose-600" size={20} />
            </div>
          </CardHeader>
          <CardContent className="relative z-10">
            <div className="text-5xl font-black text-slate-800 tracking-tight">98%</div>
            <div className="flex items-center gap-1 mt-3 text-sm font-medium text-slate-400">
              <span>System Uptime Optimal</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-4">
        <Card className="col-span-2 shadow-sm border-slate-200/60">
          <CardHeader>
            <CardTitle className="text-xl font-bold">Aktivitas Terbaru</CardTitle>
            <CardDescription>Log perubahan dan pembaruan sistem hari ini.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-slate-400 border-2 border-dashed border-slate-100 rounded-xl">
              <Activity size={48} className="mb-4 opacity-20" />
              <p className="font-medium">Belum ada aktivitas baru tercatat.</p>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200/60 bg-gradient-to-br from-indigo-900 to-slate-900 text-white border-none">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white">Sistem Info</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-slate-300">Versi CMS</span>
              <span className="font-bold">v1.0.0-beta</span>
            </div>
            <div className="flex justify-between items-center border-b border-white/10 pb-3">
              <span className="text-slate-300">Status Server</span>
              <span className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400"></span> Online</span>
            </div>
            <div className="flex justify-between items-center pb-3">
              <span className="text-slate-300">Database</span>
              <span className="font-bold">Terhubung</span>
            </div>
            <Button className="w-full mt-4 bg-white text-indigo-900 hover:bg-slate-100 font-bold rounded-full">
              Pengecekan Sistem
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
