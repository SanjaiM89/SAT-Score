import React, { useState, useEffect } from 'react';
import { Users, GraduationCap, BookOpen, Building2, LogOut } from 'lucide-react';
import { AddTeacherModal } from '../../components/modals/AddTeacherModal';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

interface Stat {
  title: string;
  value: string;
  icon: React.ElementType;
  color: string;
}

interface QuickAction {
  title: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export const Dashboard = () => {
  const navigate = useNavigate();
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [stats, setStats] = useState<Stat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshAccessToken = async () => {
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      console.log(`[${new Date().toISOString()}] Attempting to refresh token at: ${apiUrl}/api/refresh`);
      const response = await fetch(`${apiUrl}/api/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      console.log(`[${new Date().toISOString()}] Refresh response: ${response.status} ${response.statusText}`);
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${new Date().toISOString()}] Refresh error details:`, errorText);
        throw new Error(`Failed to refresh token: ${response.status} ${errorText}`);
      }
      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Token refreshed:`, data);
      const auth = JSON.parse(localStorage.getItem('auth') || '{}');
      localStorage.setItem('auth', JSON.stringify({
        ...auth,
        access_token: data.access_token,
      }));
      return data.access_token;
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Refresh token error:`, error.message);
      toast.error('Session expired. Please log in again.');
      localStorage.removeItem('auth');
      navigate('/login', { replace: true });
      return null;
    }
  };

  const makeAuthenticatedRequest = async (url: string, options: RequestInit) => {
    console.log(`[${new Date().toISOString()}] Making authenticated request to: ${url}`);
    const auth = JSON.parse(localStorage.getItem('auth') || '{}');
    let response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        Authorization: `Bearer ${auth.access_token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      credentials: 'include',
    });

    if (response.status === 401) {
      console.log(`[${new Date().toISOString()}] Received 401, attempting to refresh token`);
      const newToken = await refreshAccessToken();
      if (newToken) {
        console.log(`[${new Date().toISOString()}] Retrying request with new token`);
        response = await fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            Authorization: `Bearer ${newToken}`,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
        });
      } else {
        console.log(`[${new Date().toISOString()}] No new token, redirecting to login`);
        throw new Error('Session expired');
      }
    }
    return response;
  };

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null); // Reset error state
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      console.log(`[${new Date().toISOString()}] Fetching stats from: ${apiUrl}/api/admin/stats`);
      const response = await makeAuthenticatedRequest(`${apiUrl}/api/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`[${new Date().toISOString()}] Fetch stats error: ${response.status} ${JSON.stringify(errorData)}`);
        throw new Error(`Failed to fetch stats: ${response.status} ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      console.log(`[${new Date().toISOString()}] Stats data:`, data);

      const updatedStats: Stat[] = [
        { title: 'Total Teachers', value: data.totalTeachers || '0', icon: Users, color: 'bg-blue-500' },
        { title: 'Total Students', value: data.totalStudents || '0', icon: GraduationCap, color: 'bg-green-500' },
        { title: 'Subjects', value: data.subjects || '0', icon: BookOpen, color: 'bg-purple-500' },
        { title: 'Departments', value: data.departments || '0', icon: Building2, color: 'bg-orange-500' },
      ];
      setStats(updatedStats);
    } catch (err: any) {
      console.error(`[${new Date().toISOString()}] Fetch stats error:`, err.message);
      setError(`Failed to load dashboard stats: ${err.message}`);
      toast.error(`Failed to load dashboard stats: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log(`[${new Date().toISOString()}] Dashboard mounted, fetching stats`);
    fetchStats();
    return () => {
      console.log(`[${new Date().toISOString()}] Dashboard unmounted`);
    };
  }, []); // Empty dependency array ensures fetchStats runs only once on mount

  const handleLogout = async () => {
    try {
      const apiUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
      console.log(`[${new Date().toISOString()}] Logging out at: ${apiUrl}/api/logout`);
      const response = await fetch(`${apiUrl}/api/logout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        credentials: 'include',
      });
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[${new Date().toISOString()}] Logout error:`, errorText);
        throw new Error('Failed to logout');
      }
      localStorage.removeItem('auth');
      toast.success('Logged out successfully');
      navigate('/login', { replace: true });
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] Logout error:`, error.message);
      toast.error('Failed to logout');
    }
  };

  const handleAddTeacher = (teacherData: any) => {
    console.log(`[${new Date().toISOString()}] New teacher data:`, teacherData);
    setIsTeacherModalOpen(false);
    toast.success('Teacher added successfully!');
    navigate('/teachers');
  };

  const handleAddStudent = (studentData: any) => {
    console.log(`[${new Date().toISOString()}] New student data:`, studentData);
    setIsStudentModalOpen(false);
    toast.success('Student added successfully!');
    navigate('/students');
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Add Teacher',
      icon: Users,
      color: 'text-blue-500',
      action: () => setIsTeacherModalOpen(true),
    },
    {
      title: 'Add Student',
      icon: GraduationCap,
      color: 'text-green-500',
      action: () => setIsStudentModalOpen(true),
    },
    {
      title: 'Add Subject',
      icon: BookOpen,
      color: 'text-purple-500',
      action: () => navigate('/departments-and-subjects'),
    },
    {
      title: 'Add Department',
      icon: Building2,
      color: 'text-orange-500',
      action: () => navigate('/departments-and-subjects'),
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back! Here's an overview of your system.</p>
        </div>
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 bg-red-600 text-white py-2 px-4 rounded-lg font-medium hover:bg-red-700"
        >
          <LogOut size={20} />
          Logout
        </button>
      </div>

      {loading ? (
        <div className="text-center text-gray-600 dark:text-gray-400">Loading stats...</div>
      ) : error ? (
        <div className="text-center text-red-500">
          {error}
          <button
            onClick={fetchStats}
            className="ml-4 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Retry
          </button>
        </div>
      ) : stats.length === 0 ? (
        <div className="text-center text-gray-600 dark:text-gray-400">No stats available</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat) => (
            <div
              key={stat.title}
              className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl"
            >
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-xl ${stat.color}`}>
                  <stat.icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h2>
          <div className="space-y-4">
            <p className="text-gray-600 dark:text-gray-400">No recent activities</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-4">
            {quickActions.map((action) => (
              <button
                key={action.title}
                onClick={action.action}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-600"
              >
                <action.icon className={`w-6 h-6 ${action.color} mb-2`} />
                <p className="font-medium text-gray-900 dark:text-white">{action.title}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      <AddTeacherModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        onSubmit={handleAddTeacher}
      />

      <AddStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSubmit={handleAddStudent}
      />
    </div>
  );
};