import {
  WatchHistoryItem,
  Playlist,
  Bookmark,
  TaskReminder,
  VideoItem,
  UserProfile,
  UserSettings,
  ExportDataPayload
} from '../types';

const DB_NAME = 'YouPlayerDB';
const DB_VERSION = 2;

export class DatabaseService {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDB(): Promise<IDBDatabase> {
    if (this.dbPromise) return this.dbPromise;

    this.dbPromise = new Promise((resolve, reject) => {
      if (typeof indexedDB === 'undefined') {
        reject(new Error('IndexedDB is not supported in this environment'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Watch history store
        if (!db.objectStoreNames.contains('history')) {
          const historyStore = db.createObjectStore('history', { keyPath: 'videoId' });
          historyStore.createIndex('watchedAt', 'watchedAt', { unique: false });
        }

        // Playlists store
        if (!db.objectStoreNames.contains('playlists')) {
          const playlistStore = db.createObjectStore('playlists', { keyPath: 'id' });
          playlistStore.createIndex('updatedAt', 'updatedAt', { unique: false });
        }

        // Bookmarks store
        if (!db.objectStoreNames.contains('bookmarks')) {
          const bookmarkStore = db.createObjectStore('bookmarks', { keyPath: 'id' });
          bookmarkStore.createIndex('videoId', 'videoId', { unique: false });
          bookmarkStore.createIndex('createdAt', 'createdAt', { unique: false });
        }

        // Task reminders store
        if (!db.objectStoreNames.contains('reminders')) {
          const reminderStore = db.createObjectStore('reminders', { keyPath: 'id' });
          reminderStore.createIndex('scheduledTime', 'scheduledTime', { unique: false });
          reminderStore.createIndex('completed', 'completed', { unique: false });
        }

        // Settings and profile store
        if (!db.objectStoreNames.contains('metadata')) {
          db.createObjectStore('metadata', { keyPath: 'key' });
        }

        // Offline cached items
        if (!db.objectStoreNames.contains('offline_cache')) {
          db.createObjectStore('offline_cache', { keyPath: 'id' });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        resolve(db);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });

    return this.dbPromise;
  }

  async init(): Promise<void> {
    await this.getDB();
    await this.initializeDefaults();
  }

  // --- SETTINGS & PROFILE ---
  async getSettings(): Promise<UserSettings | null> {
    try {
      const saved = localStorage.getItem('youplayer_settings');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }

  async saveSettings(settings: UserSettings): Promise<void> {
    try {
      localStorage.setItem('youplayer_settings', JSON.stringify(settings));
    } catch {}
  }

  async getProfile(): Promise<UserProfile | null> {
    try {
      const saved = localStorage.getItem('youplayer_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  }

  async saveProfile(profile: UserProfile): Promise<void> {
    try {
      localStorage.setItem('youplayer_profile', JSON.stringify(profile));
    } catch {}
  }

  // --- INITIALIZATION & DEFAULT PLAYLISTS ---
  async initializeDefaults(): Promise<void> {
    const playlists = await this.getPlaylists();
    if (playlists.length === 0) {
      const defaultPlaylists: Playlist[] = [
        {
          id: 'watch-later',
          title: 'Watch Later',
          description: 'Videos saved to enjoy whenever you have free time.',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isSystem: true,
          systemType: 'watch-later',
          videos: []
        },
        {
          id: 'favorites',
          title: 'Favorites',
          description: 'Your hand-picked top favorite videos and channels.',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isSystem: true,
          systemType: 'favorites',
          videos: []
        },
        {
          id: 'liked-videos',
          title: 'Liked Videos',
          description: 'Every video you liked while browsing YouPlayer.',
          createdAt: Date.now(),
          updatedAt: Date.now(),
          isSystem: true,
          systemType: 'liked',
          videos: []
        }
      ];

      for (const p of defaultPlaylists) {
        await this.savePlaylist(p);
      }
    }
  }

  // --- WATCH HISTORY ---
  async recordWatchProgress(video: VideoItem, currentSeconds: number, durationSeconds?: number): Promise<void> {
    try {
      const db = await this.getDB();
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');

      const dur = durationSeconds || video.durationSeconds || 1;
      const progress = Math.min(currentSeconds, dur);
      const isCompleted = progress >= dur * 0.9;

      const existingReq = store.get(video.id);
      existingReq.onsuccess = () => {
        const existing = existingReq.result;
        const previousWatchTime = existing?.watchTimeSeconds || 0;
        // add incremental session time
        const addedTime = Math.max(1, Math.min(30, currentSeconds - (existing?.progressSeconds || 0)));

        const item = {
          videoId: video.id,
          video,
          watchedAt: Date.now(),
          progressSeconds: Math.floor(progress),
          completed: isCompleted,
          watchTimeSeconds: previousWatchTime + (addedTime > 0 ? addedTime : 5)
        };

        store.put(item);
      };
    } catch (e) {
      console.warn('Could not record watch progress in IndexedDB:', e);
    }
  }

  async getWatchHistory(): Promise<WatchHistoryItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('history', 'readonly');
        const store = tx.objectStore('history');
        const index = store.index('watchedAt');
        const request = index.openCursor(null, 'prev');
        const results: WatchHistoryItem[] = [];

        request.onsuccess = (event) => {
          const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
          if (cursor) {
            results.push(cursor.value);
            cursor.continue();
          } else {
            resolve(results);
          }
        };

        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async deleteHistoryItem(videoId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      const req = store.delete(videoId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async clearWatchHistory(): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('history', 'readwrite');
      const store = tx.objectStore('history');
      const req = store.clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- PLAYLISTS ---
  async getPlaylists(): Promise<Playlist[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('playlists', 'readonly');
        const store = tx.objectStore('playlists');
        const request = store.getAll();
        request.onsuccess = () => {
          const list = request.result || [];
          resolve(list.sort((a, b) => b.updatedAt - a.updatedAt));
        };
        request.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async savePlaylist(playlist: Playlist): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('playlists', 'readwrite');
      const store = tx.objectStore('playlists');
      playlist.updatedAt = Date.now();
      const req = store.put(playlist);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deletePlaylist(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('playlists', 'readwrite');
      const store = tx.objectStore('playlists');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async addVideoToPlaylist(playlistId: string, video: VideoItem): Promise<boolean> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('playlists', 'readwrite');
      const store = tx.objectStore('playlists');
      const getReq = store.get(playlistId);

      getReq.onsuccess = () => {
        const playlist: Playlist = getReq.result;
        if (!playlist) {
          resolve(false);
          return;
        }
        // Avoid duplicate videos
        const existingIndex = playlist.videos.findIndex((v) => v.id === video.id);
        if (existingIndex >= 0) {
          // move to front
          playlist.videos.splice(existingIndex, 1);
        }
        playlist.videos.unshift(video);
        playlist.updatedAt = Date.now();

        const putReq = store.put(playlist);
        putReq.onsuccess = () => resolve(true);
        putReq.onerror = () => reject(putReq.error);
      };

      getReq.onerror = () => reject(getReq.error);
    });
  }

  async removeVideoFromPlaylist(playlistId: string, videoId: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('playlists', 'readwrite');
      const store = tx.objectStore('playlists');
      const getReq = store.get(playlistId);

      getReq.onsuccess = () => {
        const playlist: Playlist = getReq.result;
        if (playlist) {
          playlist.videos = playlist.videos.filter((v) => v.id !== videoId);
          playlist.updatedAt = Date.now();
          const putReq = store.put(playlist);
          putReq.onsuccess = () => resolve();
          putReq.onerror = () => reject(putReq.error);
        } else {
          resolve();
        }
      };
      getReq.onerror = () => reject(getReq.error);
    });
  }

  // --- BOOKMARKS ---
  async getBookmarks(videoId?: string): Promise<Bookmark[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('bookmarks', 'readonly');
        const store = tx.objectStore('bookmarks');

        if (videoId) {
          const index = store.index('videoId');
          const req = index.getAll(videoId);
          req.onsuccess = () => resolve((req.result || []).sort((a, b) => a.timestampSeconds - b.timestampSeconds));
          req.onerror = () => resolve([]);
        } else {
          const req = store.getAll();
          req.onsuccess = () => resolve((req.result || []).sort((a, b) => b.createdAt - a.createdAt));
          req.onerror = () => resolve([]);
        }
      });
    } catch {
      return [];
    }
  }

  async saveBookmark(bookmark: Bookmark): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      const store = tx.objectStore('bookmarks');
      const req = store.put(bookmark);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteBookmark(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('bookmarks', 'readwrite');
      const store = tx.objectStore('bookmarks');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- TASK REMINDERS ---
  async getReminders(): Promise<TaskReminder[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('reminders', 'readonly');
        const store = tx.objectStore('reminders');
        const req = store.getAll();
        req.onsuccess = () => resolve((req.result || []).sort((a, b) => a.scheduledTime - b.scheduledTime));
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async saveReminder(reminder: TaskReminder): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reminders', 'readwrite');
      const store = tx.objectStore('reminders');
      const req = store.put(reminder);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async deleteReminder(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('reminders', 'readwrite');
      const store = tx.objectStore('reminders');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- OFFLINE SAVES ---
  async saveOfflineVideo(video: VideoItem): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_cache', 'readwrite');
      const store = tx.objectStore('offline_cache');
      const req = store.put({ ...video, cachedAt: Date.now() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  async getOfflineVideos(): Promise<VideoItem[]> {
    try {
      const db = await this.getDB();
      return new Promise((resolve) => {
        const tx = db.transaction('offline_cache', 'readonly');
        const store = tx.objectStore('offline_cache');
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      });
    } catch {
      return [];
    }
  }

  async removeOfflineVideo(id: string): Promise<void> {
    const db = await this.getDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('offline_cache', 'readwrite');
      const store = tx.objectStore('offline_cache');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  }

  // --- EXPORT & IMPORT ---
  async exportFullData(profile: UserProfile, settings: UserSettings): Promise<ExportDataPayload> {
    const history = await this.getWatchHistory();
    const playlists = await this.getPlaylists();
    const bookmarks = await this.getBookmarks();
    const reminders = await this.getReminders();

    return {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      profile,
      settings,
      history,
      playlists,
      bookmarks,
      reminders
    };
  }

  async importFullData(payload: ExportDataPayload, mode: 'merge' | 'overwrite'): Promise<{ success: boolean; message: string }> {
    try {
      if (!payload || !payload.version) {
        throw new Error('Invalid YouPlayer backup payload structure');
      }

      const db = await this.getDB();

      if (mode === 'overwrite') {
        await this.clearWatchHistory();
        // Clear all except system playlists
        const currentPlaylists = await this.getPlaylists();
        for (const pl of currentPlaylists) {
          await this.deletePlaylist(pl.id);
        }
        // Clear bookmarks & reminders
        const currentBookmarks = await this.getBookmarks();
        for (const bm of currentBookmarks) {
          await this.deleteBookmark(bm.id);
        }
        const currentReminders = await this.getReminders();
        for (const rm of currentReminders) {
          await this.deleteReminder(rm.id);
        }
      }

      // Import Playlists
      if (Array.isArray(payload.playlists)) {
        for (const pl of payload.playlists) {
          await this.savePlaylist(pl);
        }
      }

      // Import History
      if (Array.isArray(payload.history)) {
        const tx = db.transaction('history', 'readwrite');
        const store = tx.objectStore('history');
        for (const item of payload.history) {
          store.put(item);
        }
      }

      // Import Bookmarks
      if (Array.isArray(payload.bookmarks)) {
        for (const bm of payload.bookmarks) {
          await this.saveBookmark(bm);
        }
      }

      // Import Reminders
      if (Array.isArray(payload.reminders)) {
        for (const rm of payload.reminders) {
          await this.saveReminder(rm);
        }
      }

      return {
        success: true,
        message: `Successfully imported ${payload.playlists?.length || 0} playlists, ${payload.history?.length || 0} history items, and ${payload.bookmarks?.length || 0} bookmarks!`
      };
    } catch (e: unknown) {
      const err = e as Error;
      return {
        success: false,
        message: `Import failed: ${err.message || 'Unknown parsing error'}`
      };
    }
  }
}

export const dbService = new DatabaseService();
