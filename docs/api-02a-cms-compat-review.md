# Review kompatibilitas CMS terhadap kontrak API-02a R1

Tanggal: 2026-10-23. Pemilik layer: @frontend-dev. Kartu: `t_f617a299`.
Status: **review dokumen + telaah delta. Bukan implementasi UI, bukan sign-off runtime, bukan pelepasan gate.**

Dokumen ini mencatat apa yang benar-benar dibaca dari konsumen `D:/Programming/step-cms` terhadap
kontrak `D:/Programming/step-api-node/docs/api-02a.md` **R1**, termasuk delta `+73/-7` dari baseline.
Tidak ada file UI, produk, auth, migrasi, DB, kredensial atau test runtime yang dijalankan/diubah.

## 1. Binding hash dan revisi yang ditelaah

| Objek | Nilai yang dibaca | Bukti |
| --- | --- | --- |
| Kontrak R1 | `164ec0b9c196c83178a3338d22c380e150f34e915ff35058e79c9bb38ba55fdd` | `sha256sum` dijalankan ulang; cocok dengan komentar `backend-dev` di `t_f617a299` |
| Kontrak baseline | `5c7eb84f538a3b738edd52b5ffb8ecd60f04a1655af3d3391d46075b54a6694d` | hash file `api02a-t_a1963db6.before.md` yang dipakai menghasilkan diff; **identik** dengan baseline yang diklaim |
| Delta baseline → R1 | `73 added, 7 removed` (`git diff --no-index --numstat`) | 4 hunk: `@@ -18,7 +18,7 @@`, `@@ -164,7 +164,7 @@`, `@@ -187,15 +187,15 @@`, `@@ -221,9 +221,75 @@` |
| `step-api-node` HEAD | `baa4f5476e22c2f2f4024d57f08d4e381a116aec` | `git rev-parse HEAD`; kontrak `docs/api-02a.md` **untracked**, jadi isi HEAD bukan R1 |
| `step-cms` HEAD | `4a6f18b64c56b86422268c0f48f2947bba8e8be1` | `git rev-parse HEAD`; worktree staged 22 file dari sesi asal, tidak diubah oleh review ini |

File konsumen yang dirujuk di bawah, hash yang benar-benar dibaca:

```text
dcec325d7c0a2b89f8d764eb58118765b8882e4a460c73496a20a6b2ac2d45e2  src/lib/api.ts
172260aa34c6e68dc0634cc00b621a6db783f1aa32363073e09620665b79b4cf  src/lib/auth.ts
ce7511c3d789d03a36e15fb203b63cbe43504d584c1df1b4bb312c39ae9ff95f  src/lib/content.ts
c96e5b4ec5fc508b22a7fdccdf951ae07dde1cccef8e6cd58c76c16fc4e4c4dc  src/lib/errors.ts
51ae4ddb76f885360e5a757c8d620e9af19aa5b5789859c96157b4c0a851e674  src/lib/images.ts
bcff799aa39642fd0abc153e3b73b8d91716e3537064f5cef10dc49ee66d36fc  src/lib/pengajuan.ts
5220d89d2bd47be2c4643904a8c317b23cbacade9b0bd2d3fa28a429b0523223  src/components/content-list.tsx
8fdbee2c14c0025c02290cec641cb76b9fd74b020d7355e78a4118c5e9273876  src/components/auth-provider.tsx
73c059805ae07c7951256ab06b0cab3b96a5dcd7065f1cce7419b10d4b9b73fb  src/pages/absensi/AbsensiDashboard.tsx
fc4308377f21a9e747a6fa31534b3adc8baa38f288c14902c8316274cf5cd085  vite.config.ts
08357907d8d2b736c1be4a03882a56c92fb6ce480976d6fb430556c657f97a1c  step-api-node/src/server.ts
38ade6cb2d23af7d0e3ee81d2f202ab8915a422d11a51a36026784f45e462f66  step-api-node/src/auth/index.ts
07f2f4f490b8f6f50b0b92232b4056d52e2638742d6ec200bf3ebcb5c83dc860  step-api-node/src/middlewares/auth.middleware.ts
72e774f1b8ce3f97fa0555015754b5fcfc19020a31f9667321a995f7dc247294  step-api-node/dashboard/src/Dashboard.tsx
```

