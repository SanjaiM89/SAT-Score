import React, { useState, useEffect } from 'react';
import { BookOpen, GraduationCap, ClipboardCheck, Users } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await axios.get('http://localhost:8000/api/teacher/dashboard', {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
        });
        console.log('Dashboard response:', JSON.stringify(response.data, null, 2));
        setDashboardData(response.data);
      } catch (error: any) {
        console.error('Fetch dashboard error:', error);
        toast.error(error.response?.data?.detail || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back! Here's an overview of your classes.</p>
      </div>

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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Assigned Classes</h2>
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
                  {cls.schedule.map((sch, idx) => (
                    <div key={idx} className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <span className="font-medium mr-2">{sch.day}:</span>
                      <span>{sch.time}</span>
                      <span className="mx-2">•</span>
                      <span>Room {sch.room}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <Users className="w-4 h-4 mr-1" />
                  {cls.students} students
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Pending Tasks</h2>
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
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Links</h2>
            <div className="grid grid-cols-1 gap-4">
              <button className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
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