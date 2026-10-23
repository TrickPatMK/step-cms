import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { api, TOKEN_KEY, SESSION_EXPIRED_EVENT } from '@/lib/api'
import { AuthProvider, RequireAdmin } from '@/components/auth-provider'
import { NoticeProvider } from '@/components/feedback'
import DashboardLayout from '@/components/layout/DashboardLayout'
import PengajuanList from '@/pages/pengajuan/PengajuanList'
import PengajuanDetail from '@/pages/pengajuan/PengajuanDetail'
import PengajuanForm from '@/pages/pengajuan/PengajuanForm'
import PengajuanPeringatan from '@/pages/pengajuan/PengajuanPeringatan'
import Login from '@/pages/Login'
import type { Pengajuan, PengajuanDetail as PengajuanDetailType, PengajuanPeringatanItem } from '@/lib/pengajuan'
import { getValidActions } from '@/lib/pengajuan'

const { signOut } = vi.hoisted(() => ({ signOut: vi.fn() }))
vi.mock('@/lib/auth', () => ({ authClient: { signOut } }))

const mockPengajuanList: Pengajuan[] = [
  {
    id: 'pengajuan-1',
    nomor: '001/IT/STEP/2026',
    judul: 'Pengadaan SSD PC BAAK dan Webcam Kantor',
    jenis: 'pengadaan',
    unit: 'Biro IT',
    pengajuId: 'user-1',
    pengajuNama: 'Budi Santoso',
    tahunAnggaran: 2026,
    estimasiBiaya: '1400000.00',
    tanggalProposal: '2026-10-06',
    tenggatLpj: '2026-10-01', // Past deadline -> should be marked as overdue
    catatan: 'Catatan pengadaan hardware',
    statusProposal: 'disetujui',
    statusDana: 'dicairkan',
    statusLpj: 'belum_ada',
    jumlahDicairkan: '1400000.00',
    tanggalPencairan: '2026-10-07',
    tanggalLpjDiserahkan: null,
    tanggalLpjDiterima: null,
    verifikatorId: null,
    createdAt: '2026-10-06T00:00:00Z',
    updatedAt: '2026-10-07T00:00:00Z',
  },
  {
    id: 'pengajuan-2',
    nomor: '002/BAAK/STEP/2026',
    judul: 'Kegiatan Orientasi Mahasiswa Baru',
    jenis: 'kegiatan',
    unit: 'BAAK',
    pengajuId: null,
    pengajuNama: 'Siti Rahma',
    tahunAnggaran: 2026,
    estimasiBiaya: '5000000.00',
    tanggalProposal: '2026-10-10',
    tenggatLpj: '2026-11-30',
    catatan: null,
    statusProposal: 'draft',
    statusDana: 'belum_dicairkan',
    statusLpj: 'belum_ada',
    jumlahDicairkan: null,
    tanggalPencairan: null,
    tanggalLpjDiserahkan: null,
    tanggalLpjDiterima: null,
    verifikatorId: null,
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T00:00:00Z',
  },
]

