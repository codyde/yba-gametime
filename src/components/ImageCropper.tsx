"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Loader2, Check, X, RotateCcw, ZoomIn, ZoomOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Hero aspect ratio - 3:1 (wide banner)
const ASPECT_RATIO = 3 / 1;

interface ImageCropperProps {
  isOpen: boolean;
  imageSrc: string;
  onClose: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
}

function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
): Crop {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 80,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

export function ImageCropper({ isOpen, imageSrc, onClose, onCropComplete }: ImageCropperProps) {
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isProcessing, setIsProcessing] = useState(false);
  const [imageSize, setImageSize] = useState<{ width: number; height: number } | null>(null);
  const [displaySize, setDisplaySize] = useState<{ width: number; height: number } | null>(null);
  const [scale, setScale] = useState(1); // 1 = fit to container, <1 = zoom out, >1 = zoom in
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const MIN_SCALE = 0.3;
  const MAX_SCALE = 2;

  // Calculate the display size based on scale
  useEffect(() => {
    if (!imageSize || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.clientWidth - 32; // Account for padding
    const containerHeight = 450; // Max height for the crop area

    // Calculate base size that fits the container
    const widthRatio = containerWidth / imageSize.width;
    const heightRatio = containerHeight / imageSize.height;
    const baseRatio = Math.min(widthRatio, heightRatio, 1); // Don't upscale by default

    // Apply user scale
    const finalWidth = imageSize.width * baseRatio * scale;
    const finalHeight = imageSize.height * baseRatio * scale;

    setDisplaySize({ width: finalWidth, height: finalHeight });
  }, [imageSize, scale]);

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
    
    // Set initial crop after a brief delay to ensure display size is calculated
    setTimeout(() => {
      if (imgRef.current) {
        const { width, height } = imgRef.current;
        setCrop(centerAspectCrop(width, height, ASPECT_RATIO));
      }
    }, 50);
  }, []);

  // Update crop when display size changes
  useEffect(() => {
    if (displaySize && imgRef.current) {
      setCrop(centerAspectCrop(displaySize.width, displaySize.height, ASPECT_RATIO));
    }
  }, [displaySize]);

  const resetCrop = () => {
    setScale(1);
  };

  const handleScaleChange = (value: number[]) => {
    setScale(value[0]);
  };

  const getCroppedImage = useCallback(async (): Promise<Blob | null> => {
    if (!completedCrop || !imageSize || !displaySize) return null;

    // Load the full resolution image fresh (not the displayed/scaled one)
    const fullResImage = new Image();
    fullResImage.crossOrigin = "anonymous";
    
    await new Promise<void>((resolve, reject) => {
      fullResImage.onload = () => resolve();
      fullResImage.onerror = reject;
      fullResImage.src = imageSrc;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;

    // Calculate scale between displayed size and natural size
    const scaleX = imageSize.width / displaySize.width;
    const scaleY = imageSize.height / displaySize.height;

    // Calculate crop dimensions in natural image coordinates
    const cropX = Math.round(completedCrop.x * scaleX);
    const cropY = Math.round(completedCrop.y * scaleY);
    const cropWidth = Math.round(completedCrop.width * scaleX);
    const cropHeight = Math.round(completedCrop.height * scaleY);

    // Output at EXACT cropped dimensions - no resizing, pure crop
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Disable image smoothing for pixel-perfect crop (no interpolation)
    ctx.imageSmoothingEnabled = false;

    // Draw cropped region 1:1 from full resolution source
    ctx.drawImage(
      fullResImage,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    return new Promise((resolve) => {
      canvas.toBlob(
        (blob) => resolve(blob),
        "image/png" // PNG for lossless output
      );
    });
  }, [completedCrop, imageSize, displaySize, imageSrc]);

  const handleSave = async () => {
    setIsProcessing(true);
    try {
      const croppedBlob = await getCroppedImage();
      if (croppedBlob) {
        onCropComplete(croppedBlob);
      }
    } catch (error) {
      console.error("Failed to crop image:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setScale(1);
      setCrop(undefined);
      setCompletedCrop(undefined);
      setImageSize(null);
      setDisplaySize(null);
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Crop Cover Photo</DialogTitle>
          <DialogDescription>
            Adjust the zoom to see more of the image, then drag the crop area to select the region for the hero banner.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4 flex flex-col">
          {/* Zoom controls */}
          <div className="flex items-center gap-4 mb-4 px-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">Zoom Out</span>
            <ZoomOut className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[scale]}
              min={MIN_SCALE}
              max={MAX_SCALE}
              step={0.05}
              onValueChange={handleScaleChange}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <span className="text-sm text-muted-foreground whitespace-nowrap">Zoom In</span>
            <span className="text-sm font-medium text-foreground w-14 text-right">
              {Math.round(scale * 100)}%
            </span>
          </div>

          {/* Crop area - scrollable container */}
          <div 
            ref={containerRef}
            className="flex-1 bg-muted/30 rounded-lg overflow-auto flex items-center justify-center"
            style={{ minHeight: "400px" }}
          >
            <div className="p-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={ASPECT_RATIO}
                minWidth={50}
                className="max-w-full"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Crop preview"
                  onLoad={onImageLoad}
                  style={{
                    width: displaySize?.width ?? "auto",
                    height: displaySize?.height ?? "auto",
                    maxWidth: "none",
                    maxHeight: "none",
                  }}
                  crossOrigin="anonymous"
                />
              </ReactCrop>
            </div>
          </div>

          {/* Preview info */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>Drag the crop area to reposition • Drag corners to resize • Scroll to see full image</p>
            <p className="mt-1">Output: 3:1 aspect ratio (optimized for hero banner)</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-between pt-4 border-t border-border">
          <Button variant="outline" onClick={resetCrop} disabled={isProcessing}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset Zoom
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isProcessing || !completedCrop} className="glow-pink">
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Use This Crop
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
