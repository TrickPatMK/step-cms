# Spesifikasi Kebutuhan API Backend — Modul Absensi & Kegiatan (Konsumen CMS)

Dokumen ini disusun untuk agen backend (`step-api-node`) sebagai kontrak implementasi endpoint yang dikonsumsi oleh `step-cms` pada modul **Data Mahasiswa**, **Jadwal Kegiatan**, dan **Kebijakan Presensi**.

---

## 1. Konteks & Prinsip Autentikasi

- **Guard**: Seluruh endpoint admin di bawah ini dilindungi guard autentikasi admin (`requireAdmin` / sesi `role === 'admin'`).
- **Kredensial**: Mendukung session cookie (`better-auth`) dan/atau header `Authorization: Bearer <token>`.
- **Precedence & Mutasi**: Request mutasi (`POST`, `PATCH`, `PUT`, `DELETE`) membawa header `Origin` terpercaya. Response denial/error menyertakan `Cache-Control: no-store`.
- **Format Waktu**: Format ISO 8601 UTC dengan milidetik: `YYYY-MM-DDTHH:mm:ss.sssZ` (contoh: `2026-10-24T08:00:00.000Z`).
- **Optimistic Concurrency Control**: Mutasi pembaruan (`PATCH` dan `PUT`) wajib menyertakan `expectedVersion: number`. Jika versi di DB tidak cocok, kembalikan HTTP `409 Conflict`.

---

## 2. Ringkasan Endpoint

| No | Method | Path | Guard | Deskripsi |
|---|---|---|---|---|
| 1 | `GET` | `/api/students` | Admin | Daftar mahasiswa berhalaman (cursor-based) |
| 2 | `POST` | `/api/students` | Admin | Tambah master data mahasiswa |
| 3 | `GET` | `/api/students/:id` | Admin | Detail mahasiswa berdasarkan ID |
| 4 | `PATCH` | `/api/students/:id` | Admin | Perbarui data mahasiswa (nama, nim, active) |
| 5 | `PUT` | `/api/students/:id/account` | Admin | Hubungkan / lepaskan akun sistem ke mahasiswa |
| 6 | `GET` | `/api/activity-occurrences` | Admin | Daftar jadwal kegiatan berhalaman |
| 7 | `POST` | `/api/activity-occurrences` | Admin | Buat jadwal kegiatan baru (status: draft) |
| 8 | `GET` | `/api/activity-occurrences/:id` | Admin | Detail jadwal kegiatan berdasarkan ID |
| 9 | `PATCH` | `/api/activity-occurrences/:id` | Admin | Perbarui jadwal atau transisi status kegiatan |
| 10 | `GET` | `/api/users` | Admin | Daftar akun pengguna untuk dropdown pemetaan |
| 11 | `GET` | `/api/attendance/policy` | Admin | Ambil pengaturan kebijakan presensi & retensi foto |
| 12 | `PATCH` | `/api/attendance/policy` | Admin | Perbarui kebijakan presensi & retensi foto |

---

## 3. Rincian Endpoint Modul Mahasiswa

### 3.1. `GET /api/students`
Mengambil daftar mahasiswa dengan filter dan cursor pagination.

