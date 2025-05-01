import React, { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface AssignTeacherModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (assignmentData: any) => void;
  teacherId: string; // Pre-selected teacher ID
  editingAssignment?: any; // Optional prop for editing existing assignments
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

interface SubjectAssignment {
  subject_id: string;
  batch: string;
  section: string;
}

export const AssignTeacherModal: React.FC<AssignTeacherModalProps> = ({ isOpen, onClose, onSubmit, teacherId, editingAssignment }) => {
  const [formData, setFormData] = useState({
    teacherId: teacherId,
    academicYear: '',
    department: '',
    subjects: [] as SubjectAssignment[],
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [deptsRes, subjectsRes] = await Promise.all([
          axios.get('http://localhost:8000/api/departments'),
          axios.get('http://localhost:8000/api/subjects'),
        ]);
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

  useEffect(() => {
    if (editingAssignment) {
      setFormData({
        teacherId: teacherId,
        academicYear: editingAssignment.academicYear || '',
        department: editingAssignment.department || '',
        subjects: editingAssignment.subjects.map((s: any) => ({
          subject_id: s.subject_id || s.code,
          batch: s.batch || '2025',
          section: s.section || 'A',
        })) || [],
      });
    } else {
      setFormData({
        teacherId: teacherId,
        academicYear: '',
        department: '',
        subjects: [],
      });
    }
  }, [editingAssignment, teacherId]);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const options = e.target.options;
    const selectedSubjects = [];
    for (let i = 0; i < options.length; i++) {
      if (options[i].selected) {
        const subjectId = options[i].value;
        const existing = formData.subjects.find(s => s.subject_id === subjectId);
        selectedSubjects.push({
          subject_id: subjectId,
          batch: existing?.batch || '2025',
          section: existing?.section || 'A',
        });
      }
    }
    setFormData(prev => ({
      ...prev,
      subjects: selectedSubjects,
    }));
  };

  const handleSubjectDetailChange = (subjectId: string, field: 'batch' | 'section', value: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.map(s =>
        s.subject_id === subjectId ? { ...s, [field]: value } : s
      ),
    }));
  };

  const handleRemoveSubject = (subjectId: string) => {
    setFormData(prev => ({
      ...prev,
      subjects: prev.subjects.filter(s => s.subject_id !== subjectId),
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.subjects.length === 0) {
      toast.error('Please select at least one subject');
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;
  if (loading) return <div>Loading...</div>;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {editingAssignment ? 'Edit Teacher Assignment' : 'Assign Teacher to Subject'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Academic Year
              </label>
              <select
                name="academicYear"
                value={formData.academicYear}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Year</option>
                <option value="2024-2025">2024-2025</option>
                <option value="2023-2024">2023-2024</option>
                <option value="2022-2023">2022-2023</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Department
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select Department</option>
                {departments.map(dept => (
                  <option key={dept.id} value={dept.shortName}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Subjects
            </label>
            <select
              multiple
              name="subjects"
              value={formData.subjects.map(s => s.subject_id)}
              onChange={handleSubjectChange}
              required
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white h-32"
            >
              {subjects.map(subject => (
                <option key={subject.id} value={subject.code}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Hold Ctrl/Cmd to select multiple subjects
            </p>
          </div>

          {formData.subjects.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Subject Assignment Details
              </h3>
              {formData.subjects.map(subject => (
                <div key={subject.subject_id} className="flex items-center space-x-4">
                  <div className="flex-1 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Batch for {subjects.find(s => s.code === subject.subject_id)?.name}
                      </label>
                      <select
                        value={subject.batch}
                        onChange={(e) => handleSubjectDetailChange(subject.subject_id, 'batch', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Batch</option>
                        <option value="2025">2025 Batch</option>
                        <option value="2024">2024 Batch</option>
                        <option value="2023">2023 Batch</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Section for {subjects.find(s => s.code === subject.subject_id)?.name}
                      </label>
                      <select
                        value={subject.section}
                        onChange={(e) => handleSubjectDetailChange(subject.subject_id, 'section', e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="">Select Section</option>
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveSubject(subject.subject_id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <X size={20} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 flex items-center space-x-2"
            >
              <Check size={20} />
              <span>{editingAssignment ? 'Update Assignment' : 'Assign Teacher'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};