const mockDetailPengajuan: PengajuanDetailType = {
  ...mockPengajuanList[0],
  item: [
    {
      id: 'item-1',
      pengajuanId: 'pengajuan-1',
      uraian: 'SSD TEAM T-FORCE VULCAN Z 512GB SATA3',
      satuan: 'unit',
      qtyRencana: '1.00',
      hargaRencana: '1400000.00',
      qtyRealisasi: '1.00',
      hargaRealisasi: '1395000.00',
      createdAt: '2026-10-06T00:00:00Z',
      updatedAt: '2026-10-07T00:00:00Z',
    },
    {
      id: 'item-2',
      pengajuanId: 'pengajuan-1',
      uraian: 'Webcam inventaris kantor',
      satuan: 'unit',
      qtyRencana: '0.00',
      hargaRencana: '0.00',
      qtyRealisasi: '1.00',
      hargaRealisasi: '220614.00', // Pos di luar rencana!
      createdAt: '2026-10-06T00:00:00Z',
      updatedAt: '2026-10-07T00:00:00Z',
    },
  ],
  dokumen: [
    {
      id: 'dokumen-1',
      pengajuanId: 'pengajuan-1',
      documentId: 'doc-uuid-1',
      peran: 'proposal',
      catatan: 'Proposal resmi bertanda tangan',
      createdAt: '2026-10-06T00:00:00Z',
    },
    {
      id: 'dokumen-2',
      pengajuanId: 'pengajuan-1',
      documentId: 'doc-uuid-2',
      peran: 'nota',
      catatan: 'Nota pembelian toko',
      createdAt: '2026-10-07T00:00:00Z',
    },
  ],
  riwayat: [
    {
      id: 'riwayat-1',
      pengajuanId: 'pengajuan-1',
      aksi: 'cairkan',
      aktorId: 'user-admin',
      aktorNama: 'Bendahara Kampus',
      nilaiSebelum: JSON.stringify({ statusDana: 'belum_dicairkan' }),
      nilaiSesudah: JSON.stringify({ statusDana: 'dicairkan' }),
      catatan: 'Dana dicairkan via transfer bank',
      createdAt: '2026-10-07T10:00:00Z',
    },
    {
      id: 'riwayat-2',
      pengajuanId: 'pengajuan-1',
      aksi: 'setujui',
      aktorId: 'user-admin',
      aktorNama: 'Ketua Yayasan',
      nilaiSebelum: JSON.stringify({ statusProposal: 'diajukan' }),
      nilaiSesudah: JSON.stringify({ statusProposal: 'disetujui' }),
      catatan: 'Disetujui untuk pengadaan mendesak',
      createdAt: '2026-10-06T15:00:00Z',
    },
  ],
}

const mockPeringatanList: PengajuanPeringatanItem[] = [
  {
    ...mockPengajuanList[0],
    terlambat: true,
  },
]

function renderWithProviders(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <NoticeProvider>
          <Routes>
            <Route path="/pengajuan" element={<PengajuanList />} />
            <Route path="/pengajuan/:id" element={<PengajuanDetail />} />
            <Route path="/pengajuan/create" element={<PengajuanForm />} />
            <Route path="/pengajuan/edit/:id" element={<PengajuanForm />} />
            <Route path="/pengajuan/peringatan" element={<PengajuanPeringatan />} />
          </Routes>
        </NoticeProvider>
      </MemoryRouter>
    </QueryClientProvider>
  )
  return queryClient
}

function adminSession() {
  return {
    user: { id: 'admin-1', name: 'Admin Keuangan', email: 'admin@step.test', role: 'admin' },
    session: { expiresAt: new Date(Date.now() + 3600_000).toISOString() },
  }
}

