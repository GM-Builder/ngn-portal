# Requirements Document

## Introduction

Dokumen ini mendefinisikan persyaratan untuk peningkatan kualitas NGN Portal agar setara dengan portal berita kelas dunia seperti CNN dan BBC. Cakupan pekerjaan terbagi menjadi dua kategori: (1) perbaikan bug kritis yang ditemukan melalui audit kode, dan (2) penambahan fitur baru yang diperlukan untuk meningkatkan kualitas editorial, keamanan, SEO, dan pengalaman pengguna.

NGN Portal dibangun di atas Next.js 16, Supabase, dan Tailwind CSS v4. Semua perbaikan dan fitur baru harus mengikuti konvensi dan arsitektur yang sudah ada.

**Prioritas:**
- **P0 (Kritis):** Bug keamanan yang harus segera diperbaiki
- **P1 (Tinggi):** Bug fungsional yang mempengaruhi keakuratan data
- **P2 (Sedang):** Fitur inti untuk kesetaraan dengan portal berita populer
- **P3 (Rendah):** Fitur peningkatan kualitas tambahan

---

## Glossary

- **Portal:** Aplikasi web NGN Portal yang dibangun dengan Next.js 16
- **Article_Page:** Halaman detail artikel di route `/article/[id]/[slug]`
- **ViewCounter:** Komponen React client-side di `components/news/ViewCounter.tsx`
- **View_API:** API route di `/api/articles/[id]/view` yang menerima POST request untuk menambah view count
- **incrementViewCount:** Fungsi di `lib/queries/articles.ts` yang melakukan operasi penambahan view count ke database
- **getArticles:** Fungsi di `lib/queries/articles.ts` yang mengambil daftar artikel dengan berbagai filter
- **Supabase_RPC:** Mekanisme Remote Procedure Call di Supabase untuk menjalankan fungsi SQL secara atomic
- **Navbar:** Komponen navigasi utama di `components/layout/Navbar.tsx`
- **Footer:** Komponen footer di `components/layout/Footer.tsx`
- **Search_Page:** Halaman pencarian di route `/search`
- **Category_Page:** Halaman daftar artikel per kategori di route `/category/[slug]`
- **Trending_Page:** Halaman artikel trending di route `/trending`
- **Admin_Panel:** Area administrasi di route `/admin` yang dilindungi autentikasi
- **generateMetadata:** Fungsi Next.js App Router untuk menghasilkan metadata halaman secara dinamis
- **sanitize-html:** Library Node.js untuk sanitasi HTML di sisi server
- **SessionStorage:** Web Storage API yang menyimpan data per sesi browser (lifetime = tab)
- **Rate_Limiter:** Mekanisme pembatasan jumlah request dalam periode waktu tertentu
- **Slugify:** Fungsi utilitas di `lib/utils.ts` yang mengubah teks menjadi format URL-friendly
- **JSON-LD:** Format data terstruktur berbasis JSON untuk schema markup mesin pencari
- **NewsArticle_Schema:** Schema.org markup untuk artikel berita yang dikenali Google News
- **Open_Graph:** Protokol metadata untuk pratinjau konten saat dibagikan di media sosial
- **Twitter_Card:** Metadata khusus Twitter/X untuk pratinjau konten
- **Sitemap:** File XML yang mendaftarkan semua URL publik portal untuk mesin pencari
- **Error_Boundary:** Mekanisme React untuk menangkap error runtime di komponen anak
- **Skeleton_UI:** Placeholder animasi yang ditampilkan saat konten sedang dimuat
- **Dark_Mode:** Tema tampilan gelap yang dapat diaktifkan pengguna

---

## Requirements


### Requirement 1: Perbaikan Race Condition pada View Count [P0]

**User Story:** Sebagai pengelola portal, saya ingin view count artikel akurat, sehingga data analitik yang ditampilkan dapat dipercaya dan tidak kehilangan increment akibat concurrent requests.

#### Acceptance Criteria

