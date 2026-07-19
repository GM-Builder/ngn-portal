import { NextResponse } from 'next/server';
import { incrementViewCount } from '@/lib/queries/articles';

// In-memory rate limit store: key = "ip:articleId", value = timestamp of last request
const rateLimitMap = new Map<string, number>();
const WINDOW_MS = 60_000; // 60 seconds

// Periodically purge expired entries to prevent unbounded memory growth in production.
// Runs every 5 minutes and removes entries older than the rate-limit window.
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, ts] of rateLimitMap) {
    if (ts < cutoff) rateLimitMap.delete(key);
  }
}, 5 * 60_000);

function isRateLimited(ip: string, articleId: number): boolean {
  const key = `${ip}:${articleId}`;
  const lastRequest = rateLimitMap.get(key);

  if (lastRequest !== undefined && Date.now() - lastRequest < WINDOW_MS) {
    return true;
  }

  rateLimitMap.set(key, Date.now());
  return false;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const articleId = Number(id);

  if (isNaN(articleId)) {
    return NextResponse.json({ error: 'Invalid article ID' }, { status: 400 });
  }

  // Extract client IP from X-Forwarded-For header (first IP) or fallback to 'unknown'
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';

  if (isRateLimited(ip, articleId)) {
    return NextResponse.json({ error: 'Too Many Requests' }, { status: 429 });
  }

  try {
    const result = await incrementViewCount(articleId);

    if (result === null) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Error in view count API:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
