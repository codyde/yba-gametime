"use client";

import { useState, useRef } from "react";
import { Upload, X, Image as ImageIcon, Video, Loader2, Film, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { VideoThumbnailSelector } from "./VideoThumbnailSelector";
import { MEDIA_TAGS } from "@/lib/types";

interface UploadFile {
  file: File;
  preview: string;
  type: "image" | "video";
  caption: string;
  tags: string[];
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  thumbnailBlob?: Blob;
  thumbnailPreview?: string;
}

// Flatten all predefined tags for quick access
const ALL_TAGS: string[] = [
  ...MEDIA_TAGS.plays,
  ...MEDIA_TAGS.basketball,
  ...MEDIA_TAGS.general,
];

interface MediaUploadProps {
  gameId: string;
  onUploadComplete?: () => void;
}

export function MediaUpload({ gameId, onUploadComplete }: MediaUploadProps) {
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Thumbnail selector state
  const [thumbnailSelectorOpen, setThumbnailSelectorOpen] = useState(false);
  const [selectedVideoIndex, setSelectedVideoIndex] = useState<number | null>(null);

  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadFile[] = [];

    Array.from(fileList).forEach((file) => {
      const isImage = file.type.startsWith("image/");
      const isVideo = file.type.startsWith("video/");

      if (isImage || isVideo) {
        const preview = URL.createObjectURL(file);
        newFiles.push({
          file,
          preview,
          type: isImage ? "image" : "video",
          caption: "",
          tags: [],
          progress: 0,
          status: "pending",
        });
      }
    });

    setFiles((prev) => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      URL.revokeObjectURL(newFiles[index].preview);
      if (newFiles[index].thumbnailPreview) {
        URL.revokeObjectURL(newFiles[index].thumbnailPreview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const updateCaption = (index: number, caption: string) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], caption };
      return newFiles;
    });
  };

  const toggleTag = (index: number, tag: string) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      const currentTags = newFiles[index].tags;
      const newTags = currentTags.includes(tag)
        ? currentTags.filter((t) => t !== tag)
        : [...currentTags, tag];
      newFiles[index] = { ...newFiles[index], tags: newTags };
      return newFiles;
    });
  };

  const addCustomTag = (index: number, tag: string) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !files[index].tags.includes(trimmedTag)) {
      toggleTag(index, trimmedTag);
    }
  };

  const updateFileStatus = (index: number, status: UploadFile["status"], progress?: number) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index] = { 
        ...newFiles[index], 
        status, 
        progress: progress ?? newFiles[index].progress 
      };
      return newFiles;
    });
  };

  const openThumbnailSelector = (index: number) => {
    setSelectedVideoIndex(index);
    setThumbnailSelectorOpen(true);
  };

  const handleThumbnailSelected = (thumbnailBlob: Blob) => {
    if (selectedVideoIndex === null) return;

    const thumbnailPreview = URL.createObjectURL(thumbnailBlob);
    
    setFiles((prev) => {
      const newFiles = [...prev];
      // Clean up old thumbnail preview if exists
      if (newFiles[selectedVideoIndex].thumbnailPreview) {
        URL.revokeObjectURL(newFiles[selectedVideoIndex].thumbnailPreview!);
      }
      newFiles[selectedVideoIndex] = {
        ...newFiles[selectedVideoIndex],
        thumbnailBlob,
        thumbnailPreview,
      };
      return newFiles;
    });

    setThumbnailSelectorOpen(false);
    setSelectedVideoIndex(null);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    let successCount = 0;

    for (let i = 0; i < files.length; i++) {
      const fileData = files[i];
      updateFileStatus(i, "uploading", 0);

      try {
        let thumbnailUrl: string | null = null;

        // Upload thumbnail first if it's a video with a thumbnail (now a GIF)
        if (fileData.type === "video" && fileData.thumbnailBlob) {
          // Detect if it's a GIF or JPEG based on blob type
          const isGif = fileData.thumbnailBlob.type === 'image/gif';
          const extension = isGif ? 'gif' : 'jpg';
          const contentType = isGif ? 'image/gif' : 'image/jpeg';
          
          const thumbResponse = await fetch('/api/upload', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              filename: `thumb_${fileData.file.name}.${extension}`,
              contentType: contentType,
              folder: `games/${gameId}/thumbnails`,
            }),
          });

          if (thumbResponse.ok) {
            const { uploadUrl, publicUrl } = await thumbResponse.json();
            
            const thumbUpload = await fetch(uploadUrl, {
              method: 'PUT',
              body: fileData.thumbnailBlob,
              headers: { 'Content-Type': contentType },
            });

            if (thumbUpload.ok) {
              thumbnailUrl = publicUrl;
            }
          }
        }

        updateFileStatus(i, "uploading", 20);

        // Get presigned upload URL for main file
        const urlResponse = await fetch('/api/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            filename: fileData.file.name,
            contentType: fileData.file.type,
            folder: `games/${gameId}`,
          }),
        });

        if (!urlResponse.ok) {
          throw new Error('Failed to get upload URL');
        }

        const { uploadUrl, publicUrl } = await urlResponse.json();
        updateFileStatus(i, "uploading", 40);

        // Upload directly to R2
        const uploadResponse = await fetch(uploadUrl, {
          method: 'PUT',
          body: fileData.file,
          headers: {
            'Content-Type': fileData.file.type,
          },
        });

        if (!uploadResponse.ok) {
          throw new Error('Failed to upload to R2');
        }

        updateFileStatus(i, "uploading", 80);

        // Save to database via our media API
        const saveResponse = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            gameId,
            type: fileData.type,
            url: publicUrl,
            thumbnail: thumbnailUrl,
            caption: fileData.caption || null,
            tags: fileData.tags.length > 0 ? fileData.tags : null,
            uploader: 'Cody', // Default uploader
          }),
        });

        if (!saveResponse.ok) {
          throw new Error('Failed to save media record');
        }

        updateFileStatus(i, "done", 100);
        successCount++;

      } catch (error) {
        console.error('Upload failed:', error);
        updateFileStatus(i, "error");
      }
    }

    // Call the callback to refresh media list
    if (successCount > 0) {
      onUploadComplete?.();
    }

    // Clean up and close
    setTimeout(() => {
      files.forEach((f) => {
        URL.revokeObjectURL(f.preview);
        if (f.thumbnailPreview) {
          URL.revokeObjectURL(f.thumbnailPreview);
        }
      });
      setFiles([]);
      setUploading(false);
      setOpen(false);
    }, 500);
  };

  const handleClose = () => {
    if (!uploading) {
      files.forEach((f) => {
        URL.revokeObjectURL(f.preview);
        if (f.thumbnailPreview) {
          URL.revokeObjectURL(f.thumbnailPreview);
        }
      });
      setFiles([]);
      setOpen(false);
    }
  };

  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen) {
      setOpen(true);
    } else {
      handleClose();
    }
  };

  const selectedVideoFile = selectedVideoIndex !== null ? files[selectedVideoIndex]?.file : null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogTrigger asChild>
          <Button className="glow-pink">
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Upload Photos & Videos</DialogTitle>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Drop zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${
                  dragActive
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }
              `}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFiles(e.target.files)}
              />
              <div className="flex flex-col items-center gap-3">
                <div className="p-3 bg-muted rounded-full">
                  <Upload className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium">Drop files here or click to browse</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Supports images and videos
                  </p>
                </div>
              </div>
            </div>

            {/* File previews */}
            {files.length > 0 && (
              <div className="space-y-4">
                <Label>Selected files ({files.length})</Label>
                <div className="space-y-3 max-h-80 overflow-y-auto pr-2">
                  {files.map((file, index) => (
                    <div
                      key={index}
                      className={`flex items-start gap-4 p-3 bg-muted/50 rounded-lg ${
                        file.status === "error" ? "border border-destructive" : ""
                      }`}
                    >
                      {/* Preview */}
                      <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                        {file.type === "image" ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.preview}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : file.thumbnailPreview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={file.thumbnailPreview}
                            alt="Video thumbnail"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5">
                            <Video className="w-8 h-8 text-primary/60" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1">
                          {file.type === "image" ? (
                            <ImageIcon className="w-4 h-4 text-white drop-shadow" />
                          ) : (
                            <Video className="w-4 h-4 text-white drop-shadow" />
                          )}
                        </div>
                        
                        {/* Upload progress overlay */}
                        {file.status === "uploading" && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <Loader2 className="w-6 h-6 animate-spin text-white" />
                          </div>
                        )}
                        
                        {/* Done indicator */}
                        {file.status === "done" && (
                          <div className="absolute inset-0 bg-primary/50 flex items-center justify-center">
                            <span className="text-white text-xs font-bold">Done</span>
                          </div>
                        )}
                      </div>

                      {/* Details */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <p className="text-sm font-medium truncate">
                          {file.file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        
                        {/* Thumbnail selector for videos */}
                        {file.type === "video" && file.status === "pending" && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openThumbnailSelector(index)}
                            className="w-full text-xs"
                          >
                            <Film className="w-3 h-3 mr-1" />
                            {file.thumbnailPreview ? "Change Thumbnail" : "Select Thumbnail"}
                          </Button>
                        )}
                        
                        <Input
                          placeholder="Add a caption..."
                          value={file.caption}
                          onChange={(e) => updateCaption(index, e.target.value)}
                          className="h-8 text-sm"
                          disabled={uploading}
                        />

                        {/* Tag selection for videos */}
                        {file.type === "video" && file.status === "pending" && (
                          <div className="space-y-2">
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Tag className="w-3 h-3" />
                              <span>Tags</span>
                            </div>
                            <div className="flex flex-wrap gap-1">
                              {ALL_TAGS.map((tag) => (
                                <Badge
                                  key={tag}
                                  variant={file.tags.includes(tag) ? "default" : "outline"}
                                  className={`cursor-pointer text-xs transition-colors ${
                                    file.tags.includes(tag) 
                                      ? "bg-primary hover:bg-primary/80" 
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => toggleTag(index, tag)}
                                >
                                  {tag}
                                </Badge>
                              ))}
                            </div>
                            {/* Custom tag input */}
                            <Input
                              placeholder="Add player name or custom tag..."
                              className="h-7 text-xs"
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  addCustomTag(index, e.currentTarget.value);
                                  e.currentTarget.value = "";
                                }
                              }}
                            />
                            {/* Show selected tags */}
                            {file.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1">
                                {file.tags.filter(t => !ALL_TAGS.includes(t)).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="secondary"
                                    className="text-xs cursor-pointer hover:bg-destructive/20"
                                    onClick={() => toggleTag(index, tag)}
                                  >
                                    {tag} ×
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Remove button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeFile(index)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                        disabled={uploading}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <Button variant="outline" onClick={handleClose} disabled={uploading}>
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={files.length === 0 || uploading}
                className="glow-pink"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload {files.length > 0 && `(${files.length})`}
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Video Thumbnail Selector */}
      {selectedVideoFile && (
        <VideoThumbnailSelector
          isOpen={thumbnailSelectorOpen}
          videoFile={selectedVideoFile}
          onClose={() => {
            setThumbnailSelectorOpen(false);
            setSelectedVideoIndex(null);
          }}
          onSelect={handleThumbnailSelected}
        />
      )}
    </>
  );
}
