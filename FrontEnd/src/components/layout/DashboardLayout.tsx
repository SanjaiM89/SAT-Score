import React from 'react';
import { Outlet } from 'react-router-dom';
import { TopNav } from './TopNav';
import { UserRole } from '../../types/auth';

interface DashboardLayoutProps {
  role: UserRole;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ role, onLogout }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <TopNav role={role} onLogout={onLogout} />
      <main className="container mx-auto px-4 py-8">
        <Outlet />
      </main>
    </div>
  );
};