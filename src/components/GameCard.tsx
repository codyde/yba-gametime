"use client";

import { useState } from "react";
import Link from "next/link";
import { Calendar, MapPin, Clock, Image as ImageIcon, Dribbble, Trophy, Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Game } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";
import { EditGameModal } from "./EditGameModal";

interface GameCardProps {
  game: Game;
}

export function GameCard({ game }: GameCardProps) {
  const { isAuthenticated } = useAuth();
  const [showEditModal, setShowEditModal] = useState(false);
  
  const isCompleted = game.status === "completed";
  const isUpcoming = game.status === "upcoming";
  const isLive = game.status === "live";
  const hasBackground = !!game.backgroundImage;

  const SportIcon = game.sport === "basketball" ? Dribbble : Trophy;

  const homeWon = isCompleted && game.homeTeam.score! > game.awayTeam.score!;
  const awayWon = isCompleted && game.awayTeam.score! > game.homeTeam.score!;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  // Conditional text colors based on background
  const mutedText = hasBackground ? "text-white/70" : "text-muted-foreground";
  const mainText = hasBackground ? "text-white" : "text-foreground";
  const borderColor = hasBackground ? "border-white/20" : "border-border";

  const handleEditClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowEditModal(true);
  };

  return (
    <>
      <Link href={`/game/${game.id}`}>
        <Card className="card-hover border-border hover:border-primary/50 bg-card overflow-hidden cursor-pointer h-full relative group">
          {/* Background image if set */}
          {hasBackground && (
            <>
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${game.backgroundImage})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/70 to-black/50" />
            </>
          )}
          
          {/* Edit button for admins */}
          {isAuthenticated && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleEditClick}
              className={`absolute top-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 ${
                hasBackground 
                  ? "text-white/70 hover:text-white hover:bg-white/20" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <Pencil className="w-4 h-4" />
            </Button>
          )}
          
          <div className="p-5 relative">
            {/* Header with sport badge and status */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${hasBackground ? 'bg-white/20' : 'bg-primary/10'}`}>
                  <SportIcon className="w-4 h-4 text-primary" />
                </div>
                <span className={`text-xs font-medium capitalize ${mutedText}`}>
                  {game.sport}
                </span>
              </div>

              {isLive && (
                <Badge className="bg-red-500 text-white animate-pulse text-xs">
                  LIVE
                </Badge>
              )}
              {isUpcoming && (
                <Badge variant="outline" className={`text-xs ${hasBackground ? 'border-white/50 text-white' : 'border-primary/50 text-primary'}`}>
                  Upcoming
                </Badge>
              )}
              {isCompleted && (
                <Badge variant="secondary" className={`text-xs ${hasBackground ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                  Final
                </Badge>
              )}
            </div>

            {/* Teams and Scores */}
            <div className="space-y-3">
              {/* Home Team Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-sm font-bold w-10 ${mainText}`}>
                    {game.homeTeam.abbreviation}
                  </span>
                  <span className={`text-sm truncate ${mutedText}`}>
                    {game.homeTeam.name}
                  </span>
                </div>
                {isCompleted && (
                  <span
                    className={`text-2xl font-black tabular-nums ${
                      homeWon ? "text-primary" : mutedText
                    }`}
                  >
                    {game.homeTeam.score}
                  </span>
                )}
              </div>

              {/* Away Team Row */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`text-sm font-bold w-10 ${mainText}`}>
                    {game.awayTeam.abbreviation}
                  </span>
                  <span className={`text-sm truncate ${mutedText}`}>
                    {game.awayTeam.name}
                  </span>
                </div>
                {isCompleted && (
                  <span
                    className={`text-2xl font-black tabular-nums ${
                      awayWon ? "text-primary" : mutedText
                    }`}
                  >
                    {game.awayTeam.score}
                  </span>
                )}
              </div>
            </div>

            {/* Game details */}
            <div className={`flex flex-wrap items-center gap-3 pt-4 mt-4 border-t text-xs ${borderColor} ${mutedText}`}>
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{formatDate(game.date)}</span>
              </div>
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>{game.time}</span>
              </div>
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate max-w-[120px]">{game.location}</span>
              </div>
              {game.mediaCount && game.mediaCount > 0 && (
                <div className="flex items-center gap-1 ml-auto text-primary">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span className="font-medium">{game.mediaCount}</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      </Link>

      {/* Edit Modal */}
      {showEditModal && (
        <EditGameModal
          isOpen={showEditModal}
          game={game}
          onClose={() => setShowEditModal(false)}
        />
      )}
    </>
  );
}
