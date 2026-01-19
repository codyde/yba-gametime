"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { 
  Play, 
  X, 
  ChevronLeft, 
  ChevronRight, 
  Pencil,
  Trash2, 
  Check,
  Download,
  Maximize2,
  Minimize2,
  Square,
  Film,
  Tag,
  Loader2,
  Share2,
  ExternalLink,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Dialog, 
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { MediaItem } from "@/lib/types";
import { VideoThumbnailSelector } from "./VideoThumbnailSelector";
import { toast } from "sonner";

interface MediaGalleryProps {
  items: MediaItem[];
  onUpdateMedia?: (mediaId: string, updates: { caption?: string; tags?: string[]; thumbnail?: string }) => void;
  onUpdateCaption?: (mediaId: string, caption: string) => void;
  onDelete?: (mediaId: string) => void;
  useDetailPage?: boolean; // If true, navigate to detail page instead of opening dialog
}

type ViewSize = "compact" | "default" | "fullscreen";

export function MediaGallery({ items, onUpdateMedia, onUpdateCaption, onDelete, useDetailPage = true }: MediaGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState("");
  const [tagsValue, setTagsValue] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [viewSize, setViewSize] = useState<ViewSize>("default");
  const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false);
  const [videoUrlForThumbnail, setVideoUrlForThumbnail] = useState<string | null>(null);
  const [mediaLoading, setMediaLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSavedRef = useRef<{ caption: string; tags: string[] }>({ caption: "", tags: [] });

  const selectedItem = selectedIndex !== null ? items[selectedIndex] : null;
  const isOpen = selectedIndex !== null && selectedItem !== null;

  // Tag filter state
  const [selectedTag, setSelectedTag] = useState<string>("all");
  
  // Get all unique tags from items
  const allTags = Array.from(
    new Set(items.flatMap((item) => item.tags || []))
  ).sort();
  
  // Filter items by selected tag
  const filteredItems = selectedTag === "all" 
    ? items 
    : items.filter((item) => item.tags?.includes(selectedTag));

  // Debounced auto-save function
  const debouncedSave = useCallback((mediaId: string, caption: string, tags: string[]) => {
    // Clear any pending save
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Check if there are actual changes
    const hasChanges = caption !== lastSavedRef.current.caption || 
      JSON.stringify(tags) !== JSON.stringify(lastSavedRef.current.tags);

    if (!hasChanges || !onUpdateMedia) return;

    setIsSaving(true);
    
    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await onUpdateMedia(mediaId, { caption, tags });
        lastSavedRef.current = { caption, tags };
        toast.success("Changes saved", { duration: 2000 });
      } catch {
        toast.error("Failed to save changes");
      } finally {
        setIsSaving(false);
      }
    }, 2000);
  }, [onUpdateMedia]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Auto-open lightbox from URL parameter (for shared links)
  useEffect(() => {
    if (typeof window === 'undefined' || items.length === 0) return;
    
    const params = new URLSearchParams(window.location.search);
    const videoParam = params.get('video');
    
    if (videoParam !== null) {
      const index = parseInt(videoParam, 10);
      if (!isNaN(index) && index >= 0 && index < items.length) {
        // Small delay to ensure component is fully mounted
        setTimeout(() => {
          openLightbox(index);
          // Clean up URL after opening
          const url = new URL(window.location.href);
          url.searchParams.delete('video');
          window.history.replaceState({}, '', url.toString());
        }, 100);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "ArrowLeft":
          if (selectedIndex! > 0) {
            setSelectedIndex(selectedIndex! - 1);
            setCaptionValue(items[selectedIndex! - 1]?.caption || "");
            setEditingCaption(false);
          }
          break;
        case "ArrowRight":
          if (selectedIndex! < items.length - 1) {
            setSelectedIndex(selectedIndex! + 1);
            setCaptionValue(items[selectedIndex! + 1]?.caption || "");
            setEditingCaption(false);
          }
          break;
        case "f":
          if (!editingCaption) {
            setViewSize(viewSize === "fullscreen" ? "default" : "fullscreen");
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, selectedIndex, items, viewSize, editingCaption]);

  const openLightbox = (index: number) => {
    setSelectedIndex(index);
    setEditingCaption(false);
    setCaptionValue(items[index]?.caption || "");
    setViewSize("default");
    setMediaLoading(true);
  };

  const closeLightbox = () => {
    setSelectedIndex(null);
    setEditingCaption(false);
    setViewSize("default");
  };

  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      const newIndex = selectedIndex - 1;
      setSelectedIndex(newIndex);
      setEditingCaption(false);
      setCaptionValue(items[newIndex]?.caption || "");
    }
  };

  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < items.length - 1) {
      const newIndex = selectedIndex + 1;
      setSelectedIndex(newIndex);
      setEditingCaption(false);
      setCaptionValue(items[newIndex]?.caption || "");
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const value = tagInput.trim();
    
    // Handle @tagname pattern - trigger on space or enter after @
    if ((e.key === " " || e.key === "Enter") && value.startsWith("@") && value.length > 1) {
      e.preventDefault();
      const newTag = value.slice(1); // Remove @ prefix
      if (!tagsValue.includes(newTag)) {
        const newTags = [...tagsValue, newTag];
        setTagsValue(newTags);
        if (selectedIndex !== null) {
          debouncedSave(items[selectedIndex].id, captionValue, newTags);
        }
      }
      setTagInput("");
    } else if (e.key === "Enter" && value && !value.startsWith("@")) {
      // Allow adding tag without @ on Enter
      e.preventDefault();
      if (!tagsValue.includes(value)) {
        const newTags = [...tagsValue, value];
        setTagsValue(newTags);
        if (selectedIndex !== null) {
          debouncedSave(items[selectedIndex].id, captionValue, newTags);
        }
      }
      setTagInput("");
    } else if (e.key === "Backspace" && !tagInput && tagsValue.length > 0) {
      // Remove last tag on backspace when input is empty
      const newTags = tagsValue.slice(0, -1);
      setTagsValue(newTags);
      if (selectedIndex !== null) {
        debouncedSave(items[selectedIndex].id, captionValue, newTags);
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    const newTags = tagsValue.filter((t) => t !== tagToRemove);
    setTagsValue(newTags);
    if (selectedIndex !== null) {
      debouncedSave(items[selectedIndex].id, captionValue, newTags);
    }
  };

  const startEditing = () => {
    setEditingCaption(true);
    const caption = selectedItem?.caption || "";
    const tags = selectedItem?.tags || [];
    setCaptionValue(caption);
    setTagsValue(tags);
    setTagInput("");
    // Track initial values
    lastSavedRef.current = { caption, tags };
  };

  const stopEditing = () => {
    // Clear any pending save timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    // Save immediately if there are unsaved changes
    if (selectedIndex !== null && onUpdateMedia) {
      const hasChanges = captionValue !== lastSavedRef.current.caption || 
        JSON.stringify(tagsValue) !== JSON.stringify(lastSavedRef.current.tags);
      if (hasChanges) {
        onUpdateMedia(items[selectedIndex].id, { caption: captionValue, tags: tagsValue });
        toast.success("Changes saved", { duration: 2000 });
      }
    }
    setEditingCaption(false);
  };

  const openThumbnailSelector = () => {
    if (selectedItem?.type === "video") {
      setVideoUrlForThumbnail(selectedItem.url);
      setThumbnailSelectorOpen(true);
    }
  };

  const handleThumbnailSelected = async (thumbnailBlob: Blob) => {
    if (!selectedItem || selectedIndex === null) return;

    try {
      // Upload thumbnail to R2
      const isGif = thumbnailBlob.type === 'image/gif';
      const extension = isGif ? 'gif' : 'jpg';
      const contentType = isGif ? 'image/gif' : 'image/jpeg';
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: `thumb_${selectedItem.id}.${extension}`,
          contentType,
          folder: 'thumbnails',
        }),
      });

      if (response.ok) {
        const { uploadUrl, publicUrl } = await response.json();
        
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: thumbnailBlob,
          headers: { 'Content-Type': contentType },
        });

        if (uploadResponse.ok && onUpdateMedia) {
          onUpdateMedia(selectedItem.id, { thumbnail: publicUrl });
        }
      }
    } catch (error) {
      console.error('Failed to upload thumbnail:', error);
    }

    setThumbnailSelectorOpen(false);
    setVideoUrlForThumbnail(null);
  };

  const handleDelete = () => {
    if (selectedIndex !== null && onDelete) {
      const mediaId = items[selectedIndex].id;
      if (items.length === 1) {
        closeLightbox();
      } else if (selectedIndex === items.length - 1) {
        setSelectedIndex(selectedIndex - 1);
        setCaptionValue(items[selectedIndex - 1]?.caption || "");
      } else {
        setCaptionValue(items[selectedIndex + 1]?.caption || "");
      }
      onDelete(mediaId);
    }
  };

  const handleDownload = async () => {
    if (!selectedItem) return;
    
    try {
      const response = await fetch(selectedItem.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = selectedItem.type === "video" ? "mp4" : "jpg";
      const filename = selectedItem.caption 
        ? `${selectedItem.caption.replace(/[^a-z0-9]/gi, "_")}.${extension}`
        : `media_${selectedItem.id}.${extension}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(selectedItem.url, "_blank");
    }
  };

  // Check if mobile (will be updated on mount)
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Force play video on mobile (mobile browsers need explicit play() after user interaction)
  const handleVideoReady = useCallback(() => {
    setMediaLoading(false);
    if (videoRef.current) {
      // Attempt to play - this works because user clicked to open the lightbox
      videoRef.current.play().catch(() => {
        // Autoplay was prevented, user will need to tap play button
        console.log("Autoplay prevented by browser");
      });
    }
  }, []);

  // Get dialog size styles based on viewSize (using inline styles to override defaults)
  const getDialogStyle = (): React.CSSProperties => {
    // On mobile, always use full width
    if (isMobile) {
      return { maxWidth: "100vw", width: "100vw" };
    }
    
    switch (viewSize) {
      case "compact":
        return { maxWidth: "50vw", width: "auto" };
      case "fullscreen":
        return { maxWidth: "95vw", width: "95vw" };
      default:
        return { maxWidth: "85vw", width: "85vw" };
    }
  };

  // Get media max height based on viewSize
  const getMediaMaxHeight = () => {
    // On mobile, use more vertical space
    if (isMobile) {
      return "80vh";
    }
    
    switch (viewSize) {
      case "compact":
        return "45vh";
      case "fullscreen":
        return "85vh";
      default:
        return "70vh";
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-border rounded-lg">
        <p className="text-muted-foreground">No media uploaded yet.</p>
        <p className="text-sm text-muted-foreground mt-1">
          {onUpdateCaption ? "Upload photos and videos from this game." : "Be the first to share photos and videos from this game."}
        </p>
      </div>
    );
  }

  // Download handler for grid items
  const handleGridDownload = async (e: React.MouseEvent, item: MediaItem) => {
    e.stopPropagation();
    try {
      const response = await fetch(item.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const extension = item.type === "video" ? "mp4" : "jpg";
      const filename = item.caption 
        ? `${item.caption.replace(/[^a-z0-9]/gi, "_")}.${extension}`
        : `media_${item.id}.${extension}`;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download failed:", error);
      window.open(item.url, "_blank");
    }
  };

  // Share handler - copies video URL to clipboard
  const handleShare = async (e: React.MouseEvent, item: MediaItem, index: number) => {
    e.stopPropagation();
    
    // Build the URL with video parameter to auto-open lightbox
    const baseUrl = window.location.href.split('?')[0];
    const shareUrl = `${baseUrl}?video=${index}`;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard", { duration: 2000 });
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      toast.success("Link copied to clipboard", { duration: 2000 });
    }
  };

  return (
    <>
      {/* Mobile tag filter */}
      {isMobile && allTags.length > 0 && (
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <Select value={selectedTag} onValueChange={setSelectedTag}>
            <SelectTrigger className="flex-1 h-9">
              <SelectValue placeholder="Filter by tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Videos ({items.length})</SelectItem>
              {allTags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag} ({items.filter((i) => i.tags?.includes(tag)).length})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedTag !== "all" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedTag("all")}
              className="h-9 px-2"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      )}

      {/* Grid Gallery - single column on mobile */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredItems.map((item) => {
          // Get the original index from items array for share/lightbox functionality
          const originalIndex = items.findIndex((i) => i.id === item.id);
          return (
          <div key={item.id} className="flex flex-col">
            {/* Thumbnail */}
            {useDetailPage ? (
              <Link
                href={`/video/${item.id}`}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted card-hover border border-border focus:outline-none focus:ring-2 focus:ring-primary block"
              >
                {item.type === "image" ? (
                  <Image
                    src={item.url}
                    alt={item.caption || "Media"}
                    fill
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                ) : item.thumbnail ? (
                  <>
                    <Image
                      src={item.thumbnail}
                      alt={item.caption || "Video thumbnail"}
                      fill
                      unoptimized={item.thumbnail.endsWith('.gif')}
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                    />
                    {/* Always visible play button for videos */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                        <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                      <Play className="w-8 h-8 text-primary ml-1" />
                    </div>
                  </div>
                )}

                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                  {item.type === "video" && !item.thumbnail ? (
                    <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                      <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                    </div>
                  ) : item.type === "image" ? (
                    <div className="px-3 py-1.5 bg-card/90 rounded-full text-sm font-medium">
                      View
                    </div>
                  ) : null}
                </div>

                {/* Video duration badge - bottom right (YouTube style) */}
                {item.type === "video" && (
                  <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[11px] font-medium text-white z-10">
                    Video
                  </div>
                )}

                {/* Image caption - bottom */}
                {item.type === "image" && item.caption && (
                  <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                    <p className="text-xs text-white truncate">{item.caption}</p>
                  </div>
                )}
              </Link>
            ) : (
              <button
                onClick={() => openLightbox(originalIndex)}
                className="group relative aspect-square rounded-lg overflow-hidden bg-muted card-hover border border-border focus:outline-none focus:ring-2 focus:ring-primary"
              >
              {item.type === "image" ? (
                <Image
                  src={item.url}
                  alt={item.caption || "Media"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                />
              ) : item.thumbnail ? (
                <>
                  <Image
                    src={item.thumbnail}
                    alt={item.caption || "Video thumbnail"}
                    fill
                    unoptimized={item.thumbnail.endsWith('.gif')}
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                  />
                  {/* Always visible play button for videos */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-14 h-14 rounded-full bg-black/60 flex items-center justify-center group-hover:bg-primary/90 transition-colors">
                      <Play className="w-7 h-7 text-white ml-1" fill="currentColor" />
                    </div>
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center">
                    <Play className="w-8 h-8 text-primary ml-1" />
                  </div>
                </div>
              )}

              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {item.type === "video" && !item.thumbnail ? (
                  <div className="w-12 h-12 rounded-full bg-primary/90 flex items-center justify-center">
                    <Play className="w-6 h-6 text-white ml-0.5" fill="currentColor" />
                  </div>
                ) : item.type === "image" ? (
                  <div className="px-3 py-1.5 bg-card/90 rounded-full text-sm font-medium">
                    View
                  </div>
                ) : null}
              </div>

              {/* Video duration badge - bottom right (YouTube style) */}
              {item.type === "video" && (
                <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/80 rounded text-[11px] font-medium text-white z-10">
                  Video
                </div>
              )}

              {/* Image caption - bottom */}
              {item.type === "image" && item.caption && (
                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                  <p className="text-xs text-white truncate">{item.caption}</p>
                </div>
              )}
              </button>
            )}

            {/* Video info section - below thumbnail (YouTube-like) */}
            {item.type === "video" && (
              <div className="mt-3 space-y-2">
                {/* Title row with share/download buttons */}
                <div className="flex items-start justify-between gap-2">
                  {/* Title - left aligned */}
                  <h3 className="font-semibold text-sm text-foreground line-clamp-2 leading-tight text-left flex-1">
                    {item.caption || "Untitled video"}
                  </h3>
                  
                  {/* Share and Download buttons */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleShare(e, item, originalIndex)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Share"
                    >
                      <Share2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={(e) => handleGridDownload(e, item)}
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      title="Download"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Tags - hidden on mobile (use filter dropdown instead), shown on desktop */}
                {!isMobile && item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 max-h-[44px] overflow-hidden">
                    {item.tags.slice(0, 5).map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-semibold text-primary uppercase tracking-wide"
                      >
                        {tag}
                      </span>
                    ))}
                    {item.tags.length > 5 && (
                      <span className="px-2 py-0.5 bg-muted rounded-full text-[10px] font-medium text-muted-foreground">
                        +{item.tags.length - 5}
                      </span>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )})}
      </div>

      {/* Lightbox Dialog - only show when NOT using detail page */}
      {!useDetailPage && (
      <Dialog open={isOpen} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent 
          className="p-0 bg-black border-none overflow-hidden gap-0 !max-w-none"
          style={getDialogStyle()}
          showCloseButton={false}
        >
          {/* Hidden title for accessibility */}
          <VisuallyHidden.Root>
            <DialogTitle>
              {selectedItem?.type === "video" ? "Video viewer" : "Image viewer"}
            </DialogTitle>
          </VisuallyHidden.Root>

          {/* Toolbar */}
          <div className="flex items-center justify-between p-3 bg-black/90 border-b border-white/10">
            {/* Left side */}
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-white/10 rounded-full text-white text-sm font-medium">
                {selectedIndex !== null ? selectedIndex + 1 : 0} / {items.length}
              </div>
              
              {(onUpdateMedia || onUpdateCaption || onDelete) && (
                <div className="flex gap-1">
                  {(onUpdateMedia || onUpdateCaption) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={startEditing}
                      className="text-white/80 hover:text-white hover:bg-white/10 h-8"
                    >
                      <Pencil className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleDelete}
                      className="text-white/80 hover:text-red-400 hover:bg-red-500/20 h-8"
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Right side */}
            <div className="flex items-center gap-2">
              {/* Size controls */}
              <div className="flex items-center bg-white/10 rounded-lg p-0.5">
                <button
                  onClick={() => setViewSize("compact")}
                  className={`p-1.5 rounded transition-colors ${
                    viewSize === "compact" 
                      ? "bg-white/20 text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  title="Compact view"
                >
                  <Minimize2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewSize("default")}
                  className={`p-1.5 rounded transition-colors ${
                    viewSize === "default" 
                      ? "bg-white/20 text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  title="Default view (75%)"
                >
                  <Square className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewSize("fullscreen")}
                  className={`p-1.5 rounded transition-colors ${
                    viewSize === "fullscreen" 
                      ? "bg-white/20 text-white" 
                      : "text-white/60 hover:text-white hover:bg-white/10"
                  }`}
                  title="Fullscreen (F)"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>

              <Button
                variant="ghost"
                size="icon"
                onClick={handleDownload}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
                title="Download"
              >
                <Download className="w-4 h-4" />
              </Button>

              <Button
                variant="ghost"
                size="icon"
                onClick={closeLightbox}
                className="text-white/80 hover:text-white hover:bg-white/10 h-8 w-8"
                title="Close (Esc)"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Media content */}
          <div 
            className="relative flex items-center justify-center bg-black"
            style={{ minHeight: getMediaMaxHeight() }}
          >
            {/* Loading overlay */}
            {mediaLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
                <div className="flex flex-col items-center gap-4">
                  <Loader2 className="w-12 h-12 animate-spin text-primary" />
                  <span className="text-white/60 text-sm">Loading...</span>
                </div>
              </div>
            )}

            {/* Navigation arrows */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <button
                onClick={goToPrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-all"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
            )}
            {selectedIndex !== null && selectedIndex < items.length - 1 && (
              <button
                onClick={goToNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 rounded-full bg-black/60 text-white/80 hover:text-white hover:bg-black/80 transition-all"
              >
                <ChevronRight className="w-8 h-8" />
              </button>
            )}

            {/* Media */}
            {selectedItem && (
              selectedItem.type === "video" ? (
                <video
                  ref={videoRef}
                  key={selectedItem.id}
                  src={selectedItem.url}
                  controls
                  autoPlay
                  playsInline
                  className="w-full"
                  style={{ maxHeight: getMediaMaxHeight() }}
                  onLoadedData={handleVideoReady}
                  onCanPlay={handleVideoReady}
                />
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selectedItem.url}
                  alt={selectedItem.caption || "Media"}
                  className="w-auto object-contain"
                  style={{ maxHeight: getMediaMaxHeight() }}
                  onLoad={() => setMediaLoading(false)}
                />
              )
            )}
          </div>

          {/* Caption / Edit Section */}
          {(selectedItem?.caption || selectedItem?.tags?.length || editingCaption) && (
            <div className="p-3 bg-black/90 border-t border-white/10">
              {editingCaption ? (
                <div className="space-y-3">
                  {/* Caption input */}
                  <Input
                    value={captionValue}
                    onChange={(e) => setCaptionValue(e.target.value)}
                    placeholder="Enter caption..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-9"
                    autoFocus
                  />
                  
                  {/* Tags section */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-white/60">
                      <Tag className="w-3 h-3" />
                      <span>Tags (type @tagname and press space/enter)</span>
                    </div>
                    
                    {/* Existing tags */}
                    {tagsValue.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {tagsValue.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="bg-primary/80 text-white hover:bg-primary cursor-pointer text-xs uppercase tracking-wide"
                            onClick={() => removeTag(tag)}
                          >
                            {tag} <X className="w-3 h-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    {/* Tag input */}
                    <Input
                      ref={tagInputRef}
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={handleTagInputKeyDown}
                      placeholder="@Pass @Run @PlayerName..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50 h-8 text-sm"
                    />
                  </div>
                  
                  {/* Regenerate thumbnail for videos */}
                  {selectedItem?.type === "video" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={openThumbnailSelector}
                      className="w-full border-white/20 text-white hover:bg-white/10"
                    >
                      <Film className="w-4 h-4 mr-2" />
                      Regenerate Preview
                    </Button>
                  )}
                  
                  {/* Action buttons */}
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-white/50">
                      {isSaving ? (
                        <span className="flex items-center gap-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Saving...
                        </span>
                      ) : (
                        "Auto-saves after 2 seconds"
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={stopEditing}
                      className="bg-primary hover:bg-primary/80"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Done
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {/* Title row with share/download */}
                  <div className="flex items-start justify-between gap-4">
                    {/* Title - larger, left aligned */}
                    <h2 className="text-white text-xl font-bold text-left flex-1">
                      {selectedItem?.caption || "Untitled"}
                    </h2>
                    
                    {/* Share, View Details, and Download buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Link href={`/video/${selectedItem?.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-white/70 hover:text-white hover:bg-white/10 h-9 px-3"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => selectedIndex !== null && handleShare(e, selectedItem!, selectedIndex)}
                        className="text-white/70 hover:text-white hover:bg-white/10 h-9 px-3"
                      >
                        <Share2 className="w-4 h-4 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleDownload}
                        className="text-white/70 hover:text-white hover:bg-white/10 h-9 px-3"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
                      </Button>
                    </div>
                  </div>
                  
                  {/* Tags - below title */}
                  {selectedItem?.tags && selectedItem.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedItem.tags.map((tag) => (
                        <Badge key={tag} variant="secondary" className="bg-primary/20 text-primary text-xs uppercase tracking-wide font-semibold">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
      )}

      {/* Thumbnail Selector for regenerating preview - only when NOT using detail page */}
      {!useDetailPage && videoUrlForThumbnail && (
        <VideoThumbnailSelector
          isOpen={thumbnailSelectorOpen}
          videoUrl={videoUrlForThumbnail}
          onClose={() => {
            setThumbnailSelectorOpen(false);
            setVideoUrlForThumbnail(null);
          }}
          onSelect={handleThumbnailSelected}
        />
      )}
    </>
  );
}
