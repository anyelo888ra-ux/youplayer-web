import React, { useState } from 'react';
import { TaskReminder, VideoItem } from '../types';
import { dbService } from '../services/db';
import { notificationService } from '../services/notifications';
import { Bell, Clock, Trash2, CheckCircle, Volume2, Calendar, Plus, X } from 'lucide-react';

interface RemindersModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoToRemind?: VideoItem | null;
  reminders: TaskReminder[];
  onRefreshReminders: () => void;
  onSelectVideo: (video: VideoItem) => void;
}

export const RemindersModal: React.FC<RemindersModalProps> = ({
  isOpen,
  onClose,
  videoToRemind,
  reminders,
  onRefreshReminders,
  onSelectVideo
}) => {
  const [label, setLabel] = useState(videoToRemind ? `Watch: ${videoToRemind.title.slice(0, 30)}...` : '');
  const [note, setNote] = useState('');
  const [selectedPresetMinutes, setSelectedPresetMinutes] = useState(15);
  const [customDateTime, setCustomDateTime] = useState('');
  const [hasPermission, setHasPermission] = useState(notificationService.isPermissionGranted());

  if (!isOpen) return null;

  const handleRequestPermission = async () => {
    const res = await notificationService.requestPermission();
    setHasPermission(res === 'granted');
    if (res === 'granted') {
      notificationService.playNotificationChime();
    }
  };

  const handleTestChime = () => {
    notificationService.playNotificationChime();
  };

  const handleCreateReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const vid = videoToRemind || {
      id: 'Ke90Tje7VS0',
      title: label || 'Study session',
      channelTitle: 'YouPlayer Reminder',
      thumbnail: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
      duration: '15:00',
      durationSeconds: 900,
      views: 1000,
      uploadedAt: 'Now',
      description: ''
    };

    let scheduledMs = Date.now() + selectedPresetMinutes * 60 * 1000;
    if (customDateTime) {
      const parsed = new Date(customDateTime).getTime();
      if (!isNaN(parsed) && parsed > Date.now()) {
        scheduledMs = parsed;
      }
    }

    const newReminder: TaskReminder = {
      id: `rem-${Date.now()}`,
      videoId: vid.id,
      videoTitle: vid.title,
      videoThumbnail: vid.thumbnail,
      scheduledTime: scheduledMs,
      label: label.trim() || 'Scheduled Watch Session',
      note: note.trim(),
      completed: false,
      notified: false,
      createdAt: Date.now()
    };

    await dbService.saveReminder(newReminder);
    onRefreshReminders();
    setLabel('');
    setNote('');
    setCustomDateTime('');
  };

  const handleDeleteReminder = async (id: string) => {
    await dbService.deleteReminder(id);
    onRefreshReminders();
  };

  const handleToggleComplete = async (reminder: TaskReminder) => {
    reminder.completed = !reminder.completed;
    await dbService.saveReminder(reminder);
    onRefreshReminders();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Task Reminders & Push Alerts</h2>
              <p className="text-xs text-slate-400">Never miss scheduled study or research videos</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Browser Permission Banner */}
        <div className="flex items-center justify-between p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
          <div className="flex items-center gap-2.5">
            <Volume2 className="w-4 h-4 text-red-400" />
            <span>
              {hasPermission
                ? 'Desktop & browser push notifications are enabled'
                : 'Enable browser notifications to receive alerts when tab is in background'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleTestChime}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-medium transition-colors"
            >
              Test Chime
            </button>
            {!hasPermission && (
              <button
                onClick={handleRequestPermission}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-semibold transition-colors"
              >
                Enable
              </button>
            )}
          </div>
        </div>

        {/* Schedule Form */}
        <form onSubmit={handleCreateReminder} className="p-4 bg-slate-950/40 border border-slate-800 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5 text-red-400" />
            Schedule New Reminder
          </h3>

          {videoToRemind && (
            <div className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg border border-slate-800">
              <img
                src={videoToRemind.thumbnail}
                alt=""
                className="w-12 h-7 object-cover rounded"
              />
              <span className="text-xs text-slate-200 font-medium truncate flex-1">
                {videoToRemind.title}
              </span>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Reminder Label / Goal
            </label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. Finish Chapter 4 tutorial"
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
              required
            />
          </div>

          {/* Quick Presets */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
              Notify Me In:
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { mins: 15, label: '15 Mins' },
                { mins: 30, label: '30 Mins' },
                { mins: 60, label: '1 Hour' },
                { mins: 180, label: '3 Hours' }
              ].map((p) => (
                <button
                  type="button"
                  key={p.mins}
                  onClick={() => {
                    setSelectedPresetMinutes(p.mins);
                    setCustomDateTime('');
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border transition-colors ${
                    selectedPresetMinutes === p.mins && !customDateTime
                      ? 'bg-red-600/20 border-red-500/40 text-red-400'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Custom Date & Time */}
          <div>
            <label className="block text-[11px] font-medium text-slate-400 mb-1">
              Or Custom Date & Time:
            </label>
            <input
              type="datetime-local"
              value={customDateTime}
              onChange={(e) => setCustomDateTime(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-red-500"
            />
          </div>

          <div className="flex justify-end pt-1">
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded-xl shadow-md transition-colors"
            >
              Add Reminder
            </button>
          </div>
        </form>

        {/* Active Reminders List */}
        <div>
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
            Your Scheduled Reminders ({reminders.length})
          </h3>

          {reminders.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-6">
              No active reminders. Add one above to keep your study schedule on track!
            </p>
          ) : (
            <div className="space-y-2.5">
              {reminders.map((rem) => {
                const isPast = rem.scheduledTime <= Date.now();
                return (
                  <div
                    key={rem.id}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      rem.completed
                        ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                        : isPast
                        ? 'bg-amber-950/20 border-amber-800/40'
                        : 'bg-slate-950/70 border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <button
                        onClick={() => handleToggleComplete(rem)}
                        className="text-slate-400 hover:text-emerald-400"
                      >
                        <CheckCircle
                          className={`w-4 h-4 ${rem.completed ? 'text-emerald-400 fill-emerald-400/20' : ''}`}
                        />
                      </button>

                      <div className="min-w-0 flex-1">
                        <h4
                          className={`text-xs font-bold truncate ${
                            rem.completed ? 'line-through text-slate-400' : 'text-slate-200'
                          }`}
                        >
                          {rem.label}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate">
                          {rem.videoTitle}
                        </p>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-0.5 font-mono">
                          <Clock className="w-3 h-3 text-red-400" />
                          <span>{new Date(rem.scheduledTime).toLocaleString()}</span>
                          {isPast && !rem.completed && (
                            <span className="text-amber-400 font-semibold">[DUE]</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteReminder(rem.id)}
                      className="p-1.5 text-slate-400 hover:text-red-400 ml-2"
                      title="Delete reminder"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
