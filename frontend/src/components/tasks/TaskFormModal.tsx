'use client';

import { useState, useEffect } from 'react';
import { X, Plus, Calendar, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { taskApi, Task, TaskPriority, CreateTaskRequest, UpdateTaskRequest } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: Task | null;
  priorityColors: Record<TaskPriority, string>;
}

export default function TaskFormModal({ isOpen, onClose, task, priorityColors }: TaskFormModalProps) {
  const { classes } = useTheme();
  const queryClient = useQueryClient();
  const isEditing = !!task;

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [labels, setLabels] = useState<string[]>([]);
  const [newLabel, setNewLabel] = useState('');

  // Reset form when modal opens/closes or task changes
  useEffect(() => {
    if (isOpen) {
      if (task) {
        setTitle(task.title);
        setDescription(task.description || '');
        setPriority(task.priority);
        setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '');
        setLabels(task.labels || []);
      } else {
        setTitle('');
        setDescription('');
        setPriority('medium');
        setDueDate('');
        setLabels([]);
      }
    }
  }, [isOpen, task]);

  const createMutation = useMutation({
    mutationFn: (data: CreateTaskRequest) => taskApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateTaskRequest }) => taskApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      onClose();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (isEditing && task) {
      updateMutation.mutate({
        id: task.id,
        data: {
          title: title.trim(),
          description: description.trim() || undefined,
          priority,
          dueDate: dueDate || null,
          labels,
        },
      });
    } else {
      createMutation.mutate({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        dueDate: dueDate || undefined,
        labels,
      });
    }
  };

  const handleAddLabel = () => {
    if (newLabel.trim() && !labels.includes(newLabel.trim())) {
      setLabels([...labels, newLabel.trim()]);
      setNewLabel('');
    }
  };

  const handleRemoveLabel = (labelToRemove: string) => {
    setLabels(labels.filter((l) => l !== labelToRemove));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Modal */}
      <div className={`relative ${classes.bgCard} rounded-xl ${classes.border} shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto`}>
        {/* Header */}
        <div className={`flex items-center justify-between p-6 border-b ${classes.border}`}>
          <h2 className={`text-xl font-bold ${classes.text}`}>
            {isEditing ? 'Edit Task' : 'New Task'}
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg ${classes.hover} ${classes.textMuted}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className={`block text-sm font-medium ${classes.textMuted} mb-2`}>
              Title <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title..."
              className={`w-full px-4 py-3 rounded-lg ${classes.bgSurface} ${classes.border} ${classes.text} placeholder:text-gray-500 focus:outline-none focus:border-[#facc15] transition-colors`}
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className={`block text-sm font-medium ${classes.textMuted} mb-2`}>
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add task details..."
              rows={3}
              className={`w-full px-4 py-3 rounded-lg ${classes.bgSurface} ${classes.border} ${classes.text} placeholder:text-gray-500 focus:outline-none focus:border-[#facc15] transition-colors resize-none`}
            />
          </div>

          {/* Priority */}
          <div>
            <label className={`block text-sm font-medium ${classes.textMuted} mb-2`}>
              Priority
            </label>
            <div className="flex gap-2">
              {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    priority === p
                      ? priorityColors[p]
                      : `${classes.bgSurface} ${classes.border} ${classes.textMuted} hover:border-[#404040]`
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Due Date */}
          <div>
            <label className={`block text-sm font-medium ${classes.textMuted} mb-2`}>
              <Calendar className="w-4 h-4 inline mr-1" />
              Due Date
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={`w-full px-4 py-3 rounded-lg ${classes.bgSurface} ${classes.border} ${classes.text} focus:outline-none focus:border-[#facc15] transition-colors`}
            />
          </div>

          {/* Labels */}
          <div>
            <label className={`block text-sm font-medium ${classes.textMuted} mb-2`}>
              Labels
            </label>
            <div className="flex gap-2 mb-2 flex-wrap">
              {labels.map((label) => (
                <span
                  key={label}
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm ${classes.bgCardHover} ${classes.text}`}
                >
                  {label}
                  <button
                    type="button"
                    onClick={() => handleRemoveLabel(label)}
                    className="hover:text-red-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddLabel())}
                placeholder="Add a label..."
                className={`flex-1 px-4 py-2 rounded-lg ${classes.bgSurface} ${classes.border} ${classes.text} placeholder:text-gray-500 focus:outline-none focus:border-[#facc15] transition-colors text-sm`}
              />
              <button
                type="button"
                onClick={handleAddLabel}
                disabled={!newLabel.trim()}
                className="px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className={`flex items-center justify-end gap-3 pt-4 border-t ${classes.border}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-lg font-medium ${classes.textMuted} ${classes.hover} transition-colors`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!title.trim() || createMutation.isPending || updateMutation.isPending}
              className="px-6 py-2 bg-[#facc15] text-black font-semibold rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Saving...'
                : isEditing
                ? 'Update Task'
                : 'Create Task'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
