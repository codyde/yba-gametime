"use client";

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from "react";
import { Game } from "./types";

interface GamesContextType {
  games: Game[];
  isLoading: boolean;
  addGame: (game: Omit<Game, "id">) => Promise<void>;
  updateGame: (id: string, game: Partial<Game>) => Promise<void>;
  deleteGame: (id: string) => Promise<void>;
  refreshGames: () => Promise<void>;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export function GamesProvider({ children }: { children: ReactNode }) {
  const [games, setGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch games from API
  const refreshGames = useCallback(async () => {
    try {
      const response = await fetch('/api/games');
      if (response.ok) {
        const data = await response.json();
        setGames(data);
      }
    } catch (error) {
      console.error('Failed to fetch games:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load games on mount
  useEffect(() => {
    refreshGames();
  }, [refreshGames]);

  const addGame = useCallback(async (game: Omit<Game, "id">) => {
    try {
      const response = await fetch('/api/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(game),
      });
      
      if (response.ok) {
        const newGame = await response.json();
        setGames((prev) => [newGame, ...prev]);
      }
    } catch (error) {
      console.error('Failed to add game:', error);
    }
  }, []);

  const updateGame = useCallback(async (id: string, updates: Partial<Game>) => {
    try {
      // Find existing game to merge with updates
      const existingGame = games.find(g => g.id === id);
      if (!existingGame) return;

      const updatedGame = { ...existingGame, ...updates };
      
      const response = await fetch(`/api/games/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedGame),
      });
      
      if (response.ok) {
        setGames((prev) =>
          prev.map((game) => (game.id === id ? updatedGame : game))
        );
      }
    } catch (error) {
      console.error('Failed to update game:', error);
    }
  }, [games]);

  const deleteGame = useCallback(async (id: string) => {
    try {
      const response = await fetch(`/api/games/${id}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setGames((prev) => prev.filter((game) => game.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete game:', error);
    }
  }, []);

  return (
    <GamesContext.Provider value={{ games, isLoading, addGame, updateGame, deleteGame, refreshGames }}>
      {children}
    </GamesContext.Provider>
  );
}

export function useGames() {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error("useGames must be used within a GamesProvider");
  }
  return context;
}
