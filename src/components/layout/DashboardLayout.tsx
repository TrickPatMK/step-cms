import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { 
  LayoutDashboard, Newspaper, Calendar, GraduationCap, Building2, 
  LogOut, Settings, User, Bell, Search 
} from 'lucide-react'
import { authClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export default function DashboardLayout() {
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = async () => {
    await authClient.signOut()
    navigate('/login')
  }

  const menu = [
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Berita', path: '/news', icon: <Newspaper size={20} /> },
    { name: 'Event', path: '/events', icon: <Calendar size={20} /> },
    { name: 'Dosen & Staf', path: '/faculty', icon: <GraduationCap size={20} /> },
    { name: 'Fasilitas Kampus', path: '/facilities', icon: <Building2 size={20} /> },
  ]

  return (
    <div className="flex h-screen bg-slate-50 font-sans">
      {/* Sidebar - Sleek Dark Theme */}
      <aside className="w-72 bg-slate-950 text-slate-300 flex flex-col z-20 transition-all duration-300 border-r border-slate-800">
        <div className="h-20 flex items-center px-8 border-b border-slate-800/60 bg-slate-950/50 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-indigo-600/20">
              S
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight leading-none">STEP CMS</h1>
              <p className="text-xs text-slate-500 font-medium mt-1">Foundation Portal</p>
            </div>
          </div>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4 ml-2">Main Menu</p>
          <nav className="space-y-1.5">
            {menu.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/10' 
                      : 'hover:bg-slate-900 hover:text-white'
                  }`}
                >
                  <div className={`${isActive ? 'text-white' : 'text-slate-400 group-hover:text-indigo-400'}`}>
                    {item.icon}
                  </div>
                  <span className="font-semibold text-sm tracking-wide">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="p-6 border-t border-slate-800/60">
          <div className="bg-slate-900 rounded-xl p-4 border border-slate-800">
            <p className="text-xs font-semibold text-white mb-1">Butuh bantuan?</p>
            <p className="text-xs text-slate-400 mb-3">Baca panduan penggunaan CMS di dokumentasi.</p>
            <Button variant="outline" size="sm" className="w-full text-xs font-semibold bg-transparent border-slate-700 text-slate-300 hover:text-white hover:bg-slate-800">
              Buka Dokumentasi
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-white/80 backdrop-blur-md border-b flex items-center justify-between px-10 z-10 sticky top-0">
          <div className="flex-1 max-w-xl flex items-center gap-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <Input 
                placeholder="Cari sesuatu..." 
                className="pl-10 bg-slate-50 border-slate-200 focus-visible:ring-indigo-500 rounded-full h-11"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-5 pl-6">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 relative">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </Button>
            
            <div className="w-px h-8 bg-slate-200"></div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="rounded-full h-10 pl-2 pr-4 bg-slate-50 border border-slate-200 hover:bg-slate-100 flex items-center gap-3">
                  <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center">
                    <User size={14} className="text-indigo-700" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700">Administrator</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 p-2 rounded-xl">
                <DropdownMenuLabel className="font-bold text-slate-800">Akun Anda</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="rounded-lg cursor-pointer">
                  <Settings className="mr-3 h-4 w-4 text-slate-500" />
                  <span className="font-medium">Pengaturan Akun</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50 mt-1">
                  <LogOut className="mr-3 h-4 w-4" />
                  <span className="font-bold">Keluar Sistem</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-50/50 p-8 lg:p-10">
          <div className="max-w-[1400px] mx-auto animate-in fade-in duration-500 slide-in-from-bottom-4">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
