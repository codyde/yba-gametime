import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { games } from '@/db/schema';
import { eq } from 'drizzle-orm';

// GET a single game
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const [game] = await db
      .select()
      .from(games)
      .where(eq(games.id, id));

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    // Transform to match the frontend Game type
    const transformedGame = {
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
    };

    return NextResponse.json(transformedGame);
  } catch (error) {
    console.error('Failed to fetch game:', error);
    return NextResponse.json({ error: 'Failed to fetch game' }, { status: 500 });
  }
}

// PUT update a game
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    await db
      .update(games)
      .set({
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
        updatedAt: new Date(),
      })
      .where(eq(games.id, id));

    return NextResponse.json({ id, ...body });
  } catch (error) {
    console.error('Failed to update game:', error);
    return NextResponse.json({ error: 'Failed to update game' }, { status: 500 });
  }
}

// DELETE a game
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await db.delete(games).where(eq(games.id, id));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete game:', error);
    return NextResponse.json({ error: 'Failed to delete game' }, { status: 500 });
  }
}
