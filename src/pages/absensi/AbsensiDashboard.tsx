import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarClock, ShieldCheck, Award, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

const tabs = [
  {
    id: 'jadwal',
    label: 'Jadwal Kegiatan',
    icon: CalendarClock,
    emptyTitle: 'Belum ada jadwal kegiatan',
    emptyText: 'Jadwal kegiatan dibuat dan diterbitkan dari halaman Jadwal Kegiatan.',
  },
  {
    id: 'peran',
    label: 'Pengesahan Peran',
    icon: ShieldCheck,
    emptyTitle: 'Tidak ada pengajuan peran',
    emptyText: 'Klaim peran pelayanan mahasiswa yang menunggu pengesahan akan tampil di sini.',
  },
  {
    id: 'skor',
    label: 'Rekap Skor',
    icon: Award,
    emptyTitle: 'Belum ada rekap skor',
    emptyText: 'Aturan skor dan cap bulanan belum ditetapkan, sehingga belum ada rekap yang ditampilkan.',
  },
] as const

type TabId = (typeof tabs)[number]['id']

export default function AbsensiDashboard() {
  const [activeTab, setActiveTab] = useState<TabId>('jadwal')
  const tab = tabs.find(t => t.id === activeTab)!
  const Icon = tab.icon

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy-950">Absensi Mahasiswa</h1>
          <p className="mt-1.5 text-sm text-slate-600">
            Kelola jadwal kegiatan, pengesahan peran, dan rekap skor partisipasi mahasiswa.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            to="/absensi/mahasiswa"
            className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-sm font-semibold text-navy-950 transition-colors hover:border-gold-500 hover:bg-gold-50/30 hover:text-gold-700"
          >
            <Users size={16} />
            Data Mahasiswa
          </Link>
          <Link
            to="/absensi/kegiatan"
            className="inline-flex h-11 items-center gap-2 rounded-lg bg-gold-500 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-gold-600"
          >
            <CalendarClock size={16} />
            Jadwal Kegiatan
          </Link>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {tabs.map(({ id, label, icon: TabIcon }) => (
          <Button
            key={id}
            type="button"
            size="sm"
            variant={activeTab === id ? 'gold' : 'outline'}
            aria-pressed={activeTab === id}
            onClick={() => setActiveTab(id)}
          >
            <TabIcon size={15} />
            {label}
          </Button>
        ))}
      </div>

      <Card className="rounded-xl border-slate-200">
        <CardContent className="flex flex-col items-center p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
            <Icon size={22} />
          </div>
          <p className="mt-4 font-semibold text-navy-950">{tab.emptyTitle}</p>
          <p className="mt-1 max-w-md text-sm text-slate-600">{tab.emptyText}</p>
        </CardContent>
      </Card>

      <Card className="rounded-xl border-slate-200">
        <CardHeader>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
            <ShieldCheck size={20} />
          </div>
          <CardTitle className="mt-2 text-lg font-bold text-navy-950">Validasi Foto & Retensi</CardTitle>
          <CardDescription>Pengaturan belum tersedia.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-slate-700">
          <p>
            Keputusan yang sudah ada: verifikasi otomatis di server dan review manual administrator tersedia dengan mode yang dapat dipilih, serta retensi awal foto 30 hari yang dapat diubah.
          </p>
          <p>
            Rincian pengaturannya belum ditetapkan oleh layanan data, sehingga halaman ini tidak menyediakan formulir dan tidak menyimpan pengaturan di sisi CMS.
          </p>
          <p className="text-xs leading-relaxed text-slate-600">
            Pengumpulan foto dan pencatatan kehadiran belum aktif.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