describe('Modul Pengajuan Dana & LPJ', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    signOut.mockResolvedValue({ data: { success: true }, error: null })
  })

  // 1. Pemetaan respons API ke tabel & overdue indicator
  it('Daftar pengajuan memetakan kolom dari API dengan benar dan menandai LPJ terlambat dengan teks jelas', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: mockPengajuanList } })

    renderWithProviders('/pengajuan')

    expect(await screen.findByText('001/IT/STEP/2026')).toBeInTheDocument()
    expect(screen.getByText('Pengadaan SSD PC BAAK dan Webcam Kantor')).toBeInTheDocument()
    expect(screen.getByText('Biro IT')).toBeInTheDocument()
    expect(screen.getByText('Budi Santoso')).toBeInTheDocument()
    expect(screen.getAllByText('Disetujui').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Dicairkan Penuh').length).toBeGreaterThan(0)
    expect(screen.getByText('002/BAAK/STEP/2026')).toBeInTheDocument()

    // Indikator LPJ terlambat dengan TEKS jelas (bukan hanya warna)
    const overdueBadge = screen.getByRole('status', { name: 'Terlambat' })
    expect(overdueBadge).toBeInTheDocument()
    expect(overdueBadge).toHaveTextContent('Terlambat')
  })

  // 2. Filter & pencarian dikirim ke API sebagai query params
  it('Pencarian dan filter mengirim query parameter ke endpoint API', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: [] } })

    renderWithProviders('/pengajuan')
    await screen.findByText('Belum ada data pengajuan dana.')

    const searchInput = screen.getByPlaceholderText('Cari nomor, judul, atau pengaju...')
    await userEvent.type(searchInput, 'SSD')

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('search=SSD'), expect.anything())
    })

    const unitInput = screen.getByPlaceholderText('Unit (mis. Biro IT)...')
    await userEvent.type(unitInput, 'Biro IT')

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('unit=Biro+IT'), expect.anything())
    })
  })

  // 3. Tampilan detail pengajuan
  it('Detail pengajuan menampilkan tiga status terpisah, ringkasan nominal + selisih, tabel item dengan pos di luar rencana, dokumen, dan riwayat', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: mockDetailPengajuan } })

    renderWithProviders('/pengajuan/pengajuan-1')

    // Nomor & Judul
    expect((await screen.findAllByText('001/IT/STEP/2026')).length).toBeGreaterThan(0)
    expect(screen.getByText('Pengadaan SSD PC BAAK dan Webcam Kantor')).toBeInTheDocument()

    // 3 Status terpisah (tanpa penomoran dekoratif sesuai disiplin anti-slop)
    expect(screen.getByText('Status Proposal')).toBeInTheDocument()
    expect(screen.getByText('Status Dana')).toBeInTheDocument()
    expect(screen.getByText('Status LPJ')).toBeInTheDocument()

    // Ringkasan Keuangan
    expect(screen.getByText('Estimasi Biaya')).toBeInTheDocument()
    expect(screen.getByText('Jumlah Dicairkan')).toBeInTheDocument()
    expect(screen.getAllByText('Total Realisasi').length).toBeGreaterThan(0)
    expect(screen.getByText('Selisih (Cair vs Realisasi)')).toBeInTheDocument()

    // Pos belanja rencana vs realisasi & pos di luar rencana
    expect(screen.getByText('SSD TEAM T-FORCE VULCAN Z 512GB SATA3')).toBeInTheDocument()
    expect(screen.getByText('Webcam inventaris kantor')).toBeInTheDocument()
    expect(screen.getByText('Di luar rencana')).toBeInTheDocument()

    // Dokumen
    expect(screen.getByText('Proposal resmi bertanda tangan')).toBeInTheDocument()
    expect(screen.getByText('Nota pembelian toko')).toBeInTheDocument()

    // Riwayat aksi append-only (tidak ada tombol edit atau hapus untuk riwayat)
    expect(screen.getByText('Riwayat Aksi (Audit Trail)')).toBeInTheDocument()
    expect(screen.getByText('Dana dicairkan via transfer bank')).toBeInTheDocument()
    expect(screen.getByText('Disetujui untuk pengadaan mendesak')).toBeInTheDocument()
  })

  // 4. Tombol aksi sesuai status & validasi catatan pada ubah_tenggat
  it('Tombol aksi hanya menampilkan aksi sah; ubah_tenggat memvalidasi catatan wajib', async () => {
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: mockDetailPengajuan } })
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: mockDetailPengajuan } })

    renderWithProviders('/pengajuan/pengajuan-1')

    // Pada status: proposal=disetujui, dana=dicairkan, lpj=belum_ada
    // Aksi yang sah: cairkan, serahkan_lpj, ubah_tenggat
    // Aksi yang TIDAK sah: ajukan, setujui, tolak, minta_revisi
    expect(await screen.findByRole('button', { name: /Serahkan LPJ/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Ubah Tenggat LPJ/i })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Setujui$/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Ajukan Proposal$/i })).not.toBeInTheDocument()

    // Klik Ubah Tenggat LPJ
    await userEvent.click(screen.getByRole('button', { name: /Ubah Tenggat LPJ/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()

    // Coba simpan tanpa mengisi tanggal atau catatan
    const submitBtn = within(dialog).getByRole('button', { name: /Konfirmasi Aksi/i })
    await userEvent.click(submitBtn)

    // Validasi catatan wajib
    expect(await within(dialog).findByText(/Tenggat baru wajib diisi|Alasan \/ catatan perubahan tenggat wajib diisi/)).toBeInTheDocument()
    expect(postSpy).not.toHaveBeenCalled()
  })

  // 5. Form create & edit: status tidak boleh diubah dari form
  it('Form pengajuan tidak menyediakan field ubah status dan mengirim payload bersih', async () => {
    const user = userEvent.setup({ delay: null })
    const postSpy = vi.spyOn(api, 'post').mockResolvedValue({ data: { data: mockPengajuanList[1], message: 'Created' } })

    renderWithProviders('/pengajuan/create')

    // Pastikan tidak ada input status proposal/dana/lpj di form
    expect(screen.queryByLabelText(/Status Proposal/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Status Dana/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Status LPJ/i)).not.toBeInTheDocument()

    // Isi formulir
    await user.type(screen.getByLabelText(/Nomor Pengajuan/i), '010/BAAK/2026')
    await user.type(screen.getByLabelText(/Judul Pengajuan/i), 'Pengadaan Meja Rapat')
    await user.type(screen.getByLabelText(/Unit Pengaju/i), 'BAAK')
    await user.type(screen.getByLabelText(/Nama Pengaju/i), 'Ahmad Fauzi')
    await user.type(screen.getByLabelText(/Estimasi Biaya Total/i), '2500000')

    await user.click(screen.getByRole('button', { name: /Tambah Baris Pos/i }))
    await user.type(screen.getByLabelText(/Uraian pos 1/i), 'Meja Rapat Kayu')

    await user.click(screen.getByRole('button', { name: /Buat Pengajuan/i }))

    await waitFor(() => {
      expect(postSpy).toHaveBeenCalledWith('/api/pengajuan', expect.objectContaining({
        nomor: '010/BAAK/2026',
        judul: 'Pengadaan Meja Rapat',
        unit: 'BAAK',
        pengajuNama: 'Ahmad Fauzi',
      }))
    })
  })

  it('Form edit memuat data lama dan menyimpan via PUT tanpa tenggatLpj', async () => {
    const user = userEvent.setup({ delay: null })
    vi.spyOn(api, 'get').mockResolvedValue({ data: { data: mockDetailPengajuan } })
    const putSpy = vi.spyOn(api, 'put').mockResolvedValue({ data: { data: mockDetailPengajuan, message: 'Updated' } })

    renderWithProviders('/pengajuan/edit/pengajuan-1')

    const judulInput = await screen.findByLabelText(/Judul Pengajuan/i)
    expect(judulInput).toHaveValue(mockDetailPengajuan.judul)

    // Pastikan tidak ada input tenggatLpj pada form edit
    expect(screen.queryByLabelText(/Tenggat LPJ Awal/i)).not.toBeInTheDocument()

    await user.clear(judulInput)
    await user.type(judulInput, 'Judul Proposal Baru Telah Direvisi')

    await user.click(screen.getByRole('button', { name: /Simpan Perubahan/i }))

    await waitFor(() => {
      expect(putSpy).toHaveBeenCalledWith('/api/pengajuan/pengajuan-1', expect.objectContaining({
        judul: 'Judul Proposal Baru Telah Direvisi',
      }))
      const payload = putSpy.mock.calls[0][1] as Record<string, unknown>
      expect(payload).not.toHaveProperty('tenggatLpj')
      expect(payload).not.toHaveProperty('statusProposal')
    })
  })

  it('Form pengajuan menampilkan pesan error 400 dari API seperti nomor duplikat', async () => {
    const error400 = {
      isAxiosError: true,
      response: {
        status: 400,
        data: { message: 'Nomor pengajuan sudah digunakan' },
      },
    }
    vi.spyOn(api, 'post').mockRejectedValue(error400)

    renderWithProviders('/pengajuan/create')

    await userEvent.type(screen.getByLabelText(/Nomor Pengajuan/i), '001/IT/STEP/2026')
    await userEvent.type(screen.getByLabelText(/Judul Pengajuan/i), 'Pengadaan Meja')
    await userEvent.type(screen.getByLabelText(/Unit Pengaju/i), 'BAAK')
    await userEvent.type(screen.getByLabelText(/Nama Pengaju/i), 'Ahmad')
    await userEvent.type(screen.getByLabelText(/Estimasi Biaya Total/i), '1000000')

    await userEvent.click(screen.getByRole('button', { name: /Buat Pengajuan/i }))

    expect((await screen.findAllByText('Nomor pengajuan sudah digunakan')).length).toBeGreaterThan(0)
  })

  // 6. Halaman Kewajiban LPJ (/pengajuan/peringatan)
  it('Halaman kewajiban LPJ menampilkan data dari endpoint peringatan dengan filter hari', async () => {
    const getSpy = vi.spyOn(api, 'get').mockResolvedValue({ data: { data: mockPeringatanList } })

    renderWithProviders('/pengajuan/peringatan')

    expect(await screen.findByText('001/IT/STEP/2026')).toBeInTheDocument()
    expect(screen.getByText('Pengadaan SSD PC BAAK dan Webcam Kantor')).toBeInTheDocument()
    expect(screen.getByText('Kewajiban LPJ & Peringatan Tenggat')).toBeInTheDocument()

    // Ubah filter hari
    const hariInput = screen.getByLabelText(/Tenggat Dalam:/i)
    await userEvent.clear(hariInput)
    await userEvent.type(hariInput, '30')

    await waitFor(() => {
      expect(getSpy).toHaveBeenCalledWith(expect.stringContaining('dalamHari=30'), expect.anything())
    })
  })

  // 7. Penanganan 401 dan 403
  it('Penanganan 401 membersihkan sesi dan mengarahkan ke halaman login', async () => {
    localStorage.setItem(TOKEN_KEY, 'admin-token')
    vi.spyOn(api, 'get').mockResolvedValue({ data: adminSession() })

    const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={['/pengajuan']}>
          <NoticeProvider>
            <AuthProvider>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<RequireAdmin />}>
                  <Route element={<DashboardLayout />}>
                    <Route path="/pengajuan" element={<PengajuanList />} />
                  </Route>
                </Route>
              </Routes>
            </AuthProvider>
          </NoticeProvider>
        </MemoryRouter>
      </QueryClientProvider>
    )

    // Tunggu sesi terverifikasi
    await screen.findByText('Admin Keuangan')

    // Simulasikan 401 session expired event
    window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT))

    await waitFor(() => {
      expect(screen.getByText('Masuk ke STEP CMS')).toBeInTheDocument()
      expect(localStorage.getItem(TOKEN_KEY)).toBeNull()
    })
  })

  it('Penanganan 403 mempertahankan sesi dan menampilkan pesan error izin', async () => {
    const error403 = {
      isAxiosError: true,
      response: {
        status: 403,
        data: { message: 'Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.' },
      },
    }
    vi.spyOn(api, 'get').mockRejectedValue(error403)

    renderWithProviders('/pengajuan')

    expect(await screen.findByText('Akses ditolak. Anda tidak memiliki izin untuk tindakan ini.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Coba lagi/i })).toBeInTheDocument()
  })
})

describe('Pemilihan aksi yang sah', () => {
  const dasar = {
    statusProposal: 'disetujui',
    statusDana: 'belum_dicairkan',
    statusLpj: 'belum_ada',
  } as Pengajuan

  it('menawarkan pencairan selama dana belum dicairkan penuh', () => {
    expect(getValidActions({ ...dasar, statusDana: 'belum_dicairkan' })).toContain('cairkan')
    expect(getValidActions({ ...dasar, statusDana: 'sebagian' })).toContain('cairkan')
  })

  it('tidak menawarkan pencairan setelah dana dicairkan penuh', () => {
    expect(getValidActions({ ...dasar, statusDana: 'dicairkan' })).not.toContain('cairkan')
  })

  it('tidak menawarkan perubahan tenggat setelah LPJ diterima', () => {
    expect(getValidActions({ ...dasar, statusLpj: 'diterima' })).not.toContain('ubah_tenggat')
  })
})
