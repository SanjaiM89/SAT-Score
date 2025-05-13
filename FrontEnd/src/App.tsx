import React from 'react';
import { createBrowserRouter, RouterProvider, Navigate, Outlet } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { LoginForm } from './components/auth/LoginForm';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Dashboard as AdminDashboard } from './pages/admin/Dashboard';
import { Dashboard as TeacherDashboard } from './pages/teacher/Dashboard';
import { MarksEntry } from './pages/teacher/MarksEntry';
import { SATMarks } from './pages/teacher/SATMarks';
import { InternalMarks } from './pages/teacher/InternalMarks';
import { StudentDashboard } from './pages/student/Dashboard';
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

interface AuthState {
  userId: string;
  role: UserRole;
  fullName: string;
  sessionId: string;
}

const ProtectedRoute: React.FC<{
  allowedRoles: UserRole[];
  children: React.ReactNode;
}> = ({ allowedRoles, children }) => {
  console.log(`[${new Date().toISOString()}] ProtectedRoute: Checking auth`);
  const authData = localStorage.getItem('auth');
  const token = localStorage.getItem('token');
  console.log(`[${new Date().toISOString()}] ProtectedRoute: Auth data:`, authData);
  console.log(`[${new Date().toISOString()}] ProtectedRoute: Token:`, token ? token.slice(0, 20) + '...' : 'No token');
  console.log(`[${new Date().toISOString()}] ProtectedRoute: Allowed roles:`, allowedRoles);

  if (!authData || !token) {
    console.warn(`[${new Date().toISOString()}] ProtectedRoute: No auth data or token, redirecting to /login`);
    return <Navigate to="/login" replace />;
  }

  try {
    const auth: AuthState = JSON.parse(authData);
    console.log(`[${new Date().toISOString()}] ProtectedRoute: Current role:`, auth.role);
    if (!allowedRoles.includes(auth.role)) {
      console.warn(`[${new Date().toISOString()}] ProtectedRoute: Role ${auth.role} not allowed, redirecting to /login`);
      return <Navigate to="/login" replace />;
    }
    return <>{children}</>;
  } catch (error) {
    console.error(`[${new Date().toISOString()}] ProtectedRoute: Failed to parse auth data:`, error);
    return <Navigate to="/login" replace />;
  }
};

const DashboardHome: React.FC = () => {
  const auth = JSON.parse(localStorage.getItem('auth') || '{}') as AuthState;
  console.log(`[${new Date().toISOString()}] DashboardHome: Rendering for role=${auth.role}`);
  switch (auth.role) {
    case 'admin':
      return <AdminDashboard />;
    case 'teacher':
      return <TeacherDashboard />;
    case 'student':
      return <StudentDashboard />;
    default:
      console.warn(`[${new Date().toISOString()}] DashboardHome: Invalid role, redirecting to /login`);
      return <Navigate to="/login" replace />;
  }
};

const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h1 className="text-4xl font-bold">404 - Page Not Found</h1>
      <p className="mt-4">The page you're looking for doesn't exist.</p>
      <a href="/dashboard" className="mt-6 text-blue-500 hover:underline">
        Go to Dashboard
      </a>
    </div>
  );
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
        element: <Navigate to="/dashboard/home" replace />,
      },
      {
        path: 'home',
        element: <DashboardHome />,
      },
      {
        path: 'marks-entry',
        element: <MarksEntry />,
      },
      {
        path: 'sat-marks',
        element: <SATMarks />,
      },
      {
        path: 'internal-marks',
        element: <InternalMarks />,
      },
      {
        path: 'results',
        element: <Results />,
      },
      {
        path: 'cgpa-calculator',
        element: <CGPACalculator />,
      },
      {
        path: 'performance',
        element: <Performance />,
      },
      {
        path: 'teachers',
        element: <Teachers />,
      },
      {
        path: 'students',
        element: <Students />,
      },
      {
        path: 'departments-subjects',
        element: <DepartmentsAndSubjects />,
      },
      {
        path: 'analytics',
        element: <Analytics />,
      },
      {
        path: 'sat-score',
        element: <SATScore />,
      },
      {
        path: 'announcements',
        element: <Outlet />,
        children: [
          {
            path: 'admin',
            element: (
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminAnnouncements />
              </ProtectedRoute>
            ),
          },
          {
            path: '',
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
    path: '/marks-entry',
    element: <Navigate to="/dashboard/marks-entry" replace />,
  },
  {
    path: '/sat-marks',
    element: <Navigate to="/dashboard/sat-marks" replace />,
  },
  {
    path: '*',
    element: <NotFound />,
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