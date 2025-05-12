import React, { useEffect, useState } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/auth/LoginForm';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { Dashboard as TeacherDashboard } from './pages/teacher/Dashboard';
import { MarksEntry } from './pages/teacher/MarksEntry';
import { SATMarks } from './pages/teacher/SATMarks';
import { InternalMarks } from './pages/teacher/InternalMarks';
import { StudentDashboard as StudentDashboard } from './pages/student/Dashboard';
import { Results } from './pages/student/Results';
import { CGPACalculator } from './pages/student/CGPACalculator';
import { Performance } from './pages/student/Performance';
import { Teachers } from './pages/admin/Teachers';
import { Students } from './pages/admin/Students';
import { DepartmentsAndSubjects } from './pages/admin/DepartmentsAndSubjects';
import { Analytics } from './pages/admin/Analytics';
import { SATScore } from './pages/admin/SATScore';
import { Announcements as AdminAnnouncements } from './pages/admin/Announcements';
import { Announcements as StudentAnnouncements } from './pages/student/Announcements';
import { UserRole } from './types/auth';
import { jwtDecode } from 'jwt-decode'; // ✅ Correct way for v4+

interface TokenPayload {
  role: UserRole;
  id: string;
}

interface AuthState {
  userId: string;
  role: UserRole;
  fullName: string;
}

const ProtectedRoute: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const validateAuth = async () => {
      console.log(`[${new Date().toISOString()}] ProtectedRoute: Validating auth`);
      const authData = localStorage.getItem('auth');
      const token = localStorage.getItem('token');
      console.log(`[${new Date().toISOString()}] ProtectedRoute: Auth data:`, authData);
      console.log(`[${new Date().toISOString()}] ProtectedRoute: Token:`, token ? token.slice(0, 20) + '...' : 'No token');

      if (!authData || !token) {
        console.warn(`[${new Date().toISOString()}] ProtectedRoute: No auth data or token`);
        setAuth(null);
        setLoading(false);
        return;
      }

      try {
        const parsedAuth: AuthState = JSON.parse(authData);
        const decoded: TokenPayload = jwtDecode(token);
        console.log(`[${new Date().toISOString()}] ProtectedRoute: Decoded JWT:`, JSON.stringify(decoded, null, 2));

        if (decoded.role !== parsedAuth.role || decoded.id !== parsedAuth.userId) {
          console.warn(`[${new Date().toISOString()}] ProtectedRoute: Token mismatch`);
          localStorage.removeItem('auth');
          localStorage.removeItem('token');
          setAuth(null);
          setLoading(false);
          return;
        }

        // Verify token with /api/me
        const response = await fetch('http://localhost:8000/api/me', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          credentials: 'include',
        });

        if (!response.ok) {
          console.error(`[${new Date().toISOString()}] ProtectedRoute: /api/me failed:`, await response.text());
          localStorage.removeItem('auth');
          localStorage.removeItem('token');
          setAuth(null);
          setLoading(false);
          return;
        }

        const data = await response.json();
        console.log(`[${new Date().toISOString()}] ProtectedRoute: /api/me response:`, JSON.stringify(data, null, 2));

        if (data.role !== parsedAuth.role || data.id !== parsedAuth.userId) {
          console.warn(`[${new Date().toISOString()}] ProtectedRoute: Server auth mismatch`);
          localStorage.removeItem('auth');
          localStorage.removeItem('token');
          setAuth(null);
        } else {
          setAuth(parsedAuth);
        }
      } catch (error) {
        console.error(`[${new Date().toISOString()}] ProtectedRoute: Auth validation error:`, error);
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        setAuth(null);
      } finally {
        setLoading(false);
      }
    };

    validateAuth();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!auth || !allowedRoles.includes(auth.role)) {
    console.warn(`[${new Date().toISOString()}] ProtectedRoute: Access denied, redirecting to /login`);
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginForm />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
        <DashboardLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
            <Navigate to="/dashboard/home" replace />
          </ProtectedRoute>
        ),
      },
      {
        path: 'home',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: '/dashboard/home',
            element: (
              <ProtectedRoute allowedRoles={['teacher']}>
                <TeacherDashboard />
              </ProtectedRoute>
            ),
          },
          {
            path: '/dashboard/home',
            element: (
              <ProtectedRoute allowedRoles={['student']}>
                <StudentDashboard />
              </ProtectedRoute>
            ),
          },
        ],
      },
      {
        path: 'marks-entry',
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <MarksEntry />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sat-marks',
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <SATMarks />
          </ProtectedRoute>
        ),
      },
      {
        path: 'internal-marks',
        element: (
          <ProtectedRoute allowedRoles={['teacher']}>
            <InternalMarks />
          </ProtectedRoute>
        ),
      },
      {
        path: 'results',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <Results />
          </ProtectedRoute>
        ),
      },
      {
        path: 'cgpa-calculator',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <CGPACalculator />
          </ProtectedRoute>
        ),
      },
      {
        path: 'performance',
        element: (
          <ProtectedRoute allowedRoles={['student']}>
            <Performance />
          </ProtectedRoute>
        ),
      },
      {
        path: 'teachers',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Teachers />
          </ProtectedRoute>
        ),
      },
      {
        path: 'students',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Students />
          </ProtectedRoute>
        ),
      },
      {
        path: 'departments-subjects',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <DepartmentsAndSubjects />
          </ProtectedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <Analytics />
          </ProtectedRoute>
        ),
      },
      {
        path: 'sat-score',
        element: (
          <ProtectedRoute allowedRoles={['admin']}>
            <SATScore />
          </ProtectedRoute>
        ),
      },
      {
        path: 'announcements',
        element: (
          <ProtectedRoute allowedRoles={['admin', 'student']}>
            <Outlet />
          </ProtectedRoute>
        ),
        children: [
          {
            index: true,
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnnouncements />
              </ProtectedRoute>
            ),
          },
          {
            path: '/dashboard/announcements',
            element: (
              <ProtectedRoute allowedRoles={['student']}>
                <StudentAnnouncements />
              </ProtectedRoute>
            ),
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/login" replace />,
  },
]);

const App: React.FC = () => {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '8px',
            padding: '12px',
          },
        }}
      />
    </>
  );
};

export default App;