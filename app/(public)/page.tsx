import React from 'react';
import Link from 'next/link';
import { getActiveBreakingNews } from '@/lib/queries/breaking';
import { getFeaturedArticles, getArticles, getTrendingArticles, getTopArticlesByCategory } from '@/lib/queries/articles';
import { getCategories } from '@/lib/queries/categories';
import BreakingNewsTicker from '@/components/news/BreakingNewsTicker';
import { ArticleCard, TrendingCard } from '@/components/news/ArticleCard';
import { AdUnit } from '@/components/news/AdUnit';
import { Clock, ChevronRight, TrendingUp, Zap, Layers } from 'lucide-react';
import { formatTimeAgo, slugify } from '@/lib/utils';
import Image from 'next/image';

export const revalidate = 60;

export default async function HomePage() {
  const [breakingNews, featuredArticles, latestArticles, trendingArticles, categories, topByCategory] = await Promise.all([
    getActiveBreakingNews(),
    getFeaturedArticles(),
    getArticles({ limit: 12 }),
    getTrendingArticles(),
    getCategories(),
    getTopArticlesByCategory(),
  ]);

  // Hero: use featured OR fallback to latest
  const heroArticle = featuredArticles[0] || latestArticles[0];
  const secondaryFeatured = featuredArticles.slice(1, 3);

  // Filter hero from latest list
  const filteredLatest = heroArticle
    ? latestArticles.filter((art) => art.id !== heroArticle.id)
    : latestArticles.slice(1);

  // Breaking news items for the panel (not just ticker)
  const breakingItems = breakingNews.slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Breaking News Ticker */}
      {breakingNews.length > 0 && (
        <div className="w-full -mx-4 md:-mx-8 max-w-[100vw]">
          <BreakingNewsTicker items={breakingNews} />
        </div>
      )}

      {/* Hero Section */}
      {heroArticle && (
        <section>
          <Link href={`/article/${heroArticle.id}/${heroArticle.slug ? slugify(heroArticle.slug) : slugify(heroArticle.title)}`} className="group block">
            <article className="relative overflow-hidden bg-card border border-border">
              {/* Hero Image */}
              {heroArticle.image_url && (
                <div className="relative aspect-[21/9] w-full overflow-hidden bg-secondary">
                  <Image
                    src={heroArticle.image_url}
                    alt={heroArticle.title}
                    fill
                    className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    priority
                    sizes="(max-width: 1024px) 100vw, 100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  {/* Category Badge */}
                  <div className="absolute top-4 left-4 bg-accent text-accent-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider">
                    {heroArticle.category_name}
                  </div>
                  {/* Hero Content Overlay */}
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8 lg:p-10">
                    <h1 className="font-heading text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight mb-3 group-hover:text-accent transition-colors duration-200">
                      {heroArticle.title}
                    </h1>
                    {heroArticle.excerpt && (
                      <p className="text-white/80 text-sm md:text-base max-w-2xl line-clamp-2 mb-4">
                        {heroArticle.excerpt}
                      </p>
                    )}
                    <div className="flex items-center text-xs text-white/60">
                      <span className="text-white/80 font-bold mr-3">{heroArticle.author}</span>
                      <span className="flex items-center">
                        <Clock className="w-3.5 h-3.5 mr-1" />
                        {formatTimeAgo(heroArticle.published_at)}
                      </span>
                      {heroArticle.reading_time_minutes && (
                        <span className="ml-3">{heroArticle.reading_time_minutes} menit baca</span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </article>
          </Link>
        </section>
      )}

      {/* Secondary Featured Articles */}
      {secondaryFeatured.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {secondaryFeatured.map((art) => (
            <ArticleCard key={art.id} article={art} />
          ))}
        </section>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Latest Articles Feed */}
        <section className="lg:col-span-8">
          <div className="border-b-2 border-primary pb-2 mb-5">
            <h2 className="font-heading font-extrabold text-lg md:text-xl text-primary tracking-tight uppercase flex items-center gap-2">
              <Zap className="w-5 h-5 text-accent" />
              Berita Terbaru
            </h2>
          </div>

          {filteredLatest.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredLatest.map((art, index) => (
                <React.Fragment key={art.id}>
                  <ArticleCard article={art} />
                  {index === 1 && filteredLatest.length > 2 && (
                    <div className="md:col-span-2 py-1">
                      <AdUnit variant="in-feed" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 border border-dashed border-border bg-secondary/10">
              <p className="text-muted-foreground font-medium text-sm">Belum ada berita terbaru saat ini.</p>
              <p className="text-muted-foreground/60 text-xs mt-1">Berita akan muncul setelah dipublikasikan melalui Hermes.</p>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-5">
          {/* Breaking News Panel */}
          {breakingItems.length > 0 && (
            <div className="border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-2 border-b border-accent/20 pb-3 mb-3">
                <div className="w-2 h-2 bg-accent rounded-full animate-pulse" />
                <h3 className="font-heading font-extrabold text-sm text-accent uppercase tracking-wide">
                  Breaking News
                </h3>
              </div>
              <div className="space-y-3">
                {breakingItems.map((item) => (
                  <div key={item.id} className="group">
                    {item.article_id ? (
                      <Link
                        href={`/article/${item.article_id}/${item.article_slug || 'breaking'}`}
                        className="flex items-start gap-2 text-sm text-foreground hover:text-accent transition-colors"
                      >
                        <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-accent/60 group-hover:text-accent" />
                        <span className="line-clamp-2 font-medium">{item.text}</span>
                      </Link>
                    ) : (
                      <div className="flex items-start gap-2 text-sm text-foreground">
                        <ChevronRight className="w-4 h-4 mt-0.5 shrink-0 text-accent/60" />
                        <span className="line-clamp-2 font-medium">{item.text}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Trending Panel */}
          <div className="border border-border p-4 bg-card">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
              <TrendingUp className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-extrabold text-sm text-primary uppercase tracking-wide">
                Trending di NGN
              </h3>
            </div>
            <div className="divide-y divide-border/60">
              {trendingArticles.slice(0, 5).map((art, index) => (
                <TrendingCard key={art.id} article={art} rank={index + 1} />
              ))}
              {trendingArticles.length === 0 && (
                <p className="text-muted-foreground/60 text-xs py-3">Belum ada tren.</p>
              )}
            </div>
          </div>

          {/* Berita per Kategori */}
          <div className="border border-border p-4 bg-card">
            <div className="flex items-center gap-2 border-b border-border pb-3 mb-3">
              <Layers className="w-4 h-4 text-primary" />
              <h3 className="font-heading font-extrabold text-sm text-primary uppercase tracking-wide">
                Per Kategori
              </h3>
            </div>
            <div className="space-y-3">
              {categories.map((cat) => {
                const topArt = topByCategory.get(cat.slug);
                if (!topArt) return null;
                const artUrl = `/article/${topArt.id}/${topArt.slug ? slugify(topArt.slug) : slugify(topArt.title)}`;
                return (
                  <Link key={cat.id} href={artUrl} className="group block">
                    <div className="flex items-start gap-3">
                      {topArt.image_url && (
                        <div className="relative w-16 h-16 shrink-0 overflow-hidden bg-secondary">
                          <Image
                            src={topArt.image_url}
                            alt={topArt.title}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                            sizes="64px"
                          />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <span className="text-accent text-[9px] font-bold uppercase tracking-widest block mb-1">
                          {cat.name}
                        </span>
                        <h4 className="font-heading text-xs font-extrabold text-foreground group-hover:text-primary transition-colors duration-200 leading-snug line-clamp-2">
                          {topArt.title}
                        </h4>
                        <div className="flex items-center text-[10px] text-muted-foreground mt-1">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatTimeAgo(topArt.published_at)}
                        </div>
                      </div>
                    </div>
                  </Link>
                );
              })}
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
