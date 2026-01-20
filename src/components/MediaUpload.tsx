"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Upload, Video, Loader2, Check, AlertCircle } from "lucide-react";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from "@/components/ui/drawer";

interface UploadingFile {
  file: File;
  type: "image" | "video";
  mediaId: string | null; // Set after upload completes
  progress: number;
  status: "uploading" | "done" | "error";
}

interface MediaUploadProps {
  gameId: string;
  onUploadComplete?: () => void;
}

export function MediaUpload({ gameId, onUploadComplete }: MediaUploadProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const [files, setFiles] = useState<UploadingFile[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const updateFileStatus = useCallback((index: number, updates: Partial<UploadingFile>) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles[index] = { ...newFiles[index], ...updates };
      return newFiles;
    });
  }, []);

  // Upload a single file
  const uploadFile = useCallback(async (file: File, index: number) => {
    const isVideo = file.type.startsWith("video/");
    
    try {
      updateFileStatus(index, { progress: 10 });

      // Get presigned upload URL
      const urlResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: `games/${gameId}`,
        }),
      });

      if (!urlResponse.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, publicUrl } = await urlResponse.json();
      updateFileStatus(index, { progress: 30 });

      // Upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload');
      updateFileStatus(index, { progress: 70 });

      // Save to database (without thumbnail for now)
      const saveResponse = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          type: isVideo ? "video" : "image",
          url: publicUrl,
          thumbnail: null,
          caption: null,
          tags: null,
          uploader: session?.user?.name || 'Anonymous',
          uploaderId: session?.user?.id || null,
        }),
      });

      if (!saveResponse.ok) throw new Error('Failed to save');
      
      const savedMedia = await saveResponse.json();
      updateFileStatus(index, { 
        mediaId: savedMedia.id,
        progress: 100, 
        status: "done",
      });

    } catch (error) {
      console.error('Upload failed:', error);
      updateFileStatus(index, { status: "error", progress: 0 });
    }
  }, [gameId, session, updateFileStatus]);

  // Handle file selection - immediately start uploading
  const handleFiles = useCallback((fileList: FileList) => {
    const validFiles = Array.from(fileList).filter(
      (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
    );

    if (validFiles.length === 0) return;

    // Initialize upload state
    const initialFiles: UploadingFile[] = validFiles.map((file) => ({
      file,
      type: file.type.startsWith("video/") ? "video" : "image",
      mediaId: null,
      progress: 0,
      status: "uploading",
    }));

    setFiles(initialFiles);
    setOpen(true);

    // Start all uploads
    validFiles.forEach((file, index) => {
      uploadFile(file, index);
    });
  }, [uploadFile]);

  // Check when all uploads are done
  useEffect(() => {
    if (files.length === 0) return;
    
    const allUploaded = files.every((f) => f.status === "done" || f.status === "error");
    if (!allUploaded) return;

    // Find first successfully uploaded video to redirect to
    const firstVideo = files.find((f) => f.status === "done" && f.type === "video");
    
    if (firstVideo?.mediaId) {
      // Redirect to video page for thumbnail generation after a short delay
      // ?new=1 triggers auto-open of thumbnail drawer
      setTimeout(() => {
        onUploadComplete?.();
        router.push(`/video/${firstVideo.mediaId}?new=1`);
      }, 1500);
    } else {
      // No videos - just complete
      setTimeout(() => {
        onUploadComplete?.();
        handleClose();
      }, 1500);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [files, router, onUploadComplete]);

  const handleClose = () => {
    // Don't close while uploading
    if (files.some((f) => f.status === "uploading")) return;
    
    setOpen(false);
    setFiles([]);
  };

  // Calculate progress
  const overallProgress = files.length > 0
    ? Math.round(files.reduce((sum, f) => sum + f.progress, 0) / files.length)
    : 0;

  const allUploaded = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error");
  const successCount = files.filter((f) => f.status === "done").length;
  const errorCount = files.filter((f) => f.status === "error").length;

  // Render upload progress UI
  const renderUploadProgress = () => (
    <div className="p-6 space-y-6">
      {/* Overall progress bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="font-medium">
            {allUploaded ? "Upload Complete" : `Uploading ${files.length} file${files.length !== 1 ? 's' : ''}...`}
          </span>
          <span className="text-muted-foreground">{overallProgress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-300 ease-out"
            style={{ width: `${overallProgress}%` }}
          />
        </div>
      </div>

      {/* Individual file status */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {files.map((file, index) => (
          <div key={index} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg">
            <div className="w-8 h-8 rounded flex items-center justify-center flex-shrink-0">
              {file.status === "uploading" && (
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
              )}
              {file.status === "done" && (
                <Check className="w-5 h-5 text-green-500" />
              )}
              {file.status === "error" && (
                <AlertCircle className="w-5 h-5 text-destructive" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">{file.file.name}</p>
            </div>
            {file.type === "video" && (
              <Video className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            )}
          </div>
        ))}
      </div>

      {/* Status summary */}
      {allUploaded && (
        <div className="text-center pt-2">
          {errorCount === 0 ? (
            <>
              <p className="text-sm text-green-600">All files uploaded successfully!</p>
              {files.some((f) => f.type === "video") && (
                <p className="text-xs text-muted-foreground mt-1">Redirecting to video page...</p>
              )}
            </>
          ) : (
            <p className="text-sm text-amber-600">
              {successCount} uploaded, {errorCount} failed
            </p>
          )}
        </div>
      )}
    </div>
  );

  // Mobile render
  if (isMobile) {
    return (
      <>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFiles(e.target.files);
            }
            e.target.value = '';
          }}
        />
        
        <Button className="glow-pink" onClick={() => inputRef.current?.click()}>
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>

        <Drawer open={open} onOpenChange={(o) => !o && handleClose()}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerHeader>
              <DrawerTitle>
                {allUploaded ? "Upload Complete" : "Uploading..."}
              </DrawerTitle>
            </DrawerHeader>
            
            {renderUploadProgress()}
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop render
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleFiles(e.target.files);
          }
          e.target.value = '';
        }}
      />

      <Dialog open={open} onOpenChange={(o) => !o && handleClose()}>
        <DialogTrigger asChild>
          <Button className="glow-pink" onClick={() => setTimeout(() => inputRef.current?.click(), 100)}>
            <Upload className="w-4 h-4 mr-2" />
            Upload Media
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {allUploaded ? "Upload Complete" : "Uploading Media"}
            </DialogTitle>
          </DialogHeader>
          {renderUploadProgress()}
          
        </DialogContent>
      </Dialog>
    </>
  );
}
