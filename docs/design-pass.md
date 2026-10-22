# Design pass modul Pengajuan & LPJ — menerapkan Design System STEP

Tujuan: modul Pengajuan & LPJ (dan halaman login serta kerangka dasbor) memakai aksen bawaan Tailwind (`indigo`), yang termasuk pola generik yang dilarang sistem desain institusi. Terapkan Design System STEP agar konsisten dengan portal kampus.

## Sumber aturan (baca lebih dulu)

1. `D:\Programming\web-step\DESIGN_SYSTEM.md` — dokumen kanonik. **Hanya dibaca**, jangan diubah.
2. `.agents/skills/design-taste-frontend/SKILL.md` dan `.agents/skills/redesign-existing-projects/SKILL.md` — ada di repo ini.

Catatan penting tentang skill: Taste Skill v2 menyatakan cakupannya *landing pages, portfolios, redesigns — **bukan** dashboard, tabel data, atau UI produk bertahap*. Modul ini adalah dashboard dan tabel. Jadi pakai aturan anti-slop serta disiplin warna/bentuk dari dokumen kanonik sebagai acuan utama, dan jangan memaksakan pola hero/section marketing ke dalam tabel atau formulir kerja.

## Token yang harus diterapkan

| Token | HEX | Penggunaan |
| --- | --- | --- |
| `navy-950` | `#0A192F` | warna brand utama |
| `navy-900` | `#0F2744` | sidebar/topbar, latar gelap |
| `navy-800` | `#1E3A5F` | kartu gelap, hover |
| `navy-700` | `#334E68` | teks sekunder |
| `navy-200` | `#BCCCDC` | border kartu |
| `navy-100` | `#D9E2EC` | divider lembut |
| `navy-50` | `#F0F4F8` | latar subtil, latar badge |
| `gold-700` | `#92400E` | teks aksen kontras tinggi |
| `gold-600` | `#B45309` | hover aksi utama |
| `gold-500` | `#D97706` | **aksen brand**: tombol utama, penanda aktif |
| `gold-200` | `#FBE0AA` | border badge |
| `gold-100` | `#FDF0D5` | highlight surface |
| `gold-50` | `#FEF9EE` | latar badge |

Token semantik: `--color-primary #0a192f`, `--color-accent #d97706`, `--color-surface #ffffff`, `--color-surface-subtle #f8fafc`, `--color-surface-border #e2e8f0`, `--color-text-main #0f172a`, `--color-text-muted #64748b`.

Repo ini memakai **Tailwind v3** (web-step memakai v4): definisikan di `tailwind.config.js` (`theme.extend.colors`, `borderRadius`) dan variabel CSS di `src/index.css`. Beri satu baris komentar bahwa sumber token adalah `web-step/DESIGN_SYSTEM.md`; jangan menyalin seluruh dokumen ke repo ini.

Tipografi: heading memakai **Playfair Display**, teks isi/tombol/label/tabel memakai **Inter**, dengan fallback sistem yang aman bila font tidak tersedia offline.

## Ukuran Kontrol, Spacing & State Interaksi (Web & Adaptasi Mobile)

Sumber implementasi: `D:/Programming/web-step/src/components/ui/{Button,Input,Card,Badge}.tsx` dan `D:/Programming/step-cms/src/pages/Login.tsx`.

### 1. Spacing & Tata Letak
- Padding halaman/layar: `16px` (`p-4`) pada layar mobile/login; `24px` (`p-6`) untuk padding dalam `Card` (`CardHeader`, `CardContent`, `CardFooter`).
- Jarak vertikal antar field form: `16px` (`space-y-4`).
- Jarak label ke input: `8px` (`space-y-2`).
- Jarak `CardTitle` ke `CardDescription`: `6px` (`gap-1.5`).
- Jarak input ke pesan error: `6px` (`mt-1.5`).
- Jarak ikon ke label di dalam tombol/input: `8px` (`gap-2`).

### 2. Ukuran Kontrol (Jangan disalin kaku di mobile; gunakan `minHeight` agar aman terhadap text scaling)
- `Button sm`: tinggi baseline `36px` (`h-9`), padding horizontal `14px` (`px-3.5`), teks `12px` (`text-xs`), radius `12px` (`rounded-lg`).
- `Button md` & `Input`: tinggi baseline `44px` (`h-11`, `px-4`/`px-5`, teks `14px`, radius `12px`); untuk mobile sentuh gunakan `minHeight: 48dp` agar ramah jari dan skala font OS.
- `Button lg` (CTA utama): tinggi baseline `52px` (`h-13`), padding horizontal `28px` (`px-7`), teks `16px` (`font-semibold`), radius `16px` (`rounded-xl`).
- `Badge`: `sm` (`py-0.5 px-2.5`, teks `10px`), `md` (`py-1 px-3`, teks `12px`), `lg` (`py-1.5 px-4`, teks `14px`), selalu `rounded-full` (`StadiumBorder`).

