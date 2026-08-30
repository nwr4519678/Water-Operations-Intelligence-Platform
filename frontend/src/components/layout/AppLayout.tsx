// src/components/layout/AppLayout.tsx
import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { GlobalSearchModal } from './GlobalSearchModal';
import { ToastContainer } from '../common/Toast';
import { useSignalR } from '../../hooks/useSignalR';

export const AppLayout: React.FC = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() =>
    typeof window !== 'undefined' && window.innerWidth <= 700,
  );
  // Real-time SignalR
  useSignalR();

  return (
    <div className={`app-shell ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      <Sidebar />
      <main>
        <Header onMenuClick={() => setSidebarCollapsed((value) => !value)} sidebarCollapsed={sidebarCollapsed} />
        <Outlet />
      </main>

      <GlobalSearchModal />
      <ToastContainer />
    </div>
  );
};
