# API-02a B1 — bukti browser credential/origin (CMS)

Tanggal: 2026-10-23. Kartu: `t_7ac7c7a9` (frontend-dev). Gate: `t_372886c7`.
Sifat: pengumpulan bukti nonmutating. Bukan sign-off caller, bukan persetujuan keamanan, bukan izin implementasi.

Bukti terstruktur (tanpa nilai token/cookie): `docs/api-02a-b1-browser-evidence.json`.
Dokumen ini tidak memuat token, cookie, password, header mentah, dump storage, PII, atau screenshot.

## Binding

| Item | Nilai |
| --- | --- |
| step-cms HEAD | `4a6f18b64c56b86422268c0f48f2947bba8e8be1` (working tree dengan 22 file staged/termasuk perubahan unstaged, tidak diubah) |
| step-api-node HEAD | `baa4f5476e22c2f2f4024d57f08d4e381a116aec` |
| Kontrak R1 `docs/api-02a.md` | SHA-256 `164ec0b9c196c83178a3338d22c380e150f34e915ff35058e79c9bb38ba55fdd` (identik dengan yang ditelaah t_f617a299) |
| `step-cms/src/lib/api.ts` | `dcec325d…` |
| `step-cms/src/lib/auth.ts` | `172260aa…` |
| `step-cms/src/components/auth-provider.tsx` | `8fdbee2c…` |
| `step-cms/vite.config.ts` | `fc430837…` |
| `step-api-node/src/server.ts` | `08357907…` |
| `step-api-node/src/auth/index.ts` | `38ade6cb…` |

Hash penuh ada di JSON bukti.

## Lingkungan (semua sudah berjalan sebelum kartu ini)

- CMS: `http://localhost:3005` (vite dev listener yang sudah aktif; `vite.config.ts` proxy `/api` → `http://localhost:8000`).
- API: listener lokal `http://localhost:8000` sudah aktif (`GET /api/ping` → 200).
- Browser: Chromium nyata lewat CDP, profil terisolasi (cookie jar bersih). Tidak ada service/listener baru yang dinyalakan.
- Sesi: akun admin sintetis lokal dari `step-api-node/.env` (`TEST_ADMIN_*`); nilai tidak pernah dicetak, ditulis ke laporan, atau disimpan. Sign-in lalu sign-out dijalankan, tidak ada sesi tersisa (cookie jar kosong setelah uji).

## Hasil

**E1 — login CMS menaruh cookie httpOnly Better Auth.** Profil bersih: 0 cookie sebelum. Submit form login → `POST /api/auth/sign-in/email` status 200 → token ada di `localStorage`. Sesudah: 1 cookie `better-auth.session_token`, `httpOnly=true`, `SameSite=Lax`, `secure=false` (dev HTTP). Karena profil bersih, cookie itu hanya bisa berasal dari sign-in tersebut.

**E2 — request baca membawa Authorization DAN Cookie sekaligus.**

| Request | Authorization | Cookie | Header Origin | Status |
| --- | --- | --- | --- | --- |
| `GET /api/auth/get-session` | ada | ada | tidak ada | 200 |
| `GET /api/faculty` | ada | ada | tidak ada | 200 |
| `GET /api/events` | ada | ada | tidak ada | 200 |

Mode credential terukur dari klien: XHR `withCredentials=false`, `fetch` credentials `default`. Tetap cookie terkirim karena request *same-origin* ke `:3005` lalu diteruskan proxy vite ke API. Jadi menambah `withCredentials` bukan variabel; yang menentukan hanyalah ada/tidaknya cookie sesi di jar browser.

**E3 — request berbentuk mutasi dari CMS membawa Origin + Cookie + Bearer.** Satu-satunya request non-GET yang dikirim adalah `POST /api/auth/sign-out` (endpoint auth, dipakai untuk membersihkan sesi; tidak ada mutasi domain): Origin `http://localhost:3005`, Authorization ada, Cookie ada, Referer ada, status 200. Ini menunjukkan browser tetap mengirim Origin pada POST *same-origin*, jadi `auth.trustedOrigins` — bukan allowlist CORS — yang menjadi batas efektif B1.

**E4 — origin vs dua daftar (dibaca terpisah).**

- CORS `allowedOrigins` (`src/server.ts:46-52`): memuat `http://localhost:3005` **dan** `https://stepsmg.ac.id`; `credentials:true`; `methods` belum memuat PATCH.
- `auth.trustedOrigins` (`src/auth/index.ts:44`): memuat `http://localhost:3005`, **tidak** memuat `https://stepsmg.ac.id`.
- Konsekuensi: dev aman di kedua daftar; CMS produksi (origin `https://stepsmg.ac.id`) akan ditolak B1 pada setiap mutasi modul. Ini keputusan policy (menambah trusted origin atau menetapkan origin produksi lain), bukan sesuatu yang saya ubah.
- Request baca dev tidak pernah menyentuh CORS (same-origin, tanpa header Origin) ⇒ membuktikan "GET cocok" bukan bukti apa pun untuk mutasi.

**E5 — B1 belum diimplementasikan.** `grep "Ambiguous mutation credentials"` di `step-api-node/src` = 0 hasil; tidak ada 403 runtime untuk diamati. Semua status 200 di atas adalah perilaku API saat ini, bukan perilaku setelah B1.

## Rekomendasi (usulan untuk Mesh + dev-security, bukan keputusan)

1. **Dual verified identity — direkomendasikan.** Izinkan Cookie+Authorization pada mutasi modul hanya bila Origin trusted **dan** sesi cookie serta sesi bearer me-resolve `user.id` yang sama; selain itu 403. Alasan: bentuk mixed adalah bentuk normal klien CMS saat ini (E1–E3), jadi penolakan total berarti mengubah dua frontend; memverifikasi identitas menutup ambiguitas tanpa melonggarkan Origin dan tanpa mengubah kontrak wire.
2. **Single-credential (tolak semua mixed, sesuai teks B1 sekarang).** Butuh kerja frontend ganda: CMS harus berhenti mengirim Bearer (cookie-only) atau Better Auth berhenti menaruh cookie saat sign-in (token-only), masing-masing mengubah `auth-provider.tsx`/`api.ts` plus tes. Kompatibel hanya jika `https://stepsmg.ac.id` juga masuk trusted origin.
3. B3 (tambah `PATCH` di CORS methods tanpa origin baru) tidak berubah oleh bukti ini.

Prasyarat apa pun pilihannya: tetapkan lebih dulu origin produksi CMS yang sebenarnya dan statusnya di `auth.trustedOrigins`; jangan melebarkan allowlist agar tes lulus.

## Batas / belum dibuktikan

- Tidak mengirim mutasi domain, PATCH, preflight, atau upload; satu-satunya non-GET adalah sign-out auth.
- Tidak menguji produksi/TLS: flag `Secure`, perilaku SameSite cross-site, dan pasangan origin CMS→API produksi belum dijalankan.
- Tidak menyentuh DB, service, credential, kontrak, implementasi, atau konfigurasi Hermes; hanya listener dev yang sudah ada.
- Tidak ada data/akun mahasiswa nyata; mobile/API-02b di luar scope; `attendanceEnabled=false`; `t_d2c0f673` tetap tertahan.
- Tidak mengulang regresi sidebar/mobile.
