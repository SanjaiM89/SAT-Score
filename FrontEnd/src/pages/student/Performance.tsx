import React, { useState } from 'react';
import { LineChart, BarChart, PieChart, Trophy, TrendingUp, Target, BookOpen } from 'lucide-react';

interface PerformanceMetrics {
  overallCGPA: number;
  totalCredits: number;
  completedCredits: number;
  currentSemester: number;
  strengthSubjects: string[];
  improvementAreas: string[];
  semesterProgress: {
    semester: number;
    gpa: number;
    subjects: number;
    credits: number;
  }[];
  subjectPerformance: {
    name: string;
    code: string;
    score: number;
    average: number;
    highest: number;
  }[];
}

const mockMetrics: PerformanceMetrics = {
  overallCGPA: 8.75,
  totalCredits: 180,
  completedCredits: 120,
  currentSemester: 6,
  strengthSubjects: ['Data Structures', 'Database Systems', 'Web Technologies'],
  improvementAreas: ['Computer Networks', 'Operating Systems'],
  semesterProgress: [
    { semester: 1, gpa: 8.2, subjects: 6, credits: 24 },
    { semester: 2, gpa: 8.5, subjects: 6, credits: 24 },
    { semester: 3, gpa: 8.8, subjects: 7, credits: 28 },
    { semester: 4, gpa: 9.0, subjects: 6, credits: 24 },
    { semester: 5, gpa: 9.2, subjects: 5, credits: 20 },
  ],
  subjectPerformance: [
    { name: 'Data Structures', code: 'CS201', score: 92, average: 75, highest: 95 },
    { name: 'Database Systems', code: 'CS202', score: 88, average: 72, highest: 90 },
    { name: 'Computer Networks', code: 'CS203', score: 76, average: 70, highest: 88 },
    { name: 'Operating Systems', code: 'CS204', score: 78, average: 68, highest: 92 },
    { name: 'Web Technologies', code: 'CS205', score: 90, average: 74, highest: 94 },
  ],
};

const stats = [
  {
    title: 'Overall CGPA',
    value: mockMetrics.overallCGPA.toFixed(2),
    icon: Trophy,
    color: 'bg-yellow-500',
    trend: '+0.2 from last semester',
  },
  {
    title: 'Credits Completed',
    value: `${mockMetrics.completedCredits}/${mockMetrics.totalCredits}`,
    icon: Target,
    color: 'bg-blue-500',
    trend: '67% completion',
  },
  {
    title: 'Current Semester',
    value: mockMetrics.currentSemester.toString(),
    icon: BookOpen,
    color: 'bg-green-500',
    trend: '2 semesters remaining',
  },
  {
    title: 'Performance Trend',
    value: 'Improving',
    icon: TrendingUp,
    color: 'bg-purple-500',
    trend: '+5% overall improvement',
  },
];

export const Performance: React.FC = () => {
  const [selectedMetric, setSelectedMetric] = useState<'gpa' | 'credits'>('gpa');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Performance Analytics</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Track your academic progress and identify areas for improvement
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{stat.trend}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Semester Progress
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setSelectedMetric('gpa')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
                  ${selectedMetric === 'gpa'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
              >
                GPA
              </button>
              <button
                onClick={() => setSelectedMetric('credits')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors
                  ${selectedMetric === 'credits'
                    ? 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                  }`}
              >
                Credits
              </button>
            </div>
          </div>
          <div className="h-64 relative">
            {/* Placeholder for chart - implement with your preferred charting library */}
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 dark:text-gray-600">
              <LineChart size={48} />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Subject Performance
          </h2>
          <div className="space-y-4">
            {mockMetrics.subjectPerformance.map((subject) => (
              <div key={subject.code} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {subject.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {subject.code}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {subject.score}%
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Avg: {subject.average}% | High: {subject.highest}%
                    </p>
                  </div>
                </div>
                <div className="relative pt-1">
                  <div className="flex mb-2 items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-indigo-600 bg-indigo-200 dark:bg-indigo-900/20">
                        Your Score
                      </span>
                    </div>
                  </div>
                  <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700">
                    <div
                      style={{ width: `${(subject.score / subject.highest) * 100}%` }}
                      className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-indigo-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Areas of Strength
          </h2>
          <div className="space-y-4">
            {mockMetrics.strengthSubjects.map((subject, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg"
              >
                <Trophy className="w-5 h-5 text-green-500 dark:text-green-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {subject}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            Areas for Improvement
          </h2>
          <div className="space-y-4">
            {mockMetrics.improvementAreas.map((subject, index) => (
              <div
                key={index}
                className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg"
              >
                <Target className="w-5 h-5 text-yellow-500 dark:text-yellow-400" />
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {subject}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};