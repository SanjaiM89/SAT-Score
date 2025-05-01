import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Search, Edit2, Trash2, Plus } from 'lucide-react';
import { AddTeacherModal } from '../../components/modals/AddTeacherModal';
import { AssignTeachers } from './AssignTeachers';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Teacher {
  id: string;
  teacherId: string;
  fullName: string;
  department: string;
  designation: string;
  subjectsHandled: { id: string; code: string; name: string; batch: string; section: string }[];
  email: string;
}

interface Department {
  id: string;
  shortName: string;
  name: string;
}

export const Teachers = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'assign'>('list');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [teachersRes, deptsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/teachers'),
          axios.get('http://localhost:8000/api/departments')
        ]);
        setTeachers(teachersRes.data);
        setDepartments(deptsRes.data);
        setLoading(false);
      } catch (error) {
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleAddTeacher = async (teacherData: any) => {
    try {
      if (editingTeacher) {
        const response = await axios.put(`http://localhost:8000/api/teachers/${editingTeacher.id}`, teacherData);
        setTeachers(prev => prev.map(t => (t.id === editingTeacher.id ? response.data : t)));
        toast.success('Teacher updated successfully!');
      } else {
        const response = await axios.post('http://localhost:8000/api/teachers', teacherData);
        setTeachers(prev => [...prev, response.data]);
        toast.success('Teacher added successfully!');
      }
      setIsModalOpen(false);
      setEditingTeacher(null);
    } catch (error) {
      toast.error('Failed to save teacher');
    }
  };

  const handleEditTeacher = (teacher: Teacher) => {
    setEditingTeacher(teacher);
    setIsModalOpen(true);
  };

  const handleDeleteTeacher = async (teacherId: string) => {
    try {
      await axios.delete(`http://localhost:8000/api/teachers/${teacherId}`);
      setTeachers(prev => prev.filter(teacher => teacher.id !== teacherId));
      toast.success('Teacher removed successfully!');
    } catch (error) {
      toast.error('Failed to delete teacher');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    const matchesSearch = 
      teacher.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.teacherId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || teacher.department === selectedDepartment;
    return matchesSearch && matchesDepartment;
  });

  if (loading) return <div>Loading...</div>;

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
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.shortName}>{dept.name}</option>
                  ))}
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
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{teacher.fullName}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {departments.find(d => d.shortName === teacher.department)?.name || teacher.department}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          <span className="capitalize">{teacher.designation.replace('_', ' ')}</span>
                        </td>
                        <td className="py-4">
                          <div className="flex flex-wrap gap-2">
                            {teacher.subjectsHandled.map((subject) => (
                              <span
                                key={subject.id}
                                className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 rounded-full"
                              >
                                {subject.name} ({subject.code})
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
        editingTeacher={editingTeacher}
      />
    </div>
  );
};