"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { MediaItem } from "./types";

interface MediaContextType {
  getMediaForGame: (gameId: string) => MediaItem[];
  fetchMediaForGame: (gameId: string) => Promise<MediaItem[]>;
  addMedia: (gameId: string, media: Omit<MediaItem, "id" | "gameId">) => Promise<void>;
  updateMedia: (mediaId: string, updates: Partial<MediaItem>) => Promise<void>;
  deleteMedia: (mediaId: string, url?: string) => Promise<void>;
}

const MediaContext = createContext<MediaContextType | undefined>(undefined);

interface MediaCache {
  [gameId: string]: MediaItem[];
}

export function MediaProvider({ children }: { children: ReactNode }) {
  const [mediaCache, setMediaCache] = useState<MediaCache>({});

  const getMediaForGame = useCallback((gameId: string): MediaItem[] => {
    return mediaCache[gameId] || [];
  }, [mediaCache]);

  const fetchMediaForGame = useCallback(async (gameId: string): Promise<MediaItem[]> => {
    try {
      const response = await fetch(`/api/media?gameId=${gameId}`);
      if (response.ok) {
        const data = await response.json();
        setMediaCache((prev) => ({ ...prev, [gameId]: data }));
        return data;
      }
    } catch (error) {
      console.error('Failed to fetch media:', error);
    }
    return [];
  }, []);

  const addMedia = useCallback(async (gameId: string, mediaItem: Omit<MediaItem, "id" | "gameId">) => {
    try {
      const response = await fetch('/api/media', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...mediaItem, gameId }),
      });
      
      if (response.ok) {
        const newMedia = await response.json();
        setMediaCache((prev) => ({
          ...prev,
          [gameId]: [newMedia, ...(prev[gameId] || [])],
        }));
      }
    } catch (error) {
      console.error('Failed to add media:', error);
    }
  }, []);

  const updateMedia = useCallback(async (mediaId: string, updates: Partial<MediaItem>) => {
    try {
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      
      if (response.ok) {
        setMediaCache((prev) => {
          const newCache = { ...prev };
          for (const gameId in newCache) {
            newCache[gameId] = newCache[gameId].map((item) =>
              item.id === mediaId ? { ...item, ...updates } : item
            );
          }
          return newCache;
        });
      }
    } catch (error) {
      console.error('Failed to update media:', error);
    }
  }, []);

  const deleteMedia = useCallback(async (mediaId: string, url?: string) => {
    try {
      // If URL provided, delete from R2 storage
      if (url) {
        await fetch('/api/upload/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url }),
        });
      }

      // Delete from database
      const response = await fetch(`/api/media/${mediaId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setMediaCache((prev) => {
          const newCache = { ...prev };
          for (const gameId in newCache) {
            newCache[gameId] = newCache[gameId].filter((item) => item.id !== mediaId);
          }
          return newCache;
        });
      }
    } catch (error) {
      console.error('Failed to delete media:', error);
    }
  }, []);

  return (
    <MediaContext.Provider value={{ getMediaForGame, fetchMediaForGame, addMedia, updateMedia, deleteMedia }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (context === undefined) {
    throw new Error("useMedia must be used within a MediaProvider");
  }
  return context;
}
