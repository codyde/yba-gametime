"use client";

import { useState } from "react";
import { Dribbble, Trophy, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GameCard } from "./GameCard";
import { Game, SportType } from "@/lib/types";

interface GamesListProps {
  games: Game[];
}

type FilterType = "all" | SportType;

export function GamesList({ games }: GamesListProps) {
  const [filter, setFilter] = useState<FilterType>("all");

  const filteredGames = games.filter((game) => {
    if (filter === "all") return true;
    return game.sport === filter;
  });

  const upcomingGames = filteredGames.filter((g) => g.status === "upcoming");
  const completedGames = filteredGames.filter((g) => g.status === "completed");

  return (
    <div className="space-y-12">
      {/* Filter buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Filter className="w-5 h-5 text-muted-foreground" />
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
          className={filter === "all" ? "glow-pink" : ""}
        >
          All Games
        </Button>
        <Button
          variant={filter === "basketball" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("basketball")}
          className={filter === "basketball" ? "glow-pink" : ""}
        >
          <Dribbble className="w-4 h-4 mr-2" />
          Basketball
        </Button>
        <Button
          variant={filter === "football" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("football")}
          className={filter === "football" ? "glow-pink" : ""}
        >
          <Trophy className="w-4 h-4 mr-2" />
          Football
        </Button>
      </div>

      {/* Upcoming Games */}
      {upcomingGames.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">Upcoming Games</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Completed Games */}
      {completedGames.length > 0 && (
        <section>
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-2xl font-bold">Game Results</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-border to-transparent" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {completedGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {filteredGames.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <div className="flex justify-center gap-4 mb-4 opacity-50">
            <Dribbble className="w-12 h-12" />
            <Trophy className="w-12 h-12" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No Games Yet</h3>
          <p className="text-sm">
            {filter === "all" 
              ? "Games will appear here once they are added."
              : `No ${filter} games found.`}
          </p>
        </div>
      )}
    </div>
  );
}
