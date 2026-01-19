import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { media } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';

// GET media for a specific game
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');

    if (!gameId) {
      return NextResponse.json({ error: 'gameId is required' }, { status: 400 });
    }

    const mediaItems = await db
      .select()
      .from(media)
      .where(eq(media.gameId, gameId))
      .orderBy(desc(media.uploadedAt));

    // Transform to match the frontend MediaItem type
    const transformedMedia = mediaItems.map((item) => ({
      id: item.id,
      type: item.type,
      url: item.url,
      thumbnail: item.thumbnail ?? undefined,
      caption: item.caption ?? undefined,
      tags: item.tags ?? undefined,
      uploader: item.uploader,
      uploaderId: item.uploaderId ?? undefined,
      uploadedAt: item.uploadedAt.toISOString(),
      gameId: item.gameId,
    }));

    return NextResponse.json(transformedMedia);
  } catch (error) {
    console.error('Failed to fetch media:', error);
    return NextResponse.json({ error: 'Failed to fetch media' }, { status: 500 });
  }
}

// POST create new media
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const mediaId = `media-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    await db.insert(media).values({
      id: mediaId,
      gameId: body.gameId,
      type: body.type,
      url: body.url,
      thumbnail: body.thumbnail ?? null,
      caption: body.caption ?? null,
      tags: body.tags ?? null,
      uploader: body.uploader ?? 'Anonymous',
      uploaderId: body.uploaderId ?? null,
    });

    return NextResponse.json({ 
      id: mediaId,
      ...body,
      uploader: body.uploader ?? 'Anonymous',
      uploadedAt: new Date().toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create media:', error);
    return NextResponse.json({ error: 'Failed to create media' }, { status: 500 });
  }
}