1. WHEN dua atau lebih pengguna membuka artikel yang sama secara bersamaan, THE incrementViewCount SHALL menambah `view_count` sebesar satu untuk setiap pengguna tanpa kehilangan satu pun increment.
2. THE incrementViewCount SHALL melakukan tepat satu operasi tulis atomic ke database per request, tanpa membaca nilai `view_count` terlebih dahulu sebelum menulis.
3. WHEN Supabase RPC untuk atomic increment berhasil dipanggil, THE incrementViewCount SHALL mengembalikan data artikel yang telah diperbarui.
4. WHEN Supabase RPC untuk atomic increment gagal karena error database, THE incrementViewCount SHALL mengembalikan null dan mencatat error ke console.
5. WHEN View_API menerima request untuk artikel yang tidak ditemukan di database, THE View_API SHALL mengembalikan HTTP status 404.
6. WHEN View_API menerima request dan `incrementViewCount` mengembalikan null karena error database, THE View_API SHALL mengembalikan HTTP status 500.

---

### Requirement 2: Pencegahan Double-Count pada ViewCounter [P0]

**User Story:** Sebagai pengelola portal, saya ingin setiap kunjungan unik dihitung sekali per sesi tab browser, sehingga view count tidak menggelembung akibat React re-render atau refresh halaman.

#### Acceptance Criteria

1. WHEN pengguna membuka halaman artikel untuk pertama kali dalam satu sesi tab browser, THE ViewCounter SHALL memanggil View_API tepat satu kali.
2. WHEN komponen ViewCounter di-mount ulang dalam sesi tab yang sama (misalnya akibat React Strict Mode atau hot reload), THE ViewCounter SHALL tidak memanggil View_API lebih dari satu kali untuk artikel yang sama.
3. WHEN pengguna me-refresh halaman artikel dalam sesi tab browser yang sama, THE ViewCounter SHALL tidak memanggil View_API kembali untuk artikel yang sama.
4. THE ViewCounter SHALL menggunakan SessionStorage sebagai guard untuk mencegah double-counting; key yang digunakan adalah `viewed_article_{articleId}` dan value yang disimpan adalah string `"1"`.
5. WHEN pengguna membuka artikel yang berbeda dalam sesi tab yang sama dan artikel tersebut belum pernah dilihat dalam sesi ini, THE ViewCounter SHALL memanggil View_API untuk artikel tersebut.
6. WHEN pengguna membuka artikel yang sudah pernah dilihat dalam sesi tab yang sama, THE ViewCounter SHALL tidak memanggil View_API kembali untuk artikel tersebut.
7. WHEN View_API mengembalikan response error (status >= 400), THE ViewCounter SHALL tidak menyimpan key ke SessionStorage sehingga retry diizinkan pada mount berikutnya.

---

### Requirement 3: Konsolidasi Fungsi Slugify [P1]

**User Story:** Sebagai developer, saya ingin hanya ada satu implementasi fungsi `slugify` di seluruh codebase, sehingga tidak ada risiko inkonsistensi perilaku antara halaman yang berbeda.

#### Acceptance Criteria

1. THE Article_Page SHALL mengimpor fungsi `slugify` dari `@/lib/utils` dan tidak mendefinisikan fungsi `slugify` lokal di dalam file yang sama.
2. WHEN `slugify` dari `@/lib/utils` dipanggil dengan string yang mengandung huruf kapital, THE Slugify SHALL mengembalikan string yang seluruhnya huruf kecil.
3. WHEN `slugify` dari `@/lib/utils` dipanggil dengan string yang mengandung spasi, THE Slugify SHALL mengganti setiap spasi (atau rangkaian spasi) dengan satu karakter `-`.
4. WHEN `slugify` dari `@/lib/utils` dipanggil dengan string yang mengandung karakter non-alphanumeric selain `-`, THE Slugify SHALL menghapus karakter tersebut dari output.
5. WHEN `slugify` dari `@/lib/utils` dipanggil dengan string yang diawali atau diakhiri dengan `-`, THE Slugify SHALL menghapus `-` tersebut dari awal dan akhir output.

---

### Requirement 4: Penyembunyian Link Admin dari Tampilan Publik [P0]

**User Story:** Sebagai pengelola keamanan portal, saya ingin link ke Admin_Panel tidak terlihat oleh pengunjung publik, sehingga jalur admin tidak terekspos kepada pihak yang tidak berwenang.

