import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  Bell,
  Download,
  Share2,
  Globe,
  User,
  Menu,
  X,
  Laptop,
  Check,
  RefreshCw
} from 'lucide-react';
import { UserProfile, UserSettings, TaskReminder } from '../types';
import { LANGUAGES, LanguageCode, t } from '../services/i18n';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onSearchSubmit: (q: string) => void;
  onToggleFilters: () => void;
  showFilters: boolean;
  onToggleSidebar: () => void;
  activeReminders: TaskReminder[];
  onOpenRemindersModal: () => void;
  onOpenSyncModal: () => void;
  onOpenGitHubModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenAuthModal: () => void;
  profile: UserProfile;
  settings: UserSettings;
  onLanguageChange: (lang: LanguageCode) => void;
  onNavigateHome: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onSearchSubmit,
  onToggleFilters,
  showFilters,
  onToggleSidebar,
  activeReminders,
  onOpenRemindersModal,
  onOpenSyncModal,
  onOpenGitHubModal,
  onOpenSettingsModal,
  onOpenAuthModal,
  profile,
  settings,
  onLanguageChange,
  onNavigateHome
}) => {
  const [showLangMenu, setShowLangMenu] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const langRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { isInstallable, install } = usePWAInstall();

  const dueRemindersCount = activeReminders.filter((r) => !r.completed).length;

  const quickSearchSuggestions = [
    'Blender 3D Open Movies',
    'Lofi Hip Hop Live',
    'React 19 Architecture',
    'Rust Operating System',
    'Lex Fridman Podcast',
    'Space Telescope Discoveries'
  ];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setShowLangMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    onSearchSubmit(searchQuery);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0b0f17]/95 backdrop-blur-md border-b border-slate-800/80 px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-6">
      {/* ZONE 1: Brand & Sidebar toggle */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onToggleSidebar}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-500"
          aria-label="Toggle navigation drawer"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          onClick={onNavigateHome}
          className="flex items-center gap-2.5 text-left group focus-visible:outline-none"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-md shadow-red-950/40 group-hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div className="flex flex-col">
            <span className="text-base sm:text-lg font-bold tracking-tight text-white flex items-center gap-1.5 leading-none">
              YouPlayer
              <span className="text-[10px] font-mono uppercase px-1.5 py-0.5 rounded bg-red-600/20 text-red-400 font-semibold border border-red-500/20">
                Web
              </span>
            </span>
          </div>
        </button>
      </div>

      {/* ZONE 2: Search Bar with Filters & Suggestions */}
      <div className="flex-1 max-w-2xl relative mx-auto hidden md:block">
        <form onSubmit={handleFormSubmit} className="relative flex items-center">
          <div className="relative flex-1">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              placeholder={t('search_placeholder', settings.language)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-l-xl pl-10 pr-9 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500 focus:ring-1 focus:ring-red-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />

            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  onSearchChange('');
                  searchInputRef.current?.focus();
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white p-0.5"
                aria-label="Clear search query"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search Action Button */}
          <button
            type="submit"
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 border border-l-0 border-slate-700/80 text-slate-300 hover:text-white rounded-r-xl transition-colors shrink-0"
            aria-label="Submit search"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Advanced Filters Toggle Button */}
          <button
            type="button"
            onClick={onToggleFilters}
            className={`ml-2 p-2 rounded-xl border transition-colors shrink-0 ${
              showFilters
                ? 'bg-red-600/20 border-red-500/40 text-red-400'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
            title="Advanced search filters"
            aria-label="Toggle search filters"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
        </form>

        {/* Quick Suggestions Dropdown */}
        {showSuggestions && (
          <div
            className="absolute left-0 right-14 top-full mt-1.5 bg-slate-900/95 border border-slate-700/80 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden z-50 py-1.5"
            onMouseLeave={() => setShowSuggestions(false)}
          >
            <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Trending Topics
            </div>
            {quickSearchSuggestions.map((item) => (
              <button
                key={item}
                onClick={() => {
                  onSearchChange(item);
                  onSearchSubmit(item);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-3.5 py-1.5 text-xs text-slate-200 hover:bg-slate-800/80 flex items-center gap-2.5 transition-colors"
              >
                <Search className="w-3 h-3 text-slate-400" />
                <span>{item}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ZONE 3: Action Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search trigger if on small screens */}
        <div className="md:hidden">
          <button
            onClick={onToggleFilters}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"
            aria-label="Search and filters"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        {/* GitHub Pages Standalone Export Button */}
        <button
          onClick={onOpenGitHubModal}
          className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/70 text-xs font-medium transition-colors"
          title="Export Standalone Single-File HTML5 for GitHub Pages"
        >
          <Download className="w-3.5 h-3.5 text-red-400" />
          <span>GitHub Pages HTML</span>
        </button>

        {/* PWA Install Button */}
        {isInstallable && (
          <button
            onClick={install}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-sm transition-colors animate-pulse"
            title="Install YouPlayer as Desktop / Mobile App"
          >
            <Laptop className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Install PWA</span>
          </button>
        )}

        {/* Reminders / Notifications Bell */}
        <button
          onClick={onOpenRemindersModal}
          className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors"
          title="Task Reminders & Alerts"
          aria-label="Task reminders"
        >
          <Bell className="w-5 h-5" />
          {dueRemindersCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center animate-bounce">
              {dueRemindersCount}
            </span>
          )}
        </button>

        {/* Multi-Device Cloud Sync */}
        <button
          onClick={onOpenSyncModal}
          className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors"
          title="Cross-Device Cloud / Peer Sync"
          aria-label="Cross-device sync"
        >
          <RefreshCw className="w-5 h-5" />
        </button>

        {/* Language Selector Dropdown */}
        <div className="relative" ref={langRef}>
          <button
            onClick={() => setShowLangMenu(!showLangMenu)}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800/70 rounded-lg transition-colors flex items-center gap-1"
            title="Select Language"
            aria-label="Select language"
          >
            <Globe className="w-5 h-5" />
          </button>

          {showLangMenu && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-slate-900 border border-slate-700 rounded-xl shadow-xl py-1.5 z-50 backdrop-blur-md">
              <div className="px-3 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Language
              </div>
              {LANGUAGES.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => {
                    onLanguageChange(lang.code);
                    setShowLangMenu(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-slate-800 transition-colors ${
                    settings.language === lang.code ? 'text-red-400 font-semibold bg-slate-800/50' : 'text-slate-200'
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.label}</span>
                  </span>
                  {settings.language === lang.code && <Check className="w-3.5 h-3.5 text-red-400" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* User Account / Profile */}
        <button
          onClick={onOpenAuthModal}
          className="flex items-center gap-2 p-1.5 hover:bg-slate-800/70 rounded-lg transition-colors"
          title="Account Profile & OAuth Sync"
          aria-label="Account profile"
        >
          {profile.avatarUrl ? (
            <img
              src={profile.avatarUrl}
              alt={profile.name}
              referrerPolicy="no-referrer"
              className="w-7 h-7 rounded-full object-cover border border-slate-700 bg-slate-800"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
              <User className="w-4 h-4" />
            </div>
          )}
        </button>
      </div>
    </header>
  );
};
