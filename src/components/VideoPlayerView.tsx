import React, { useState, useEffect, useRef } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  RotateCcw,
  RotateCw,
  Bookmark,
  Share2,
  BookmarkPlus,
  ThumbsUp,
  ThumbsDown,
  Bell,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Sliders,
  MessageSquare,
  Clock,
  Check,
  Send,
  Download
} from 'lucide-react';
import { VideoItem, Bookmark as BookmarkType, CommentItem, UserSettings } from '../types';
import { dbService } from '../services/db';
import { pipedApi } from '../services/pipedApi';
import { t } from '../services/i18n';

interface VideoPlayerViewProps {
  video: VideoItem;
  onSelectRelated: (video: VideoItem) => void;
  onSaveToPlaylist: (video: VideoItem) => void;
  onRemind: (video: VideoItem) => void;
  settings: UserSettings;
}

export const VideoPlayerView: React.FC<VideoPlayerViewProps> = ({
  video,
  onSelectRelated,
  onSaveToPlaylist,
  onRemind,
  settings
}) => {
  // Player states
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(video.durationSeconds || 300);
  const [volume, setVolume] = useState(settings.volume || 80);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(settings.defaultSpeed || 1);
  const [isTheater, setIsTheater] = useState(settings.theaterMode || false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoop, setIsLoop] = useState(false);
  const [quality, setQuality] = useState(settings.defaultQuality || '1080p');

  // Video metadata & interactive states
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(Math.max(120, Math.floor(video.views * 0.04)));
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showDesc, setShowDesc] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Bookmarks & Comments
  const [bookmarks, setBookmarks] = useState<BookmarkType[]>([]);
  const [showBookmarkForm, setShowBookmarkForm] = useState(false);
  const [bookmarkLabel, setBookmarkLabel] = useState('');
  const [bookmarkNote, setBookmarkNote] = useState('');

  const [comments, setComments] = useState<CommentItem[]>([]);
  const [newCommentText, setNewCommentText] = useState('');
  const [relatedVideos, setRelatedVideos] = useState<VideoItem[]>([]);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const progressTimerRef = useRef<number | null>(null);

  // Load video details, related videos and bookmarks
  useEffect(() => {
    let isMounted = true;
    setIsLoadingDetails(true);
    setCurrentTime(0);

    const loadData = async () => {
      // 1. Fetch details from Piped API
      const details = await pipedApi.getVideoDetails(video.id);
      if (!isMounted) return;

      setRelatedVideos(details.relatedVideos);
      setComments(details.comments);
      setIsLoadingDetails(false);

      // 2. Fetch existing bookmarks for this video
      const bmarks = await dbService.getBookmarks(video.id);
      if (isMounted) setBookmarks(bmarks);

      // 3. Record watch history
      if (!settings.historyPaused) {
        await dbService.recordWatchProgress(video, 1, video.durationSeconds);
      }
    };

    loadData();

    // Setup periodic watch progress tracker
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = window.setInterval(() => {
      setCurrentTime((prev) => {
        const next = prev + 1;
        if (!settings.historyPaused && next % 5 === 0) {
          dbService.recordWatchProgress(video, next, video.durationSeconds);
        }
        return next;
      });
    }, 1000);

    return () => {
      isMounted = false;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [video.id, settings.historyPaused]);

  // Handle Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  // Keyboard navigation shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Do not trigger if typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) {
        return;
      }

      if (e.code === 'Space' || e.key === 'k') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      } else if (e.key === 'j') {
        // -10s
        e.preventDefault();
        setCurrentTime((t) => Math.max(0, t - 10));
      } else if (e.key === 'l') {
        // +10s
        e.preventDefault();
        setCurrentTime((t) => Math.min(duration, t + 10));
      } else if (e.key === 'm') {
        e.preventDefault();
        setIsMuted((m) => !m);
      } else if (e.key === 'f') {
        e.preventDefault();
        toggleFullscreen();
      } else if (e.key === 't') {
        e.preventDefault();
        setIsTheater((th) => !th);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [duration]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSec = Number(e.target.value);
    setCurrentTime(newSec);
    // Reload iframe to seek if desired
    if (iframeRef.current) {
      iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&start=${Math.floor(newSec)}&enablejsapi=1&rel=0`;
    }
  };

  const handleAddBookmark = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookmarkLabel.trim()) return;

    const newBookmark: BookmarkType = {
      id: `bm-${Date.now()}`,
      videoId: video.id,
      videoTitle: video.title,
      videoThumbnail: video.thumbnail,
      timestampSeconds: Math.floor(currentTime),
      label: bookmarkLabel.trim(),
      note: bookmarkNote.trim(),
      createdAt: Date.now()
    };

    await dbService.saveBookmark(newBookmark);
    setBookmarks((prev) => [...prev, newBookmark].sort((a, b) => a.timestampSeconds - b.timestampSeconds));
    setBookmarkLabel('');
    setBookmarkNote('');
    setShowBookmarkForm(false);
  };

  const handleDeleteBookmark = async (id: string) => {
    await dbService.deleteBookmark(id);
    setBookmarks((prev) => prev.filter((b) => b.id !== id));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;

    const comment: CommentItem = {
      id: `user-c-${Date.now()}`,
      author: 'You (Local User)',
      avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80',
      text: newCommentText.trim(),
      likes: 1,
      timeAgo: 'Just now',
      isLocalUser: true
    };

    setComments([comment, ...comments]);
    setNewCommentText('');
  };

  const handleShare = () => {
    const url = `https://youtu.be/${video.id}?t=${Math.floor(currentTime)}`;
    navigator.clipboard.writeText(url);
    setCopiedShare(true);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  const handleDownloadMetadata = () => {
    const exportData = {
      title: video.title,
      id: video.id,
      channel: video.channelTitle,
      duration: video.duration,
      views: video.views,
      uploadedAt: video.uploadedAt,
      url: `https://youtu.be/${video.id}`,
      bookmarks: bookmarks
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youplayer-${video.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-[1700px] mx-auto pb-12">
      <div className={`grid gap-6 ${isTheater ? 'grid-cols-1' : 'grid-cols-1 xl:grid-cols-12'}`}>
        {/* MAIN COLUMN: Video Player & Details */}
        <div className={isTheater ? 'w-full' : 'xl:col-span-8'}>
          {/* PLAYER VIEWPORT CONTAINER */}
          <div
            ref={containerRef}
            className={`relative bg-black rounded-2xl overflow-hidden shadow-2xl border border-slate-800 ${
              isTheater ? 'aspect-[21/9] max-h-[70vh]' : 'aspect-video'
            }`}
          >
            {/* Embedded YouTube Privacy Player */}
            <iframe
              ref={iframeRef}
              src={`https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`}
              title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              className="w-full h-full border-0"
            />

            {/* Custom Bottom Control Bar */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/95 via-black/75 to-transparent p-3 pt-6 flex flex-col gap-2 opacity-95 hover:opacity-100 transition-opacity">
              {/* Seek Slider */}
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min={0}
                  max={duration}
                  value={currentTime}
                  onChange={handleSeek}
                  className="w-full h-1.5 bg-slate-700/80 rounded-lg appearance-none cursor-pointer accent-red-600 focus:outline-none"
                  aria-label="Seek timeline"
                />
              </div>

              {/* Controls Row */}
              <div className="flex items-center justify-between text-xs text-slate-200">
                {/* Left group */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="p-1.5 text-white hover:text-red-400 transition-colors"
                    aria-label={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={() => setCurrentTime((t) => Math.max(0, t - 10))}
                    className="p-1 text-slate-300 hover:text-white"
                    title="Rewind 10s (J)"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setCurrentTime((t) => Math.min(duration, t + 10))}
                    className="p-1 text-slate-300 hover:text-white"
                    title="Forward 10s (L)"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-1.5 group">
                    <button
                      onClick={() => setIsMuted(!isMuted)}
                      className="p-1 text-slate-300 hover:text-white"
                      aria-label="Mute toggle (M)"
                    >
                      {isMuted || volume === 0 ? (
                        <VolumeX className="w-4 h-4 text-red-400" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={isMuted ? 0 : volume}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        if (isMuted) setIsMuted(false);
                      }}
                      className="w-16 h-1 bg-slate-700 rounded appearance-none cursor-pointer accent-red-500 opacity-60 group-hover:opacity-100 transition-opacity"
                    />
                  </div>

                  {/* Time indicator */}
                  <span className="text-[11px] font-mono tabular-nums text-slate-400">
                    {pipedApi.formatDuration(currentTime)} / {video.duration}
                  </span>
                </div>

                {/* Right Group */}
                <div className="flex items-center gap-2">
                  {/* Speed Selector */}
                  <select
                    value={playbackSpeed}
                    onChange={(e) => setPlaybackSpeed(Number(e.target.value))}
                    className="bg-black/60 border border-slate-700/80 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none"
                    title="Playback Speed"
                  >
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((s) => (
                      <option key={s} value={s}>
                        {s}x
                      </option>
                    ))}
                  </select>

                  {/* Quality Selector */}
                  <select
                    value={quality}
                    onChange={(e) => setQuality(e.target.value as any)}
                    className="bg-black/60 border border-slate-700/80 rounded px-1.5 py-0.5 text-[11px] text-slate-300 focus:outline-none hidden sm:inline"
                    title="Resolution"
                  >
                    {['1080p', '720p', '480p', '360p', 'auto'].map((q) => (
                      <option key={q} value={q}>
                        {q}
                      </option>
                    ))}
                  </select>

                  {/* Bookmark Button */}
                  <button
                    onClick={() => setShowBookmarkForm(!showBookmarkForm)}
                    className="p-1 text-slate-300 hover:text-red-400"
                    title="Bookmark Timestamp"
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                  </button>

                  {/* Theater Mode */}
                  <button
                    onClick={() => setIsTheater(!isTheater)}
                    className="p-1 text-slate-300 hover:text-white hidden md:inline"
                    title="Theater mode (T)"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                  </button>

                  {/* Fullscreen */}
                  <button
                    onClick={toggleFullscreen}
                    className="p-1 text-slate-300 hover:text-white"
                    title="Fullscreen (F)"
                  >
                    {isFullscreen ? (
                      <Minimize2 className="w-4 h-4" />
                    ) : (
                      <Maximize2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Bookmark Creation Form Modal */}
          {showBookmarkForm && (
            <form
              onSubmit={handleAddBookmark}
              className="mt-3 p-4 bg-slate-900 border border-slate-800 rounded-xl shadow-lg flex flex-col gap-3"
            >
              <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                <span className="flex items-center gap-1.5">
                  <Bookmark className="w-4 h-4 text-red-500" />
                  Bookmark Timestamp at {pipedApi.formatDuration(currentTime)}
                </span>
                <button
                  type="button"
                  onClick={() => setShowBookmarkForm(false)}
                  className="text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <input
                type="text"
                placeholder="Bookmark title (e.g. Important code architecture)"
                value={bookmarkLabel}
                onChange={(e) => setBookmarkLabel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
                autoFocus
                required
              />
              <input
                type="text"
                placeholder="Personal note (optional)"
                value={bookmarkNote}
                onChange={(e) => setBookmarkNote(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowBookmarkForm(false)}
                  className="px-3 py-1 text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
                >
                  Save Bookmark
                </button>
              </div>
            </form>
          )}

          {/* Saved Bookmarks Shelf */}
          {bookmarks.length > 0 && (
            <div className="mt-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">
                Saved Timestamps ({bookmarks.length})
              </span>
              <div className="flex flex-wrap gap-2">
                {bookmarks.map((bm) => (
                  <div
                    key={bm.id}
                    className="flex items-center gap-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-750 border border-slate-700/80 rounded-lg text-xs"
                  >
                    <button
                      onClick={() => {
                        setCurrentTime(bm.timestampSeconds);
                        if (iframeRef.current) {
                          iframeRef.current.src = `https://www.youtube-nocookie.com/embed/${video.id}?autoplay=1&start=${bm.timestampSeconds}&enablejsapi=1`;
                        }
                      }}
                      className="text-red-400 font-mono font-medium hover:underline flex items-center gap-1"
                    >
                      <Clock className="w-3 h-3" />
                      <span>{pipedApi.formatDuration(bm.timestampSeconds)}</span>
                    </button>
                    <span className="text-slate-300">{bm.label}</span>
                    <button
                      onClick={() => handleDeleteBookmark(bm.id)}
                      className="text-slate-400 hover:text-red-400 ml-1"
                      title="Delete bookmark"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Video Metadata Header */}
          <div className="mt-4">
            <h1 className="text-lg sm:text-xl font-bold text-slate-100 leading-snug">
              {video.title}
            </h1>

            {/* Actions Bar */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
              {/* Creator details */}
              <div className="flex items-center gap-3">
                <img
                  src={video.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
                  alt={video.channelTitle}
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-full object-cover border border-slate-700 bg-slate-800"
                />
                <div>
                  <h2 className="text-sm font-semibold text-slate-100 hover:text-red-400 transition-colors cursor-pointer">
                    {video.channelTitle}
                  </h2>
                  <p className="text-xs text-slate-400">
                    {video.subscribers || '1.24M subscribers'}
                  </p>
                </div>
                <button
                  onClick={() => setIsSubscribed(!isSubscribed)}
                  className={`ml-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                    isSubscribed
                      ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      : 'bg-white text-slate-900 hover:bg-slate-200'
                  }`}
                >
                  {isSubscribed ? t('subscribed', settings.language) : t('subscribe', settings.language)}
                </button>
              </div>

              {/* Right Action buttons */}
              <div className="flex items-center gap-2 flex-wrap">
                {/* Like / Dislike pill-group */}
                <div className="flex items-center bg-slate-800/90 border border-slate-700/70 rounded-xl overflow-hidden">
                  <button
                    onClick={() => {
                      setIsLiked(!isLiked);
                      setLikesCount((c) => (isLiked ? c - 1 : c + 1));
                    }}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-medium hover:bg-slate-700 transition-colors ${
                      isLiked ? 'text-red-400 font-semibold' : 'text-slate-200'
                    }`}
                  >
                    <ThumbsUp className={`w-3.5 h-3.5 ${isLiked ? 'fill-red-400' : ''}`} />
                    <span className="tabular-nums">{(likesCount / 1000).toFixed(1)}K</span>
                  </button>
                  <div className="w-px h-4 bg-slate-700" />
                  <button
                    className="px-2.5 py-2 text-slate-300 hover:bg-slate-700 transition-colors"
                    aria-label="Dislike"
                  >
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Share Button */}
                <button
                  onClick={handleShare}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 text-xs font-medium text-slate-200 transition-colors"
                >
                  {copiedShare ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Share2 className="w-3.5 h-3.5" />
                      <span>{t('share', settings.language)}</span>
                    </>
                  )}
                </button>

                {/* Save to Playlist */}
                <button
                  onClick={() => onSaveToPlaylist(video)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 text-xs font-medium text-slate-200 transition-colors"
                >
                  <BookmarkPlus className="w-3.5 h-3.5" />
                  <span>{t('save_playlist', settings.language)}</span>
                </button>

                {/* Remind Me */}
                <button
                  onClick={() => onRemind(video)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 text-xs font-medium text-slate-200 transition-colors"
                  title="Schedule a task reminder to watch this"
                >
                  <Bell className="w-3.5 h-3.5" />
                  <span>{t('remind_me', settings.language)}</span>
                </button>

                {/* Download / Export Info */}
                <button
                  onClick={handleDownloadMetadata}
                  className="p-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 border border-slate-700/70 text-slate-300 hover:text-white transition-colors"
                  title="Export Video Metadata JSON"
                  aria-label="Download video JSON"
                >
                  <Download className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Description Box */}
            <div className="mt-4 p-4 bg-slate-900/70 border border-slate-800 rounded-2xl text-xs text-slate-300">
              <div className="flex items-center gap-3 font-semibold text-slate-200 mb-2 tabular-nums">
                <span>{video.views ? `${video.views.toLocaleString()} views` : 'Trending'}</span>
                <span aria-hidden="true">·</span>
                <span>{video.uploadedAt}</span>
                <span aria-hidden="true">·</span>
                <span className="text-red-400 font-mono">#{video.category || 'featured'}</span>
              </div>

              <div className={`whitespace-pre-line leading-relaxed ${showDesc ? '' : 'line-clamp-3'}`}>
                {video.description || 'Watch high definition ad-free video on YouPlayer.'}
              </div>

              <button
                onClick={() => setShowDesc(!showDesc)}
                className="mt-2 text-slate-400 hover:text-white font-semibold flex items-center gap-1"
              >
                {showDesc ? (
                  <>
                    Show less <ChevronUp className="w-3.5 h-3.5" />
                  </>
                ) : (
                  <>
                    Show more <ChevronDown className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Comments & Personal Study Notes Section */}
          <div className="mt-8 border-t border-slate-800/80 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-slate-100 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-red-500" />
                <span>{t('comments', settings.language)}</span>
                <span className="text-xs text-slate-400 font-mono">({comments.length})</span>
              </h3>
            </div>

            {/* Post note form */}
            <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
              <div className="w-9 h-9 rounded-full bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 font-bold text-xs shrink-0">
                You
              </div>
              <div className="flex-1 flex gap-2">
                <input
                  type="text"
                  placeholder={t('add_comment', settings.language)}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
                />
                <button
                  type="submit"
                  disabled={!newCommentText.trim()}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1 transition-colors"
                >
                  <Send className="w-3 h-3" />
                  <span>{t('post_comment', settings.language)}</span>
                </button>
              </div>
            </form>

            {/* Comments list */}
            <div className="space-y-4">
              {comments.map((comment) => (
                <div key={comment.id} className="flex gap-3 text-xs">
                  <img
                    src={comment.avatar}
                    alt={comment.author}
                    referrerPolicy="no-referrer"
                    className="w-8 h-8 rounded-full object-cover bg-slate-800 shrink-0 border border-slate-700"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200">{comment.author}</span>
                      <span className="text-slate-400 text-[11px]">{comment.timeAgo}</span>
                      {comment.isLocalUser && (
                        <span className="text-[10px] bg-red-600/20 text-red-400 px-1.5 py-0.2 rounded font-mono font-medium">
                          Local
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-slate-300 leading-relaxed">{comment.text}</p>
                    <div className="flex items-center gap-3 mt-2 text-slate-400">
                      <button className="flex items-center gap-1 hover:text-slate-200">
                        <ThumbsUp className="w-3 h-3" />
                        <span className="text-[10px] tabular-nums">{comment.likes}</span>
                      </button>
                      <button className="hover:text-slate-200">
                        <ThumbsDown className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR: Related & Up Next */}
        <div className={isTheater ? 'w-full mt-6' : 'xl:col-span-4'}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-slate-100 tracking-tight">
              {t('related_videos', settings.language)}
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              {relatedVideos.length} recommendations
            </span>
          </div>

          <div className="space-y-3">
            {relatedVideos.map((rVideo) => (
              <div
                key={rVideo.id}
                onClick={() => onSelectRelated(rVideo)}
                className="group flex gap-3 p-2 rounded-xl bg-slate-900/40 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-all cursor-pointer"
              >
                {/* Mini thumbnail */}
                <div className="relative w-36 aspect-video shrink-0 rounded-lg overflow-hidden bg-slate-950">
                  <img
                    src={rVideo.thumbnail}
                    alt={rVideo.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${rVideo.id}/hqdefault.jpg`;
                    }}
                  />
                  <span className="absolute bottom-1 right-1 bg-black/85 text-slate-100 text-[10px] font-mono font-medium px-1 rounded">
                    {rVideo.duration}
                  </span>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  <h4 className="text-xs font-semibold text-slate-200 group-hover:text-red-400 line-clamp-2 leading-snug">
                    {rVideo.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-1 truncate">{rVideo.channelTitle}</p>
                  <p className="text-[10px] text-slate-400 mt-0.5 tabular-nums">
                    {rVideo.views ? `${(rVideo.views / 1000).toFixed(0)}K views` : 'New'} ·{' '}
                    {rVideo.uploadedAt}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
