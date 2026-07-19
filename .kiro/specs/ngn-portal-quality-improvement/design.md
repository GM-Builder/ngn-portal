# Design Document: NGN Portal Quality Improvement

## Overview

Dokumen ini mendeskripsikan desain teknis untuk 18 perbaikan dan fitur baru pada NGN Portal.
Pekerjaan dibagi menjadi empat prioritas: P0 (bug keamanan kritis), P1 (bug fungsional tinggi),
P2 (fitur inti baru), dan P3 (fitur peningkatan kualitas tambahan).

Stack teknologi yang digunakan: Next.js 16.2.6 (App Router), React 19, Supabase (PostgreSQL +
Storage + Auth), Tailwind CSS v4, TypeScript.

Semua perubahan mengikuti konvensi arsitektur yang sudah ada: Server Components untuk data
fetching, Client Components hanya untuk interaktivitas browser, Supabase sebagai satu-satunya
database, dan Tailwind CSS v4 dengan CSS variables untuk theming.

---

## Architecture

### Prinsip Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│  Client Components: ViewCounter, ShareButtons, DarkMode,    │
│  Pagination (navigasi), ErrorBoundary                       │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTP
┌────────────────────▼────────────────────────────────────────┐
│                   Next.js 16 App Router                     │
│                                                             │
│  Server Components (data fetching):                         │
│  - page.tsx (article, category, trending, search, static)   │
│  - generateMetadata() per route                             │
│  - app/sitemap.ts, app/robots.ts                            │
│                                                             │
│  Route Handlers (API):                                      │
│  - /api/articles/[id]/view  (POST, rate-limited)            │
└────────────────────┬────────────────────────────────────────┘
                     │ Supabase JS Client
┌────────────────────▼────────────────────────────────────────┐
│                     Supabase                                │
│  - PostgreSQL: articles, categories tables                  │
│  - RPC: increment_view_count(article_id bigint)             │
└─────────────────────────────────────────────────────────────┘
```

### Dependency Baru

- `sanitize-html` + `@types/sanitize-html` — sanitasi HTML server-side (Req. 7)

### Perubahan Konfigurasi

- `app/layout.tsx` — tambah inline `<script>` anti-FOUC untuk dark mode (Req. 10)
- `app/layout.tsx` — tambah `metadataBase` untuk URL absolut OG/canonical (Req. 8, 9)

---

## Components and Interfaces

### P0 — Bug Fixes Kritis

#### Req. 1: Atomic View Count via Supabase RPC

**SQL Function (dibuat di Supabase Dashboard):**
```sql
CREATE OR REPLACE FUNCTION increment_view_count(article_id bigint)
RETURNS articles AS $$
  UPDATE articles
  SET view_count = view_count + 1
  WHERE id = article_id
  RETURNING *;
$$ LANGUAGE sql;
```

**`lib/queries/articles.ts` — `incrementViewCount`:**
```typescript
export async function incrementViewCount(id: number): Promise<Article | null> {
  // mock path tidak berubah
  const supabase = await createClient();
  const { data, error } = await supabase
    .rpc('increment_view_count', { article_id: id });
  if (error) {
    console.error(`Error incrementing view count for ${id}:`, error.message);
    return null;
  }
  // data adalah null jika article tidak ditemukan (RPC RETURNING tidak return row)
  return data ?? null;
}
```

**`app/api/articles/[id]/view/route.ts`:**
- Tambah rate limiter check sebelum memanggil `incrementViewCount`
- Jika `incrementViewCount` return `null` karena article tidak ada → 404
- Jika `incrementViewCount` throw error → 500

#### Req. 2: SessionStorage Guard di ViewCounter

**`components/news/ViewCounter.tsx`:**
```typescript
'use client';
import { useEffect } from 'react';

export default function ViewCounter({ articleId }: { articleId: number }) {
  useEffect(() => {
    const key = `viewed_article_${articleId}`;
    if (sessionStorage.getItem(key)) return; // sudah dilihat di sesi ini

    fetch(`/api/articles/${articleId}/view`, { method: 'POST', cache: 'no-store' })
      .then((res) => {
        if (res.ok) {
          sessionStorage.setItem(key, '1'); // simpan hanya jika berhasil
        }
      })
      .catch((err) => console.error('Error incrementing view count:', err));
  }, [articleId]);

  return null;
}
```

Key: `viewed_article_{articleId}`, value: `"1"`.
SessionStorage lifetime = per tab, sehingga refresh dalam tab yang sama tidak double-count.

#### Req. 4: Hapus Admin Links dari Footer & Navbar

**`components/layout/Footer.tsx`:**
- Hapus `<Link href="/admin">Admin Portal</Link>` dari kolom "Redaksi & Legal"
- Hapus `<Link href="/admin">Admin Panel Dashboard</Link>` dari copyright bar
- Ganti `href="#"` untuk "Tentang Kami" → `href="/tentang-kami"`
- Ganti `href="#"` untuk "Pedoman Media Siber" → `href="/pedoman-media-siber"`

**`components/layout/Navbar.tsx`:**
- Hapus `<Link href="/admin">Admin Panel</Link>` dari mobile drawer menu
- Tambah tombol dark mode toggle (lihat Req. 10)

#### Req. 5: Validasi Input Pencarian

**`app/(public)/search/page.tsx`:**
```typescript
const rawQuery = (await searchParams).q ?? '';
const trimmed = rawQuery.trim();
const query = trimmed.slice(0, 100); // max 100 karakter

