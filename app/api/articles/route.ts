import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import fs from "fs";
import path from "path";

const DATA_FILE = path.join(process.cwd(), ".local-articles.json");

const LOCAL_CATEGORIES: Record<string, { id: number; name: string }> = {
  politik: { id: 1, name: "Politik" },
  bisnis: { id: 2, name: "Bisnis" },
  teknologi: { id: 3, name: "Teknologi" },
  hiburan: { id: 4, name: "Hiburan" },
  olahraga: { id: 5, name: "Olahraga" },
};

function readLocalArticles(): any[] {
  try {
    if (fs.existsSync(DATA_FILE)) {
      return JSON.parse(fs.readFileSync(DATA_FILE, "utf-8"));
    }
  } catch {}
  return [];
}

function writeLocalArticles(articles: any[]) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(articles, null, 2), "utf-8");
}

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

  const article = {
    title,
    slug,
    content,
    excerpt: excerpt ?? content.replace(/<[^>]*>/g, "").slice(0, 160),
    image_url: image_url ?? null,
    category_id: category.id,
    author,
    is_featured,
    is_breaking,
    reading_time_minutes: estimateReadTime(content),
    published_at: status === "published" ? new Date().toISOString() : null,
  };

  const { data, error } = await supabase.from("articles").insert(article).select().single();
  if (error) throw new Error(`Supabase insert error: ${error.message}`);

  return data;
}

function localPublish(body: any) {
  const { title, content, excerpt, category_slug, author, image_url, is_featured, is_breaking, status } = body;

  const category = LOCAL_CATEGORIES[category_slug];
  if (!category) {
    throw new Error(`Kategori '${category_slug}' tidak ditemukan. Gunakan: ${Object.keys(LOCAL_CATEGORIES).join(", ")}`);
  }

  const slug = slugify(title);
  const articles = readLocalArticles();
  if (articles.find((a) => a.slug === slug)) {
    throw new Error(`Slug '${slug}' sudah dipakai artikel lain`);
  }

  const newId = articles.length > 0 ? Math.max(...articles.map((a) => a.id)) + 1 : 11;
  const article = {
    id: newId,
    title,
    slug,
    content,
    excerpt: excerpt ?? content.replace(/<[^>]*>/g, "").slice(0, 160),
    image_url: image_url ?? null,
    category_id: category.id,
    author,
    is_featured,
    is_breaking,
    reading_time_minutes: estimateReadTime(content),
    published_at: new Date().toISOString(),
    view_count: 0,
    created_at: new Date().toISOString(),
  };

  articles.push(article);
  writeLocalArticles(articles);
  return article;
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
    status = "published",
  } = body;

  const missing = ["title", "content", "category_slug"].filter((k) => !body[k]);
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Field wajib kosong: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  let result;
  try {
    result = await trySupabasePublish(body);
  } catch (err: any) {
    console.warn("Supabase publish gagal, fallback ke local storage:", err.message);
    try {
      result = localPublish(body);
    } catch (err2: any) {
      return NextResponse.json({ error: err2.message }, { status: 400 });
    }
  }

  return NextResponse.json({
    ok: true,
    id: result.id,
    slug: result.slug,
    status: status,
    url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/article/${result.id}/${result.slug}`,
  });
}
