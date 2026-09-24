import React, { useState, useEffect, useCallback } from 'react';
import {
  VideoItem,
  SearchFilters,
  Playlist,
  TaskReminder,
  UserProfile,
  UserSettings
} from './types';
import { dbService } from './services/db';
import { pipedApi } from './services/pipedApi';
import { notificationService } from './services/notifications';
import { LanguageCode, t } from './services/i18n';
import { useOnlineStatus } from './hooks/useOnlineStatus';

// UI Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { VideoCard } from './components/VideoCard';
import { VideoPlayerView } from './components/VideoPlayerView';
import { SearchFilterBar } from './components/SearchFilterBar';
import { DashboardView } from './components/DashboardView';
import { PlaylistsView } from './components/PlaylistsView';
import { HistoryView } from './components/HistoryView';

// Modals
import { RemindersModal } from './components/RemindersModal';
import { SavePlaylistModal } from './components/SavePlaylistModal';
import { DeviceSyncModal } from './components/DeviceSyncModal';
import { GitHubPagesExportModal } from './components/GitHubPagesExportModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

import {
  WifiOff,
  Flame,
  Sparkles,
  ArrowLeft,
  Bookmark,
  ThumbsUp,
  HardDriveDownload,
  AlertCircle
} from 'lucide-react';

