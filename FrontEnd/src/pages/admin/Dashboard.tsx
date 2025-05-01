import React, { useState } from 'react';
import { Users, GraduationCap, BookOpen, Building2 } from 'lucide-react';
import { AddTeacherModal } from '../../components/modals/AddTeacherModal';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

const stats = [
  { title: 'Total Teachers', value: '45', icon: Users, color: 'bg-blue-500' },
  { title: 'Total Students', value: '850', icon: GraduationCap, color: 'bg-green-500' },
  { title: 'Subjects', value: '24', icon: BookOpen, color: 'bg-purple-500' },
  { title: 'Departments', value: '6', icon: Building2, color: 'bg-orange-500' },
];

interface QuickAction {
  title: string;
  icon: React.ElementType;
  color: string;
  action: () => void;
}

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);

  const handleAddTeacher = (teacherData: any) => {
    console.log('New teacher data:', teacherData);
    setIsTeacherModalOpen(false);
    toast.success('Teacher added successfully!');
    navigate('/teachers');
  };

  const handleAddStudent = (studentData: any) => {
    console.log('New student data:', studentData);
    setIsStudentModalOpen(false);
    toast.success('Student added successfully!');
    navigate('/students');
  };

  const quickActions = [
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back! Here's an overview of your system.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Activities</h2>
          <div className="space-y-4">
            {/* Activity items will go here */}
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
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-xl text-left hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
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