- **Query Parameters**:
  - `cursor` *(opsional, string)*: Token cursor untuk halaman berikutnya.
  - `limit` *(opsional, integer 1–50, default 20)*: Jumlah item per halaman.
  - `active` *(opsional, string: `"true"` \| `"false"`)*: Filter status aktif.
  - `mapped` *(opsional, string: `"true"` \| `"false"`)*: Filter status kepemilikan akun (`userId != null`).
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": "8f1d1c9e-0000-4000-8000-000000000001",
      "nim": "2024001",
      "name": "Budi Santoso",
      "active": true,
      "userId": "user-account-id-1",
      "version": 1,
      "createdAt": "2026-10-23T10:00:00.000Z",
      "updatedAt": "2026-10-23T10:00:00.000Z"
    }
  ],
  "nextCursor": "eyJ2IjoxLCJzY29wZSI6InN0dWRlbnRzIn0"
}
```
*(Bila tidak ada halaman berikutnya, `nextCursor` bernilai `null`)*.

---

### 3.2. `POST /api/students`
Mendaftarkan mahasiswa baru.

- **Request Body**:
```json
{
  "nim": "2024002",
  "name": "Siti Nurhaliza",
  "active": true
}
```
*Catatan: `active` opsional (default `true`).*
- **Response 201 Created**:
```json
{
  "data": {
    "id": "8f1d1c9e-0000-4000-8000-000000000002",
    "nim": "2024002",
    "name": "Siti Nurhaliza",
    "active": true,
    "userId": null,
    "version": 1,
    "createdAt": "2026-10-23T10:05:00.000Z",
    "updatedAt": "2026-10-23T10:05:00.000Z"
  }
}
```
- **Error**:
  - `409 Conflict`: `{ "error": { "code": "NIM_ALREADY_EXISTS", "message": "NIM sudah terdaftar." } }`

---

### 3.3. `GET /api/students/:id`
Mengambil detail satu data mahasiswa.

- **Response 200 OK**:
```json
{
  "data": {
    "id": "8f1d1c9e-0000-4000-8000-000000000001",
    "nim": "2024001",
    "name": "Budi Santoso",
    "active": true,
    "userId": "user-account-id-1",
    "version": 2,
    "createdAt": "2026-10-23T10:00:00.000Z",
    "updatedAt": "2026-10-23T10:10:00.000Z"
  }
}
```
- **Error**:
  - `404 Not Found`: `{ "error": { "code": "STUDENT_NOT_FOUND", "message": "Data mahasiswa tidak ditemukan." } }`

---

### 3.4. `PATCH /api/students/:id`
Memperbarui informasi profil atau status aktif mahasiswa.

- **Request Body**:
```json
{
  "expectedVersion": 2,
  "nim": "2024001",
  "name": "Budi Santoso, S.Kom",
  "active": true
}
```
*Catatan: Minimal salah satu field (`nim`, `name`, `active`) wajib disertakan bersama `expectedVersion`.*
- **Response 200 OK**:
```json
{
  "data": {
    "id": "8f1d1c9e-0000-4000-8000-000000000001",
    "nim": "2024001",
    "name": "Budi Santoso, S.Kom",
    "active": true,
    "userId": "user-account-id-1",
    "version": 3,
    "createdAt": "2026-10-23T10:00:00.000Z",
    "updatedAt": "2026-10-23T10:15:00.000Z"
  }
}
```
- **Error**:
  - `409 Conflict`: `{ "error": { "code": "VERSION_CONFLICT", "message": "Versi data telah berubah." } }`

---

### 3.5. `PUT /api/students/:id/account`
Menghubungkan akun sistem (`user.id`) atau memutuskan hubungan (`userId: null`).

- **Request Body**:
```json
{
  "expectedVersion": 3,
  "userId": "usr_948f72a"
}
```
*(Kirim `userId: null` untuk melepaskan pemetaan).*
- **Response 200 OK**:
```json
{
  "data": {
    "id": "8f1d1c9e-0000-4000-8000-000000000001",
    "nim": "2024001",
    "name": "Budi Santoso, S.Kom",
    "active": true,
    "userId": "usr_948f72a",
    "version": 4,
    "createdAt": "2026-10-23T10:00:00.000Z",
    "updatedAt": "2026-10-23T10:20:00.000Z"
  }
}
```
- **Error**:
  - `404 Not Found`: `{ "error": { "code": "ACCOUNT_NOT_FOUND", "message": "Akun target tidak ditemukan." } }`
  - `409 Conflict`:
    - `{ "error": { "code": "ACCOUNT_ALREADY_MAPPED", "message": "Akun sudah terhubung ke mahasiswa lain." } }`
    - `{ "error": { "code": "STUDENT_INACTIVE", "message": "Mahasiswa nonaktif tidak dapat dihubungkan ke akun baru." } }`
    - `{ "error": { "code": "VERSION_CONFLICT", "message": "Versi data telah berubah." } }`

---

## 4. Rincian Endpoint Modul Jadwal Kegiatan Presensi

### 4.1. `GET /api/activity-occurrences`
Mengambil daftar jadwal kegiatan.

- **Query Parameters**:
  - `cursor` *(opsional, string)*: Token pagination.
  - `limit` *(opsional, integer 1–50, default 20)*.
  - `status` *(opsional, `"draft"` \| `"open"` \| `"closed"`)*: Filter status kegiatan.
- **Response 200 OK**:
```json
{
  "data": [
    {
      "id": "occurrence-uuid-1",
      "title": "Ibadah Awal Semester Ganjil 2026/2027",
      "startsAt": "2026-10-24T08:00:00.000Z",
      "endsAt": "2026-10-24T10:00:00.000Z",
      "status": "draft",
      "publishedAt": null,
      "version": 1,
      "createdAt": "2026-10-23T09:00:00.000Z",
      "updatedAt": "2026-10-23T09:00:00.000Z"
    }
  ],
  "nextCursor": null
}
```

---

### 4.2. `POST /api/activity-occurrences`
Membuat jadwal kegiatan baru.

- **Request Body**:
```json
{
  "title": "Ibadah Awal Semester Ganjil 2026/2027",
  "startsAt": "2026-10-24T08:00:00.000Z",
  "endsAt": "2026-10-24T10:00:00.000Z"
}
```
*Aturan: Wajib `startsAt < endsAt`. Status awal selalu `draft`, `publishedAt: null`.*
- **Response 201 Created**:
```json
{
  "data": {
    "id": "occurrence-uuid-1",
    "title": "Ibadah Awal Semester Ganjil 2026/2027",
    "startsAt": "2026-10-24T08:00:00.000Z",
    "endsAt": "2026-10-24T10:00:00.000Z",
    "status": "draft",
    "publishedAt": null,
    "version": 1,
    "createdAt": "2026-10-23T09:00:00.000Z",
    "updatedAt": "2026-10-23T09:00:00.000Z"
  }
}
```
- **Error**:
  - `400 Bad Request`: `{ "error": { "code": "INVALID_SCHEDULE", "message": "Waktu selesai harus setelah waktu mulai." } }`

---

### 4.3. `GET /api/activity-occurrences/:id`
Mengambil detail satu jadwal kegiatan.

- **Response 200 OK**:
```json
{
  "data": {
    "id": "occurrence-uuid-1",
    "title": "Ibadah Awal Semester Ganjil 2026/2027",
    "startsAt": "2026-10-24T08:00:00.000Z",
    "endsAt": "2026-10-24T10:00:00.000Z",
    "status": "open",
    "publishedAt": "2026-10-23T11:00:00.000Z",
    "version": 2,
    "createdAt": "2026-10-23T09:00:00.000Z",
    "updatedAt": "2026-10-23T11:00:00.000Z"
  }
}
```
- **Error**:
  - `404 Not Found`: `{ "error": { "code": "OCCURRENCE_NOT_FOUND", "message": "Kegiatan tidak ditemukan." } }`

---

### 4.4. `PATCH /api/activity-occurrences/:id`
Memperbarui judul, rentang waktu, atau mengubah status kegiatan.

- **Request Body**:
```json
{
  "expectedVersion": 1,
  "status": "open"
}
```
*Aturan Transisi Status*:
- `draft` → `open`: Mempublikasikan jadwal ke mahasiswa; menetapkan `publishedAt` dengan waktu server.
- `open` → `closed`: Menutup jadwal presensi.
- Transisi tidak sah (misal `closed` → `open`, atau `closed` → `draft`) menghasilkan `409 Conflict`.
- **Response 200 OK**:
```json
{
  "data": {
    "id": "occurrence-uuid-1",
    "title": "Ibadah Awal Semester Ganjil 2026/2027",
    "startsAt": "2026-10-24T08:00:00.000Z",
    "endsAt": "2026-10-24T10:00:00.000Z",
    "status": "open",
    "publishedAt": "2026-10-23T11:00:00.000Z",
    "version": 2,
    "createdAt": "2026-10-23T09:00:00.000Z",
    "updatedAt": "2026-10-23T11:00:00.000Z"
  }
}
```
- **Error**:
  - `409 Conflict`:
    - `{ "error": { "code": "INVALID_TRANSITION", "message": "Transisi status kegiatan tidak sah." } }`
    - `{ "error": { "code": "VERSION_CONFLICT", "message": "Versi data telah berubah." } }`

---

## 5. Sumber Data Pengguna Pemetaan

### 5.1. `GET /api/users`
Digunakan oleh antarmuka CMS untuk menampilkan pilihan akun sistem saat memetakan mahasiswa.

- **Response 200 OK**:
```json
[
  {
    "id": "usr_948f72a",
    "name": "Budi Santoso",
    "email": "budi@stepsmg.ac.id",
    "role": "user"
  }
]
```

---

## 6. Kebijakan Presensi & Retensi Foto *(Sesuai Dokumen Kebutuhan)*

### 6.1. `GET /api/attendance/policy`
Mengambil preferensi verifikasi foto dan masa retensi file foto presensi.

- **Response 200 OK**:
```json
{
  "data": {
    "mode": "both",
    "photoRetentionDays": 30
  }
}
```
*Keterangan mode*: `"auto"` (verifikasi AI/server saja), `"manual"` (review manual admin saja), `"both"` (verifikasi otomatis dengan review manual).

### 6.2. `PATCH /api/attendance/policy`
Menyesuaikan mode dan durasi retensi foto dari dashboard CMS.

- **Request Body**:
```json
{
  "mode": "both",
  "photoRetentionDays": 30
}
```
- **Response 200 OK**: `{ "data": { "mode": "both", "photoRetentionDays": 30 } }`

---

## 7. Format Standar Error Response

Semua kegagalan level domain menggunakan format JSON konsisten:

```json
{
  "error": {
    "code": "NAMA_KODE_ERROR",
    "message": "Pesan deskriptif yang mudah dipahami"
  }
}
```

Daftar kode error:
- `VERSION_CONFLICT` (HTTP 409): Versi optimistic locking tidak cocok.
- `NIM_ALREADY_EXISTS` (HTTP 409): NIM mahasiswa sudah terdaftar.
- `ACCOUNT_ALREADY_MAPPED` (HTTP 409): Akun target sudah dihubungkan ke mahasiswa lain.
- `STUDENT_INACTIVE` (HTTP 409): Operasi pemetaan tidak diizinkan pada mahasiswa nonaktif.
- `INVALID_TRANSITION` (HTTP 409): Transisi status kegiatan melanggar siklus draft -> open -> closed.
- `INVALID_SCHEDULE` (HTTP 400): startsAt >= endsAt.
- `INVALID_CURSOR` (HTTP 400): Token pagination tidak valid.
- `STUDENT_NOT_FOUND` (HTTP 404): Mahasiswa tidak ditemukan.
- `OCCURRENCE_NOT_FOUND` (HTTP 404): Kegiatan tidak ditemukan.
- `ACCOUNT_NOT_FOUND` (HTTP 404): Akun user target tidak ditemukan.
