import { useContext, useState } from 'react'
import { useQueries } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  Newspaper,
  Calendar as CalendarIcon,
  GraduationCap,
  Building2,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Plus,
  Receipt,
  AlertCircle,
  UserCheck,
  Target,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react'
import { contentApi, contentKey, contentMeta, entities, type Entity, type ContentRecord } from '@/lib/content'
import { AuthContext } from '@/lib/contexts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ErrorState } from '@/components/feedback'
import { errorMessage } from '@/lib/errors'

const ENTITY_ICONS: Record<Entity, typeof Newspaper> = {
  news: Newspaper,
  events: CalendarIcon,
  faculty: GraduationCap,
  facilities: Building2,
}

const ENTITY_DESCRIPTIONS: Record<Entity, string> = {
  news: 'Artikel & Warta Kampus',
  events: 'Agenda & Seminar Akademik',
  faculty: 'Direktori Pengajar & Staf',
  facilities: 'Sarana & Prasarana',
}

const ENTITY_HEADER_BG: Record<Entity, string> = {
  news: 'bg-navy-950 text-gold-400',
  events: 'bg-navy-900 text-gold-300',
  faculty: 'bg-navy-800 text-gold-400',
  facilities: 'bg-gold-500 text-white',
}

const DAYS_HEADER = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
const MONTH_NAMES = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
]

function getGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 11) return 'Selamat Pagi'
  if (hour < 15) return 'Selamat Siang'
  if (hour < 18) return 'Selamat Sore'
  return 'Selamat Malam'
}

