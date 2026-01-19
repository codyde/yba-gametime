"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Tag,
  Share2,
  Download,
  ChevronRight,
  Pencil,
  Trash2,
  ImageIcon,
  X,
  Type,
  Check,
} from "lucide-react";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { CommentSection } from "@/components/CommentSection";
import { VideoThumbnailSelector } from "@/components/VideoThumbnailSelector";
import { TagAutocomplete } from "@/components/TagAutocomplete";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import { useAuth } from "@/lib/auth-context";
import { useMedia } from "@/lib/media-context";
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
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const { updateMedia, deleteMedia } = useMedia();
  
  const [isDownloading, setIsDownloading] = useState(false);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [thumbnailDrawerOpen, setThumbnailDrawerOpen] = useState(false);
  const [editCaption, setEditCaption] = useState(media.caption || "");
  const [editTagsArray, setEditTagsArray] = useState<string[]>(media.tags || []);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [currentThumbnail, setCurrentThumbnail] = useState(media.thumbnail);
  const [currentCaption, setCurrentCaption] = useState(media.caption);
  const [currentTags, setCurrentTags] = useState(media.tags);

  // Generate default title from date if no caption
  const defaultTitle = new Date(media.uploadedAt).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
  const displayTitle = currentCaption || defaultTitle;

  // Check if user can edit/delete this media
  const isAdmin = user?.role === "admin";
  const isUploader = user?.id === media.uploaderId;
  const canEdit = isAuthenticated && (isAdmin || isUploader);

  // Check if video needs setup (no thumbnail or no title)
  const needsSetup = media.type === "video" && (!currentThumbnail || !currentCaption) && canEdit && !bannerDismissed;

  // Open edit drawer with current values
  const openEditDrawer = () => {
    setEditCaption(currentCaption || "");
    setEditTagsArray(currentTags || []);
    setEditDrawerOpen(true);
  };

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

  const handleSaveEdit = async () => {
    await updateMedia(media.id, { caption: editCaption || undefined, tags: editTagsArray });
    setCurrentCaption(editCaption || null);
    setCurrentTags(editTagsArray);
    setEditDrawerOpen(false);
    toast.success("Changes saved!");
  };

  const handleCancelEdit = () => {
    setEditCaption(currentCaption || "");
    setEditTagsArray(currentTags || []);
    setEditDrawerOpen(false);
  };

  const handleDelete = async () => {
    if (!confirm("Are you sure you want to delete this media? This cannot be undone.")) {
      return;
    }
    
    try {
      await deleteMedia(media.id, media.url);
      toast.success("Media deleted");
      // Navigate back to game page or home
      if (media.game) {
        router.push(`/game/${media.game.id}`);
      } else {
        router.push("/");
      }
    } catch {
      toast.error("Failed to delete media");
    }
  };

  const handleThumbnailSelected = async (thumbnailBlob: Blob) => {
    try {
      const isGif = thumbnailBlob.type === 'image/gif';
      const extension = isGif ? 'gif' : 'jpg';
      const contentType = isGif ? 'image/gif' : 'image/jpeg';

      // Upload thumbnail
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `thumb_${media.id}.${extension}`,
          contentType,
          folder: 'thumbnails',
        }),
      });

      if (response.ok) {
        const { uploadUrl, publicUrl } = await response.json();
        
        await fetch(uploadUrl, {
          method: 'PUT',
          body: thumbnailBlob,
          headers: { 'Content-Type': contentType },
        });

        await updateMedia(media.id, { thumbnail: publicUrl });
        setCurrentThumbnail(publicUrl);
        toast.success("Thumbnail updated!");
      }
    } catch {
      toast.error("Failed to update thumbnail");
    }
    setThumbnailDrawerOpen(false);
  };

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
          <div className="flex items-center gap-1 sm:gap-2">
            <Button variant="outline" size="sm" onClick={handleShare} className="px-2 sm:px-3">
              <Share2 className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Share</span>
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-2 sm:px-3"
            >
              <Download className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">{isDownloading ? "Downloading..." : "Download"}</span>
            </Button>
            {canEdit && (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={openEditDrawer}
                  className="px-2 sm:px-3"
                >
                  <Pencil className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Edit</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleDelete}
                  className="text-destructive hover:text-destructive px-2 sm:px-3"
                >
                  <Trash2 className="w-4 h-4 sm:mr-2" />
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>

      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Video/Image */}
          <div className="lg:col-span-2 space-y-6">
            {/* Setup Banner - shown if video needs thumbnail or title */}
            {needsSetup && (
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <p className="font-medium text-sm">Set up your video</p>
                    <p className="text-xs text-muted-foreground">Add a thumbnail and title for better visibility</p>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => setBannerDismissed(true)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {!currentThumbnail && (
                    <Button 
                      size="sm" 
                      onClick={() => setThumbnailDrawerOpen(true)}
                      className="glow-pink"
                    >
                      <ImageIcon className="w-4 h-4 mr-2" />
                      Create Thumbnail
                    </Button>
                  )}
                  {!currentCaption && (
                    <Button 
                      size="sm" 
                      variant={currentThumbnail ? "default" : "outline"}
                      onClick={openEditDrawer}
                      className={currentThumbnail ? "glow-pink" : ""}
                    >
                      <Type className="w-4 h-4 mr-2" />
                      Set Title
                    </Button>
                  )}
                </div>
              </div>
            )}

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

            {/* Title & Tags */}
            <div className="space-y-4">
              <h1 className="text-2xl font-bold">{displayTitle}</h1>
              
              {currentTags && currentTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {currentTags.map((tag) => (
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

      {/* Edit Drawer */}
      <Drawer open={editDrawerOpen} onOpenChange={setEditDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Edit Video</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Title</label>
              <Input
                value={editCaption}
                onChange={(e) => setEditCaption(e.target.value)}
                placeholder="Enter video title..."
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Tags</label>
              <TagAutocomplete
                tags={editTagsArray}
                onTagsChange={setEditTagsArray}
                placeholder="Type and press space to add..."
              />
            </div>
            {media.type === "video" && (
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => {
                  setEditDrawerOpen(false);
                  setThumbnailDrawerOpen(true);
                }}
              >
                <ImageIcon className="w-4 h-4 mr-2" />
                {currentThumbnail ? "Change Thumbnail" : "Set Thumbnail"}
              </Button>
            )}
            <div className="flex gap-2 pt-2">
              <Button className="flex-1" onClick={handleSaveEdit}>
                <Check className="w-4 h-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" className="flex-1" onClick={handleCancelEdit}>
                Cancel
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Thumbnail Drawer for videos */}
      {media.type === "video" && (
        <Drawer open={thumbnailDrawerOpen} onOpenChange={setThumbnailDrawerOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>Set Thumbnail</DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-6 overflow-y-auto">
              <VideoThumbnailSelector
                isOpen={thumbnailDrawerOpen}
                videoUrl={media.url}
                onClose={() => setThumbnailDrawerOpen(false)}
                onSelect={handleThumbnailSelected}
                embedded
              />
            </div>
          </DrawerContent>
        </Drawer>
      )}
    </div>
  );
}
