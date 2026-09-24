import React, { useState } from 'react';
import { UserSettings, UserProfile } from '../types';
import { pipedApi } from '../services/pipedApi';
import { dbService } from '../services/db';
import { Settings, Server, Palette, HardDrive, Download, Upload, Trash2, Check, RefreshCw, X } from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: UserSettings;
  profile: UserProfile;
  onUpdateSettings: (newSettings: Partial<UserSettings>) => void;
  onDataImported: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  profile,
  onUpdateSettings,
  onDataImported
}) => {
  const [activeInstance, setActiveInstance] = useState(pipedApi.getActiveInstance());
  const [latencies, setLatencies] = useState<Record<string, number | null>>({});
  const [testingPing, setTestingPing] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleTestPings = async () => {
    setTestingPing(true);
    const results: Record<string, number | null> = {};
    for (const inst of pipedApi.getInstances()) {
      results[inst] = await pipedApi.testInstanceLatency(inst);
    }
    setLatencies(results);
    setTestingPing(false);
  };

  const handleSelectInstance = (inst: string) => {
    setActiveInstance(inst);
    pipedApi.setActiveInstance(inst);
    onUpdateSettings({ pipedInstance: inst });
  };

  const handleExportJson = async () => {
    const data = await dbService.exportFullData(profile, settings);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youplayer-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        const res = await dbService.importFullData(parsed, 'merge');
        if (res.success) {
          setImportMessage('Data imported and merged successfully!');
          onDataImported();
        } else {
          setImportMessage(`Error: ${res.message}`);
        }
      } catch {
        setImportMessage('Invalid JSON file format.');
      }
    };
    reader.readAsText(file);
  };

  const handleClearAllData = async () => {
    if (confirm('Are you sure you want to reset all local data? This will clear watch history and custom playlists.')) {
      await dbService.clearWatchHistory();
      localStorage.clear();
      onDataImported();
      setImportMessage('Local storage and history reset.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Application Settings</h2>
              <p className="text-xs text-slate-400">Instance routing, themes & persistent IndexedDB management</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section 1: Piped API Public Instances */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Server className="w-3.5 h-3.5 text-red-400" />
              Piped API Public Instance
            </h3>
            <button
              onClick={handleTestPings}
              disabled={testingPing}
              className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1"
            >
              <RefreshCw className={`w-3 h-3 ${testingPing ? 'animate-spin' : ''}`} />
              <span>{testingPing ? 'Pinging...' : 'Test Latencies'}</span>
            </button>
          </div>

          <div className="space-y-1.5">
            {pipedApi.getInstances().map((inst) => {
              const isSelected = activeInstance === inst;
              const ping = latencies[inst];

              return (
                <div
                  key={inst}
                  onClick={() => handleSelectInstance(inst)}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors text-xs ${
                    isSelected
                      ? 'bg-red-600/15 border-red-500/40 text-white font-medium'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className={`w-2 h-2 rounded-full ${isSelected ? 'bg-red-500' : 'bg-slate-600'}`} />
                    <span className="font-mono truncate">{inst}</span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {ping !== undefined && (
                      <span className={`font-mono text-[11px] ${ping !== null && ping < 500 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {ping !== null ? `${ping}ms` : 'timeout'}
                      </span>
                    )}
                    {isSelected && <Check className="w-4 h-4 text-red-400" />}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Dark Theme Appearance */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-red-400" />
            Dark Mode Aesthetic Palette
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'charcoal', label: 'Charcoal Dark', desc: 'Deep sleek slate' },
              { id: 'slate', label: 'Dark Slate', desc: 'Balanced neutral' },
              { id: 'black', label: 'Midnight OLED', desc: 'Pure dark black' }
            ].map((th) => (
              <button
                key={th.id}
                onClick={() => onUpdateSettings({ theme: th.id as UserSettings['theme'] })}
                className={`p-3 rounded-xl border text-left transition-all ${
                  settings.theme === th.id
                    ? 'bg-red-600/15 border-red-500/40 text-white'
                    : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <div className="text-xs font-semibold">{th.label}</div>
                <div className="text-[10px] text-slate-400 mt-0.5">{th.desc}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Section 3: Data Backup & Restore */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-red-400" />
            Data Backup & Restore (JSON)
          </h3>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={handleExportJson}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors"
            >
              <Download className="w-4 h-4 text-red-400" />
              <span>Export All to JSON</span>
            </button>

            <label className="flex-1 flex items-center justify-center gap-2 p-3 bg-slate-950 border border-slate-800 hover:bg-slate-800 rounded-xl text-xs font-semibold text-slate-200 transition-colors cursor-pointer">
              <Upload className="w-4 h-4 text-sky-400" />
              <span>Import JSON File</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportJson}
                className="hidden"
              />
            </label>
          </div>

          {importMessage && (
            <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl">
              {importMessage}
            </p>
          )}
        </div>

        {/* Danger Zone */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-400">Reset local database</span>
          <button
            onClick={handleClearAllData}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-950/30 hover:bg-red-950/60 border border-red-800/40 text-red-400 text-xs font-semibold rounded-lg transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Reset Local Data</span>
          </button>
        </div>
      </div>
    </div>
  );
};
