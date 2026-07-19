# Implementation Plan: NGN Portal Quality Improvement

## Overview

Rencana implementasi ini mencakup 18 perbaikan dan fitur baru untuk NGN Portal, dikelompokkan berdasarkan prioritas: P0 (bug keamanan kritis), P1 (bug fungsional tinggi), P2 (fitur inti baru), dan P3 (fitur peningkatan kualitas tambahan). Setiap task membangun di atas task sebelumnya dan berakhir dengan integrasi penuh ke dalam portal.

---

## Tasks

- [x] 1. Instalasi dependency baru dan konfigurasi dasar
  - Install `sanitize-html@2.13.1` dan `@types/sanitize-html@2.13.0` ke `package.json`
  - Tambah `metadataBase` ke `export const metadata` di `app/layout.tsx`
  - Tambah inline anti-FOUC `<script>` di `app/layout.tsx` sebelum `<body>` untuk membaca `localStorage` key `ngn-theme` dan menambah class `dark` ke `<html>` jika perlu
  - _Requirements: 7.1, 10.5_

- [x] 2. P0 — Perbaikan atomic view count dan rate limiting
  - [x] 2.1 Buat SQL function `increment_view_count` di Supabase dan update `incrementViewCount` di `lib/queries/articles.ts`
    - Tulis komentar SQL function yang harus dijalankan di Supabase Dashboard: `CREATE OR REPLACE FUNCTION increment_view_count(article_id bigint) RETURNS articles AS $$ UPDATE articles SET view_count = view_count + 1 WHERE id = article_id RETURNING *; $$ LANGUAGE sql;`
    - Ganti implementasi `incrementViewCount` di `lib/queries/articles.ts` agar menggunakan `supabase.rpc('increment_view_count', { article_id: id })` — satu operasi atomic tanpa read-before-write
    - Return `data ?? null` jika sukses; log error dan return `null` jika gagal
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [x] 2.2 Update `app/api/articles/[id]/view/route.ts` dengan rate limiter dan proper HTTP status codes
    - Tambah in-memory `rateLimitMap: Map<string, number>` dan fungsi `isRateLimited(ip, articleId)` dengan window 60 detik
    - Ambil IP dari header `X-Forwarded-For` (IP pertama) atau fallback `'unknown'`
    - Return HTTP 429 jika rate limited, tanpa memanggil `incrementViewCount`
    - Return HTTP 404 jika `incrementViewCount` return `null` dan artikel tidak ditemukan
    - Return HTTP 500 jika `incrementViewCount` throw error database
    - _Requirements: 1.5, 1.6, 15.1, 15.2, 15.3, 15.4, 15.5, 15.6_

  - [x] 2.3 Update `components/news/ViewCounter.tsx` dengan SessionStorage guard
    - Tambah check `sessionStorage.getItem(`viewed_article_${articleId}`)` di awal `useEffect`; return early jika key sudah ada
    - Simpan `sessionStorage.setItem(key, '1')` hanya jika `res.ok` (status < 400)
    - Jangan simpan key jika response error (status >= 400)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

- [x] 3. Checkpoint P0 — Pastikan semua tes lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 4. P0 — Keamanan layout dan sanitasi konten
  - [x] 4.1 Hapus admin links dari `components/layout/Footer.tsx` dan `components/layout/Navbar.tsx`
    - Di `Footer.tsx`: hapus semua `<Link>` dengan `href` mengandung `/admin`; ganti `href="#"` untuk "Tentang Kami" → `href="/tentang-kami"` dan "Pedoman Media Siber" → `href="/pedoman-media-siber"`
    - Di `Navbar.tsx`: hapus `<Link href="/admin">` dari mobile drawer menu
    - _Requirements: 4.1, 4.2, 16.5, 16.6_

  - [x] 4.2 Buat `lib/sanitize.ts` dengan fungsi `sanitizeArticleHtml`
    - Import `sanitize-html`; definisikan `ALLOWED_TAGS` dan `ALLOWED_ATTRIBUTES` sesuai desain
    - Konfigurasi `allowedSchemes: ['http', 'https', 'mailto']` dan `disallowedTagsMode: 'discard'`
    - Export fungsi `sanitizeArticleHtml(dirty: string): string`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8_

  - [x] 4.3 Terapkan sanitasi HTML di `app/(public)/article/[id]/[slug]/page.tsx`
    - Import `sanitizeArticleHtml` dari `@/lib/sanitize`
    - Panggil `sanitizeArticleHtml(article.content)` server-side sebelum render
    - Gunakan hasil sanitasi di `dangerouslySetInnerHTML={{ __html: safeContent }}`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7_

  - [x] 4.4 Tambah validasi dan sanitasi input pencarian di `app/(public)/search/page.tsx`
    - Trim whitespace dari `searchParams.q`; potong ke 100 karakter dengan `.slice(0, 100)`
    - Jika panjang setelah trim = 0, jangan panggil `getArticles` dan tampilkan empty state
    - Render query di UI sebagai JSX text node (bukan `dangerouslySetInnerHTML`)
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6_

