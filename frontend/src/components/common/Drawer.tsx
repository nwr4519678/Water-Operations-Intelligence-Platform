// src/components/common/Drawer.tsx
import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  width?: string;
  position?: 'right' | 'left';
  mode?: 'drawer' | 'modal';
}

export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  children,
  width = 'max-w-md',
  mode = 'drawer',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const panelClass = mode === 'modal'
    ? 'w-full max-w-2xl max-h-[min(760px,calc(100vh-32px))] rounded-2xl border border-slate-200 animate-in zoom-in-95 duration-200'
    : `ml-auto w-full ${width} h-full border-l animate-in slide-in-from-right duration-200`;

  return (
    <div className={`fixed inset-0 z-50 overflow-hidden flex ${mode === 'modal' ? 'items-center justify-center p-4 sm:p-8' : ''}`} role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Drawer Panel in Pure Light Theme */}
      <div className={`relative ${panelClass} ${mode === 'modal' ? 'modal-shell' : ''} bg-white shadow-2xl z-10 flex flex-col text-slate-900`}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
          <div className="text-sm font-bold text-slate-900 truncate">
            {title}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 bg-white">{children}</div>
      </div>
    </div>
  );
};
