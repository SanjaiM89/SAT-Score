import React, { useState, useEffect, useRef } from 'react';
import { Save, AlertCircle, Search } from 'lucide-react';
import toast from 'react-hot-toast';
import axios from 'axios';
import { useNavigate, useLocation } from 'react-router-dom';

// Set up axios interceptor to include JWT
axios.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

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
      mark: number;
    };
  };
}

interface MarkEntry {
  student_id: string;
  subject_id: string;
  mark: number;
  academic_year: string;
}

export const MarksEntry = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [marks, setMarks] = useState<MarksData>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedYear, setSelectedYear] = useState('');
  const [students, setStudents] = useState<Student[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const isMounted = useRef(true);

  const refreshToken = async () => {
    console.log(`[${new Date().toISOString()}] MarksEntry: Attempting token refresh at ${location.pathname}`);
    try {
      const response = await axios.post('http://localhost:8000/api/refresh', {}, { withCredentials: true });
      const { access_token } = response.data;
      localStorage.setItem('token', access_token);
      console.log(`[${new Date().toISOString()}] MarksEntry: Token refreshed successfully`);
      return access_token;
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] MarksEntry: Refresh token failed:`, error.response?.data || error.message);
      throw error;
    }
  };

  useEffect(() => {
    isMounted.current = true;
    console.log(`[${new Date().toISOString()}] MarksEntry: Mounting at ${location.pathname}`);

    const fetchData = async () => {
      console.log(`[${new Date().toISOString()}] MarksEntry: Fetching data at ${location.pathname}`);
      try {
        const timestamp = new Date().getTime();
        const [studentsRes, subjectsRes] = await Promise.all([
          axios.get(`http://localhost:8000/api/students?t=${timestamp}`).then((res) => {
            console.log(`[${new Date().toISOString()}] MarksEntry: /api/students response:`, res.data);
            return res;
          }),
          axios.get(`http://localhost:8000/api/subjects?t=${timestamp}`).then((res) => {
            console.log(`[${new Date().toISOString()}] MarksEntry: /api/subjects response:`, res.data);
            return res;
          }),
        ]);

        let marksRes;
        try {
          marksRes = await axios.get(`http://localhost:8000/api/assign-marks?t=${timestamp}`);
          console.log(`[${new Date().toISOString()}] MarksEntry: /api/assign-marks response:`, marksRes.data);
        } catch (marksError: any) {
          if (marksError.response?.status === 405) {
            console.warn(`[${new Date().toISOString()}] MarksEntry: /api/assign-marks returned 405, assuming no marks data`);
            marksRes = { data: [] }; // Fallback to empty marks
          } else {
            throw marksError;
          }
        }

        if (!isMounted.current) return;

        const mappedStudents = studentsRes.data.map((student: any) => ({
          id: student.id,
          name: student.fullName || 'Unknown',
          rollNumber: student.registrationNumber || 'N/A',
          department: student.department || 'N/A',
          year: student.yearOfStudy && Number.isInteger(parseInt(student.yearOfStudy)) ? parseInt(student.yearOfStudy) : 0,
          subjects: student.courses || [],
        }));

        const mappedSubjects = subjectsRes.data.map((subject: any) => ({
          id: subject.id,
          code: subject.code || 'N/A',
          name: subject.name || 'Unknown',
        }));

        const initialMarks: MarksData = {};
        marksRes.data.forEach((mark: MarkEntry) => {
          initialMarks[mark.student_id] = initialMarks[mark.student_id] || {};
          initialMarks[mark.student_id][mark.subject_id] = { mark: mark.mark || 0 };
        });

        setStudents(mappedStudents);
        setSubjects(mappedSubjects);
        setMarks(initialMarks);
        setLoading(false);
      } catch (error: any) {
        console.error(`[${new Date().toISOString()}] MarksEntry: Fetch error:`, error.response?.data || error.message);
        if (error.response?.status === 401 && isMounted.current) {
          console.warn(`[${new Date().toISOString()}] MarksEntry: 401 Unauthorized, attempting token refresh`);
          try {
            await refreshToken();
            const timestamp = new Date().getTime();
            const [studentsRes, subjectsRes] = await Promise.all([
              axios.get(`http://localhost:8000/api/students?t=${timestamp}`),
              axios.get(`http://localhost:8000/api/subjects?t=${timestamp}`),
            ]);

            let marksRes;
            try {
              marksRes = await axios.get(`http://localhost:8000/api/assign-marks?t=${timestamp}`);
              console.log(`[${new Date().toISOString()}] MarksEntry: /api/assign-marks response after refresh:`, marksRes.data);
            } catch (marksError: any) {
              if (marksError.response?.status === 405) {
                console.warn(`[${new Date().toISOString()}] MarksEntry: /api/assign-marks GET returned 405 after refresh, skipping`);
                marksRes = { data: [] }; // Use empty array as fallback
              } else {
                throw marksError;
              }
            }

            if (!isMounted.current) return;

            const mappedStudents = studentsRes.data.map((student: any) => ({
              id: student.id,
              name: student.fullName || 'Unknown',
              rollNumber: student.registrationNumber || 'N/A',
              department: student.department || 'N/A',
              year: student.yearOfStudy && Number.isInteger(parseInt(student.yearOfStudy)) ? parseInt(student.yearOfStudy) : 0,
              subjects: student.courses || [],
            }));

            const mappedSubjects = subjectsRes.data.map((subject: any) => ({
              id: subject.id,
              code: subject.code || 'N/A',
              name: subject.name || 'Unknown',
            }));

            const initialMarks: MarksData = {};
            marksRes.data.forEach((mark: MarkEntry) => {
              initialMarks[mark.student_id] = initialMarks[mark.student_id] || {};
              initialMarks[mark.student_id][mark.subject_id] = { mark: mark.mark || 0 };
            });

            setStudents(mappedStudents);
            setSubjects(mappedSubjects);
            setMarks(initialMarks);
            setLoading(false);
          } catch (refreshError) {
            console.warn(`[${new Date().toISOString()}] MarksEntry: Refresh failed, redirecting to /login`);
            if (isMounted.current) {
              toast.error('Session expired. Please log in again.');
              localStorage.removeItem('auth');
              localStorage.removeItem('token');
              navigate('/login', { replace: true });
            }
          }
        } else {
          if (isMounted.current) {
            toast.error(`Failed to fetch data: ${error.response?.data?.detail || error.message}`);
            setLoading(false);
          }
        }
      }
    };

    fetchData();
    return () => {
      isMounted.current = false;
      console.log(`[${new Date().toISOString()}] MarksEntry: Cleaning up useEffect at ${location.pathname}`);
    };
  }, [navigate, location.pathname]);

  const handleMarkChange = (studentId: string, subjectId: string, value: string) => {
    const numValue = value === '' ? 0 : Math.min(100, Math.max(0, Number(value)));
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId] || {},
        [subjectId]: { mark: numValue },
      },
    }));
  };

  const getMark = (studentId: string, subjectId: string) => {
    return marks[studentId]?.[subjectId]?.mark || 0;
  };

  const handleSave = async () => {
    console.log(`[${new Date().toISOString()}] MarksEntry: Saving marks at ${location.pathname}`);
    setSaving(true);
    try {
      if (!selectedSubject) {
        toast.error('Please select a subject');
        setSaving(false);
        return;
      }

      const marksData = Object.entries(marks)
        .flatMap(([studentId, subjects]) =>
          Object.entries(subjects)
            .filter(([subjectId]) => subjectId === selectedSubject)
            .map(([subjectId, data]) => ({
              student_id: studentId,
              subject_id: subjectId,
              mark: parseFloat(data.mark.toFixed(1)),
              academic_year: '2024-2025',
            }))
        )
        .filter((mark) => mark.mark >= 0);

      if (!marksData.length) {
        toast.error('No valid marks to save');
        setSaving(false);
        return;
      }

      console.log(`[${new Date().toISOString()}] MarksEntry: Sending marks payload:`, marksData);
      await axios.post('http://localhost:8000/api/assign-marks', { marks: marksData });
      toast.success('Marks saved successfully!');
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);

      const timestamp = new Date().getTime();
      let marksRes;
      try {
        marksRes = await axios.get(`http://localhost:8000/api/assign-marks?t=${timestamp}`);
        console.log(`[${new Date().toISOString()}] MarksEntry: Refreshed /api/assign-marks response:`, marksRes.data);
      } catch (marksError: any) {
        if (marksError.response?.status === 405) {
          console.warn(`[${new Date().toISOString()}] MarksEntry: /api/assign-marks GET returned 405, skipping refresh`);
          marksRes = { data: marksData }; // Use submitted data as fallback
        } else {
          throw marksError;
        }
      }

      const initialMarks: MarksData = {};
      marksRes.data.forEach((mark: MarkEntry) => {
        initialMarks[mark.student_id] = initialMarks[mark.student_id] || {};
        initialMarks[mark.student_id][mark.subject_id] = { mark: mark.mark || 0 };
      });
      setMarks(initialMarks);
    } catch (error: any) {
      console.error(`[${new Date().toISOString()}] MarksEntry: Save marks error:`, error.response?.data || error.message);
      if (error.response?.status === 401 && isMounted.current) {
        console.warn(`[${new Date().toISOString()}] MarksEntry: 401 Unauthorized on save, attempting token refresh`);
        try {
          await refreshToken();
          const marksData = Object.entries(marks)
            .flatMap(([studentId, subjects]) =>
              Object.entries(subjects)
                .filter(([subjectId]) => subjectId === selectedSubject)
                .map(([subjectId, data]) => ({
                  student_id: studentId,
                  subject_id: subjectId,
                  mark: parseFloat(data.mark.toFixed(1)),
                  academic_year: '2024-2025',
                }))
            )
            .filter((mark) => mark.mark >= 0);
          await axios.post('http://localhost:8000/api/assign-marks', { marks: marksData });
          toast.success('Marks saved successfully!');
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);

          const timestamp = new Date().getTime();
          let marksRes;
          try {
            marksRes = await axios.get(`http://localhost:8000/api/assign-marks?t=${timestamp}`);
            console.log(`[${new Date().toISOString()}] MarksEntry: Refreshed /api/assign-marks response after refresh:`, marksRes.data);
          } catch (marksError: any) {
            if (marksError.response?.status === 405) {
              console.warn(`[${new Date().toISOString()}] MarksEntry: /api/assign-marks GET returned 405 after refresh, skipping`);
              marksRes = { data: marksData };
            } else {
              throw marksError;
            }
          }

          const initialMarks: MarksData = {};
          marksRes.data.forEach((mark: MarkEntry) => {
            initialMarks[mark.student_id] = initialMarks[mark.student_id] || {};
            initialMarks[mark.student_id][mark.subject_id] = { mark: mark.mark || 0 };
          });
          setMarks(initialMarks);
        } catch (refreshError) {
          console.warn(`[${new Date().toISOString()}] MarksEntry: Refresh failed, redirecting to /login`);
          if (isMounted.current) {
            toast.error('Session expired. Please log in again.');
            localStorage.removeItem('auth');
            localStorage.removeItem('token');
            navigate('/login', { replace: true });
          }
        }
      } else {
        toast.error(`Failed to save marks: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setSaving(false);
    }
  };

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.rollNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = !selectedDepartment || student.department === selectedDepartment;
    const matchesYear = !selectedYear || student.year === parseInt(selectedYear);
    const hasSubject = selectedSubject ? student.subjects.some((s) => s.id === selectedSubject) : true;
    return matchesSearch && matchesDepartment && matchesYear && hasSubject;
  });

  if (loading) {
    console.log(`[${new Date().toISOString()}] MarksEntry: Loading at ${location.pathname}`);
    return <div>Loading...</div>;
  }

  console.log(`[${new Date().toISOString()}] MarksEntry: Rendering at ${location.pathname}`);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Marks Entry</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Enter marks for students</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Select Subject</label>
              <select
                value={selectedSubject || ''}
                onChange={(e) => setSelectedSubject(e.target.value || null)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">Select a subject</option>
                {subjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>
                    {subject.name} ({subject.code})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
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

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Department</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Departments</option>
                {[...new Set(students.map((s) => s.department))].map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Year</label>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="">All Years</option>
                {[1, 2, 3, 4].map((year) => (
                  <option key={year} value={year}>
                    {year} Year
                  </option>
                ))}
              </select>
            </div>
          </div>

          {selectedSubject ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Roll No</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Name</th>
                    <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">Mark</th>
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
                          value={getMark(student.id, selectedSubject) || ''}
                          onChange={(e) => handleMarkChange(student.id, selectedSubject, e.target.value)}
                          className="w-20 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                          placeholder="Mark"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <p className="text-gray-600 dark:text-gray-300">Select a subject to enter marks</p>
            </div>
          )}
        </div>
      </div>

      {selectedSubject && (
        <div className="flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 rounded-lg font-medium flex items-center space-x-2 transition-all ${
              saving || saved ? 'bg-green-500 text-white' : 'bg-indigo-600 hover:bg-indigo-700 text-white'
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