- [x] 5. P1 — Perbaikan bug fungsional
  - [x] 5.1 Konsolidasi fungsi `slugify` di `app/(public)/article/[id]/[slug]/page.tsx`
    - Hapus definisi fungsi `slugify` lokal dari file
    - Tambah `import { slugify } from '@/lib/utils'`
    - Pastikan semua pemanggilan `slugify` di file tersebut menggunakan import dari `@/lib/utils`
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 5.2 Perbaiki logic bug `getArticles` dengan `categorySlug` di `lib/queries/articles.ts`
    - Refactor query menjadi single chained Supabase query builder dengan `select('*, categories!inner(name, slug)')`
    - Terapkan semua filter (`categorySlug`, `categoryId`, `search`, `order`, `limit`, `offset`) secara berurutan pada satu variabel `query` yang sama
    - Gunakan `.range(offset, offset + limit - 1)` untuk pagination
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5, 6.6_

  - [x] 5.3 Tambah `generateMetadata` di `app/(public)/article/[id]/[slug]/page.tsx`
    - Definisikan `BASE_URL` dari `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id'`
    - Return metadata dengan `title`, `description` (excerpt atau 160 char pertama konten plain), `alternates.canonical`, `openGraph` (title, description, type: 'article', url, publishedTime, authors, images jika ada), dan `twitter` (card: 'summary_large_image')
    - Return fallback `{ title: 'Artikel Tidak Ditemukan | NGN' }` jika id bukan angka atau artikel tidak ditemukan
    - _Requirements: 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8_

- [x] 6. Checkpoint P1 — Pastikan semua tes lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 7. P2 — SEO metadata untuk semua halaman publik dan JSON-LD
  - [x] 7.1 Tambah `generateMetadata` di `app/(public)/category/[slug]/page.tsx`
    - Fetch kategori berdasarkan slug; return `{ title: 'Kategori Tidak Ditemukan | NGN' }` jika tidak ada
    - Return `title: 'Berita [Nama Kategori] | NGN'`, `description` (dari `category.description` atau fallback), dan `alternates.canonical`
    - _Requirements: 9.1, 9.2, 9.8_

  - [x] 7.2 Tambah `metadata` export di `app/(public)/trending/page.tsx`
    - Export `const metadata: Metadata` dengan `title: 'Berita Trending | NGN'`, `description`, dan `alternates.canonical`
    - _Requirements: 9.3, 9.8_

  - [x] 7.3 Tambah `generateMetadata` di `app/(public)/search/page.tsx`
    - Return `title: 'Hasil Pencarian: [query] | NGN'` jika query tidak kosong, atau `'Pencarian Berita | NGN'` jika kosong
    - _Requirements: 9.4, 9.5_

  - [x] 7.4 Tambah JSON-LD NewsArticle script di `app/(public)/article/[id]/[slug]/page.tsx`
    - Buat objek `jsonLd` dengan `@type: 'NewsArticle'`, `headline`, `datePublished`, `author`, `publisher` (nama + logo), dan `image` jika ada `image_url`
    - Render `<script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />` di dalam JSX
    - _Requirements: 9.6, 9.7_

- [x] 8. P2 — Dark mode toggle
  - [x] 8.1 Buat `components/ui/DarkModeToggle.tsx` sebagai Client Component
    - Tambah `'use client'` directive
    - Gunakan `useState(false)` untuk `isDark` dan `useEffect` untuk membaca state awal dari `document.documentElement.classList`
    - Fungsi `toggle`: update state, toggle class `dark` di `<html>`, simpan ke `localStorage` key `ngn-theme`
    - Render `<button>` dengan `aria-label` dinamis dan `aria-pressed={isDark}`, tampilkan ikon `Sun` atau `Moon` dari lucide-react
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.6_

  - [x] 8.2 Integrasikan `DarkModeToggle` ke `components/layout/Navbar.tsx`
    - Import `DarkModeToggle` dari `@/components/ui/DarkModeToggle`
    - Tempatkan di area action icons Navbar
    - _Requirements: 10.1_

