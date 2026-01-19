import { NextResponse } from 'next/server';
import { db } from '@/db';
import { media } from '@/db/schema';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    // Get all unique tags from the media table
    const result = await db
      .select({ tags: media.tags })
      .from(media)
      .where(sql`${media.tags} IS NOT NULL`);

    // Flatten and dedupe all tags
    const allTags = new Set<string>();
    for (const row of result) {
      if (row.tags) {
        for (const tag of row.tags) {
          if (tag) allTags.add(tag);
        }
      }
    }

    // Sort alphabetically
    const sortedTags = Array.from(allTags).sort((a, b) => 
      a.toLowerCase().localeCompare(b.toLowerCase())
    );

    return NextResponse.json({ tags: sortedTags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    return NextResponse.json({ tags: [] });
  }
}
