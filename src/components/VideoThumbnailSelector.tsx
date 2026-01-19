"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, SkipBack, SkipForward, Loader2, Play, Pause, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { GifEncoder } from "@/lib/gif-encoder";

interface VideoThumbnailSelectorProps {
  isOpen: boolean;
  videoFile?: File;
  videoUrl?: string;
  onClose: () => void;
  onSelect: (thumbnailBlob: Blob) => void;
  embedded?: boolean; // When true, renders without dialog wrapper
}

const GIF_DURATION = 2; // 2 seconds
const GIF_FPS = 10; // 10 frames per second
const GIF_FRAME_COUNT = GIF_DURATION * GIF_FPS; // 20 frames total

export function VideoThumbnailSelector({
  isOpen,
  videoFile,
  videoUrl: externalVideoUrl,
  onClose,
  onSelect,
  embedded = false,
}: VideoThumbnailSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null); // Hidden video for frame capture
  const previewVideoRef = useRef<HTMLVideoElement>(null); // Visible video for preview
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isRemoteUrl, setIsRemoteUrl] = useState(false); // Track if URL is remote (needs CORS)
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);
  
  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  // Mobile detection
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Calculate end time (start + 2 seconds, capped at duration)
  const endTime = Math.min(startTime + GIF_DURATION, duration);
  const actualDuration = endTime - startTime;

  // Create video URL on mount
  useEffect(() => {
    if (isOpen || embedded) {
      let url: string | null = null;
      let remote = false;
      
      if (externalVideoUrl) {
        url = externalVideoUrl;
        remote = true; // External URLs are remote
      } else if (videoFile) {
        url = URL.createObjectURL(videoFile);
        remote = false; // Blob URLs are local
      }
      
      if (url) {
        console.log("[VideoThumbnailSelector] URL type:", remote ? "REMOTE" : "LOCAL BLOB", url.substring(0, 50));
        setVideoUrl(url);
        setIsRemoteUrl(remote);
        setIsLoading(true);
        setStartTime(0);
        setPreviewReady(false);
        setIsPlaying(false);
        
        // Return cleanup for blob URLs
        if (videoFile) {
          return () => URL.revokeObjectURL(url!);
        }
      }
    }
  }, [isOpen, embedded, videoFile, externalVideoUrl]);

  // Explicitly load video when URL changes (needed for iOS Safari)
  useEffect(() => {
    if (videoUrl) {
      // For embedded mode, load the preview video; otherwise load hidden video
      const videoElement = embedded ? previewVideoRef.current : videoRef.current;
      if (videoElement) {
        videoElement.load();
      }
    }
  }, [videoUrl, embedded]);

  // For embedded/mobile mode, use the preview video for metadata
  // For desktop dialog mode, use the hidden video
  const handleLoadedMetadata = () => {
    const video = embedded ? previewVideoRef.current : videoRef.current;
    if (video) {
      setDuration(video.duration);
      setIsLoading(false);
    }
  };

  // Handle preview video ready
  const handlePreviewReady = () => {
    setPreviewReady(true);
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = startTime;
    }
  };

  const handleTimeChange = (value: number[]) => {
    const time = value[0];
    const maxStart = Math.max(0, duration - 0.5);
    const clampedTime = Math.min(time, maxStart);
    setStartTime(clampedTime);
    setIsPlaying(false);
    
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = clampedTime;
      previewVideoRef.current.pause();
    }
  };

  const skip = useCallback((seconds: number) => {
    const maxStart = Math.max(0, duration - 0.5);
    const newTime = Math.max(0, Math.min(maxStart, startTime + seconds));
    setStartTime(newTime);
    setIsPlaying(false);
    
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = newTime;
      previewVideoRef.current.pause();
    }
  }, [duration, startTime]);

  const togglePreview = useCallback(() => {
    if (!previewVideoRef.current) return;

    if (isPlaying) {
      previewVideoRef.current.pause();
      setIsPlaying(false);
    } else {
      previewVideoRef.current.currentTime = startTime;
      previewVideoRef.current.play();
      setIsPlaying(true);
    }
  }, [isPlaying, startTime]);

  const handlePreviewTimeUpdate = useCallback(() => {
    if (!previewVideoRef.current || !isPlaying) return;
    
    if (previewVideoRef.current.currentTime >= endTime) {
      previewVideoRef.current.currentTime = startTime;
    }
  }, [startTime, endTime, isPlaying]);

  // Touch handlers for swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    const threshold = 50; // minimum swipe distance
    
    if (Math.abs(diff) > threshold) {
      if (diff > 0) {
        // Swiped left - skip forward
        skip(1);
      } else {
        // Swiped right - skip backward
        skip(-1);
      }
    }
    
    setTouchStart(null);
  };

  const captureGif = async () => {
    // On mobile/embedded mode, use the visible preview video for capture
    // On desktop, use the hidden video (better for seeking without visual disruption)
    const video = embedded ? previewVideoRef.current : videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsCapturing(true);
    setCaptureProgress(0);

    const scale = Math.min(1, 480 / video.videoWidth);
    const width = Math.floor(video.videoWidth * scale);
    const height = Math.floor(video.videoHeight * scale);
    canvas.width = width;
    canvas.height = height;

    const encoder = new GifEncoder(width, height, 10);
    const frameInterval = actualDuration / GIF_FRAME_COUNT;
    const framesToCapture = Math.floor(actualDuration * GIF_FPS);

    for (let i = 0; i < framesToCapture; i++) {
      const frameTime = startTime + (i * frameInterval);
      
      video.currentTime = frameTime;
      
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      ctx.drawImage(video, 0, 0, width, height);
      
      const imageData = ctx.getImageData(0, 0, width, height);
      encoder.addFrame(imageData);

      setCaptureProgress(Math.round(((i + 1) / framesToCapture) * 100));
    }

    try {
      const gifBlob = encoder.encode();
      onSelect(gifBlob);
    } catch (error) {
      console.error("Failed to encode GIF:", error);
    }

    setIsCapturing(false);
    setCaptureProgress(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, "0")}`;
  };

  // Render the content (shared between embedded and dialog modes)
  const renderContent = () => (
    <div className="space-y-4" ref={containerRef}>
      {/* Hidden video element for frame capture - only needed on desktop */}
      {!embedded && (
        <video
          ref={videoRef}
          src={videoUrl || undefined}
          crossOrigin={isRemoteUrl ? "anonymous" : undefined}
          onLoadedMetadata={handleLoadedMetadata}
          className="hidden"
          muted
          playsInline
          preload="auto"
        />
      )}

      {/* Hidden canvas for capturing frames */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Preview video */}
      <div 
        className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {/* Always render video, but show loading overlay */}
        <video
          ref={previewVideoRef}
          src={videoUrl || undefined}
          crossOrigin={isRemoteUrl ? "anonymous" : undefined}
          onLoadedMetadata={embedded ? handleLoadedMetadata : undefined}
          onLoadedData={handlePreviewReady}
          onTimeUpdate={handlePreviewTimeUpdate}
          onCanPlay={() => {
            // Fallback: if loadedMetadata didn't fire, use canPlay
            if (isLoading && previewVideoRef.current) {
              setDuration(previewVideoRef.current.duration);
              setIsLoading(false);
            }
          }}
          className={`w-full h-full object-contain ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          muted
          playsInline
          preload="auto"
        />

        {isLoading && (
          <button
            className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground"
            onClick={() => {
              // On mobile, user tap might be needed to trigger video load
              if (previewVideoRef.current) {
                previewVideoRef.current.load();
                previewVideoRef.current.play().then(() => {
                  previewVideoRef.current?.pause();
                }).catch(() => {
                  // Ignore play errors, the load is what matters
                });
              }
            }}
          >
            <Loader2 className="w-8 h-8 animate-spin" />
            <span className="text-sm">Loading video...</span>
            {isMobile && <span className="text-xs">Tap if stuck</span>}
          </button>
        )}

        {!isLoading && (
          <>
            
            {/* Play/Pause overlay */}
            {previewReady && (
              <button
                onClick={togglePreview}
                className="absolute inset-0 flex items-center justify-center bg-black/20 hover:bg-black/30 transition-colors group"
              >
                <div className={`p-4 rounded-full bg-black/50 text-white transition-opacity ${isPlaying ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}>
                  {isPlaying ? (
                    <Pause className="w-8 h-8" />
                  ) : (
                    <Play className="w-8 h-8 ml-1" />
                  )}
                </div>
              </button>
            )}

            {/* Swipe hint for mobile */}
            {isMobile && previewReady && !isPlaying && (
              <div className="absolute top-2 left-0 right-0 flex justify-center pointer-events-none">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 rounded-full text-white text-xs">
                  <ChevronLeft className="w-4 h-4" />
                  <span>Swipe to skip</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            )}

            {/* Range indicator */}
            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs sm:text-sm bg-black/60 rounded px-2 py-1">
              <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
              <span className="text-primary font-medium">{actualDuration.toFixed(1)}s</span>
            </div>
          </>
        )}

        {/* Capturing overlay */}
        {isCapturing && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3">
            <Loader2 className="w-10 h-10 animate-spin text-primary" />
            <div className="text-white text-sm">Creating GIF... {captureProgress}%</div>
            <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
              <div 
                className="h-full bg-primary transition-all duration-150"
                style={{ width: `${captureProgress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Timeline controls */}
      {!isLoading && (
        <div className="space-y-4">
          {/* Time display */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{formatTime(0)}</span>
            <span className="text-foreground font-medium">
              Start: {formatTime(startTime)}
            </span>
            <span>{formatTime(duration)}</span>
          </div>

          {/* Slider with range indicator */}
          <div className="relative py-2">
            <Slider
              value={[startTime]}
              min={0}
              max={Math.max(0, duration - 0.5)}
              step={0.1}
              onValueChange={handleTimeChange}
              className="w-full"
            />
            
            {/* Visual indicator of the 2-second range on the slider track */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 h-2 bg-primary/30 rounded pointer-events-none"
              style={{
                left: `${(startTime / duration) * 100}%`,
                width: `${(actualDuration / duration) * 100}%`,
              }}
            />
          </div>

          {/* Skip buttons - simplified on mobile */}
          {isMobile ? (
            <div className="flex items-center justify-center gap-3">
              <Button
                variant="outline"
                size="lg"
                onClick={() => skip(-1)}
                disabled={startTime <= 0 || isCapturing}
                className="flex-1 h-12"
              >
                <SkipBack className="w-5 h-5 mr-2" />
                -1s
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => skip(1)}
                disabled={startTime >= duration - 0.5 || isCapturing}
                className="flex-1 h-12"
              >
                +1s
                <SkipForward className="w-5 h-5 ml-2" />
              </Button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(-5)}
                disabled={startTime <= 0 || isCapturing}
              >
                <SkipBack className="w-4 h-4 mr-1" />
                -5s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(-1)}
                disabled={startTime <= 0 || isCapturing}
              >
                -1s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(-0.5)}
                disabled={startTime <= 0 || isCapturing}
              >
                -0.5s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(0.5)}
                disabled={startTime >= duration - 0.5 || isCapturing}
              >
                +0.5s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(1)}
                disabled={startTime >= duration - 0.5 || isCapturing}
              >
                +1s
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => skip(5)}
                disabled={startTime >= duration - 0.5 || isCapturing}
              >
                +5s
                <SkipForward className="w-4 h-4 ml-1" />
              </Button>
            </div>
          )}

          {/* Help text */}
          <p className="text-xs text-muted-foreground text-center">
            {isMobile 
              ? "Swipe on video or use buttons to navigate. Tap to play/pause."
              : `Click the preview to play/pause. The GIF will capture ${GIF_FRAME_COUNT} frames at ${GIF_FPS} FPS.`
            }
          </p>
        </div>
      )}

      {/* Actions */}
      <div className={`flex gap-3 pt-4 border-t border-border ${embedded ? 'flex-col sm:flex-row sm:justify-end' : 'justify-end'}`}>
        <Button 
          variant="outline" 
          onClick={onClose} 
          disabled={isCapturing}
          className={embedded ? 'w-full sm:w-auto order-2 sm:order-1' : ''}
        >
          <X className="w-4 h-4 mr-2" />
          {embedded ? 'Skip' : 'Cancel'}
        </Button>
        <Button
          onClick={captureGif}
          disabled={isLoading || isCapturing || !previewReady}
          className={`glow-pink ${embedded ? 'w-full sm:w-auto order-1 sm:order-2' : ''}`}
        >
          {isCapturing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Creating GIF...
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              {embedded ? 'Use This Preview' : 'Create GIF Preview'}
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // If embedded, render without dialog wrapper
  if (embedded) {
    return <div className="p-4">{renderContent()}</div>;
  }

  // Otherwise render with dialog
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Preview GIF</DialogTitle>
          <DialogDescription>
            Select a 2-second range to create an animated preview for this video.
          </DialogDescription>
        </DialogHeader>
        {renderContent()}
      </DialogContent>
    </Dialog>
  );
}