#### Acceptance Criteria

1. IF halaman Footer dirender, THEN elemen HTML dengan `href` yang mengandung `/admin` SHALL tidak ada di dalam DOM yang dikirim ke browser, baik di bagian navigasi maupun di bagian copyright bar.
2. IF halaman Navbar dirender, THEN elemen HTML dengan `href` yang mengandung `/admin` SHALL tidak ada di dalam DOM mobile menu yang dikirim ke browser.
3. IF pengguna yang tidak terautentikasi mengakses route yang dimulai dengan `/admin` (kecuali `/admin/login`), THEN Portal SHALL mengembalikan redirect HTTP ke `/admin/login`.
4. IF pengguna yang terautentikasi mengakses `/admin/login`, THEN Portal SHALL mengembalikan redirect HTTP ke `/admin`.

---

### Requirement 5: Validasi dan Sanitasi Input Pencarian [P0]

**User Story:** Sebagai pengguna portal, saya ingin pencarian bekerja dengan aman, sehingga input berbahaya tidak dapat merusak tampilan atau mengeksploitasi database.

#### Acceptance Criteria

1. WHEN Search_Page menerima parameter `q` dari URL, THE Search_Page SHALL melakukan trim whitespace di awal dan akhir sebelum memproses query tersebut.
2. IF panjang query setelah trim melebihi 100 karakter, THEN Search_Page SHALL memotong query menjadi tepat 100 karakter sebelum diteruskan ke `getArticles`.
3. THE Search_Page SHALL meneruskan query yang sudah di-trim dan dipotong ke `getArticles`, bukan nilai mentah dari URL parameter.
4. IF panjang query setelah trim adalah antara 1 dan 100 karakter (inklusif), THEN query yang diteruskan ke `getArticles` SHALL identik dengan query setelah trim tanpa modifikasi lebih lanjut.
5. IF panjang query setelah trim adalah 0 (string kosong atau hanya whitespace), THEN Search_Page SHALL tidak memanggil `getArticles` dan menampilkan state kosong.
6. WHEN query ditampilkan kembali di UI (misalnya dalam teks "Hasil pencarian untuk: ..."), THE Search_Page SHALL merender query sebagai teks biasa, bukan sebagai HTML, sehingga karakter seperti `<`, `>`, dan `"` ditampilkan secara literal.

---

### Requirement 6: Perbaikan Logic Bug pada getArticles dengan categorySlug [P1]

**User Story:** Sebagai developer, saya ingin semua filter pada `getArticles` diterapkan secara bersamaan, sehingga kombinasi filter seperti `categorySlug` + `search` + `limit` + `offset` menghasilkan hasil yang benar.

#### Acceptance Criteria

1. WHEN `getArticles` dipanggil dengan `categorySlug` dan `search` secara bersamaan, THE getArticles SHALL mengembalikan hanya artikel yang memenuhi kedua kondisi: kategori cocok DAN judul/konten mengandung kata kunci pencarian.
2. WHEN `getArticles` dipanggil dengan `categorySlug` dan `limit`, THE getArticles SHALL mengembalikan maksimal sejumlah `limit` artikel dari kategori tersebut, diurutkan berdasarkan `published_at` descending.
3. WHEN `getArticles` dipanggil dengan `categorySlug` dan `offset`, THE getArticles SHALL melewati sejumlah `offset` artikel pertama dari kategori tersebut dan mengembalikan artikel berikutnya, diurutkan berdasarkan `published_at` descending.
4. WHEN `getArticles` dipanggil dengan `categorySlug`, `search`, `limit`, dan `offset` secara bersamaan, THE getArticles SHALL menerapkan semua filter tersebut pada satu query database yang sama.
5. IF `categorySlug` yang diberikan tidak cocok dengan kategori manapun di database, THEN `getArticles` SHALL mengembalikan array kosong.
6. IF `offset` yang diberikan melebihi jumlah total artikel yang memenuhi filter, THEN `getArticles` SHALL mengembalikan array kosong.

---

