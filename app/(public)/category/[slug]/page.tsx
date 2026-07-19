import type { Metadata } from 'next';
import React from 'react';
import { notFound, redirect } from 'next/navigation';
import { getCategoryBySlug } from '@/lib/queries/categories';
import { getArticles, getTrendingArticles, countArticles } from '@/lib/queries/articles';
import { ArticleCard, TrendingCard } from '@/components/news/ArticleCard';
import { AdUnit } from '@/components/news/AdUnit';
import Pagination from '@/components/ui/Pagination';

interface CategoryPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    page?: string;
  }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id';
const PAGE_SIZE = 12;

export const revalidate = 60; // Revalidate page every 60 seconds

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const category = await getCategoryBySlug(slug);

  if (!category) {
    return { title: 'Kategori Tidak Ditemukan | NGN' };
  }

  const description =
    category.description ?? `Baca berita terbaru kategori ${category.name} di NGN.`;

  return {
    title: `Berita ${category.name} | NGN`,
    description,
    alternates: { canonical: `${BASE_URL}/category/${slug}` },
  };
}

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const { page: pageParam } = await searchParams;

  const category = await getCategoryBySlug(slug);

  if (!category) {
    notFound();
  }

  // Parse and validate page number
  const page = Math.max(1, parseInt(pageParam ?? '1', 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const [totalArticles, articles, trendingArticles] = await Promise.all([
    countArticles({ categorySlug: slug }),
    getArticles({ categorySlug: slug, limit: PAGE_SIZE, offset }),
    getTrendingArticles({ limit: 5 }),
  ]);

  const totalPages = Math.max(1, Math.ceil(totalArticles / PAGE_SIZE));

  // Redirect to last valid page if page exceeds total
  if (page > totalPages) {
    redirect(`/category/${slug}?page=${totalPages}`);
  }

  return (
    <div className="space-y-8">
      {/* Category Header */}
      <div className="bg-primary text-primary-foreground p-6 md:p-8 border border-primary">
        <span className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-accent mb-2 block">
          Kategori Berita
        </span>
        <h1 className="font-heading font-extrabold text-3xl md:text-4xl uppercase tracking-tight">
          {category.name}
        </h1>
        {category.description && (
          <p className="mt-3 text-sm md:text-base text-primary-foreground/80 max-w-2xl leading-relaxed">
            {category.description}
          </p>
        )}
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Articles List */}
        <section className="lg:col-span-8 space-y-6">
          {articles.length > 0 ? (
            <>
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

              <Pagination
                currentPage={page}
                totalPages={totalPages}
                basePath={`/category/${slug}`}
              />
            </>
          ) : (
            <div className="text-center py-16 border border-dashed border-border bg-secondary/15">
              <p className="text-muted-foreground font-semibold text-sm">
                Belum ada berita di kategori {category.name} saat ini.
              </p>
            </div>
          )}
        </section>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Trending Panel */}
          <div className="border border-border p-5 bg-card">
            <div className="border-b border-border pb-3 mb-4">
              <h2 className="font-heading font-extrabold text-lg text-primary tracking-tight uppercase">
                Trending di NGN
              </h2>
            </div>
            <div className="divide-y divide-border/60">
              {trendingArticles.map((art, index) => (
                <TrendingCard key={art.id} article={art} rank={index + 1} />
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
