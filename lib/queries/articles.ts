import { createClient } from '../supabase/server';
import { Article, StatsSummary } from '@/types';
import { MOCK_ARTICLES, MOCK_CATEGORIES, isSupabaseConfigured } from './mockData';

interface GetArticlesOptions {
  categoryId?: number;
  categorySlug?: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export async function getArticles(options: GetArticlesOptions = {}): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    let result = [...MOCK_ARTICLES];

    if (options.categoryId) {
      result = result.filter(art => art.category_id === options.categoryId);
    }

    if (options.categorySlug) {
      const category = MOCK_CATEGORIES.find(c => c.slug === options.categorySlug);
      if (category) {
        result = result.filter(art => art.category_id === category.id);
      } else {
        return [];
      }
    }

    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(art => 
        art.title.toLowerCase().includes(q) || 
        art.content.toLowerCase().includes(q)
      );
    }

    // Sort by published_at descending
    result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

    if (options.offset !== undefined) {
      const limit = options.limit || 10;
      result = result.slice(options.offset, options.offset + limit);
    } else if (options.limit !== undefined) {
      result = result.slice(0, options.limit);
    }

    return result;
  }

    try {
      const supabase = await createClient();
      let query = supabase
        .from('articles')
        .select('*, categories!inner(name, slug)');

      if (options.categorySlug) {
        query = query.eq('categories.slug', options.categorySlug);
      } else if (options.categoryId) {
        query = query.eq('category_id', options.categoryId);
      }

      if (options.search) {
        query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
      }

      query = query.eq('status', 'published');

      query = query.order('published_at', { ascending: false });

      if (options.limit) {
        query = query.limit(options.limit);
      }

      if (options.offset !== undefined) {
        query = query.range(options.offset, options.offset + (options.limit ?? 10) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.warn('Error fetching articles, falling back to mock data:', error.message || error);
        return getArticlesFallback(options);
      }

      return (data || []).map((art: any) => ({
        id: art.id,
        title: art.title,
        slug: art.slug,
        excerpt: art.excerpt,
        content: art.content,
        image_url: art.image_url,
        category_id: art.category_id,
        author: art.author,
        published_at: art.published_at,
        view_count: art.view_count,
        is_featured: art.is_featured,
        is_breaking: art.is_breaking,
        reading_time_minutes: art.reading_time_minutes,
        created_at: art.created_at,
        category_name: art.categories?.name || 'Uncategorized',
      }));
    } catch (err: any) {
      console.warn('Error fetching articles, falling back to mock data:', err.message || err);
      return getArticlesFallback(options);
    }
}

// Fallback helper for getArticles
function getArticlesFallback(options: GetArticlesOptions): Article[] {
  let result = [...MOCK_ARTICLES];

  if (options.categoryId) {
    result = result.filter(art => art.category_id === options.categoryId);
  }

  if (options.categorySlug) {
    const category = MOCK_CATEGORIES.find(c => c.slug === options.categorySlug);
    if (category) {
      result = result.filter(art => art.category_id === category.id);
    } else {
      return [];
    }
  }

  if (options.search) {
    const q = options.search.toLowerCase();
    result = result.filter(art => 
      art.title.toLowerCase().includes(q) || 
      art.content.toLowerCase().includes(q)
    );
  }

  result.sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime());

  if (options.offset !== undefined) {
    const limit = options.limit || 10;
    result = result.slice(options.offset, options.offset + limit);
  } else if (options.limit !== undefined) {
    result = result.slice(0, options.limit);
  }

  return result;
}

export async function getFeaturedArticles(): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_ARTICLES
      .filter(art => art.is_featured)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 3);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(name)')
      .eq('is_featured', true)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.warn('Error fetching featured articles, falling back to mock data:', error.message || error);
      return MOCK_ARTICLES.filter(art => art.is_featured).slice(0, 3);
    }

    return (data || []).map((art: any) => ({
      id: art.id,
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt,
      content: art.content,
      image_url: art.image_url,
      category_id: art.category_id,
      author: art.author,
      published_at: art.published_at,
      view_count: art.view_count,
      is_featured: art.is_featured,
      is_breaking: art.is_breaking,
      reading_time_minutes: art.reading_time_minutes,
      created_at: art.created_at,
      category_name: art.categories?.name || 'Uncategorized',
    }));
  } catch (err: any) {
    console.warn('Error fetching featured articles, falling back to mock data:', err.message || err);
    return MOCK_ARTICLES.filter(art => art.is_featured).slice(0, 3);
  }
}

export async function getArticle(id: number): Promise<Article | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_ARTICLES.find(art => art.id === id) || null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(name, slug)')
      .eq('id', id)
      .single();

    if (error) {
      console.warn(`Error fetching article ${id}, falling back to mock data:`, error.message || error);
      return MOCK_ARTICLES.find(art => art.id === id) || null;
    }

    return {
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      image_url: data.image_url,
      category_id: data.category_id,
      author: data.author,
      published_at: data.published_at,
      view_count: data.view_count,
      is_featured: data.is_featured,
      is_breaking: data.is_breaking,
      reading_time_minutes: data.reading_time_minutes,
      created_at: data.created_at,
      status: data.status || 'published',
      category_name: data.categories?.name || 'Uncategorized',
      category_slug: data.categories?.slug || undefined,
    };
  } catch (err: any) {
    console.warn(`Error fetching article ${id}, falling back to mock data:`, err.message || err);
    return MOCK_ARTICLES.find(art => art.id === id) || null;
  }
}

