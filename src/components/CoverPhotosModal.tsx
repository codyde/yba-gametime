"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { Upload, Trash2, GripVertical, Loader2, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ImageCropper } from "./ImageCropper";

interface CoverPhoto {
  id: string;
  url: string;
  caption: string | null;
  isActive: boolean;
  sortOrder: number;
}

interface CoverPhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CoverPhotosModal({ isOpen, onClose }: CoverPhotosModalProps) {
  const [covers, setCovers] = useState<CoverPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Cropper state
  const [cropperOpen, setCropperOpen] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  // Fetch covers on open
  useEffect(() => {
    if (isOpen) {
      fetchCovers();
    }
  }, [isOpen]);

  const fetchCovers = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/covers');
      if (response.ok) {
        const data = await response.json();
        setCovers(data);
      }
    } catch (error) {
      console.error('Failed to fetch covers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (files: FileList) => {
    const file = files[0];
    if (!file || !file.type.startsWith('image/')) return;

    // Store file and open cropper
    setOriginalFile(file);
    const previewUrl = URL.createObjectURL(file);
    setImageToCrop(previewUrl);
    setCropperOpen(true);
  };

  const handleCropComplete = async (croppedBlob: Blob) => {
    setCropperOpen(false);
    setUploading(true);

    try {
      // Create a file from the cropped blob
      const filename = originalFile?.name || 'cover.jpg';
      const croppedFile = new File([croppedBlob], filename, { type: 'image/jpeg' });

      // Get presigned upload URL
      const urlResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: croppedFile.name,
          contentType: croppedFile.type,
          folder: 'covers',
        }),
      });

      if (!urlResponse.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, publicUrl } = await urlResponse.json();

      // Upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: croppedFile,
        headers: {
          'Content-Type': croppedFile.type,
        },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      // Save to database
      const saveResponse = await fetch('/api/covers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: publicUrl,
          caption: null,
          isActive: true,
        }),
      });

      if (saveResponse.ok) {
        const newCover = await saveResponse.json();
        setCovers((prev) => [...prev, newCover]);
      }
    } catch (error) {
      console.error('Failed to upload cover:', error);
    } finally {
      // Cleanup
      if (imageToCrop) {
        URL.revokeObjectURL(imageToCrop);
      }
      setImageToCrop(null);
      setOriginalFile(null);
      setUploading(false);
    }
  };

  const handleCropCancel = () => {
    setCropperOpen(false);
    if (imageToCrop) {
      URL.revokeObjectURL(imageToCrop);
    }
    setImageToCrop(null);
    setOriginalFile(null);
  };

  const handleDelete = async (cover: CoverPhoto) => {
    try {
      // Delete from R2
      await fetch('/api/upload/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: cover.url }),
      });

      // Delete from database
      await fetch(`/api/covers/${cover.id}`, {
        method: 'DELETE',
      });

      setCovers((prev) => prev.filter((c) => c.id !== cover.id));
    } catch (error) {
      console.error('Failed to delete cover:', error);
    }
  };

  const handleUpdateCaption = async (id: string, caption: string) => {
    try {
      await fetch(`/api/covers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caption }),
      });

      setCovers((prev) =>
        prev.map((c) => (c.id === id ? { ...c, caption } : c))
      );
    } catch (error) {
      console.error('Failed to update caption:', error);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
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

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-primary" />
              Manage Cover Photos
            </DialogTitle>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto space-y-6 py-4">
            {/* Upload zone */}
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => inputRef.current?.click()}
              className={`
                relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${dragActive ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"}
                ${uploading ? "pointer-events-none opacity-50" : ""}
              `}
            >
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files)}
              />
              <div className="flex flex-col items-center gap-2">
                {uploading ? (
                  <Loader2 className="w-8 h-8 animate-spin text-primary" />
                ) : (
                  <Upload className="w-8 h-8 text-muted-foreground" />
                )}
                <p className="text-sm font-medium">
                  {uploading ? "Uploading..." : "Drop an image here or click to browse"}
                </p>
                <p className="text-xs text-muted-foreground">
                  You&apos;ll be able to crop the image to fit the hero banner (3:1 ratio)
                </p>
              </div>
            </div>

            {/* Cover photos grid */}
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : covers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <p>No cover photos yet.</p>
                <p className="text-sm mt-1">Upload some images to display in the hero section.</p>
              </div>
            ) : (
              <div className="space-y-3">
                <Label>Current Cover Photos ({covers.length})</Label>
                <div className="grid gap-3">
                  {covers.map((cover) => (
                    <div
                      key={cover.id}
                      className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg"
                    >
                      {/* Drag handle (for future reordering) */}
                      <div className="text-muted-foreground cursor-grab">
                        <GripVertical className="w-5 h-5" />
                      </div>

                      {/* Thumbnail - 3:1 aspect ratio preview */}
                      <div className="relative w-36 h-12 rounded-md overflow-hidden bg-muted flex-shrink-0">
                        <Image
                          src={cover.url}
                          alt={cover.caption || "Cover photo"}
                          fill
                          className="object-cover"
                          sizes="144px"
                        />
                      </div>

                      {/* Caption input */}
                      <div className="flex-1 min-w-0">
                        <Input
                          placeholder="Add a caption..."
                          value={cover.caption || ""}
                          onChange={(e) => handleUpdateCaption(cover.id, e.target.value)}
                          className="h-9"
                        />
                      </div>

                      {/* Delete button */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(cover)}
                        className="flex-shrink-0 text-muted-foreground hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-end pt-4 border-t border-border">
            <Button onClick={onClose}>Done</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropper Modal */}
      {imageToCrop && (
        <ImageCropper
          isOpen={cropperOpen}
          imageSrc={imageToCrop}
          onClose={handleCropCancel}
          onCropComplete={handleCropComplete}
        />
      )}
    </>
  );
}
