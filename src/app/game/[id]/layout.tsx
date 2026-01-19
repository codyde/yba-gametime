import { Metadata } from 'next';
import { db } from '@/db';
import { games } from '@/db/schema';
import { eq } from 'drizzle-orm';

type Props = {
  params: Promise<{ id: string }>;
  children: React.ReactNode;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  
  const gameData = await db
    .select()
    .from(games)
    .where(eq(games.id, id))
    .limit(1);

  const game = gameData[0];

  if (!game) {
    return {
      title: 'Game Not Found | GirlsGotGame',
    };
  }

  const title = `${game.homeTeamName} vs ${game.awayTeamName} | GirlsGotGame`;
  const description = game.status === 'completed'
    ? `Final: ${game.homeTeamAbbreviation} ${game.homeTeamScore} - ${game.awayTeamScore} ${game.awayTeamAbbreviation}`
    : `${game.sport === 'football' ? 'Football' : 'Basketball'} game on ${game.date}`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default function GameLayout({ children }: Props) {
  return children;
}