- [x] 9. P2 — Pagination pada halaman kategori dan trending
  - [x] 9.1 Buat komponen `components/ui/Pagination.tsx`
    - Terima props: `currentPage`, `totalPages`, `basePath` (string URL tanpa `?page=`)
    - Render tombol "Sebelumnya" (disabled jika `currentPage === 1`) dan "Berikutnya" (disabled jika `currentPage === totalPages`)
    - Gunakan `<Link>` Next.js untuk navigasi URL-based `?page=N`
    - Berikan styling visual berbeda untuk state disabled vs aktif
    - _Requirements: 11.3, 11.4, 11.7, 11.8_

  - [x] 9.2 Implementasikan pagination di `app/(public)/category/[slug]/page.tsx`
    - Baca `searchParams.page`, parse ke integer, default ke 1
    - Hitung `offset = (page - 1) * 12`; panggil `getArticles` dengan `limit: 12` dan `offset`
    - Hitung `totalPages = Math.ceil(totalArticles / 12)`; redirect ke halaman terakhir jika `page > totalPages`
    - Render komponen `Pagination` di bawah daftar artikel
    - _Requirements: 11.1, 11.5, 11.6, 11.9_

  - [x] 9.3 Implementasikan pagination di `app/(public)/trending/page.tsx`
    - Baca `searchParams.page`, parse ke integer, default ke 1
    - Hitung `offset = (page - 1) * 10`; panggil query trending dengan `limit: 10` dan `offset`
    - Hitung `totalPages = Math.ceil(totalArticles / 10)`; redirect ke halaman terakhir jika `page > totalPages`
    - Hitung `startRank = (page - 1) * 10 + 1` dan teruskan ke render artikel agar rank berlanjut antar halaman
    - Render komponen `Pagination` di bawah daftar artikel
    - _Requirements: 11.2, 11.5, 11.6, 11.9, 11.10_

- [x] 10. P2 — Social sharing dan reading time
  - [x] 10.1 Buat `components/news/ShareButtons.tsx` sebagai Client Component
    - Tambah `'use client'` directive
    - Terima props: `title: string`, `url: string`
    - Render 4 tombol: WhatsApp (`https://wa.me/?text=[encoded title+url]`), Twitter/X (`https://twitter.com/intent/tweet?text=...&url=...`), Facebook (`https://www.facebook.com/sharer/sharer.php?u=...`), dan Copy Link
    - Semua share URL menggunakan `encodeURIComponent`; buka di `target="_blank"`
    - Copy Link: gunakan `navigator.clipboard.writeText(url)`, tampilkan teks "Tersalin!" selama 2 detik lalu kembali ke teks semula (gunakan `setTimeout`)
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 12.5, 12.6, 12.7_

  - [x] 10.2 Integrasikan `ShareButtons` dan reading time di `app/(public)/article/[id]/[slug]/page.tsx`
    - Import `ShareButtons` dan render dengan `title={article.title}` dan `url` absolut artikel
    - Implementasikan logika reading time: jika `reading_time_minutes` null/0/negatif, hitung dari word count konten (strip HTML, bagi 200); format sebagai `"X menit baca"` atau `"< 1 menit baca"` jika < 1
    - _Requirements: 12.1, 12.7, 13.1, 13.2, 13.3, 13.4, 13.5_

- [x] 11. Checkpoint P2 — Pastikan semua tes lulus, tanyakan kepada user jika ada pertanyaan.

- [x] 12. P2 — Sitemap dan robots.txt
  - [x] 12.1 Buat `app/sitemap.ts` menggunakan `MetadataRoute.Sitemap`
    - Fetch semua artikel dengan `published_at` tidak null dari Supabase
    - Buat entry sitemap untuk setiap artikel dengan URL `/article/[id]/[slug]` dan `lastModified` dari `published_at`
    - Tambah entry untuk halaman statis: `/`, `/trending`, `/tentang-kami`, `/pedoman-media-siber`
    - Fetch semua kategori dan tambah entry `/category/[slug]` untuk setiap kategori
    - Jika fetch artikel gagal, return hanya URL halaman statis
    - _Requirements: 17.1, 17.2, 17.3, 17.7_

  - [x] 12.2 Buat `app/robots.ts` menggunakan `MetadataRoute.Robots`
    - Return object dengan `rules: [{ userAgent: '*', allow: '/', disallow: '/admin' }]`
    - Tambah `sitemap: '${BASE_URL}/sitemap.xml'` dengan URL absolut
    - _Requirements: 17.4, 17.5, 17.6_

