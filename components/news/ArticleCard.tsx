import Link from 'next/link';
import Image from 'next/image';
import { Clock } from 'lucide-react';
import { Article } from '@/types';
import { formatTimeAgo, slugify } from '@/lib/utils';

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
  compact?: boolean;
  showCategory?: boolean;
  priorityImage?: boolean;
}

export function ArticleCard({
  article,
  featured = false,
  compact = false,
  showCategory = true,
  priorityImage = false,
}: ArticleCardProps) {
  // Use stored slug if available, otherwise generate from title
  const articleUrl = `/article/${article.id}/${article.slug ? slugify(article.slug) : slugify(article.title)}`;

  if (featured) {
    return (
      <article className="group relative grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-center bg-card border border-border overflow-hidden p-4 md:p-6 transition-all duration-300 hover:shadow-lg">
        {article.image_url && (
          <div className="lg:col-span-8 relative aspect-video w-full overflow-hidden bg-secondary">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-700 ease-out group-hover:scale-103"
              priority={priorityImage}
              sizes="(max-width: 1024px) 100vw, 66vw"
            />
            {showCategory && (
              <div className="absolute top-4 left-4 bg-primary text-primary-foreground px-4 py-1.5 text-xs font-bold uppercase tracking-wider">
                {article.category_name}
              </div>
            )}
          </div>
        )}
        <div className="lg:col-span-4 flex flex-col justify-center h-full">
          {showCategory && !article.image_url && (
            <span className="text-accent text-xs font-bold uppercase tracking-widest mb-3">
              {article.category_name}
            </span>
          )}
          <h2 className="font-heading text-2xl md:text-3xl lg:text-4xl font-extrabold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight mb-4">
            <Link href={articleUrl}>{article.title}</Link>
          </h2>
          {article.excerpt && (
            <p className="text-muted-foreground text-sm md:text-base mb-6 line-clamp-3 leading-relaxed">
              {article.excerpt}
            </p>
          )}
          <div className="mt-auto flex items-center text-xs text-muted-foreground font-semibold">
            <span className="text-foreground font-bold mr-3">{article.author}</span>
            <span className="flex items-center">
              <Clock className="w-3.5 h-3.5 mr-1" />
              {formatTimeAgo(article.published_at)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  if (compact) {
    return (
      <article className="group flex gap-4 bg-card border border-border p-3 transition-all duration-300 hover:shadow-md">
        {article.image_url && (
          <div className="relative w-24 h-24 shrink-0 overflow-hidden bg-secondary">
            <Image
              src={article.image_url}
              alt={article.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              sizes="96px"
            />
          </div>
        )}
        <div className="flex flex-col flex-1 justify-between">
          <div>
            {showCategory && (
              <span className="text-accent text-[10px] font-bold uppercase tracking-widest mb-1.5 block">
                {article.category_name}
              </span>
            )}
            <h3 className="font-heading text-sm md:text-base font-extrabold text-foreground group-hover:text-primary transition-colors duration-200 leading-tight line-clamp-2">
              <Link href={articleUrl}>{article.title}</Link>
            </h3>
          </div>
          <div className="flex items-center text-[10px] text-muted-foreground mt-2">
            <span className="text-foreground font-bold mr-2">{article.author}</span>
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatTimeAgo(article.published_at)}
            </span>
          </div>
        </div>
      </article>
    );
  }

  // Standard Card
  return (
    <article className="group flex flex-col h-full bg-card border border-border p-4 transition-all duration-300 hover:shadow-md hover:border-primary/20">
      {article.image_url && (
        <div className="relative aspect-[3/2] w-full overflow-hidden bg-secondary mb-4">
          <Image
            src={article.image_url}
            alt={article.title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-103"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={priorityImage}
          />
          {showCategory && (
            <div className="absolute top-3 left-3 bg-primary text-primary-foreground px-3 py-1 text-[10px] font-bold uppercase tracking-wider">
              {article.category_name}
            </div>
          )}
        </div>
      )}
      <div className="flex flex-col flex-1">
        {showCategory && !article.image_url && (
          <span className="text-accent text-xs font-bold uppercase tracking-widest mb-2 block">
            {article.category_name}
          </span>
        )}
        <h3 className="font-heading text-lg md:text-xl font-extrabold text-foreground group-hover:text-primary transition-colors duration-200 leading-snug mb-3">
          <Link href={articleUrl}>{article.title}</Link>
        </h3>
        {article.excerpt && (
          <p className="text-muted-foreground text-sm line-clamp-2 leading-relaxed mb-4">
            {article.excerpt}
          </p>
        )}
        <div className="mt-auto pt-3 border-t border-border/60 flex items-center justify-between text-[11px] text-muted-foreground font-semibold">
          <span className="text-foreground font-bold">{article.author}</span>
          <span className="flex items-center">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeAgo(article.published_at)}
          </span>
        </div>
      </div>
    </article>
  );
}

export function TrendingCard({ article, rank }: { article: Article; rank: number }) {
  const articleUrl = `/article/${article.id}/${article.slug ? slugify(article.slug) : slugify(article.title)}`;

  return (
    <article className="group flex items-start gap-4 py-4 border-b border-border/60 last:border-b-0">
      <div className="font-heading text-4xl font-extrabold text-muted-foreground/20 group-hover:text-accent transition-colors duration-200 w-8 text-center shrink-0 leading-none">
        {String(rank).padStart(2, '0')}
      </div>
      <div className="flex-1">
        <span className="text-accent text-[9px] font-bold uppercase tracking-widest mb-1 block">
          {article.category_name}
        </span>
        <h4 className="font-heading font-extrabold text-sm md:text-base text-foreground group-hover:text-primary transition-colors duration-200 leading-snug">
          <Link href={articleUrl}>{article.title}</Link>
        </h4>
        <div className="flex items-center text-[10px] text-muted-foreground mt-1.5">
          <span className="flex items-center font-medium">
            <Clock className="w-3 h-3 mr-1" />
            {formatTimeAgo(article.published_at)}
          </span>
        </div>
      </div>
    </article>
  );
}
