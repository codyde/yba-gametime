"use client";

import { Dribbble, MapPin, Calendar, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Game } from "@/lib/types";

function FootballIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(45 12 12)" />
      <path d="M9 9l6 6" />
      <path d="M10.5 7.5l1-1" />
      <path d="M13.5 10.5l1-1" />
      <path d="M10.5 13.5l-1 1" />
      <path d="M13.5 16.5l-1 1" />
    </svg>
  );
}

interface ScoreboardProps {
  game: Game;
}

export function Scoreboard({ game }: ScoreboardProps) {
  const isCompleted = game.status === "completed";
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

  const textColor = hasBackground ? "text-white" : "";
  const mutedTextColor = hasBackground ? "text-white/70" : "text-muted-foreground";

  return (
    <div className="relative">
      {hasBackground && (
        <>
          <div 
            className="absolute inset-0 bg-cover bg-center rounded-xl"
            style={{ backgroundImage: `url(${game.backgroundImage})` }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/60 to-black/80 rounded-xl" />
        </>
      )}

      <div className="relative py-8 px-4">
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
                  homeWon ? "text-primary" : mutedTextColor
                }`}
              >
                {game.homeTeam.score}
              </div>
            )}
          </div>

          {/* Center - Sport Icon and Status */}
          <div className="flex flex-col items-center">
            <div className={`p-3 rounded-full ${hasBackground ? 'bg-white/20' : 'bg-muted'}`}>
              {game.sport === "basketball" ? (
                <Dribbble className="w-8 h-8 text-primary" />
              ) : (
                <FootballIcon className="w-8 h-8 text-primary" />
              )}
            </div>
            <div className={`mt-3 px-4 py-1 rounded-full font-bold text-sm ${hasBackground ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground'}`}>
              {isCompleted ? "FINAL" : game.status === "live" ? "LIVE" : "VS"}
            </div>
            {game.status === "live" && (
              <Badge className="mt-2 bg-red-500 text-white animate-pulse">
                LIVE
              </Badge>
            )}
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
                  awayWon ? "text-primary" : mutedTextColor
                }`}
              >
                {game.awayTeam.score}
              </div>
            )}
          </div>
        </div>

        {/* Game Info */}
        <div className={`mt-6 flex flex-wrap items-center justify-center gap-6 text-sm ${mutedTextColor}`}>
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
  );
}
