# Frontend

Antarmuka React TypeScript untuk Aplikasi Pendaftaran Beasiswa Pelatihan.

Bagian dari **Aplikasi Pendaftaran Beasiswa Pelatihan**. Sesuai persyaratan dokumen,
frontend ini adalah **repo Git tersendiri**, bukan bagian dari satu monorepo.

|                |                                                                      |
| -------------- | -------------------------------------------------------------------- |
| Stack          | React 18 + TypeScript + Vite + React Router + TanStack Query + Axios |
| UI             | **Bootstrap 5.3** (bukan Tailwind — mengikuti mockup)                |
| Port dev       | `5173`                                                               |
| Port container | `80` (nginx)                                                         |

## Menjalankan secara lokal

```bash
cp .env.example .env
npm install
npm run dev               # http://localhost:5173
```

Dev server mem-proxy `/api` ke API Gateway di `http://localhost:8080`.

## Peta layar (CLAUDE.md §9)

| Route                              | Mockup                     | Role            |
| ---------------------------------- | -------------------------- | --------------- |
| `/`                                | `1_index.html`             | publik          |
| `/login-internal`                  | `1_index_login.html`       | internal        |
| `/pendaftaran` (wizard 4 step)     | `2_index_awal.html`        | peserta         |
| `/dashboard` status terkunci       | `3_index_terkirim.html`    | peserta         |
| `/dashboard` mode revisi           | `4_index_revisi.html`      | peserta         |
| `/dashboard` pengumuman lulus      | `6_index_lulus.html`       | peserta         |
| `/` saat tidak ada gelombang aktif | `5_index_ditutup.html`     | publik/peserta  |
| `/verifikasi`                      | `2_index_verifikator.html` | verifikator     |
| `/wawancara`                       | `3_index_wawancara.html`   | lembaga seleksi |
| `/admin`                           | `4_index_admin.html`       | admin           |

## Aturan yang mengikat frontend ini

- **Sidebar/menu dirender dari `GET /api/auth/my-menus`**, bukan array hardcoded. Kalau
  menu di-hardcode, seluruh modul RBAC jadi hiasan.
- **Dilarang `dangerouslySetInnerHTML`** (CLAUDE.md §6 aturan #6). Auto-escaping bawaan
  React adalah pertahanan XSS utama di sisi klien.
- **Access token disimpan di memori**, bukan `localStorage`. Refresh token berada di
  cookie HttpOnly yang tidak pernah bisa dibaca JavaScript.
- Dropdown "Masuk Sebagai" pada halaman login internal **murni kosmetik**; role
  sesungguhnya selalu ditentukan server dari database.
- Timestamp dari API dalam UTC, dikonversi ke WIB saat ditampilkan.
- Semua panggilan API lewat API Gateway, tidak pernah langsung ke service backend.
