import React, { useState, useEffect } from 'react';
import { UserPlus, Search, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { AssignTeacherModal } from '../../components/modals/AssignTeacherModal';

interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  department: string;
  subjectsHandled: { id: string; code: string; name: string; batch: string; section: string }[];
}

interface Department {
  id: string;
  shortName: string;
  name: string;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

export const AssignTeachers = () => {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, deptsRes, subjectsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/teachers'),
          axios.get('http://localhost:8000/api/departments'),
          axios.get('http://localhost:8000/api/subjects'),
        ]);
        setTeachers(teachersRes.data);
        setDepartments(deptsRes.data);
        setSubjects(subjectsRes.data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAssignTeacher = async (assignmentData: any) => {
    try {
      const response = await axios.post('http://localhost:8000/api/teachers/assign', assignmentData);
      setTeachers(prev =>
        prev.map(teacher =>
          teacher.id === assignmentData.teacherId ? response.data : teacher
        )
      );
      toast.success('Teacher assigned successfully!');
      setIsModalOpen(false);
      setSelectedTeacherId(null);
    } catch (error) {
      toast.error('Failed to assign teacher');
    }
  };

  const handleUnassignSubject = async (teacherId: string, subjectCode: string) => {
    try {
      const response = await axios.delete(`http://localhost:8000/api/teachers/${teacherId}/subjects/${subjectCode}`);
      setTeachers(prev =>
        prev.map(teacher =>
          teacher.id === teacherId ? response.data : teacher
        )
      );
      toast.success('Subject unassigned successfully!');
    } catch (error) {
      toast.error('Failed to unassign subject');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch =
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || teacher.department === selectedDepartment;
    const matchesSubject = !selectedSubject || teacher.subjectsHandled.some(s => s.code === selectedSubject);
    return matchesSearch && matchesDepartment && matchesSubject;
  });

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Assign Teachers</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Assign teachers to subjects and classes</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Department
            </label>
            <select
              value={selectedDepartment}
              onChange={(e) => setSelectedDepartment(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Departments</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.shortName}>
                  {dept.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Subject
            </label>
            <select
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.code}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Search
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search teachers..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Assigned Subjects</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTeachers.map(teacher => (
                <tr key={teacher.id}>
                  <td className="py-4 text-sm text-gray-900 dark:text-white">{teacher.teacherId}</td>
                  <td className="py-4 text-sm text-gray-900 dark:text-white">{teacher.fullName}</td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                    {departments.find(d => d.shortName === teacher.department)?.name || teacher.department}
                  </td>
                  <td className="py-4">
                    <div className="flex flex-wrap gap-2">
                      {teacher.subjectsHandled.length === 0 ? (
                        <span className="text-gray-500 dark:text-gray-400">No subjects assigned</span>
                      ) : (
                        teacher.subjectsHandled.map(subject => (
                          <div
                            key={subject.id}
                            className="flex items-center px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full"
                          >
                            <span>
                              {subject.name} ({subject.code}) - {subject.batch}/{subject.section}
                            </span>
                            <button
                              onClick={() => handleUnassignSubject(teacher.id, subject.code)}
                              className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => {
                        setSelectedTeacherId(teacher.id);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm"
                    >
                      <UserPlus size={16} />
                      Assign New
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AssignTeacherModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedTeacherId(null);
        }}
        onSubmit={handleAssignTeacher}
        teacherId={selectedTeacherId || ''}
      />
    </div>
  );
};