import React, { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
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
  const location = useLocation();
  const [authState, setAuthState] = useState<AuthState | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isMounted = useRef(true);

  const refreshToken = async () => {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Attempting token refresh at ${location.pathname}`);
    try {
      const response = await fetch('http://localhost:8000/api/refresh', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${new Date().toISOString()}] DashboardLayout: Refresh failed with status ${response.status}: ${errorText}`);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      const data = await response.json();
      localStorage.setItem('token', data.access_token);
      console.log(`[${new Date().toISOString()}] DashboardLayout: Token refreshed successfully`);
      return data.access_token;
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] DashboardLayout: Refresh token error: ${error.message}`);
      throw error;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    console.log(`[${new Date().toISOString()}] DashboardLayout: Mounting at ${location.pathname}`);

    const validateAuth = async () => {
      console.log(`[${new Date().toISOString()}] DashboardLayout: Validating auth at ${location.pathname}`);
      const auth = localStorage.getItem('auth');
      const token = localStorage.getItem('token');
      console.log(`[${new Date().toISOString()}] DashboardLayout: Reading localStorage auth: ${auth}`);
      console.log(`[${new Date().toISOString()}] DashboardLayout: Reading localStorage token: ${token ? token.slice(0, 20) + '...' : 'No token'}`);

      if (!auth || !token) {
        console.warn(`[${new Date().toISOString()}] DashboardLayout: No auth or token, redirecting to /login from ${location.pathname}`);
        if (isMounted.current) {
          setAuthState(null);
          setIsLoading(false);
          navigate('/login', { replace: true });
        }
        return;
      }

      try {
        const authData: AuthState = JSON.parse(auth);
        console.log(`[${new Date().toISOString()}] DashboardLayout: Parsed authData:`, authData);

        const attemptFetch = async (useNewToken = false) => {
          const currentToken = useNewToken ? localStorage.getItem('token') : token;
          console.log(`[${new Date().toISOString()}] DashboardLayout: Fetching /api/me with ${useNewToken ? 'new' : 'existing'} token`);
          const response = await fetch('http://localhost:8000/api/me', {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${currentToken}`,
              'Content-Type': 'application/json',
            },
            credentials: 'include',
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error(`[${new Date().toISOString()}] DashboardLayout: /api/me failed with status ${response.status}: ${errorText}`);
            throw new Error(`HTTP ${response.status}: ${errorText}`);
          }

          const data = await response.json();
          console.log(`[${new Date().toISOString()}] DashboardLayout: /api/me response:`, data);

          if (data.role !== authData.role || data.id !== authData.userId) {
            console.warn(`[${new Date().toISOString()}] DashboardLayout: Server auth mismatch. Expected role=${authData.role}, id=${authData.userId}, got role=${data.role}, id=${data.id}`);
            throw new Error('Server auth mismatch');
          }

          return data;
        };

        try {
          await attemptFetch();
          if (isMounted.current) {
            setAuthState(authData);
            console.log(`[${new Date().toISOString()}] DashboardLayout: Auth valid, role=${authData.role}`);
          }
        } catch (error: any) {
          if (error.message.includes('HTTP 401') && isMounted.current) {
            console.warn(`[${new Date().toISOString()}] DashboardLayout: 401 Unauthorized, attempting token refresh`);
            const newToken = await refreshToken();
            await attemptFetch(true);
            if (isMounted.current) {
              setAuthState(authData);
              console.log(`[${new Date().toISOString()}] DashboardLayout: Auth valid after refresh, role=${authData.role}`);
            }
          } else {
            throw error;
          }
        }
      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] DashboardLayout: Failed to validate auth: ${error.message}`);
        if (isMounted.current) {
          localStorage.removeItem('auth');
          localStorage.removeItem('token');
          setAuthState(null);
          toast.error('Session expired. Please log in again.');
          navigate('/login', { replace: true });
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    validateAuth();
    return () => {
      isMounted.current = false;
      console.log(`[${new Date().toISOString()}] DashboardLayout: Cleaning up useEffect at ${location.pathname}`);
    };
  }, [navigate, location.pathname]);

  const handleLogout = async () => {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Logging out from ${location.pathname}`);
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
    console.log(`[${new Date().toISOString()}] DashboardLayout: Still loading auth state at ${location.pathname}`);
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!authState) {
    console.log(`[${new Date().toISOString()}] DashboardLayout: Not rendering due to missing auth at ${location.pathname}`);
    return null;
  }

  console.log(`[${new Date().toISOString()}] DashboardLayout: Rendering with role=${authState.role} at ${location.pathname}`);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <TopNav role={authState.role} onLogout={handleLogout} />
      <main className="container mx-auto p-4">
        <Outlet />
      </main>
    </div>
  );
};