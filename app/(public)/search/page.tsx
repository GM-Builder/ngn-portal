import React from 'react';
import type { Metadata } from 'next';
import { getArticles } from '@/lib/queries/articles';
import { ArticleCard } from '@/components/news/ArticleCard';
import { AdUnit } from '@/components/news/AdUnit';

interface SearchPageProps {
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps): Promise<Metadata> {
  const { q } = await searchParams;
  const query = q?.trim().slice(0, 100) ?? '';
  return {
    title: query ? `Hasil Pencarian: ${query} | NGN` : 'Pencarian Berita | NGN',
  };
}

export const revalidate = 0; // Dynamic search page, do not cache

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const rawQuery = (await searchParams).q ?? '';
  const trimmed = rawQuery.trim();
  const query = trimmed.slice(0, 100); // max 100 characters

  const articles = query.length > 0
    ? await getArticles({ search: query, limit: 20 })
    : [];

  return (
    <div className="space-y-8">
      {/* Search Header & Input */}
      <div className="border-b border-border pb-6">
        <h1 className="font-heading font-extrabold text-3xl uppercase tracking-tight text-primary mb-4">
          Pencarian Berita
        </h1>
        
        {/* Simple native form that performs standard GET request to /search?q=... */}
        <form action="/search" method="GET" className="flex gap-2 max-w-xl">
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Ketik kata kunci pencarian..."
            className="flex-1 px-4 py-3 bg-card border border-border text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
            required
            autoFocus
          />
          <button
            type="submit"
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-heading font-bold text-xs uppercase tracking-wider px-6 py-3 transition-colors shrink-0"
          >
            Cari
          </button>
        </form>
      </div>

      {query.length > 0 && (
        <p className="text-sm font-semibold text-muted-foreground">
          Hasil pencarian untuk: <span className="text-foreground font-bold">&quot;{query}&quot;</span> ({articles.length} berita ditemukan)
        </p>
      )}

      {/* Results Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <section className="lg:col-span-8 space-y-6">
          {articles.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {articles.map((art, index) => (
                <React.Fragment key={art.id}>
                  <div className="h-full">
                    <ArticleCard article={art} />
                  </div>
                  {index === 3 && articles.length > 4 && (
                    <div className="md:col-span-2 py-2">
                      <AdUnit variant="in-feed" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : query.length > 0 ? (
            <div className="text-center py-16 border border-dashed border-border bg-secondary/10">
              <p className="text-muted-foreground font-semibold text-sm">
                Tidak ada berita yang cocok dengan kata kunci pencarian Anda.
              </p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                Coba gunakan kata kunci yang berbeda atau periksa ejaan Anda.
              </p>
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border bg-secondary/5">
              <p className="text-muted-foreground font-medium text-sm">
                Masukkan kata kunci pencarian untuk mencari artikel berita.
              </p>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4">
          <AdUnit variant="rectangle" />
        </aside>
      </div>
    </div>
  );
}
