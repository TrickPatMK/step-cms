# Product Requirements Document (PRD) & Perencanaan: STEP CMS

## 1. Tujuan Produk
Membangun sebuah *Content Management System* (CMS) berbasis *Client-Side Rendering* (CSR) menggunakan **React + Vite** yang bertugas untuk mengelola konten **Berita (News)** dan **Event (Agenda)** pada ekosistem STEP. CMS ini dirancang sebagai aplikasi *dashboard* bagi administrator untuk memasukkan data yang nantinya akan dikonsumsi oleh aplikasi klien publik.

## 2. Arsitektur & Tech Stack
- **Frontend Framework:** React 18 dengan Vite (TypeScript).
- **Styling:** Tailwind CSS v3 & Shadcn UI (Radix UI).
- **State Management & Fetching:** TanStack Query (React Query) & Axios.
- **Form & Validasi:** React Hook Form & Zod.
- **Rich Text Editor:** Tiptap (dengan ekstensi komprehensif).
- **Autentikasi:** API Better-Auth (Token Bearer JWT disimpan di `localStorage`).
- **Target API Utama:** `http://localhost:8000` (Fastify Server).

---

## 3. Laporan Kemajuan Saat Ini (*Progress Report*)

Tabel di bawah ini merepresentasikan status terkini dari pengembangan aplikasi kita:

| Fitur / Modul | Status | Keterangan / Catatan |
| :--- | :---: | :--- |
| **Inisialisasi Proyek** | ✅ Selesai | Konfigurasi React, Vite, TS, dan Tailwind CSS telah stabil. |
| **Konfigurasi API & Proxy** | ✅ Selesai | Menggunakan Vite Proxy (`/api` -> `localhost:8000`) untuk mem-Bypass CORS *local development*. |
| **Sistem Autentikasi (Login)** | ✅ Selesai | Login Admin via email/password. Token diekstrak dan disuntikkan secara otomatis via *Axios Interceptors*. |
| **Layout Dashboard Utama** | ✅ Selesai | Desain sidebar navigasi modern, dan _metric card_ yang mengambil data real-time (contoh: Total Berita). |
| **Modul Berita: Read (List)** | ✅ Selesai | Tabel berita elegan dengan *fetching* data dari `GET /api/stepnews`. |
| **Modul Berita: Create & Edit** | ✅ Selesai | Form interaktif menggunakan Zod. Jika mode edit, data berita (*termasuk format HTML*) dimuat kembali secara reaktif ke Tiptap. |
| **Rich Text Editor (Tiptap)** | ✅ Selesai | Fitur teks lengkap (Bold, Italic, Rata paragraf, Link) + **Upload Gambar di dalam teks**. |
| **Client-Side Image Compression** | ✅ Selesai | Fungsi kompresi gambar (maksimal 1MB) sebelum gambar diserahkan ke API (menghemat *bandwidth* server). |

---

## 4. Perencanaan Selanjutnya (*Next Steps*)

Berikut adalah langkah-langkah yang harus kita kerjakan selanjutnya untuk merampungkan ekosistem ini:

### Tahap 1: Persiapan API Tambahan (Backend)
Berdasarkan investigasi sebelumnya, ada beberapa API yang **belum tersedia** di sisi Fastify backend dan harus kita lengkapi terlebih dahulu:
1. **API Upload Gambar (`POST /api/upload`):** Saat ini CMS hanya mengompres gambar dan menampilkannya sebagai *blob local*. Kita butuh *endpoint* API untuk menerima file gambar dan mengembalikan URL permanen (misalnya `/public/uploads/gambar.jpg`).
2. **API Modul Event (`/api/events`):** Skema *database* (Drizzle) dan *routing* untuk Event/Agenda belum ada di *backend* API. Kita perlu merancangnya di backend.

### Tahap 2: Modul Event (CMS Frontend)
Setelah API Event siap, kita akan membangun antarmuka di CMS:
1. **Halaman Event List:** Menampilkan tabel jadwal kegiatan.
2. **Form Event (Create/Edit):** Mirip dengan form berita, namun dilengkapi input Kalender (Date Picker) untuk tanggal pelaksanaan, lokasi event, dan status (Selesai/Akan Datang).

### Tahap 3: Finalisasi & Keamanan
1. **Route Protection (Frontend):** Melindungi halaman-halaman di CMS agar me-*redirect* pengguna kembali ke halaman `/login` jika token di `localStorage` kosong atau kadaluwarsa.
2. **Error Handling API:** Menangani respons API seperti token expired (`401 Unauthorized`) dengan rapi menggunakan Notifikasi (*Toast*).

---

## 5. Ringkasan
Aplikasi CMS ini sudah di tahap **50% selesai** (Modul Berita sepenuhnya rampung di sisi UI & Logika). Sisa pekerjaan utama difokuskan pada sinkronisasi *endpoint* tambahan di API dan pembangunan antarmuka modul Event.
