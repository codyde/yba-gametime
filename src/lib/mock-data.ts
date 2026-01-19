import { Game, MediaItem } from "./types";

// Empty arrays - no placeholder data
export const mockGames: Game[] = [];

export const mockMediaItems: MediaItem[] = [];

export function getGameById(id: string): Game | undefined {
  return mockGames.find((game) => game.id === id);
}

export function getMediaForGame(_gameId: string): MediaItem[] {
  return mockMediaItems.filter((item) => item.gameId === _gameId);
}
