import React, { useState, useEffect } from 'react';
import { GraduationCap, UserPlus, Search, Bell, Plus, BookOpen, Trash2, X } from 'lucide-react';
import { AddStudentModal } from '../../components/modals/AddStudentModal';
import toast from 'react-hot-toast';

interface Course {
  id: string;
  code: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  registrationNumber: string;
  department: string;
  program: string;
  yearOfStudy: string;
  email: string;
  courses: Course[];
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
  const [availableCourses, setAvailableCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState<string | null>(null);

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

  // Fetch available courses when viewing courses tab
  useEffect(() => {
    if (activeTab !== 'courses' || !selectedStudent) return;
    const fetchCourses = async () => {
      try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/subjects`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setAvailableCourses(data.map((subject: any) => ({
          id: subject.id,
          code: subject.code,
          name: subject.name,
        })));
      } catch (error) {
        console.error('Error fetching courses:', error);
        toast.error('Failed to fetch courses');
      }
    };
    fetchCourses();
  }, [activeTab, selectedStudent]);

  const handleAddStudent = async (studentData: any) => {
    try {
      const formData = new FormData();
      const formattedStudentData = {
        ...studentData,
        yearOfStudy: studentData.yearOfStudy || undefined,
        semester: studentData.semester || undefined,
        yearOfJoining: studentData.yearOfJoining ? parseInt(studentData.yearOfJoining, 10) : undefined,
      };
      const { profilePicture, ...jsonData } = formattedStudentData;
      formData.append('student', JSON.stringify(jsonData));
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

  const handleDeleteStudent = async () => {
    if (!studentToDelete) return;
    try {
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/students/${studentToDelete}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setStudents(prev => prev.filter(student => student.id !== studentToDelete));
      setIsDeleteModalOpen(false);
      setStudentToDelete(null);
      toast.success('Student deleted successfully!');
    } catch (error) {
      console.error('Error deleting student:', error);
      toast.error('Failed to delete student');
    }
  };

  const handleAssignCourse = async () => {
    if (!selectedStudent || !selectedCourse) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/students/${selectedStudent}/courses/${selectedCourse}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedStudent = await response.json();
      setStudents(prev =>
        prev.map(student =>
          student.id === selectedStudent
            ? { ...student, courses: updatedStudent.courses }
            : student
        )
      );
      setSelectedCourse('');
      toast.success('Course assigned successfully!');
    } catch (error) {
      console.error('Error assigning course:', error);
      toast.error('Failed to assign course');
    }
  };

  const handleRemoveCourse = async (courseId: string) => {
    if (!selectedStudent) return;
    try {
      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/students/${selectedStudent}/courses/${courseId}`,
        {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const updatedStudent = await response.json();
      setStudents(prev =>
        prev.map(student =>
          student.id === selectedStudent
            ? { ...student, courses: updatedStudent.courses }
            : student
        )
      );
      toast.success('Course removed successfully!');
    } catch (error) {
      console.error('Error removing course:', error);
      toast.error('Failed to remove course');
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
                  <option value="Electronics & Communication">Electronics & Communication</option>
                  <option value="Computer Science">Computer Science</option>
                  <option value="Mechanical">Mechanical</option>
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
                <div className="text-center py-10">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600 dark:text-gray-300">Loading students...</p>
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-10">
                  <GraduationCap className="mx-auto text-gray-400" size={48} />
                  <p className="mt-4 text-gray-600 dark:text-gray-300">No students found</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200 dark:border-gray-700">
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Reg Number</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Program</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Year</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Email</th>
                        <th className="py-3 px-4 text-left text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => (
                        <tr key={student.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="py-4 px-4 text-gray-900 dark:text-white">{student.name}</td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{student.registrationNumber}</td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{student.department}</td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{student.program}</td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{student.yearOfStudy}</td>
                          <td className="py-4 px-4 text-gray-600 dark:text-gray-300">{student.email}</td>
                          <td className="py-4 px-4">
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleViewCourses(student.id)}
                                className="p-2 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                                title="View Courses"
                              >
                                <BookOpen size={20} />
                              </button>
                              <button
                                onClick={() => {
                                  setStudentToDelete(student.id);
                                  setIsDeleteModalOpen(true);
                                }}
                                className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete Student"
                              >
                                <Trash2 size={20} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : activeTab === 'courses' && selectedStudentData ? (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                Registered Courses for {selectedStudentData.name} ({selectedStudentData.registrationNumber})
              </h3>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Assign New Course
                </label>
                <div className="flex gap-4">
                  <select
                    value={selectedCourse}
                    onChange={(e) => setSelectedCourse(e.target.value)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select a course</option>
                    {availableCourses.map((course) => (
                      <option key={course.id} value={course.id}>
                        {course.code} - {course.name}
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleAssignCourse}
                    disabled={!selectedCourse}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                  >
                    Assign
                  </button>
                </div>
              </div>
              {selectedStudentData.courses.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-300">No courses registered.</p>
              ) : (
                <div className="space-y-4">
                  {selectedStudentData.courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{course.code}</p>
                        <p className="text-gray-600 dark:text-gray-300">{course.name}</p>
                      </div>
                      <button
                        onClick={() => handleRemoveCourse(course.id)}
                        className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : activeTab === 'announcements' ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Announcements</h3>
                <button
                  onClick={() => setIsAnnouncementModalOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus size={20} />
                  Add Announcement
                </button>
              </div>
              {announcements.length === 0 ? (
                <div className="text-center py-10">
                  <Bell className="mx-auto text-gray-400" size={48} />
                  <p className="mt-4 text-gray-600 dark:text-gray-300">No announcements available</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {announcements.map((announcement) => (
                    <div
                      key={announcement.id}
                      className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900 dark:text-white">{announcement.title}</h4>
                          <p className="text-gray-600 dark:text-gray-300">{announcement.content}</p>
                          <div className="mt-2 flex gap-2 items-center text-sm text-gray-500 dark:text-gray-400">
                            <span>{new Date(announcement.date).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{announcement.type}</span>
                          </div>
                        </div>
                        <button className="p-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                          <Trash2 size={20} />
                        </button>
                      </div>
                    </div>
                  ))}
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

      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Confirm Deletion</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                <X size={24} />
              </button>
            </div>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Are you sure you want to delete this student? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};