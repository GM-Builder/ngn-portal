import { createClient } from '../supabase/server';
import { BreakingNews } from '@/types';
import { MOCK_BREAKING_NEWS, isSupabaseConfigured } from './mockData';

export async function getBreakingNews(): Promise<BreakingNews[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_BREAKING_NEWS;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('breaking_news')
      .select('*, articles(title, slug)')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching breaking news, falling back to mock data:', error.message || error);
      return MOCK_BREAKING_NEWS;
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      is_active: item.is_active,
      article_id: item.article_id,
      created_at: item.created_at,
      article_title: item.articles?.title || undefined,
      article_slug: item.articles?.slug || undefined,
    }));
  } catch (err: any) {
    console.warn('Error fetching breaking news, falling back to mock data:', err.message || err);
    return MOCK_BREAKING_NEWS;
  }
}

export async function getActiveBreakingNews(): Promise<BreakingNews[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_BREAKING_NEWS.filter(item => item.is_active);
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('breaking_news')
      .select('*, articles(title, slug)')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('Error fetching active breaking news, falling back to mock data:', error.message || error);
      return MOCK_BREAKING_NEWS.filter(item => item.is_active);
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      text: item.text,
      is_active: item.is_active,
      article_id: item.article_id,
      created_at: item.created_at,
      article_title: item.articles?.title || undefined,
      article_slug: item.articles?.slug || undefined,
    }));
  } catch (err: any) {
    console.warn('Error fetching active breaking news, falling back to mock data:', err.message || err);
    return MOCK_BREAKING_NEWS.filter(item => item.is_active);
  }
}

export async function createBreakingNews(text: string, articleId: number | null, isActive = true) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('breaking_news')
    .insert([{ text, article_id: articleId, is_active: isActive }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateBreakingNews(id: number, text: string, articleId: number | null, isActive: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('breaking_news')
    .update({ text, article_id: articleId, is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function toggleBreakingNews(id: number, isActive: boolean) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('breaking_news')
    .update({ is_active: isActive })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteBreakingNews(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('breaking_news')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
