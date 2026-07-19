import { createClient } from '../supabase/server';
import { Category } from '@/types';
import { MOCK_CATEGORIES, isSupabaseConfigured } from './mockData';

export async function getCategories(): Promise<Category[]> {
  if (!isSupabaseConfigured()) {
    return MOCK_CATEGORIES;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*, articles(count)')
      .order('name', { ascending: true });

    if (error) {
      console.warn('Error fetching categories, falling back to mock data:', error.message || error);
      return MOCK_CATEGORIES;
    }

    return (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      created_at: cat.created_at,
      articleCount: cat.articles?.[0]?.count || 0,
    }));
  } catch (err: any) {
    console.warn('Error fetching categories, falling back to mock data:', err.message || err);
    return MOCK_CATEGORIES;
  }
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  if (!isSupabaseConfigured()) {
    return MOCK_CATEGORIES.find(c => c.slug === slug) || null;
  }

  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.warn(`Error fetching category with slug ${slug}, falling back to mock data:`, error.message || error);
      return MOCK_CATEGORIES.find(c => c.slug === slug) || null;
    }

    return data;
  } catch (err: any) {
    console.warn(`Error fetching category with slug ${slug}, falling back to mock data:`, err.message || err);
    return MOCK_CATEGORIES.find(c => c.slug === slug) || null;
  }
}

export async function createCategory(name: string, slug: string, description: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .insert([{ name, slug, description }])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(id: number, name: string, slug: string, description: string | null) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('categories')
    .update({ name, slug, description })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
