import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Clock, Eye, Calendar, User, ChevronRight } from 'lucide-react';
import { getArticle, getRelatedArticles } from '@/lib/queries/articles';
import { ArticleCard } from '@/components/news/ArticleCard';
import { AdUnit } from '@/components/news/AdUnit';
import { formatDate, slugify } from '@/lib/utils';
import ViewCounter from '@/components/news/ViewCounter';
import ShareButtons from '@/components/news/ShareButtons';
import { sanitizeArticleHtml } from '@/lib/sanitize';

interface ArticlePageProps {
  params: Promise<{
    id: string;
    slug: string;
  }>;
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id';

export const revalidate = 10; // Revalidate page every 10 seconds for updated view counts

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

  // Fallback description: strip HTML tags, take first 160 chars
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

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { id } = await params;
  const articleId = Number(id);

  if (isNaN(articleId)) {
    notFound();
  }

  const article = await getArticle(articleId);

  if (!article) {
    notFound();
  }

  // Draft articles tidak boleh diakses publik
  if (article.status === 'draft') {
    notFound();
  }

  const relatedArticles = await getRelatedArticles(articleId);

  // Sanitize article HTML server-side before rendering to prevent XSS
  const safeContent = sanitizeArticleHtml(article.content);

  // Use the article's actual category slug from the DB join, fall back to slugifying the name
  const categorySlug = article.category_slug ?? slugify(article.category_name ?? '');

  // Reading time: use stored value if valid, otherwise calculate from word count
  const computeReadingTime = (): string => {
    const stored = article.reading_time_minutes;
    if (stored && stored > 0) return `${stored} menit baca`;
    const plainText = article.content.replace(/<[^>]+>/g, '');
    const wordCount = plainText.trim().split(/\s+/).filter(Boolean).length;
    const minutes = Math.round(wordCount / 200);
    if (minutes < 1) return '< 1 menit baca';
    return `${minutes} menit baca`;
  };
  const readingTime = computeReadingTime();

  // Absolute URL for sharing
  const articleUrl = `${BASE_URL}/article/${article.id}/${slugify(article.slug ?? article.title)}`;

  // JSON-LD structured data for NewsArticle (Requirements 9.6, 9.7)
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

  return (
    <article className="space-y-6">
      {/* JSON-LD structured data for search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />

      {/* Dynamic View Counter Trigger (Client Side) */}
      <ViewCounter articleId={article.id} />

      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-xs font-semibold tracking-wide uppercase text-muted-foreground/80 py-1">
        <Link href="/" className="hover:text-primary transition-colors">
          Beranda
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
        <Link href={`/category/${categorySlug}`} className="hover:text-primary transition-colors">
          {article.category_name}
        </Link>
        <ChevronRight className="w-3 h-3 text-muted-foreground/50 shrink-0" />
        <span className="text-foreground line-clamp-1 max-w-[200px] md:max-w-xs">
          {article.title}
        </span>
      </nav>

      {/* Main Grid: Article & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Article Content (Col 8) */}
        <div className="lg:col-span-8 space-y-6 bg-card border border-border p-4 md:p-8">
          {/* Metadata & Title */}
          <div className="space-y-4">
            <Link
              href={`/category/${categorySlug}`}
              className="inline-block bg-primary text-primary-foreground px-3 py-1 text-xs font-bold uppercase tracking-wider"
            >
              {article.category_name}
            </Link>

            <h1 className="font-heading font-extrabold text-2xl md:text-3xl lg:text-4xl text-foreground leading-tight tracking-tight">
              {article.title}
            </h1>

            {/* Author, Date, Views */}
            <div className="flex flex-wrap items-center gap-y-2 gap-x-4 md:gap-x-6 text-xs text-muted-foreground border-y border-border/80 py-3 font-semibold">
              <span className="flex items-center text-foreground">
                <User className="w-4 h-4 mr-1.5 text-accent" />
                {article.author}
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-1.5" />
                {formatDate(article.published_at)}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1.5" />
                {readingTime}
              </span>
              <span className="flex items-center ml-auto">
                <Eye className="w-4 h-4 mr-1.5" />
                {article.view_count} views
              </span>
            </div>
          </div>

          {/* Featured Image */}
          {article.image_url && (
            <div>
              <div className="relative aspect-video w-full overflow-hidden bg-secondary border border-border">
                <Image
                  src={article.image_url}
                  alt={article.title}
                  fill
                  className="object-cover"
                  priority
                  sizes="(max-width: 1024px) 100vw, 800px"
                />
              </div>
              {article.image_caption && (
                <p className="text-[11px] text-muted-foreground/70 font-medium mt-1.5 italic leading-relaxed px-1">
                  {article.image_caption}
                </p>
              )}
            </div>
          )}

          {/* Article Excerpt */}
          {article.excerpt && (
            <p className="text-muted-foreground font-semibold text-base md:text-lg leading-relaxed border-l-4 border-accent pl-4 italic">
              {article.excerpt}
            </p>
          )}

          {/* Main Rich-Text Content */}
          <div
            className="rich-text article-body"
            dangerouslySetInnerHTML={{ __html: safeContent }}
          />

          {/* Social Share Buttons */}
          <div className="pt-4 border-t border-border/60">
            <ShareButtons title={article.title} url={articleUrl} />
          </div>

          {/* In-Article Advertisement */}
          <AdUnit variant="in-article" className="py-6 border-t border-border/60" />
        </div>

        {/* Right: Sidebar (Col 4) */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Related Articles Section */}
          <div className="border border-border p-5 bg-card">
            <div className="border-b border-border pb-3 mb-4">
              <h2 className="font-heading font-extrabold text-base text-primary tracking-tight uppercase">
                Baca Juga
              </h2>
            </div>
            <div className="flex flex-col gap-4">
              {relatedArticles.length > 0 ? (
                relatedArticles.map((art) => (
                  <ArticleCard key={art.id} article={art} compact />
                ))
              ) : (
                <p className="text-xs text-muted-foreground font-medium py-2">
                  Tidak ada berita terkait lainnya.
                </p>
              )}
            </div>
          </div>

          {/* Rectangle Advertisement */}
          <div className="sticky top-24">
            <AdUnit variant="rectangle" />
          </div>
        </aside>
      </div>
    </article>
  );
}

