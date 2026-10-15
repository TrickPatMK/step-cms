import { Outlet, NavLink } from 'react-router-dom'
import { LayoutDashboard, Newspaper, Calendar, GraduationCap, Building2, LogOut, Menu } from 'lucide-react'
import { useState } from 'react'
import { useAuth, useNotice } from '@/lib/contexts'
import { errorMessage } from '@/lib/errors'
import { Button } from '@/components/ui/button'

const menu = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Berita', path: '/news', icon: Newspaper },
  { name: 'Event', path: '/events', icon: Calendar },
  { name: 'Dosen & Staf', path: '/faculty', icon: GraduationCap },
  { name: 'Fasilitas Kampus', path: '/facilities', icon: Building2 },
]

export default function DashboardLayout() {
  const auth = useAuth()
  const notice = useNotice()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)
  const logout = async () => {
    setLoggingOut(true)
    try { await auth.logout() }
    catch (error) { notice(`Anda telah keluar dari CMS. Sesi server belum dapat dicabut: ${errorMessage(error)}`, 'error') }
    finally { setLoggingOut(false) }
  }
  return <div className="flex min-h-screen bg-slate-50">
    <aside className={`${open ? 'block' : 'hidden'} fixed inset-y-0 left-0 z-30 w-64 shrink-0 border-r border-slate-800 bg-slate-950 p-6 text-slate-300 md:sticky md:top-0 md:block md:h-screen`}>
      <div className="mb-10 flex items-center justify-between"><div><p className="text-xl font-bold text-white">STEP CMS</p><p className="text-xs text-slate-400">Foundation Portal</p></div><Button className="md:hidden" variant="ghost" onClick={() => setOpen(false)}>Tutup</Button></div>
      <nav aria-label="Menu utama" className="space-y-2">
        {menu.map(({ name, path, icon: Icon }) => <NavLink key={path} to={path} end={path === '/'} onClick={() => setOpen(false)} className={({ isActive }) => `flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-900'}`}><Icon size={20} />{name}</NavLink>)}
      </nav>
    </aside>
    {open && <button aria-label="Tutup menu" onClick={() => setOpen(false)} className="fixed inset-0 z-20 bg-black/40 md:hidden" />}
    <div className="min-w-0 flex-1">
      <header className="flex min-h-20 flex-wrap items-center justify-between gap-3 border-b bg-white px-4 py-4 md:px-8">
        <Button variant="outline" aria-label="Buka menu" className="md:hidden" onClick={() => setOpen(true)}><Menu size={20} /></Button>
        <div className="min-w-0"><p className="font-semibold text-slate-800">{auth.user?.name}</p><p className="truncate text-sm text-slate-500">{auth.user?.email}</p></div>
        <Button variant="outline" onClick={() => { void logout() }} disabled={loggingOut}><LogOut size={16} className="mr-2" />{loggingOut ? 'Keluar...' : 'Keluar Sistem'}</Button>
      </header>
      <main className="mx-auto max-w-[1400px] p-4 md:p-8 lg:p-10"><Outlet /></main>
    </div>
  </div>
}
