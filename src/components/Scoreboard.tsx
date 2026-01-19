"use client";

import { Dribbble, Trophy, MapPin, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/lib/types";

interface ScoreboardProps {
  game: Game;
}

export function Scoreboard({ game }: ScoreboardProps) {
  const isCompleted = game.status === "completed";
  const SportIcon = game.sport === "basketball" ? Dribbble : Trophy;
  const hasBackground = !!game.backgroundImage;

  const homeWon = isCompleted && game.homeTeam.score! > game.awayTeam.score!;
  const awayWon = isCompleted && game.awayTeam.score! > game.homeTeam.score!;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Conditional styles based on background
  const textColor = hasBackground ? "text-white" : "";
  const mutedTextColor = hasBackground ? "text-white/70" : "text-muted-foreground";
  const borderColor = hasBackground ? "border-white/20" : "border-border";

  return (
    <div className={`rounded-xl overflow-hidden relative ${hasBackground ? '' : 'bg-card border border-border'}`}>
      {/* Background image */}
      {hasBackground && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center"
            style={{ backgroundImage: `url(${game.backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80" />
        </>
      )}

      {/* Content wrapper */}
      <div className="relative">
        {/* Header */}
        <div className={`p-4 border-b ${borderColor} ${hasBackground ? 'bg-black/20' : 'bg-gradient-to-r from-primary/20 via-primary/10 to-transparent'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${hasBackground ? 'bg-white/20' : 'bg-primary/20'}`}>
                <SportIcon className="w-6 h-6 text-primary" />
              </div>
              <div>
                <span className={`text-lg font-semibold capitalize ${textColor}`}>{game.sport}</span>
                {isCompleted && (
                  <Badge variant="secondary" className={`ml-3 ${hasBackground ? 'bg-white/20 text-white' : 'bg-muted'}`}>
                    Final
                  </Badge>
                )}
                {game.status === "live" && (
                  <Badge className="ml-3 bg-red-500 text-white animate-pulse">
                    LIVE
                  </Badge>
                )}
                {game.status === "upcoming" && (
                  <Badge variant="outline" className={`ml-3 ${hasBackground ? 'border-white/50 text-white' : 'border-primary/50 text-primary'}`}>
                    Upcoming
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="p-8">
          <div className="flex items-center justify-center gap-8 md:gap-16">
            {/* Home Team */}
            <div className="flex-1 text-center">
              <div className={`text-3xl md:text-4xl font-black mb-2 ${textColor}`}>
                {game.homeTeam.abbreviation}
              </div>
              <div className={`mb-4 ${mutedTextColor}`}>{game.homeTeam.name}</div>
              {isCompleted && (
                <div
                  className={`text-6xl md:text-7xl font-black ${
                    homeWon ? "text-primary glow-pink" : mutedTextColor
                  }`}
                >
                  {game.homeTeam.score}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="flex flex-col items-center">
              <div className={`w-px h-16 bg-gradient-to-b from-transparent ${hasBackground ? 'via-white/30' : 'via-border'} to-transparent`} />
              <div className={`my-4 px-4 py-2 rounded-full font-bold text-sm ${hasBackground ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
                {isCompleted ? "FINAL" : game.status === "live" ? "LIVE" : "VS"}
              </div>
              <div className={`w-px h-16 bg-gradient-to-b from-transparent ${hasBackground ? 'via-white/30' : 'via-border'} to-transparent`} />
            </div>

            {/* Away Team */}
            <div className="flex-1 text-center">
              <div className={`text-3xl md:text-4xl font-black mb-2 ${textColor}`}>
                {game.awayTeam.abbreviation}
              </div>
              <div className={`mb-4 ${mutedTextColor}`}>{game.awayTeam.name}</div>
              {isCompleted && (
                <div
                  className={`text-6xl md:text-7xl font-black ${
                    awayWon ? "text-primary glow-pink" : mutedTextColor
                  }`}
                >
                  {game.awayTeam.score}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Game Info */}
        <div className={`p-4 border-t ${borderColor} ${hasBackground ? 'bg-black/30' : 'bg-muted/30'}`}>
          <div className={`flex flex-wrap items-center justify-center gap-6 text-sm ${mutedTextColor}`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-primary" />
              <span>{formatDate(game.date)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary" />
              <span>{game.time}</span>
            </div>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-primary" />
              <span>{game.location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
