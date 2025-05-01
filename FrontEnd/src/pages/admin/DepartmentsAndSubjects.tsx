import React, { useState } from 'react';
import { Building2, BookOpen, Plus, Search, X, Edit2 } from 'lucide-react';
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

interface Subject {
  id: string;
  code: string;
  name: string;
  department: string;
  type: 'theory' | 'lab';
  semester: number;
  credits: number;
}

export const DepartmentsAndSubjects = () => {
  const [activeTab, setActiveTab] = useState<'departments' | 'subjects'>('departments');
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

  const [subjects, setSubjects] = useState<Subject[]>([
    {
      id: '1',
      code: 'CS201',
      name: 'Data Structures',
      department: 'Computer Science & Engineering',
      type: 'theory',
      semester: 3,
      credits: 4
    },
    {
      id: '2',
      code: 'CS202',
      name: 'Database Systems',
      department: 'Computer Science & Engineering',
      type: 'theory',
      semester: 4,
      credits: 3
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [newDepartment, setNewDepartment] = useState({
    code: '',
    name: '',
    shortName: '',
    numberOfClasses: 1
  });
  const [newSubject, setNewSubject] = useState({
    code: '',
    name: '',
    department: '',
    type: 'theory' as 'theory' | 'lab',
    semester: 1,
    credits: 3
  });

  const handleAddDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    const department: Department = {
      id: Date.now().toString(),
      ...newDepartment,
      totalTeachers: 0,
      totalStudents: 0,
    };
    setDepartments(prev => [...prev, department]);
    setIsDepartmentModalOpen(false);
    setNewDepartment({ code: '', name: '', shortName: '', numberOfClasses: 1 });
    toast.success('Department added successfully!');
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const subject: Subject = {
      id: Date.now().toString(),
      ...newSubject
    };
    setSubjects(prev => [...prev, subject]);
    setIsSubjectModalOpen(false);
    setNewSubject({
      code: '',
      name: '',
      department: '',
      type: 'theory',
      semester: 1,
      credits: 3
    });
    toast.success('Subject added successfully!');
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Departments & Subjects
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Manage departments and subjects
          </p>
        </div>
        <button
          onClick={() => activeTab === 'departments' ? setIsDepartmentModalOpen(true) : setIsSubjectModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          <Plus size={20} />
          Add {activeTab === 'departments' ? 'Department' : 'Subject'}
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative flex items-center gap-2
                ${activeTab === 'departments'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <Building2 size={18} />
              Departments
              {activeTab === 'departments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
            <button
              onClick={() => setActiveTab('subjects')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative flex items-center gap-2
                ${activeTab === 'subjects'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                }`}
            >
              <BookOpen size={18} />
              Subjects
              {activeTab === 'subjects' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>
          </nav>
        </div>

        <div className="p-6">
          <div className="flex gap-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Search ${activeTab}...`}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </div>

          {activeTab === 'departments' ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Code</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Teachers</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Students</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Classes</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {departments.map((department) => (
                    <tr key={department.id}>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{department.code}</td>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{department.name}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.totalTeachers}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.totalStudents}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.numberOfClasses}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            <Edit2 size={18} />
                          </button>
                          <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Code</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Type</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Semester</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Credits</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {subjects.map((subject) => (
                    <tr key={subject.id}>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{subject.code}</td>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{subject.name}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{subject.department}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                        <span className="capitalize">{subject.type}</span>
                      </td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{subject.semester}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{subject.credits}</td>
                      <td className="py-4">
                        <div className="flex items-center space-x-3">
                          <button className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            <Edit2 size={18} />
                          </button>
                          <button className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300">
                            <X size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Department Modal */}
      {isDepartmentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Department</h2>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Code</label>
                <input
                  type="text"
                  value={newDepartment.code}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Short Name</label>
                <input
                  type="text"
                  value={newDepartment.shortName}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, shortName: e.target.value.toUpperCase() }))}
                  maxLength={2}
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
                  value={newDepartment.numberOfClasses}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, numberOfClasses: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsDepartmentModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Department
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Subject Modal */}
      {isSubjectModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">Add New Subject</h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={newSubject.department}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.name}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select
                  value={newSubject.type}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, type: e.target.value as 'theory' | 'lab' }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="theory">Theory</option>
                  <option value="lab">Lab</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Semester</label>
                <select
                  value={newSubject.semester}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, semester: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                    <option key={sem} value={sem}>Semester {sem}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Credits</label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={newSubject.credits}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setIsSubjectModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};