// src/components/notifications/NotificationBell.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { useNotificationsList, useUnreadNotificationsCount, useMarkNotificationRead } from '../../hooks/useNotificationQueries';
import { formatRelative } from '../../utils/formatters';
import { Spinner } from '../common/Spinner';

export const NotificationBell: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: unreadData } = useUnreadNotificationsCount();
  const { data: listData, isLoading } = useNotificationsList({ unreadOnly: false, pageSize: 6 });
  const markReadMutation = useMarkNotificationRead();

  const unreadCount = unreadData?.count || 0;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
        title="Notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white shadow-xs animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150 text-slate-900">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50/50">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-800">
                Notifications
              </span>
              {unreadCount > 0 && (
                <span className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded font-bold border border-blue-200">
                  {unreadCount} new
                </span>
              )}
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Real-time alerts</span>
          </div>

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 bg-white">
            {isLoading ? (
              <div className="p-8 flex justify-center">
                <Spinner size="sm" />
              </div>
            ) : !listData || listData.items.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No notifications to display
              </div>
            ) : (
              listData.items.map((n) => (
                <div
                  key={n.notificationId}
                  className={`p-3.5 hover:bg-slate-50 transition-colors ${
                    !n.isRead ? 'bg-blue-50/40' : 'bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-slate-900 leading-snug">
                        {n.title}
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {n.body}
                      </p>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {formatRelative(n.createdAtUtc)}
                      </div>
                    </div>

                    {!n.isRead && (
                      <button
                        onClick={() => markReadMutation.mutate(n.notificationId)}
                        className="p-1 rounded-md text-blue-600 hover:bg-blue-100 transition-colors shrink-0 cursor-pointer"
                        title="Mark as read"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
