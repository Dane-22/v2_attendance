'use client';

import { LogEntry } from '../types';
import { 
  Plus, 
  Edit3, 
  Trash2, 
  LogIn, 
  LogOut, 
  Download, 
  ScanLine, 
  Eye,
  CheckCircle,
  XCircle,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useState } from 'react';

interface LogTimelineProps {
  logs: LogEntry[];
}

const actionConfig = {
  CREATE: { icon: Plus, color: 'text-green-400', bg: 'bg-green-400', border: 'border-green-400' },
  UPDATE: { icon: Edit3, color: 'text-yellow-400', bg: 'bg-yellow-400', border: 'border-yellow-400' },
  DELETE: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400' },
  LOGIN: { icon: LogIn, color: 'text-blue-400', bg: 'bg-blue-400', border: 'border-blue-400' },
  LOGOUT: { icon: LogOut, color: 'text-blue-400', bg: 'bg-blue-400', border: 'border-blue-400' },
  EXPORT: { icon: Download, color: 'text-purple-400', bg: 'bg-purple-400', border: 'border-purple-400' },
  SCAN: { icon: ScanLine, color: 'text-cyan-400', bg: 'bg-cyan-400', border: 'border-cyan-400' },
  VIEW: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-400', border: 'border-gray-400' },
  APPROVE: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400', border: 'border-green-400' },
  REJECT: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400', border: 'border-red-400' },
};

const statusConfig = {
  SUCCESS: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10' },
  FAILED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10' },
  PENDING: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
};

const entityColors: Record<string, string> = {
  EMPLOYEE: 'bg-blue-400/10 text-blue-400 border-blue-400/30',
  ATTENDANCE: 'bg-green-400/10 text-green-400 border-green-400/30',
  PAYROLL: 'bg-purple-400/10 text-purple-400 border-purple-400/30',
  SETTINGS: 'bg-orange-400/10 text-orange-400 border-orange-400/30',
  USER: 'bg-pink-400/10 text-pink-400 border-pink-400/30',
  BRANCH: 'bg-cyan-400/10 text-cyan-400 border-cyan-400/30',
  DOCUMENT: 'bg-gray-400/10 text-gray-400 border-gray-400/30',
};

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

function formatDate(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.setDate(now.getDate() - 1)).toDateString() === date.toDateString();
  
  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

function groupLogsByDate(logs: LogEntry[]): [string, LogEntry[]][] {
  const groups: Record<string, LogEntry[]> = {};
  
  logs.forEach(log => {
    const date = new Date(log.timestamp).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(log);
  });
  
  return Object.entries(groups).sort((a, b) => 
    new Date(b[0]).getTime() - new Date(a[0]).getTime()
  );
}

export default function LogTimeline({ logs }: LogTimelineProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedItems(newExpanded);
  };

  if (logs.length === 0) {
    return (
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#262626] flex items-center justify-center">
          <Clock className="w-8 h-8 text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-white mb-2">No activity logs found</h3>
        <p className="text-gray-400 text-sm">Try adjusting your filters or search criteria</p>
      </div>
    );
  }

  const groupedLogs = groupLogsByDate(logs);

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
      <div className="p-6 space-y-8">
        {groupedLogs.map(([dateString, dateLogs]) => (
          <div key={dateString}>
            {/* Date Header */}
            <div className="flex items-center gap-4 mb-4">
              <h3 className="text-lg font-semibold text-[#facc15]">
                {formatDate(dateLogs[0].timestamp)}
              </h3>
              <div className="flex-1 h-px bg-[#262626]" />
              <span className="text-sm text-gray-400">{dateLogs.length} events</span>
            </div>

            {/* Timeline Items */}
            <div className="space-y-4">
              {dateLogs.map((log, index) => {
                const action = actionConfig[log.actionType];
                const status = statusConfig[log.status];
                const ActionIcon = action.icon;
                const StatusIcon = status.icon;
                const isExpanded = expandedItems.has(log.id);
                const isLast = index === dateLogs.length - 1;

                return (
                  <div key={log.id} className="flex gap-4">
                    {/* Timeline Node */}
                    <div className="flex flex-col items-center">
                      <div className={`w-10 h-10 rounded-full ${action.bg} flex items-center justify-center border-2 ${action.border} shadow-lg`}>
                        <ActionIcon className="w-5 h-5 text-black" />
                      </div>
                      {!isLast && <div className="w-0.5 flex-1 bg-[#262626] mt-2" />}
                    </div>

                    {/* Content Card */}
                    <div className="flex-1 pb-4">
                      <div 
                        className="bg-[#1a1a1a] rounded-xl border border-[#262626] p-4 hover:border-[#404040] transition-colors cursor-pointer"
                        onClick={() => toggleItem(log.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            {/* Header Row */}
                            <div className="flex items-center gap-3 mb-2">
                              <span className="text-sm text-gray-400 font-mono">
                                {formatTime(log.timestamp)}
                              </span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${entityColors[log.entityType]}`}>
                                {log.entityType}
                              </span>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${status.bg} ${status.color}`}>
                                <StatusIcon className="w-3 h-3" />
                                {log.status}
                              </span>
                            </div>

                            {/* Title */}
                            <h4 className="text-white font-medium mb-1">
                              {log.user.name} {log.actionType.toLowerCase()}d {log.entityName || log.entityType.toLowerCase()}
                            </h4>

                            {/* Description */}
                            <p className="text-gray-400 text-sm">{log.description}</p>

                            {/* Expandable Details */}
                            {isExpanded && (
                              <div className="mt-4 pt-4 border-t border-[#262626] space-y-3">
                                {log.details && (
                                  <div className="grid grid-cols-2 gap-4">
                                    {log.details.before && (
                                      <div className="bg-[#141414] rounded-lg p-3">
                                        <div className="text-xs text-red-400 mb-2 font-medium">Before</div>
                                        <pre className="text-xs text-gray-300 overflow-x-auto">
                                          {JSON.stringify(log.details.before, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                    {log.details.after && (
                                      <div className="bg-[#141414] rounded-lg p-3">
                                        <div className="text-xs text-green-400 mb-2 font-medium">After</div>
                                        <pre className="text-xs text-gray-300 overflow-x-auto">
                                          {JSON.stringify(log.details.after, null, 2)}
                                        </pre>
                                      </div>
                                    )}
                                  </div>
                                )}
                                <div className="flex flex-wrap gap-4 text-sm">
                                  {log.ipAddress && (
                                    <div>
                                      <span className="text-gray-400">IP:</span>
                                      <span className="text-white ml-2 font-mono">{log.ipAddress}</span>
                                    </div>
                                  )}
                                  {log.entityId && (
                                    <div>
                                      <span className="text-gray-400">Entity ID:</span>
                                      <span className="text-white ml-2 font-mono">{log.entityId}</span>
                                    </div>
                                  )}
                                </div>
                                {log.metadata && (
                                  <div className="bg-[#141414] rounded-lg p-3">
                                    <div className="text-xs text-gray-400 mb-2">Metadata</div>
                                    <pre className="text-xs text-gray-300 overflow-x-auto">
                                      {JSON.stringify(log.metadata, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Expand Button */}
                          <button className="p-1 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white">
                            {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
