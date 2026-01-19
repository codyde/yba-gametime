import { ImageResponse } from 'next/og';
import { db } from '@/db';
import { games } from '@/db/schema';
import { eq } from 'drizzle-orm';

export const runtime = 'nodejs';
export const alt = 'Game Scorecard';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Fetch game data
  const gameData = await db
    .select()
    .from(games)
    .where(eq(games.id, id))
    .limit(1);

  const game = gameData[0];

  if (!game) {
    // Return a default image if game not found
    return new ImageResponse(
      (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%',
            backgroundColor: '#0a0a0a',
            color: 'white',
            fontSize: 48,
            fontWeight: 'bold',
          }}
        >
          GirlsGotGame
        </div>
      ),
      { ...size }
    );
  }

  const isCompleted = game.status === 'completed';
  const homeWon = isCompleted && (game.homeTeamScore ?? 0) > (game.awayTeamScore ?? 0);
  const awayWon = isCompleted && (game.awayTeamScore ?? 0) > (game.homeTeamScore ?? 0);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          position: 'relative',
        }}
      >
        {/* Background */}
        {game.backgroundImage ? (
          <img
            src={game.backgroundImage}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
            }}
          />
        ) : null}
        
        {/* Overlay */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            background: game.backgroundImage 
              ? 'linear-gradient(to bottom, rgba(0,0,0,0.7), rgba(0,0,0,0.85))'
              : '#0a0a0a',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            height: '100%',
            padding: 60,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {/* Header */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 40,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span style={{ color: '#ec4899', fontSize: 32, fontWeight: 'bold' }}>
                GirlsGotGame
              </span>
              <span style={{ color: 'rgba(255,255,255,0.6)', fontSize: 24 }}>
                {game.sport === 'football' ? 'Football' : 'Basketball'}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                padding: '8px 20px',
                borderRadius: 20,
                backgroundColor: isCompleted ? 'rgba(255,255,255,0.2)' : '#ec4899',
                color: 'white',
                fontSize: 20,
                fontWeight: 'bold',
              }}
            >
              {isCompleted ? 'FINAL' : game.status === 'live' ? 'LIVE' : 'UPCOMING'}
            </div>
          </div>

          {/* Scorecard */}
          <div
            style={{
              display: 'flex',
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 80,
            }}
          >
            {/* Home Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 64,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {game.homeTeamAbbreviation}
              </span>
              <span
                style={{
                  fontSize: 24,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {game.homeTeamName}
              </span>
              {isCompleted && (
                <span
                  style={{
                    fontSize: 96,
                    fontWeight: 'bold',
                    color: homeWon ? '#ec4899' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {game.homeTeamScore}
                </span>
              )}
            </div>

            {/* VS / Divider */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 20,
              }}
            >
              <div
                style={{
                  width: 2,
                  height: 60,
                  background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent)',
                }}
              />
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 'bold',
                  color: 'rgba(255,255,255,0.5)',
                  padding: '12px 24px',
                  borderRadius: 30,
                  backgroundColor: 'rgba(255,255,255,0.1)',
                }}
              >
                {isCompleted ? 'FINAL' : 'VS'}
              </span>
              <div
                style={{
                  width: 2,
                  height: 60,
                  background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.3), transparent)',
                }}
              />
            </div>

            {/* Away Team */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 16,
              }}
            >
              <span
                style={{
                  fontSize: 64,
                  fontWeight: 'bold',
                  color: 'white',
                }}
              >
                {game.awayTeamAbbreviation}
              </span>
              <span
                style={{
                  fontSize: 24,
                  color: 'rgba(255,255,255,0.7)',
                }}
              >
                {game.awayTeamName}
              </span>
              {isCompleted && (
                <span
                  style={{
                    fontSize: 96,
                    fontWeight: 'bold',
                    color: awayWon ? '#ec4899' : 'rgba(255,255,255,0.5)',
                  }}
                >
                  {game.awayTeamScore}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 40,
              color: 'rgba(255,255,255,0.6)',
              fontSize: 22,
            }}
          >
            <span>{formatDate(game.date)}</span>
            <span>•</span>
            <span>{game.time}</span>
            <span>•</span>
            <span>{game.location}</span>
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}