- [x] 13. P3 — Halaman statis dan error boundaries
  - [x] 13.1 Buat `app/(public)/tentang-kami/page.tsx`
    - Export `metadata` dengan `title: 'Tentang Kami | NGN'` dan `description` yang relevan
    - Render konten halaman: nama portal NGN, deskripsi misi, dan informasi kontak redaksi
    - _Requirements: 16.1, 16.3, 16.7_

  - [x] 13.2 Buat `app/(public)/pedoman-media-siber/page.tsx`
    - Export `metadata` dengan `title: 'Pedoman Media Siber | NGN'` dan `description` yang relevan
    - Render konten halaman: prinsip jurnalistik, kebijakan koreksi, dan standar verifikasi berita
    - _Requirements: 16.2, 16.4, 16.8_

  - [x] 13.3 Buat `app/(public)/error.tsx` sebagai Client Component error boundary
    - Tambah `'use client'` directive
    - Terima props `error: Error & { digest?: string }` dan `reset: () => void`
    - Render fallback UI: judul error ramah pengguna, deskripsi singkat, tombol "Coba Lagi" (memanggil `reset()`), dan link "Kembali ke Beranda"
    - Log `error.message` dan `error.digest` ke console; jangan tampilkan di UI
    - _Requirements: 18.1, 18.3, 18.4, 18.5, 18.6_

  - [x] 13.4 Buat `app/(public)/article/[id]/[slug]/error.tsx` sebagai Client Component error boundary
    - Struktur identik dengan `app/(public)/error.tsx` tetapi spesifik untuk halaman artikel
    - _Requirements: 18.2, 18.3, 18.4, 18.5, 18.6_

- [x] 14. P3 — Skeleton loading di admin articles list
  - [x] 14.1 Implementasikan Skeleton UI di `app/admin/articles/page.tsx`
    - Tambah loading state (gunakan `Suspense` atau conditional render berdasarkan data fetch)
    - Buat skeleton dengan 5 baris × 8 kolom menggunakan `animate-pulse` dan `bg-secondary`
    - Lebar kolom skeleton mendekati kolom tabel asli: Foto, Judul, Kategori, Penulis, Views, Status, Tanggal, Aksi
    - Ganti skeleton dengan tabel artikel sebenarnya setelah data selesai dimuat
    - _Requirements: 14.1, 14.2, 14.3, 14.4_

- [x] 15. Final checkpoint — Semua task selesai. Seluruh 18 perbaikan dan fitur baru telah diimplementasikan.

---

## Notes

- Task yang diawali `*` bersifat opsional dan dapat dilewati untuk MVP yang lebih cepat
- Setiap task mereferensikan requirement spesifik untuk traceability
- P0 dan P1 harus diselesaikan terlebih dahulu sebelum P2 dan P3
- SQL function `increment_view_count` harus dibuat manual di Supabase Dashboard sebelum task 2.1 dapat diuji end-to-end
- `NEXT_PUBLIC_SITE_URL` harus di-set di `.env.local` untuk URL absolut yang benar di metadata dan sitemap
- Design document tidak memiliki Correctness Properties section — property-based tests tidak ditambahkan; gunakan unit tests dan integration tests biasa

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1"] },
    { "id": 1, "tasks": ["2.1", "4.2"] },
    { "id": 2, "tasks": ["2.2", "2.3", "4.1", "4.3", "4.4"] },
    { "id": 3, "tasks": ["5.1", "5.2", "5.3"] },
    { "id": 4, "tasks": ["7.1", "7.2", "7.3", "7.4", "8.1", "9.1", "10.1"] },
    { "id": 5, "tasks": ["8.2", "9.2", "9.3", "10.2"] },
    { "id": 6, "tasks": ["12.1", "12.2", "13.1", "13.2", "13.3", "13.4", "14.1"] }
  ]
}
```
