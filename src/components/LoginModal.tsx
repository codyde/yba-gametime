"use client";

import { useState, useEffect } from "react";
import { KeyRound, LogOut, Plus, Loader2, UserPlus } from "lucide-react";
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
import { useAuth } from "@/lib/auth-context";

interface LoginModalProps {
  onCreateGame?: () => void;
}

// Feature flags for OAuth providers
const isAppleSignInEnabled = process.env.NEXT_PUBLIC_APPLE_SIGN_IN_ENABLED === "true";

export function LoginModal({ onCreateGame }: LoginModalProps) {
  const { 
    isAuthenticated, 
    isLoginOpen, 
    isRegisterOpen,
    user,
    login, 
    register,
    signInWithGoogle,
    signInWithApple,
    logout, 
    closeLogin,
    closeRegister,
    openRegister,
    openLogin,
  } = useAuth();
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showEmailForm, setShowEmailForm] = useState(false);

  const isOpen = isLoginOpen || isRegisterOpen;
  const isRegisterMode = isRegisterOpen;

  // Default to showing email form for register mode
  useEffect(() => {
    if (isOpen) {
      setShowEmailForm(isRegisterMode);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setError("");
    }
  }, [isOpen, isRegisterMode]);

  const handleClose = () => {
    setShowEmailForm(false);
    if (isRegisterOpen) {
      closeRegister();
    } else {
      closeLogin();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      if (isRegisterMode) {
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setIsSubmitting(false);
          return;
        }
        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setIsSubmitting(false);
          return;
        }
        // Derive name from email (part before @)
        const derivedName = email.split("@")[0];
        const success = await register(derivedName, email, password);
        if (!success) {
          setError("Registration failed. Email may already be in use.");
        }
      } else {
        const success = await login(email, password);
        if (!success) {
          setError("Invalid email or password");
        }
      }
    } catch {
      setError(isRegisterMode ? "Registration failed. Please try again." : "Login failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
  };

  const handleCreateGame = () => {
    handleClose();
    onCreateGame?.();
  };

  const isAdmin = user?.role === "admin";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isRegisterMode ? (
              <>
                <UserPlus className="w-5 h-5 text-primary" />
                Create Account
              </>
            ) : (
              <>
                <KeyRound className="w-5 h-5 text-primary" />
                {isAuthenticated ? "Account" : "Sign In"}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isAuthenticated
              ? `Signed in as ${user?.name || user?.email}`
              : isRegisterMode
              ? "Create an account to upload media and comment."
              : "Sign in to upload media and comment on videos."}
          </DialogDescription>
        </DialogHeader>

        {isAuthenticated ? (
          <div className="space-y-4 pt-4">
            {isAdmin && (
              <Button
                onClick={handleCreateGame}
                className="w-full glow-pink"
                size="lg"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Game
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleLogout}
              className="w-full"
              size="lg"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
            <p className="text-xs text-center text-muted-foreground pt-2">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Cmd+K</kbd> anytime to access this panel
            </p>
          </div>
        ) : showEmailForm ? (
          <div className="space-y-4 pt-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  autoFocus
                  disabled={isSubmitting}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={isRegisterMode ? "At least 8 characters" : "Enter password"}
                  autoComplete={isRegisterMode ? "new-password" : "current-password"}
                  disabled={isSubmitting}
                  required
                />
              </div>
              {isRegisterMode && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              )}
              {error && (
                <p className="text-sm text-destructive">{error}</p>
              )}
              <Button 
                type="submit" 
                className="w-full glow-pink" 
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    {isRegisterMode ? "Creating account..." : "Signing in..."}
                  </>
                ) : (
                  isRegisterMode ? "Create Account" : "Sign In"
                )}
              </Button>
            </form>
            
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowEmailForm(false)}
                className="flex-1"
                size="lg"
                disabled={isSubmitting}
              >
                Back to Google
              </Button>
              <Button
                variant="ghost"
                onClick={handleClose}
                className="flex-1"
                size="lg"
                disabled={isSubmitting}
              >
                Cancel
              </Button>
            </div>
            
            <div className="text-center text-sm">
              {isRegisterMode ? (
                <p className="text-muted-foreground">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      openLogin();
                      setShowEmailForm(false);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Don&apos;t have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      openRegister();
                      setShowEmailForm(true);
                    }}
                    className="text-primary hover:underline font-medium"
                  >
                    Create one
                  </button>
                </p>
              )}
            </div>
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Cmd+K</kbd> anytime to open this dialog
            </p>
          </div>
        ) : (
          <div className="space-y-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={signInWithGoogle}
              className="w-full"
              size="lg"
              disabled={isSubmitting}
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </Button>
            
            {isAppleSignInEnabled && (
              <Button
                type="button"
                variant="outline"
                onClick={signInWithApple}
                className="w-full"
                size="lg"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.45-.93 3.74-.84 1.45.07 2.86.7 3.66 1.93-3.12 1.9-2.61 5.66.39 7.28-.5 1.44-1.18 2.79-1.98 3.5v-.08c-.05.02-.1.05-.15.08l-1.74.2zm-1.96-12.5c-.26.14-.64.22-1 .23-2.01-.07-2.71-2.8-.9-3.73 1.93-.99 3.6 1.38 1.9 3.5z" />
                </svg>
                Sign in with Apple
              </Button>
            )}
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">
                  Or continue with
                </span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowEmailForm(true)}
              className="w-full"
              size="lg"
            >
              Email and Password
            </Button>
            
            <div className="text-center text-sm">
              <p className="text-muted-foreground">
                Don&apos;t have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    openRegister();
                    setShowEmailForm(true);
                  }}
                  className="text-primary hover:underline font-medium"
                >
                  Create one
                </button>
              </p>
            </div>
            
            <p className="text-xs text-center text-muted-foreground pt-2">
              Press <kbd className="px-1.5 py-0.5 bg-muted rounded text-xs font-mono">Cmd+K</kbd> anytime to open this dialog
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
