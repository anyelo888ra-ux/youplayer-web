import React from 'react';
import {
  Home,
  Flame,
  Clock,
  ThumbsUp,
  Bookmark,
  ListMusic,
  BarChart2,
  Bell,
  HardDriveDownload,
  Settings,
  HelpCircle,
  ExternalLink,
  Github
} from 'lucide-react';
import { Playlist, UserSettings } from '../types';
import { t } from '../services/i18n';

interface SidebarProps {
  isOpen: boolean;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  playlists: Playlist[];
  onSelectPlaylist: (playlist: Playlist) => void;
  settings: UserSettings;
  onOpenGitHubModal: () => void;
  onOpenSettingsModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  activeTab,
  onSelectTab,
  playlists,
  onSelectPlaylist,
  settings,
  onOpenGitHubModal,
  onOpenSettingsModal
}) => {
  const mainNav = [
    { id: 'home', label: t('nav_home', settings.language), icon: Home },
    { id: 'trending', label: t('nav_trending', settings.language), icon: Flame },
    { id: 'dashboard', label: t('nav_dashboard', settings.language), icon: BarChart2 }
  ];

  const libraryNav = [
    { id: 'history', label: t('nav_history', settings.language), icon: Clock },
    { id: 'watch-later', label: t('nav_watch_later', settings.language), icon: Bookmark },
    { id: 'liked', label: t('nav_liked', settings.language), icon: ThumbsUp },
    { id: 'playlists', label: t('nav_playlists', settings.language), icon: ListMusic },
    { id: 'reminders', label: t('nav_reminders', settings.language), icon: Bell },
    { id: 'offline', label: t('nav_offline', settings.language), icon: HardDriveDownload }
  ];

  return (
    <aside
      className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-[#0b0f17] border-r border-slate-800/80 p-3 overflow-y-auto transition-transform duration-300 ease-in-out scrollbar-thin scrollbar-thumb-slate-800 ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:w-20 lg:w-64'
      }`}
    >
      <div className="flex flex-col gap-6">
        {/* Main Section */}
        <div className="space-y-1">
          {mainNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600/15 text-red-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span className="truncate md:hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="h-px bg-slate-800/80 mx-2" />

        {/* Library Section */}
        <div className="space-y-1">
          <div className="px-3.5 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider md:hidden lg:block">
            {t('nav_library', settings.language)}
          </div>
          {libraryNav.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center gap-4 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-red-600/15 text-red-400 font-semibold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`}
                title={item.label}
              >
                <Icon className={`w-5 h-5 shrink-0 ${isActive ? 'text-red-400' : 'text-slate-400'}`} />
                <span className="truncate md:hidden lg:inline">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Custom Playlists Quick Shelf (Desktop only) */}
        {playlists.filter((p) => !p.isSystem).length > 0 && (
          <>
            <div className="h-px bg-slate-800/80 mx-2" />
            <div className="space-y-1 hidden lg:block">
              <div className="px-3.5 pb-1 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                My Playlists
              </div>
              {playlists
                .filter((p) => !p.isSystem)
                .slice(0, 5)
                .map((playlist) => (
                  <button
                    key={playlist.id}
                    onClick={() => onSelectPlaylist(playlist)}
                    className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/60 transition-colors text-left"
                  >
                    <ListMusic className="w-4 h-4 text-slate-400 shrink-0" />
                    <span className="truncate flex-1">{playlist.title}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {playlist.videos.length}
                    </span>
                  </button>
                ))}
            </div>
          </>
        )}

        <div className="h-px bg-slate-800/80 mx-2" />

        {/* Footer actions */}
        <div className="space-y-1">
          <button
            onClick={onOpenSettingsModal}
            className="w-full flex items-center gap-4 px-3.5 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Settings className="w-5 h-5 shrink-0" />
            <span className="truncate md:hidden lg:inline">{t('nav_settings', settings.language)}</span>
          </button>

          <button
            onClick={onOpenGitHubModal}
            className="w-full flex items-center gap-4 px-3.5 py-2 rounded-xl text-sm text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <Github className="w-5 h-5 shrink-0 text-red-400" />
            <span className="truncate md:hidden lg:inline">GitHub Pages Single-File</span>
          </button>
        </div>

        {/* Subtle Open Source Disclaimer (clean unboxed text, no pills) */}
        <div className="px-3.5 text-[11px] text-slate-400 space-y-1 md:hidden lg:block pt-2">
          <div className="flex items-center gap-1.5">
            <span>YouPlayer Web</span>
            <span aria-hidden="true">·</span>
            <span>v1.0.0</span>
            <span aria-hidden="true">·</span>
            <span>MIT</span>
          </div>
          <p className="leading-tight">100% Free & Open Source · No YouTube API Key Required</p>
        </div>
      </div>
    </aside>
  );
};
