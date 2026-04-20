'use client';

import { useState } from 'react';
import { LogFilters as LogFiltersType } from '../types';
import { 
  Search, 
  Calendar, 
  Filter, 
  X,
  ChevronDown,
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
  Clock
} from 'lucide-react';
import { users } from '../data';

interface LogFiltersProps {
  filters: LogFiltersType;
  onFiltersChange: (filters: LogFiltersType) => void;
}

const actionTypes = [
  { value: 'CREATE', label: 'Create', icon: Plus, color: 'text-green-400' },
  { value: 'UPDATE', label: 'Update', icon: Edit3, color: 'text-yellow-400' },
  { value: 'DELETE', label: 'Delete', icon: Trash2, color: 'text-red-400' },
  { value: 'LOGIN', label: 'Login', icon: LogIn, color: 'text-blue-400' },
  { value: 'LOGOUT', label: 'Logout', icon: LogOut, color: 'text-blue-400' },
  { value: 'EXPORT', label: 'Export', icon: Download, color: 'text-purple-400' },
  { value: 'SCAN', label: 'Scan', icon: ScanLine, color: 'text-cyan-400' },
  { value: 'VIEW', label: 'View', icon: Eye, color: 'text-gray-400' },
  { value: 'APPROVE', label: 'Approve', icon: CheckCircle, color: 'text-green-400' },
  { value: 'REJECT', label: 'Reject', icon: XCircle, color: 'text-red-400' },
];

const entityTypes = [
  { value: 'EMPLOYEE', label: 'Employee' },
  { value: 'ATTENDANCE', label: 'Attendance' },
  { value: 'PAYROLL', label: 'Payroll' },
  { value: 'SETTINGS', label: 'Settings' },
  { value: 'USER', label: 'User' },
  { value: 'BRANCH', label: 'Branch' },
  { value: 'DOCUMENT', label: 'Document' },
];

const statusTypes = [
  { value: 'SUCCESS', label: 'Success', icon: CheckCircle2, color: 'text-green-400' },
  { value: 'FAILED', label: 'Failed', icon: XCircle, color: 'text-red-400' },
  { value: 'PENDING', label: 'Pending', icon: Clock, color: 'text-yellow-400' },
];

const dateRangeOptions = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7days', label: 'Last 7 Days' },
  { value: 'last30days', label: 'Last 30 Days' },
  { value: 'custom', label: 'Custom Range' },
];