### Requirement 7: Sanitasi HTML Konten Artikel [P0]

**User Story:** Sebagai pembaca portal, saya ingin konten artikel ditampilkan dengan aman, sehingga script berbahaya yang mungkin tersimpan di database tidak dapat dieksekusi di browser saya.

#### Acceptance Criteria

1. WHEN konten artikel dari database akan dirender di Article_Page, THE Article_Page SHALL mensanitasi HTML konten di sisi server sebelum diteruskan ke render.
2. WHEN konten artikel mengandung tag `<script>`, THE sanitasi SHALL menghapus tag tersebut beserta seluruh isinya dari output.
3. WHEN konten artikel mengandung atribut event handler (semua atribut yang dimulai dengan `on`, seperti `onerror`, `onclick`, `onload`, `onmouseover`), THE sanitasi SHALL menghapus atribut tersebut dari semua elemen HTML.
4. WHEN konten artikel mengandung tag `<iframe>` atau `<object>`, THE sanitasi SHALL menghapus tag tersebut beserta seluruh isinya dari output.
5. WHEN konten artikel mengandung atribut `href` atau `src` dengan nilai yang dimulai dengan `javascript:`, THE sanitasi SHALL menghapus atribut tersebut dari output.
6. THE sanitasi SHALL mengizinkan tag HTML berikut dan atribut standarnya: `p`, `br`, `strong`, `em`, `u`, `s`, `h1`, `h2`, `h3`, `h4`, `h5`, `h6`, `ul`, `ol`, `li`, `blockquote`, `a` (dengan `href`, `target`, `rel`), `img` (dengan `src`, `alt`, `width`, `height`), `table`, `thead`, `tbody`, `tr`, `th`, `td`, `mark`, `code`, `pre`.
7. IF konten artikel mengandung payload XSS seperti `<script>alert(1)</script>`, `<img onerror="alert(1)">`, atau `<a href="javascript:alert(1)">`, THEN output setelah sanitasi SHALL tidak mengandung elemen atau atribut yang dapat mengeksekusi JavaScript.
8. THE sanitasi SHALL bersifat idempotent: memanggil sanitasi dua kali pada input yang sama SHALL menghasilkan output yang identik dengan memanggil sanitasi satu kali.


### Requirement 8: Metadata Dinamis per Halaman Artikel [P1]

**User Story:** Sebagai pengelola SEO portal, saya ingin setiap halaman artikel memiliki metadata yang unik dan relevan, sehingga artikel dapat ditemukan dan ditampilkan dengan baik di mesin pencari dan media sosial.

#### Acceptance Criteria

1. WHEN browser meminta halaman artikel yang valid, THE Article_Page SHALL mengembalikan tag `<title>` dengan format `[Judul Artikel] | NGN` di dalam `<head>`.
2. WHEN browser meminta halaman artikel yang valid, THE Article_Page SHALL mengembalikan tag `<meta name="description">` dengan nilai yang diambil dari `excerpt` artikel.
3. IF artikel tidak memiliki `excerpt` (null atau kosong), THEN `description` metadata SHALL menggunakan 160 karakter pertama dari konten artikel (setelah tag HTML dihapus).
4. WHEN browser meminta halaman artikel yang memiliki `image_url`, THE Article_Page SHALL mengembalikan tag `<meta property="og:image">` dengan nilai `image_url` tersebut.
5. IF artikel tidak memiliki `image_url`, THEN tag `og:image` SHALL dihilangkan dari metadata (tidak dirender dengan nilai kosong).
6. THE Article_Page SHALL mengembalikan tag Open Graph berikut: `og:title` (judul artikel), `og:description` (excerpt atau fallback), `og:type` (nilai: `article`), `og:url` (URL absolut format `https://[domain]/article/[id]/[slug]`).
7. THE Article_Page SHALL mengembalikan tag Twitter Card berikut: `twitter:card` (nilai: `summary_large_image`), `twitter:title` (judul artikel), `twitter:description` (excerpt atau fallback), `twitter:image` (image_url jika ada).
8. IF `id` dari params bukan angka valid atau artikel tidak ditemukan di database, THEN `generateMetadata` SHALL mengembalikan metadata default dengan title `"Artikel Tidak Ditemukan | NGN"`.

