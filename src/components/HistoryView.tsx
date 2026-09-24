import React, { useState, useEffect } from 'react';
import { WatchHistoryItem, VideoItem, UserSettings } from '../types';
import { dbService } from '../services/db';
import { pipedApi } from '../services/pipedApi';
import { Clock, Search, Trash2, Play, Pause, AlertCircle } from 'lucide-react';
import { t } from '../services/i18n';

interface HistoryViewProps {
  onSelectVideo: (video: VideoItem) => void;
  settings: UserSettings;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onSelectVideo,
  settings,
  onUpdateSettings
}) => {
  const [history, setHistory] = useState<WatchHistoryItem[]>([]);
  const [filterQuery, setFilterQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadHistory = async () => {
    setIsLoading(true);
    const items = await dbService.getWatchHistory();
    setHistory(items);
    setIsLoading(false);
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const handleClearAll = async () => {
    if (confirm('Clear all watch history from your local IndexedDB?')) {
      await dbService.clearWatchHistory();
      setHistory([]);
    }
  };

  const handleDeleteItem = async (videoId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await dbService.deleteHistoryItem(videoId);
    setHistory((prev) => prev.filter((h) => (h.videoId || h.video.id) !== videoId));
  };

  const filtered = history.filter((h) =>
    h.video.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    h.video.channelTitle.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="max-w-5xl mx-auto pb-16 space-y-6">
      {/* Header with Search and Clear controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2.5">
            <Clock className="w-6 h-6 text-red-500" />
            <span>{t('nav_history', settings.language)}</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Persisted in local browser storage (IndexedDB) · {history.length} videos recorded
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onUpdateSettings({ historyPaused: !settings.historyPaused })}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              settings.historyPaused
                ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            {settings.historyPaused ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span>{settings.historyPaused ? 'History Paused' : 'Pause History'}</span>
          </button>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-red-950/40 hover:text-red-400 border border-slate-700 text-xs font-semibold text-slate-300 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{t('clear_history', settings.language)}</span>
            </button>
          )}
        </div>
      </div>

      {/* History Search Bar */}
      {history.length > 0 && (
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search within your watch history..."
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
          />
        </div>
      )}

      {/* History List */}
      {history.length === 0 ? (
        <div className="py-20 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
          <Clock className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-300">Your watch history is empty</h3>
          <p className="text-xs text-slate-400 mt-1">
            Videos you watch will appear here with exact timestamp resume indicators.
          </p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-400">
          No history items matched "{filterQuery}".
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => {
            const dur = item.video.durationSeconds || 300;
            const percent = Math.min(100, Math.round((item.progressSeconds / dur) * 100));

            return (
              <div
                key={item.video.id}
                onClick={() => onSelectVideo(item.video)}
                className="group flex flex-col sm:flex-row items-start sm:items-center gap-4 p-3.5 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-2xl transition-all cursor-pointer"
              >
                {/* Thumbnail with progress bar */}
                <div className="relative w-full sm:w-44 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0">
                  <img
                    src={item.video.thumbnail}
                    alt={item.video.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                  <span className="absolute bottom-1.5 right-1.5 bg-black/85 text-slate-200 text-[10px] font-mono px-1 rounded">
                    {pipedApi.formatDuration(item.progressSeconds)} / {item.video.duration}
                  </span>
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
                    <div className="h-full bg-red-600" style={{ width: `${percent}%` }} />
                  </div>
                </div>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold text-slate-100 group-hover:text-red-400 transition-colors line-clamp-2">
                    {item.video.title}
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">{item.video.channelTitle}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-1 font-mono">
                    <span>Watched {new Date(item.watchedAt).toLocaleDateString()}</span>
                    <span>·</span>
                    <span className="text-red-400">{percent}% watched</span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={(e) => handleDeleteItem(item.video.id, e)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-750 rounded-lg transition-colors shrink-0"
                  title="Remove from history"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
