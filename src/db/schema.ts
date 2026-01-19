import { pgTable, text, timestamp, integer, pgEnum, boolean } from 'drizzle-orm/pg-core';

// Enums
export const sportTypeEnum = pgEnum('sport_type', ['basketball', 'football']);
export const gameStatusEnum = pgEnum('game_status', ['upcoming', 'live', 'completed']);
export const mediaTypeEnum = pgEnum('media_type', ['image', 'video']);

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
  uploader: text('uploader').default('Cody').notNull(),
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

// Type exports for use in the app
export type GameRecord = typeof games.$inferSelect;
export type NewGameRecord = typeof games.$inferInsert;
export type MediaRecord = typeof media.$inferSelect;
export type NewMediaRecord = typeof media.$inferInsert;
export type CoverPhotoRecord = typeof coverPhotos.$inferSelect;
export type NewCoverPhotoRecord = typeof coverPhotos.$inferInsert;
