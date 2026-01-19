import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import { users, sessions, accounts, verifications } from "@/db/schema";

// Parse admin emails from environment variable (comma-separated)
const getAdminEmails = (): string[] => {
  const adminEmails = process.env.ADMIN_EMAILS || "";
  return adminEmails
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
};

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: users,
      session: sessions,
      account: accounts,
      verification: verifications,
    },
  }),
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
  },
  trustedOrigins: [
    "https://appleid.apple.com",
    "http://localhost:3000",
    process.env.NEXT_PUBLIC_BASE_URL,
  ].filter(Boolean) as string[],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      enabled: !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET),
    },
    apple: {
      clientId: process.env.APPLE_CLIENT_ID || "",
      teamId: process.env.APPLE_TEAM_ID || "",
      keyId: process.env.APPLE_KEY_ID || "",
      privateKey: process.env.APPLE_PRIVATE_KEY || "",
      enabled: !!(
        process.env.APPLE_CLIENT_ID &&
        process.env.APPLE_TEAM_ID &&
        process.env.APPLE_KEY_ID &&
        process.env.APPLE_PRIVATE_KEY
      ),
    },
    facebook: {
      clientId: process.env.FACEBOOK_CLIENT_ID || "",
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "",
      enabled: process.env.NEXT_PUBLIC_FACEBOOK_AUTH_ENABLED === "true" && 
        !!(process.env.FACEBOOK_CLIENT_ID && process.env.FACEBOOK_CLIENT_SECRET),
    },
  },
  accountLinking: {
    enabled: true,
    trustedProviders: ["google", "apple", "facebook"],
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
  },
  user: {
    additionalFields: {
      role: {
        type: "string",
        defaultValue: "user",
        input: false, // Don't allow users to set their own role
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const adminEmails = getAdminEmails();
          const isAdmin = adminEmails.includes(user.email.toLowerCase());

          return {
            data: {
              ...user,
              role: isAdmin ? "admin" : "user",
            },
          };
        },
      },
    },
  },
  plugins: [
    nextCookies(), // Handles cookie setting in server actions
  ],
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
