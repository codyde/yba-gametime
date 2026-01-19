import { NextRequest, NextResponse } from 'next/server';
import { deleteObject, getKeyFromUrl } from '@/lib/r2';

// POST - Delete a file from R2
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url, key } = body;

    // Get the key either directly or from URL
    const objectKey = key || (url ? getKeyFromUrl(url) : null);

    if (!objectKey) {
      return NextResponse.json(
        { error: 'key or url is required' },
        { status: 400 }
      );
    }

    await deleteObject(objectKey);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete file:', error);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}
