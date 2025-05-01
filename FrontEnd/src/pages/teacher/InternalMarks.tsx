import React, { useState } from 'react';
import { Save, AlertCircle, Search, Filter, Plus, Minus } from 'lucide-react';
import toast from 'react-hot-toast';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  year: number;
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface MarksData {
  [key: string]: {
    [subjectId: string]: {
      fat: number;
      assignments: number[];
    };
  };
}

export const InternalMarks = () => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedFAT, setSelectedFAT] = useState<1 | 2 | 3>(1);
  const [marks, setMarks] = useState<MarksData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [assignmentCount, setAssignmentCount] = useState(1);

  // Mock data - replace with actual API calls
  const assignedSubjects: Subject[] = [
    { id: '1', code: 'CS201', name: 'Data Structures' },
    { id: '2', code: 'CS202', name: 'Database Systems' },
  ];

  const students: Student[] = [
    { 
      id: '1', 
      name: 'Alice Johnson', 
      rollNumber: 'CSE001',
      department: 'Computer Science',
      year: 2,
    },
    // Add more students
  ];

  const handleFATMarkChange = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, Number(value)));
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: {
          fat: numValue,
          assignments: prev[studentId]?.[subjectId]?.assignments || Array(assignmentCount).fill(0),
        }
      }
    }));
  };

  const handleAssignmentMarkChange = (studentId: string, subjectId: string, index: number, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, Number(value)));
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: {
          fat: prev[studentId]?.[subjectId]?.fat || 0,
          assignments: prev[studentId]?.[subjectId]?.assignments.map((mark: number, i: number) => 
            i === index ? numValue : mark
          ) || Array(assignmentCount).fill(0),
        }
      }
    }));
  };

  const getFATMarks = (studentId: string, subjectId: string) => {
    return marks[studentId]?.[subjectId]?.fat || 0;
  };

  const getAssignmentMarks = (studentId: string, subjectId: string, index: number) => {
    return marks[studentId]?.[subjectId]?.assignments?.[index] || 0;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Implement API call to save marks
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Marks saved successfully!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      toast.error('Failed to save marks');
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || student.department === selectedDepartment;
    const matchesYear = !selectedYear || student.year === parseInt(selectedYear);
    return matchesSearch && matchesDepartment && matchesYear;
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Internal Assessment</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Enter FAT and assignment marks</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Select Subject
              </label>
              <select
                value={selectedSubject || ''}
                onChange={(e) => setSelectedSubject(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a subject</option>
                {assignedSubjects.map(subject => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                FAT
              </label>
              <div className="flex space-x-2">
                {[1, 2, 3].map((fat) => (
                  <button
                    key={fat}
                    onClick={() => setSelectedFAT(fat as 1 | 2 | 3)}
                    className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors
                      ${selectedFAT === fat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300'
                      }`}
                  >
                    FAT {fat}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assignments
              </label>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAssignmentCount(Math.max(1, assignmentCount - 1))}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  <Minus size={20} />
                </button>
                <span className="px-4 py-2 font-medium">{assignmentCount}</span>
                <button
                  onClick={() => setAssignmentCount(Math.min(5, assignmentCount + 1))}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300"
                >
                  <Plus size={20} />
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search students..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {selectedSubject ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Roll No</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">FAT {selectedFAT}</th>
                    {Array.from({ length: assignmentCount }).map((_, index) => (
                      <th key={index} className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Assignment {index + 1}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{student.rollNumber}</td>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{student.name}</td>
                      <td className="py-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={getFATMarks(student.id, selectedSubject) || ''}
                          onChange={(e) => handleFATMarkChange(student.id, selectedSubject, e.target.value)}
                          className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Marks"
                        />
                      </td>
                      {Array.from({ length: assignmentCount }).map((_, index) => (
                        <td key={index} className="py-4">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={getAssignmentMarks(student.id, selectedSubject, index) || ''}
                            onChange={(e) => handleAssignmentMarkChange(student.id, selectedSubject, index, e.target.value)}
                            className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                              focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                            placeholder="Marks"
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">
                Select a subject to enter marks
              </p>
            </div>
          )}
        </div>
      </div>

      {selectedSubject && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all
              ${saving || saved
                ? 'bg-green-500 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
              }`}
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : saved ? (
              
              <AlertCircle className="w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}</span>
          </button>
        </div>
      )}
    </div>
  );
};