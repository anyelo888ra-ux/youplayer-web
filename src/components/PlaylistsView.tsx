import React, { useState } from 'react';
import { Playlist, VideoItem, UserSettings } from '../types';
import { dbService } from '../services/db';
import { VideoCard } from './VideoCard';
import { ListMusic, Plus, Play, Trash2, ArrowLeft, Bookmark } from 'lucide-react';
import { t } from '../services/i18n';

interface PlaylistsViewProps {
  playlists: Playlist[];
  onRefreshPlaylists: () => void;
  onSelectVideo: (video: VideoItem) => void;
  settings: UserSettings;
}

export const PlaylistsView: React.FC<PlaylistsViewProps> = ({
  playlists,
  onRefreshPlaylists,
  onSelectVideo,
  settings
}) => {
  const [selectedPlaylist, setSelectedPlaylist] = useState<Playlist | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const newPl: Playlist = {
      id: `pl-${Date.now()}`,
      title: newTitle.trim(),
      description: newDesc.trim(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      videos: []
    };

    await dbService.savePlaylist(newPl);
    onRefreshPlaylists();
    setNewTitle('');
    setNewDesc('');
    setShowCreateModal(false);
    setSelectedPlaylist(newPl);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this playlist?')) {
      await dbService.deletePlaylist(id);
      onRefreshPlaylists();
      if (selectedPlaylist?.id === id) {
        setSelectedPlaylist(null);
      }
    }
  };

  const handleRemoveVideo = async (playlistId: string, videoId: string) => {
    await dbService.removeVideoFromPlaylist(playlistId, videoId);
    onRefreshPlaylists();
    if (selectedPlaylist) {
      setSelectedPlaylist({
        ...selectedPlaylist,
        videos: selectedPlaylist.videos.filter((v) => v.id !== videoId)
      });
    }
  };

  // If a playlist is selected, show detail view
  if (selectedPlaylist) {
    return (
      <div className="max-w-6xl mx-auto pb-16 space-y-6">
        <button
          onClick={() => setSelectedPlaylist(null)}
          className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Playlists</span>
        </button>

        {/* Playlist Header */}
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400 shrink-0">
              <ListMusic className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">{selectedPlaylist.title}</h1>
              {selectedPlaylist.description && (
                <p className="text-xs text-slate-400 mt-1">{selectedPlaylist.description}</p>
              )}
              <div className="flex items-center gap-2 text-xs text-slate-400 mt-2 font-mono">
                <span>{selectedPlaylist.videos.length} videos</span>
                <span>·</span>
                <span>Updated recently</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {selectedPlaylist.videos.length > 0 && (
              <button
                onClick={() => onSelectVideo(selectedPlaylist.videos[0])}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Play All</span>
              </button>
            )}

            {!selectedPlaylist.isSystem && (
              <button
                onClick={() => handleDelete(selectedPlaylist.id)}
                className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-xl transition-colors"
                title="Delete playlist"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Videos list */}
        {selectedPlaylist.videos.length === 0 ? (
          <div className="py-16 text-center bg-slate-900/40 border border-slate-800/80 rounded-2xl">
            <Bookmark className="w-12 h-12 text-slate-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-300">No videos in this playlist</h3>
            <p className="text-xs text-slate-400 mt-1">
              Browse videos and click "Save" to add them here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {selectedPlaylist.videos.map((video, index) => (
              <div
                key={video.id}
                className="flex items-center gap-4 p-3 bg-slate-900/60 hover:bg-slate-800/80 border border-slate-800/80 rounded-xl transition-colors group"
              >
                <span className="w-6 text-xs font-mono text-slate-400 text-center">
                  {index + 1}
                </span>

                <div
                  className="relative w-32 aspect-video rounded-lg overflow-hidden bg-slate-950 cursor-pointer shrink-0"
                  onClick={() => onSelectVideo(video)}
                >
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover"
                  />
                  <span className="absolute bottom-1 right-1 bg-black/85 text-slate-200 text-[10px] font-mono px-1 rounded">
                    {video.duration}
                  </span>
                </div>

                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => onSelectVideo(video)}
                >
                  <h4 className="text-sm font-semibold text-slate-200 hover:text-red-400 line-clamp-1">
                    {video.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5">{video.channelTitle}</p>
                </div>

                <button
                  onClick={() => handleRemoveVideo(selectedPlaylist.id, video.id)}
                  className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                  title="Remove from playlist"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // All Playlists Grid
  return (
    <div className="max-w-6xl mx-auto pb-16 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            {t('nav_playlists', settings.language)}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Collections stored locally in IndexedDB · Exportable as JSON
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-md transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>{t('new_playlist', settings.language)}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {playlists.map((pl) => (
          <div
            key={pl.id}
            onClick={() => setSelectedPlaylist(pl)}
            className="group p-5 bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl cursor-pointer transition-all duration-200 hover:shadow-xl hover:shadow-black/40 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700/80 flex items-center justify-center text-red-400 group-hover:scale-105 transition-transform">
                  <ListMusic className="w-6 h-6" />
                </div>
                <span className="text-xs font-mono text-slate-400 bg-slate-800/80 px-2 py-0.5 rounded-lg border border-slate-700/50">
                  {pl.videos.length} {pl.videos.length === 1 ? 'video' : 'videos'}
                </span>
              </div>

              <h3 className="text-base font-bold text-white group-hover:text-red-400 transition-colors">
                {pl.title}
              </h3>
              <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                {pl.description || 'Personal playlist collection'}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>{pl.isSystem ? 'System Playlist' : 'Custom'}</span>
              <span className="text-red-400 font-medium group-hover:translate-x-0.5 transition-transform">
                Open →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4"
          >
            <h2 className="text-lg font-bold text-white">Create New Playlist</h2>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Title
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g. Coding Sprints & Soundtracks"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
                autoFocus
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Description (Optional)
              </label>
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                placeholder="Brief summary of this collection..."
                rows={3}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
              />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
              >
                Create Playlist
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