export default function App() {
  const isOnline = useOnlineStatus();

  // Navigation & View state
  const [activeTab, setActiveTab] = useState<string>('home');
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({
    uploadDate: 'all',
    duration: 'all',
    sortBy: 'relevance',
    type: 'all'
  });

  // Data states
  const [feedVideos, setFeedVideos] = useState<VideoItem[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [reminders, setReminders] = useState<TaskReminder[]>([]);
  const [profile, setProfile] = useState<UserProfile>({
    id: 'guest-1',
    name: 'YouPlayer Explorer',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
    provider: 'guest'
  });
  const [settings, setSettings] = useState<UserSettings>({
    theme: 'charcoal',
    language: 'en',
    pipedInstance: pipedApi.getActiveInstance(),
    theaterMode: false,
    defaultQuality: '1080p',
    defaultSpeed: 1,
    volume: 85,
    historyPaused: false
  });

  // Modal controls
  const [showRemindersModal, setShowRemindersModal] = useState(false);
  const [videoToRemind, setVideoToRemind] = useState<VideoItem | null>(null);
  const [videoToSavePlaylist, setVideoToSavePlaylist] = useState<VideoItem | null>(null);
  const [showSavePlaylistModal, setShowSavePlaylistModal] = useState(false);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showGitHubModal, setShowGitHubModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // In-app alert notification
  const [toastNotification, setToastNotification] = useState<{ title: string; body: string } | null>(null);

  // Initialize DB, Notification listener & Settings
  useEffect(() => {
    const initApp = async () => {
      // Initialize IndexedDB
      await dbService.init();

      // Load Settings & Profile
      const [savedSettings, savedProfile, savedPlaylists, savedReminders] = await Promise.all([
        dbService.getSettings(),
        dbService.getProfile(),
        dbService.getPlaylists(),
        dbService.getReminders()
      ]);

      if (savedSettings) setSettings(savedSettings);
      if (savedProfile) setProfile(savedProfile);
      setPlaylists(savedPlaylists);
      setReminders(savedReminders);

      // Register Notification service with chime trigger
      notificationService.init((reminder) => {
        setToastNotification({
          title: `Reminder: ${reminder.label}`,
          body: `Time to watch: "${reminder.videoTitle}"`
        });
        setTimeout(() => setToastNotification(null), 6000);
      });
    };

    initApp();

    // Register service worker if available
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('SW registration skipped:', err);
      });
    }

    return () => {
      notificationService.destroy();
    };
  }, []);

  // Fetch Feed or Search videos
  const fetchVideos = useCallback(async () => {
    setIsLoadingFeed(true);

    if (submittedQuery.trim()) {
      const results = await pipedApi.search(submittedQuery, searchFilters);
      setFeedVideos(results);
    } else {
      const trending = await pipedApi.getTrending(activeCategory);
      setFeedVideos(trending);
    }

    setIsLoadingFeed(false);
  }, [submittedQuery, searchFilters, activeCategory]);

  useEffect(() => {
    fetchVideos();
  }, [fetchVideos]);

  // Refresh lists helper
  const refreshPlaylists = async () => {
    const updated = await dbService.getPlaylists();
    setPlaylists(updated);
  };

  const refreshReminders = async () => {
    const updated = await dbService.getReminders();
    setReminders(updated);
  };

  const handleUpdateSettings = async (newPart: Partial<UserSettings>) => {
    const updated = { ...settings, ...newPart };
    setSettings(updated);
    await dbService.saveSettings(updated);
  };

  const handleUpdateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    await dbService.saveProfile(newProfile);
  };

  // Video interaction actions
  const handleSelectVideo = (video: VideoItem) => {
    setActiveVideo(video);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenRemindForVideo = (video: VideoItem) => {
    setVideoToRemind(video);
    setShowRemindersModal(true);
  };

  const handleOpenSavePlaylistForVideo = (video: VideoItem) => {
    setVideoToSavePlaylist(video);
    setShowSavePlaylistModal(true);
  };

  const handleShareVideo = (video: VideoItem) => {
    const url = `https://youtu.be/${video.id}`;
    navigator.clipboard.writeText(url);
    setToastNotification({
      title: 'Link Copied',
      body: `Copied shareable link for "${video.title}" to clipboard!`
    });
    setTimeout(() => setToastNotification(null), 3000);
  };

  // Search submission
  const handleSearchSubmit = (q: string) => {
    setActiveVideo(null);
    setSubmittedQuery(q);
    setActiveTab('home');
  };

  // Quick category pills
  const categories = [
    { id: 'all', label: 'All' },
    { id: 'Tech & Code', label: 'Code & Tech' },
    { id: 'Blender & 3D', label: '3D & Blender' },
    { id: 'Lofi & Chill', label: 'Music & Lofi' },
    { id: 'Science & Space', label: 'Science & Space' },
    { id: 'Podcasts', label: 'Podcasts' },
    { id: 'Gaming & Speedrun', label: 'Gaming' }
  ];

  // Specific tab content (Watch Later, Liked, Offline)
  const renderTabContent = () => {
    if (activeTab === 'dashboard') {
      return (
        <DashboardView
          settings={settings}
          onSelectVideo={handleSelectVideo}
          onNavigateTab={(tab) => {
            setActiveVideo(null);
            setActiveTab(tab);
          }}
        />
      );
    }

    if (activeTab === 'playlists') {
      return (
        <PlaylistsView
          playlists={playlists}
          onRefreshPlaylists={refreshPlaylists}
          onSelectVideo={handleSelectVideo}
          settings={settings}
        />
      );
    }

    if (activeTab === 'history') {
      return (
        <HistoryView
          onSelectVideo={handleSelectVideo}
          settings={settings}
          onUpdateSettings={handleUpdateSettings}
        />
      );
    }

    if (activeTab === 'watch-later') {
      const pl = playlists.find((p) => p.id === 'watch-later');
      const vids = pl?.videos || [];

      return (
        <div className="max-w-6xl mx-auto pb-16 space-y-4">
          <div className="flex items-center gap-3">
            <Bookmark className="w-6 h-6 text-red-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Watch Later</h1>
              <p className="text-xs text-slate-400">{vids.length} videos queued</p>
            </div>
          </div>
          {vids.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400">No videos saved to Watch Later yet.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vids.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  onSelect={handleSelectVideo}
                  onSaveToPlaylist={handleOpenSavePlaylistForVideo}
                  onRemind={handleOpenRemindForVideo}
                  onShare={handleShareVideo}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'liked') {
      const pl = playlists.find((p) => p.id === 'liked-videos');
      const vids = pl?.videos || [];

      return (
        <div className="max-w-6xl mx-auto pb-16 space-y-4">
          <div className="flex items-center gap-3">
            <ThumbsUp className="w-6 h-6 text-red-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Liked Videos</h1>
              <p className="text-xs text-slate-400">{vids.length} favorite videos</p>
            </div>
          </div>
          {vids.length === 0 ? (
            <div className="py-16 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <p className="text-xs text-slate-400">Like videos to see them listed in this library.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {vids.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  onSelect={handleSelectVideo}
                  onSaveToPlaylist={handleOpenSavePlaylistForVideo}
                  onRemind={handleOpenRemindForVideo}
                  onShare={handleShareVideo}
                />
              ))}
            </div>
          )}
        </div>
      );
    }

    if (activeTab === 'reminders') {
      return (
        <div className="max-w-4xl mx-auto pb-16">
          <button
            onClick={() => setShowRemindersModal(true)}
            className="w-full p-6 bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-2xl text-center space-y-2 cursor-pointer transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-red-600/20 text-red-400 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h2 className="text-base font-bold text-white">Open Task Reminders & Notifications</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Configure push notifications, sound bell chime, and review upcoming study tasks.
            </p>
            <span className="inline-block mt-2 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold">
              Open Schedule ({reminders.length} active)
            </span>
          </button>
        </div>
      );
    }

    if (activeTab === 'offline') {
      return (
        <div className="max-w-6xl mx-auto pb-16 space-y-4">
          <div className="flex items-center gap-3">
            <HardDriveDownload className="w-6 h-6 text-red-500" />
            <div>
              <h1 className="text-xl font-bold text-white">Offline Cache & IndexedDB Storage</h1>
              <p className="text-xs text-slate-400">
                YouPlayer stores thumbnails, watch resumes, and playlists locally in IndexedDB for 100% offline access.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {feedVideos.slice(0, 8).map((v) => (
              <VideoCard
                key={v.id}
                video={v}
                onSelect={handleSelectVideo}
                onSaveToPlaylist={handleOpenSavePlaylistForVideo}
                onRemind={handleOpenRemindForVideo}
                onShare={handleShareVideo}
              />
            ))}
          </div>
        </div>
      );
    }

    // Default: Home or Trending Feed
    return (
      <div className="space-y-6 pb-16">
        {/* Category filters bar */}
        {!submittedQuery && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setActiveVideo(null);
                }}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  activeCategory === cat.id
                    ? 'bg-slate-100 text-slate-900 font-bold'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        )}

        {/* Query Title */}
        {submittedQuery && (
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <span>Results for:</span>
              <span className="text-red-400">"{submittedQuery}"</span>
            </h2>
            <button
              onClick={() => {
                setSubmittedQuery('');
                setSearchQuery('');
              }}
              className="text-xs text-slate-400 hover:text-white"
            >
              Clear Search
            </button>
          </div>
        )}

        {/* Video Cards Grid */}
        {isLoadingFeed ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse flex flex-col gap-2">
                <div className="aspect-video bg-slate-800/80 rounded-xl" />
                <div className="h-4 bg-slate-800 rounded w-3/4 mt-1" />
                <div className="h-3 bg-slate-800/60 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {feedVideos.map((video) => (
              <VideoCard
                key={video.id}
                video={video}
                onSelect={handleSelectVideo}
                onSaveToPlaylist={handleOpenSavePlaylistForVideo}
                onRemind={handleOpenRemindForVideo}
                onShare={handleShareVideo}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0b0f17] text-slate-100 flex flex-col selection:bg-red-600 selection:text-white">
      {/* Offline Alert Bar */}
      {!isOnline && (
        <div className="bg-amber-950/90 border-b border-amber-800/60 px-4 py-2 text-xs text-amber-200 flex items-center justify-center gap-2">
          <WifiOff className="w-4 h-4 text-amber-400" />
          <span>{t('offline_mode_active', settings.language)}</span>
        </div>
      )}

      {/* Floating In-App Toast Notification */}
      {toastNotification && (
        <div className="fixed top-20 right-4 z-50 max-w-sm bg-slate-900 border border-red-500/50 rounded-2xl shadow-2xl p-4 flex items-start gap-3 animate-bounce">
          <div className="w-8 h-8 rounded-full bg-red-600/20 text-red-400 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white">{toastNotification.title}</h4>
            <p className="text-[11px] text-slate-300 mt-0.5">{toastNotification.body}</p>
          </div>
          <button
            onClick={() => setToastNotification(null)}
            className="text-slate-400 hover:text-white text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Top Navigation Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSearchSubmit={handleSearchSubmit}
        onToggleFilters={() => setShowFilters(!showFilters)}
        showFilters={showFilters}
        onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        activeReminders={reminders}
        onOpenRemindersModal={() => {
          setVideoToRemind(null);
          setShowRemindersModal(true);
        }}
        onOpenSyncModal={() => setShowSyncModal(true)}
        onOpenGitHubModal={() => setShowGitHubModal(true)}
        onOpenSettingsModal={() => setShowSettingsModal(true)}
        onOpenAuthModal={() => setShowAuthModal(true)}
        profile={profile}
        settings={settings}
        onLanguageChange={(lang: LanguageCode) => handleUpdateSettings({ language: lang })}
        onNavigateHome={() => {
          setActiveVideo(null);
          setActiveTab('home');
          setSubmittedQuery('');
          setSearchQuery('');
        }}
      />

      <div className="flex flex-1 relative">
        {/* Navigation Sidebar Drawer */}
        <Sidebar
          isOpen={isSidebarOpen}
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveVideo(null);
            setActiveTab(tab);
            setIsSidebarOpen(false);
          }}
          playlists={playlists}
          onSelectPlaylist={(pl) => {
            setActiveVideo(null);
            setActiveTab('playlists');
            setIsSidebarOpen(false);
          }}
          settings={settings}
          onOpenGitHubModal={() => setShowGitHubModal(true)}
          onOpenSettingsModal={() => setShowSettingsModal(true)}
        />

        {/* Main Content Viewport */}
        <main className="flex-1 md:pl-20 lg:pl-64 p-4 sm:p-6 transition-all duration-300 overflow-x-hidden">
          {/* Advanced Search Filters Drawer */}
          {showFilters && (
            <SearchFilterBar
              filters={searchFilters}
              onFilterChange={(newF) => setSearchFilters(newF)}
              onReset={() =>
                setSearchFilters({
                  uploadDate: 'all',
                  duration: 'all',
                  sortBy: 'relevance',
                  type: 'all'
                })
              }
              onClose={() => setShowFilters(false)}
            />
          )}

          {/* If a video is playing, show the VideoPlayerView */}
          {activeVideo ? (
            <div className="space-y-4">
              <button
                onClick={() => setActiveVideo(null)}
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Feeds</span>
              </button>

              <VideoPlayerView
                video={activeVideo}
                onSelectRelated={handleSelectVideo}
                onSaveToPlaylist={handleOpenSavePlaylistForVideo}
                onRemind={handleOpenRemindForVideo}
                settings={settings}
              />
            </div>
          ) : (
            renderTabContent()
          )}
        </main>
      </div>

      {/* MODALS */}
      <RemindersModal
        isOpen={showRemindersModal}
        onClose={() => setShowRemindersModal(false)}
        videoToRemind={videoToRemind}
        reminders={reminders}
        onRefreshReminders={refreshReminders}
        onSelectVideo={(v) => {
          setShowRemindersModal(false);
          handleSelectVideo(v);
        }}
      />

      {videoToSavePlaylist && (
        <SavePlaylistModal
          isOpen={showSavePlaylistModal}
          onClose={() => {
            setShowSavePlaylistModal(false);
            setVideoToSavePlaylist(null);
          }}
          video={videoToSavePlaylist}
          playlists={playlists}
          onRefreshPlaylists={refreshPlaylists}
        />
      )}

      <DeviceSyncModal
        isOpen={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        profile={profile}
        settings={settings}
        onDataImported={async () => {
          await refreshPlaylists();
          await refreshReminders();
        }}
      />

      <GitHubPagesExportModal
        isOpen={showGitHubModal}
        onClose={() => setShowGitHubModal(false)}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        settings={settings}
        profile={profile}
        onUpdateSettings={handleUpdateSettings}
        onDataImported={async () => {
          await refreshPlaylists();
          await refreshReminders();
        }}
      />

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        profile={profile}
        onUpdateProfile={handleUpdateProfile}
      />
    </div>
  );
}
