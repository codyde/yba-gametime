"use client";

import Link from "next/link";
import { LogOut, User, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth-context";

interface HeaderProps {
  onCreateGame?: () => void;
}

export function Header({ onCreateGame }: HeaderProps) {
  const { isAuthenticated, user, logout, isLoading, openLogin } = useAuth();

  const isAdmin = user?.role === "admin";

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border/50">
      <div className="container mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="font-bold text-lg">
          <span className="text-gradient-pink">YBA</span>{" "}
          <span className="text-foreground">Gametime</span>
        </Link>

        {/* Right side - Sign in (not authenticated) or User menu (authenticated) */}
        {!isLoading && (
          <>
            {isAuthenticated && user && (
              <div className="flex items-center gap-3">
                {/* New Game button for admins */}
                {isAdmin && onCreateGame && (
                  <Button
                    onClick={onCreateGame}
                    size="sm"
                    className="glow-pink"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Game
                  </Button>
                )}

                {/* User dropdown with admin styling */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      className={`flex items-center gap-2 h-9 px-2 ${
                        isAdmin ? "ring-2 ring-primary/50 ring-offset-2 ring-offset-background rounded-full" : ""
                      }`}
                    >
                      <Avatar className="w-7 h-7">
                        <AvatarImage src={user.image} />
                        <AvatarFallback className="text-xs">
                          {user.name?.charAt(0).toUpperCase() || <User className="w-4 h-4" />}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium hidden sm:inline-block">
                        {user.name}
                      </span>
                      {isAdmin && (
                        <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary">
                          <Shield className="w-3 h-3" />
                          Admin
                        </span>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <div className="px-2 py-1.5">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">{user.name}</p>
                        {isAdmin && (
                          <span className="flex items-center gap-1 px-1.5 py-0.5 bg-primary/10 rounded text-xs font-medium text-primary">
                            <Shield className="w-3 h-3" />
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {!isAuthenticated && (
              <Button
                onClick={openLogin}
                size="sm"
                className="glow-pink"
              >
                Sign In
              </Button>
            )}
          </>
        )}
      </div>
    </header>
  );
}
