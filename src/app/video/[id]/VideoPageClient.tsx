"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag,
  Share2,
  Download,
  ChevronRight,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CommentSection } from "@/components/CommentSection";
import { toast } from "sonner";

interface MediaData {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail: string | null;
  caption: string | null;
  tags: string[] | null;
  uploaderId: string | null;
  uploaderName: string;
  uploaderImage?: string | null;
  uploadedAt: string;
  game: {
    id: string;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamAbbreviation: string;
    awayTeamAbbreviation: string;
    date: string;
    sport: string;
  } | null;
}

interface VideoPageClientProps {
  media: MediaData;
}

export function VideoPageClient({ media }: VideoPageClientProps) {
  const [isDownloading, setIsDownloading] = useState(false);

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: media.caption || "Check out this video",
          url,
        });
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          await copyToClipboard(url);
        }
      }
    } else {
      await copyToClipboard(url);
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Link copied to clipboard!");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(media.url);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${media.caption || media.id}.${media.type === "video" ? "mp4" : "jpg"}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Download started!");
    } catch {
      toast.error("Failed to download");
    } finally {
      setIsDownloading(false);
    }
  };

  const formattedDate = new Date(media.uploadedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Consistent Header */}
      <Header />

      {/* Page-specific navigation */}
      <div className="border-b border-border/50 bg-background/50">
        <div className="container mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {media.game ? (
              <Link href={`/game/${media.game.id}`}>
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  Back to Game
                </Button>
              </Link>
            ) : (
              <Link href="/">
                <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                  <ArrowLeft className="w-4 h-4" />
                  Home
                </Button>
              </Link>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={isDownloading}
            >
              <Download className="w-4 h-4 mr-2" />
              {isDownloading ? "Downloading..." : "Download"}
            </Button>
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video/Image */}
          <div className="lg:col-span-2 space-y-6">
            {/* Media Player */}
            <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
              {media.type === "video" ? (
                <video
                  src={media.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full h-full object-contain"
                  poster={media.thumbnail || undefined}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={media.url}
                  alt={media.caption || "Media"}
                  className="w-full h-full object-contain"
                />
              )}
            </div>

            {/* Caption & Tags */}
            <div className="space-y-4">
              {media.caption && (
                <h1 className="text-2xl font-bold">{media.caption}</h1>
              )}
              
              {media.tags && media.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {media.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Comments Section */}
            <div className="border-t pt-6">
              <CommentSection mediaId={media.id} />
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Uploader Info */}
            <div className="bg-card rounded-xl border p-4 space-y-4">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Uploaded by
              </h3>
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={media.uploaderImage || undefined} />
                  <AvatarFallback>
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{media.uploaderName}</p>
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {formattedDate}
                  </p>
                </div>
              </div>
            </div>

            {/* Game Info */}
            {media.game && (
              <div className="bg-card rounded-xl border p-4 space-y-4">
                <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                  From Game
                </h3>
                <Link 
                  href={`/game/${media.game.id}`}
                  className="block p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {media.game.homeTeamName} vs {media.game.awayTeamName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {media.game.date} • {media.game.sport}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-muted-foreground" />
                  </div>
                </Link>
              </div>
            )}

            {/* Media Info */}
            <div className="bg-card rounded-xl border p-4 space-y-3">
              <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Details
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Type</span>
                  <span className="font-medium capitalize">{media.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ID</span>
                  <span className="font-mono text-xs">{media.id.slice(0, 12)}...</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
