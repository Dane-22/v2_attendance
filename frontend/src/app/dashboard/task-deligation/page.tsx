'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Clock, Calendar, Users, Filter, AlertTriangle } from 'lucide-react';
import { taskApi, Task, TaskStatus, TaskPriority } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import { useAppStore } from '@/store/appStore';
import { useRouter } from 'next/navigation';
import AdminTaskCard from '@/components/tasks/AdminTaskCard';

const columns: { id: TaskStatus; title: string; color: string }[] = [
  { id: 'todo', title: 'To Do', color: 'bg-blue-500' },
  { id: 'in_progress', title: 'In Progress', color: 'bg-yellow-500' },
  { id: 'completed', title: 'Completed', color: 'bg-green-500' },
];

const priorityColors: Record<TaskPriority, string> = {
  low: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  medium: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  high: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function TaskDeligationPage() {
  const { classes } = useTheme();
  const queryClient = useQueryClient();
  const router = useRouter();
  const { user } = useAppStore();

  // Redirect non-super-admin users
  const isSuperAdmin = user?.role === 'super_admin';

  const [filterStatus, setFilterStatus] = useState<TaskStatus | ''>('');
  const [filterPriority, setFilterPriority] = useState<TaskPriority | ''>('');
  const [filterEmployeeId, setFilterEmployeeId] = useState<number | ''>('');

  // Fetch all tasks (admin endpoint)
  const { data: tasksData, isLoading, error } = useQuery({
    queryKey: ['tasks-admin', filterStatus, filterPriority, filterEmployeeId],
    queryFn: () =>
      taskApi
        .getAllAdmin({
          status: filterStatus || undefined,
          priority: filterPriority || undefined,
          employeeId: filterEmployeeId || undefined,
        })
        .then((res) => res.data.data || []),
    enabled: isSuperAdmin,
  });

  const tasks = tasksData || [];

  // Extract unique admins for filter dropdown
  const employees = useMemo(() => {
    const adminMap = new Map<number, { id: number; name: string; role: string | null }>();
    tasks.forEach((t: any) => {
      if (t.admin && !adminMap.has(t.admin.id)) {
        const name = t.admin.name || t.admin.username || `Admin #${t.admin.id}`;
        adminMap.set(t.admin.id, { id: t.admin.id, name, role: t.admin.role });
      }
    });
    return Array.from(adminMap.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [tasks]);

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter((t: any) => t.status === 'todo'),
    in_progress: tasks.filter((t: any) => t.status === 'in_progress'),
    completed: tasks.filter((t: any) => t.status === 'completed'),
  };

  // Statistics
  const stats = {
    total: tasks.length,
    todo: tasksByStatus.todo.length,
    inProgress: tasksByStatus.in_progress.length,
    completed: tasksByStatus.completed.length,
    overdue: tasks.filter((t: any) => t.dueDate && new Date(t.dueDate) < new Date() && t.status !== 'completed').length,
    activeTimers: tasks.filter((t: any) => t.isTimerRunning).length,
    totalTimeSpent: tasks.reduce((sum: number, t: any) => sum + (t.totalTimeSpent || 0), 0),
  };

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      taskApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-admin'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks-admin'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleMoveTask = (taskId: number, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Access denied view
  if (!isSuperAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-8 text-center max-w-md`}>
          <Shield className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className={`text-xl font-bold ${classes.text} mb-2`}>Access Denied</h2>
          <p className={`${classes.textMuted} mb-4`}>
            This page is restricted to Super Admin only.
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-4 py-2 bg-[#facc15] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${classes.text}`}>
            Task <span className="text-[#facc15]">Deligation</span>
          </h1>
          <p className={`${classes.textMuted} mt-1`}>
            Oversee all tasks across employees
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#facc15]" />
          <span className={`text-sm font-medium ${classes.textMuted}`}>Super Admin View</span>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className={`text-2xl font-bold ${classes.text}`}>{stats.todo}</p>
              <p className={`text-xs ${classes.textMuted}`}>To Do</p>
            </div>
          </div>
        </div>
        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-400">{stats.inProgress}</p>
              <p className={`text-xs ${classes.textMuted}`}>In Progress</p>
            </div>
          </div>
        </div>
        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-400">{stats.completed}</p>
              <p className={`text-xs ${classes.textMuted}`}>Completed</p>
            </div>
          </div>
        </div>
        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#facc15]/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-[#facc15]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#facc15]">{stats.total}</p>
              <p className={`text-xs ${classes.textMuted}`}>Total Tasks</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Stats */}
      <div className={`flex flex-wrap items-center gap-4 ${classes.textMuted} text-sm`}>
        <span className="flex items-center gap-1">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          {stats.overdue} overdue
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-green-400" />
          {stats.activeTimers} active timers
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-4 h-4 text-[#facc15]" />
          Total time: {formatTime(stats.totalTimeSpent)}
        </span>
      </div>

      {/* Filters */}
      <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className={`w-4 h-4 ${classes.textMuted}`} />
          <span className={`text-sm font-medium ${classes.text}`}>Filters</span>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as TaskStatus | '')}
            className={`px-3 py-2 rounded-lg ${classes.bgSurface} ${classes.border} ${classes.text} text-sm focus:outline-none focus:border-[#facc15]`}
          >
            <option value="">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value as TaskPriority | '')}
            className={`px-3 py-2 rounded-lg ${classes.bgSurface} ${classes.border} ${classes.text} text-sm focus:outline-none focus:border-[#facc15]`}
          >
            <option value="">All Priorities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <select
            value={filterEmployeeId}
            onChange={(e) => setFilterEmployeeId(e.target.value ? parseInt(e.target.value) : '')}
            className={`px-3 py-2 rounded-lg ${classes.bgSurface} ${classes.border} ${classes.text} text-sm focus:outline-none focus:border-[#facc15] min-w-[160px]`}
          >
            <option value="">All Employees</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} {emp.role ? `(${emp.role})` : ''}
              </option>
            ))}
          </select>
          {(filterStatus || filterPriority || filterEmployeeId) && (
            <button
              onClick={() => { setFilterStatus(''); setFilterPriority(''); setFilterEmployeeId(''); }}
              className={`px-3 py-2 rounded-lg text-sm ${classes.textMuted} ${classes.hover} transition-colors`}
            >
              Clear filters
            </button>
          )}
        </div>
      </div>

      {/* Kanban Board */}
      {isLoading ? (
        <div className={`text-center py-12 ${classes.textMuted}`}>Loading tasks...</div>
      ) : error ? (
        <div className="text-center py-12 text-red-400">
          Failed to load tasks. Please try again.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((column) => (
            <div
              key={column.id}
              className={`${classes.bgCard} rounded-xl ${classes.border} flex flex-col min-h-[500px]`}
            >
              {/* Column Header */}
              <div className={`flex items-center justify-between p-4 border-b ${classes.border}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${column.color}`} />
                  <h3 className={`font-semibold ${classes.text}`}>{column.title}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${classes.bgCardHover} ${classes.textMuted}`}>
                    {tasksByStatus[column.id].length}
                  </span>
                </div>
              </div>

              {/* Task List */}
              <div className="flex-1 p-3 space-y-3 overflow-y-auto max-h-[calc(100vh-300px)]">
                {tasksByStatus[column.id].map((task: any) => (
                  <AdminTaskCard
                    key={task.id}
                    task={task}
                    onMove={handleMoveTask}
                    onDelete={(id: number) => deleteMutation.mutate(id)}
                    priorityColors={priorityColors}
                    formatTime={formatTime}
                  />
                ))}
                {tasksByStatus[column.id].length === 0 && (
                  <div className={`text-center py-8 ${classes.textMuted} text-sm`}>
                    No tasks
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
