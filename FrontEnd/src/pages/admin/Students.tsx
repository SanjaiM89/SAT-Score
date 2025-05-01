import React, { useState, useEffect } from 'react';
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
  const [students, setStudents] = useState<Student[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch students from backend on mount
  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/students`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const formattedStudents: Student[] = data.map((student: any) => ({
          id: student.id,
          name: student.fullName,
          registrationNumber: student.registrationNumber,
          department: student.department,
          program: student.program,
          yearOfStudy: student.yearOfStudy,
          email: student.email,
          courses: student.courses || [],
        }));
        setStudents(formattedStudents);
        console.log('Fetched students:', formattedStudents);
      } catch (error) {
        console.error('Error fetching students:', error);
        toast.error('Failed to fetch students');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStudents();
  }, []);

  const handleAddStudent = async (studentData: any) => {
    try {
      const formData = new FormData();
      // Keep yearOfStudy and semester as strings, convert yearOfJoining to integer
      const formattedStudentData = {
        ...studentData,
        yearOfStudy: studentData.yearOfStudy || undefined,
        semester: studentData.semester || undefined,
        yearOfJoining: studentData.yearOfJoining ? parseInt(studentData.yearOfJoining, 10) : undefined,
      };
      // Remove profilePicture from JSON data
      const { profilePicture, ...jsonData } = formattedStudentData;
      // Append student data as JSON string
      formData.append('student', JSON.stringify(jsonData));
      // Append file if provided
      if (profilePicture) {
        formData.append('file', profilePicture);
      }

      console.log('Sending student data to backend:', jsonData);

      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/students`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const newStudent = await response.json();
      const formattedStudent: Student = {
        id: newStudent.id,
        name: newStudent.fullName,
        registrationNumber: newStudent.registrationNumber,
        department: newStudent.department,
        program: newStudent.program,
        yearOfStudy: newStudent.yearOfStudy,
        email: newStudent.email,
        courses: newStudent.courses || [],
      };

      setStudents(prev => [...prev, formattedStudent]);
      setIsStudentModalOpen(false);
      toast.success('Student added successfully!');
    } catch (error: any) {
      console.error('Error adding student:', error);
      let errorMessage = 'Failed to add student';
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = parsedError.detail.map((err: any) => `${err.loc.join('.')}: ${err.msg}`).join('; ');
      } catch (e) {
        // If parsing fails, use the raw error message
      }
      toast.error(errorMessage);
    }
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

              {isLoading ? (
                <div className="text-center text-gray-600 dark:text-gray-400">Loading students...</div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center text-gray-600 dark:text-gray-400">No students found</div>
              ) : (
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
              )}
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