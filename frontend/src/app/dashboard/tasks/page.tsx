'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Clock, Play, Square, Calendar, Tag, AlertCircle } from 'lucide-react';
import { taskApi, Task, TaskStatus, TaskPriority } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
import TaskCard from '@/components/tasks/TaskCard';
import TaskFormModal from '@/components/tasks/TaskFormModal';

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

export default function TaskManagementPage() {
  const { classes } = useTheme();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Fetch all tasks
  const { data: tasksData, isLoading } = useQuery({
    queryKey: ['tasks'],
    queryFn: () => taskApi.getAll().then((res) => res.data.data || []),
  });

  const tasks = tasksData || [];

  // Group tasks by status
  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    in_progress: tasks.filter((t) => t.status === 'in_progress'),
    completed: tasks.filter((t) => t.status === 'completed'),
  };

  // Update task status mutation
  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: TaskStatus }) =>
      taskApi.update(id, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  // Delete task mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => taskApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const handleMoveTask = (taskId: number, newStatus: TaskStatus) => {
    updateStatusMutation.mutate({ id: taskId, status: newStatus });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${classes.text}`}>
            Task <span className="text-[#facc15]">Management</span>
          </h1>
          <p className={`${classes.textMuted} mt-1`}>
            Organize your work with Kanban boards and time tracking
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#facc15] text-black font-semibold rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
        >
          <Plus className="w-5 h-5" />
          Add Task
        </button>
      </div>

      {/* Kanban Board */}
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
              {tasksByStatus[column.id].map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onMove={handleMoveTask}
                  onEdit={handleEditTask}
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

      {/* Task Form Modal */}
      <TaskFormModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        task={editingTask}
        priorityColors={priorityColors}
      />
    </div>
  );
}
