import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/queries/mockData";

function slugify(title: string) {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-");
}

function estimateReadTime(content: string): number {
  const text = content.replace(/<[^>]*>/g, "");
  const words = text.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

async function trySupabasePublish(body: any) {
  const supabase = createAdminClient();
  const { title, content, excerpt, category_slug, author, image_url, is_featured, is_breaking, status } = body;

  const { data: category, error: catError } = await supabase
    .from("categories")
    .select("id, slug")
    .eq("slug", category_slug)
    .maybeSingle();

  if (catError) throw new Error(`Supabase category error: ${catError.message}`);
  if (!category) throw new Error(`Kategori '${category_slug}' tidak ditemukan`);

  const slug = slugify(title);

  const { data: existing } = await supabase
    .from("articles")
    .select("id, slug")
    .eq("slug", slug)
    .maybeSingle();

  if (existing) throw new Error(`Slug '${slug}' sudah dipakai`);

  const isPublished = status === 'published';

  const article: any = {
    title,
    slug,
    content,
    excerpt: excerpt ?? content.replace(/<[^>]*>/g, "").slice(0, 160),
    image_url: image_url ?? null,
    image_caption: body.image_caption || null,
    category_id: category.id,
    author,
    is_featured,
    is_breaking,
    reading_time_minutes: estimateReadTime(content),
    status: isPublished ? 'published' : 'draft',
  };

  if (isPublished) {
    article.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase.from("articles").insert(article).select().single();
  if (error) throw new Error(`Supabase insert error: ${error.message}`);

  return data;
}

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.HERMES_PUBLISH_KEY}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    content,
    category_slug,
    author = "NGN Editorial",
    status = "draft",
  } = body;

  const missing = ["title", "content", "category_slug"].filter((k) => !body[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Field wajib kosong: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi. Set NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, dan SUPABASE_SERVICE_ROLE_KEY di Vercel Environment Variables." },
      { status: 500 }
    );
  }

  let result;
  try {
    result = await trySupabasePublish(body);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: result.id,
    slug: result.slug,
    status: result.status || status,
    url: result.status === 'published'
      ? `${process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/article/${result.id}/${result.slug}`
      : null,
    draft_url: `/admin/articles/edit/${result.id}`,
  });
}
