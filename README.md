# STEP-CMS

Dashboard administrator STEP Foundation untuk mengelola Berita, Event, Dosen/Staf, dan Fasilitas Kampus melalui STEP-API. Menggunakan React 19, TypeScript, Vite, Tailwind, React Query, React Hook Form/Zod, dan Tiptap v3.

## Menjalankan lokal

Gunakan Node.js 26 (versi yang dipakai untuk verifikasi) dan npm.

```powershell
# Terminal STEP-API
cd D:\Programming\step-api-node
npm ci --ignore-scripts
$env:PORT = '8000'
npm run dev

# Terminal STEP-CMS
cd D:\Programming\step-cms
npm ci --ignore-scripts
Copy-Item .env.example .env
npm run dev
```

Siapkan database dan akun admin di STEP-API sesuai API_DOCS.md. Jangan menjalankan migrasi terhadap database lama tanpa memeriksa skema/journal dan backup. Tidak ada migrasi baru dari perubahan CMS ini.

CMS berjalan pada http://localhost:3005; Vite meneruskan /api, /uploads, dan /public/uploads ke http://localhost:8000. Dokumentasi API: http://localhost:8000/llms.txt dan http://localhost:8000/docs.

## Konfigurasi dan hosting

- VITE_API_URL kosong: semua request memakai origin CMS melalui proxy lokal atau gateway production.
- Untuk API terpisah, isi VITE_API_URL dengan origin lengkap, misalnya https://api.example.test, **tanpa /api**. URL media relatif diselesaikan terhadap origin ini. Nilai VITE_* masuk bundle browser; jangan menaruh secret di dalamnya.
- Variabel Vite dibaca saat build. Setelah mengubah konfigurasi production, build ulang.
- Pada gateway same-origin, teruskan /api/*, /uploads/*, dan /public/uploads/* ke STEP-API **sebelum** fallback SPA. Rute CMS seperti /news/edit/:id harus kembali ke index.html saat refresh.
- Pada host terpisah, origin CMS wajib diizinkan oleh CORS allowedOrigins dan Better Auth trustedOrigins di STEP-API. Jangan menonaktifkan pemeriksaan Origin.
- Output hosting adalah dist/. npm run preview hanya untuk pemeriksaan lokal, bukan deployment production.

## Autentikasi dan akses

Login memakai POST /api/auth/sign-in/email. Session token disimpan dengan key step_api_token; bukan JWT yang di-decode oleh CMS. CMS memeriksa GET /api/auth/get-session sebelum menampilkan rute privat dan memerlukan role admin. Sesi diperiksa kembali saat window fokus dan setiap 60 detik.

401 pada request terproteksi membersihkan token/cache dan kembali ke login. 403 menampilkan akses terlarang tanpa menghapus sesi. Kesalahan kredensial login tetap ditampilkan di form. Logout menggunakan Bearer auth client; token/cache lokal tetap dibersihkan jika pencabutan sesi server gagal, dengan pesan kegagalan kepada pengguna.

## Kontrak konten

| Modul | Endpoint | Respons list | Respons detail | Field yang dikirim |
| --- | --- | --- | --- | --- |
| Berita | /api/stepnews | array | { article, seoStructuredData } | title, content, category, tags, imageUrl |
| Event | /api/events | { data: array } | { data: object } | title, description, dateStart, dateEnd, location, status, flyerUrl |
| Dosen/Staf | /api/faculty | { data: array } | { data: object } | name, role, department, email, photoUrl, bio, order |
| Fasilitas | /api/facilities | { data: array } | { data: object } | name, description, category, imageUrl, location, status |

Semua modul memakai POST untuk create serta PUT/DELETE /:id untuk update/hapus. Mutation memerlukan admin. Respons mutation Berita berupa artikel langsung; tiga modul lainnya memakai { data: object }. Detail, daftar, dan angka dashboard berbagi key cache per modul dan diinvalidasikan setelah mutation berhasil.

- Event: status draft/published/archived. Tanggal memakai zona waktu lokal browser dan dikirim ISO UTC. Tanggal akhir kosong disamakan dengan tanggal mulai; akhir sebelum mulai ditolak. Admin dapat membaca semua status; publik hanya published.
- Fasilitas: status available/maintenance/closed. Tidak ada urutan tampil karena schema API belum mendukungnya.
- Dosen/Staf: order tersedia; kategori kepegawaian, NIP, title, dan sortOrder tidak dikirim karena API tidak mendukungnya.
- Berita: pencarian judul/filter kategori dilakukan di client terhadap daftar yang sudah dimuat. PUT memakai field konten seperti create; penulis/tanggal terbit dipertahankan. DELETE menghapus komentar/interaksi dalam transaksi yang sama. Dialog menampilkan konsekuensinya.
- Upload: JPEG/PNG/WebP, kompresi maksimal 1 MB, POST /api/upload dengan multipart file. URL harus permanen. Tidak ada fallback blob/data URL; simpan diblokir selama upload berjalan. Penghapusan gambar dari form tidak menghapus file server yang mungkin dipakai konten lain.
- Backend menyaring HTML Berita, mempertahankan format toolbar yang diizinkan, serta memanggil revalidasi /berita dan /berita/:id setelah mutation sukses. Halaman publik Event/Dosen/Fasilitas belum termasuk milestone ini.

## Verifikasi

```powershell
# STEP-CMS
npm run build
npm run lint
npm test

# STEP-API
npm run build
npm test
```

Tes CMS memakai Vitest, React Testing Library, jsdom, dan mock pada batas HTTP. Tes mencakup akses admin, login/logout, 401/403, kontrak respons, CRUD empat modul, cache dashboard, tanggal Event, upload, serta editor Tiptap asli. Tes API memakai route/middleware/schema asli dengan database/session/webhook tiruan dan mencakup sanitasi, otorisasi, transaksi hapus, rollback, dan revalidasi Berita. Tes otomatis tersebut tidak membuktikan koneksi ke MySQL nyata.

Untuk smoke test MySQL, siapkan **database khusus pengujian** dengan schema terbaru dan akun admin. Dari STEP-API, isi TEST_DATABASE_URL, TEST_ADMIN_EMAIL, dan TEST_ADMIN_PASSWORD di environment lokal, lalu jalankan npm run test:integration. TEST_DATABASE_URL harus berbeda dari DATABASE_URL. Script melakukan CRUD/upload dan tidak boleh diarahkan ke database operasional.

Pemeriksaan browser akhir: login admin, create/edit/hapus empat modul, reload gambar yang tersimpan, uji token kedaluwarsa/non-admin, dan refresh URL edit pada hosting. Pada website publik, periksa create/update/hapus Berita setelah revalidasi.

## Batas milestone

Tidak mencakup modul user/dokumen, analytics pengunjung, deployment aktual, ataupun pemetaan halaman publik Event/Dosen/Fasilitas. Dashboard hanya menampilkan jumlah empat modul dari API; kontrol dan indikator statis telah dihapus.

## Hasil verifikasi lokal — 9 Oktober 2026

- STEP-CMS: build berhasil; lint tanpa error (dua warning Fast Refresh pada komponen UI lama); 47 tes otomatis berhasil.
- STEP-API: type-check dan 20 tes otomatis berhasil. Endpoint Berita, rollback, sanitasi, dan revalidasi diuji memakai route asli dengan batas database/session/webhook tiruan.
- Pembaruan dependensi kompatibel mengurangi npm audit dari 39 temuan (9 high) menjadi 7 (5 high, 2 moderate). Tujuh temuan tersisa berada pada rantai Tailwind v3: braces/chokidar/fast-glob/micromatch serta parser PostCSS. Audit menawarkan migrasi Tailwind v4 sebagai perbaikan; migrasi ini belum dilakukan agar stack dan styling yang disepakati tetap terjaga. Evaluasi migrasi sebelum rilis operasional.
- Axios memakai timeout 30 detik; auth client memakai timeout 15 detik sehingga logout yang macet dapat selesai dengan pembersihan sesi lokal.
- Smoke test MySQL belum dijalankan karena database dan kredensial khusus pengujian belum tersedia. Pengujian browser terhadap API/database hidup dan verifikasi hosting tetap diperlukan sebelum rilis.
