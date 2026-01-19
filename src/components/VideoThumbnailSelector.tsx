"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Check, X, SkipBack, SkipForward, Loader2, Play, Pause } from "lucide-react";
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
}: VideoThumbnailSelectorProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [duration, setDuration] = useState(0);
  const [startTime, setStartTime] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCapturing, setIsCapturing] = useState(false);
  const [captureProgress, setCaptureProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewReady, setPreviewReady] = useState(false);

  // Calculate end time (start + 2 seconds, capped at duration)
  const endTime = Math.min(startTime + GIF_DURATION, duration);
  const actualDuration = endTime - startTime;

  // Create video URL on mount
  useEffect(() => {
    if (isOpen) {
      // Use external URL if provided, otherwise create from file
      if (externalVideoUrl) {
        setVideoUrl(externalVideoUrl);
        setIsLoading(true);
        setStartTime(0);
        setPreviewReady(false);
        setIsPlaying(false);
        // No cleanup needed for external URL
      } else if (videoFile) {
        const url = URL.createObjectURL(videoFile);
        setVideoUrl(url);
        setIsLoading(true);
        setStartTime(0);
        setPreviewReady(false);
        setIsPlaying(false);
        return () => URL.revokeObjectURL(url);
      }
    }
  }, [isOpen, videoFile, externalVideoUrl]);

  // Handle video metadata loaded
  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      setDuration(videoRef.current.duration);
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

  // Handle time update from slider
  const handleTimeChange = (value: number[]) => {
    const time = value[0];
    // Ensure we have at least 0.5 seconds of content
    const maxStart = Math.max(0, duration - 0.5);
    const clampedTime = Math.min(time, maxStart);
    setStartTime(clampedTime);
    setIsPlaying(false);
    
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = clampedTime;
      previewVideoRef.current.pause();
    }
  };

  // Skip forward/backward
  const skip = (seconds: number) => {
    const maxStart = Math.max(0, duration - 0.5);
    const newTime = Math.max(0, Math.min(maxStart, startTime + seconds));
    setStartTime(newTime);
    setIsPlaying(false);
    
    if (previewVideoRef.current) {
      previewVideoRef.current.currentTime = newTime;
      previewVideoRef.current.pause();
    }
  };

  // Toggle preview playback
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

  // Handle preview video time update - loop within range
  const handlePreviewTimeUpdate = useCallback(() => {
    if (!previewVideoRef.current || !isPlaying) return;
    
    if (previewVideoRef.current.currentTime >= endTime) {
      previewVideoRef.current.currentTime = startTime;
    }
  }, [startTime, endTime, isPlaying]);

  // Capture GIF frames
  const captureGif = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    setIsCapturing(true);
    setCaptureProgress(0);

    // Set canvas size (scale down for smaller GIF)
    const scale = Math.min(1, 480 / video.videoWidth);
    const width = Math.floor(video.videoWidth * scale);
    const height = Math.floor(video.videoHeight * scale);
    canvas.width = width;
    canvas.height = height;

    const encoder = new GifEncoder(width, height, 10); // 10 centiseconds = 100ms delay
    const frameInterval = actualDuration / GIF_FRAME_COUNT;
    const framesToCapture = Math.floor(actualDuration * GIF_FPS);

    // Capture frames
    for (let i = 0; i < framesToCapture; i++) {
      const frameTime = startTime + (i * frameInterval);
      
      // Seek to frame time
      video.currentTime = frameTime;
      
      // Wait for seek to complete
      await new Promise<void>((resolve) => {
        const onSeeked = () => {
          video.removeEventListener("seeked", onSeeked);
          resolve();
        };
        video.addEventListener("seeked", onSeeked);
      });

      // Draw frame to canvas
      ctx.drawImage(video, 0, 0, width, height);
      
      // Get image data and add to encoder
      const imageData = ctx.getImageData(0, 0, width, height);
      encoder.addFrame(imageData);

      // Update progress
      setCaptureProgress(Math.round(((i + 1) / framesToCapture) * 100));
    }

    // Generate GIF
    try {
      const gifBlob = encoder.encode();
      onSelect(gifBlob);
    } catch (error) {
      console.error("Failed to encode GIF:", error);
    }

    setIsCapturing(false);
    setCaptureProgress(0);
  };

  // Format time as mm:ss.s
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(1);
    return `${mins}:${secs.padStart(4, "0")}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Create Preview GIF</DialogTitle>
          <DialogDescription>
            Select a 2-second range to create an animated preview for this video.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Hidden video element for frame capture */}
          <video
            ref={videoRef}
            src={videoUrl || undefined}
            onLoadedMetadata={handleLoadedMetadata}
            className="hidden"
            muted
            playsInline
            preload="auto"
          />

          {/* Hidden canvas for capturing frames */}
          <canvas ref={canvasRef} className="hidden" />

          {/* Preview video */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden flex items-center justify-center">
            {isLoading ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="w-8 h-8 animate-spin" />
                <span className="text-sm">Loading video...</span>
              </div>
            ) : (
              <>
                <video
                  ref={previewVideoRef}
                  src={videoUrl || undefined}
                  onLoadedData={handlePreviewReady}
                  onTimeUpdate={handlePreviewTimeUpdate}
                  className="w-full h-full object-contain"
                  muted
                  playsInline
                />
                
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

                {/* Range indicator */}
                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-white text-xs bg-black/60 rounded px-2 py-1">
                  <span>Preview: {formatTime(startTime)} - {formatTime(endTime)}</span>
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
              <div className="relative">
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

              {/* Skip buttons */}
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

              {/* Help text */}
              <p className="text-xs text-muted-foreground text-center">
                Click the preview to play/pause. The GIF will capture {GIF_FRAME_COUNT} frames at {GIF_FPS} FPS.
              </p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose} disabled={isCapturing}>
            <X className="w-4 h-4 mr-2" />
            Cancel
          </Button>
          <Button
            onClick={captureGif}
            disabled={isLoading || isCapturing || !previewReady}
            className="glow-pink"
          >
            {isCapturing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creating GIF...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Create GIF Preview
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
