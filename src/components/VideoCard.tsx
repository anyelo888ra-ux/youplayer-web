import React from 'react';
import { VideoItem } from '../types';
import { Clock, BookmarkPlus, Share2, Bell } from 'lucide-react';

interface VideoCardProps {
  video: VideoItem;
  onSelect: (video: VideoItem) => void;
  onSaveToPlaylist?: (video: VideoItem) => void;
  onRemind?: (video: VideoItem) => void;
  onShare?: (video: VideoItem) => void;
  progressSeconds?: number;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  video,
  onSelect,
  onSaveToPlaylist,
  onRemind,
  onShare,
  progressSeconds
}) => {
  const percent = progressSeconds && video.durationSeconds
    ? Math.min(100, Math.round((progressSeconds / video.durationSeconds) * 100))
    : 0;

  return (
    <div className="group flex flex-col bg-slate-900/60 rounded-xl overflow-hidden border border-slate-800/80 hover:border-slate-700 transition-all duration-200 hover:shadow-xl hover:shadow-black/40">
      {/* Thumbnail Container */}
      <div
        className="relative aspect-video w-full bg-slate-950 cursor-pointer overflow-hidden"
        onClick={() => onSelect(video)}
      >
        <img
          src={video.thumbnail}
          alt={video.title}
          referrerPolicy="no-referrer"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            // High reliability fallback
            (e.target as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.id}/hqdefault.jpg`;
          }}
        />

        {/* Live / Duration badge */}
        {video.isLive ? (
          <span className="absolute bottom-2.5 right-2.5 bg-red-600 text-white text-[11px] font-bold px-2 py-0.5 rounded tracking-wide animate-pulse">
            LIVE
          </span>
        ) : (
          <span className="absolute bottom-2.5 right-2.5 bg-black/85 text-slate-100 text-[11px] font-mono font-medium px-2 py-0.5 rounded tracking-tight backdrop-blur-sm">
            {video.duration}
          </span>
        )}

        {/* Progress bar if watched */}
        {percent > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
            <div className="h-full bg-red-600" style={{ width: `${percent}%` }} />
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 pointer-events-none">
          <span className="pointer-events-auto bg-red-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-lg flex items-center gap-1.5 transform scale-95 group-hover:scale-100 transition-transform">
            Play Video
          </span>
        </div>
      </div>

      {/* Info details */}
      <div className="p-3.5 flex gap-3 flex-1 flex-col justify-between">
        <div className="flex gap-3">
          {/* Channel avatar */}
          <div className="shrink-0 mt-0.5">
            <img
              src={video.channelAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
              alt={video.channelTitle}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover border border-slate-700/80 bg-slate-800"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80';
              }}
            />
          </div>

          {/* Titles & Meta */}
          <div className="flex-1 min-w-0">
            <h3
              onClick={() => onSelect(video)}
              className="text-sm font-medium text-slate-100 line-clamp-2 cursor-pointer hover:text-red-400 transition-colors leading-snug"
              title={video.title}
            >
              {video.title}
            </h3>

            <p className="text-xs text-slate-400 mt-1 hover:text-slate-200 transition-colors truncate">
              {video.channelTitle}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1 tabular-nums">
              <span>{video.views > 0 ? `${(video.views / 1000).toFixed(0)}K views` : 'New'}</span>
              <span aria-hidden="true">·</span>
              <span>{video.uploadedAt}</span>
            </div>
          </div>
        </div>

        {/* Action icons row */}
        <div className="flex items-center justify-between border-t border-slate-800/60 pt-2.5 mt-2">
          <div className="flex items-center gap-1">
            {onSaveToPlaylist && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onSaveToPlaylist(video);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                title="Save to playlist"
                aria-label="Save to playlist"
              >
                <BookmarkPlus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Save</span>
              </button>
            )}

            {onRemind && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onRemind(video);
                }}
                className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                title="Set reminder to watch"
                aria-label="Set reminder to watch"
              >
                <Bell className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">Remind</span>
              </button>
            )}
          </div>

          {onShare && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onShare(video);
              }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Share video"
              aria-label="Share video"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
