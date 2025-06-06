import React, { useState, useEffect } from 'react';
import { Calculator, Save, AlertCircle, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Subject {
  id: string;
  code: string;
  name: string;
}

interface Student {
  id: string;
  fullName: string;
  registrationNumber: string;
  department: string;
  year?: number | null;
  yearOfStudy?: string;
  subjects: Subject[];
  courses?: Subject[];
  marks?: { [subjectId: string]: number } | string; // Handle string or object
}

interface MarksData {
  [key: string]: {
    [subjectId: string]: {
      final: number;
    };
  };
}

interface MarkCriteria {
  internal: number;
  external: number;
  formula: string;
}

export const SATScore = () => {
  const [activeTab, setActiveTab] = useState<'marks' | 'criteria'>('marks');
  const [selectedStudent, setSelectedStudent] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarksData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [markCriteria, setMarkCriteria] = useState<MarkCriteria>({
    internal: 30,
    external: 70,
    formula: '(internal * 0.3) + (external * 0.7)',
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [departments, setDepartments] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage, setStudentsPerPage] = useState(50);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const timestamp = new Date().getTime();
        const [studentsRes, criteriaRes, deptsRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/students?t=${timestamp}`),
          axios.get(`http://localhost:8000/api/mark-criteria?t=${timestamp}`),
          axios.get(`http://localhost:8000/api/departments?t=${timestamp}`),
        ]);
        console.log('Raw /api/students response:', JSON.stringify(studentsRes.data, null, 2));
        console.log('Raw /api/departments response:', JSON.stringify(deptsRes.data, null, 2));

        // Initialize marks state from fetched data
        const initialMarks: MarksData = {};
        const mappedStudents = studentsRes.data.map((student: any) => {
          let studentMarks: { [subjectId: string]: number } = {};
          if (typeof student.marks === 'string') {
            try {
              studentMarks = JSON.parse(student.marks);
            } catch (e) {
              console.error(`Failed to parse marks for student ${student.id}:`, student.marks);
            }
          } else {
            studentMarks = student.marks || {};
          }

          Object.entries(studentMarks).forEach(([subjectId, final]) => {
            initialMarks[student.id] = initialMarks[student.id] || {};
            initialMarks[student.id][subjectId] = { final: Number(final) };
          });

          return {
            id: student.id,
            fullName: student.fullName || 'Unknown',
            registrationNumber: student.registrationNumber || 'N/A',
            department: student.department || 'N/A',
            year: student.yearOfStudy && Number.isInteger(parseInt(student.yearOfStudy)) ? parseInt(student.yearOfStudy) : null,
            yearOfStudy: student.yearOfStudy || 'N/A',
            subjects: student.courses || student.subjects || [],
            marks: studentMarks,
          };
        });

        setStudents(mappedStudents);
        setMarks(initialMarks);
        setMarkCriteria(criteriaRes.data);
        setDepartments(deptsRes.data.map((dept: any) => dept.name || dept.shortName || 'N/A'));
        setLoading(false);
        console.log('Initial marks state:', JSON.stringify(initialMarks, null, 2));
      } catch (error) {
        console.error('Fetch error:', error);
        toast.error('Failed to fetch data');
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, parseFloat(value) || 0));
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId] || {},
        [subjectId]: {
          final: numValue,
        },
      },
    }));
  };

  const getStudentMarks = (studentId: string, subjectId: string) => {
    return marks[studentId]?.[subjectId]?.final ?? 0;
  };

  const getGrade = (marks: number) => {
    if (marks >= 90) return 'A+';
    if (marks >= 80) return 'A';
    if (marks >= 70) return 'B+';
    if (marks >= 60) return 'B';
    if (marks >= 50) return 'C';
    return 'F';
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const marksData = Object.entries(marks)
        .flatMap(([studentId, subjects]) =>
          Object.entries(subjects)
            .filter(([_, data]) => data.final != null && !isNaN(data.final)) // Skip null or invalid finals
            .map(([subjectId, data]) => ({
              student_id: studentId,
              subject_id: subjectId,
              final: parseFloat(data.final.toFixed(1)),
              academic_year: '2024-2025',
            }))
        )
        .filter((mark) => {
          // Validate subject_id is a valid ObjectId (24-character hex string)
          const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(mark.subject_id);
          if (!isValidObjectId) {
            console.warn(`Skipping invalid subject_id: ${mark.subject_id}`);
            return false;
          }
          return true;
        });

      if (!marksData.length) {
        toast.error('No valid marks to save');
        setSaving(false);
        return;
      }

      console.log('Sending marks payload:', JSON.stringify({ marks: marksData }, null, 2));
      await axios.post('http://localhost:8000/api/marks', { marks: marksData });
      toast.success('Marks saved successfully!');

      // Refresh students to update marks
      const timestamp = new Date().getTime();
      const studentsRes = await axios.get(`http://localhost:8000/api/students?t=${timestamp}`);
      const initialMarks: MarksData = {};
      const mappedStudents = studentsRes.data.map((student: any) => {
        let studentMarks: { [subjectId: string]: number } = {};
        if (typeof student.marks === 'string') {
          try {
            studentMarks = JSON.parse(student.marks);
          } catch (e) {
            console.error(`Failed to parse marks for student ${student.id}:`, student.marks);
          }
        } else {
          studentMarks = student.marks || {};
        }

        Object.entries(studentMarks).forEach(([subjectId, final]) => {
          initialMarks[student.id] = initialMarks[student.id] || {};
          initialMarks[student.id][subjectId] = { final: Number(final) };
        });

        return {
          id: student.id,
          fullName: student.fullName || 'Unknown',
          registrationNumber: student.registrationNumber || 'N/A',
          department: student.department || 'N/A',
          year: student.yearOfStudy && Number.isInteger(parseInt(student.yearOfStudy)) ? parseInt(student.yearOfStudy) : null,
          yearOfStudy: student.yearOfStudy || 'N/A',
          subjects: student.courses || student.subjects || [],
          marks: studentMarks,
        };
      });

      setStudents(mappedStudents);
      setMarks(initialMarks);
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error: any) {
      console.error('Save marks error:', JSON.stringify(error.response?.data || error.message, null, 2));
      toast.error('Failed to save marks');
      setSaving(false);
    }
  };

  const handleCriteriaSave = async () => {
    setSaving(true);
    try {
      await axios.post('http://localhost:8000/api/mark-criteria', markCriteria);
      toast.success('Mark criteria saved successfully!');
      setSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Save criteria error:', error);
      toast.error('Failed to save mark criteria');
      setSaving(false);
    }
  };

  const filteredStudents = students
    .filter((student) => {
      const matchesSearch =
        (student.fullName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (student.registrationNumber || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDepartment = !selectedDepartment || student.department === selectedDepartment;
      const year = student.year !== undefined && student.year !== null ? student.year : student.yearOfStudy ? parseInt(student.yearOfStudy) : undefined;
      const matchesYear = !selectedYear || (year && year === parseInt(selectedYear));
      return matchesSearch && matchesDepartment && matchesYear;
    })
    .sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);
  const paginatedStudents = filteredStudents.slice(
    (currentPage - 1) * studentsPerPage,
    currentPage * studentsPerPage
  );

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleStudentsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStudentsPerPage(parseInt(e.target.value));
    setCurrentPage(1);
  };

  const formatYear = (student: Student) => {
    const year = student.year !== undefined && student.year !== null ? student.year : student.yearOfStudy ? parseInt(student.yearOfStudy) : undefined;
    if (!year) return 'N/A';
    const suffixes = { 1: 'st', 2: 'nd', 3: 'rd' };
    const suffix = suffixes[year as keyof typeof suffixes] || 'th';
    return `${year}${suffix} Year`;
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">SAT Score Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Manage SAT scores and marking criteria</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('marks')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative
                ${activeTab === 'marks' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              Mark Entry
              {activeTab === 'marks' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
            </button>
            <button
              onClick={() => setActiveTab('criteria')}
              className={`px-6 py-4 text-sm font-medium transition-colors relative
                ${activeTab === 'criteria' ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'}`}
            >
              Mark Criteria
              {activeTab === 'criteria' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />}
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'marks' ? (
            <div className="space-y-6">
              <div className="flex gap-4 flex-wrap">
                <div className="flex-1 relative min-w-[200px]">
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
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
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
                <select
                  value={studentsPerPage}
                  onChange={handleStudentsPerPageChange}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="10">10 per page</option>
                  <option value="20">20 per page</option>
                  <option value="30">30 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left">
                      <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Reg No</th>
                      <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                      <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Department</th>
                      <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Year</th>
                      <th className="pb-4 text-sm font-medium text-gray-500 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {paginatedStudents.map((student) => {
                      console.log(`Student ${student.fullName}:`, {
                        registrationNumber: student.registrationNumber,
                        fullName: student.fullName,
                        department: student.department,
                        year: student.year,
                        yearOfStudy: student.yearOfStudy,
                        subjects: student.subjects,
                        marks: student.marks,
                      });
                      return (
                        <React.Fragment key={student.id}>
                          <tr>
                            <td className="py-4 text-sm text-gray-900 dark:text-white">{student.registrationNumber || 'N/A'}</td>
                            <td className="py-4 text-sm text-gray-900 dark:text-white">{student.fullName}</td>
                            <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{student.department}</td>
                            <td className="py-4 text-sm text-gray-600 dark:text-gray-400">{formatYear(student)}</td>
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
                                  {student.subjects && student.subjects.length > 0 ? (
                                    student.subjects.map((subject) => (
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
                                          placeholder="Final"
                                        />
                                        <span
                                          className={`px-2 py-1 rounded text-xs font-medium
                                          ${getGrade(getStudentMarks(student.id, subject.id)) === 'A+' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' : getGrade(getStudentMarks(student.id, subject.id)) === 'A' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}
                                        >
                                          {getGrade(getStudentMarks(student.id, subject.id))}
                                        </span>
                                      </div>
                                    ))
                                  ) : (
                                    <div className="text-sm text-gray-600 dark:text-gray-400">No subjects assigned to this student.</div>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between mt-4">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Showing {((currentPage - 1) * studentsPerPage) + 1} to {Math.min(currentPage * studentsPerPage, filteredStudents.length)} of {filteredStudents.length} students
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-50"
                  >
                    <ChevronRight size={20} />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Mark Distribution</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Internal Weightage (%)</label>
                    <input
                      type="number"
                      value={markCriteria.internal}
                      onChange={(e) => setMarkCriteria((prev) => ({ ...prev, internal: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">External Weightage (%)</label>
                    <input
                      type="number"
                      value={markCriteria.external}
                      onChange={(e) => setMarkCriteria((prev) => ({ ...prev, external: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Final Mark Calculation Formula</label>
                <input
                  type="text"
                  value={markCriteria.formula}
                  onChange={(e) => setMarkCriteria((prev) => ({ ...prev, formula: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                  placeholder="e.g., (internal * 0.3) + (external * 0.7)"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Use 'internal' and 'external' variables in your formula</p>
              </div>

              <div className="pt-4">
                <button
                  onClick={handleCriteriaSave}
                  disabled={saving}
                  className={`w-full px-6 py-2 rounded-lg font-medium flex items-center justify-center space-x-2 transition-all
                    ${saving || saved ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
                >
                  {saving ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : saved ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <Save className="w-5 h-5" />
                  )}
                  <span>{saving ? 'Saving...' : saved ? 'Saved!' : 'Save Criteria'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {activeTab === 'marks' && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all
              ${saving || saved ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'}`}
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