## 2. Delta R1 yang ditelaah

Empat hunk menyentuh tepat empat wilayah, jadi bagian lain kontrak (termasuk schema `Student`,
`Me`, `Occurrence`, `Kegiatan`, `Page<T>`, matriks error dan route PATCH usulan) **tidak berubah**:

1. baris 21 — "Aturan wire bersama": larangan perubahan integrasi pada draft awal diganti rujukan ke R1.
2. baris ~164 — urutan lock user→Student ditegaskan wajib untuk semua jalur mapping/hapus user.
3. baris ~187–198 — scope caller hapus akun dipersempit (users DELETE + before-hook provider).
4. baris 221→295 — section **R1** baru: B1 guard mutasi seluruh modul, B2 pembatasan provider delete,
   B3 tambah metode PATCH saja, B4 wire/lifecycle tetap `proposed`, plus gate acceptance.

Dibandingkan dengan klaim `backend-dev` di kartu: seluruh klaim cocok dengan isi diff yang dibaca
(termasuk `+73/-7`, lokasi baris, dan tidak berubahnya payload Student/Me/Occurrence/Kegiatan).

## 3. Temuan per item

| # | Aturan R1 | Konsumen CMS (yang dibaca) | Verdict |
| --- | --- | --- | --- |
| F1 | B1 baris 249: `Cookie` + `Authorization` pada mutasi modul ditolak `403 Ambiguous mutation credentials` walau Origin trusted | `src/lib/api.ts:12-18` menempelkan `Authorization: Bearer` pada **setiap** request yang punya token; login lewat `api.post('/api/auth/sign-in/email')` (`src/components/auth-provider.tsx:39`) sehingga browser dapat menyimpan cookie sesi Better Auth (respons diteruskan proxy `vite.config.ts:15-27`) | **Tidak kompatibel, kondisi penentu**: bila cookie sesi ada di browser, semua mutasi CMS (`content.ts:74,78`, `pengajuan.ts:333,364,369,374,379,396`, `images.ts:30`) jadi mixed → 403. Kehadiran cookie **belum dibuktikan** di audit ini (tidak ada tes `Set-Cookie` di repo, tidak ada run runtime) |
| F2 | B1 baris 246: Origin mutasi harus trusted menurut AUTH-01, tanpa menambah origin | `step-api-node/src/auth/index.ts:44` `trustedOrigins` = hanya `localhost` 5173/3000/3001/3005/3008; `server.ts:46-52` `allowedOrigins` memuat `https://stepsmg.ac.id` yang **tidak** ada di `trustedOrigins` | **Tidak kompatibel untuk origin produksi CMS**: sesudah B1, mutasi cookie dari CMS produksi ditolak 403. Dev (`http://localhost:3005`, `vite.config.ts:14`) ada di kedua daftar → aman |
| F3 | B3 baris 272: tambah **hanya** metode `PATCH` ke CORS, origin tetap | CMS belum memakai PATCH sama sekali (0 kecocokan `api.patch`); update konten memakai `PUT` (`content.ts:74`). `server.ts:66` methods belum memuat `PATCH` | **Aditif, disetujui secara arah** untuk route Student/Occurrence kelak. Preflight hanya relevan bila `VITE_API_URL` diisi (cross-origin); mode proxy dev = same-origin tanpa preflight. Tanpa PATCH, PATCH admin lintas-origin gagal di preflight |
| F4 | `expectedVersion` + 409 `VERSION_CONFLICT` (baris 76, 147) | 0 kecocokan `expectedVersion` di `src/`; form konten mengirim objek penuh (`content.ts:72-76`); `errors.ts:5,7` hanya membaca `data.message` | **Belum diimplementasikan**. Envelope domain `{error:{code,message}}` (baris 140) tidak terbaca `errors.ts`, jadi 409/403 domain akan tampil sebagai "Request gagal. Silakan coba lagi." |
| F5 | `Page<T> = {data,nextCursor}` (baris 33, 132) | `normalizeList` (`content.ts:53-57`) menerima `{data:[...]}` tetapi **mengabaikan** `nextCursor`; daftar memfilter client-side (`content-list.tsx:36-41`), tanpa state cursor | **Tidak kompatibel bila dipakai ulang**: daftar admin Student/Occurrence akan diam-diam berhenti di `limit` default 20 |
| F6 | `status: draft\|open\|closed` (baris 107) dan "`open` ≠ pengiriman absensi dibuka" (baris 121) | `EventStatus = draft\|published\|archived` (`content.ts:5`); badge menampilkan nilai mentah (`content-list.tsx:66`) | **Jangan dipakai ulang**: label events tidak memetakan ke lifecycle occurrence; `active:boolean` Student tidak punya preseden di CMS |
| F7 | B4 baris 276: `student: StudentSelf\|null`, window/policy null, sign-off parser | `AbsensiDashboard.tsx` statis (tanpa `api.*`; data contoh `:20-32`), tidak ada pemanggil `/api/mahasiswa/*`, `/api/students`, `/api/activity-occurrences` (hanya prosa di `:70`, `:278`) | **Belum diimplementasikan, bukan sign-off.** Union tidak dapat merusak CMS karena belum ada parser; sign-off B4 tidak bisa diberikan dari sisi ini |
| F8 | B2 baris 255-257: hanya `DELETE /api/users/:id` yang mengeksekusi delete | CMS tidak punya halaman/hapus user (0 kecocokan `/api/users`). Pemanggil terdekat: `step-api-node/dashboard/src/Dashboard.tsx:58-66` memakai `DELETE /api/users/:id` (Bearer saja), self-delete disembunyikan `:179` | **Kompatibel** dengan jalur yang dipilih; dashboard ikut terpapar risiko F1 (Bearer + cookie potensial) |
| F9 | B1 baris 251: pesan guard `Untrusted mutation origin` / `Ambiguous mutation credentials` (Inggris) | UI CMS berbahasa Indonesia; `errors.ts:5` meneruskan `data.message` apa adanya | Butuh pemetaan copy atau penerimaan eksplisit; bukan blocker teknis |
| F10 | Gate acceptance B1 baris 282: bukti browser nyata | `src/test/api.test.ts:8-15` hanya membuktikan header Bearer ditempel; jsdom tidak punya cookie jar | **Tes CMS tidak dapat membuktikan kompatibilitas B1**; bukti harus dari browser nyata pada gate acceptance |

