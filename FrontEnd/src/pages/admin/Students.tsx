import React, { useState } from 'react';
import { GraduationCap, UserPlus, Search, Bell, Plus, BookOpen } from 'lucide-react';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  department: string;
  program: string;
  yearOfStudy: string;
  email: string;
  courses: {
    id: string;
    code: string;
    name: string;
  }[];
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'general' | 'exam' | 'event';
}

export const Students = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'announcements' | 'courses'>('list');
  const [isStudentModalOpen, setIsStudentModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([
    {
      id: '1',
      name: 'Alice Johnson',
      registrationNumber: '2025CS0001',
      department: 'Computer Science',
      program: 'B.Tech',
      yearOfStudy: '2',
      email: 'alice@example.com',
      courses: [
        { id: '1', code: 'CS201', name: 'Data Structures' },
        { id: '2', code: 'CS202', name: 'Database Systems' }
      ]
    },
    {
      id: '2',
      name: 'Bob Smith',
      registrationNumber: '2025CS0002',
      department: 'Computer Science',
      program: 'B.Tech',
      yearOfStudy: '2',
      email: 'bob@example.com',
      courses: [
        { id: '1', code: 'CS201', name: 'Data Structures' },
        { id: '3', code: 'CS203', name: 'Computer Networks' }
      ]
    }
  ]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);

  const handleAddStudent = (studentData: any) => {
    const deptShortName = studentData.department.split(' ')[0];
    const currentYear = '2025';
    const departmentCode = deptShortName.substring(0, 2).toUpperCase();
    const sequence = (students.length + 1).toString().padStart(4, '0');
    const registrationNumber = `${currentYear}${departmentCode}${sequence}`;

    const newStudent: Student = {
      id: Date.now().toString(),
      name: studentData.fullName,
      registrationNumber,
      department: studentData.department,
      program: studentData.program,
      yearOfStudy: studentData.yearOfStudy,
      email: studentData.email,
      courses: []
    };

    setStudents(prev => [...prev, newStudent]);
    setIsStudentModalOpen(false);
    toast.success('Student added successfully!');
  };

  const handleViewCourses = (studentId: string) => {
    setSelectedStudent(studentId);
    setActiveTab('courses');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || student.department === selectedDepartment;
    const matchesYear = !selectedYear || student.yearOfStudy === selectedYear;
    return matchesSearch && matchesDepartment && matchesYear;
  });

  const selectedStudentData = selectedStudent ? students.find(s => s.id === selectedStudent) : null;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Students</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Manage students and their courses</p>
        </div>
        <button
          onClick={() => setIsStudentModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Student
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative flex items-center gap-2
                ${activeTab === 'list'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <GraduationCap size={18} />
              Student List
              {activeTab === 'list' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative flex items-center gap-2
                ${activeTab === 'courses'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <BookOpen size={18} />
              Registered Courses
              {activeTab === 'courses' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative flex items-center gap-2
                ${activeTab === 'announcements'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <Bell size={18} />
              Announcements
              {activeTab === 'announcements' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'list' ? (
            <>
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search students..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <select 
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Departments</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Mechanical">Mechanical</option>
                  <option value="Civil">Civil</option>
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="">All Years</option>
                  <option value="1">1st Year</option>
                  <option value="2">2nd Year</option>
                  <option value="3">3rd Year</option>
                  <option value="4">4th Year</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Reg. No</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Program</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Year</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Courses</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredStudents.map((student) => (
                      <tr key={student.id}>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{student.registrationNumber}</td>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{student.name}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.department}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.program}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.yearOfStudy}nd Year</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          <button
                            onClick={() => handleViewCourses(student.id)}
                            className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            View ({student.courses.length})
                          </button>
                        </td>
                        <td className="py-4">
                          <button className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300">
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : activeTab === 'courses' ? (
            <div className="space-y-6">
              {selectedStudentData ? (
                <>
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {selectedStudentData.name}'s Registered Courses
                      </h2>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Registration Number: {selectedStudentData.registrationNumber}
                      </p>
                    </div>
                    <button
                      onClick={() => {/* Implement course assignment */}}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
                    >
                      <Plus size={18} />
                      Assign Course
                    </button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedStudentData.courses.map(course => (
                      <div
                        key={course.id}
                        className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-medium text-gray-900 dark:text-white">{course.name}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{course.code}</p>
                        </div>
                        <button
                          onClick={() => {/* Implement course removal */}}
                          className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="text-center text-gray-600 dark:text-gray-400">
                  Select a student to view their registered courses
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      <AddStudentModal
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        onSubmit={handleAddStudent}
      />
    </div>
  );
};