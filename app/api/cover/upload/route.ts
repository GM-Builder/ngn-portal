import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// POST /api/cover/upload
// Accepts: multipart/form-data with 'file' (File) OR 'url' (string)
// Returns: { url: string } - public URL of uploaded image

export async function POST(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const expected = `Bearer ${process.env.HERMES_PUBLISH_KEY}`;

  if (authHeader !== expected) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const url = formData.get('url') as string | null;

    let imageBuffer: ArrayBuffer;
    let contentType: string;
    let ext: string;

    if (file) {
      // Direct file upload
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        return NextResponse.json(
          { error: 'File type not allowed. Use JPG, PNG, WEBP or GIF.' },
          { status: 400 }
        );
      }

      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
      }

      imageBuffer = await file.arrayBuffer();
      contentType = file.type;
      ext = file.name.split('.').pop()?.toLowerCase() ?? 'jpg';
    } else if (url) {
      // Download from URL
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return NextResponse.json(
          { error: `Failed to download image: ${response.status} ${response.statusText}` },
          { status: 400 }
        );
      }

      const downloadedContentType = response.headers.get('content-type');
      if (!downloadedContentType?.startsWith('image/')) {
        return NextResponse.json(
          { error: 'URL does not point to an image file' },
          { status: 400 }
        );
      }

      imageBuffer = await response.arrayBuffer();
      contentType = downloadedContentType;
      ext = contentType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
    } else {
      return NextResponse.json(
        { error: 'Provide either "file" (upload) or "url" (download)' },
        { status: 400 }
      );
    }

    // Upload to Supabase Storage
    const supabase = createAdminClient();
    const fileName = `covers/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`;
    const buffer = new Uint8Array(imageBuffer);

    const { error: uploadError } = await supabase.storage
      .from('article-images')
      .upload(fileName, buffer, {
        contentType,
        upsert: false,
      });

    if (uploadError) {
      console.error('Cover upload error:', uploadError.message);
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    const { data } = supabase.storage.from('article-images').getPublicUrl(fileName);

    return NextResponse.json({
      url: data.publicUrl,
      contentType,
      size: buffer.length,
    });
  } catch (error) {
    console.error('Cover upload API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
