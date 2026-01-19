"use client";

import { useState, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { GamesList } from "@/components/GamesList";
import { LoginModal } from "@/components/LoginModal";
import { CreateGameModal } from "@/components/CreateGameModal";
import { CoverPhotosModal } from "@/components/CoverPhotosModal";
import { useAuth } from "@/lib/auth-context";
import { useGames } from "@/lib/games-context";
import { useKeyboardShortcut } from "@/lib/use-keyboard-shortcut";

export default function Home() {
  const { openLogin, isAuthenticated } = useAuth();
  const { games, isLoading } = useGames();
  const [isCreateGameOpen, setIsCreateGameOpen] = useState(false);
  const [isCoverPhotosOpen, setIsCoverPhotosOpen] = useState(false);

  // Cmd+K to open login/admin panel
  useKeyboardShortcut("k", openLogin);

  const handleCreateGame = useCallback(() => {
    setIsCreateGameOpen(true);
  }, []);

  const handleManageCovers = useCallback(() => {
    setIsCoverPhotosOpen(true);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header - always visible */}
      <Header onCreateGame={handleCreateGame} />

      <Hero games={games} onManageCovers={handleManageCovers} />

      <main className="container mx-auto px-4 py-12">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <GamesList games={games} />
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-4 py-8 text-center text-sm text-muted-foreground">
          <p className="text-gradient-pink font-semibold">YBA Gametime</p>
          <p className="mt-1">Basketball and Football highlights</p>
          {!isAuthenticated && (
            <p className="mt-3 text-xs opacity-50">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Cmd+K</kbd> to sign in
            </p>
          )}
        </div>
      </footer>

      {/* Modals */}
      <LoginModal onCreateGame={handleCreateGame} />
      <CreateGameModal
        isOpen={isCreateGameOpen}
        onClose={() => setIsCreateGameOpen(false)}
      />
      <CoverPhotosModal
        isOpen={isCoverPhotosOpen}
        onClose={() => setIsCoverPhotosOpen(false)}
      />
    </div>
  );
}