export default function LogFilters({ filters, onFiltersChange }: LogFiltersProps) {
  const [showActionDropdown, setShowActionDropdown] = useState(false);
  const [showEntityDropdown, setShowEntityDropdown] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [showDateDropdown, setShowDateDropdown] = useState(false);

  const toggleActionType = (action: string) => {
    const newActions = filters.actionTypes.includes(action)
      ? filters.actionTypes.filter(a => a !== action)
      : [...filters.actionTypes, action];
    onFiltersChange({ ...filters, actionTypes: newActions });
  };

  const toggleEntityType = (entity: string) => {
    const newEntities = filters.entityTypes.includes(entity)
      ? filters.entityTypes.filter(e => e !== entity)
      : [...filters.entityTypes, entity];
    onFiltersChange({ ...filters, entityTypes: newEntities });
  };

  const toggleStatus = (status: string) => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    onFiltersChange({ ...filters, status: newStatus });
  };

  const setDateRange = (range: LogFiltersType['dateRange']) => {
    onFiltersChange({ ...filters, dateRange: range });
    if (range !== 'custom') {
      setShowDateDropdown(false);
    }
  };

  const clearAllFilters = () => {
    onFiltersChange({
      dateRange: 'today',
      actionTypes: [],
      entityTypes: [],
      userId: undefined,
      status: [],
      searchQuery: '',
    });
  };

  const hasActiveFilters = 
    filters.actionTypes.length > 0 ||
    filters.entityTypes.length > 0 ||
    filters.status.length > 0 ||
    filters.userId ||
    filters.searchQuery ||
    filters.dateRange !== 'today';

  return (
    <div className="space-y-3">
      {/* Main Filter Bar */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[280px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search logs..."
            value={filters.searchQuery}
            onChange={(e) => onFiltersChange({ ...filters, searchQuery: e.target.value })}
            className="w-full pl-10 pr-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15] text-sm"
          />
        </div>

        {/* Date Range Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowDateDropdown(!showDateDropdown)}
            className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white hover:border-[#404040] transition-colors text-sm"
          >
            <Calendar className="w-4 h-4 text-gray-400" />
            {dateRangeOptions.find(o => o.value === filters.dateRange)?.label}
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </button>
          {showDateDropdown && (
            <div className="absolute top-full mt-2 left-0 w-48 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-xl z-50">
              {dateRangeOptions.map(option => (
                <button
                  key={option.value}
                  onClick={() => setDateRange(option.value as LogFiltersType['dateRange'])}
                  className={`w-full text-left px-4 py-2 text-sm hover:bg-[#262626] transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    filters.dateRange === option.value ? 'text-[#facc15]' : 'text-white'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowActionDropdown(!showActionDropdown);
              setShowEntityDropdown(false);
              setShowStatusDropdown(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              filters.actionTypes.length > 0 
                ? 'bg-[#facc15]/10 border-[#facc15] text-[#facc15]' 
                : 'bg-[#141414] border-[#262626] text-white hover:border-[#404040]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Action {filters.actionTypes.length > 0 && `(${filters.actionTypes.length})`}
            <ChevronDown className="w-4 h-4" />
          </button>
          {showActionDropdown && (
            <div className="absolute top-full mt-2 right-0 w-56 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-xl z-50 p-2">
              <div className="space-y-1">
                {actionTypes.map(action => {
                  const Icon = action.icon;
                  const isSelected = filters.actionTypes.includes(action.value);
                  return (
                    <button
                      key={action.value}
                      onClick={() => toggleActionType(action.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-[#facc15]/10' : 'hover:bg-[#262626]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-[#facc15] border-[#facc15]' : 'border-gray-500'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </div>
                      <Icon className={`w-4 h-4 ${action.color}`} />
                      <span className="text-white">{action.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Entity Type Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowEntityDropdown(!showEntityDropdown);
              setShowActionDropdown(false);
              setShowStatusDropdown(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              filters.entityTypes.length > 0 
                ? 'bg-[#facc15]/10 border-[#facc15] text-[#facc15]' 
                : 'bg-[#141414] border-[#262626] text-white hover:border-[#404040]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Entity {filters.entityTypes.length > 0 && `(${filters.entityTypes.length})`}
            <ChevronDown className="w-4 h-4" />
          </button>
          {showEntityDropdown && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-xl z-50 p-2">
              <div className="space-y-1">
                {entityTypes.map(entity => {
                  const isSelected = filters.entityTypes.includes(entity.value);
                  return (
                    <button
                      key={entity.value}
                      onClick={() => toggleEntityType(entity.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-[#facc15]/10' : 'hover:bg-[#262626]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-[#facc15] border-[#facc15]' : 'border-gray-500'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </div>
                      <span className="text-white">{entity.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Status Dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowStatusDropdown(!showStatusDropdown);
              setShowActionDropdown(false);
              setShowEntityDropdown(false);
            }}
            className={`flex items-center gap-2 px-4 py-2 border rounded-lg text-sm transition-colors ${
              filters.status.length > 0 
                ? 'bg-[#facc15]/10 border-[#facc15] text-[#facc15]' 
                : 'bg-[#141414] border-[#262626] text-white hover:border-[#404040]'
            }`}
          >
            <Filter className="w-4 h-4" />
            Status {filters.status.length > 0 && `(${filters.status.length})`}
            <ChevronDown className="w-4 h-4" />
          </button>
          {showStatusDropdown && (
            <div className="absolute top-full mt-2 right-0 w-48 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-xl z-50 p-2">
              <div className="space-y-1">
                {statusTypes.map(status => {
                  const Icon = status.icon;
                  const isSelected = filters.status.includes(status.value);
                  return (
                    <button
                      key={status.value}
                      onClick={() => toggleStatus(status.value)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isSelected ? 'bg-[#facc15]/10' : 'hover:bg-[#262626]'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isSelected ? 'bg-[#facc15] border-[#facc15]' : 'border-gray-500'
                      }`}>
                        {isSelected && <CheckCircle2 className="w-3 h-3 text-black" />}
                      </div>
                      <Icon className={`w-4 h-4 ${status.color}`} />
                      <span className="text-white">{status.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* User Filter */}
        <select
          value={filters.userId || ''}
          onChange={(e) => onFiltersChange({ ...filters, userId: e.target.value || undefined })}
          className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15] text-sm"
        >
          <option value="">All Users</option>
          {users.map(user => (
            <option key={user.id} value={user.id}>{user.name}</option>
          ))}
        </select>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-2 px-4 py-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            Clear
          </button>
        )}
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-400">Active filters:</span>
          {filters.actionTypes.map(action => {
            const actionType = actionTypes.find(a => a.value === action);
            return (
              <span key={action} className="inline-flex items-center gap-1 px-2 py-1 bg-[#facc15]/10 text-[#facc15] rounded text-xs">
                {actionType?.label}
                <button onClick={() => toggleActionType(action)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {filters.entityTypes.map(entity => {
            const entityType = entityTypes.find(e => e.value === entity);
            return (
              <span key={entity} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-400/10 text-blue-400 rounded text-xs">
                {entityType?.label}
                <button onClick={() => toggleEntityType(entity)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          {filters.status.map(status => {
            const statusType = statusTypes.find(s => s.value === status);
            return (
              <span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-green-400/10 text-green-400 rounded text-xs">
                {statusType?.label}
                <button onClick={() => toggleStatus(status)} className="hover:text-white">
                  <X className="w-3 h-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}