---

### Requirement 9: SEO Metadata Dinamis untuk Semua Halaman Publik [P2]

**User Story:** Sebagai pengelola SEO portal, saya ingin semua halaman publik memiliki metadata yang relevan dan unik, sehingga setiap halaman dapat diindeks dengan baik oleh mesin pencari.

#### Acceptance Criteria

1. WHEN browser meminta halaman kategori yang valid, THE Category_Page SHALL mengembalikan tag `<title>` dengan format `Berita [Nama Kategori] | NGN` dan tag `<meta name="description">` yang menyebutkan nama kategori tersebut.
2. IF kategori memiliki `description`, THEN `meta description` Category_Page SHALL menggunakan nilai `description` kategori tersebut. IF kategori tidak memiliki `description`, THEN `meta description` SHALL menggunakan teks fallback yang menyebutkan nama kategori.
3. THE Trending_Page SHALL memiliki tag `<title>` dengan nilai `Berita Trending | NGN` dan tag `<meta name="description">` yang mendeskripsikan halaman trending.
4. WHEN browser meminta Search_Page dengan parameter `q` yang tidak kosong, THE Search_Page SHALL mengembalikan tag `<title>` dengan format `Hasil Pencarian: [query] | NGN`.
5. WHEN browser meminta Search_Page tanpa parameter `q`, THE Search_Page SHALL mengembalikan tag `<title>` dengan nilai `Pencarian Berita | NGN`.
6. THE Article_Page SHALL menyertakan elemen `<script type="application/ld+json">` yang mengandung JSON-LD dengan `@type: "NewsArticle"`, field `headline` (judul), `datePublished` (published_at dalam format ISO 8601), `author` (nama penulis), dan `publisher` (nama dan logo NGN).
7. IF artikel memiliki `image_url`, THEN JSON-LD SHALL menyertakan field `image` dengan nilai `image_url` tersebut.
8. WHEN `generateMetadata` dipanggil untuk halaman yang valid, THE Portal SHALL menghasilkan tag `<link rel="canonical">` dengan URL absolut halaman tersebut (format `https://[domain]/[path]`).

---

### Requirement 10: Dark Mode Toggle [P2]

**User Story:** Sebagai pengguna portal, saya ingin dapat beralih antara tema terang dan gelap, sehingga saya dapat membaca berita dengan nyaman sesuai preferensi dan kondisi pencahayaan.

#### Acceptance Criteria

1. THE Navbar SHALL menampilkan tombol toggle Dark_Mode yang memiliki `aria-label` yang mendeskripsikan aksi saat ini (contoh: "Aktifkan mode gelap" atau "Aktifkan mode terang") dan atribut `aria-pressed` yang mencerminkan state aktif.
2. WHEN pengguna mengklik tombol toggle Dark_Mode saat tema terang aktif, THE Portal SHALL beralih ke tema gelap dan ikon tombol SHALL berubah untuk mencerminkan state baru.
3. WHEN pengguna mengklik tombol toggle Dark_Mode saat tema gelap aktif, THE Portal SHALL beralih ke tema terang dan ikon tombol SHALL berubah untuk mencerminkan state baru.
4. WHEN pengguna mengklik tombol toggle, THE Portal SHALL menyimpan preferensi tema ke `localStorage`.
5. WHEN halaman dimuat ulang, THE Portal SHALL membaca preferensi dari `localStorage` dan menerapkan tema tersebut sebelum konten halaman dirender, sehingga tidak ada flash of unstyled content.
6. WHEN pengguna mengunjungi portal untuk pertama kali (tidak ada preferensi tersimpan), THE Portal SHALL menggunakan tema terang sebagai default.

---

### Requirement 11: Pagination pada Halaman Kategori dan Trending [P2]

**User Story:** Sebagai pembaca portal, saya ingin dapat melihat semua artikel dalam suatu kategori atau daftar trending, sehingga saya tidak terbatas hanya pada 12 artikel pertama.

#### Acceptance Criteria

