import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { media } from '@/db/schema';
import { eq } from 'drizzle-orm';

// PUT update media (caption, tags, etc.)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {};
    if (body.caption !== undefined) updateData.caption = body.caption ?? null;
    if (body.thumbnail !== undefined) updateData.thumbnail = body.thumbnail ?? null;
    if (body.tags !== undefined) updateData.tags = body.tags ?? null;

    await db
      .update(media)
      .set(updateData)
      .where(eq(media.id, id));

    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Failed to update media:', error);
    return NextResponse.json({ error: 'Failed to update media' }, { status: 500 });
  }
}

// DELETE media
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(media).where(eq(media.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete media:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
