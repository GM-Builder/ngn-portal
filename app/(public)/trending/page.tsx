import type { Metadata } from 'next';
import React from 'react';
import { redirect } from 'next/navigation';
import { getTrendingArticles, countTrendingArticles } from '@/lib/queries/articles';
import { ArticleCard, TrendingCard } from '@/components/news/ArticleCard';
import { AdUnit } from '@/components/news/AdUnit';
import Pagination from '@/components/ui/Pagination';

interface TrendingPageProps {
  searchParams: Promise<{
    page?: string;
  }>;
}

export const revalidate = 30; // Revalidate trending news every 30 seconds

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id';
const PAGE_SIZE = 10;

export const metadata: Metadata = {
  title: 'Berita Trending | NGN',
  description: 'Daftar berita dengan pembaca terbanyak dan interaksi tertinggi di NGN.',
  alternates: { canonical: `${BASE_URL}/trending` },
};

export default async function TrendingPage({ searchParams }: TrendingPageProps) {
  const { page: pageParam } = await searchParams;

  // Parse and validate page number
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;
  const startRank = offset + 1;

  const [totalArticles, trendingArticles] = await Promise.all([
    countTrendingArticles(),
    getTrendingArticles({ limit: PAGE_SIZE, offset }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalArticles / PAGE_SIZE));

  // Redirect to last valid page if page exceeds total
  if (page > totalPages) {
    redirect(`/trending?page=${totalPages}`);
  }

  const headline = page === 1 ? trendingArticles[0] : null;
  const listItems = page === 1 ? trendingArticles.slice(1) : trendingArticles;

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="border-b-4 border-accent pb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-accent mb-1.5 block">
          Terpopuler
        </span>
        <h1 className="font-heading font-extrabold text-3xl md:text-5xl uppercase tracking-tight text-primary">
          Trending NGN
        </h1>
        <p className="text-muted-foreground text-sm md:text-base mt-2">
          Daftar berita dengan pembaca terbanyak dan interaksi tertinggi dalam 24 jam terakhir.
        </p>
      </div>

      {/* Leaderboard Ad */}
      <AdUnit variant="leaderboard" className="hidden md:flex" />

      {/* Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Main Feed */}
        <section className="lg:col-span-8 space-y-6">
          {trendingArticles.length > 0 ? (
            <div className="space-y-8">
              {/* Page 1: show featured #1 article */}
              {headline && (
                <div>
                  <div className="bg-accent text-accent-foreground inline-block px-3 py-1 text-xs font-bold uppercase tracking-wider mb-4 font-heading">
                    #1 TERPOPULER
                  </div>
                  <ArticleCard article={headline} featured priorityImage />
                </div>
              )}

              {/* Grid of other trending articles */}
              {listItems.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listItems.map((art, index) => {
                    const rank = page === 1 ? index + 2 : startRank + index;
                    return (
                      <React.Fragment key={art.id}>
                        <div className="relative border border-border p-4 bg-card group h-full">
                          <div className="absolute top-4 right-4 font-heading text-3xl font-extrabold text-muted-foreground/20 group-hover:text-accent transition-colors duration-200">
                            #{rank}
                          </div>
                          <ArticleCard article={art} showCategory={true} />
                        </div>
                        {index === 1 && listItems.length > 2 && (
                          <div className="md:col-span-2 py-2">
                            <AdUnit variant="in-feed" />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              )}

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath="/trending"
              />
            </div>
          ) : (
            <div className="text-center py-16 border border-dashed border-border bg-secondary/15">
              <p className="text-muted-foreground font-semibold text-sm">
                Belum ada data berita trending saat ini.
              </p>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          <div className="border border-border p-5 bg-card">
            <div className="border-b border-border pb-3 mb-4">
              <h2 className="font-heading font-extrabold text-base text-primary tracking-tight uppercase">
                Trending Ringkas
              </h2>
            </div>
            <div className="divide-y divide-border/60">
              {trendingArticles.map((art, index) => (
                <TrendingCard key={art.id} article={art} rank={startRank + index} />
              ))}
            </div>
          </div>

          {/* Sticky Sidebar Ad */}
          <div className="sticky top-24">
            <AdUnit variant="rectangle" />
          </div>
        </aside>
      </div>
    </div>
  );
}
