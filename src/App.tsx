import { Routes, Route } from 'react-router-dom'
import DashboardLayout from '@/components/layout/DashboardLayout'
import Dashboard from '@/pages/Dashboard'
import NewsList from '@/pages/news/NewsList'
import NewsForm from '@/pages/news/NewsForm'
import EventsList from '@/pages/events/EventsList'
import EventsForm from '@/pages/events/EventsForm'
import FacultyList from '@/pages/faculty/FacultyList'
import FacultyForm from '@/pages/faculty/FacultyForm'
import FacilitiesList from '@/pages/facilities/FacilitiesList'
import FacilitiesForm from '@/pages/facilities/FacilitiesForm'
import PengajuanList from '@/pages/pengajuan/PengajuanList'
import PengajuanDetail from '@/pages/pengajuan/PengajuanDetail'
import PengajuanForm from '@/pages/pengajuan/PengajuanForm'
import PengajuanPeringatan from '@/pages/pengajuan/PengajuanPeringatan'
import AbsensiDashboard from '@/pages/absensi/AbsensiDashboard'
import MahasiswaList from '@/pages/absensi/MahasiswaList'
import MahasiswaDetail from '@/pages/absensi/MahasiswaDetail'
import MahasiswaForm from '@/pages/absensi/MahasiswaForm'
import KegiatanList from '@/pages/absensi/KegiatanList'
import KegiatanDetail from '@/pages/absensi/KegiatanDetail'
import KegiatanForm from '@/pages/absensi/KegiatanForm'
import Login from '@/pages/Login'
import { RequireAdmin } from '@/components/auth-provider'

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAdmin />}>
      <Route path="/" element={<DashboardLayout />}>
        <Route index element={<Dashboard />} />
        <Route path="news" element={<NewsList />} />
        <Route path="news/create" element={<NewsForm />} />
        <Route path="news/edit/:id" element={<NewsForm />} />
        <Route path="events" element={<EventsList />} />
        <Route path="events/create" element={<EventsForm />} />
        <Route path="events/edit/:id" element={<EventsForm />} />
        <Route path="faculty" element={<FacultyList />} />
        <Route path="faculty/create" element={<FacultyForm />} />
        <Route path="faculty/edit/:id" element={<FacultyForm />} />
        <Route path="facilities" element={<FacilitiesList />} />
        <Route path="facilities/create" element={<FacilitiesForm />} />
        <Route path="facilities/edit/:id" element={<FacilitiesForm />} />
        <Route path="pengajuan" element={<PengajuanList />} />
        <Route path="pengajuan/create" element={<PengajuanForm />} />
        <Route path="pengajuan/edit/:id" element={<PengajuanForm />} />
        <Route path="pengajuan/peringatan" element={<PengajuanPeringatan />} />
        <Route path="pengajuan/:id" element={<PengajuanDetail />} />
        <Route path="absensi" element={<AbsensiDashboard />} />
        <Route path="absensi/mahasiswa" element={<MahasiswaList />} />
        <Route path="absensi/mahasiswa/create" element={<MahasiswaForm />} />
        <Route path="absensi/mahasiswa/:id" element={<MahasiswaDetail />} />
        <Route path="absensi/mahasiswa/:id/edit" element={<MahasiswaForm />} />
        <Route path="absensi/kegiatan" element={<KegiatanList />} />
        <Route path="absensi/kegiatan/create" element={<KegiatanForm />} />
        <Route path="absensi/kegiatan/:id" element={<KegiatanDetail />} />
        <Route path="absensi/kegiatan/:id/edit" element={<KegiatanForm />} />
      </Route>
      </Route>
      <Route path="*" element={<div className="p-8"><h1 className="text-2xl font-bold text-navy-950">Halaman tidak ditemukan</h1><a href="/" className="mt-2 inline-block text-sm font-semibold text-gold-700 hover:underline">Kembali ke dashboard</a></div>} />
    </Routes>
  )
}

export default App
