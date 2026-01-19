"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Dribbble, ChevronRight, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Game, heroBackgroundImages } from "@/lib/types";
import { useAuth } from "@/lib/auth-context";

interface CoverPhoto {
  id: string;
  url: string;
  caption: string | null;
}

interface HeroProps {
  games: Game[];
  onManageCovers?: () => void;
}

export function Hero({ games, onManageCovers }: HeroProps) {
  const { isAuthenticated, openLogin, user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [coverPhotos, setCoverPhotos] = useState<CoverPhoto[]>([]);

  // Fetch cover photos from database
  useEffect(() => {
    const fetchCovers = async () => {
      try {
        const response = await fetch('/api/covers');
        if (response.ok) {
          const data = await response.json();
          setCoverPhotos(data);
        }
      } catch (error) {
        console.error('Failed to fetch cover photos:', error);
      }
    };
    fetchCovers();
  }, []);

  // Use database covers if available, otherwise use defaults
  const images = coverPhotos.length > 0 
    ? coverPhotos.map(c => c.url) 
    : heroBackgroundImages;

  // Get most recent completed game for scoreboard
  const mostRecentGame = games
    .filter((g) => g.status === "completed")
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  // Rotate background images
  useEffect(() => {
    if (images.length <= 1) return;

    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentImageIndex((prev) => (prev + 1) % images.length);
        setIsTransitioning(false);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, [images.length]);

  const SportIcon = mostRecentGame?.sport === "basketball" ? Dribbble : Trophy;

  return (
    <section className="relative overflow-hidden min-h-[500px]">
      {/* Rotating background images */}
      <div className="absolute inset-0">
        {images.map((image, index) => (
          <div
            key={image}
            className={`absolute inset-0 transition-opacity duration-500 ${
              index === currentImageIndex && !isTransitioning
                ? "opacity-100"
                : "opacity-0"
            }`}
            style={{
              backgroundImage: `url(${image})`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/70 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent" />

        {/* Admin edit button */}
        {isAdmin && onManageCovers && (
          <button
            onClick={onManageCovers}
            className="absolute top-4 right-4 z-10 flex items-center gap-2 px-3 py-2 bg-black/60 hover:bg-black/80 backdrop-blur-sm border border-white/20 hover:border-primary/50 rounded-lg text-white text-sm font-medium transition-all group"
          >
            <Pencil className="w-4 h-4 group-hover:text-primary transition-colors" />
            <span className="hidden sm:inline">Edit Cover Photos</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="relative container mx-auto px-4 py-16 sm:py-24">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
          {/* Left side - Branding */}
          <div className="flex flex-col items-center lg:items-start text-center lg:text-left space-y-6 max-w-xl">
            {/* Sport icons */}
            <div className="flex items-center gap-4 text-primary/80">
              <Dribbble className="w-8 h-8" />
              <span className="w-2 h-2 rounded-full bg-primary" />
              <Trophy className="w-8 h-8" />
            </div>

            {/* Main heading */}
            <h1 className="text-5xl sm:text-7xl font-black tracking-tight">
              <span className="text-gradient-pink">YBA</span>{" "}
              <span className="text-foreground">Gametime</span>
            </h1>

            {/* Subtitle */}
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl">
              Your home for YBA Basketball and Football. View game results,
              scores, and relive the action through photos and videos.
            </p>

            {/* Image indicators */}
            {images.length > 1 && (
              <div className="flex gap-2 pt-4">
                {images.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      setIsTransitioning(true);
                      setTimeout(() => {
                        setCurrentImageIndex(index);
                        setIsTransitioning(false);
                      }, 300);
                    }}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentImageIndex
                        ? "bg-primary w-6"
                        : "bg-muted-foreground/50 hover:bg-muted-foreground"
                    }`}
                    aria-label={`View image ${index + 1}`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Right side - Scoreboard */}
          {mostRecentGame && (
            <Link href={`/game/${mostRecentGame.id}`} className="w-full max-w-md block group">
              <div className="bg-black/40 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden glow-pink transition-all duration-300 group-hover:scale-[1.02] group-hover:border-primary/50">
                {/* Header */}
                <div className="bg-white/5 px-6 py-3 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <SportIcon className="w-5 h-5 text-primary" />
                    <span className="text-sm font-medium text-white/70 uppercase tracking-wider">
                      Latest Result
                    </span>
                  </div>
                  <span className="text-xs font-semibold bg-white/10 text-white px-2 py-1 rounded">
                    FINAL
                  </span>
                </div>

                {/* Scoreboard content */}
                <div className="p-6">
                  <div className="flex items-center justify-between">
                    {/* Home Team */}
                    <div className="text-center flex-1">
                      <div className="text-2xl font-bold text-white mb-1">
                        {mostRecentGame.homeTeam.abbreviation}
                      </div>
                      <div className="text-sm text-white/60 mb-3 truncate px-2">
                        {mostRecentGame.homeTeam.name}
                      </div>
                      <div
                        className={`text-5xl font-black ${
                          mostRecentGame.homeTeam.score! >
                          mostRecentGame.awayTeam.score!
                            ? "text-primary"
                            : "text-white/50"
                        }`}
                      >
                        {mostRecentGame.homeTeam.score}
                      </div>
                    </div>

                    {/* Divider */}
                    <div className="flex flex-col items-center px-4">
                      <div className="text-white/50 text-lg font-bold">
                        -
                      </div>
                    </div>

                    {/* Away Team */}
                    <div className="text-center flex-1">
                      <div className="text-2xl font-bold text-white mb-1">
                        {mostRecentGame.awayTeam.abbreviation}
                      </div>
                      <div className="text-sm text-white/60 mb-3 truncate px-2">
                        {mostRecentGame.awayTeam.name}
                      </div>
                      <div
                        className={`text-5xl font-black ${
                          mostRecentGame.awayTeam.score! >
                          mostRecentGame.homeTeam.score!
                            ? "text-primary"
                            : "text-white/50"
                        }`}
                      >
                        {mostRecentGame.awayTeam.score}
                      </div>
                    </div>
                  </div>

                  {/* Game info */}
                  <div className="mt-6 pt-4 border-t border-white/10 text-center text-sm text-white/60">
                    <span>{new Date(mostRecentGame.date).toLocaleDateString("en-US", {
                      weekday: "short",
                      month: "short",
                      day: "numeric",
                    })}</span>
                    <span className="mx-2">•</span>
                    <span>{mostRecentGame.location}</span>
                  </div>

                  {/* View game link */}
                  <div className="mt-4 flex items-center justify-center gap-1 text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    <span>View Game & Media</span>
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Link>
          )}

          {/* Empty state when no games */}
          {!mostRecentGame && (
            <div className="w-full max-w-md">
              <div className="bg-card/90 backdrop-blur-sm border border-border rounded-xl overflow-hidden">
                <div className="p-8 text-center">
                  <div className="flex justify-center gap-4 mb-4 text-muted-foreground">
                    <Dribbble className="w-8 h-8" />
                    <Trophy className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
                  <p className="text-sm text-muted-foreground">
                    Game results will appear here once games are added.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom border glow */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
    </section>
  );
}