1. THE Category_Page SHALL menampilkan maksimal 12 artikel per halaman secara default.
2. THE Trending_Page SHALL menampilkan maksimal 10 artikel per halaman secara default.
3. WHEN total artikel yang tersedia melebihi page size, THE Portal SHALL menampilkan komponen navigasi pagination dengan tombol "Sebelumnya" dan "Berikutnya".
4. WHEN pengguna mengklik tombol "Berikutnya", THE Portal SHALL memperbarui URL dengan parameter `?page=N` (N adalah nomor halaman berikutnya) dan menampilkan artikel yang sesuai.
5. THE jumlah halaman yang tersedia SHALL sama dengan `Math.ceil(totalArticles / pageSize)`.
6. THE kumpulan artikel di halaman ke-i dan halaman ke-j (i ≠ j) SHALL tidak memiliki artikel yang sama (tidak ada duplikasi antar halaman).
7. WHEN pengguna berada di halaman pertama (page=1), THE tombol "Sebelumnya" SHALL ditampilkan dalam state non-interaktif (disabled) dan secara visual berbeda dari tombol aktif.
8. WHEN pengguna berada di halaman terakhir, THE tombol "Berikutnya" SHALL ditampilkan dalam state non-interaktif (disabled) dan secara visual berbeda dari tombol aktif.
9. IF parameter `page` di URL melebihi jumlah halaman yang tersedia, THEN Portal SHALL redirect ke halaman terakhir yang valid.
10. WHEN pengguna berpindah halaman di Trending_Page, THE nomor rank artikel SHALL berlanjut dari halaman sebelumnya (contoh: halaman 2 dimulai dari rank 11, bukan rank 1).

---

### Requirement 12: Fitur Social Sharing Artikel [P2]

**User Story:** Sebagai pembaca portal, saya ingin dapat membagikan artikel ke media sosial atau menyalin link artikel, sehingga saya dapat dengan mudah berbagi berita yang menarik kepada orang lain.

#### Acceptance Criteria

1. THE Article_Page SHALL menampilkan tombol share untuk platform: WhatsApp, Twitter/X, Facebook, dan salin link (copy link).
2. WHEN pengguna mengklik tombol share WhatsApp, THE Portal SHALL membuka URL `https://wa.me/?text=[judul]%20[URL]` di tab baru, dengan judul dan URL artikel yang sudah di-encode menggunakan `encodeURIComponent`.
3. WHEN pengguna mengklik tombol share Twitter/X, THE Portal SHALL membuka URL `https://twitter.com/intent/tweet?text=[judul]&url=[URL]` di tab baru, dengan parameter yang sudah di-encode menggunakan `encodeURIComponent`.
4. WHEN pengguna mengklik tombol share Facebook, THE Portal SHALL membuka URL `https://www.facebook.com/sharer/sharer.php?u=[URL]` di tab baru, dengan URL yang sudah di-encode menggunakan `encodeURIComponent`.
5. WHEN pengguna mengklik tombol salin link dan operasi clipboard berhasil, THE Portal SHALL menampilkan konfirmasi visual (teks tombol berubah menjadi "Tersalin!") selama minimal 2 detik, kemudian kembali ke teks semula.
6. IF operasi clipboard gagal karena pembatasan keamanan browser, THEN Portal SHALL tetap menampilkan konfirmasi visual yang sama selama minimal 2 detik.
7. WHEN URL artikel dibuat untuk share, THE Portal SHALL menggunakan URL absolut (format `https://[domain]/article/[id]/[slug]`), bukan URL relatif.

---

### Requirement 13: Estimasi Reading Time yang Akurat [P2]

**User Story:** Sebagai pembaca portal, saya ingin selalu melihat estimasi waktu baca yang masuk akal untuk setiap artikel, sehingga saya dapat memutuskan apakah saya memiliki waktu untuk membaca artikel tersebut.

#### Acceptance Criteria

