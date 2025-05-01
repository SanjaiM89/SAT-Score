import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, Search, Filter, Lock } from 'lucide-react';
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
  isSubmitted: boolean;
}

interface MarksData {
  [key: string]: {
    [subjectId: string]: {
      marks: number;
      isSubmitted: boolean;
    };
  };
}

export const SATMarks = () => {
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarksData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');

  // Mock data - replace with actual API calls
  const assignedSubjects: Subject[] = [
    { id: '1', code: 'CS201', name: 'Data Structures', isSubmitted: false },
    { id: '2', code: 'CS202', name: 'Database Systems', isSubmitted: true },
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

  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, Number(value)));
    setMarks(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [subjectId]: {
          marks: numValue,
          isSubmitted: false
        }
      }
    }));
  };

  const getStudentMarks = (studentId: string, subjectId: string) => {
    return marks[studentId]?.[subjectId]?.marks || 0;
  };

  const isSubjectSubmitted = (subjectId: string) => {
    return assignedSubjects.find(s => s.id === subjectId)?.isSubmitted || false;
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

  const handleSubmit = async () => {
    if (!selectedSubject) return;
    
    const confirmed = window.confirm(
      'Are you sure you want to submit these marks? You won\'t be able to edit them after submission.'
    );

    if (!confirmed) return;

    setSaving(true);
    try {
      // Implement API call to submit marks
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Marks submitted successfully!');
      // Update local state to reflect submission
      setMarks(prev => {
        const newMarks = { ...prev };
        Object.keys(newMarks).forEach(studentId => {
          if (newMarks[studentId][selectedSubject]) {
            newMarks[studentId][selectedSubject].isSubmitted = true;
          }
        });
        return newMarks;
      });
    } catch (error) {
      toast.error('Failed to submit marks');
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SAT Marks Entry</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Enter semester examination marks</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex-1 min-w-[200px]">
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
                  <option key={subject.id} value={subject.id} disabled={subject.isSubmitted}>
                    {subject.name} ({subject.code}) {subject.isSubmitted ? '- Submitted' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex-1 min-w-[200px] relative">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search Students
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or roll number..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Department
              </label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="Computer Science">Computer Science</option>
                <option value="Electronics">Electronics</option>
              </select>
            </div>

            <div className="w-48">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Year
              </label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All</option>
                <option value="1">1st Year</option>
                <option value="2">2nd Year</option>
                <option value="3">3rd Year</option>
                <option value="4">4th Year</option>
              </select>
            </div>
          </div>

          {selectedSubject && isSubjectSubmitted(selectedSubject) ? (
            <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <Lock className="w-6 h-6 text-gray-400 mr-2" />
              <p className="text-gray-600 dark:text-gray-300">
                Marks for this subject have been submitted and cannot be edited
              </p>
            </div>
          ) : selectedSubject ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Roll No</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Year</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Marks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{student.rollNumber}</td>
                      <td className="py-4 text-sm text-gray-900 dark:text-white">{student.name}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.department}</td>
                      <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.year}nd Year</td>
                      <td className="py-4">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={getStudentMarks(student.id, selectedSubject) || ''}
                          onChange={(e) => handleMarkChange(student.id, selectedSubject, e.target.value)}
                          className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg 
                            focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Marks"
                        />
                      </td>
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

      {selectedSubject && !isSubjectSubmitted(selectedSubject) && (
        <div className="flex justify-end space-x-4">
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

          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-6 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 
              transition-all flex items-center space-x-2"
          >
            <Lock className="w-5 h-5" />
            <span>Submit Marks</span>
          </button>
        </div>
      )}
    </div>
  );
};