import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { coverPhotos } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PUT update a cover photo
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await db
      .update(coverPhotos)
      .set({
        url: body.url,
        caption: body.caption ?? null,
        isActive: body.isActive,
        sortOrder: body.sortOrder,
      })
      .where(eq(coverPhotos.id, id));

    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Failed to update cover photo:', error);
    return NextResponse.json({ error: 'Failed to update cover photo' }, { status: 500 });
  }
}

// DELETE a cover photo
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(coverPhotos).where(eq(coverPhotos.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete cover photo:', error);
    return NextResponse.json({ error: 'Failed to delete cover photo' }, { status: 500 });
  }
}
