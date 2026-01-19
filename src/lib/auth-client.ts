"use client";

import { createAuthClient } from "better-auth/react";

// Use window.location.origin in browser to ensure requests go to the same origin
// This prevents issues when NEXT_PUBLIC_BASE_URL is set to production but running locally
const getBaseURL = () => {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
};

export const authClient = createAuthClient({
  baseURL: getBaseURL(),
});

export const { signIn, signUp, signOut, useSession } = authClient;
