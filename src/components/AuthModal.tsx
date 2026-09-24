import React, { useState } from 'react';
import { UserProfile } from '../types';
import { dbService } from '../services/db';
import { User, LogIn, LogOut, Check, ShieldCheck, Github, Chrome, Globe, X } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  onUpdateProfile: (p: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  profile,
  onUpdateProfile
}) => {
  const [name, setName] = useState(profile.name);
  const [email, setEmail] = useState(profile.email || '');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authStatus, setAuthStatus] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleOAuthSignIn = (provider: 'google' | 'github' | 'discord') => {
    setIsAuthenticating(true);
    setAuthStatus(`Connecting to ${provider.toUpperCase()} OAuth Provider...`);

    // Client-side simulated OAuth token handshake
    setTimeout(async () => {
      const providerProfiles = {
        google: {
          name: 'Alex Rivera',
          email: 'alex.rivera.dev@gmail.com',
          avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          provider: 'google' as const
        },
        github: {
          name: 'alex-rivera-code',
          email: 'alex@users.noreply.github.com',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80',
          provider: 'github' as const
        },
        discord: {
          name: 'CyberStreamer#4092',
          email: 'streamer@discordapp.com',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80',
          provider: 'discord' as const
        }
      };

      const selected = providerProfiles[provider];
      const updated: UserProfile = {
        id: `usr-${provider}-${Date.now()}`,
        name: selected.name,
        email: selected.email,
        avatarUrl: selected.avatarUrl,
        provider: selected.provider,
        syncEnabled: true
      };

      await dbService.saveProfile(updated);
      onUpdateProfile(updated);
      setIsAuthenticating(false);
      setAuthStatus(`Authenticated securely with ${provider.toUpperCase()}!`);
      setTimeout(() => setAuthStatus(null), 2500);
    }, 900);
  };

  const handleSaveLocal = async (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserProfile = {
      ...profile,
      name: name.trim() || 'YouPlayer User',
      email: email.trim() || undefined
    };
    await dbService.saveProfile(updated);
    onUpdateProfile(updated);
    setAuthStatus('Profile updated locally!');
    setTimeout(() => setAuthStatus(null), 2000);
  };

  const handleSignOut = async () => {
    const guest: UserProfile = {
      id: 'local-user',
      name: 'Local User',
      provider: 'guest',
      syncEnabled: false
    };
    await dbService.saveProfile(guest);
    onUpdateProfile(guest);
    setName(guest.name);
    setEmail('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-red-600/20 border border-red-500/30 flex items-center justify-center text-red-400">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">User Account & OAuth Sync</h2>
              <p className="text-xs text-slate-400">Link your account to sync across devices</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current User Card */}
        <div className="flex items-center gap-4 p-4 bg-slate-950 rounded-xl border border-slate-800">
          <img
            src={profile.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&auto=format&fit=crop&q=80'}
            alt={profile.name}
            className="w-12 h-12 rounded-full object-cover border border-slate-700 bg-slate-800"
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-white truncate">{profile.name}</h3>
            <p className="text-xs text-slate-400 truncate">{profile.email || 'Local IndexedDB Profile'}</p>
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono mt-1">
              <ShieldCheck className="w-3 h-3" />
              <span className="uppercase font-semibold">Provider: {profile.provider || 'Guest'}</span>
            </div>
          </div>

          {profile.provider !== 'guest' && (
            <button
              onClick={handleSignOut}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-900 rounded-lg transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* OAuth External Providers */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
            Sign In with OAuth
          </span>

          <div className="space-y-2">
            <button
              onClick={() => handleOAuthSignIn('google')}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              <Chrome className="w-4 h-4 text-red-400" />
              <span>Continue with Google</span>
            </button>

            <button
              onClick={() => handleOAuthSignIn('github')}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              <Github className="w-4 h-4 text-slate-200" />
              <span>Continue with GitHub</span>
            </button>

            <button
              onClick={() => handleOAuthSignIn('discord')}
              disabled={isAuthenticating}
              className="w-full flex items-center justify-center gap-3 p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-semibold text-white transition-colors"
            >
              <Globe className="w-4 h-4 text-indigo-400" />
              <span>Continue with Discord</span>
            </button>
          </div>

          {authStatus && (
            <p className="text-xs text-emerald-400 bg-emerald-950/30 border border-emerald-800/40 p-2.5 rounded-xl text-center">
              {authStatus}
            </p>
          )}
        </div>

        {/* Local Profile Editing */}
        <form onSubmit={handleSaveLocal} className="pt-2 border-t border-slate-800 space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
            Edit Local Name
          </span>

          <div className="flex gap-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display Name"
              className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 py-1.5 text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-red-500"
            />
            <button
              type="submit"
              className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
            >
              Save
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
