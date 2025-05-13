import React, { useState, useEffect, useRef } from 'react';
import { BookOpen, GraduationCap, ClipboardCheck, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

interface Schedule {
  day: string;
  time: string;
  room: string;
}

interface AssignedClass {
  id: string;
  name: string;
  subject: string;
  subject_id: string;
  department: string;
  semester: number;
  students: number;
  batch: string;
  section: string;
  schedule: Schedule[];
}

interface PendingTask {
  task_type: string;
  class_name: string;
  subject: string;
  due_date: string;
}

interface Stat {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface DashboardData {
  classes: AssignedClass[];
  stats: Stat[];
  pending_tasks: PendingTask[];
}

interface AuthState {
  userId: string;
  role: string;
  fullName: string;
}

const iconMap: { [key: string]: React.ComponentType<{ className: string }> } = {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardCheck,
};

export const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    classes: [],
    stats: [],
    pending_tasks: [],
  });
  const [auth, setAuth] = useState<AuthState | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const isMounted = useRef(true);

  const checkAuthAndFetchData = async () => {
    console.log(`[${new Date().toISOString()}] Dashboard.tsx: Checking auth state`);
    const authData = localStorage.getItem('auth');
    const token = localStorage.getItem('token');
    console.log(`[${new Date().toISOString()}] Dashboard.tsx: Local storage auth:`, authData);
    console.log(`[${new Date().toISOString()}] Dashboard.tsx: Token:`, token ? token.slice(0, 20) + '...' : 'No token');

    if (!authData || !token) {
      console.warn(`[${new Date().toISOString()}] Dashboard.tsx: No auth data or token, redirecting to login`);
      toast.error('Please log in to access the dashboard');
      navigate('/login', { replace: true });
      return;
    }

    const parsedAuth: AuthState = JSON.parse(authData);
    setAuth(parsedAuth);

    // Verify JWT with /api/me
    try {
      console.log(`[${new Date().toISOString()}] Dashboard.tsx: Fetching /api/me`);
      const checkResponse = await fetch('http://localhost:8000/api/me', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!checkResponse.ok) {
        const errorData = await checkResponse.json();
        console.error(`[${new Date().toISOString()}] Dashboard.tsx: /api/me error:`, JSON.stringify(errorData, null, 2));
        throw new Error(errorData.detail || 'Invalid token');
      }

      const checkData = await checkResponse.json();
      console.log(`[${new Date().toISOString()}] Dashboard.tsx: /api/me response:`, JSON.stringify(checkData, null, 2));

      if (checkData.role !== parsedAuth.role || checkData.id !== parsedAuth.userId) {
        console.warn(`[${new Date().toISOString()}] Dashboard.tsx: Token mismatch, redirecting to login`);
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        toast.error('Session invalid. Please log in again.');
        navigate('/login', { replace: true });
        return;
      }

      console.log(`[${new Date().toISOString()}] Dashboard.tsx: Token validated for userId: ${checkData.id}`);
    } catch (checkError: any) {
      console.error(`[${new Date().toISOString()}] Dashboard.tsx: /api/me error:`, JSON.stringify(checkError.message, null, 2));
      localStorage.removeItem('auth');
      localStorage.removeItem('token');
      toast.error('Failed to verify session. Please log in again.');
      navigate('/login', { replace: true });
      return;
    }

    // Fetch dashboard data
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      const endpoint = `${apiUrl}/api/teacher/dashboard`;
      console.log(`[${new Date().toISOString()}] Dashboard.tsx: Sending request to ${endpoint}`);
      const response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${new Date().toISOString()}] Dashboard.tsx: Fetch error:`, JSON.stringify(errorData, null, 2));
        throw new Error(`Status: ${response.status}, Detail: ${errorData.detail || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Dashboard.tsx: Response received:`, JSON.stringify(data, null, 2));

      if (isMounted.current) {
        setDashboardData(data);
        setError(null);
      }
    } catch (fetchError: any) {
      console.error(`[${new Date().toISOString()}] Dashboard.tsx: Fetch error:`, {
        message: fetchError.message,
        status: fetchError.response?.status,
        detail: fetchError.response?.data?.detail,
      });
      const errorMessage = fetchError.message.includes('404')
        ? 'Dashboard data not available. Please try again later.'
        : 'Failed to load dashboard data. Please try again.';
      if (isMounted.current) {
        setError(errorMessage);
        toast.error(errorMessage);
        // Do NOT clear localStorage or redirect to /login
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    isMounted.current = true;
    checkAuthAndFetchData();

    return () => {
      isMounted.current = false;
      console.log(`[${new Date().toISOString()}] Dashboard.tsx: Cleaning up useEffect`);
    };
  }, [navigate]);

  const handleLogout = () => {
    console.log(`[${new Date().toISOString()}] Dashboard.tsx: handleLogout called`);
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/api/logout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    })
      .then(() => {
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        toast.success('Logged out successfully');
        navigate('/login', { replace: true });
      })
      .catch((error) => {
        console.error(`[${new Date().toISOString()}] Dashboard.tsx: Logout error:`, error);
        localStorage.removeItem('auth');
        localStorage.removeItem('token');
        toast.error('Failed to log out');
        navigate('/login', { replace: true });
      });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 dark:text-red-400 p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Teacher Dashboard</h1>
        <p>{error}</p>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
          If this error persists, check if the teacher data exists in the database or contact support.
        </p>
        <div className="mt-4 space-x-4">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            onClick={() => {
              console.log(`[${new Date().toISOString()}] Dashboard.tsx: Retry fetching dashboard data`);
              setLoading(true);
              setError(null);
              checkAuthAndFetchData();
            }}
          >
            Retry
          </button>
          <button
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            onClick={() => {
              console.log(`[${new Date().toISOString()}] Dashboard.tsx: Manual redirect to login`);
              handleLogout();
            }}
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Welcome back, {auth?.fullName || 'Teacher'}! Here's an overview of your classes.
          </p>
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
        >
          Logout
        </button>
      </div>

      {dashboardData.stats.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {dashboardData.stats.map((stat) => {
            const Icon = iconMap[stat.icon];
            return (
              <div
                key={stat.title}
                className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="flex items-center space-x-4">
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg text-center text-gray-600 dark:text-gray-400">
          No statistics available
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Assigned Classes</h2>
          {dashboardData.classes.length > 0 ? (
            <div className="space-y-4">
              {dashboardData.classes.map((cls) => (
                <div
                  key={cls.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{cls.subject}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {cls.name} - {cls.department}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200 rounded-lg">
                        Batch {cls.batch}
                      </span>
                      <span className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200 rounded-lg">
                        Section {cls.section}
                      </span>
                    </div>
                  </div>
                  <div className="mt-3 space-y-2">
                    {cls.schedule.length > 0 ? (
                      cls.schedule.map((sch, idx) => (
                        <div key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-medium mr-2">{sch.day}:</span>
                          <span>{sch.time}</span>
                          <span className="mx-2">•</span>
                          <span>Room {sch.room}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-gray-500 dark:text-gray-400">Schedule not available</p>
                    )}
                  </div>
                  <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                    <Users className="w-4 h-4 mr-1" />
                    {cls.students} students
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 dark:text-gray-400">No classes assigned</p>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pending Tasks</h2>
            {dashboardData.pending_tasks.length > 0 ? (
              <div className="space-y-3">
                {dashboardData.pending_tasks.map((task, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center justify-between p-3 rounded-lg ${
                      task.due_date === new Date().toISOString().split('T')[0]
                        ? 'bg-red-50 dark:bg-red-900/20'
                        : 'bg-yellow-50 dark:bg-yellow-900/20'
                    }`}
                  >
                    <div className="flex items-center">
                      <ClipboardCheck
                        className={`w-5 h-5 ${
                          task.due_date === new Date().toISOString().split('T')[0]
                            ? 'text-red-500 dark:text-red-400'
                            : 'text-yellow-500 dark:text-yellow-400'
                        } mr-3`}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{task.task_type}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {task.class_name} - {task.subject}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-sm ${
                        task.due_date === new Date().toISOString().split('T')[0]
                          ? 'text-red-600 dark:text-red-400'
                          : 'text-yellow-600 dark:text-yellow-400'
                      }`}
                    >
                      {task.due_date === new Date().toISOString().split('T')[0]
                        ? 'Due Today'
                        : `Due in ${Math.ceil(
                            (new Date(task.due_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
                          )} days`}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600 dark:text-gray-400">No pending tasks</p>
            )}
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 gap-4">
              <button
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                onClick={() => navigate('/dashboard/marks-entry')}
              >
                <ClipboardCheck className="w-6 h-6 text-blue-500 mb-2" />
                <p className="font-medium text-gray-900 dark:text-white">Enter Marks</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};