### 3. State Interaksi Komponen
- **Button (`Button.tsx`):**
  - `primary`: bg `#0A192F` (`navy-950`), teks `#FFFFFF`, hover/pressed `#0F2744` (`navy-900`).
  - `gold` (CTA): bg `#D97706` (`gold-500`), teks `#FFFFFF`, hover/pressed `#B45309` (`gold-600`).
  - `secondary`: bg `#F0F4F8` (`navy-50`), teks `#0A192F`, border `#D9E2EC` (`navy-100`), hover/pressed `#D9E2EC`.
  - `outline`: bg transparan, teks `#0A192F`, border `#CBD5E1` (`slate-300`); aktif/hover border `#D97706`, teks `#B45309`, bg `#FEF9EE` (`gold-50/30`).
  - `pressed / active`: skala `0.98` (`200ms`).
  - `loading / disabled`: `opacity: 0.5`, pointer nonaktif, spinner `16px-20px` di kiri label (teks submit berubah ke `"Memproses..."` seperti di `Login.tsx`).
- **Input (`Input.tsx`):**
  - `default`: bg `#FFFFFF`, teks `#0A192F`, placeholder `#94A3B8` (`slate-400`), border `1px solid #CBD5E1` (`slate-300`), radius `12px`.
  - `focused`: border `2px solid #D97706` (`gold-500`), focus ring `#D97706` opacity `20%` (`0x33D97706`).
  - `error`: border `#EF4444` (`red-500`), focus ring `0x33EF4444`, teks error `#DC2626` (`red-600`, `12px`, `w500`) di bawah field.
  - `disabled`: bg `#F8FAFC` (`slate-50`), teks `#94A3B8`.
- **Card & Alert (`Card.tsx`, `Login.tsx`):**
  - `Card`: bg `#FFFFFF`, border `1px solid #E2E8F0` (`slate-200`), radius `16px` (`rounded-xl`), shadow halus (`0 1px 2px rgba(0,0,0,0.05)`).
  - `Alert Error / Gagal`: bg `#FEF2F2` (`red-50`), teks `#DC2626` (`red-600`), padding `12px` (`p-3`), radius `8px-12px`.
  - `Alert Warning / Izin Sensor`: bg `#FEF9EE` (`gold-50`), border `#FBE0AA` (`gold-200`), teks `#92400E` (`gold-700`).

## Disiplin wajib

1. **Satu aksen**: hanya **gold** untuk tindakan utama dan penanda aktif. **Jangan menyisakan `indigo-*`, `blue-*`, `violet-*`, atau `purple-*`** sebagai warna aksi/aksen di modul ini. Navy untuk struktur dan teks.
2. **Bentuk terkunci**: `rounded-lg` untuk kontrol (tombol, input, select), `rounded-xl` untuk kontainer (card, panel, dialog), `rounded-full` **hanya** untuk badge/pill. Hapus `rounded-2xl`/`rounded-3xl` yang tidak konsisten.
3. **Larangan anti-slop**: tanpa penomoran dekoratif pada label, tanpa strip teks hias tanpa makna, tanpa titik status dekoratif tanpa fungsi, dan jangan membuat tiga kartu identik tanpa hierarki.
4. **Keterbacaan**: perbaiki teks kecil yang terlalu pucat (label, keterangan tanggal pada kartu status, catatan footernya). Ini temuan QA sebelumnya.
5. **Hierarki aksi**: pada detail pengajuan, aksi yang paling relevan dengan keadaan saat ini harus paling menonjol; jangan dua tombol berwarna kuat bersaing. Aksi destruktif/tolak tidak boleh tampil sebagai aksi utama.

## Batas pekerjaan

- **Jangan mengubah perilaku**: tidak ada perubahan pada pemanggilan API, aturan status (`getValidActions`), perhitungan uang, struktur rute, atau bentuk data. Ini pekerjaan tampilan.
- Lingkup berkas: `src/pages/pengajuan/*`, `src/pages/Login.tsx`, `src/components/layout/DashboardLayout.tsx`, `src/pages/Dashboard.tsx`, `src/index.css`, `tailwind.config.js`, dan primitif di `src/components/ui/` **bila** perubahan itu memang diperlukan untuk konsistensi.
- **Perhatian:** primitif di `src/components/ui/` dipakai juga oleh modul Berita, Event, Dosen, dan Fasilitas. Perubahan di sana berdampak ke seluruh dashboard — itu memang tujuannya, tetapi wajib diverifikasi: seluruh 60 tes harus tetap lolos dan build harus bersih. Jangan mengubah perilaku modul lain, hanya tampilannya.
- Bila tes harus menyesuaikan karena teks/kelas berubah, ubah tesnya dan **laporkan**; jangan melemahkan tes agar lolos.
- Jangan menambah dependensi baru selain paket font bila benar-benar perlu; laporkan bila menambah.
- Jangan commit, jangan push.

## Bukti yang harus dilaporkan

- Daftar berkas yang diubah dan ringkasannya.
- Hasil `npm run build`, `npm run lint`, dan `npm test` (jumlah tes sebelum dan sesudah; sebelumnya 60).
- Hasil pencarian `indigo|blue-|violet|purple` di `src/pages/pengajuan` dan `src/components/ui` sebelum dan sesudah — harus nol untuk warna aksen.
- Hambatan atau penyimpangan yang Anda temukan.
