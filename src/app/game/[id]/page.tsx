"use client";

import { use, useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { ArrowLeft, Image as ImageIcon, Loader2, Tag, X } from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Scoreboard } from "@/components/Scoreboard";
import { MediaGallery } from "@/components/MediaGallery";
import { MediaUpload } from "@/components/MediaUpload";
import { useGames } from "@/lib/games-context";
import { useMedia } from "@/lib/media-context";
import { useAuth } from "@/lib/auth-context";
import { MediaItem } from "@/lib/types";

interface GamePageProps {
  params: Promise<{ id: string }>;
}

export default function GamePage({ params }: GamePageProps) {
  const { id } = use(params);
  const { games, isLoading: gamesLoading } = useGames();
  const { fetchMediaForGame, updateMedia, deleteMedia } = useMedia();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLoaded, setIsLoaded] = useState(false);
  const [mediaLoading, setMediaLoading] = useState(true);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [selectedTag, setSelectedTag] = useState<string>("");

  const game = games.find((g) => g.id === id);

  // Get all unique tags from media items
  const availableTags = useMemo(() => {
    const tagSet = new Set<string>();
    mediaItems.forEach((item) => {
      item.tags?.forEach((tag) => tagSet.add(tag));
    });
    return Array.from(tagSet).sort();
  }, [mediaItems]);

  // Filter media by selected tag
  const filteredMediaItems = useMemo(() => {
    if (!selectedTag) return mediaItems;
    return mediaItems.filter((item) => item.tags?.includes(selectedTag));
  }, [mediaItems, selectedTag]);

  const toggleTagFilter = (tag: string) => {
    setSelectedTag((prev) => (prev === tag ? "" : tag));
  };

  const clearTagFilters = () => setSelectedTag("");

  // Fetch media for this game
  useEffect(() => {
    const loadMedia = async () => {
      setMediaLoading(true);
      const items = await fetchMediaForGame(id);
      setMediaItems(items);
      setMediaLoading(false);
    };
    loadMedia();
  }, [id, fetchMediaForGame]);

  // Animation on mount
  useEffect(() => {
    const timer = setTimeout(() => setIsLoaded(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // Handle upload complete - just refresh from database
  // MediaUpload already saves to database, so we just need to fetch
  const handleUploadComplete = async () => {
    const items = await fetchMediaForGame(id);
    setMediaItems(items);
  };

  // Handle media update (caption, tags, thumbnail)
  const handleUpdateMedia = async (mediaId: string, updates: { caption?: string; tags?: string[]; thumbnail?: string }) => {
    await updateMedia(mediaId, updates);
    setMediaItems((prev) =>
      prev.map((item) => (item.id === mediaId ? { ...item, ...updates } : item))
    );
  };

  // Handle media caption update (legacy - kept for compatibility)
  const handleUpdateCaption = async (mediaId: string, caption: string) => {
    await updateMedia(mediaId, { caption });
    setMediaItems((prev) =>
      prev.map((item) => (item.id === mediaId ? { ...item, caption } : item))
    );
  };

  // Handle media delete
  const handleDeleteMedia = async (mediaId: string) => {
    const item = mediaItems.find((m) => m.id === mediaId);
    await deleteMedia(mediaId, item?.url);
    setMediaItems((prev) => prev.filter((item) => item.id !== mediaId));
  };

  // Loading state
  if (gamesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  // If game not found, show error state
  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Game Not Found</h1>
          <p className="text-muted-foreground">
            This game may have been deleted or doesn&apos;t exist.
          </p>
          <Link href="/">
            <Button className="glow-pink">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`min-h-screen bg-background transition-all duration-500 ${
        isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
      }`}
    >
      {/* Consistent Header */}
      <Header />

      {/* Page-specific navigation */}
      <div className="border-b border-border/50 bg-background/50">
        <div className="container mx-auto px-4 py-3">
          <Link href="/">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
              <ArrowLeft className="w-4 h-4" />
              Back to Games
            </Button>
          </Link>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 space-y-12">
        {/* Scoreboard with animation */}
        <div 
          className={`transition-all duration-700 delay-100 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <Scoreboard game={game} />
        </div>

        {/* Media Section with animation */}
        <section
          className={`transition-all duration-700 delay-200 ${
            isLoaded ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <ImageIcon className="w-6 h-6 text-primary" />
              <h2 className="text-2xl font-bold">Photos & Videos</h2>
              <span className="text-muted-foreground">
                ({filteredMediaItems.length}{selectedTag ? ` of ${mediaItems.length}` : ''})
              </span>
            </div>
            {!authLoading && isAuthenticated && (
              <MediaUpload gameId={id} onUploadComplete={handleUploadComplete} />
            )}
          </div>

          {/* Tag Filter */}
          {availableTags.length > 0 && (
            <div className="mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Tag className="w-4 h-4" />
                <span>Filter by tag:</span>
                {selectedTag && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearTagFilters}
                    className="h-6 px-2 text-xs"
                  >
                    Clear all
                    <X className="w-3 h-3 ml-1" />
                  </Button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={selectedTag === tag ? "default" : "outline"}
                    className={`cursor-pointer transition-colors uppercase tracking-wide text-xs font-semibold ${
                      selectedTag === tag
                        ? "bg-primary hover:bg-primary/80"
                        : "hover:bg-muted"
                    }`}
                    onClick={() => toggleTagFilter(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {mediaLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <MediaGallery 
              items={filteredMediaItems} 
              onUpdateMedia={!authLoading && isAuthenticated ? handleUpdateMedia : undefined}
              onUpdateCaption={!authLoading && isAuthenticated ? handleUpdateCaption : undefined}
              onDelete={!authLoading && isAuthenticated ? handleDeleteMedia : undefined}
            />
          )}
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="text-gradient-pink font-semibold">GirlsGotGame</p>
          <p className="mt-1">Basketball and Football highlights</p>
        </div>
      </footer>
    </div>
  );
}
