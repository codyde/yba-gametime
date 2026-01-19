"use client";

import { useState } from "react";
import { Shield, Plus, ImageIcon, LogOut, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";

interface AdminBarProps {
  onCreateGame: () => void;
  onManageCovers: () => void;
}

export function AdminBar({ onCreateGame, onManageCovers }: AdminBarProps) {
  const { isAuthenticated, logout } = useAuth();
  const [isMinimized, setIsMinimized] = useState(false);

  if (!isAuthenticated) return null;

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsMinimized(false)}
          className="rounded-full w-12 h-12 bg-primary hover:bg-primary/90 glow-pink shadow-lg"
        >
          <Shield className="w-5 h-5" />
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-sm border-t border-primary/30 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Left side - Admin indicator */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-full border border-primary/30">
              <Shield className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Admin Mode</span>
            </div>
          </div>

          {/* Center - Quick actions */}
          <div className="flex items-center gap-2">
            <Button
              onClick={onCreateGame}
              size="sm"
              className="glow-pink"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Game
            </Button>
            <Button
              onClick={onManageCovers}
              size="sm"
              variant="outline"
              className="border-primary/50 hover:bg-primary/10"
            >
              <ImageIcon className="w-4 h-4 mr-2" />
              Cover Photos
            </Button>
          </div>

          {/* Right side - Logout and minimize */}
          <div className="flex items-center gap-2">
            <Button
              onClick={logout}
              size="sm"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <Button
              onClick={() => setIsMinimized(true)}
              size="icon"
              variant="ghost"
              className="text-muted-foreground hover:text-foreground h-8 w-8"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
