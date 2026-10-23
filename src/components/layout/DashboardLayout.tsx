import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Newspaper,
  Calendar,
  GraduationCap,
  Building2,
  LogOut,
  Menu,
  Receipt,
  AlertCircle,
  UserCheck,
  Users,
  CalendarClock,
  Search,
  Bell,
  Sparkles,
  X,
  PanelLeftClose,
  PanelLeftOpen,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useAuth, useNotice } from '@/lib/contexts'
import { errorMessage } from '@/lib/errors'
import { pengajuanApi, type PengajuanPeringatanItem } from '@/lib/pengajuan'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

const menu = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Berita', path: '/news', icon: Newspaper },
  { name: 'Event', path: '/events', icon: Calendar },
  { name: 'Dosen & Staf', path: '/faculty', icon: GraduationCap },
  { name: 'Fasilitas Kampus', path: '/facilities', icon: Building2 },
  { name: 'Pengajuan Dana', path: '/pengajuan', icon: Receipt },
  { name: 'Kewajiban LPJ', path: '/pengajuan/peringatan', icon: AlertCircle },
  { name: 'Absensi Mahasiswa', path: '/absensi', icon: UserCheck },
  { name: 'Data Mahasiswa', path: '/absensi/mahasiswa', icon: Users },
  { name: 'Jadwal Kegiatan', path: '/absensi/kegiatan', icon: CalendarClock },
]

