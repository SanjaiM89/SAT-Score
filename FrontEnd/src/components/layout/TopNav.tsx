import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  Book,
  Calculator,
  LineChart,
  LogOut,
  Menu,
  X,
  Bell,
  BookOpenCheck,
  FileText,
  Award,
} from 'lucide-react';
import { UserRole } from '../../types/auth';

interface TopNavProps {
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
  { to: '/marks-entry', icon: Book, label: 'Internal Marks' },
  { to: '/sat-marks', icon: Calculator, label: 'SAT Marks' },
];

const studentLinks = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/results', icon: FileText, label: 'Results' },
  { to: '/cgpa', icon: Calculator, label: 'CGPA' },
  { to: '/performance', icon: LineChart, label: 'Performance' },
  { to: '/announcements', icon: Bell, label: 'Announcements' },
];

export const TopNav: React.FC<TopNavProps> = ({ role, onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const links = role === 'admin' ? adminLinks : role === 'teacher' ? teacherLinks : studentLinks;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">SAT Results</h2>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                <link.icon className="w-5 h-5 mr-2" />
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={onLogout}
              className="flex items-center px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 
                dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-gray-600 hover:text-gray-900 dark:text-gray-300 dark:hover:text-white"
            >
              {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="container mx-auto px-4 py-2 space-y-1">
            {links.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors
                  ${isActive
                    ? 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50'
                  }`
                }
              >
                <link.icon className="w-5 h-5 mr-2" />
                {link.label}
              </NavLink>
            ))}
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onLogout();
              }}
              className="flex items-center w-full px-3 py-2 rounded-lg text-sm font-medium text-gray-600 
                hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700/50 transition-colors"
            >
              <LogOut className="w-5 h-5 mr-2" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
};