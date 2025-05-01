import React, { useState } from 'react';
import { Users, UserPlus, Search, Edit2, Trash2, Plus } from 'lucide-react';
import { AddTeacherModal } from '../../components/modals/AddTeacherModal';
import { AssignTeachers } from './AssignTeachers';
import toast from 'react-hot-toast';

interface Teacher {
  id: string;
  name: string;
  teacherId: string;
  department: string;
  designation: string;
  subjectsHandled: string[];
  email: string;
}

const subjectMap: Record<string, string> = {
  data_structures: 'Data Structures (CS201)',
  algorithms: 'Algorithms (CS202)',
  database_systems: 'Database Systems (CS203)',
  operating_systems: 'Operating Systems (CS204)',
  computer_networks: 'Computer Networks (CS205)',
  web_technologies: 'Web Technologies (CS206)',
  artificial_intelligence: 'Artificial Intelligence (CS207)',
  machine_learning: 'Machine Learning (CS208)',
};

export const Teachers = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'assign'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);

  const handleAddTeacher = (teacherData: any) => {
    const currentYear = '2025';
    const sequence = (teachers.length + 1).toString().padStart(4, '0');
    const teacherId = `${currentYear}T${sequence}`;

    const newTeacher: Teacher = {
      id: Date.now().toString(),
      name: teacherData.fullName,
      teacherId,
      department: teacherData.department,
      designation: teacherData.designation,
      subjectsHandled: teacherData.subjectsHandled,
      email: teacherData.email,
    };

    setTeachers(prev => [...prev, newTeacher]);
    setIsModalOpen(false);
    toast.success('Teacher added successfully!');
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDeleteTeacher = (teacherId: string) => {
    setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
    toast.success('Teacher removed successfully!');
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || teacher.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teachers</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Manage faculty members</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Teacher
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('list')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative
                ${activeTab === 'list'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              List
              {activeTab === 'list' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('assign')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative
                ${activeTab === 'assign'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              Assign
              {activeTab === 'assign' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'list' && (
            <div>
              <div className="flex gap-4 mb-6">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search teachers..."
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
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">ID</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Designation</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Subjects Handled</th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredTeachers.map((teacher) => (
                      <tr key={teacher.id}>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{teacher.teacherId}</td>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{teacher.name}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{teacher.department}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="capitalize">{teacher.designation.replace('_', ' ')}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            {teacher.subjectsHandled.map((subject) => (
                              <span
                                key={subject}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full"
                              >
                                {subjectMap[subject] || subject}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEditTeacher(teacher)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'assign' && <AssignTeachers />}
        </div>
      </div>

      <AddTeacherModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTeacher(null);
        }}
        onSubmit={handleAddTeacher}
      />
    </div>
  );
};