1. IF `reading_time_minutes` artikel bernilai `null`, `undefined`, `0`, atau negatif, THEN Article_Page SHALL menghitung estimasi waktu baca dari jumlah kata dalam konten artikel (setelah tag HTML dihapus) dengan asumsi 200 kata per menit, dan menampilkan hasilnya dalam format `"X menit baca"`.
2. IF `reading_time_minutes` artikel bernilai positif, THEN Article_Page SHALL menampilkan nilai tersebut dalam format `"X menit baca"`.
3. IF estimasi waktu baca yang dihitung dari konten menghasilkan nilai kurang dari 1 menit, THEN Article_Page SHALL menampilkan `"< 1 menit baca"`.
4. IF `reading_time_minutes` bernilai null, 0, atau negatif, THEN output yang ditampilkan SHALL selalu berupa string yang valid dan tidak kosong (tidak pernah menampilkan "0 menit baca", "null menit baca", atau string kosong).
5. IF artikel memiliki konten yang tidak kosong, THEN estimasi waktu baca yang ditampilkan SHALL selalu berupa nilai positif atau string `"< 1 menit baca"`.


### Requirement 14: Skeleton Loading States [P3]

**User Story:** Sebagai pengguna portal, saya ingin melihat placeholder animasi saat konten sedang dimuat, sehingga pengalaman menunggu terasa lebih responsif dan tidak membingungkan.

#### Acceptance Criteria

1. WHILE data artikel sedang diambil dari server di halaman admin articles list, THE Portal SHALL menampilkan komponen Skeleton_UI sebagai pengganti tabel artikel.
2. THE Skeleton_UI SHALL menampilkan 5 baris skeleton dengan 8 kolom yang lebarnya mendekati kolom tabel asli (Foto, Judul, Kategori, Penulis, Views, Status, Tanggal, Aksi).
3. WHEN data selesai dimuat, THE Portal SHALL mengganti Skeleton_UI dengan tabel artikel yang sebenarnya tanpa perubahan lebar kolom atau tinggi baris yang signifikan.
4. THE Skeleton_UI SHALL menggunakan class `animate-pulse` dari Tailwind CSS dan warna `bg-secondary` yang konsisten dengan design system portal.

---

### Requirement 15: Rate Limiting pada View Count API [P1]

**User Story:** Sebagai pengelola portal, saya ingin View_API dilindungi dari penyalahgunaan, sehingga view count tidak dapat dimanipulasi secara artifisial oleh bot atau script.

#### Acceptance Criteria

1. THE View_API SHALL membatasi request dari satu IP address menjadi maksimal 1 request per artikel per window 60 detik.
2. WHEN sebuah IP address mengirim request ke View_API untuk artikel yang sama dalam window 60 detik setelah request pertama yang berhasil, THE View_API SHALL mengembalikan HTTP status 429 tanpa menambah view count.
3. WHEN sebuah IP address mengirim request ke View_API untuk artikel yang berbeda, THE View_API SHALL memproses request tersebut secara normal, tidak terpengaruh oleh rate limit artikel lain.
4. WHEN N request dikirim dari IP yang sama ke artikel yang sama dalam satu window 60 detik, view_count artikel tersebut SHALL bertambah tepat 1 (hanya dari request pertama yang berhasil).
5. WHEN window 60 detik telah berlalu sejak request pertama, THE View_API SHALL mengizinkan request berikutnya dari IP yang sama untuk artikel yang sama.
6. THE View_API SHALL mengidentifikasi IP address menggunakan header `X-Forwarded-For` (jika ada) atau `request.ip` sebagai fallback, dan menyimpan state rate limit dalam struktur data in-memory dengan TTL 60 detik.

---

### Requirement 16: Halaman Statis "Tentang Kami" dan "Pedoman Media Siber" [P3]

**User Story:** Sebagai pengunjung portal, saya ingin dapat mengakses halaman informasi tentang portal dan pedoman editorial, sehingga saya dapat memahami identitas dan standar jurnalistik NGN.

#### Acceptance Criteria

