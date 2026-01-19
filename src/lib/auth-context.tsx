"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { authClient, useSession } from "./auth-client";

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  isLoginOpen: boolean;
  isRegisterOpen: boolean;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string;
    role: string;
  } | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (name: string, email: string, password: string) => Promise<boolean>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  openLogin: () => void;
  closeLogin: () => void;
  openRegister: () => void;
  closeRegister: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { data: session, isPending } = useSession();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  const login = useCallback(async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await authClient.signIn.email({
        email,
        password,
      });

      if (result.error) {
        console.error("Login failed:", result.error);
        return false;
      }

      setIsLoginOpen(false);
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  }, []);

  const register = useCallback(async (name: string, email: string, password: string): Promise<boolean> => {
    try {
      const result = await authClient.signUp.email({
        name,
        email,
        password,
      });

      if (result.error) {
        console.error("Registration failed:", result.error);
        return false;
      }

      setIsRegisterOpen(false);
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authClient.signOut();
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    try {
      await authClient.signIn.social({
        provider: "google",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Google sign-in failed:", error);
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    try {
      await authClient.signIn.social({
        provider: "apple",
        callbackURL: "/",
      });
    } catch (error) {
      console.error("Apple sign-in failed:", error);
    }
  }, []);

  const openLogin = useCallback(() => {
    setIsRegisterOpen(false);
    setIsLoginOpen(true);
  }, []);

  const closeLogin = useCallback(() => {
    setIsLoginOpen(false);
  }, []);

  const openRegister = useCallback(() => {
    setIsLoginOpen(false);
    setIsRegisterOpen(true);
  }, []);

  const closeRegister = useCallback(() => {
    setIsRegisterOpen(false);
  }, []);

  const user = session?.user ? {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    image: session.user.image ?? undefined,
    role: (session.user as { role?: string }).role ?? "user",
  } : null;

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: !!session?.user,
        isLoading: isPending,
        isLoginOpen,
        isRegisterOpen,
        user,
        login,
        register,
        signInWithGoogle,
        signInWithApple,
        logout,
        openLogin,
        closeLogin,
        openRegister,
        closeRegister,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
