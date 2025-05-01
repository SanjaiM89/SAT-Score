import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, Search, MessageSquare } from 'lucide-react';
import { QueryModal } from '../../components/modals/QueryModal';

interface Result {
  semester: number;
  subjectCode: string;
  subjectName: string;
  credits: number;
  internal: number;
  external: number;
  total: number;
  grade: string;
  gradePoint: number;
}

const mockResults: Record<number, Result[]> = {
  1: [
    {
      semester: 1,
      subjectCode: 'CS101',
      subjectName: 'Introduction to Programming',
      credits: 4,
      internal: 45,
      external: 85,
      total: 85,
      grade: 'A',
      gradePoint: 9,
    },
    // Add more subjects for semester 1
  ],
  2: [
    {
      semester: 2,
      subjectCode: 'CS201',
      subjectName: 'Data Structures',
      credits: 4,
      internal: 42,
      external: 88,
      total: 88,
      grade: 'A+',
      gradePoint: 10,
    },
    // Add more subjects for semester 2
  ],
};

export const Results: React.FC = () => {
  const [expandedSemester, setExpandedSemester] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<{ code: string; name: string } | null>(null);

  const toggleSemester = (semester: number) => {
    setExpandedSemester(expandedSemester === semester ? null : semester);
  };

  const downloadPDF = (semester: number) => {
    // Implement PDF download logic
    console.log(`Downloading PDF for semester ${semester}`);
  };

  const handleOpenQuery = (code: string, name: string) => {
    setSelectedSubject({ code, name });
    setQueryModalOpen(true);
  };

  const calculateSemesterGPA = (results: Result[]) => {
    const totalCredits = results.reduce((sum, result) => sum + result.credits, 0);
    const totalGradePoints = results.reduce(
      (sum, result) => sum + result.credits * result.gradePoint,
      0
    );
    return (totalGradePoints / totalCredits).toFixed(2);
  };

  const filteredResults = Object.entries(mockResults).reduce(
    (acc, [semester, results]) => {
      const filtered = results.filter(
        (result) =>
          result.subjectName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          result.subjectCode.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (filtered.length > 0) {
        acc[Number(semester)] = filtered;
      }
      return acc;
    },
    {} as Record<number, Result[]>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Semester Results
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search subjects..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
      </div>

      <div className="space-y-4">
        {Object.entries(filteredResults).map(([semester, results]) => (
          <div
            key={semester}
            className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden"
          >
            <button
              onClick={() => toggleSemester(Number(semester))}
              className="w-full px-6 py-4 flex items-center justify-between bg-gray-50 dark:bg-gray-700"
            >
              <div className="flex items-center space-x-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Semester {semester}
                </h2>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400 rounded-full text-sm">
                  GPA: {calculateSemesterGPA(results)}
                </span>
              </div>
              <div className="flex items-center space-x-4">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    downloadPDF(Number(semester));
                  }}
                  className="flex items-center space-x-2 px-3 py-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors"
                >
                  <Download size={16} />
                  <span>Download PDF</span>
                </button>
                {expandedSemester === Number(semester) ? (
                  <ChevronUp className="text-gray-500" />
                ) : (
                  <ChevronDown className="text-gray-500" />
                )}
              </div>
            </button>

            {expandedSemester === Number(semester) && (
              <div className="p-6">
                <table className="w-full">
                  <thead>
                    <tr className="text-left border-b border-gray-200 dark:border-gray-700">
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Code
                      </th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Subject
                      </th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Credits
                      </th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Internal
                      </th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        External
                      </th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Total
                      </th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Grade
                      </th>
                      <th className="pb-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {results.map((result) => (
                      <tr key={result.subjectCode}>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">
                          {result.subjectCode}
                        </td>
                        <td className="py-4 text-sm text-gray-900 dark:text-white">
                          {result.subjectName}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {result.credits}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {result.internal}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {result.external}
                        </td>
                        <td className="py-4 text-sm text-gray-600 dark:text-gray-400">
                          {result.total}
                        </td>
                        <td className="py-4">
                          <span
                            className={`px-2 py-1 rounded text-sm font-medium
                              ${result.grade === 'A+' ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' :
                              result.grade === 'A' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400' :
                              'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'}`}
                          >
                            {result.grade}
                          </span>
                        </td>
                        <td className="py-4">
                          <button
                            onClick={() => handleOpenQuery(result.subjectCode, result.subjectName)}
                            className="flex items-center space-x-1 text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300"
                          >
                            <MessageSquare size={16} />
                            <span>Raise Query</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ))}
      </div>

      {selectedSubject && (
        <QueryModal
          isOpen={queryModalOpen}
          onClose={() => {
            setQueryModalOpen(false);
            setSelectedSubject(null);
          }}
          subject={selectedSubject}
        />
      )}
    </div>
  );
};