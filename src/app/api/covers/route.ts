import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { coverPhotos } from '@/db/schema';
import { eq, asc } from 'drizzle-orm';

// GET all active cover photos
export async function GET() {
  try {
    const covers = await db
      .select()
      .from(coverPhotos)
      .where(eq(coverPhotos.isActive, true))
      .orderBy(asc(coverPhotos.sortOrder));

    return NextResponse.json(covers);
  } catch (error) {
    console.error('Failed to fetch cover photos:', error);
    return NextResponse.json({ error: 'Failed to fetch cover photos' }, { status: 500 });
  }
}

// POST create a new cover photo
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const coverId = `cover-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    
    // Get the highest sort order
    const existing = await db
      .select()
      .from(coverPhotos)
      .orderBy(asc(coverPhotos.sortOrder));
    
    const maxOrder = existing.length > 0 
      ? Math.max(...existing.map(c => c.sortOrder)) + 1 
      : 0;

    await db.insert(coverPhotos).values({
      id: coverId,
      url: body.url,
      caption: body.caption ?? null,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? maxOrder,
    });

    return NextResponse.json({ 
      id: coverId,
      url: body.url,
      caption: body.caption,
      isActive: body.isActive ?? true,
      sortOrder: body.sortOrder ?? maxOrder,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create cover photo:', error);
    return NextResponse.json({ error: 'Failed to create cover photo' }, { status: 500 });
  }
}