const articles = query.length > 0
  ? await getArticles({ search: query, limit: 20 })
  : [];
```

Query ditampilkan di UI menggunakan JSX text node (bukan `dangerouslySetInnerHTML`),
sehingga React otomatis meng-escape karakter HTML.

#### Req. 7: Sanitasi HTML dengan sanitize-html

**Install:**
```bash
npm install sanitize-html@2.13.1
npm install --save-dev @types/sanitize-html@2.13.0
```

**`lib/sanitize.ts` (file baru, helper):**
```typescript
import sanitizeHtml from 'sanitize-html';

const ALLOWED_TAGS = [
  'p', 'br', 'strong', 'em', 'u', 's',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'ul', 'ol', 'li', 'blockquote',
  'a', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td',
  'mark', 'code', 'pre',
];

const ALLOWED_ATTRIBUTES: sanitizeHtml.IOptions['allowedAttributes'] = {
  a: ['href', 'target', 'rel'],
  img: ['src', 'alt', 'width', 'height'],
  '*': [], // tidak ada atribut event handler
};

export function sanitizeArticleHtml(dirty: string): string {
  return sanitizeHtml(dirty, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: ALLOWED_ATTRIBUTES,
    allowedSchemes: ['http', 'https', 'mailto'],
    disallowedTagsMode: 'discard',
  });
}
```

**`app/(public)/article/[id]/[slug]/page.tsx`:**
```typescript
import { sanitizeArticleHtml } from '@/lib/sanitize';
// ...
const safeContent = sanitizeArticleHtml(article.content);
// ...
<div className="rich-text article-body"
  dangerouslySetInnerHTML={{ __html: safeContent }} />
```

### P1 — Bug Fixes Tinggi

#### Req. 3: Konsolidasi Slugify

**`app/(public)/article/[id]/[slug]/page.tsx`:**
- Hapus fungsi `slugify` lokal di bagian bawah file
- Tambah import: `import { slugify } from '@/lib/utils';`
- Fungsi `slugify` di `lib/utils.ts` sudah ada dan identik — tidak perlu modifikasi

#### Req. 6: Perbaikan getArticles categorySlug Bug

**Masalah saat ini:** Ketika `categorySlug` diberikan, query di-reassign dengan `supabase.from('articles')...` baru yang menimpa semua filter sebelumnya (search, dll). Filter `search`, `limit`, `offset` yang ditambahkan setelah reassignment tidak diterapkan pada query yang benar karena TypeScript query builder Supabase tidak bisa di-chain setelah reassignment variabel.

**Solusi — chained query builder:**
```typescript
let query = supabase
  .from('articles')
  .select('*, categories!inner(name, slug)');

if (options.categorySlug) {
  query = query.eq('categories.slug', options.categorySlug);
} else if (options.categoryId) {
  query = query.eq('category_id', options.categoryId);
}

if (options.search) {
  query = query.or(
    `title.ilike.%${options.search}%,content.ilike.%${options.search}%`
  );
}

query = query.order('published_at', { ascending: false });

if (options.limit) query = query.limit(options.limit);
if (options.offset !== undefined) {
  query = query.range(
    options.offset,
    options.offset + (options.limit ?? 10) - 1
  );
}

