'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Clock,
  Calendar,
  Users,
  TrendingUp,
  Download,
  Filter,
  Search,
  ChevronDown,
  Timer,
  DollarSign,
  AlertCircle,
  CheckCircle,
  XCircle,
  BarChart3,
  PieChart,
  FileText
} from 'lucide-react';
import { overtimeRequestApi, OvertimeRequest, OvertimeRequestFilter } from '@/lib/api';
import { useTheme } from '@/hooks/useTheme';
// Native date formatting functions
const formatDate = (date: string | Date, formatStr: string) => {
  const d = new Date(date);
  if (formatStr === 'MM/dd/yyyy') {
    return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
  } else if (formatStr === 'MMM dd, yyyy') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } else if (formatStr === 'MMM dd, HH:mm') {
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' + 
           d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  } else if (formatStr === 'yyyy-MM-dd') {
    return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
  }
  return d.toLocaleDateString();
};

export default function OvertimePage() {
  const { classes } = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [dateRange, setDateRange] = useState<string>('THIS_MONTH');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch overtime requests
  const { data: overtimeData, isLoading, error } = useQuery({
    queryKey: ['overtimeRequests', { status: statusFilter, dateRange }],
    queryFn: () => overtimeRequestApi.getAll({
      status: statusFilter === 'ALL' ? undefined : statusFilter as any,
      limit: 100
    }),
  });

  const overtimeRequests = overtimeData?.data?.data || [];

  // Calculate statistics
  const stats = {
    total: overtimeRequests.length,
    pending: overtimeRequests.filter(req => req.status === 'PENDING').length,
    approved: overtimeRequests.filter(req => req.status === 'APPROVED').length,
    rejected: overtimeRequests.filter(req => req.status === 'REJECTED').length,
    totalHours: overtimeRequests
      .filter(req => req.status === 'APPROVED')
      .reduce((sum, req) => sum + Number(req.requestedHours), 0),
    estimatedCost: overtimeRequests
      .filter(req => req.status === 'APPROVED')
      .reduce((sum, req) => sum + (Number(req.requestedHours) * 150), 0) // Assuming ₱150/hour average
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return 'text-yellow-400 bg-yellow-400/10';
      case 'APPROVED': return 'text-green-400 bg-green-400/10';
      case 'REJECTED': return 'text-red-400 bg-red-400/10';
      default: return 'text-gray-400 bg-gray-400/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING': return AlertCircle;
      case 'APPROVED': return CheckCircle;
      case 'REJECTED': return XCircle;
      default: return Clock;
    }
  };

  const filteredRequests = overtimeRequests.filter(request => 
    request.employee?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const exportToCSV = () => {
    const headers = ['Employee', 'Date', 'Hours', 'Reason', 'Status', 'Reviewed By', 'Reviewed At'];
    const csvData = filteredRequests.map(req => [
      req.employee?.name || 'N/A',
      formatDate(req.requestDate, 'MM/dd/yyyy'),
      req.requestedHours.toString(),
      req.reason,
      req.status,
      'Admin', // Since we don't have reviewedByAdminName
      req.reviewedAt ? formatDate(req.reviewedAt, 'MM/dd/yyyy HH:mm') : 'N/A'
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overtime-report-${formatDate(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#facc15] flex items-center justify-center shadow-lg shadow-yellow-500/20">
            <Timer className="w-5 h-5 text-black" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">
              Finance <span className="text-[#facc15]">Overtime</span>
            </h1>
            <p className="text-sm text-gray-400">Manage and track overtime requests</p>
          </div>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black rounded-lg hover:bg-yellow-400 transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.total}</p>
              <p className="text-xs text-gray-400">Total Requests</p>
            </div>
          </div>
        </div>

        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.pending}</p>
              <p className="text-xs text-gray-400">Pending</p>
            </div>
          </div>
        </div>

        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.approved}</p>
              <p className="text-xs text-gray-400">Approved</p>
            </div>
          </div>
        </div>

        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{stats.totalHours.toFixed(1)}</p>
              <p className="text-xs text-gray-400">Total Hours</p>
            </div>
          </div>
        </div>

        <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-white">₱{stats.estimatedCost.toLocaleString()}</p>
              <p className="text-xs text-gray-400">Est. Cost</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className={`${classes.bgCard} rounded-xl ${classes.border} p-4`}>
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by employee name or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 ${classes.bgCardHover} ${classes.border} rounded-lg ${classes.text} placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#facc15]`}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className={`px-4 py-2 ${classes.bgCardHover} ${classes.border} rounded-lg ${classes.text} focus:outline-none focus:ring-2 focus:ring-[#facc15]`}
            >
              <option value="ALL">All Status</option>
              <option value="PENDING">Status: Pending</option>
              <option value="APPROVED">Status: Approved</option>
              <option value="REJECTED">Status: Rejected</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className={`px-4 py-2 ${classes.bgCardHover} ${classes.border} rounded-lg ${classes.text} focus:outline-none focus:ring-2 focus:ring-[#facc15]`}
            >
              <option value="THIS_MONTH">This Month</option>
              <option value="LAST_MONTH">Last Month</option>
              <option value="THIS_QUARTER">This Quarter</option>
              <option value="THIS_YEAR">This Year</option>
            </select>
          </div>
        </div>
      </div>

      {/* Overtime Requests Table */}
      <div className={`${classes.bgCard} rounded-xl ${classes.border} overflow-hidden`}>
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 mx-auto mb-4 border-2 border-[#facc15] border-t-transparent rounded-full animate-spin"></div>
            <p className={`${classes.textMuted}`}>Loading overtime requests...</p>
          </div>
        ) : error ? (
          <div className="p-8 text-center">
            <AlertCircle className="w-8 h-8 mx-auto mb-4 text-red-400" />
            <h3 className={`text-lg font-medium ${classes.text} mb-2`}>Error loading data</h3>
            <p className={`${classes.textMuted} text-sm`}>Please try again later</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="p-8 text-center">
            <FileText className="w-8 h-8 mx-auto mb-4 text-gray-500" />
            <h3 className={`text-lg font-medium ${classes.text} mb-2`}>No overtime requests found</h3>
            <p className={`${classes.textMuted} text-sm`}>
              {searchTerm ? 'Try adjusting your search terms' : 'No requests match the current filters'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={`${classes.bgCardHover}`}>
                <tr>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Employee</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Date</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Hours</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Reason</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Status</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Reviewed By</th>
                  <th className={`px-4 py-3 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Reviewed At</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${classes.border}`}>
                {filteredRequests.map((request: OvertimeRequest) => {
                  const StatusIcon = getStatusIcon(request.status);
                  return (
                    <tr key={request.id} className={`${classes.bgCardHover}`}>
                      <td className="px-4 py-3">
                        <div>
                          <p className={`text-sm font-medium ${classes.text}`}>{request.employee?.name}</p>
                          <p className={`text-xs ${classes.textMuted}`}>{request.employee?.position}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${classes.text}`}>
                          {formatDate(request.requestDate, 'MMM dd, yyyy')}
                        </p>
                        <p className={`text-xs ${classes.textMuted}`}>
                          {request.startTime} - {request.endTime}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm font-medium ${classes.text}`}>{request.requestedHours}h</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${classes.text} line-clamp-2 max-w-xs`}>{request.reason}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                          <StatusIcon className="w-3 h-3" />
                          {request.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${classes.text}`}>
                          {'Admin'} // Since we don't have reviewedByAdminName
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${classes.text}`}>
                          {request.reviewedAt 
                            ? formatDate(request.reviewedAt, 'MMM dd, HH:mm')
                            : '-'
                          }
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
