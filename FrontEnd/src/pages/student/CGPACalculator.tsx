import React, { useState } from 'react';
import { Calculator, Plus, Trash2, Save, AlertCircle, Target } from 'lucide-react';

interface Course {
  id: string;
  name: string;
  credits: number;
  currentGrade: string;
  targetGrade: string;
  semester: number;
}

interface Semester {
  number: number;
  gpa: number;
  totalCredits: number;
}

const gradePoints: Record<string, number> = {
  'O': 10,
  'A+': 9,
  'A': 8,
  'B+': 7,
  'B': 6,
  'C': 5,
  'F': 0,
};

export const CGPACalculator: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [targetCGPA, setTargetCGPA] = useState<number>(9.0);
  const [newCourse, setNewCourse] = useState<Omit<Course, 'id'>>({
    name: '',
    credits: 3,
    currentGrade: 'A',
    targetGrade: 'A+',
    semester: 1,
  });

  const addCourse = () => {
    if (newCourse.name.trim()) {
      setCourses(prev => [...prev, { ...newCourse, id: Date.now().toString() }]);
      setNewCourse(prev => ({ ...prev, name: '' }));
    }
  };

  const removeCourse = (id: string) => {
    setCourses(prev => prev.filter(course => course.id !== id));
  };

  const calculateCurrentCGPA = (): number => {
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalGradePoints = courses.reduce(
      (sum, course) => sum + course.credits * gradePoints[course.currentGrade],
      0
    );
    return totalCredits ? totalGradePoints / totalCredits : 0;
  };

  const calculateTargetCGPA = (): number => {
    const totalCredits = courses.reduce((sum, course) => sum + course.credits, 0);
    const totalGradePoints = courses.reduce(
      (sum, course) => sum + course.credits * gradePoints[course.targetGrade],
      0
    );
    return totalCredits ? totalGradePoints / totalCredits : 0;
  };

  const getRequiredGrades = () => {
    const currentCGPA = calculateCurrentCGPA();
    const remainingCourses = courses.filter(course => 
      gradePoints[course.targetGrade] > gradePoints[course.currentGrade]
    );
    
    return remainingCourses.map(course => {
      const currentPoints = gradePoints[course.currentGrade];
      const requiredPoints = Math.ceil((targetCGPA - currentCGPA) * course.credits + currentPoints);
      const achievableGrade = Object.entries(gradePoints)
        .find(([_, points]) => points >= requiredPoints)?.[0] || 'O';
      
      return {
        ...course,
        requiredGrade: achievableGrade
      };
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">CGPA Calculator</h1>
          <p className="mt-2 text-gray-600 dark:text-gray-300">
            Plan your grades to achieve your target CGPA
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-4 py-2 bg-indigo-100 dark:bg-indigo-900/20 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-300">Current CGPA:</span>
            <span className="ml-2 text-xl font-bold text-indigo-600 dark:text-indigo-400">
              {calculateCurrentCGPA().toFixed(2)}
            </span>
          </div>
          <div className="px-4 py-2 bg-green-100 dark:bg-green-900/20 rounded-lg">
            <span className="text-sm text-gray-600 dark:text-gray-300">Target CGPA:</span>
            <input
              type="number"
              value={targetCGPA}
              onChange={(e) => setTargetCGPA(Number(e.target.value))}
              step="0.1"
              min="0"
              max="10"
              className="ml-2 w-16 bg-transparent text-xl font-bold text-green-600 dark:text-green-400"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Add Course
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="col-span-2">
                <input
                  type="text"
                  placeholder="Course Name"
                  value={newCourse.name}
                  onChange={e => setNewCourse(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <select
                  value={newCourse.credits}
                  onChange={e => setNewCourse(prev => ({ ...prev, credits: parseInt(e.target.value) }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  {[1, 2, 3, 4, 5].map(credit => (
                    <option key={credit} value={credit}>{credit} Credits</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={newCourse.currentGrade}
                  onChange={e => setNewCourse(prev => ({ ...prev, currentGrade: e.target.value }))}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  {Object.keys(gradePoints).map(grade => (
                    <option key={grade} value={grade}>{grade}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <button
                  onClick={addCourse}
                  disabled={!newCourse.name.trim()}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Plus size={20} />
                  Add Course
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Current Courses
            </h2>
            <div className="space-y-4">
              {courses.map(course => (
                <div
                  key={course.id}
                  className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{course.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {course.credits} credits • Current Grade: {course.currentGrade}
                    </p>
                  </div>
                  <button
                    onClick={() => removeCourse(course.id)}
                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Required Grades for Target CGPA
            </h2>
            <div className="space-y-4">
              {getRequiredGrades().map(course => (
                <div
                  key={course.id}
                  className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{course.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {course.credits} credits
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        Current: {course.currentGrade}
                      </div>
                      <div className="text-sm font-medium text-green-600 dark:text-green-400">
                        Required: {course.requiredGrade}
                      </div>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-green-500 rounded-full transition-all"
                      style={{
                        width: `${(gradePoints[course.currentGrade] / 10) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              CGPA Progress
            </h2>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Current CGPA</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {calculateCurrentCGPA().toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 rounded-full transition-all"
                    style={{ width: `${(calculateCurrentCGPA() / 10) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-600 dark:text-gray-400">Target CGPA</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    {targetCGPA.toFixed(2)}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${(targetCGPA / 10) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};