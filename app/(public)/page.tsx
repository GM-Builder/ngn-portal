import React from 'react';
import { getActiveBreakingNews } from '@/lib/queries/breaking';
import { getFeaturedArticles, getArticles, getTrendingArticles } from '@/lib/queries/articles';
import BreakingNewsTicker from '@/components/news/BreakingNewsTicker';
import { ArticleCard, TrendingCard } from '@/components/news/ArticleCard';
import { AdUnit } from '@/components/news/AdUnit';

export const revalidate = 60; // Revalidate page every 60 seconds

export default async function HomePage() {
  const [breakingNews, featuredArticles, latestArticles, trendingArticles] = await Promise.all([
    getActiveBreakingNews(),
    getFeaturedArticles(),
    getArticles({ limit: 10 }),
    getTrendingArticles(),
  ]);

  const mainFeatured = featuredArticles[0];
  
  // Filter out the main featured article from the latest articles list to avoid duplication
  const filteredLatest = mainFeatured
    ? latestArticles.filter((art) => art.id !== mainFeatured.id)
    : latestArticles;

  return (
    <div className="space-y-8">
      {/* Breaking News Section */}
      {breakingNews.length > 0 && (
        <div className="w-full -mx-4 md:-mx-8 max-w-[100vw]">
          <BreakingNewsTicker items={breakingNews} />
        </div>
      )}

      {/* Leaderboard Ad */}
      <AdUnit variant="leaderboard" className="hidden md:flex" />

      {/* Hero Featured Article */}
      {mainFeatured && (
        <section className="mb-10">
          <h2 className="text-xs font-bold uppercase tracking-widest text-accent mb-3 border-l-4 border-accent pl-2.5 font-heading">
            Headline Utama
          </h2>
          <ArticleCard article={mainFeatured} featured priorityImage />
        </section>
      )}

      {/* Main Grid: Latest & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Latest Articles Feed (Col 8) */}
        <section className="lg:col-span-8 space-y-6">
          <div className="border-b-2 border-primary pb-2 mb-6">
            <h2 className="font-heading font-extrabold text-xl md:text-2xl text-primary tracking-tight uppercase">
              Berita Terbaru
            </h2>
          </div>

          {filteredLatest.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {filteredLatest.map((art, index) => (
                <React.Fragment key={art.id}>
                  <div className="h-full">
                    <ArticleCard article={art} />
                  </div>
                  {index === 1 && filteredLatest.length > 2 && (
                    <div className="md:col-span-2 py-2">
                      <AdUnit variant="in-feed" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border border-dashed border-border bg-secondary/10">
              <p className="text-muted-foreground font-medium text-sm">Belum ada berita terbaru saat ini.</p>
            </div>
          )}
        </section>

        {/* Sidebar (Col 4) */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Trending Panel */}
          <div className="border border-border p-5 bg-card">
            <div className="border-b border-border pb-3 mb-4">
              <h2 className="font-heading font-extrabold text-lg text-primary tracking-tight uppercase">
                Trending di NGN
              </h2>
            </div>
            <div className="divide-y divide-border/60">
              {trendingArticles.slice(0, 5).map((art, index) => (
                <TrendingCard key={art.id} article={art} rank={index + 1} />
              ))}
            </div>
          </div>

          {/* Sidebar Sticky Ad */}
          <div className="sticky top-24">
            <AdUnit variant="rectangle" />
          </div>
        </aside>
      </div>
    </div>
  );
}
