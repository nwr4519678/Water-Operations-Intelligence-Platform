// src/components/layout/GlobalSearchModal.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Bell, FileText, X, ArrowRight } from 'lucide-react';
import { useUiStore } from '../../store/uiStore';
import { useGlobalSearch } from '../../hooks/useGlobalSearch';
import { Spinner } from '../common/Spinner';

export const GlobalSearchModal: React.FC = () => {
  const { globalSearchOpen, setGlobalSearchOpen } = useUiStore();
  const [query, setQuery] = useState('');
  const navigate = useNavigate();

  const { data, isLoading } = useGlobalSearch(query);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(!globalSearchOpen);
      }
      if (e.key === 'Escape' && globalSearchOpen) {
        setGlobalSearchOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [globalSearchOpen, setGlobalSearchOpen]);

  if (!globalSearchOpen) return null;

  const handleSelectStation = (id: string) => {
    setGlobalSearchOpen(false);
    navigate(`/stations/${id}`);
  };

  const handleSelectAlarm = () => {
    setGlobalSearchOpen(false);
    navigate('/alarms');
  };

  const handleSelectReport = () => {
    setGlobalSearchOpen(false);
    navigate('/reports');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-start justify-center p-4 sm:p-12">
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={() => setGlobalSearchOpen(false)}
      />

      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl z-10 border border-slate-200 overflow-hidden animate-in zoom-in-95 duration-150 mt-6 text-slate-900">
        {/* Search Input Bar */}
        <div className="flex items-center px-4 border-b border-slate-100 bg-white">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search stations, alarms, or reports across Egypt..."
            className="w-full px-3 py-4 text-sm bg-transparent outline-none text-slate-900 placeholder:text-slate-400 font-medium"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Results Container */}
        <div className="max-h-[60vh] overflow-y-auto p-4 space-y-4 bg-white">
          {isLoading ? (
            <div className="py-12 flex justify-center items-center">
              <Spinner size="md" />
            </div>
          ) : !query.trim() ? (
            <div className="py-8 text-center text-xs text-slate-400">
              Type at least 1 character to search across the monitoring station registry, alarms, and operations reports.
            </div>
          ) : !data ||
            (data.stations.length === 0 &&
              data.alarms.length === 0 &&
              data.reports.length === 0) ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No results found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <>
              {/* Stations Group */}
              {data.stations.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-blue-500" />
                    <span>Telemetry Stations ({data.stations.length})</span>
                  </div>
                  <div className="space-y-1">
                    {data.stations.map((s) => (
                      <div
                        key={s.stationId}
                        onClick={() => handleSelectStation(s.stationId)}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-xs font-bold text-blue-600 px-2 py-0.5 rounded bg-blue-50 border border-blue-100">
                            {s.stationCode}
                          </span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600">
                              {s.name}
                            </div>
                            <div className="text-[10px] text-slate-400">{s.zoneEn || s.regionId}</div>
                          </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alarms Group */}
              {data.alarms.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                    <Bell className="w-3.5 h-3.5 text-amber-500" />
                    <span>Triggered Alarms ({data.alarms.length})</span>
                  </div>
                  <div className="space-y-1">
                    {data.alarms.map((a) => (
                      <div
                        key={a.alarmId}
                        onClick={handleSelectAlarm}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{a.message}</div>
                          <div className="text-[10px] text-slate-400">{a.stationName}</div>
                        </div>
                        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-red-50 text-red-600 border border-red-200">
                          {a.severity}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reports Group */}
              {data.reports.length > 0 && (
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-3 mb-1.5 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Official Reports ({data.reports.length})</span>
                  </div>
                  <div className="space-y-1">
                    {data.reports.map((r) => (
                      <div
                        key={r.reportId}
                        onClick={handleSelectReport}
                        className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all cursor-pointer group"
                      >
                        <div>
                          <div className="text-xs font-bold text-slate-900">{r.title}</div>
                          <div className="text-[10px] text-slate-400">{r.reportType}</div>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400">{r.reportId}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <span>Navigate with <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">↓</kbd></span>
          <span>Press <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px]">Esc</kbd> to exit</span>
        </div>
      </div>
    </div>
  );
};
