import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Book,
  Building2,
  UserPlus,
  LogOut,
  FileText,
  Calculator,
  Award,
  BookOpenCheck,
  LineChart,
  Bell,
  ClipboardCheck,
} from 'lucide-react';
import { UserRole } from '../../types/auth';

interface SidebarProps {
  role: UserRole;
  onLogout: () => void;
}

const adminLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/teachers', icon: Users, label: 'Teachers' },
  { to: '/students', icon: GraduationCap, label: 'Students' },
  { to: '/departments-and-subjects', icon: Book, label: 'Departments & Subjects' },
  { to: '/sat-score', icon: Calculator, label: 'SAT Score' },
  { to: '/analytics', icon: LineChart, label: 'Analytics' },
];

const teacherLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/marks-entry', icon: BookOpenCheck, label: 'Internal Marks' },
  { to: '/sat-marks', icon: ClipboardCheck, label: 'SAT Marks' },
];

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/results', icon: FileText, label: 'Semester Results' },
  { to: '/cgpa', icon: Calculator, label: 'CGPA Calculator' },
  { to: '/performance', icon: LineChart, label: 'Performance Analytics' },
  { to: '/announcements', icon: Bell, label: 'Announcements' },
];

export const Sidebar: React.FC<SidebarProps> = ({ role, onLogout }) => {
  const links = role === 'admin' 
    ? adminLinks 
    : role === 'teacher' 
    ? teacherLinks 
    : studentLinks;

  return (
    <div className="h-screen w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col">
      <div className="p-6">
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">SAT Results</h2>
      </div>

      <nav className="flex-1 px-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              `flex items-center px-4 py-3 text-gray-700 dark:text-gray-300 rounded-lg transition-all
              ${isActive 
                ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}`
            }
          >
            <link.icon className="w-5 h-5 mr-3" />
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={onLogout}
          className="flex items-center w-full px-4 py-3 text-gray-700 dark:text-gray-300 
            hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-all"
        >
          <LogOut className="w-5 h-5 mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};