import type { MetadataRoute } from 'next';
import { getCategories } from '@/lib/queries/categories';
import { slugify } from '@/lib/utils';
import { createClient } from '@/lib/supabase/server';

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://ngn.id';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages — always included
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${BASE_URL}/trending`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/tentang-kami`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/pedoman-media-siber`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // Category pages — use the shared query layer for consistency
  let categoryPages: MetadataRoute.Sitemap = [];
  try {
    const categories = await getCategories();
    categoryPages = categories.map((cat) => ({
      url: `${BASE_URL}/category/${cat.slug}`,
      lastModified: new Date(),
      changeFrequency: 'hourly' as const,
      priority: 0.8,
    }));
  } catch {
    // Continue without category pages if fetch fails
  }

  // Article pages — fetch minimal fields directly; no need for full Article mapper
  let articlePages: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('articles')
      .select('id, title, slug, published_at')
      .not('published_at', 'is', null)
      .order('published_at', { ascending: false });

    if (!error && data) {
      articlePages = data.map(
        (art: { id: number; title: string; slug: string | null; published_at: string }) => ({
          url: `${BASE_URL}/article/${art.id}/${slugify(art.slug ?? art.title)}`,
          lastModified: new Date(art.published_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        })
      );
    }
  } catch {
    // If articles fetch fails, return only static + category pages (Req. 17.7)
  }

  return [...staticPages, ...categoryPages, ...articlePages];
}
