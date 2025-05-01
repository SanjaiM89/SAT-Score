import React, { useState } from 'react';
import { UserRole } from '../../types/auth';
import { Eye, EyeOff, LogIn } from 'lucide-react';

interface LoginFormProps {
  onSubmit: (email: string, password: string, role: UserRole) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onSubmit }) => {
  const [role, setRole] = useState<UserRole>('student');
  const [teacherName, setTeacherName] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [studentId, setStudentId] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (role === 'admin' && email === 'admin@gmail.com' && password === '123456') {
      onSubmit(email, password, role);
    } else if (role === 'teacher') {
      onSubmit(teacherId, password, role);
    } else if (role === 'student') {
      onSubmit(studentId, password, role);
    }
  };

  const renderInputFields = () => {
    switch (role) {
      case 'admin':
        return (
          <>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                  focus:outline-none focus:border-indigo-500 bg-transparent transition-all
                  placeholder-transparent"
                placeholder="Email"
                required
              />
              <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-600 
                dark:text-gray-300 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                peer-focus:-top-2.5 peer-focus:text-sm">
                Admin Email
              </label>
            </div>
          </>
        );
      case 'teacher':
        return (
          <>
            <div className="relative">
              <input
                type="text"
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                  focus:outline-none focus:border-indigo-500 bg-transparent transition-all
                  placeholder-transparent"
                placeholder="Teacher Name"
                required
              />
              <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-600 
                dark:text-gray-300 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                peer-focus:-top-2.5 peer-focus:text-sm">
                Teacher Name
              </label>
            </div>
            <div className="relative">
              <input
                type="text"
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                pattern="2025T[0-9]{4}"
                className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                  focus:outline-none focus:border-indigo-500 bg-transparent transition-all
                  placeholder-transparent"
                placeholder="Teacher ID"
                required
              />
              <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-600 
                dark:text-gray-300 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
                peer-focus:-top-2.5 peer-focus:text-sm">
                Teacher ID (e.g., 2025T0001)
              </label>
            </div>
          </>
        );
      case 'student':
        return (
          <div className="relative">
            <input
              type="text"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              pattern="2025[A-Z]{2}[0-9]{4}"
              className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                focus:outline-none focus:border-indigo-500 bg-transparent transition-all
                placeholder-transparent"
              placeholder="Student ID"
              required
            />
            <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-600 
              dark:text-gray-300 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
              peer-focus:-top-2.5 peer-focus:text-sm">
              Admission ID (e.g., 2025CS0001)
            </label>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome Back</h1>
          <p className="text-gray-600 dark:text-gray-300">Sign in to access your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">Role</label>
            <div className="grid grid-cols-3 gap-3">
              {(['student', 'teacher', 'admin'] as UserRole[]).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setRole(r);
                    setEmail('');
                    setTeacherName('');
                    setTeacherId('');
                    setStudentId('');
                    setPassword('');
                  }}
                  className={`py-2 px-4 rounded-lg text-sm font-medium capitalize transition-all
                    ${role === r 
                      ? 'bg-indigo-600 text-white' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                    }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {renderInputFields()}

          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 
                focus:outline-none focus:border-indigo-500 bg-transparent transition-all
                placeholder-transparent"
              placeholder="Password"
              required
            />
            <label className="absolute left-4 -top-2.5 bg-white dark:bg-gray-800 px-1 text-sm text-gray-600 
              dark:text-gray-300 transition-all peer-placeholder-shown:top-3 peer-placeholder-shown:text-base 
              peer-focus:-top-2.5 peer-focus:text-sm">
              Password
            </label>
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          <button
            type="submit"
            className="w-full bg-indigo-600 text-white py-3 px-4 rounded-lg font-medium
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
              transition-all flex items-center justify-center gap-2"
          >
            <LogIn size={20} />
            Sign In
          </button>
        </form>
      </div>
    </div>
  );
};