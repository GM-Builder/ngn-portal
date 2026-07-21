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

function checkAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get("authorization") || "";
  const expected = `Bearer ${process.env.HERMES_PUBLISH_KEY}`;
  return authHeader === expected;
}

// DELETE /api/articles/[id]
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi" },
      { status: 500 }
    );
  }

  const { id } = await params;
  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  try {
    const supabase = createAdminClient();

    // Check if article exists
    const { data: existing, error: fetchError } = await supabase
      .from("articles")
      .select("id, title")
      .eq("id", articleId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    // Delete the article
    const { error: deleteError } = await supabase
      .from("articles")
      .delete()
      .eq("id", articleId);

    if (deleteError) {
      return NextResponse.json({ error: `Gagal hapus: ${deleteError.message}` }, { status: 500 });
    }

    // Also delete related breaking news references
    await supabase
      .from("breaking_news")
      .update({ article_id: null })
      .eq("article_id", articleId);

    return NextResponse.json({
      ok: true,
      message: `Artikel '${existing.title}' berhasil dihapus`,
      id: articleId,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// PUT /api/articles/[id]
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!checkAuth(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json(
      { error: "Supabase belum dikonfigurasi" },
      { status: 500 }
    );
  }

  const { id } = await params;
  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  const body = await req.json();
  const { title, content, excerpt, category_slug, author, image_url, is_featured, is_breaking, reading_time_minutes, status } = body;

  try {
    const supabase = createAdminClient();

    // Check if article exists
    const { data: existing, error: fetchError } = await supabase
      .from("articles")
      .select("id, title, slug, status")
      .eq("id", articleId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    // Build update object
    const updateData: any = {};

    if (title !== undefined) {
      updateData.title = title;
      updateData.slug = slugify(title);
    }
    if (content !== undefined) {
      updateData.content = content;
      if (reading_time_minutes === undefined) {
        updateData.reading_time_minutes = estimateReadTime(content);
      }
    }
    if (excerpt !== undefined) updateData.excerpt = excerpt;
    if (author !== undefined) updateData.author = author;
    if (image_url !== undefined) updateData.image_url = image_url;
    if (is_featured !== undefined) updateData.is_featured = is_featured;
    if (is_breaking !== undefined) updateData.is_breaking = is_breaking;
    if (reading_time_minutes !== undefined) updateData.reading_time_minutes = reading_time_minutes;
    if (status !== undefined) {
      updateData.status = status;
      if (status === 'published' && existing.status !== 'published') {
        updateData.published_at = new Date().toISOString();
      }
    }

    // Handle category_slug -> category_id
    if (category_slug !== undefined) {
      const { data: category, error: catError } = await supabase
        .from("categories")
        .select("id")
        .eq("slug", category_slug)
        .single();

      if (catError || !category) {
        return NextResponse.json({ error: `Kategori '${category_slug}' tidak ditemukan` }, { status: 400 });
      }
      updateData.category_id = category.id;
    }

    // Check slug uniqueness if title changed
    if (updateData.slug && updateData.slug !== existing.slug) {
      const { data: slugCheck } = await supabase
        .from("articles")
        .select("id")
        .eq("slug", updateData.slug)
        .neq("id", articleId)
        .single();

      if (slugCheck) {
        return NextResponse.json({ error: `Slug '${updateData.slug}' sudah dipakai` }, { status: 409 });
      }
    }

    // Update the article
    const { data, error: updateError } = await supabase
      .from("articles")
      .update(updateData)
      .eq("id", articleId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: `Gagal update: ${updateError.message}` }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      message: `Artikel '${data.title}' berhasil diupdate`,
      id: data.id,
      slug: data.slug,
      status: data.status,
      url: data.status === 'published'
        ? `${process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")}/article/${data.id}/${data.slug}`
        : null,
      draft_url: `/admin/articles/edit/${data.id}`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// GET /api/articles/[id] - Get single article
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = parseInt(id);
  if (isNaN(articleId)) {
    return NextResponse.json({ error: "ID tidak valid" }, { status: 400 });
  }

  if (!isSupabaseConfigured() || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Supabase belum dikonfigurasi" }, { status: 500 });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("articles")
      .select("*, categories(name, slug)")
      .eq("id", articleId)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Artikel tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      id: data.id,
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt,
      content: data.content,
      image_url: data.image_url,
      category_id: data.category_id,
      category_name: data.categories?.name,
      category_slug: data.categories?.slug,
      author: data.author,
      published_at: data.published_at,
      view_count: data.view_count,
      is_featured: data.is_featured,
      is_breaking: data.is_breaking,
      reading_time_minutes: data.reading_time_minutes,
      created_at: data.created_at,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