1. WHEN pengunjung mengakses route `/tentang-kami`, THE Portal SHALL mengembalikan halaman dengan HTTP status 200.
2. WHEN pengunjung mengakses route `/pedoman-media-siber`, THE Portal SHALL mengembalikan halaman dengan HTTP status 200.
3. THE halaman `/tentang-kami` SHALL mengandung minimal: nama portal (NGN), deskripsi misi portal, dan informasi kontak redaksi.
4. THE halaman `/pedoman-media-siber` SHALL mengandung minimal: prinsip jurnalistik yang dianut, kebijakan koreksi, dan standar verifikasi berita.
5. THE Footer SHALL menampilkan link "Tentang Kami" dengan `href="/tentang-kami"` (bukan `href="#"`).
6. THE Footer SHALL menampilkan link "Pedoman Media Siber" dengan `href="/pedoman-media-siber"` (bukan `href="#"`).
7. THE halaman `/tentang-kami` SHALL memiliki tag `<title>` dengan format `Tentang Kami | NGN` dan tag `<meta name="description">` yang relevan.
8. THE halaman `/pedoman-media-siber` SHALL memiliki tag `<title>` dengan format `Pedoman Media Siber | NGN` dan tag `<meta name="description">` yang relevan.

---

### Requirement 17: Sitemap.xml dan robots.txt [P2]

**User Story:** Sebagai pengelola SEO portal, saya ingin portal memiliki sitemap dan robots.txt yang valid, sehingga mesin pencari dapat mengindeks semua konten portal secara efisien.

#### Acceptance Criteria

1. WHEN mesin pencari meminta `/sitemap.xml`, THE Portal SHALL mengembalikan dokumen XML yang valid berisi daftar URL.
2. WHEN sitemap dihasilkan, THE Portal SHALL menyertakan URL untuk setiap artikel yang memiliki nilai `published_at` tidak null, dengan format URL `/article/[id]/[slug]` dan nilai `lastmod` berdasarkan `published_at` artikel dalam format ISO 8601.
3. WHEN sitemap dihasilkan, THE Portal SHALL menyertakan URL untuk halaman statis berikut: `/` (beranda), `/trending`, `/tentang-kami`, `/pedoman-media-siber`, dan semua halaman kategori `/category/[slug]`.
4. WHEN mesin pencari meminta `/robots.txt`, THE Portal SHALL mengembalikan file teks yang valid.
5. THE `robots.txt` SHALL mengandung directive `Allow: /` untuk mengizinkan semua crawler dan directive `Disallow: /admin` untuk melarang akses ke area admin.
6. THE `robots.txt` SHALL mengandung directive `Sitemap:` yang mengarah ke URL absolut sitemap (format `https://[domain]/sitemap.xml`).
7. IF terjadi error saat mengambil data artikel untuk sitemap, THEN sitemap SHALL tetap mengembalikan URL halaman statis tanpa URL artikel.

---

### Requirement 18: Error Boundary dan Better Error States [P3]

**User Story:** Sebagai pengguna portal, saya ingin melihat pesan error yang informatif ketika terjadi kesalahan, sehingga saya tidak melihat halaman kosong atau crash yang membingungkan.

#### Acceptance Criteria

1. THE Portal SHALL menyediakan file `error.tsx` dengan directive `'use client'` di route segment `app/(public)/` untuk menangkap runtime error di semua halaman publik.
2. THE Portal SHALL menyediakan file `error.tsx` dengan directive `'use client'` di route segment `app/(public)/article/[id]/[slug]/` untuk menangkap error spesifik pada halaman artikel.
3. WHEN sebuah komponen client-side melempar error yang tidak tertangani, THE Error_Boundary SHALL menampilkan fallback UI yang mengandung: judul pesan error yang ramah pengguna, deskripsi singkat yang menyarankan pengguna untuk mencoba lagi, tombol "Coba Lagi", dan link "Kembali ke Beranda".
4. WHEN tombol "Coba Lagi" diklik, THE Error_Boundary SHALL memanggil fungsi retry yang disediakan oleh Next.js error boundary untuk mencoba me-render ulang komponen yang error.
5. WHEN tombol "Coba Lagi" diklik dan render ulang berhasil, THE fallback UI SHALL digantikan oleh konten halaman yang normal.
6. THE Error_Boundary SHALL mencatat `error.message` dan `error.digest` ke console, tetapi stack trace, nama file, dan nilai `error.digest` SHALL tidak ditampilkan di UI yang terlihat oleh pengguna.
