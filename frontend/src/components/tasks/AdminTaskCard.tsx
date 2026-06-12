'use client';

import { useState, useEffect } from 'react';
import { Clock, Calendar, Tag, AlertCircle, MoreHorizontal, Trash2, ChevronDown, ChevronUp, User } from 'lucide-react';
import { Task, TaskStatus, TaskPriority } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';

interface AdminTaskCardProps {
  task: Task & {
    admin?: {
      id: number;
      username: string;
      name: string;
      role: string | null;
    } | null;
  };
  onMove: (taskId: number, newStatus: TaskStatus) => void;
  onDelete: (id: number) => void;
  priorityColors: Record<TaskPriority, string>;
  formatTime: (seconds: number) => string;
}

export default function AdminTaskCard({
  task,
  onMove,
  onDelete,
  priorityColors,
  formatTime,
}: AdminTaskCardProps) {
  const { classes } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [liveTime, setLiveTime] = useState(task.totalTimeSpent);

  // Calculate live elapsed time when timer is running
  useEffect(() => {
    if (!task.isTimerRunning) {
      setLiveTime(task.totalTimeSpent);
      return;
    }

    const interval = setInterval(() => {
      if (task.lastTimerStart) {
        const elapsed = Math.floor((new Date().getTime() - new Date(task.lastTimerStart).getTime()) / 1000);
        setLiveTime(task.totalTimeSpent + elapsed);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [task.isTimerRunning, task.lastTimerStart, task.totalTimeSpent]);

  const getNextStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'todo') return 'in_progress';
    if (current === 'in_progress') return 'completed';
    return null;
  };

  const getPrevStatus = (current: TaskStatus): TaskStatus | null => {
    if (current === 'completed') return 'in_progress';
    if (current === 'in_progress') return 'todo';
    return null;
  };

  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';

  const creatorName = task.admin
    ? task.admin.name || task.admin.username || `Admin #${task.admin.id}`
    : `Admin #${task.employeeId}`;

  const creatorInitials = task.admin
    ? (task.admin.name || task.admin.username || '').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
    : '??';

  const creatorRole = task.admin?.role || 'admin';

  return (
    <div className={`${classes.bgSurface} rounded-lg ${classes.border} p-4 transition-all hover:border-[#404040] group`}>
      {/* Header Row */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className={`font-medium text-sm ${classes.text} truncate`}>{task.title}</h4>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`p-1 rounded ${classes.hover} opacity-0 group-hover:opacity-100 transition-opacity`}
          >
            <MoreHorizontal className={`w-4 h-4 ${classes.textMuted}`} />
          </button>
          {showMenu && (
            <div className={`absolute right-0 top-8 ${classes.bgCard} rounded-lg ${classes.border} shadow-lg py-1 z-10 min-w-[120px]`}>
              <button
                onClick={() => { onDelete(task.id); setShowMenu(false); }}
                className="flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 w-full text-left"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Creator Badge */}
      <div className="flex items-center gap-2 mt-2">
        <div className="w-6 h-6 rounded-full bg-[#facc15]/20 text-[#facc15] flex items-center justify-center text-xs font-bold">
          {creatorInitials || <User className="w-3 h-3" />}
        </div>
        <span className={`text-xs ${classes.textMuted}`}>
          {creatorName}
          {creatorRole && (
            <span className="ml-1 opacity-60 capitalize">({creatorRole})</span>
          )}
        </span>
      </div>

      {/* Priority & Labels */}
      <div className="flex items-center gap-2 mt-2 flex-wrap">
        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        {task.labels?.map((label: string, idx: number) => (
          <span
            key={idx}
            className={`px-2 py-0.5 rounded text-xs ${classes.bgCardHover} ${classes.textMuted}`}
          >
            <Tag className="w-3 h-3 inline mr-1" />
            {label}
          </span>
        ))}
      </div>

      {/* Due Date */}
      {task.dueDate && (
        <div className={`flex items-center gap-1 mt-2 text-xs ${isOverdue ? 'text-red-400' : classes.textMuted}`}>
          <Calendar className="w-3 h-3" />
          {new Date(task.dueDate).toLocaleDateString()}
          {isOverdue && <AlertCircle className="w-3 h-3 ml-1" />}
        </div>
      )}

      {/* Timer & Actions */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-[#262626]">
        {/* Timer (read-only for admin) */}
        <div className="flex items-center gap-2">
          <span className={`text-xs font-mono ${classes.textMuted}`}>
            <Clock className="w-3 h-3 inline mr-1" />
            {formatTime(liveTime)}
          </span>
          {task.isTimerRunning && (
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          )}
        </div>

        {/* Status Move Buttons */}
        <div className="flex items-center gap-1">
          {getPrevStatus(task.status) && (
            <button
              onClick={() => onMove(task.id, getPrevStatus(task.status)!)}
              className={`p-1 rounded ${classes.hover} ${classes.textMuted}`}
              title="Move to previous column"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
          {getNextStatus(task.status) && (
            <button
              onClick={() => onMove(task.id, getNextStatus(task.status)!)}
              className={`p-1 rounded ${classes.hover} ${classes.textMuted}`}
              title="Move to next column"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Description */}
      {task.description && (
        <>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className={`mt-2 text-xs ${classes.textMuted} ${classes.hover} px-2 py-1 rounded w-full text-left`}
          >
            {isExpanded ? 'Hide details' : 'Show details'}
          </button>
          {isExpanded && (
            <p className={`mt-2 text-sm ${classes.textMuted} whitespace-pre-wrap`}>
              {task.description}
            </p>
          )}
        </>
      )}
    </div>
  );
}
