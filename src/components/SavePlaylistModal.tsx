import React, { useState } from 'react';
import { VideoItem, Playlist } from '../types';
import { dbService } from '../services/db';
import { BookmarkPlus, Plus, Check, X } from 'lucide-react';

interface SavePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  video: VideoItem;
  playlists: Playlist[];
  onRefreshPlaylists: () => void;
}

export const SavePlaylistModal: React.FC<SavePlaylistModalProps> = ({
  isOpen,
  onClose,
  video,
  playlists,
  onRefreshPlaylists
}) => {
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [justSavedTo, setJustSavedTo] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleToggle = async (playlist: Playlist) => {
    const exists = playlist.videos.some((v) => v.id === video.id);
    if (exists) {
      await dbService.removeVideoFromPlaylist(playlist.id, video.id);
    } else {
      await dbService.addVideoToPlaylist(playlist.id, video);
      setJustSavedTo(playlist.id);
      setTimeout(() => setJustSavedTo(null), 1500);
    }
    onRefreshPlaylists();
  };

  const handleCreateNew = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title: newTitle.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      videos: [video]
    };

    await dbService.savePlaylist(newPl);
    onRefreshPlaylists();
    setNewTitle('');
    setShowCreate(false);
    setJustSavedTo(newPl.id);
    setTimeout(() => setJustSavedTo(null), 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-5 space-y-4">
        <div className="flex items-center justify-between pb-2 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-bold text-white">Save Video to Playlist</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Video preview */}
        <div className="flex items-center gap-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
          <img
            src={video.thumbnail}
            alt=""
            className="w-14 h-8 object-cover rounded-md shrink-0"
          />
          <span className="text-xs text-slate-200 font-semibold line-clamp-1 flex-1">
            {video.title}
          </span>
        </div>

        {/* Playlists Checkbox List */}
        <div className="space-y-1 max-h-56 overflow-y-auto">
          {playlists.map((pl) => {
            const isSaved = pl.videos.some((v) => v.id === video.id);
            return (
              <button
                key={pl.id}
                onClick={() => handleToggle(pl)}
                className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-800 text-left transition-colors text-xs"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSaved
                        ? 'bg-red-600 border-red-500 text-white'
                        : 'border-slate-600 bg-slate-950'
                    }`}
                  >
                    {isSaved && <Check className="w-3 h-3 stroke-[3]" />}
                  </div>
                  <span className="text-slate-200 font-medium">{pl.title}</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">
                  {pl.videos.length} videos
                </span>
              </button>
            );
          })}
        </div>

        {/* Create inline */}
        {showCreate ? (
          <form onSubmit={handleCreateNew} className="pt-2 border-t border-slate-800 space-y-2">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="New playlist name..."
              className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
              autoFocus
              required
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowCreate(false)}
                className="px-3 py-1 text-xs text-slate-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-lg"
              >
                Create & Save
              </button>
            </div>
          </form>
        ) : (
          <button
            onClick={() => setShowCreate(true)}
            className="w-full pt-2 border-t border-slate-800 flex items-center justify-center gap-2 text-xs font-semibold text-red-400 hover:text-red-300 py-2 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Playlist</span>
          </button>
        )}
      </div>
    </div>
  );
};
