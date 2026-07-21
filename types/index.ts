export interface Category {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
  articleCount?: number; // computed
}

export type ArticleStatus = 'draft' | 'published';

export interface Article {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  image_url: string | null;
  category_id: number;
  author: string;
  published_at: string;
  view_count: number;
  is_featured: boolean;
  is_breaking: boolean;
  reading_time_minutes: number;
  created_at: string;
  status: ArticleStatus;
  category_name?: string; // from join
  category_slug?: string; // from join
}

export interface BreakingNews {
  id: number;
  text: string;
  is_active: boolean;
  article_id: number | null;
  created_at: string;
  article_title?: string;
  article_slug?: string;
}

export interface StatsSummary {
  totalArticles: number;
  totalViews: number;
  totalCategories: number;
  todayArticles: number;
}
