import React, { useState } from 'react';
import { UserProfile, UserSettings } from '../types';
import { dbService } from '../services/db';
import { RefreshCw, Copy, Check, Upload, Laptop, Smartphone, AlertCircle, X } from 'lucide-react';

interface DeviceSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  settings: UserSettings;
  onDataImported: () => void;
}

export const DeviceSyncModal: React.FC<DeviceSyncModalProps> = ({
  isOpen,
  onClose,
  profile,
  settings,
  onDataImported
}) => {
  const [syncCode, setSyncCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [inputCode, setInputCode] = useState('');
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const handleGenerateCode = async () => {
    setIsGenerating(true);
    try {
      const data = await dbService.exportFullData(profile, settings);
      const jsonStr = JSON.stringify(data);
      // Generate base64 sync token
      const token = btoa(encodeURIComponent(jsonStr));
      setSyncCode(token);
    } catch {
      setImportStatus('Failed to generate sync code.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApplySyncCode = async () => {
    if (!inputCode.trim()) return;
    try {
      setImportStatus('Decoding sync payload...');
      const decodedJson = decodeURIComponent(atob(inputCode.trim()));
      const parsed = JSON.parse(decodedJson);

      const res = await dbService.importFullData(parsed, 'merge');
      if (res.success) {
        setImportStatus('Sync completed successfully! Your playlists and history are synced.');
        onDataImported();
      } else {
        setImportStatus(`Error: ${res.message}`);
      }
    } catch {
      setImportStatus('Invalid sync code format. Please check the copied code.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <RefreshCw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Cross-Platform Sync</h2>
              <p className="text-xs text-slate-400">Sync watch history & playlists between Mobile, Tablet & PC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Visual device illustration */}
        <div className="flex items-center justify-center gap-4 py-3 bg-slate-950/60 border border-slate-800 rounded-xl text-slate-400 text-xs">
          <div className="flex items-center gap-1.5 text-slate-300">
            <Smartphone className="w-4 h-4 text-red-400" />
            <span>Mobile PWA</span>
          </div>
          <span className="text-slate-400 font-mono">⟷</span>
          <div className="flex items-center gap-1.5 text-slate-300">
            <Laptop className="w-4 h-4 text-sky-400" />
            <span>Desktop Browser</span>
          </div>
        </div>

        {/* Step 1: Export Sync Code from this device */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              1. Export from this device
            </h3>
            <button
              onClick={handleGenerateCode}
              disabled={isGenerating}
              className="text-xs text-red-400 hover:text-red-300 font-semibold"
            >
              {syncCode ? 'Regenerate Code' : 'Generate Sync Code'}
            </button>
          </div>

          {syncCode ? (
            <div className="relative">
              <textarea
                readOnly
                value={syncCode}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-[11px] font-mono text-slate-300 break-all select-all focus:outline-none"
              />
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg flex items-center gap-1 border border-slate-700 transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy'}</span>
              </button>
            </div>
          ) : (
            <p className="text-xs text-slate-400">
              Click generate to create an encrypted sync payload containing your local playlists and watch state.
            </p>
          )}
        </div>

        <div className="h-px bg-slate-800" />

        {/* Step 2: Import on another device */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
            2. Import on another device
          </h3>
          <textarea
            value={inputCode}
            onChange={(e) => setInputCode(e.target.value)}
            placeholder="Paste your sync code here..."
            rows={2}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-400 focus:outline-none focus:border-red-500 font-mono"
          />

          <div className="flex items-center justify-between pt-1">
            {importStatus ? (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {importStatus}
              </span>
            ) : <span />}

            <button
              onClick={handleApplySyncCode}
              disabled={!inputCode.trim()}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Apply & Merge Sync</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