export default function Dashboard() {
  const auth = useContext(AuthContext)
  const results = useQueries({
    queries: entities.map(entity => ({
      queryKey: contentKey(entity),
      queryFn: ({ signal }: { signal: AbortSignal }) => contentApi.list(entity, signal),
    })),
  })

  // Calendar widget state
  const today = new Date()
  const [calMonth, setCalMonth] = useState(today.getMonth())
  const [calYear, setCalYear] = useState(today.getFullYear())

  const firstDayOfMonth = new Date(calYear, calMonth, 1).getDay()
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate()
  const calendarCells: (number | null)[] = [
    ...Array.from({ length: firstDayOfMonth }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const prevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11)
      setCalYear(y => y - 1)
    } else {
      setCalMonth(m => m - 1)
    }
  }

  const nextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0)
      setCalYear(y => y + 1)
    } else {
      setCalMonth(m => m + 1)
    }
  }

  // Gather loaded records for summary widgets (without adding extra network requests)
  const newsItems = results[0]?.data || []
  const eventItems = results[1]?.data || []
  const facultyItems = results[2]?.data || []
  const facilityItems = results[3]?.data || []

  const totalLoadedRecords =
    newsItems.length + eventItems.length + facultyItems.length + facilityItems.length

  const publishedEventsCount = eventItems.filter(e => e.status === 'published').length
  const availableFacilitiesCount = facilityItems.filter(f => f.status === 'available').length
  const activeReadyCount =
    newsItems.length + publishedEventsCount + facultyItems.length + availableFacilitiesCount
  const readinessPct =
    totalLoadedRecords > 0 ? Math.round((activeReadyCount / totalLoadedRecords) * 100) : 100

  // Combine latest items across entities for "Aktivitas & Konten Terbaru"
  const recentFeed: { id: string; title: string; subtitle: string; badge: string; to: string }[] = [
    ...newsItems.slice(0, 2).map((item: ContentRecord) => ({
      id: `news-${item.id}`,
      title: item.title || 'Artikel Berita',
      subtitle: `Berita · ${item.category || 'Umum'}`,
      badge: 'Terbit',
      to: `/news/edit/${item.id}`,
    })),
    ...eventItems.slice(0, 2).map((item: ContentRecord) => ({
      id: `events-${item.id}`,
      title: item.title || 'Agenda Kampus',
      subtitle: `Event · ${item.location || 'Kampus STEP'}`,
      badge: item.status || 'draft',
      to: `/events/edit/${item.id}`,
    })),
    ...facultyItems.slice(0, 1).map((item: ContentRecord) => ({
      id: `faculty-${item.id}`,
      title: item.name || 'Dosen & Staf',
      subtitle: `${item.role || 'Pengajar'} · ${item.department || 'Akademik'}`,
      badge: 'Aktif',
      to: `/faculty/edit/${item.id}`,
    })),
  ].slice(0, 4)

  // Highlight event dates in current calendar month
  const eventDaysInMonth = new Set<number>()
  eventItems.forEach(ev => {
    if (ev.dateStart) {
      const d = new Date(ev.dateStart)
      if (!isNaN(d.getTime()) && d.getMonth() === calMonth && d.getFullYear() === calYear) {
        eventDaysInMonth.add(d.getDate())
      }
    }
  })

  const userName = auth?.user?.name || 'Administrator'

  return (
    <div className="space-y-6">
      {/* BARIS ATAS: Hero Greeting Banner (Kiri) + 4 KPI Stat Cards (Kanan) — Adaptasi Referensi EduSphere */}
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-12">
        {/* Hero Greeting Banner */}
        <Card className="relative overflow-hidden rounded-xl border-navy-200 bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800 text-white shadow-sm xl:col-span-5">
          <CardContent className="flex h-full flex-col justify-between p-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-400/30 bg-gold-500/15 px-3 py-1 text-xs font-semibold text-gold-300">
                <Sparkles size={13} />
                <span>Dashboard Utama</span>
              </div>
              <h1 className="font-playfair text-2xl font-bold leading-snug text-white sm:text-3xl">
                {getGreeting()}, {userName}
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-slate-300">
                Ringkasan konten portal STEP Foundation, tata kelola anggaran LPJ, dan kesiapan kegiatan akademik kampus.
              </p>
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                to="/pengajuan"
                className="inline-flex h-10 items-center gap-2 rounded-lg bg-gold-500 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gold-600"
              >
                Kelola Pengajuan & LPJ
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/news/create"
                className="inline-flex h-10 items-center gap-2 rounded-lg border border-navy-700 bg-navy-900/80 px-4 text-xs font-semibold text-slate-200 transition-colors hover:border-gold-400 hover:text-white"
              >
                Tulis Berita Baru
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* 4 KPI Stat Cards (Mempertahankan kontrak data & tes 4 modul utama) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:col-span-7">
          {entities.map((entity, index) => {
            const result = results[index]
            const Icon = ENTITY_ICONS[entity]
            return (
              <Card
                key={entity}
                className="flex flex-col justify-between rounded-xl border-slate-200 bg-white shadow-sm transition-all hover:border-gold-400"
              >
                <CardHeader className="pb-2">
                  <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-lg bg-gold-50 text-gold-600 ring-1 ring-gold-200/60">
                    <Icon size={20} />
                  </div>
                  <CardTitle className="font-sans text-sm font-semibold text-slate-700">
                    Total {contentMeta[entity].label}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 pt-0">
                  {result.isPending ? (
                    <p role="status" className="text-sm font-medium text-slate-600">
                      Memuat...
                    </p>
                  ) : result.isError ? (
                    <ErrorState
                      message={errorMessage(result.error)}
                      retry={() => {
                        void result.refetch()
                      }}
                    />
                  ) : (
                    <p
                      data-testid={`count-${entity}`}
                      className="font-playfair text-4xl font-bold tabular-nums text-navy-950"
                    >
                      {result.data.length}
                    </p>
                  )}
                  <Link
                    className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-600 hover:underline"
                    to={`/${entity}`}
                  >
                    Kelola {contentMeta[entity].label}
                    <ArrowRight size={13} />
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>

      {/* GRID UTAMA 2 KOLOM: Area Konten Tengah (8 Kolom) + Panel Kalender & Pintasan Kanan (4 Kolom) */}
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
        {/* KOLOM KIRI / TENGAH (8 Kolom) */}
        <div className="space-y-6 xl:col-span-8">
          {/* Modul Portal & Akademik (Adaptasi "My Current Courses" dengan 4 kartu visual ber-progress) */}
          <Card className="rounded-xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-lg font-bold text-navy-950">Modul Portal & Akademik</CardTitle>
                <p className="text-xs text-slate-600">Status publikasi dan kelengkapan data per modul utama</p>
              </div>
              <Link
                to="/pengajuan"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gold-700 hover:text-gold-600 hover:underline"
              >
                Modul Keuangan &rarr;
              </Link>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {entities.map((entity, idx) => {
                  const Icon = ENTITY_ICONS[entity]
                  const count = results[idx]?.data?.length ?? 0
                  const barPct = results[idx]?.isSuccess ? (count > 0 ? 100 : 25) : 50
                  return (
                    <div
                      key={entity}
                      className="flex flex-col justify-between rounded-xl border border-slate-200 bg-navy-50/30 p-3.5 transition-all hover:border-gold-300 hover:bg-white"
                    >
                      <div>
                        <div
                          className={`flex h-20 items-center justify-center rounded-lg ${ENTITY_HEADER_BG[entity]}`}
                        >
                          <Icon size={32} />
                        </div>
                        <p className="mt-3 font-semibold text-navy-950">{contentMeta[entity].label}</p>
                        <p className="text-xs text-slate-600">{ENTITY_DESCRIPTIONS[entity]}</p>
                      </div>

                      <div className="mt-4 space-y-1.5">
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-navy-100">
                          <div
                            className="h-full rounded-full bg-gold-500 transition-all duration-300"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                        <div className="flex items-center justify-between text-[11px] font-medium text-slate-600">
                          <span>Status Modul</span>
                          <Link
                            to={`/${entity}/create`}
                            className="font-semibold text-gold-700 hover:underline"
                          >
                            + Tambah
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Baris Tengah: Kesiapan Publikasi (Kiri) + Aktivitas Konten Terbaru (Kanan) */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            {/* Ringkasan Kesiapan (Adaptasi "Learning Progress" Donut Card) */}
            <Card className="rounded-xl border-slate-200 lg:col-span-5">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold text-navy-950">Kesiapan Publikasi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-5">
                  {/* Circular Progress Ring */}
                  <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-[6px] border-gold-500 bg-gold-50/40">
                    <div className="text-center">
                      <span className="block font-playfair text-xl font-bold text-navy-950">
                        {readinessPct}%
                      </span>
                      <span className="text-[10px] font-semibold text-slate-600">Aktif</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Berita Terbit</span>
                      <span className="font-semibold tabular-nums text-navy-950">{newsItems.length} item</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Event Publik</span>
                      <span className="font-semibold tabular-nums text-navy-950">{publishedEventsCount} agenda</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600">Fasilitas Siap</span>
                      <span className="font-semibold tabular-nums text-navy-950">{availableFacilitiesCount} ruang</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5 rounded-lg border border-gold-200 bg-gold-50 p-3 text-xs text-gold-800">
                  <CheckCircle2 size={16} className="shrink-0 text-gold-600" />
                  <span>Sinkronisasi revalidasi portal publik berjalan otomatis.</span>
                </div>
              </CardContent>
            </Card>

            {/* Entri Konten Terbaru (Adaptasi "Recent Activity") */}
            <Card className="rounded-xl border-slate-200 lg:col-span-7">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-base font-bold text-navy-950">Entri Konten Terbaru</CardTitle>
                <Link
                  to="/news"
                  className="text-xs font-semibold text-gold-700 hover:text-gold-600 hover:underline"
                >
                  Lihat Berita &rarr;
                </Link>
              </CardHeader>
              <CardContent>
                {recentFeed.length === 0 ? (
                  <p className="py-6 text-center text-xs text-slate-600">
                    Belum ada entri konten yang dimuat.
                  </p>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {recentFeed.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                        <div className="min-w-0">
                          <Link
                            to={item.to}
                            className="block truncate text-sm font-semibold text-navy-950 hover:text-gold-700"
                          >
                            {item.title}
                          </Link>
                          <p className="truncate text-xs text-slate-600">{item.subtitle}</p>
                        </div>
                        <span className="shrink-0 rounded-full border border-navy-200 bg-navy-50 px-2.5 py-0.5 text-[11px] font-semibold text-navy-800">
                          {item.badge}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Banner Bawah: Tata Kelola Anggaran & Absensi Mahasiswa (Adaptasi "Achieve Your Goals") */}
          <Card className="rounded-xl border-navy-200 bg-navy-50/70">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3.5">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-navy-950 text-gold-400">
                  <Target size={22} />
                </div>
                <div>
                  <p className="font-playfair text-base font-bold text-navy-950">
                    Integrasi Pengajuan LPJ & Absensi Mahasiswa
                  </p>
                  <p className="text-xs text-slate-600">
                    Pantau batas waktu penyerahan LPJ unit kerja serta kesiapan modul presensi mahasiswa.
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2.5">
                <Link
                  to="/absensi"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold text-navy-950 transition-colors hover:border-gold-500 hover:text-gold-700"
                >
                  <UserCheck size={15} />
                  Modul Absensi
                </Link>
                <Link
                  to="/pengajuan/peringatan"
                  className="inline-flex h-10 items-center gap-1.5 rounded-lg bg-gold-500 px-4 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gold-600"
                >
                  Cek Tenggat LPJ
                  <ArrowRight size={14} />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KOLOM KANAN: Kalender Bulanan, Agenda Kampus & Tautan Cepat (4 Kolom) */}
        <div className="space-y-6 xl:col-span-4">
          {/* Widget Kalender Bulanan */}
          <Card className="rounded-xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-bold text-navy-950">
                {MONTH_NAMES[calMonth]} {calYear}
              </CardTitle>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Bulan sebelumnya"
                  onClick={prevMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-gold-400 hover:text-navy-950"
                >
                  <ChevronLeft size={15} />
                </button>
                <button
                  type="button"
                  aria-label="Bulan berikutnya"
                  onClick={nextMonth}
                  className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:border-gold-400 hover:text-navy-950"
                >
                  <ChevronRight size={15} />
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-600">
                {DAYS_HEADER.map(day => (
                  <div key={day} className="py-1">
                    {day}
                  </div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1 text-center text-xs">
                {calendarCells.map((day, idx) => {
                  if (!day) return <div key={`empty-${idx}`} className="h-8" />
                  const isToday =
                    day === today.getDate() &&
                    calMonth === today.getMonth() &&
                    calYear === today.getFullYear()
                  const hasEvent = eventDaysInMonth.has(day)

                  return (
                    <div
                      key={day}
                      className={`flex h-8 items-center justify-center rounded-lg font-medium tabular-nums ${
                        isToday
                          ? 'bg-gold-500 font-bold text-white shadow-sm'
                          : hasEvent
                          ? 'border border-gold-300 bg-gold-50 font-semibold text-gold-700'
                          : 'text-navy-950 hover:bg-navy-50'
                      }`}
                    >
                      {String(day).padStart(2, '0')}
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Agenda & Kegiatan Mendatang (Adaptasi "Upcoming Classes") */}
          <Card className="rounded-xl border-slate-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-base font-bold text-navy-950">Agenda & Kegiatan</CardTitle>
              <Link
                to="/events"
                className="text-xs font-semibold text-gold-700 hover:text-gold-600 hover:underline"
              >
                Semua &rarr;
              </Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {eventItems.length === 0 ? (
                <div className="rounded-lg border border-slate-200 bg-navy-50/30 p-4 text-center text-xs text-slate-600">
                  Belum ada jadwal event kampus yang terdaftar.
                </div>
              ) : (
                eventItems.slice(0, 3).map(ev => (
                  <Link
                    key={ev.id}
                    to={`/events/edit/${ev.id}`}
                    className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-navy-50/30 p-3 transition-colors hover:border-gold-400 hover:bg-white"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-950 text-gold-400">
                        <Clock size={18} />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-navy-950">{ev.title}</p>
                        <p className="truncate text-xs text-slate-600">
                          {ev.location || 'Kampus STEP'} ·{' '}
                          {ev.dateStart ? new Date(ev.dateStart).toLocaleDateString('id-ID') : 'Terjadwal'}
                        </p>
                      </div>
                    </div>
                    <ChevronRight size={16} className="shrink-0 text-slate-400" />
                  </Link>
                ))
              )}
            </CardContent>
          </Card>

          {/* Pintasan Cepat (Adaptasi "Quick Links" di kanan bawah referensi) */}
          <Card className="rounded-xl border-slate-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold text-navy-950">Pintasan Cepat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 xl:grid-cols-2">
                <Link
                  to="/news/create"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-navy-50/40 p-3 text-center transition-colors hover:border-gold-400 hover:bg-gold-50/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-950 text-gold-400">
                    <Plus size={18} />
                  </div>
                  <span className="text-xs font-semibold text-navy-950">Berita Baru</span>
                </Link>

                <Link
                  to="/pengajuan/create"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-navy-50/40 p-3 text-center transition-colors hover:border-gold-400 hover:bg-gold-50/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-500 text-white">
                    <Receipt size={18} />
                  </div>
                  <span className="text-xs font-semibold text-navy-950">Buat Proposal</span>
                </Link>

                <Link
                  to="/pengajuan/peringatan"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-navy-50/40 p-3 text-center transition-colors hover:border-gold-400 hover:bg-gold-50/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gold-50 text-gold-700 ring-1 ring-gold-200">
                    <AlertCircle size={18} />
                  </div>
                  <span className="text-xs font-semibold text-navy-950">Kewajiban LPJ</span>
                </Link>

                <Link
                  to="/absensi"
                  className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-navy-50/40 p-3 text-center transition-colors hover:border-gold-400 hover:bg-gold-50/40"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-navy-100 text-navy-900">
                    <UserCheck size={18} />
                  </div>
                  <span className="text-xs font-semibold text-navy-950">Absensi & Skor</span>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
