import { NextRequest, NextResponse } from 'next/server';
import { getUploadUrl, generateUploadKey, getPublicUrl } from '@/lib/r2';

// POST - Get a presigned URL for uploading to R2
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { filename, contentType, folder = 'media' } = body;

    if (!filename || !contentType) {
      return NextResponse.json(
        { error: 'filename and contentType are required' },
        { status: 400 }
      );
    }

    // Validate content type
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/quicktime',
      'video/webm',
    ];

    if (!allowedTypes.includes(contentType)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      );
    }

    // Generate unique key
    const key = generateUploadKey(folder, filename);
    
    // Get presigned upload URL
    const uploadUrl = await getUploadUrl(key, contentType);
    
    // Get the public URL for after upload
    const publicUrl = getPublicUrl(key);

    return NextResponse.json({
      uploadUrl,
      publicUrl,
      key,
    });
  } catch (error) {
    console.error('Failed to generate upload URL:', error);
    return NextResponse.json(
      { error: 'Failed to generate upload URL' },
      { status: 500 }
    );
  }
}
