import React, { useState } from 'react';
import { Save, AlertCircle, Search } from 'lucide-react';

interface Student {
  id: string;
  name: string;
  rollNumber: string;
  department: string;
  year: number;
  subjects: Subject[];
}

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface MarksData {
  [key: string]: {
    [subjectId: string]: {
      internal: number;
    };
  };
}

const mockSubjects: Subject[] = [
  { id: '1', code: 'CS201', name: 'Data Structures' },
  { id: '2', code: 'CS202', name: 'Database Systems' },
  { id: '3', code: 'CS203', name: 'Computer Networks' },
  { id: '4', code: 'CS204', name: 'Operating Systems' },
];

const students: Student[] = [
  { 
    id: '1', 
    name: 'Alice Johnson', 
    rollNumber: 'CSE001',
    department: 'Computer Science',
    year: 2,
    subjects: mockSubjects 
  },
  { 
    id: '2', 
    name: 'Bob Smith', 
    rollNumber: 'CSE002',
    department: 'Computer Science',
    year: 2,
    subjects: mockSubjects 
  },
  { 
    id: '3', 
    name: 'Charlie Brown', 
    rollNumber: 'CSE003',
    department: 'Electronics',
    year: 3,
    subjects: mockSubjects 
  },
];

export const MarksEntry = () => {
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarksData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, Number(value)));
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: {
          internal: numValue
        }
      }
    }));
  };

  const getStudentMarks = (studentId: string, subjectId: string) => {
    return marks[studentId]?.[subjectId]?.internal || 0;
  };

  const handleSave = async () => {
    setSaving(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Internal Marks Entry</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Enter internal assessment marks for students</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6">
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
              <option value="Computer Science">Computer Science</option>
              <option value="Electronics">Electronics</option>
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

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left">
                  <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Roll No</th>
                  <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                  <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                  <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Year</th>
                  <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredStudents.map((student) => (
                  <React.Fragment key={student.id}>
                    <tr>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{student.rollNumber}</td>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{student.name}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.department}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.year}nd Year</td>
                      <td className="py-4">
                        <button
                          onClick={() => setSelectedStudent(selectedStudent === student.id ? null : student.id)}
                          className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          {selectedStudent === student.id ? 'Close' : 'Enter Marks'}
                        </button>
                      </td>
                    </tr>
                    {selectedStudent === student.id && (
                      <tr>
                        <td colSpan={5} className="py-4 bg-gray-50 dark:bg-gray-700">
                          <div className="px-4 space-y-4">
                            {student.subjects.map((subject) => (
                              <div key={subject.id} className="flex items-center space-x-4">
                                <span className="w-48 text-sm text-gray-900 dark:text-white">
                                  {subject.name} ({subject.code})
                                </span>
                                <input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={getStudentMarks(student.id, subject.id) || ''}
                                  onChange={(e) => handleMarkChange(student.id, subject.id, e.target.value)}
                                  className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                                    focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                                  placeholder="Internal"
                                />
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

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
    </div>
  );
};