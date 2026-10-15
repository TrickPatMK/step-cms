# PRD STEP-CMS — stabilisasi empat modul

## Tujuan

Administrator STEP Foundation dapat mengelola Berita, Event, Dosen/Staf, dan Fasilitas dengan data yang konsisten terhadap STEP-API. React 19 + Vite menyediakan dashboard; STEP-API menjadi sumber kontrak dan penyimpanan.

## Status implementasi

| Area | Implementasi |
| --- | --- |
| Akses admin | Guard sesi server, role admin, loading/error/retry, penanganan 401 dan 403 terpisah, logout membersihkan token/cache |
| Berita | List/create/edit/delete, dialog konfirmasi, pencarian judul, filter kategori; backend PUT/DELETE ditambahkan |
| Event | CRUD, status enum, validasi rentang waktu; dateEnd kosong memakai dateStart |
| Dosen/Staf | CRUD untuk field API; order dipertahankan, kategori/NIP/alias yang tidak didukung dihapus |
| Fasilitas | CRUD untuk field API; input/kolom urutan yang tidak disimpan dihapus |
| Upload/editor | JPEG/PNG/WebP, kompresi, URL permanen, simpan menunggu upload; tidak ada fallback blob |
| Dashboard | Total empat modul dari API; kegagalan request tampil sebagai error, indikator statis dihapus |
| API Berita | Sanitasi create/update bersama, transaksi hapus komentar/interaksi/artikel, webhook revalidasi setelah sukses |
| Pengujian | Suite CMS untuk kontrak, auth, CRUD/cache, tanggal, upload, editor; suite API diperluas untuk Berita |
| Dokumentasi | README konfigurasi lokal/hosting/kontrak/tes; .env.example; API_DOCS.md diperbarui |

Status di atas menjelaskan implementasi kode, bukan klaim bahwa smoke test MySQL/hosting telah selesai. Laporan lama “50% selesai” tidak digunakan karena tidak memiliki kriteria penerimaan yang terukur.

## Kriteria penerimaan

1. Build, lint, dan tes CMS/API berhasil.
2. URL privat hanya dapat diakses sesi admin; 401 membersihkan sesi/cache, 403 mempertahankan sesi valid.
3. CRUD empat modul mengirim field yang didukung dan menyegarkan daftar/detail/dashboard.
4. Upload gagal tidak menyimpan URL sementara; gambar permanen tetap terbaca setelah reload.
5. Format Berita yang didukung bertahan setelah simpan/edit; HTML berbahaya dibuang oleh API.
6. Hapus Berita menghapus relasinya dalam transaksi dan rollback saat terjadi kegagalan.
7. Smoke test terhadap MySQL khusus pengujian dan pemeriksaan browser akhir berhasil sebelum dinyatakan siap operasional.

## Keputusan milestone

- Mengikuti schema STEP-API yang tersedia; tidak ada migrasi database baru.
- Menambahkan PUT/DELETE Berita tanpa mengubah bentuk GET list/detail.
- Mempertahankan stack dan session token Bearer.
- Tidak menambah user/dokumen, analytics, deployment aktual, atau integrasi halaman publik Event/Dosen/Fasilitas.

## Berikutnya

Jalankan smoke test saat konfigurasi database pengujian tersedia, validasi browser bersama API hidup, kemudian tentukan milestone pemetaan data Event/Dosen/Fasilitas ke website publik. Modul user/dokumen dan analytics dikerjakan setelah kebutuhan produk disepakati.

## Verifikasi 9 Oktober 2026

Build/lint CMS dan type-check API berhasil. Suite otomatis CMS berisi 47 tes, API 20 tes. Audit dependensi CMS tersisa 7 temuan pada rantai Tailwind v3 setelah pembaruan kompatibel; migrasi Tailwind v4 menjadi pekerjaan lanjutan sebelum rilis. Smoke test MySQL dan browser dengan API hidup masih tertunda karena database khusus pengujian belum tersedia.
