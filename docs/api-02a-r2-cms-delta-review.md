# API-02a R2 — telaah delta untuk konsumen CMS

Tanggal: 2026-10-23 WIB. Kartu: `t_a4fa0fc7` (frontend-dev), konsumen handoff `t_4dfbbfb4`.
Sifat: telaah dokumen + inventaris caller read-only. Bukan sign-off R2, bukan implementasi UI,
bukan bukti runtime/caller/security green, dan tidak melepas gate `t_372886c7` maupun `t_d2c0f673`.
Audit R1 (`docs/api-02a-cms-compat-review.md`) tidak otomatis berlaku untuk R2; dokumen ini hanya deltanya.

## 1. Binding yang diverifikasi ulang

| Objek | SHA-256 / nilai | Status |
| --- | --- | --- |
| Kontrak R2 `step-api-node/docs/api-02a.md` | `352c5ae31cb5f548ccc66c878d0d82f6c312cf220256051bdb5409805316b192` | cocok dengan binding kartu, tidak berubah |
| Delta R1→R2 `docs/api-02a-r2-evidence/r1-to-r2.diff` | `c1f1b1579763057b3a96b12a4aa7a7a37a4c05bb2e5aa506b574fbe791743512`; 7 hunk, 49 added / 28 removed | cocok |
| Evidence backend `docs/api-02a-r2-review.md` | `5f7c6e8826c02de94db172a77de3aca55a7bfea3f7b33bf14a83cdd5061a50a3` | cocok |
| Security review `docs/api-02a-r2-security-review.md` | `1159f5750271537cd4d23cabd7c925eee3b013e466a9fd235110507c13b6a4b6` | dibaca, verdict approve dokumen saja |
| API HEAD | `baa4f5476e22c2f2f4024d57f08d4e381a116aec` (kontrak untracked) | tetap |
| CMS HEAD | `4a6f18b64c56b86422268c0f48f2947bba8e8be1` | tetap, staged/unstaged/untracked dipertahankan |

Hash berubah? Tidak. Binding lama tetap dipakai; tidak ada delta hash yang perlu dicatat.

## 2. Delta R2 dan verdict per delta

| # | Delta R2 | Bukti konsumen CMS yang dibaca | Verdict |
| --- | --- | --- | --- |
| D1 | Kredensial mixed: blanket 403 R1 diganti dual independent verification; Cookie+Bearer dengan `user.id` sama + Origin trusted **boleh** (session/token boleh berbeda). Invalid/expired/revoked/missing/mismatch tetap 403 `Ambiguous mutation credentials` | `src/lib/api.ts:12-18` menempelkan Bearer pada **setiap** request; login `src/components/auth-provider.tsx:39-44` menaruh token localStorage dan browser menyimpan cookie sesi; bukti dev `docs/api-02a-b1-browser-evidence.md` E1–E3: GET membawa Authorization+Cookie, POST same-origin membawa Origin+Cookie+Bearer | **conditional** (bukan incompatible): bentuk normal CMS kini diizinkan, tetapi sign-off butuh (a) bukti runtime satu mutasi domain lolos dengan dua sesi same-user di dev, (b) penanganan 403 mixed-invalid: `src/lib/api.ts:23` hanya membersihkan token pada 401, jadi bearer basi + cookie valid membuat mutasi gagal 403 berulang sampai query sesi 60 detik/focus menyegarkan, (c) copy `src/lib/errors.ts:5` meneruskan pesan Inggris `Ambiguous mutation credentials` ke UI Indonesia |
| D2 | Precedence: admission Origin/kredensial pada `onRequest` mendahului parser/validasi route pada **mutasi**; read existing tetap boleh 400 sebelum preHandler | `src/lib/content.ts:74,78`, `src/lib/images.ts:30`, `src/lib/pengajuan.ts:333,364,369,374,379,396` mengirim mutasi lewat axios (browser mengirim Origin pada non-GET, teramati E3) | **cocok** untuk jalur sukses (payload valid tetap 400/200 seperti sekarang); **conditional** pada kegagalan: mutasi dengan Origin/kredensial ditolak sekarang berhenti di 403 sebelum 400, sehingga pesan validasi API tidak muncul dan pemetaan copy 403 perlu diputuskan kelak |
| D3 | `Cache-Control: no-store` ditegaskan untuk semua denial (dan sukses) termasuk 400/409/500 | CMS tidak punya service worker/PWA (`grep serviceWorker|manifest|workbox` = 0), tidak ada cache HTTP persisten; state hanya react-query in-memory (`src/main.tsx`, query sesi `staleTime:0`) | **cocok**, tanpa perubahan kode |
| D4 | Provider delete: `POST /api/auth/admin/remove-user` dan direct `auth.api.removeUser` seluruh akun (mapped/unmapped) mendapat early 409 Response JSON + no-store; hanya `DELETE /api/users/:id` yang mengeksekusi | `grep '/api/users|removeUser|authClient.admin|remove-user'` di `src/` = 0 hasil; CMS tidak punya halaman user. Pemanggil users DELETE ada di `step-api-node/dashboard/src/Dashboard.tsx:58-66` (bukan repo ini) | **tidak berlaku** untuk CMS; jalur users DELETE yang dipakai dashboard tidak berubah bentuk. Inventory caller eksternal/deployment **tidak** diklaim lengkap |
| D5 | B4 wire tetap PROPOSED: `student: StudentSelf\|null`, window/policy null, cursor/`expectedVersion`, lifecycle draft/open/closed | `grep 'api.patch|expectedVersion'` di `src/` = 0; `src/pages/absensi/AbsensiDashboard.tsx` statis tanpa `api.*`; `normalizeList` (`src/lib/content.ts:53-57`) masih mengabaikan `nextCursor` | **belum diimplementasikan** di CMS. Tidak disebut compatible; sign-off parser/version/cursor tetap pending |

