"use client";

import { useState, useRef, useEffect } from "react";
import { Dribbble, Trophy, X, Loader2, ImageIcon, Trash2 } from "lucide-react";
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
import { Game, SportType, GameStatus } from "@/lib/types";

interface EditGameModalProps {
  isOpen: boolean;
  game: Game;
  onClose: () => void;
}

export function EditGameModal({ isOpen, game, onClose }: EditGameModalProps) {
  const { updateGame, deleteGame } = useGames();

  const [sport, setSport] = useState<SportType>(game.sport);
  const [status, setStatus] = useState<GameStatus>(game.status);
  const [homeTeamName, setHomeTeamName] = useState(game.homeTeam.name);
  const [homeTeamAbbr, setHomeTeamAbbr] = useState(game.homeTeam.abbreviation);
  const [homeTeamScore, setHomeTeamScore] = useState(game.homeTeam.score?.toString() || "");
  const [awayTeamName, setAwayTeamName] = useState(game.awayTeam.name);
  const [awayTeamAbbr, setAwayTeamAbbr] = useState(game.awayTeam.abbreviation);
  const [awayTeamScore, setAwayTeamScore] = useState(game.awayTeam.score?.toString() || "");
  const [date, setDate] = useState(game.date);
  const [time, setTime] = useState("");
  const [location, setLocation] = useState(game.location);
  
  // Background image state
  const [backgroundImage, setBackgroundImage] = useState<string | null>(game.backgroundImage || null);
  const [backgroundPreview, setBackgroundPreview] = useState<string | null>(game.backgroundImage || null);
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const backgroundInputRef = useRef<HTMLInputElement>(null);

  // Convert 12h time to 24h for input
  useEffect(() => {
    const convert12to24 = (time12: string) => {
      const match = time12.match(/(\d+):(\d+)\s*(AM|PM)/i);
      if (!match) return "";
      let hours = parseInt(match[1]);
      const minutes = match[2];
      const period = match[3].toUpperCase();
      
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      
      return `${hours.toString().padStart(2, "0")}:${minutes}`;
    };
    setTime(convert12to24(game.time));
  }, [game.time]);

  const handleBackgroundUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) return;
    
    const preview = URL.createObjectURL(file);
    setBackgroundPreview(preview);
    setUploadingBackground(true);

    try {
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

      const uploadResponse = await fetch(uploadUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });

      if (!uploadResponse.ok) throw new Error('Failed to upload file');

      setBackgroundImage(publicUrl);
    } catch (error) {
      console.error('Failed to upload background:', error);
      setBackgroundPreview(game.backgroundImage || null);
    } finally {
      setUploadingBackground(false);
    }
  };

  const removeBackground = () => {
    if (backgroundPreview && backgroundPreview !== game.backgroundImage) {
      URL.revokeObjectURL(backgroundPreview);
    }
    setBackgroundImage(null);
    setBackgroundPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    // Convert 24h time to 12h format for display
    const formatTime = (time24: string) => {
      const [hours, minutes] = time24.split(":").map(Number);
      const period = hours >= 12 ? "PM" : "AM";
      const hours12 = hours % 12 || 12;
      return `${hours12}:${minutes.toString().padStart(2, "0")} ${period}`;
    };

    await updateGame(game.id, {
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

    setIsSaving(false);
    onClose();
  };

  const handleDelete = async () => {
    await deleteGame(game.id);
    onClose();
  };

  const SportIcon = sport === "basketball" ? Dribbble : Trophy;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SportIcon className="w-5 h-5 text-primary" />
            Edit Game
          </DialogTitle>
          <DialogDescription>
            Update game details, scores, and background image.
          </DialogDescription>
        </DialogHeader>

        {showDeleteConfirm ? (
          <div className="py-6 space-y-4">
            <div className="text-center">
              <Trash2 className="w-12 h-12 text-destructive mx-auto mb-4" />
              <h3 className="text-lg font-semibold">Delete this game?</h3>
              <p className="text-sm text-muted-foreground mt-2">
                This will permanently delete the game and all associated media. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                className="flex-1"
              >
                Delete Game
              </Button>
            </div>
          </div>
        ) : (
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
              <Label className="text-base font-semibold">Home Team (YBA)</Label>
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
                    placeholder="YBA"
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
              <Label className="text-base font-semibold">Away Team (Opponent)</Label>
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

            {/* Background Image */}
            <div className="space-y-3">
              <Label className="text-base font-semibold">Card Background</Label>
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
                  <div 
                    className="h-24 bg-cover bg-center"
                    style={{ backgroundImage: `url(${backgroundPreview})` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-black/20" />
                  </div>
                  
                  {uploadingBackground && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 className="w-6 h-6 animate-spin text-white" />
                    </div>
                  )}

                  <div className="absolute top-2 right-2 flex gap-1">
                    <button
                      type="button"
                      onClick={() => backgroundInputRef.current?.click()}
                      className="p-1.5 bg-black/50 rounded text-white hover:bg-black/70 transition-colors text-xs"
                    >
                      Change
                    </button>
                    <button
                      type="button"
                      onClick={removeBackground}
                      className="p-1.5 bg-black/50 rounded text-white hover:bg-red-500/70 transition-colors"
                    >
                      <X className="w-3 h-3" />
                    </button>
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
            <div className="flex gap-3 pt-4 border-t border-border">
              <Button
                type="button"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
                className="mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="glow-pink"
                disabled={uploadingBackground || isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Changes'
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
