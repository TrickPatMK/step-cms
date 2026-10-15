# UI Modul Pengajuan Dana & LPJ — Brief untuk dashboard CMS

Kontrak API: `D:\Programming\step-api-node\docs\pengajuan-lpj.md` (sumber kebenaran bentuk data dan aturan status). Backend dikerjakan lebih dulu; brief ini dipakai setelah endpoint `/api/pengajuan*` tersedia.

## Prinsip

- Dashboard ini untuk **staf/keuangan/pimpinan**, bukan publik. Semua halaman modul wajib berada di balik guard sesi admin yang sudah ada (`src/components/auth-provider.tsx`, `src/lib/api.ts`), mengikuti penanganan 401 (bersihkan sesi) vs 403 (sesi tetap) yang sudah dipakai modul lain.
- Ikuti pola yang sudah ada: React Query untuk fetch/cache, React Hook Form + Zod untuk form, komponen Shadcn yang sudah dipakai, dan `DashboardLayout` untuk navigasi. Jangan membuat lapisan data atau komponen tabel baru bila `content-list.tsx` / `content-form.tsx` sudah bisa dipakai.
- Status **tidak** diubah lewat form edit. Perubahan status hanya lewat tombol aksi yang memanggil `POST /api/pengajuan/:id/aksi`, dan hanya aksi yang sah untuk status saat ini yang ditampilkan.

## Halaman

### 1. Daftar pengajuan (`/pengajuan`)

Tabel: nomor, judul, unit, tahun anggaran, estimasi, realisasi, status proposal, status dana, status LPJ, tenggat LPJ.

- Filter: `statusProposal`, `statusDana`, `statusLpj`, `unit`, `tahunAnggaran`; pencarian nomor/judul/pengaju.
- Baris dengan LPJ terlambat diberi penanda visual yang jelas (teks, bukan hanya warna).
- Pencarian & filter dikirim ke API sebagai query, bukan disaring di browser, agar paginasi konsisten.

### 2. Detail pengajuan (`/pengajuan/:id`)

- Ringkasan: identitas pengajuan, pengaju, unit, nominal estimasi vs dicairkan vs realisasi, dan **selisih**.
- Tiga status (proposal, dana, LPJ) ditampilkan sebagai tiga bagian terpisah, bukan satu status gabungan.
- Tabel pos (`item`): uraian, rencana vs realisasi, penanda pos di luar rencana.
- Dokumen per peran: proposal, LPJ, nota, bukti. Aksi lepas lampiran hanya melepas kaitan, tidak menghapus berkas.
- Riwayat aksi (append-only) sebagai daftar kronologis; tidak ada tombol edit/hapus.
- Tombol aksi sesuai §3 kontrak; aksi yang butuh `catatan` (mis. `ubah_tenggat`) tidak boleh dikirim dengan catatan kosong.

### 3. Kewajiban LPJ (`/pengajuan/peringatan`)

- Daftar dari `GET /api/pengajuan/peringatan`: mendekati tenggat, terlambat, dan sudah cair tanpa LPJ.
- Filter jumlah hari (`dalamHari`) di UI; nilai bawaan dari server.
- Halaman ini hanya menampilkan; tidak ada aksi kirim pengingat pada v1.

### 4. Form pengajuan

- Buat/ubah data dasar + pos (`item`) dalam satu form.
- Field status **tidak** dapat diubah dari form ini.
- Validasi mengikuti skema API agar pesan 400 mudah ditampilkan; jangan menambahkan validasi yang bertentangan dengan aturan transisi.

## Tes dan pemeriksaan

- Tambah tes vitest setara modul lain: pemetaan respons API ke tabel, tampilan tiga status terpisah, tombol aksi hanya muncul untuk status yang sah, dan penanganan 401/403.
- `npm run build`, `npm run lint`, `npm test` harus lolos sebelum dilaporkan selesai.
- Verifikasi tampilan sebenarnya di browser dengan API hidup, bukan hanya build sukses.

## Batas v1

- Tidak ada penghapusan pengajuan dari UI.
- Tidak ada pengiriman WhatsApp/email/cron.
- Tidak ada grafik analitik, ekspor Excel, atau dasbor pimpinan khusus pada tahap ini.
- Tidak menyentuh `web-step` publik: data pengajuan tidak dipublikasikan.
- Pelaporan yayasan adalah proyek terpisah yang mengonsumsi `GET /api/pengajuan/rekap`.

## Yang belum diputuskan pemilik

Dasar perhitungan tenggat LPJ, format nomor pengajuan, unit penerima LPJ, dan apakah akses perlu dibatasi per unit. UI tidak boleh mengarang nilai bawaan untuk hal-hal ini.
