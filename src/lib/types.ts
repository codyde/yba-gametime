export type SportType = "basketball" | "football";

export type GameStatus = "upcoming" | "live" | "completed";

export interface Team {
  name: string;
  abbreviation: string;
  score?: number;
}

export interface Game {
  id: string;
  sport: SportType;
  status: GameStatus;
  homeTeam: Team;
  awayTeam: Team;
  date: string;
  time: string;
  location: string;
  backgroundImage?: string;
  mediaCount?: number;
}

// Predefined tags for quick selection
export const MEDIA_TAGS = {
  plays: ["Pass", "Run", "Touchdown", "Interception", "Fumble", "Sack", "Field Goal"],
  basketball: ["3-Pointer", "Dunk", "Block", "Steal", "Assist", "Rebound"],
  general: ["Highlight", "Big Play", "Defense", "Offense"],
} as const;

export interface MediaItem {
  id: string;
  type: "image" | "video";
  url: string;
  thumbnail?: string;
  caption?: string;
  tags?: string[];
  uploader: string;
  uploadedAt: string;
  gameId?: string;
}

// Hero background images for rotating display
export const heroBackgroundImages = [
  "https://images.pexels.com/photos/1752757/pexels-photo-1752757.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/2834917/pexels-photo-2834917.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/46798/the-ball-stadion-football-the-pitch-46798.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/163452/basketball-dunk-blue-game-163452.jpeg?auto=compress&cs=tinysrgb&w=1920",
  "https://images.pexels.com/photos/358042/pexels-photo-358042.jpeg?auto=compress&cs=tinysrgb&w=1920",
];
