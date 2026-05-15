'use client';

import { useState } from 'react';
import { Sidebar } from '@/components/layout/sidebar';
import { Header } from '@/components/layout/header';
import { AuthGate } from '@/components/auth/auth-gate';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <AuthGate>
      <div className="flex h-screen min-h-screen bg-slate-50 overflow-hidden">
        <Sidebar open={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
        <div className="flex flex-col flex-1 overflow-hidden">
          <Header onToggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">{children}</main>
        </div>
      </div>
    </AuthGate>
  );
}
