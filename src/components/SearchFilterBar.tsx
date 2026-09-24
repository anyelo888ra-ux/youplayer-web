import React from 'react';
import { SearchFilters } from '../types';
import { Clock, Calendar, ArrowUpDown, Layers, X } from 'lucide-react';

interface SearchFilterBarProps {
  filters: SearchFilters;
  onFilterChange: (newFilters: SearchFilters) => void;
  onReset: () => void;
  onClose: () => void;
}

export const SearchFilterBar: React.FC<SearchFilterBarProps> = ({
  filters,
  onFilterChange,
  onReset,
  onClose
}) => {
  const updateFilter = <K extends keyof SearchFilters>(key: K, value: SearchFilters[K]) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 mb-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Advanced Search Filters
        </span>
        <div className="flex items-center gap-3">
          <button
            onClick={onReset}
            className="text-xs text-red-400 hover:text-red-300 font-medium transition-colors"
          >
            Reset Filters
          </button>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            aria-label="Close filters"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Upload Date */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
            <Calendar className="w-3.5 h-3.5 text-red-400" />
            <span>Upload Date</span>
          </div>
          <div className="space-y-1">
            {[
              { id: 'all', label: 'Any time' },
              { id: 'today', label: 'Today' },
              { id: 'this_week', label: 'This week' },
              { id: 'this_month', label: 'This month' },
              { id: 'this_year', label: 'This year' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateFilter('uploadDate', opt.id as SearchFilters['uploadDate'])}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  filters.uploadDate === opt.id
                    ? 'bg-red-600/20 text-red-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
            <Clock className="w-3.5 h-3.5 text-red-400" />
            <span>Duration</span>
          </div>
          <div className="space-y-1">
            {[
              { id: 'all', label: 'Any duration' },
              { id: 'short', label: 'Short (< 4 minutes)' },
              { id: 'medium', label: 'Medium (4 - 20 minutes)' },
              { id: 'long', label: 'Long (> 20 minutes)' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateFilter('duration', opt.id as SearchFilters['duration'])}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  filters.duration === opt.id
                    ? 'bg-red-600/20 text-red-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sort By */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
            <ArrowUpDown className="w-3.5 h-3.5 text-red-400" />
            <span>Sort By</span>
          </div>
          <div className="space-y-1">
            {[
              { id: 'relevance', label: 'Relevance' },
              { id: 'views', label: 'View count' },
              { id: 'date', label: 'Upload date' },
              { id: 'rating', label: 'Rating' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateFilter('sortBy', opt.id as SearchFilters['sortBy'])}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  filters.sortBy === opt.id
                    ? 'bg-red-600/20 text-red-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Type */}
        <div>
          <div className="flex items-center gap-1.5 text-xs font-medium text-slate-300 mb-2">
            <Layers className="w-3.5 h-3.5 text-red-400" />
            <span>Result Type</span>
          </div>
          <div className="space-y-1">
            {[
              { id: 'all', label: 'All types' },
              { id: 'video', label: 'Videos only' },
              { id: 'channel', label: 'Channels' },
              { id: 'playlist', label: 'Playlists' }
            ].map((opt) => (
              <button
                key={opt.id}
                onClick={() => updateFilter('type', opt.id as SearchFilters['type'])}
                className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  filters.type === opt.id
                    ? 'bg-red-600/20 text-red-400 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
