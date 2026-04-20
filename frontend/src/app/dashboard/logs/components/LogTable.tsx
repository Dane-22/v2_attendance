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
  Clock,
  CheckCircle2,
  User,
  MoreHorizontal,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Fragment, useState } from 'react';

interface LogTableProps {
  logs: LogEntry[];
  onViewDetails?: (log: LogEntry) => void;
  isSuperAdmin?: boolean;
}

const actionConfig = {
  CREATE: { icon: Plus, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Create' },
  UPDATE: { icon: Edit3, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Update' },
  DELETE: { icon: Trash2, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Delete' },
  LOGIN: { icon: LogIn, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Login' },
  LOGOUT: { icon: LogOut, color: 'text-blue-400', bg: 'bg-blue-400/10', label: 'Logout' },
  EXPORT: { icon: Download, color: 'text-purple-400', bg: 'bg-purple-400/10', label: 'Export' },
  SCAN: { icon: ScanLine, color: 'text-cyan-400', bg: 'bg-cyan-400/10', label: 'Scan' },
  VIEW: { icon: Eye, color: 'text-gray-400', bg: 'bg-gray-400/10', label: 'View' },
  APPROVE: { icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Approve' },
  REJECT: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Reject' },
};

const statusConfig = {
  SUCCESS: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-400/10', label: 'Success' },
  FAILED: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-400/10', label: 'Failed' },
  PENDING: { icon: Clock, color: 'text-yellow-400', bg: 'bg-yellow-400/10', label: 'Pending' },
};

const entityColors: Record<string, string> = {
  EMPLOYEE: 'bg-blue-400/10 text-blue-400',
  ATTENDANCE: 'bg-green-400/10 text-green-400',
  PAYROLL: 'bg-purple-400/10 text-purple-400',
  SETTINGS: 'bg-orange-400/10 text-orange-400',
  USER: 'bg-pink-400/10 text-pink-400',
  BRANCH: 'bg-cyan-400/10 text-cyan-400',
  DOCUMENT: 'bg-gray-400/10 text-gray-400',
};

function formatRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} min ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
  if (diffInSeconds < 172800) return 'Yesterday';
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatAbsoluteTime(timestamp: string): string {
  const date = new Date(timestamp);
  return date.toLocaleString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function LogTable({ logs, onViewDetails, isSuperAdmin = false }: LogTableProps) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
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

  return (
    <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#262626] bg-[#1a1a1a]">
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">Time</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-40">User</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-32">Action</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-36">Entity</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Description</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider w-28">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase tracking-wider w-16">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#262626]">
            {logs.map((log) => {
              const action = actionConfig[log.actionType];
              const status = statusConfig[log.status];
              const ActionIcon = action.icon;
              const StatusIcon = status.icon;
              const isExpanded = expandedRows.has(log.id);
              
              return (
                <Fragment key={log.id}>
                  <tr 
                    className="hover:bg-[#1a1a1a] transition-colors cursor-pointer"
                    onClick={() => toggleRow(log.id)}
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-white" title={formatAbsoluteTime(log.timestamp)}>
                        {formatRelativeTime(log.timestamp)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {new Date(log.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center text-black text-xs font-bold">
                          {log.user.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
                        </div>
                        <div>
                          <div className="text-sm text-white font-medium">{log.user.name}</div>
                          <div className="text-xs text-gray-400">{log.user.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${action.bg} ${action.color}`}>
                        <ActionIcon className="w-3.5 h-3.5" />
                        {action.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${entityColors[log.entityType] || 'bg-gray-400/10 text-gray-400'}`}>
                        {log.entityType}
                      </div>
                      {log.entityName && (
                        <div className="text-xs text-gray-400 mt-1 truncate max-w-[120px]">{log.entityName}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-sm text-white line-clamp-2">{log.description}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                        <StatusIcon className="w-3.5 h-3.5" />
                        {status.label}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleRow(log.id);
                          }}
                          className="p-1.5 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isSuperAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (confirm(`Delete log ${log.id}? This action cannot be undone.`)) {
                                // Delete functionality would be implemented here
                                console.log('Deleting log:', log.id);
                              }
                            }}
                            className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                            title="Delete log (Super Admin only)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                  {isExpanded && (
                    <tr className="bg-[#0f0f0f]">
                      <td colSpan={7} className="px-4 py-4">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Log ID:</span>
                            <span className="text-white ml-2 font-mono">{log.id}</span>
                          </div>
                          {log.ipAddress && (
                            <div>
                              <span className="text-gray-400">IP Address:</span>
                              <span className="text-white ml-2 font-mono">{log.ipAddress}</span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-400">Entity ID:</span>
                            <span className="text-white ml-2 font-mono">{log.entityId || 'N/A'}</span>
                          </div>
                          {log.details && (
                            <div className="col-span-3 mt-2">
                              <span className="text-gray-400">Changes:</span>
                              <div className="mt-2 grid grid-cols-2 gap-4">
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
                            </div>
                          )}
                          {log.metadata && (
                            <div className="col-span-3 mt-2">
                              <span className="text-gray-400">Metadata:</span>
                              <pre className="mt-2 text-xs text-gray-300 bg-[#141414] rounded-lg p-3 overflow-x-auto">
                                {JSON.stringify(log.metadata, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