export default function DashboardLayout() {
  const auth = useAuth()
  const notice = useNotice()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const [quickSearch, setQuickSearch] = useState('')

  const logout = async () => {
    setLoggingOut(true)
    try {
      await auth.logout()
    } catch (error) {
      notice(`Anda telah keluar dari CMS. Sesi server belum dapat dicabut: ${errorMessage(error)}`, 'error')
    } finally {
      setLoggingOut(false)
    }
  }

  const handleQuickSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = quickSearch.trim().toLowerCase()
    if (!q) return
    if (q.includes('lpj') || q.includes('tenggat') || q.includes('peringatan')) {
      navigate('/pengajuan/peringatan')
    } else if (q.includes('dana') || q.includes('pengajuan') || q.includes('proposal')) {
      navigate('/pengajuan')
    } else if (q.includes('absen') || q.includes('mahasiswa') || q.includes('skor')) {
      navigate('/absensi')
    } else if (q.includes('event') || q.includes('acara') || q.includes('kegiatan')) {
      navigate('/events')
    } else if (q.includes('dosen') || q.includes('staf') || q.includes('pengajar')) {
      navigate('/faculty')
    } else if (q.includes('fasilitas') || q.includes('gedung') || q.includes('ruang')) {
      navigate('/facilities')
    } else {
      navigate('/news')
    }
    setQuickSearch('')
  }

  const initials = (auth.user?.name || 'AD')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase())
    .join('')

  const [readIds, setReadIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('step_read_notifications') || '[]')
    } catch {
      return []
    }
  })
  const [notificationOpen, setNotificationOpen] = useState(false)

  const { data: notifications = [], isPending: notificationsLoading } = useQuery<PengajuanPeringatanItem[]>({
    queryKey: ['dashboard', 'notifications'],
    queryFn: async ({ signal }) => {
      try {
        return (await pengajuanApi.peringatan({ termasukTerlambat: true }, signal)) ?? []
      } catch {
        return []
      }
    },
    enabled: !!auth.user && notificationOpen,
    staleTime: 30_000,
  })

  const unreadCount = notifications.filter(n => !readIds.includes(n.id)).length

  const markAllAsRead = () => {
    const allIds = notifications.map(n => n.id)
    setReadIds(allIds)
    try {
      localStorage.setItem('step_read_notifications', JSON.stringify(allIds))
    } catch {
      // ignore
    }
  }

  return (
    <div className="flex min-h-screen items-start bg-slate-100/80 md:gap-5 md:p-4">
      {/* Floating Rounded Sidebar (Sticky saat di-scroll + dapat di-shrink/collapse) */}
      <aside
        className={`${open ? 'flex' : 'hidden'} no-scrollbar fixed inset-y-3 left-3 z-30 w-64 ${
          collapsed ? 'md:w-20 md:px-3 md:py-4' : 'md:w-64 md:p-4'
        } shrink-0 flex-col justify-between overflow-y-auto rounded-xl border border-navy-800 bg-navy-950 p-4 text-slate-200 shadow-xl transition-all duration-200 md:sticky md:top-4 md:flex md:h-[calc(100vh-2rem)]`}
      >
        <div>
          {/* Brand Header & Collapse Toggle */}
          <div
            className={`mb-5 flex items-center ${
              collapsed ? 'md:flex-col md:justify-center md:gap-2.5' : 'justify-between px-1'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-gold-400 ring-1 ring-navy-700">
                <GraduationCap size={22} />
              </div>
              <div className={collapsed ? 'md:hidden' : 'block'}>
                <p className="font-playfair text-lg font-bold tracking-tight text-white">STEP Dashboard</p>
                <p className="text-[11px] font-medium text-slate-300">Setia · Tangguh · Ekselen</p>
              </div>
            </div>

            {/* Tombol Shrink / Expand di Desktop */}
            <button
              type="button"
              onClick={() => setCollapsed(prev => !prev)}
              aria-label={collapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
              title={collapsed ? 'Perlebar sidebar' : 'Perkecil sidebar'}
              className="hidden h-8 w-8 items-center justify-center rounded-lg border border-navy-800 bg-navy-900 text-slate-300 transition-colors hover:border-gold-500/60 hover:text-gold-400 md:inline-flex"
            >
              {collapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
            </button>

            {/* Tombol Tutup di Mobile */}
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-300 hover:bg-navy-900 hover:text-white md:hidden"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
              <span className="ml-1">Tutup</span>
            </Button>
          </div>

          {/* Navigation Menu */}
          <nav aria-label="Menu utama" className="space-y-1">
            {menu.map(({ name, path, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                end={path === '/' || path === '/pengajuan' || path === '/absensi'}
                onClick={() => setOpen(false)}
                title={name}
                aria-label={name}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg py-2 text-sm font-medium transition-all duration-150 ${
                    collapsed ? 'px-3.5 md:justify-center md:px-0' : 'px-3.5'
                  } ${
                    isActive
                      ? 'bg-gold-500 font-semibold text-white shadow-sm'
                      : 'text-slate-300 hover:bg-navy-900 hover:text-white'
                  }`
                }
              >
                <Icon size={18} className="shrink-0" />
                <span className={`truncate ${collapsed ? 'md:hidden' : 'inline'}`}>{name}</span>
              </NavLink>
            ))}
          </nav>
        </div>

        {/* Bottom Callout Card (Menyesuaikan mode penuh vs shrink) */}
        <div
          className={`mt-4 rounded-xl border border-navy-800 bg-navy-900/90 ${
            collapsed ? 'p-3.5 md:flex md:justify-center md:p-2.5' : 'p-3.5'
          }`}
        >
          <Link
            to="/pengajuan/peringatan"
            onClick={() => setOpen(false)}
            title="Cek Kewajiban LPJ"
            className={`hidden h-9 w-9 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400 transition-colors hover:bg-gold-500 hover:text-white ${
              collapsed ? 'md:inline-flex' : ''
            }`}
          >
            <Sparkles size={16} />
          </Link>

          <div className={collapsed ? 'md:hidden' : 'block'}>
            <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
              <Sparkles size={16} />
            </div>
            <p className="font-playfair text-sm font-bold text-white">Tata Kelola Terpadu</p>
            <p className="mt-1 text-xs leading-relaxed text-slate-300">
              Kelola publikasi akademik, anggaran LPJ, dan kegiatan mahasiswa dalam satu portal.
            </p>
            <Link
              to="/pengajuan/peringatan"
              onClick={() => setOpen(false)}
              className="mt-3 inline-flex items-center text-xs font-semibold text-gold-400 hover:text-gold-300 hover:underline"
            >
              Cek Kewajiban LPJ &rarr;
            </Link>
          </div>
        </div>
      </aside>

      {open && (
        <button
          aria-label="Tutup menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-navy-950/50 backdrop-blur-[1px] md:hidden"
        />
      )}

      {/* Main Content Container */}
      <div className="flex min-w-0 flex-1 flex-col rounded-none bg-transparent md:gap-5">
        {/* Top Header Bar (Sticky di bagian atas saat halaman di-scroll) */}
        <header className="sticky top-0 z-20 flex min-h-[72px] flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/90 md:top-4 md:rounded-xl md:border md:px-6">
          <div className="flex flex-1 items-center gap-3">
            <Button
              variant="outline"
              size="icon"
              aria-label="Buka menu"
              className="md:hidden"
              onClick={() => setOpen(true)}
            >
              <Menu size={20} />
            </Button>

            <form onSubmit={handleQuickSearch} className="relative hidden max-w-md flex-1 sm:block">
              <Search className="pointer-events-none absolute left-3.5 top-3 text-slate-400" size={17} />
              <Input
                type="search"
                aria-label="Pencarian cepat modul"
                placeholder="Cari modul berita, event, pengajuan dana, atau absensi..."
                value={quickSearch}
                onChange={e => setQuickSearch(e.target.value)}
                className="h-10 rounded-lg border-slate-200 bg-navy-50/50 pl-10 text-sm focus-visible:bg-white"
              />
            </form>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            <DropdownMenu open={notificationOpen} onOpenChange={setNotificationOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  title="Peringatan & Notifikasi"
                  aria-label={unreadCount > 0 ? `${unreadCount} notifikasi baru` : 'Notifikasi'}
                  className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-navy-50/40 text-navy-900 transition-colors hover:border-gold-400 hover:bg-gold-50 hover:text-gold-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-500/30"
                >
                  <Bell size={18} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 p-0 sm:w-96 rounded-xl border border-slate-200 bg-white shadow-xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-navy-900 bg-navy-950 px-4 py-3 text-white rounded-t-xl">
                  <div className="flex items-center gap-2">
                    <Bell size={16} className="text-gold-400" />
                    <p className="text-sm font-semibold">Notifikasi</p>
                    {unreadCount > 0 && (
                      <span className="rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white">
                        {unreadCount} baru
                      </span>
                    )}
                  </div>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={markAllAsRead}
                      className="text-xs font-medium text-gold-400 transition-colors hover:text-gold-300"
                    >
                      Tandai dibaca
                    </button>
                  )}
                </div>

                {/* Notification List */}
                <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto">
                  {notificationsLoading ? (
                    <div className="flex items-center justify-center py-8 text-xs text-slate-500">
                      Memuat notifikasi...
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={20} />
                      </div>
                      <p className="mt-2 text-sm font-semibold text-navy-950">Semua Terkendali</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        Tidak ada peringatan kewajiban LPJ yang tertunda saat ini.
                      </p>
                    </div>
                  ) : (
                    notifications.map(item => {
                      const isUnread = !readIds.includes(item.id)
                      return (
                        <DropdownMenuItem
                          key={item.id}
                          onClick={() => navigate(`/pengajuan/${item.id}`)}
                          className={`flex cursor-pointer items-start gap-3 p-3.5 transition-colors hover:bg-slate-50 focus:bg-slate-50 ${
                            isUnread ? 'bg-navy-50/30' : ''
                          }`}
                        >
                          <div
                            className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                              item.terlambat
                                ? 'bg-red-50 text-red-600 ring-1 ring-red-200'
                                : 'bg-amber-50 text-amber-700 ring-1 ring-amber-200'
                            }`}
                          >
                            {item.terlambat ? <AlertTriangle size={14} /> : <Clock size={14} />}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between gap-2">
                              <p className="truncate text-xs font-bold text-navy-950">{item.nomor}</p>
                              <span
                                className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                                  item.terlambat
                                    ? 'bg-red-100 text-red-700'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {item.terlambat ? 'Terlambat' : 'Mendekati Tenggat'}
                              </span>
                            </div>
                            <p className="mt-0.5 line-clamp-1 text-xs font-medium text-slate-700">{item.judul}</p>
                            <p className="mt-1 text-[11px] text-slate-500">
                              {item.unit} · {item.tenggatLpj ? `Batas: ${item.tenggatLpj}` : 'Belum ada tenggat'}
                            </p>
                          </div>
                        </DropdownMenuItem>
                      )
                    })
                  )}
                </div>

                {/* Footer */}
                <div className="border-t border-slate-100 bg-slate-50/70 p-2.5 text-center rounded-b-xl">
                  <Link
                    to="/pengajuan/peringatan"
                    className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-navy-950 transition-colors hover:text-gold-700"
                  >
                    <span>Buka Rekap Kewajiban LPJ</span>
                    <ArrowRight size={13} />
                  </Link>
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <div className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-navy-50/30 px-2.5 py-1.5 sm:px-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-navy-950 text-xs font-bold text-gold-400">
                {initials}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="truncate text-sm font-semibold leading-tight text-navy-950">{auth.user?.name}</p>
                <p className="truncate text-xs text-slate-600">{auth.user?.email}</p>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                void logout()
              }}
              disabled={loggingOut}
            >
              <LogOut size={15} />
              <span>{loggingOut ? 'Keluar...' : 'Keluar Sistem'}</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="mx-auto w-full max-w-[1400px] flex-1 p-4 md:p-0">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
