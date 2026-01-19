"use client";

import { useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { LoginModal } from "./LoginModal";

export function GlobalAuth() {
  const { openLogin } = useAuth();

  // Global Cmd+K / Ctrl+K keyboard shortcut for login
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Cmd+K (Mac) or Ctrl+K (Windows/Linux)
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openLogin();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [openLogin]);

  return <LoginModal />;
}