export async function getTopArticlesByCategory(): Promise<Map<string, Article>> {
  const result = new Map<string, Article>();

  if (!isSupabaseConfigured()) {
    for (const cat of MOCK_CATEGORIES) {
      const top = MOCK_ARTICLES
        .filter(a => a.category_id === cat.id)
        .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())[0];
      if (top) result.set(cat.slug, top);
    }
    return result;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories!inner(name, slug)')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (error) {
      console.warn('Error fetching top articles by category:', error.message || error);
      return result;
    }

    const seen = new Set<number>();
    for (const art of (data || [])) {
      const slug = art.categories?.slug;
      if (slug && !seen.has(art.category_id)) {
        seen.add(art.category_id);
        result.set(slug, {
          id: art.id,
          title: art.title,
          slug: art.slug,
          excerpt: art.excerpt,
          content: art.content,
          image_url: art.image_url,
          category_id: art.category_id,
          author: art.author,
          published_at: art.published_at,
          view_count: art.view_count,
          is_featured: art.is_featured,
          is_breaking: art.is_breaking,
          reading_time_minutes: art.reading_time_minutes,
          created_at: art.created_at,
          category_name: art.categories?.name || 'Uncategorized',
        });
      }
    }
    return result;
  } catch (err: any) {
    console.warn('Error fetching top articles by category:', err.message || err);
    return result;
  }
}

export async function getRelatedArticles(id: number): Promise<Article[]> {
  if (!isSupabaseConfigured()) {
    const article = MOCK_ARTICLES.find(art => art.id === id);
    if (!article) return [];
    return MOCK_ARTICLES
      .filter(art => art.category_id === article.category_id && art.id !== id)
      .sort((a, b) => new Date(b.published_at).getTime() - new Date(a.published_at).getTime())
      .slice(0, 3);
  }

  try {
    const supabase = await createClient();
    const article = await getArticle(id);
    if (!article) return [];

    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(name)')
      .eq('category_id', article.category_id)
      .neq('id', id)
      .eq('status', 'published')
      .order('published_at', { ascending: false })
      .limit(3);

    if (error) {
      console.warn(`Error fetching related articles for ${id}, falling back to mock data:`, error.message || error);
      return MOCK_ARTICLES
        .filter(art => art.category_id === article.category_id && art.id !== id)
        .slice(0, 3);
    }

    return (data || []).map((art: any) => ({
      id: art.id,
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt,
      content: art.content,
      image_url: art.image_url,
      category_id: art.category_id,
      author: art.author,
      published_at: art.published_at,
      view_count: art.view_count,
      is_featured: art.is_featured,
      is_breaking: art.is_breaking,
      reading_time_minutes: art.reading_time_minutes,
      created_at: art.created_at,
      category_name: art.categories?.name || 'Uncategorized',
    }));
  } catch (err: any) {
    console.warn(`Error fetching related articles for ${id}, falling back to mock data:`, err.message || err);
    return [];
  }
}

export async function getTrendingArticles(options: { limit?: number; offset?: number } = {}): Promise<Article[]> {
  const limit = options.limit ?? 10;
  const offset = options.offset ?? 0;

  if (!isSupabaseConfigured()) {
    return [...MOCK_ARTICLES]
      .sort((a, b) => b.view_count - a.view_count)
      .slice(offset, offset + limit);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('*, categories(name)')
      .eq('status', 'published')
      .order('view_count', { ascending: false })
      .order('published_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.warn('Error fetching trending articles, falling back to mock data:', error.message || error);
      return [...MOCK_ARTICLES].sort((a, b) => b.view_count - a.view_count).slice(offset, offset + limit);
    }

    return (data || []).map((art: any) => ({
      id: art.id,
      title: art.title,
      slug: art.slug,
      excerpt: art.excerpt,
      content: art.content,
      image_url: art.image_url,
      category_id: art.category_id,
      author: art.author,
      published_at: art.published_at,
      view_count: art.view_count,
      is_featured: art.is_featured,
      is_breaking: art.is_breaking,
      reading_time_minutes: art.reading_time_minutes,
      created_at: art.created_at,
      category_name: art.categories?.name || 'Uncategorized',
    }));
  } catch (err: any) {
    console.warn('Error fetching trending articles, falling back to mock data:', err.message || err);
    return [...MOCK_ARTICLES].sort((a, b) => b.view_count - a.view_count).slice(offset, offset + limit);
  }
}

