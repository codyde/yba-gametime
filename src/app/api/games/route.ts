import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { games } from '@/db/schema';
import { desc, sql } from 'drizzle-orm';

// GET all games
export async function GET() {
  try {
    // Get all games with media count using a subquery
    const allGames = await db
      .select({
        id: games.id,
        sport: games.sport,
        status: games.status,
        homeTeamName: games.homeTeamName,
        homeTeamAbbreviation: games.homeTeamAbbreviation,
        homeTeamScore: games.homeTeamScore,
        awayTeamName: games.awayTeamName,
        awayTeamAbbreviation: games.awayTeamAbbreviation,
        awayTeamScore: games.awayTeamScore,
        date: games.date,
        time: games.time,
        location: games.location,
        backgroundImage: games.backgroundImage,
        createdAt: games.createdAt,
        mediaCount: sql<number>`(SELECT COUNT(*) FROM media WHERE media.game_id = ${games.id})`.as('media_count'),
      })
      .from(games)
      .orderBy(desc(games.createdAt));

    // Transform to match the frontend Game type
    const transformedGames = allGames.map((game) => ({
      id: game.id,
      sport: game.sport,
      status: game.status,
      homeTeam: {
        name: game.homeTeamName,
        abbreviation: game.homeTeamAbbreviation,
        score: game.homeTeamScore ?? undefined,
      },
      awayTeam: {
        name: game.awayTeamName,
        abbreviation: game.awayTeamAbbreviation,
        score: game.awayTeamScore ?? undefined,
      },
      date: game.date,
      time: game.time,
      location: game.location,
      backgroundImage: game.backgroundImage ?? undefined,
      mediaCount: Number(game.mediaCount) || 0,
    }));

    return NextResponse.json(transformedGames);
  } catch (error) {
    console.error('Failed to fetch games:', error);
    return NextResponse.json({ error: 'Failed to fetch games' }, { status: 500 });
  }
}

// Helper to generate URL-friendly slug from team name
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 30); // Limit length
}

// POST create a new game
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Generate game ID: date-sport-yba-opponent
    // Format: 2025-01-18-bb-yba-central-hawks
    const sportAbbr = body.sport === 'basketball' ? 'bb' : 'fb';
    const opponentSlug = slugify(body.awayTeam.name);
    const gameId = `${body.date}-${sportAbbr}-yba-${opponentSlug}`;
    
    await db.insert(games).values({
      id: gameId,
      sport: body.sport,
      status: body.status,
      homeTeamName: body.homeTeam.name,
      homeTeamAbbreviation: body.homeTeam.abbreviation,
      homeTeamScore: body.homeTeam.score ?? null,
      awayTeamName: body.awayTeam.name,
      awayTeamAbbreviation: body.awayTeam.abbreviation,
      awayTeamScore: body.awayTeam.score ?? null,
      date: body.date,
      time: body.time,
      location: body.location,
      backgroundImage: body.backgroundImage ?? null,
    });

    return NextResponse.json({ 
      id: gameId,
      ...body,
    }, { status: 201 });
  } catch (error) {
    console.error('Failed to create game:', error);
    return NextResponse.json({ error: 'Failed to create game' }, { status: 500 });
  }
}
