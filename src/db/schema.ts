import { pgTable, text, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enums
export const sportTypeEnum = pgEnum('sport_type', ['basketball', 'football']);
export const gameStatusEnum = pgEnum('game_status', ['upcoming', 'live', 'completed']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

// ============================================
// Better-Auth Tables
// ============================================

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  role: text('role').notNull().default('user'), // 'user' | 'admin'
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const sessions = pgTable('sessions', {
  id: text('id').primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
});

export const accounts = pgTable('accounts', {
  id: text('id').primaryKey(),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verifications = pgTable('verifications', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// ============================================
// Application Tables
// ============================================

// Games table
export const games = pgTable('games', {
  id: text('id').primaryKey(),
  sport: sportTypeEnum('sport').notNull(),
  status: gameStatusEnum('status').notNull(),
  
  // Home team
  homeTeamName: text('home_team_name').notNull(),
  homeTeamAbbreviation: text('home_team_abbreviation').notNull(),
  homeTeamScore: integer('home_team_score'),
  
  // Away team
  awayTeamName: text('away_team_name').notNull(),
  awayTeamAbbreviation: text('away_team_abbreviation').notNull(),
  awayTeamScore: integer('away_team_score'),
  
  // Game details
  date: text('date').notNull(),
  time: text('time').notNull(),
  location: text('location').notNull(),
  
  // Optional background image for game card
  backgroundImage: text('background_image'),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Media table
export const media = pgTable('media', {
  id: text('id').primaryKey(),
  gameId: text('game_id').notNull().references(() => games.id, { onDelete: 'cascade' }),
  type: mediaTypeEnum('type').notNull(),
  url: text('url').notNull(),
  thumbnail: text('thumbnail'),
  caption: text('caption'),
  tags: text('tags').array(), // Array of tags: pass, run, touchdown, player names, etc.
  uploader: text('uploader').default('Anonymous').notNull(), // Display name (legacy field)
  uploaderId: text('uploader_id'), // Optional reference to user who uploaded (new field)
  uploadedAt: timestamp('uploaded_at').defaultNow().notNull(),
});

// Cover photos table for hero section
export const coverPhotos = pgTable('cover_photos', {
  id: text('id').primaryKey(),
  url: text('url').notNull(),
  caption: text('caption'),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Comments table for video/media discussions
export const comments = pgTable('comments', {
  id: text('id').primaryKey(),
  mediaId: text('media_id').notNull().references(() => media.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  content: text('content').notNull(),
  parentId: text('parent_id'), // For threaded replies
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ============================================
// Type exports
// ============================================

// Auth types
export type UserRecord = typeof users.$inferSelect;
export type NewUserRecord = typeof users.$inferInsert;
export type SessionRecord = typeof sessions.$inferSelect;
export type AccountRecord = typeof accounts.$inferSelect;

// App types
export type GameRecord = typeof games.$inferSelect;
export type NewGameRecord = typeof games.$inferInsert;
export type MediaRecord = typeof media.$inferSelect;
export type NewMediaRecord = typeof media.$inferInsert;
export type CoverPhotoRecord = typeof coverPhotos.$inferSelect;
export type NewCoverPhotoRecord = typeof coverPhotos.$inferInsert;
export type CommentRecord = typeof comments.$inferSelect;
export type NewCommentRecord = typeof comments.$inferInsert;
