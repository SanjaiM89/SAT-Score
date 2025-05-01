import React from 'react';
import { BarChart as BarChartIcon, PieChart as PieChartIcon, TrendingUp, Users, BookOpen, GraduationCap, Award, Target } from 'lucide-react';

interface StatCard {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down';
  icon: React.ElementType;
  color: string;
}

const stats: StatCard[] = [
  { 
    title: 'Total Students', 
    value: '850', 
    change: '+5%', 
    trend: 'up',
    icon: Users,
    color: 'bg-blue-500'
  },
  { 
    title: 'Pass Percentage', 
    value: '92%', 
    change: '+2%', 
    trend: 'up',
    icon: Target,
    color: 'bg-green-500'
  },
  { 
    title: 'Average CGPA', 
    value: '8.2', 
    change: '+0.3', 
    trend: 'up',
    icon: Award,
    color: 'bg-purple-500'
  },
  { 
    title: 'Fail Percentage', 
    value: '8%', 
    change: '-2%', 
    trend: 'down',
    icon: TrendingUp,
    color: 'bg-red-500'
  },
];

const departmentPerformance = [
  { name: 'Computer Science', passRate: 95, avgCGPA: 8.5 },
  { name: 'Electronics', passRate: 88, avgCGPA: 8.2 },
  { name: 'Mechanical', passRate: 90, avgCGPA: 8.0 },
  { name: 'Civil', passRate: 92, avgCGPA: 8.3 },
];

const gradeDistribution = [
  { grade: 'O', percentage: 15 },
  { grade: 'A+', percentage: 25 },
  { grade: 'A', percentage: 30 },
  { grade: 'B+', percentage: 20 },
  { grade: 'B', percentage: 8 },
  { grade: 'C', percentage: 2 },
];

export const Analytics = () => {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Analytics Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">
          Comprehensive overview of academic performance metrics
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
                <div className="flex items-baseline">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                  <span className={`ml-2 text-sm ${
                    stat.trend === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Department Performance
          </h2>
          <div className="space-y-4">
            {departmentPerformance.map((dept) => (
              <div key={dept.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {dept.name}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    Pass Rate: {dept.passRate}% | Avg CGPA: {dept.avgCGPA}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-600 dark:bg-indigo-400 rounded-full"
                    style={{ width: `${dept.passRate}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Grade Distribution
          </h2>
          <div className="grid grid-cols-6 gap-4">
            {gradeDistribution.map((grade) => (
              <div key={grade.grade} className="space-y-2">
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg relative">
                  <div
                    className="absolute bottom-0 left-0 right-0 bg-indigo-600 dark:bg-indigo-400 rounded-b-lg transition-all"
                    style={{ height: `${grade.percentage}%` }}
                  />
                </div>
                <div className="text-center">
                  <div className="text-sm font-medium text-gray-900 dark:text-white">
                    {grade.grade}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {grade.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Semester-wise Performance
          </h2>
          <div className="h-64 flex items-center justify-center">
            <TrendingUp size={48} className="text-gray-400" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
            Subject-wise Analysis
          </h2>
          <div className="h-64 flex items-center justify-center">
            <BarChartIcon size={48} className="text-gray-400" />
          </div>
        </div>
      </div>
    </div>
  );
};