"use client";

import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  // baseURL is optional when client and server are on the same domain
});

export const { signIn, signUp, signOut, useSession } = authClient;
