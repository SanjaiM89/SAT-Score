import React, { useState } from 'react';
import { UserPlus, Search, X, Edit2 } from 'lucide-react';
import { AssignTeacherModal } from '../../components/modals/AssignTeacherModal';

interface TeacherAssignment {
  id: string;
  teacherId: string;
  teacherName: string;
  department: string;
  subjects: {
    id: string;
    name: string;
    code: string;
    batch: string;
    section: string;
  }[];
}

const mockAssignments: TeacherAssignment[] = [
  {
    id: '1',
    teacherId: '2025T0001',
    teacherName: 'Dr. Sarah Wilson',
    department: 'Computer Science',
    subjects: [
      { id: '1', name: 'Data Structures', code: 'CS201', batch: '2025', section: 'A' },
      { id: '2', name: 'Algorithms', code: 'CS202', batch: '2025', section: 'B' },
    ],
  },
  {
    id: '2',
    teacherId: '2025T0002',
    teacherName: 'Prof. John Smith',
    department: 'Electronics',
    subjects: [
      { id: '3', name: 'Digital Electronics', code: 'EC201', batch: '2025', section: 'A' },
      { id: '4', name: 'Microprocessors', code: 'EC202', batch: '2025', section: 'A' },
    ],
  },
];

export const AssignTeachers = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<TeacherAssignment[]>(mockAssignments);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<{
    teacherId: string;
    subjectId: string;
  } | null>(null);

  const handleAssignTeacher = (assignmentData: any) => {
    console.log('Assignment data:', assignmentData);
    // TODO: Implement the API call to assign the teacher
    setIsModalOpen(false);
  };

  const handleUnassignSubject = (teacherId: string, subjectId: string) => {
    setAssignments(prev =>
      prev.map(assignment => {
        if (assignment.teacherId === teacherId) {
          return {
            ...assignment,
            subjects: assignment.subjects.filter(subject => subject.id !== subjectId),
          };
        }
        return assignment;
      })
    );
  };

  const handleReassignTeacher = (teacherId: string, subjectId: string) => {
    setEditingAssignment({ teacherId, subjectId });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.teacherName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      assignment.teacherId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || assignment.department === selectedDepartment;
    const matchesSubject = !selectedSubject || assignment.subjects.some(s => s.code === selectedSubject);
    return matchesSearch && matchesDepartment && matchesSubject;
  });

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
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
              <option value="Mechanical">Mechanical</option>
              <option value="Civil">Civil</option>
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
              <option value="CS201">Data Structures</option>
              <option value="CS202">Algorithms</option>
              <option value="EC201">Digital Electronics</option>
              <option value="EC202">Microprocessors</option>
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
              {filteredAssignments.map((assignment) => (
                <tr key={assignment.id}>
                  <td className="py-4 text-sm text-gray-900 dark:text-white">{assignment.teacherId}</td>
                  <td className="py-4 text-sm text-gray-900 dark:text-white">{assignment.teacherName}</td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{assignment.department}</td>
                  <td className="py-4">
                    <div className="space-y-2">
                      {assignment.subjects.map((subject) => (
                        <div
                          key={subject.id}
                          className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded-lg"
                        >
                          <div>
                            <span className="text-sm font-medium text-gray-900 dark:text-white">
                              {subject.name}
                            </span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              ({subject.code}) - Batch {subject.batch}, Section {subject.section}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleReassignTeacher(assignment.teacherId, subject.id)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleUnassignSubject(assignment.teacherId, subject.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-4">
                    <button
                      onClick={() => {
                        setSelectedTeacher(assignment.teacherId);
                        setIsEditing(false);
                        setIsModalOpen(true);
                      }}
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
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
          setIsEditing(false);
          setEditingAssignment(null);
        }}
        onSubmit={handleAssignTeacher}
      />
    </div>
  );
};