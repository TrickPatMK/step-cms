# CMS client mahasiswa & jadwal kegiatan — laporan t_081507d0

Tanggal: 2026-10-23. Kartu: `t_081507d0` (frontend-dev). Legacy: API-02a (wire), CMS-REGRESSION sudah selesai.
Repo kerja: `D:/Programming/step-cms` (branch `main`, HEAD `4a6f18b`, tanpa commit/stage/reset).

## Kontrak yang dipakai (read-only, `D:/Programming/step-api-node`)

| Dokumen | SHA-256 |
| --- | --- |
| `docs/api-02a.md` | `352c5ae31cb5f548ccc66c878d0d82f6c312cf220256051bdb5409805316b192` (tidak berubah selama run) |
| `docs/attendance-cms-requirements.md` | `be67276c30ccabbc4fa6b755358beffee51d24dc7c676a4cd61f077f6f1b7f3f` |

Delta requirement doc selama run: hash awal `4c3855a8…` → `be67276c…`. Perubahan hanya bagian
"Keputusan pengaturan foto dari Patrick": verifikasi otomatis server **dan** review manual admin tersedia
dengan mode yang dapat dipilih dari CMS; retensi awal foto **30 hari**, dapat diubah. Rincian operasional
(batas nilai, awal penghitung, cakupan global/per kegiatan, purge) masih terbuka. Wire API-02a tidak berubah.

## Yang dibangun (client/UI saja, tanpa menunggu backend)

| File | Isi |
| --- | --- |
| `src/lib/absensi.ts` (baru) | tipe wire, `absensiApi` (GET/POST `/api/students`, GET/PATCH `/api/students/:id`, PUT `/api/students/:id/account`, GET/POST `/api/activity-occurrences`, GET/PATCH `/api/activity-occurrences/:id`, GET `/api/users`), pemetaan error domain, helper waktu lokal↔UTC |
| `src/pages/absensi/MahasiswaList.tsx` | daftar + filter `active`/`mapped` + cursor `nextCursor` (Muat berikutnya / Muat ulang) |
| `src/pages/absensi/MahasiswaDetail.tsx` | detail, aktif/nonaktif (PATCH `expectedVersion`), map/remap/unmap (PUT) |
| `src/pages/absensi/MahasiswaForm.tsx` | buat (POST) dan ubah (PATCH hanya field berubah) |
| `src/pages/absensi/KegiatanList.tsx` | daftar + filter status + cursor |
| `src/pages/absensi/KegiatanDetail.tsx` | detail, transisi `draft→open→closed` lewat PATCH `status` |
| `src/pages/absensi/KegiatanForm.tsx` | buat/ubah judul + waktu; UI waktu lokal, wire ISO UTC bermilidetik |
| `src/App.tsx`, `src/components/layout/DashboardLayout.tsx` | rute `/absensi/mahasiswa*`, `/absensi/kegiatan*`, menu "Data Mahasiswa" dan "Jadwal Kegiatan", `end` pada `/absensi` |
| `src/test/absensi.test.tsx` | 13 tes client-only (lihat bawah) |

Batas yang dijaga: tidak ada DELETE, tidak ada total/count/offset, tidak ada field rekurensi/lokasi/skor/
jendela presensi, tidak ada status `published` generik untuk kegiatan (draft/open/closed dari kontrak), tidak
ada penyimpanan pengaturan foto, tidak ada upload/presensi nyata.

## Semantik penting

- **Versi**: setiap PATCH/PUT mengirim `expectedVersion` dari data yang dimuat. Pada `409 VERSION_CONFLICT`
  klien melakukan **GET ulang satu kali** ke detail (bukan retry otomatis), isian pengguna di formulir tidak
  ditimpa (reset hanya saat data pertama untuk id itu tiba), dan pesan meminta periksa lalu simpan lagi.
- **Cursor**: `nextCursor` diperlakukan opaque; halaman berikutnya memakai nilai itu apa adanya; tidak ada
  dedupe berbasis id selain untuk mencegah baris ganda saat halaman bergeser.
- **Kosong vs gagal vs belum tersedia**: `200 {data:[],nextCursor:null}` → "Belum ada data …";
  tanpa respons → "Tidak dapat terhubung ke layanan API …"; 404 tanpa kode domain (route belum ada di server)
  → "Layanan API belum menyediakan data ini (HTTP 404)". Tidak ada angka/statistik rekaan.