const { data, error } = await query;
```

Catatan: `categories!inner(name, slug)` memastikan artikel tanpa kategori tidak ikut,
dan filter `.eq('categories.slug', ...)` bekerja pada join tersebut.

#### Req. 8: generateMetadata di Article Page

**`app/(public)/article/[id]/[slug]/page.tsx`:**
```typescript
import type { Metadata } from 'next';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id';

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { id } = await params;
  const articleId = Number(id);

  if (isNaN(articleId)) {
    return { title: 'Artikel Tidak Ditemukan | NGN' };
  }

  const article = await getArticle(articleId);
  if (!article) {
    return { title: 'Artikel Tidak Ditemukan | NGN' };
  }

  // Fallback description: strip HTML, ambil 160 karakter pertama
  const plainContent = article.content.replace(/<[^>]+>/g, '');
  const description = article.excerpt?.trim() || plainContent.slice(0, 160);
  const url = `${BASE_URL}/article/${article.id}/${slugify(article.slug ?? article.title)}`;

  return {
    title: `${article.title} | NGN`,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: article.title,
      description,
      type: 'article',
      url,
      publishedTime: article.published_at,
      authors: [article.author],
      ...(article.image_url ? { images: [{ url: article.image_url }] } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: article.title,
      description,
      ...(article.image_url ? { images: [article.image_url] } : {}),
    },
  };
}
```

`metadataBase` di-set di `app/layout.tsx`:
```typescript
export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id'),
  // ...
};
```

#### Req. 15: Rate Limiting di View API

**`app/api/articles/[id]/view/route.ts`:**
```typescript
// In-memory rate limiter: Map<`${ip}:${articleId}`, timestamp>
const rateLimitMap = new Map<string, number>();
const WINDOW_MS = 60_000; // 60 detik

function isRateLimited(ip: string, articleId: number): boolean {
  const key = `${ip}:${articleId}`;
  const lastRequest = rateLimitMap.get(key);
  const now = Date.now();
  if (lastRequest && now - lastRequest < WINDOW_MS) return true;
  rateLimitMap.set(key, now);
  return false;
}
```

IP diambil dari header `X-Forwarded-For` (ambil IP pertama) atau fallback ke `'unknown'`.
Catatan: in-memory Map tidak persist antar serverless invocations — ini acceptable untuk MVP.

### P2 — Fitur Baru

#### Req. 9: SEO Metadata Semua Halaman Publik + JSON-LD

**`app/(public)/category/[slug]/page.tsx`:**
```typescript
export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);
  if (!category) return { title: 'Kategori Tidak Ditemukan | NGN' };
  const description = category.description
    ?? `Baca berita terbaru kategori ${category.name} di NGN.`;
  return {
    title: `Berita ${category.name} | NGN`,
    description,
    alternates: { canonical: `${BASE_URL}/category/${slug}` },
  };
}
```

**`app/(public)/trending/page.tsx`:**
```typescript
export const metadata: Metadata = {
  title: 'Berita Trending | NGN',
  description: 'Daftar berita dengan pembaca terbanyak dan interaksi tertinggi di NGN.',
  alternates: { canonical: `${BASE_URL}/trending` },
};
```

**`app/(public)/search/page.tsx`:**
```typescript
export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim().slice(0, 100) ?? '';
  return {
    title: query ? `Hasil Pencarian: ${query} | NGN` : 'Pencarian Berita | NGN',
  };
}
```

**JSON-LD NewsArticle di Article Page:**
```typescript
// Di dalam ArticlePage component (Server Component)
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'NewsArticle',
  headline: article.title,
  datePublished: article.published_at,
  author: { '@type': 'Person', name: article.author },
  publisher: {
    '@type': 'Organization',
    name: 'NGN Media',
    logo: { '@type': 'ImageObject', url: `${BASE_URL}/logos/Logo.png` },
  },
  ...(article.image_url ? { image: article.image_url } : {}),
};

// Di dalam JSX:
<script
  type="application/ld+json"
  dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
/>
```

#### Req. 10: Dark Mode Toggle

**Anti-FOUC script di `app/layout.tsx`:**
```typescript
// Di dalam <html> sebelum <body>
<script
  dangerouslySetInnerHTML={{
    __html: `(function(){
      try {
        var theme = localStorage.getItem('ngn-theme');
        if (theme === 'dark') document.documentElement.classList.add('dark');
      } catch(e) {}
    })();`,
  }}
/>
```

Script ini berjalan synchronous sebelum paint, mencegah flash of unstyled content.

**`components/ui/DarkModeToggle.tsx` (Client Component baru):**
```typescript
'use client';
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export default function DarkModeToggle() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('ngn-theme', next ? 'dark' : 'light');
  };

  return (
    <button
      onClick={toggle}
      aria-label={isDark ? 'Aktifkan mode terang' : 'Aktifkan mode gelap'}
      aria-pressed={isDark}
      className="p-2.5 rounded-full hover:bg-secondary text-foreground transition-all"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
```

`DarkModeToggle` diimpor di `Navbar.tsx` dan ditempatkan di action icons area.
CSS variables `.dark` sudah ada di `globals.css` — tidak perlu modifikasi CSS.