export async function countTrendingArticles(): Promise<number> {
  if (!isSupabaseConfigured()) {
    return MOCK_ARTICLES.length;
  }

  try {
    const supabase = await createClient();
    const { count, error } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    if (error) {
      console.warn('Error counting trending articles:', error.message || error);
      return MOCK_ARTICLES.length;
    }
    return count ?? 0;
  } catch (err: any) {
    console.warn('Error counting trending articles:', err.message || err);
    return MOCK_ARTICLES.length;
  }
}

export async function createArticle(article: Omit<Article, 'id' | 'view_count' | 'created_at' | 'published_at'>) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('articles')
    .insert([
      {
        title: article.title,
        slug: article.slug,
        excerpt: article.excerpt,
        content: article.content,
        image_url: article.image_url,
        category_id: article.category_id,
        author: article.author,
        is_featured: article.is_featured,
        is_breaking: article.is_breaking,
        reading_time_minutes: article.reading_time_minutes,
      },
    ])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateArticle(
  id: number,
  article: Partial<Omit<Article, 'id' | 'view_count' | 'created_at' | 'published_at'>>
) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('articles')
    .update(article)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteArticle(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}

// SUPABASE DASHBOARD: Run this SQL function before using incrementViewCount
// CREATE OR REPLACE FUNCTION increment_view_count(article_id bigint)
// RETURNS articles AS $$
//   UPDATE articles SET view_count = view_count + 1
//   WHERE id = article_id RETURNING *;
// $$ LANGUAGE sql;
export async function incrementViewCount(id: number): Promise<Article | null> {
  if (!isSupabaseConfigured()) {
    const art = MOCK_ARTICLES.find(a => a.id === id);
    if (art) {
      art.view_count += 1;
    }
    return art ?? null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase.rpc('increment_view_count', { article_id: id });

    if (error) {
      console.error(`Error incrementing view count for article ${id}:`, error.message || error);
      return null;
    }

    return data ?? null;
  } catch (err: any) {
    console.error(`Error incrementing view count for article ${id}:`, err.message || err);
    return null;
  }
}

interface CountArticlesOptions {
  categorySlug?: string;
  categoryId?: number;
  search?: string;
}

export async function countArticles(options: CountArticlesOptions = {}): Promise<number> {
  if (!isSupabaseConfigured()) {
    let result = [...MOCK_ARTICLES];
    if (options.categorySlug) {
      const category = MOCK_CATEGORIES.find(c => c.slug === options.categorySlug);
      if (!category) return 0;
      result = result.filter(art => art.category_id === category.id);
    } else if (options.categoryId) {
      result = result.filter(art => art.category_id === options.categoryId);
    }
    if (options.search) {
      const q = options.search.toLowerCase();
      result = result.filter(art =>
        art.title.toLowerCase().includes(q) || art.content.toLowerCase().includes(q)
      );
    }
    return result.length;
  }

  try {
    const supabase = await createClient();
    let query = supabase
      .from('articles')
      .select('*, categories!inner(name, slug)', { count: 'exact', head: true });

    if (options.categorySlug) {
      query = query.eq('categories.slug', options.categorySlug);
    } else if (options.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }

    query = query.eq('status', 'published');

    if (options.search) {
      query = query.or(`title.ilike.%${options.search}%,content.ilike.%${options.search}%`);
    }

    const { count, error } = await query;
    if (error) {
      console.warn('Error counting articles:', error.message || error);
      return 0;
    }
    return count ?? 0;
  } catch (err: any) {
    console.warn('Error counting articles:', err.message || err);
    return 0;
  }
}

export async function getStatsSummary(): Promise<StatsSummary> {
  if (!isSupabaseConfigured()) {
    return {
      totalArticles: MOCK_ARTICLES.length,
      totalViews: MOCK_ARTICLES.reduce((sum, art) => sum + art.view_count, 0),
      totalCategories: MOCK_CATEGORIES.length,
      todayArticles: MOCK_ARTICLES.filter(art => {
        const publishedDate = new Date(art.published_at);
        const diffTime = Math.abs(new Date().getTime() - publishedDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 1;
      }).length,
    };
  }

  try {
    const supabase = await createClient();
    
    const { count: totalArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published');

    const { count: totalCategories } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true });

    const { data: viewsData } = await supabase
      .from('articles')
      .select('view_count')
      .eq('status', 'published');
    
    const totalViews = (viewsData || []).reduce((sum, item) => sum + (item.view_count || 0), 0);

    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);
    
    const { count: todayArticles } = await supabase
      .from('articles')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .gte('published_at', oneDayAgo.toISOString());

    return {
      totalArticles: totalArticles || 0,
      totalViews: totalViews || 0,
      totalCategories: totalCategories || 0,
      todayArticles: todayArticles || 0,
    };
  } catch (err: any) {
    console.warn('Error fetching stats, falling back to mock data:', err.message || err);
    return {
      totalArticles: MOCK_ARTICLES.length,
      totalViews: MOCK_ARTICLES.reduce((sum, art) => sum + art.view_count, 0),
      totalCategories: MOCK_CATEGORIES.length,
      todayArticles: 1,
    };
  }
}
