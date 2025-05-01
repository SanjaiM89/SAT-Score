import React, { useState, useEffect, useCallback } from 'react';
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
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDepartmentModalOpen, setIsDepartmentModalOpen] = useState(false);
  const [isSubjectModalOpen, setIsSubjectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
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

  const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

  // Fetch departments and subjects
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch departments
      const deptResponse = await fetch(`${backendUrl}/api/departments`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!deptResponse.ok) {
        throw new Error(`HTTP error! status: ${deptResponse.status}`);
      }
      const deptData = await deptResponse.json();
      console.log('Raw department data from backend:', deptData);
      const mappedDeptData = Array.isArray(deptData)
        ? deptData
            .map((dept: any) => {
              if (!dept || !dept.id) {
                console.warn('Skipping invalid department:', dept);
                return null;
              }
              return {
                id: dept.id,
                code: dept.code || '',
                name: dept.name || '',
                shortName: dept.shortName || '',
                totalTeachers: Number(dept.totalTeachers) || 0,
                totalStudents: Number(dept.totalStudents) || 0,
                numberOfClasses: Number(dept.numberOfClasses) || 1
              };
            })
            .filter((dept: Department | null) => dept !== null) as Department[]
        : [];
      console.log('Mapped departments:', mappedDeptData);
      setDepartments([...mappedDeptData]);

      // Fetch subjects
      const subjResponse = await fetch(`${backendUrl}/api/subjects`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!subjResponse.ok) {
        throw new Error(`HTTP error! status: ${subjResponse.status}`);
      }
      const subjData = await subjResponse.json();
      console.log('Raw subject data from backend:', subjData);
      const mappedSubjData = Array.isArray(subjData)
        ? subjData
            .map((subj: any) => {
              if (!subj || !subj.id) {
                console.warn('Skipping invalid subject:', subj);
                return null;
              }
              return {
                id: subj.id,
                code: subj.code || '',
                name: subj.name || '',
                department: subj.department || '',
                type: subj.type || 'theory',
                semester: Number(subj.semester) || 1,
                credits: Number(subj.credits) || 3
              };
            })
            .filter((subj: Subject | null) => subj !== null) as Subject[]
        : [];
      console.log('Mapped subjects:', mappedSubjData);
      setSubjects([...mappedSubjData]);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch departments and subjects');
    } finally {
      setIsLoading(false);
    }
  }, [backendUrl]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleAddDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const departmentPayload = {
        code: newDepartment.code,
        name: newDepartment.name,
        shortName: newDepartment.shortName.toUpperCase(),
        numberOfClasses: newDepartment.numberOfClasses
      };

      const method = editingDepartment ? 'PUT' : 'POST';
      const url = editingDepartment
        ? `${backendUrl}/api/departments/${editingDepartment.id}`
        : `${backendUrl}/api/departments`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(departmentPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const department = await response.json();
      console.log('Backend department response:', department);
      const mappedDepartment: Department = {
        id: department.id || department._id,
        code: department.code || '',
        name: department.name || '',
        shortName: department.shortName || '',
        totalTeachers: Number(department.totalTeachers) || 0,
        totalStudents: Number(department.totalStudents) || 0,
        numberOfClasses: Number(department.numberOfClasses) || 1
      };
      console.log('Mapped department:', mappedDepartment);

      if (editingDepartment) {
        setDepartments(prev =>
          prev.map(d => (d.id === mappedDepartment.id ? mappedDepartment : d))
        );
        toast.success('Department updated successfully!');
      } else {
        setDepartments(prev => [...prev, mappedDepartment]);
        toast.success('Department added successfully!');
      }

      setIsDepartmentModalOpen(false);
      setEditingDepartment(null);
      setNewDepartment({ code: '', name: '', shortName: '', numberOfClasses: 1 });
      await fetchData();
    } catch (error: any) {
      console.error('Error saving department:', error);
      let errorMessage = editingDepartment ? 'Failed to update department' : 'Failed to add department';
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = Array.isArray(parsedError.detail)
          ? parsedError.detail.map((err: any) => err.msg).join(', ')
          : parsedError.detail || errorMessage;
      } catch (e) {
        // Use raw error message if parsing fails
      }
      toast.error(errorMessage);
      await fetchData();
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/departments/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setDepartments(prev => prev.filter(d => d.id !== id));
      toast.success('Department deleted successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error deleting department:', error);
      toast.error('Failed to delete department');
      await fetchData();
    }
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setNewDepartment({
      code: department.code,
      name: department.name,
      shortName: department.shortName,
      numberOfClasses: department.numberOfClasses
    });
    setIsDepartmentModalOpen(true);
  };

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const subjectPayload = {
        code: newSubject.code,
        name: newSubject.name,
        department: newSubject.department,
        type: newSubject.type,
        semester: newSubject.semester,
        credits: newSubject.credits
      };

      const method = editingSubject ? 'PUT' : 'POST';
      const url = editingSubject
        ? `${backendUrl}/api/subjects/${editingSubject.id}`
        : `${backendUrl}/api/subjects`;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subjectPayload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(JSON.stringify(errorData));
      }

      const subject = await response.json();
      console.log('Backend subject response:', subject);
      const mappedSubject: Subject = {
        id: subject.id || subject._id,
        code: subject.code || '',
        name: subject.name || '',
        department: subject.department || '',
        type: subject.type || 'theory',
        semester: Number(subject.semester) || 1,
        credits: Number(subject.credits) || 3
      };
      console.log('Mapped subject:', mappedSubject);

      if (editingSubject) {
        setSubjects(prev =>
          prev.map(s => (s.id === mappedSubject.id ? mappedSubject : s))
        );
        toast.success('Subject updated successfully!');
      } else {
        setSubjects(prev => [...prev, mappedSubject]);
        toast.success('Subject added successfully!');
      }

      setIsSubjectModalOpen(false);
      setEditingSubject(null);
      setNewSubject({
        code: '',
        name: '',
        department: '',
        type: 'theory',
        semester: 1,
        credits: 3
      });
      await fetchData();
    } catch (error: any) {
      console.error('Error saving subject:', error);
      let errorMessage = editingSubject ? 'Failed to update subject' : 'Failed to add subject';
      try {
        const parsedError = JSON.parse(error.message);
        errorMessage = Array.isArray(parsedError.detail)
          ? parsedError.detail.map((err: any) => err.msg).join(', ')
          : parsedError.detail || errorMessage;
      } catch (e) {
        // Use raw error message if parsing fails
      }
      toast.error(errorMessage);
      await fetchData();
    }
  };

  const handleDeleteSubject = async (id: string) => {
    try {
      const response = await fetch(`${backendUrl}/api/subjects/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setSubjects(prev => prev.filter(s => s.id !== id));
      toast.success('Subject deleted successfully!');
      await fetchData();
    } catch (error) {
      console.error('Error deleting subject:', error);
      toast.error('Failed to delete subject');
      await fetchData();
    }
  };

  const handleEditSubject = (subject: Subject) => {
    setEditingSubject(subject);
    setNewSubject({
      code: subject.code,
      name: subject.name,
      department: subject.department,
      type: subject.type,
      semester: subject.semester,
      credits: subject.credits
    });
    setIsSubjectModalOpen(true);
  };

  const filteredDepartments = departments.filter(dept => {
    try {
      if (!dept) {
        console.warn('Null department in filter:', dept);
        return false;
      }
      const code = dept.code || '';
      const name = dept.name || '';
      const search = searchTerm.toLowerCase();
      const matches = code.toLowerCase().includes(search) || name.toLowerCase().includes(search);
      if (!matches) {
        console.log(`Department filtered out: ${name} (code: ${code}, search: ${search})`);
      }
      return matches;
    } catch (error) {
      console.warn('Error filtering department:', dept, error);
      return false;
    }
  });

  const filteredSubjects = subjects.filter(subj => {
    try {
      if (!subj) {
        console.warn('Null subject in filter:', subj);
        return false;
      }
      const code = subj.code || '';
      const name = subj.name || '';
      const department = subj.department || '';
      const search = searchTerm.toLowerCase();
      return (
        code.toLowerCase().includes(search) ||
        name.toLowerCase().includes(search) ||
        department.toLowerCase().includes(search)
      );
    } catch (error) {
      console.warn('Error filtering subject:', subj, error);
      return false;
    }
  });

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
          onClick={() => {
            if (activeTab === 'departments') {
              setEditingDepartment(null);
              setNewDepartment({ code: '', name: '', shortName: '', numberOfClasses: 1 });
              setIsDepartmentModalOpen(true);
            } else {
              setEditingSubject(null);
              setNewSubject({ code: '', name: '', department: '', type: 'theory', semester: 1, credits: 3 });
              setIsSubjectModalOpen(true);
            }
          }}
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

          {isLoading ? (
            <div className="text-center text-gray-600 dark:text-gray-400">Loading {activeTab}...</div>
          ) : activeTab === 'departments' ? (
            filteredDepartments.length === 0 ? (
              <div className="text-center text-gray-600 dark:text-gray-400">
                No departments found. {searchTerm ? 'Try clearing the search.' : 'Add a new department.'}
              </div>
            ) : (
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
                    {filteredDepartments.map((department) => (
                      <tr key={department.id}>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{department.code}</td>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">{department.name}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.totalTeachers}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.totalStudents}</td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{department.numberOfClasses}</td>
                        <td className="py-4">
                          <div className="flex items-center space-x-3">
                            <button
                              onClick={() => handleEditDepartment(department)}
                              className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                            >
                              <Edit2 size={18} />
                            </button>
                            <button
                              onClick={() => handleDeleteDepartment(department.id)}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                            >
                              <X size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : filteredSubjects.length === 0 ? (
            <div className="text-center text-gray-600 dark:text-gray-400">
              No subjects found. {searchTerm ? 'Try clearing the search.' : 'Add a new subject.'}
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
                  {filteredSubjects.map((subject) => (
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
                          <button
                            onClick={() => handleEditSubject(subject)}
                            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                          >
                            <Edit2 size={18} />
                          </button>
                          <button
                            onClick={() => handleDeleteSubject(subject.id)}
                            className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                          >
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
            <h2 className="text-xl font-semibold mb-4">{editingDepartment ? 'Edit Department' : 'Add New Department'}</h2>
            <form onSubmit={handleAddDepartment} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Department Code</label>
                <input
                  type="text"
                  value={newDepartment.code}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department Name</label>
                <input
                  type="text"
                  value={newDepartment.name}
                  onChange={(e) => setNewDepartment(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsDepartmentModalOpen(false);
                    setEditingDepartment(null);
                    setNewDepartment({ code: '', name: '', shortName: '', numberOfClasses: 1 });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingDepartment ? 'Update Department' : 'Add Department'}
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
            <h2 className="text-xl font-semibold mb-4">{editingSubject ? 'Edit Subject' : 'Add New Subject'}</h2>
            <form onSubmit={handleAddSubject} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Subject Code</label>
                <input
                  type="text"
                  value={newSubject.code}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, code: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Subject Name</label>
                <input
                  type="text"
                  value={newSubject.name}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Department</label>
                <select
                  value={newSubject.department}
                  onChange={(e) => setNewSubject(prev => ({ ...prev, department: e.target.value }))}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
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
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setIsSubjectModalOpen(false);
                    setEditingSubject(null);
                    setNewSubject({ code: '', name: '', department: '', type: 'theory', semester: 1, credits: 3 });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 dark:text-gray-300 dark:hover:text-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  {editingSubject ? 'Update Subject' : 'Add Subject'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};