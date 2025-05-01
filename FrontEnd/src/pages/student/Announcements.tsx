import React from 'react';
import { Bell, Calendar } from 'lucide-react';

interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'general' | 'exam' | 'event';
}

const announcements: Announcement[] = [
  {
    id: '1',
    title: 'Mid-Semester Examination Schedule',
    content: 'The mid-semester examinations will begin from March 15th, 2024. The detailed schedule has been uploaded to the portal.',
    date: '2024-03-01',
    type: 'exam'
  },
  {
    id: '2',
    title: 'Annual Technical Symposium',
    content: 'Register now for TechFest 2024! Exciting events, workshops, and prizes await.',
    date: '2024-03-10',
    type: 'event'
  }
];

export const Announcements = () => {
  const getTypeColor = (type: Announcement['type']) => {
    switch (type) {
      case 'exam':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      case 'event':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      default:
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Announcements</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">Stay updated with the latest announcements</p>
      </div>

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6"
          >
            <div className="flex items-start space-x-4">
              <div className={`p-2 rounded-lg ${getTypeColor(announcement.type)}`}>
                <Bell size={20} />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {announcement.title}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-sm text-gray-500 dark:text-gray-400">
                  <Calendar size={14} />
                  {announcement.date}
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(announcement.type)}`}>
                    {announcement.type}
                  </span>
                </div>
                <p className="mt-3 text-gray-600 dark:text-gray-300">{announcement.content}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};