import React, { useState } from 'react';
import { Building2, Plus, Search, X, Edit2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface Department {
  id: string;
  code: string;
  name: string;
  shortName: string;
  totalTeachers: number;
  totalStudents: number;
  numberOfClasses: number;
}

export const Departments = () => {
  const [departments, setDepartments] = useState<Department[]>([
    { 
      id: '1', 
      code: 'CSE', 
      shortName: 'CS',
      name: 'Computer Science & Engineering', 
      totalTeachers: 15, 
      totalStudents: 300, 
      numberOfClasses: 3 
    },
    { 
      id: '2', 
      code: 'ECE',
      shortName: 'EC', 
      name: 'Electronics & Communication', 
      totalTeachers: 12, 
      totalStudents: 250, 
      numberOfClasses: 2 
    },
  ]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    shortName: '',
    numberOfClasses: 1,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDepartment) {
      // Update existing department
      setDepartments(prev => prev.map(dept => 
        dept.id === editingDepartment.id 
          ? { 
              ...dept, 
              code: formData.code,
              name: formData.name,
              shortName: formData.shortName,
              numberOfClasses: formData.numberOfClasses
            }
          : dept
      ));
      toast.success('Department updated successfully!');
    } else {
      // Add new department
      const newDepartment: Department = {
        id: Date.now().toString(),
        code: formData.code,
        name: formData.name,
        shortName: formData.shortName,
        totalTeachers: 0,
        totalStudents: 0,
        numberOfClasses: formData.numberOfClasses
      };
      setDepartments(prev => [...prev, newDepartment]);
      toast.success('Department added successfully!');
    }

    setIsModalOpen(false);
    setFormData({ code: '', name: '', shortName: '', numberOfClasses: 1 });
    setEditingDepartment(null);
  };

  const handleEdit = (department: Department) => {
    setEditingDepartment(department);
    setFormData({
      code: department.code,
      name: department.name,
      shortName: department.shortName,
      numberOfClasses: department.numberOfClasses
    });
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    setDepartments(prev => prev.filter(dept => dept.id !== id));
    toast.success('Department deleted successfully!');
  };

  const filteredDepartments = departments.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    dept.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Departments</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">Manage all departments in the system</p>
        </div>
        <button 
          onClick={() => {
            setEditingDepartment(null);
            setFormData({ code: '', name: '', shortName: '', numberOfClasses: 1 });
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add Department
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search departments..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Code</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Short Name</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Classes</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total Teachers</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Total Students</th>
                <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredDepartments.map((department) => (
                <tr key={department.id}>
                  <td className="py-4 text-sm text-gray-900 dark:text-white">{department.code}</td>
                  <td className="py-4 text-sm text-gray-900 dark:text-white">{department.shortName}</td>
                  <td className="py-4 text-sm text-gray-900 dark:text-white">{department.name}</td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                    {Array.from({ length: department.numberOfClasses }, (_, i) => 
                      String.fromCharCode(65 + i)
                    ).join(', ')}
                  </td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.totalTeachers}</td>
                  <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.totalStudents}</td>
                  <td className="py-4">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => handleEdit(department)}
                        className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(department.id)}
                        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingDepartment ? 'Edit Department' : 'Add New Department'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Code</label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Name (for ID generation)</label>
                <input
                  type="text"
                  value={formData.shortName}
                  onChange={(e) => setFormData(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))}
                  placeholder="e.g., CS for Computer Science"
                  maxLength={2}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Number of Classes</label>
                <input
                  type="number"
                  min="1"
                  max="26"
                  value={formData.numberOfClasses}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfClasses: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <p className="text-sm text-gray-500 mt-1">Classes will be named A to {String.fromCharCode(64 + formData.numberOfClasses)}</p>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false);
                    setEditingDepartment(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingDepartment ? 'Update' : 'Add'} Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};