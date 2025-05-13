import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { TopNav } from './TopNav';
import { UserRole } from '../../types/auth';
import toast from 'react-hot-toast';

interface AuthState {
  userId: string;
  role: UserRole;
  fullName: string;
  sessionId: string;
}

export const DashboardLayout: React.FC = () => {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      console.log(`[${new Date().toISOString()}] DashboardLayout: Validating auth`);
      const auth = localStorage.getItem('auth');
      const token = localStorage.getItem('token');
      console.log(`[${new Date().toISOString()}] DashboardLayout: Reading localStorage auth:`, auth);
      console.log(`[${new Date().toISOString()}] DashboardLayout: Reading localStorage token:`, token ? token.slice(0, 20) + '...' : 'No token');

      if (!auth || !token) {
        console.warn(`[${new Date().toISOString()}] DashboardLayout: No auth or token, redirecting to /login`);
        setAuthState(null);
        setIsLoading(false);
        navigate('/login', { replace: true });
        return;
      }

      try {
        const authData: AuthState = JSON.parse(auth);
        console.log(`[${new Date().toISOString()}] DashboardLayout: Parsed authData:`, authData);

        // Verify token with /api/me
        const response = await fetch('http://localhost:8000/api/me', {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          console.error(`[${new Date().toISOString()}] DashboardLayout: /api/me failed:`, await response.text());
          localStorage.removeItem('auth');
          localStorage.removeItem('token');
          setAuthState(null);
          setIsLoading(false);
          toast.error('Session expired. Please log in again.');
          navigate('/login', { replace: true });
          return;
        }

        const data = await response.json();
        console.log(`[${new Date().toISOString()}] DashboardLayout: /api/me response:`, data);

        if (data.role !== authData.role || data.id !== authData.userId) {
          console.warn(`[${new Date().toISOString()}] DashboardLayout: Server auth mismatch`);
          localStorage.removeItem('auth');
          localStorage.removeItem('token');
          setAuthState(null);
          setIsLoading(false);
          toast.error('Invalid session. Please log in again.');
          navigate('/login', { replace: true });
          return;
        }

        setAuthState(authData);
        console.log(`[${new Date().toISOString()}] DashboardLayout: Auth valid, role=${authData.role}`);
      } catch (error) {
        console.error(`[${new Date().toISOString()}] DashboardLayout: Failed to validate auth:`, error);
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        setAuthState(null);
        toast.error('Authentication error. Please log in again.');
        navigate('/login', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    validateAuth();
  }, [navigate]);

  const handleLogout = async () => {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Logging out`);
    try {
      const token = localStorage.getItem('token');
      await fetch('http://localhost:8000/api/logout', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
    } catch (error) {
      console.error(`[${new Date().toISOString()}] DashboardLayout: Logout error:`, error);
    }
    localStorage.removeItem('auth');
    localStorage.removeItem('token');
    setAuthState(null);
    toast.success('Logged out successfully');
    navigate('/login', { replace: true });
  };

  if (isLoading) {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Still loading auth state`);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authState) {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Not rendering due to missing auth`);
    return null;
  }

  console.log(`[${new Date().toISOString()}] DashboardLayout: Rendering with role=${authState.role}`);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <TopNav role={authState.role} onLogout={handleLogout} />
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};