Catatan lintas-delta: `ZERO SESSION WRITE` pada mutasi tidak merusak CMS karena penyegaran/pemeriksaan sesi
CMS berjalan lewat GET `/api/auth/get-session` (`src/components/auth-provider.tsx:25-37`) yang perilakunya
tidak diubah R2. Yang belum ada buktinya: apakah cookie sesi dan token bearer memang me-resolve `user.id`
yang sama saat mutasi (baru tiga GET + satu POST auth yang teramati).

## 3. Inventaris caller mutasi CMS (source hash)

```text
dcec325d7c0a2b89f8d764eb58118765b8882e4a460c73496a20a6b2ac2d45e2  src/lib/api.ts           (interceptor Bearer + 401 handler)
172260aa34c6e68dc0634cc00b621a6db783f1aa32363073e09620665b79b4cf  src/lib/auth.ts          (signOut Bearer)
8fdbee2c14c0025c02290cec641cb76b9fd74b020d7355e78a4118c5e9273876  src/components/auth-provider.tsx (sign-in token, GET get-session)
c96e5b4ec5fc508b22a7fdccdf951ae07dde1cccef8e6cd58c76c16fc4e4c4dc  src/lib/errors.ts        (403 → data.message)
ce7511c3d789d03a36e15fb203b63cbe43504d584c1df1b4bb312c39ae9ff95f  src/lib/content.ts        (:74 POST/PUT, :78 DELETE)
51ae4ddb76f885360e5a757c8d620e9af19aa5b5789859c96157b4c0a851e674  src/lib/images.ts         (:30 POST multipart /api/upload)
bcff799aa39642fd0abc153e3b73b8d91716e3537064f5cef10dc49ee66d36fc  src/lib/pengajuan.ts      (:333 POST, :364 PUT, :369 POST aksi, :374 POST dokumen, :379 DELETE dokumen, :396 POST multipart documents)
73c059805ae07c7951256ab06b0cab3b96a5dcd7065f1cce7419b10d4b9b73fb  src/pages/absensi/AbsensiDashboard.tsx (statis, tanpa caller API)
fc4308377f21a9e747a6fa31534b3adc8baa38f288c14902c8316274cf5cd085  vite.config.ts           (proxy /api → :8000, port 3005)
```

Sembilan callsite mutasi domain (2 content, 1 upload, 6 pengajuan) semuanya lewat instance axios yang sama,
jadi semuanya mewarisi bentuk mixed cookie+Bearer+Origin. Tidak ada `api.patch`, tidak ada `expectedVersion`,
tidak ada caller provider delete. Ini inventaris repo CMS saja — bukan audit caller eksternal, mobile
atau deployment, dan origin produksi CMS belum terkonfirmasi.

## 4. Batas

- Dibaca: kontrak R2 penuh, 7 hunk diff, evidence backend, security review, bukti browser `t_7ac7c7a9`
  (dev teramati saja, tidak diulang), source CMS/API yang dirujuk, dua daftar origin existing.
- Tidak dijalankan: browser, server, build, lint, `npm test`, HTTP, DB/MySQL, device; tidak membuka credential.
- Tidak diubah: source/test/config/kontrak/UI, 22 file staged + 3 unstaged CMS, worktree API; tanpa
  stage/reset/stash/commit/push.
- `attendanceEnabled=false`, pilot/API-02b/data nyata tidak diotorisasi; gate `t_372886c7` dan `t_d2c0f673` tetap held.
