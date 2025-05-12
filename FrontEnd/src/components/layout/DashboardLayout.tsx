import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TopNav } from './TopNav';
import { UserRole } from '../../types/auth';
import toast from 'react-hot-toast';

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<{ auth: string | null; role: string | null }>({ auth: null, role: null });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const auth = localStorage.getItem('auth');
    let role: string | null = null;

    console.log(`[${new Date().toISOString()}] DashboardLayout: Reading localStorage auth:`, auth);

    if (auth) {
      try {
        const authData = JSON.parse(auth);
        role = authData.role;
        console.log(`[${new Date().toISOString()}] DashboardLayout: Parsed authData:`, authData);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] DashboardLayout: Failed to parse auth:`, error);
        localStorage.removeItem('auth');
      }
    }

    console.log(`[${new Date().toISOString()}] DashboardLayout: Setting authState - auth=${!!auth}, role=${role}`);
    setAuthState({ auth, role });
    setIsLoading(false);

    if (!auth || !role) {
      console.log(`[${new Date().toISOString()}] DashboardLayout: No auth, redirecting to /login`);
      console.log(
        `[${new Date().toISOString()}] DashboardLayout: localStorage before redirect:`,
        localStorage.getItem('auth')
      );
      navigate('/login', { replace: true });
    } else {
      console.log(`[${new Date().toISOString()}] DashboardLayout: Auth valid, proceeding to render`);
    }
  }, [navigate]); // Only re-run if navigate changes

  const handleLogout = () => {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Logging out`);
    localStorage.removeItem('auth');
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Still loading auth state`);
    return null; // Prevent rendering until auth check is complete
  }

  if (!authState.auth || !authState.role) {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Not rendering due to missing auth`);
    return null; // Prevent rendering if redirected
  }

  console.log(`[${new Date().toISOString()}] DashboardLayout: Rendering with role=${authState.role}`);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <TopNav role={authState.role as UserRole} onLogout={handleLogout} />
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};