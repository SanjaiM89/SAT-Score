import React from 'react';
import { BookOpen, GraduationCap, ClipboardCheck, Users } from 'lucide-react';

interface AssignedClass {
  id: string;
  name: string;
  subject: string;
  department: string;
  semester: number;
  students: number;
  batch: string;
  section: string;
  schedule: {
    day: string;
    time: string;
    room: string;
  }[];
}

const assignedClasses: AssignedClass[] = [
  {
    id: '1',
    name: 'CSE-A',
    subject: 'Data Structures',
    department: 'Computer Science',
    semester: 3,
    students: 60,
    batch: '2025',
    section: 'A',
    schedule: [
      { day: 'Monday', time: '9:00 AM - 10:30 AM', room: 'CS-301' },
      { day: 'Wednesday', time: '11:00 AM - 12:30 PM', room: 'CS-301' },
    ],
  },
  {
    id: '2',
    name: 'CSE-B',
    subject: 'Database Systems',
    department: 'Computer Science',
    semester: 3,
    students: 55,
    batch: '2025',
    section: 'B',
    schedule: [
      { day: 'Tuesday', time: '9:00 AM - 10:30 AM', room: 'CS-302' },
      { day: 'Thursday', time: '11:00 AM - 12:30 PM', room: 'CS-302' },
    ],
  },
];

const stats = [
  { title: 'Assigned Classes', value: '4', icon: Users, color: 'bg-blue-500' },
  { title: 'Total Students', value: '210', icon: GraduationCap, color: 'bg-green-500' },
  { title: 'Subjects', value: '3', icon: BookOpen, color: 'bg-purple-500' },
  { title: 'Pending Marks', value: '2', icon: ClipboardCheck, color: 'bg-orange-500' },
];

export const TeacherDashboard = () => {
  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Welcome back! Here's an overview of your classes.</p>
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Assigned Classes</h2>
          <div className="space-y-4">
            {assignedClasses.map((cls) => (
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
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                <div className="flex items-center">
                  <ClipboardCheck className="w-5 h-5 text-red-500 dark:text-red-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">FAT 2 Marks Entry</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">CSE-A Data Structures</p>
                  </div>
                </div>
                <span className="text-sm text-red-600 dark:text-red-400">Due Today</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <div className="flex items-center">
                  <ClipboardCheck className="w-5 h-5 text-yellow-500 dark:text-yellow-400 mr-3" />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">Assignment Marks</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">IT-A Web Technologies</p>
                  </div>
                </div>
                <span className="text-sm text-yellow-600 dark:text-yellow-400">Due in 2 days</span>
              </div>
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