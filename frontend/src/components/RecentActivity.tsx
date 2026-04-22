/**
 * Recent Activity Component
 * Displays live scan feed for the selected branch
 */

import { useState, useEffect } from 'react';
import { Clock, LogIn, LogOut, UserX } from 'lucide-react';

interface Activity {
  type: 'clock_in' | 'clock_out' | 'mark_absent';
  employeeName: string;
  employeeCode: string;
  branchCode: string;
  timestamp: string;
}

export default function RecentActivity({ branchCode }: { branchCode: string }) {
  const [activities, setActivities] = useState<Activity[]>([]);

  useEffect(() => {
    if (!branchCode) return;

    // In a real implementation, this would listen to WebSocket events
    // For now, we'll show a placeholder
    const placeholderActivities: Activity[] = [
      {
        type: 'clock_in',
        employeeName: 'John Doe',
        employeeCode: 'E0001',
        branchCode: branchCode,
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
      },
      {
        type: 'clock_in',
        employeeName: 'Jane Smith',
        employeeCode: 'E0002',
        branchCode: branchCode,
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      },
    ];

    setActivities(placeholderActivities);

    // TODO: Add WebSocket listener for real-time updates
    // const { on } = useWebSocket();
    // on('attendance:update', (data) => {
    //   setActivities(prev => [data, ...prev].slice(0, 10));
    // });
  }, [branchCode]);

  if (activities.length === 0) {
    return null;
  }

  const getIcon = (type: Activity['type']) => {
    switch (type) {
      case 'clock_in':
        return <LogIn className="w-4 h-4 text-green-400" />;
      case 'clock_out':
        return <LogOut className="w-4 h-4 text-blue-400" />;
      case 'mark_absent':
        return <UserX className="w-4 h-4 text-red-400" />;
      default:
        return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock className="w-4 h-4 text-[#facc15]" />
        <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
          Recent Activity
        </h3>
      </div>
      <div className="space-y-2">
        {activities.slice(0, 5).map((activity, index) => (
          <div
            key={index}
            className="flex items-center gap-3 p-2 bg-[#1a1a1a] rounded-lg border border-[#262626]"
          >
            <div className="p-2 bg-[#0a0a0a] rounded-full">
              {getIcon(activity.type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white font-medium truncate">
                {activity.employeeName}
              </p>
              <p className="text-xs text-gray-500">
                {activity.type === 'clock_in' ? 'Clocked in' : activity.type === 'clock_out' ? 'Clocked out' : 'Marked absent'}
              </p>
            </div>
            <span className="text-xs text-gray-500 whitespace-nowrap">
              {formatTime(activity.timestamp)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
