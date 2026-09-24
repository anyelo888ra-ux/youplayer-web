import React, { useState } from 'react';
import { generateSingleFileHtml } from '../services/singleFileGenerator';
import { Download, Copy, Check, Github, ExternalLink, Globe, FileCode, X } from 'lucide-react';

interface GitHubPagesExportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GitHubPagesExportModal: React.FC<GitHubPagesExportModalProps> = ({
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    const html = generateSingleFileHtml();
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'index.html';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = () => {
    const html = generateSingleFileHtml();
    navigator.clipboard.writeText(html);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 max-h-[90vh] overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <Github className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                GitHub Pages Standalone Single-File Web App
              </h2>
              <p className="text-xs text-slate-400">
                Host "YouPlayer Web" directly on GitHub Pages with 0 build steps or API keys!
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Buttons: 1-Click Download and Copy */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            onClick={handleDownload}
            className="flex items-center justify-center gap-2 p-3.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-lg shadow-red-900/30 transition-all"
          >
            <Download className="w-4 h-4" />
            <span>Download Standalone index.html</span>
          </button>

          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-2 p-3.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'HTML Copied to Clipboard!' : 'Copy Single-File HTML'}</span>
          </button>
        </div>

        {/* Features Checklist */}
        <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl space-y-2 text-xs">
          <h3 className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            Single-File Specifications Included:
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-300">
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Pure client-side HTML5 + Tailwind CSS CDN</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Public Piped API (zero YouTube API key required)</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>LocalStorage Watch History & Watch Later</span>
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span>Responsive YouTube dark mode design</span>
            </li>
          </ul>
        </div>

        {/* Step-by-Step GitHub Pages Deployment Guide */}
        <div className="space-y-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Globe className="w-4 h-4 text-red-400" />
            3-Minute GitHub Pages Setup Instructions
          </h3>

          <div className="space-y-2 text-xs text-slate-300">
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/90 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                1
              </span>
              <div>
                <p className="font-semibold text-slate-200">
                  Create a new repository named <code className="text-red-400 bg-slate-900 px-1 py-0.5 rounded font-mono">youplayer-web</code> on GitHub.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Set it to <strong>Public</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/90 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                2
              </span>
              <div>
                <p className="font-semibold text-slate-200">
                  Upload or commit the downloaded <code className="text-red-400 bg-slate-900 px-1 py-0.5 rounded font-mono">index.html</code> file to the root of the repository.
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  (Or click "Add file" &gt; "Create new file", name it <code className="text-slate-300 font-mono">index.html</code>, and paste the copied HTML).
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/90 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-red-600/20 text-red-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                3
              </span>
              <div>
                <p className="font-semibold text-slate-200">
                  Enable GitHub Pages:
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Go to <strong>Settings</strong> &gt; <strong>Pages</strong> &gt; Under <strong>Build and deployment</strong>, select <strong>Deploy from a branch</strong>, choose Branch <code className="text-slate-300 font-mono">main</code> and Folder <code className="text-slate-300 font-mono">/ (root)</code>, then click <strong>Save</strong>.
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/90 flex gap-3">
              <span className="w-5 h-5 rounded-full bg-emerald-600/20 text-emerald-400 font-bold flex items-center justify-center shrink-0 text-[11px]">
                ✓
              </span>
              <div>
                <p className="font-semibold text-slate-200">
                  Your website is live at:
                </p>
                <p className="text-[11px] text-emerald-400 font-mono mt-0.5">
                  https://&lt;your-username&gt;.github.io/youplayer-web/
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
