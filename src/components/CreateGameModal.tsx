"use client";

import { useState, useRef } from "react";
import { Dribbble, Trophy, X, Loader2, ImageIcon } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGames } from "@/lib/games-context";
import { SportType, GameStatus } from "@/lib/types";

interface CreateGameModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGameModal({ isOpen, onClose }: CreateGameModalProps) {
  const { addGame } = useGames();

  const [sport, setSport] = useState<SportType>("basketball");
  const [status, setStatus] = useState<GameStatus>("upcoming");
  const [homeTeamName, setHomeTeamName] = useState("");
  const [homeTeamAbbr, setHomeTeamAbbr] = useState("");
  const [homeTeamScore, setHomeTeamScore] = useState("");
  const [awayTeamName, setAwayTeamName] = useState("");
  const [awayTeamAbbr, setAwayTeamAbbr] = useState("");
  const [awayTeamScore, setAwayTeamScore] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [location, setLocation] = useState("");
  
  // Background image state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setSport("basketball");
    setStatus("upcoming");
    setHomeTeamName("");
    setHomeTeamAbbr("");
    setHomeTeamScore("");
    setAwayTeamName("");
    setAwayTeamAbbr("");
    setAwayTeamScore("");
    setDate("");
    setTime("");
    setLocation("");
    setBackgroundImage(null);
    setBackgroundPreview(null);
  };

  const handleBackgroundUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    // Show preview immediately
    const preview = URL.createObjectURL(file);
    setBackgroundPreview(preview);
    setUploadingBackground(true);

    try {
      // Get presigned upload URL
      const urlResponse = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filename: file.name,
          contentType: file.type,
          folder: 'game-backgrounds',
        }),
      });

      if (!urlResponse.ok) throw new Error('Failed to get upload URL');
      
      const { uploadUrl, publicUrl } = await urlResponse.json();

      // Upload to R2
      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      setBackgroundImage(publicUrl);
    } catch (error) {
      console.error('Failed to upload background:', error);
      setBackgroundPreview(null);
    } finally {
      setUploadingBackground(false);
    }
  };

  const removeBackground = () => {
    if (backgroundPreview) {
      URL.revokeObjectURL(backgroundPreview);
    }
    setBackgroundImage(null);
    setBackgroundPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Convert 24h time to 12h format for display
    const formatTime = (time24: string) => {
      const [hours, minutes] = time24.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    addGame({
      sport,
      status,
      homeTeam: {
        name: homeTeamName,
        abbreviation: homeTeamAbbr.toUpperCase(),
        ...(status === "completed" && homeTeamScore
          ? { score: parseInt(homeTeamScore, 10) }
          : {}),
      },
      awayTeam: {
        name: awayTeamName,
        abbreviation: awayTeamAbbr.toUpperCase(),
        ...(status === "completed" && awayTeamScore
          ? { score: parseInt(awayTeamScore, 10) }
          : {}),
      },
      date,
      time: formatTime(time),
      location,
      backgroundImage: backgroundImage || undefined,
    });

    resetForm();
    onClose();
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const SportIcon = sport === "basketball" ? Dribbble : Trophy;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SportIcon className="w-5 h-5 text-primary" />
            Create New Game
          </DialogTitle>
          <DialogDescription>
            Add a new game to the schedule or record a completed game.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 pt-4">
          {/* Sport and Status Row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Sport</Label>
              <Select
                value={sport}
                onValueChange={(v) => setSport(v as SportType)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="basketball">
                    <div className="flex items-center gap-2">
                      <Dribbble className="w-4 h-4" />
                      Basketball
                    </div>
                  </SelectItem>
                  <SelectItem value="football">
                    <div className="flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      Football
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as GameStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="live">Live</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Home Team */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Home Team</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="homeTeamName" className="text-xs text-muted-foreground">
                  Team Name
                </Label>
                <Input
                  id="homeTeamName"
                  value={homeTeamName}
                  onChange={(e) => setHomeTeamName(e.target.value)}
                  placeholder="YBA Lions"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="homeTeamAbbr" className="text-xs text-muted-foreground">
                  Abbr.
                </Label>
                <Input
                  id="homeTeamAbbr"
                  value={homeTeamAbbr}
                  onChange={(e) => setHomeTeamAbbr(e.target.value.slice(0, 3))}
                  placeholder="LIO"
                  maxLength={3}
                  required
                />
              </div>
            </div>
            {status === "completed" && (
              <div className="space-y-2">
                <Label htmlFor="homeTeamScore" className="text-xs text-muted-foreground">
                  Final Score
                </Label>
                <Input
                  id="homeTeamScore"
                  type="number"
                  min="0"
                  value={homeTeamScore}
                  onChange={(e) => setHomeTeamScore(e.target.value)}
                  placeholder="78"
                  required
                />
              </div>
            )}
          </div>

          {/* Away Team */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Away Team</Label>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2 space-y-2">
                <Label htmlFor="awayTeamName" className="text-xs text-muted-foreground">
                  Team Name
                </Label>
                <Input
                  id="awayTeamName"
                  value={awayTeamName}
                  onChange={(e) => setAwayTeamName(e.target.value)}
                  placeholder="Central Hawks"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="awayTeamAbbr" className="text-xs text-muted-foreground">
                  Abbr.
                </Label>
                <Input
                  id="awayTeamAbbr"
                  value={awayTeamAbbr}
                  onChange={(e) => setAwayTeamAbbr(e.target.value.slice(0, 3))}
                  placeholder="HAW"
                  maxLength={3}
                  required
                />
              </div>
            </div>
            {status === "completed" && (
              <div className="space-y-2">
                <Label htmlFor="awayTeamScore" className="text-xs text-muted-foreground">
                  Final Score
                </Label>
                <Input
                  id="awayTeamScore"
                  type="number"
                  min="0"
                  value={awayTeamScore}
                  onChange={(e) => setAwayTeamScore(e.target.value)}
                  placeholder="65"
                  required
                />
              </div>
            )}
          </div>

          {/* Date, Time, Location */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Game Details</Label>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="date" className="text-xs text-muted-foreground">
                  Date
                </Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time" className="text-xs text-muted-foreground">
                  Time
                </Label>
                <Input
                  id="time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="location" className="text-xs text-muted-foreground">
                Location
              </Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Roseville Soccer Complex"
                required
              />
            </div>
          </div>

          {/* Background Image (Optional) */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Card Background (Optional)</Label>
            <p className="text-xs text-muted-foreground">
              Add a background image to make this game card stand out.
            </p>
            
            <input
              ref={backgroundInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleBackgroundUpload(e.target.files[0])}
            />

            {backgroundPreview ? (
              <div className="relative rounded-lg overflow-hidden border border-border">
                {/* Preview */}
                <div 
                  className="h-24 bg-cover bg-center"
                  style={{ backgroundImage: `url(${backgroundPreview})` }}
                >
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
                </div>
                
                {/* Uploading overlay */}
                {uploadingBackground && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}

                {/* Remove button */}
                <button
                  type="button"
                  onClick={removeBackground}
                  className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Preview text */}
                <div className="absolute bottom-2 left-2 text-white text-xs font-medium">
                  Preview
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => backgroundInputRef.current?.click()}
                className="w-full h-20 border-2 border-dashed border-border rounded-lg flex flex-col items-center justify-center gap-1 text-muted-foreground hover:border-primary/50 hover:text-primary transition-colors"
              >
                <ImageIcon className="w-5 h-5" />
                <span className="text-xs">Click to upload background</span>
              </button>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              className="flex-1 glow-pink"
              disabled={uploadingBackground}
            >
              {uploadingBackground ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                'Create Game'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