- **Pesan**: kode domain (VERSION_CONFLICT, NIM_ALREADY_EXISTS, ACCOUNT_ALREADY_MAPPED, STUDENT_INACTIVE,
  INVALID_TRANSITION, INVALID_SCHEDULE, INVALID_CURSOR, dst.) dipetakan ke kalimat Indonesia; pesan mentah
  server tidak ditampilkan.
- **Waktu**: input `datetime-local`, dikirim `new Date(local).toISOString()` (mis. `...T08:00:00.000Z`);
  perbandingan "tidak berubah" memakai nilai lokal hasil konversi balik agar detik yang tidak terlihat tidak
  memicu PATCH palsu. Label UI menyebut waktu mengikuti zona waktu perangkat (kontrak tidak menetapkan tz UI).
- **Halaman absensi**: jadwal contoh, klaim verifikasi foto/GPS/PIN, dan matriks skor karangan dihapus/dinetralkan;
  bagian "Validasi Foto & Retensi" menyatakan pengaturan **belum tersedia** dan hanya mencatat keputusan produk
  yang sudah ada (mode verifikasi otomatis/manual dapat dipilih, retensi awal 30 hari), tanpa formulir/endpoint rekaan.

## Verifikasi yang dijalankan

| Cek | Hasil |
| --- | --- |
| `npx vitest run` baseline (sebelum perubahan) | 7 file, **60** tes lulus |
| `npx vitest run` sesudah | 8 file, **73** tes lulus (60 + 13 baru) |
| `npm run build` | lulus (`tsc -b` + vite build) |
| `npm run lint` (oxlint) | lulus; 3 warning lama (`ui/form.tsx`, `ui/button.tsx`, `PengajuanForm.tsx`), tidak ada dari file baru |
| Browser nyata `http://localhost:3005` (listener existing, tidak di-restart), login lewat vault | nav sidebar → `/absensi/mahasiswa`, `/absensi/kegiatan`, `/absensi`; formulir create keduanya render; detail id sintetis menampilkan status belum tersedia + "Coba lagi" |
| Overflow | desktop 1264/1264 dan 390px 390/390 (sama) pada `/absensi`, `/absensi/mahasiswa`, `/absensi/mahasiswa/create`, `/absensi/kegiatan`, `/absensi/kegiatan/create` |
| Console error browser | 0 (`console.error` + `error` + `unhandledrejection` di-hook selama navigasi) |

Tes baru (`src/test/absensi.test.tsx`) memakai adapter axios klien sendiri dengan bentuk wire persis kontrak,
**client-only**: nav sidebar nyata, kosong vs offline vs 404, cursor, filter literal, create/PATCH/PUT body,
409 + GET ulang + isian pengguna dipertahankan + tanpa retry otomatis, 401/403, transisi draft→open→closed,
form jadwal (ISO UTC milidetik, waktu terbalik ditolak), dan halaman absensi tanpa jadwal contoh.

## Belum terverifikasi (eksplisit)

- **Integrasi API nyata: NOT VERIFIED.** `/api/students` dan `/api/activity-occurrences` masih 404 pada
  listener dev hari ini; tidak ada CRUD yang dibuktikan ke server, tidak ada readback DB. Gate integrasi
  terpisah: `t_235697be` (butuh backend `t_19a00806`).
- Pengaturan validasi foto/retensi: wire belum terbit (proposal `t_2f57f16a`), section tetap unavailable.
- Pemeriksaan visual piksel (screenshot) tidak dilakukan; QA browser di atas berbasis teks DOM, angka overflow,
  dan hitungan console error.
- `attendanceEnabled=false`; tidak ada upload, presensi, skor, atau data mahasiswa nyata yang disentuh.

## Tabrakan penulis (hotspot)

`src/pages/absensi/AbsensiDashboard.tsx` dan `src/test/absensi.test.tsx` ditulis ulang penulis lain saat run ini
berjalan (mtime 18:43:41, 18:53:45, dan 18:54:18), menimpa/mengubah isi yang baru saja ditulis. Versi terakhir
yang dipertahankan di sini adalah hasil rekonsiliasi: struktur halaman dari penulis lain + copy "belum tersedia"
sesuai keputusan produk. Satu penulis harus ditunjuk untuk dua file itu sebelum pekerjaan berikutnya.
