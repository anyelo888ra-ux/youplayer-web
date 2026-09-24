export interface VideoItem {
  id: string;
  title: string;
  channelTitle: string;
  channelId?: string;
  channelAvatar?: string;
  views: number;
  uploadedAt: string;
  duration: string;
  durationSeconds: number;
  description: string;
  thumbnail: string;
  category?: string;
  subscribers?: string;
  isLive?: boolean;
}

export interface WatchHistoryItem {
  videoId?: string;
  video: VideoItem;
  watchedAt: number; // timestamp ms
  progressSeconds: number;
  completed: boolean;
  watchTimeSeconds: number;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  isSystem?: boolean;
  systemType?: 'watch-later' | 'favorites' | 'liked';
  videos: VideoItem[];
}

export interface Bookmark {
  id: string;
  videoId: string;
  videoTitle: string;
  videoThumbnail: string;
  timestampSeconds: number;
  label: string;
  note?: string;
  createdAt: number;
}

export interface TaskReminder {
  id: string;
  videoId: string;
  videoTitle: string;
  videoThumbnail: string;
  scheduledTime: number; // timestamp ms
  label: string;
  note?: string;
  completed: boolean;
  notified: boolean;
  createdAt: number;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  provider: 'guest' | 'google' | 'github' | 'discord' | 'custom';
  syncKey?: string;
  syncEnabled?: boolean;
  createdAt?: number;
}

export interface UserSettings {
  theme: 'slate' | 'charcoal' | 'midnight' | 'black';
  language: 'en' | 'es' | 'fr' | 'de' | 'ja' | 'pt' | 'zh' | 'hi';
  activePipedInstance?: string;
  pipedInstance?: string;
  autoPlayNext?: boolean;
  defaultQuality?: '1080p' | '720p' | '480p' | '360p' | 'auto';
  defaultSpeed?: number;
  volume?: number;
  notificationsEnabled?: boolean;
  theaterMode?: boolean;
  historyPaused?: boolean;
}

export interface SearchFilters {
  uploadDate: 'all' | 'today' | 'this_week' | 'this_month' | 'this_year';
  duration: 'all' | 'short' | 'medium' | 'long';
  sortBy: 'relevance' | 'views' | 'date' | 'rating';
  type: 'all' | 'video' | 'channel' | 'playlist';
}

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  likes: number;
  timeAgo: string;
  isLocalUser?: boolean;
}

export interface ExportDataPayload {
  version: string;
  exportedAt: string;
  profile: UserProfile;
  settings: UserSettings;
  history: WatchHistoryItem[];
  playlists: Playlist[];
  bookmarks: Bookmark[];
  reminders: TaskReminder[];
}
