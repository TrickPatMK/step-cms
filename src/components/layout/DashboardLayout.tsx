import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom'
import { LayoutDashboard, Newspaper, Calendar, LogOut, Settings, User } from 'lucide-react'
import { authClient } from '@/lib/auth'
import { Button } from '@/components/ui/button'
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
    { name: 'Dashboard', path: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Berita', path: '/news', icon: <Newspaper size={18} /> },
    { name: 'Event', path: '/events', icon: <Calendar size={18} /> },
  ]

  return (
    <div className="flex h-screen bg-slate-50/50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm z-10">
        <div className="h-16 flex items-center px-6 border-b">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-blue-900 rounded-md flex items-center justify-center text-white font-bold font-serif">
              S
            </div>
            <span className="text-lg font-bold text-slate-800 tracking-tight">STEP CMS</span>
          </div>
        </div>
        
        <div className="p-4">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 ml-2">Menu Utama</p>
          <nav className="space-y-1">
            {menu.map((item) => {
              const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-all duration-200 ${
                    isActive 
                      ? 'bg-slate-900 text-white shadow-md' 
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium text-sm">{item.name}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="h-16 bg-white border-b flex items-center justify-between px-8 z-10">
          <div className="text-sm text-slate-500 font-medium">
            {/* Optional Breadcrumbs could go here */}
          </div>
          
          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 bg-slate-100 ring-1 ring-slate-200">
                  <User size={18} className="text-slate-600" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Akun Admin</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Pengaturan Akun</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Keluar</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-8">
          <div className="max-w-6xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