Catatan copy yang menyimpang dari kontrak terbuka (hanya relevan bila modul dibangun, bukan perubahan
yang diminta sekarang): `AbsensiDashboard.tsx:119-125,268` menulis "Eskalasi 3×" padahal batas percobaan
masih unresolved (`absensi-skor.md:102`); `:233` mencantumkan TTL 120 detik sebagai kepastian (kontrak:
usulan); `:241` menyebut fallback **PIN 6 digit** yang tidak ada di kontrak.

## 4. Keputusan yang diminta (pilih satu per baris)

1. **B1 kredensial campuran.** Rekomendasi: **izinkan mixed bila Origin trusted dan cookie+bearer
   me-resolve identitas yang sama**, tolak 403 hanya bila identitas berbeda. Alternatif: tetap tolak
   semua mixed (CMS harus berhenti mengirim `Authorization` saat cookie ada — perubahan dua aplikasi
   frontend, bukan satu), atau CMS migrasi penuh ke cookie-only (Bearer hanya untuk native).
2. **B3 metode PATCH.** Rekomendasi: **setujui penambahan `PATCH` saja** ke `methods` CORS, tanpa origin
   baru. Alternatif: pertahankan `PUT` untuk admin baru (menyimpang dari kontrak PATCH) atau tunda
   seluruh UI admin sampai keputusan CORS-01 selesai.

## 5. Batas bukti

- Dibaca: kontrak R1 penuh (295 baris) + diff `+73/-7`, kode konsumen CMS dan API yang dirujuk di atas.
- Tidak dijalankan: build, lint, `npm test`, browser, HTTP, DB/MySQL, migrasi, maupun perubahan layanan.
- Tidak diubah: file UI/produk, auth policy, schema, 22 file staged di `step-cms`, dan worktree API.
- Gate security dan `t_d2c0f673` tetap **tertahan**; dokumen ini tidak menyatakan gate lulus dan tidak
  menyatakan CMS kompatibel secara runtime.
