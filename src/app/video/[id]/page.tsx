import { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/db";
import { media, games, users } from "@/db/schema";
import { eq } from "drizzle-orm";
import { VideoPageClient } from "./VideoPageClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getMedia(id: string) {
  const result = await db
    .select({
      media: media,
      game: games,
      uploader: users,
    })
    .from(media)
    .leftJoin(games, eq(media.gameId, games.id))
    .leftJoin(users, eq(media.uploaderId, users.id))
    .where(eq(media.id, id))
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  const item = result[0];
  return {
    id: item.media.id,
    type: item.media.type,
    url: item.media.url,
    thumbnail: item.media.thumbnail,
    caption: item.media.caption,
    tags: item.media.tags,
    uploaderId: item.media.uploaderId,
    uploaderName: item.uploader?.name ?? item.media.uploader,
    uploaderImage: item.uploader?.image,
    uploadedAt: item.media.uploadedAt.toISOString(),
    game: item.game ? {
      id: item.game.id,
      homeTeamName: item.game.homeTeamName,
      awayTeamName: item.game.awayTeamName,
      homeTeamAbbreviation: item.game.homeTeamAbbreviation,
      awayTeamAbbreviation: item.game.awayTeamAbbreviation,
      date: item.game.date,
      sport: item.game.sport,
    } : null,
  };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const mediaItem = await getMedia(id);

  if (!mediaItem) {
    return {
      title: "Video Not Found",
    };
  }

  const title = mediaItem.caption || (mediaItem.game 
    ? `${mediaItem.game.homeTeamAbbreviation} vs ${mediaItem.game.awayTeamAbbreviation}` 
    : "Video Clip");

  return {
    title: `${title} | YBA Gametime`,
    description: mediaItem.caption || `Watch this ${mediaItem.type} from YBA Gametime`,
    openGraph: {
      title,
      description: mediaItem.caption || `Watch this ${mediaItem.type} from YBA Gametime`,
      type: mediaItem.type === "video" ? "video.other" : "article",
      images: mediaItem.thumbnail ? [{ url: mediaItem.thumbnail }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description: mediaItem.caption || `Watch this ${mediaItem.type} from YBA Gametime`,
      images: mediaItem.thumbnail ? [mediaItem.thumbnail] : undefined,
    },
  };
}

export default async function VideoPage({ params }: PageProps) {
  const { id } = await params;
  const mediaItem = await getMedia(id);

  if (!mediaItem) {
    notFound();
  }

  return <VideoPageClient media={mediaItem} />;
}
