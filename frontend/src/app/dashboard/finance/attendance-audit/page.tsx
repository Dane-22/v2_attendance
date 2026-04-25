'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { attendanceApi, employeeApi, Attendance, Employee } from '@/lib/api';
import {
  Search,
  Calendar,
  Download,
  ChevronUp,
  ChevronDown,
  Loader2,
  RefreshCw,
  FileSpreadsheet,
  FileText,
  Printer
} from 'lucide-react';

// Helper to get Philippines date string (YYYY-MM-DD)
const getPhilippinesDateString = (): string => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

// Get Monday of current week in Philippines timezone
const getCurrentMonday = (): Date => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
  const philippinesDate = formatter.format(now);
  const date = new Date(philippinesDate);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday;
};

// Get Saturday of current week in Philippines timezone
const getCurrentSaturday = (): Date => {
  const monday = getCurrentMonday();
  const saturday = new Date(monday);
  saturday.setDate(monday.getDate() + 5);
  saturday.setHours(23, 59, 59, 999);
  return saturday;
};

// Get day name from date
const getDayName = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    weekday: 'long'
  });
  return formatter.format(date);
};

// Format date as YYYY-MM-DD
const formatDate = (date: Date): string => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  const parts = formatter.formatToParts(date);
  const year = parts.find(p => p.type === 'year')?.value;
  const month = parts.find(p => p.type === 'month')?.value;
  const day = parts.find(p => p.type === 'day')?.value;
  return `${year}-${month}-${day}`;
};

// Calculate hours worked from check_in and check_out
const calculateHoursWorked = (checkIn: Date | string | null, checkOut: Date | string | null): { decimal: number; hoursMinutes: string } => {
  if (!checkIn || !checkOut) {
    return { decimal: 0, hoursMinutes: '0:00' };
  }
  
  const checkInDate = typeof checkIn === 'string' ? new Date(checkIn) : checkIn;
  const checkOutDate = typeof checkOut === 'string' ? new Date(checkOut) : checkOut;
  
  if (isNaN(checkInDate.getTime()) || isNaN(checkOutDate.getTime())) {
    return { decimal: 0, hoursMinutes: '0:00' };
  }
  
  const diffMs = checkOutDate.getTime() - checkInDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const hours = Math.floor(diffHours);
  const minutes = Math.round((diffHours - hours) * 60);
  return {
    decimal: Math.round(diffHours * 10) / 10,
    hoursMinutes: `${hours}:${minutes.toString().padStart(2, '0')}`
  };
};

// Branch data
const branches = [
  { code: 'ALL', name: 'All Branches' },
  { code: 'A', name: 'Sto. Rosario' },
  { code: 'B', name: 'BCDA' },
  { code: 'C', name: 'Sundara' },
  { code: 'D', name: 'Panicsican' },
  { code: 'E', name: 'Main Office' },
  { code: 'F', name: 'Capitol' },
  { code: 'H', name: 'Testing Branch' },
] as const;

type SortField = 'employeeName' | 'date' | 'dayWorked' | 'hoursWorked';
type SortDirection = 'asc' | 'desc';

interface AttendanceRecord {
  id: number;
  employeeId: number;
  employeeName: string;
  date: string;
  dayName: string;
  status: string;
  hoursWorked: number;
  hoursDisplay: string;
  branch: string;
}

export default function AttendanceSummaryPage() {
  const queryClient = useQueryClient();
  
  // Date range state
  const [startDate, setStartDate] = useState(formatDate(getCurrentMonday()));
  const [endDate, setEndDate] = useState(formatDate(getCurrentSaturday()));
  const [dateRangeError, setDateRangeError] = useState('');
  
  // Filter state
  const [employeeSearch, setEmployeeSearch] = useState('');
  const [branchFilter, setBranchFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Pagination state
  const [page, setPage] = useState(1);
  const pageSize = 20;
  
  // Sorting state
  const [sortField, setSortField] = useState<SortField>('date');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Error state
  const [error, setError] = useState<string | null>(null);
  const [isNetworkError, setIsNetworkError] = useState(false);
  
  // Rate limiting
  const [lastFetchTime, setLastFetchTime] = useState(0);
  const RATE_LIMIT_MS = 1000; // 1 second

  // Validate date range (pure function, no state updates)
  const validateDateRange = useCallback((start: string, end: string): boolean => {
    const startObj = new Date(start);
    const endObj = new Date(end);
    const maxDate = new Date(startObj);
    maxDate.setDate(maxDate.getDate() + 90); // 90 days max
    
    if (endObj < startObj) {
      return false;
    }
    
    if (endObj > maxDate) {
      return false;
    }
    
    return true;
  }, []);

  // Update date range error based on validation
  useEffect(() => {
    const startObj = new Date(startDate);
    const endObj = new Date(endDate);
    const maxDate = new Date(startObj);
    maxDate.setDate(maxDate.getDate() + 90);
    
    if (endObj < startObj) {
      setDateRangeError('End date must be after start date');
    } else if (endObj > maxDate) {
      setDateRangeError('Date range cannot exceed 90 days');
    } else {
      setDateRangeError('');
    }
  }, [startDate, endDate]);

  // Fetch attendance data
  const { data: attendanceData, isLoading: isAttendanceLoading, error: attendanceError, refetch } = useQuery({
    queryKey: ['attendance-summary', { startDate, endDate, branch: branchFilter, status: statusFilter, page }],
    queryFn: async () => {
      const now = Date.now();
      if (now - lastFetchTime < RATE_LIMIT_MS) {
        await new Promise(resolve => setTimeout(resolve, RATE_LIMIT_MS - (now - lastFetchTime)));
      }
      setLastFetchTime(Date.now());
      
      try {
        console.log('[Attendance Summary] Fetching attendance with params:', { startDate, endDate, page, limit: pageSize });
        const response = await attendanceApi.getAll({
          startDate,
          endDate,
          page,
          limit: pageSize
        });
        console.log('[Attendance Summary] API response:', response);
        
        // Fetch employees to get names
        const attendanceRecords = response.data?.data || [];
        console.log('[Attendance Summary] Attendance records:', attendanceRecords.length);
        const employeeIds = [...new Set(attendanceRecords.map((a: Attendance) => a.employeeId))];
        console.log('[Attendance Summary] Fetching employees for IDs:', employeeIds);
        const employeesResponse = await employeeApi.getAll({ limit: 1000 });
        console.log('[Attendance Summary] Employees response:', employeesResponse);
        const employees = employeesResponse.data?.data || [];
        const employeeMap = new Map(employees.map((e: Employee) => [e.id, `${e.firstName} ${e.lastName}`]));
        
        // Transform data
        const records: AttendanceRecord[] = attendanceRecords.map((attendance: Attendance) => {
          const hours = calculateHoursWorked(attendance.check_in, attendance.check_out);
          const employeeName = employeeMap.get(attendance.employeeId) || `Employee ${attendance.employeeId}`;
          
          return {
            id: attendance.id,
            employeeId: attendance.employeeId,
            employeeName,
            date: formatDate(new Date(attendance.date)),
            dayName: getDayName(new Date(attendance.date)),
            status: attendance.status || 'No Record',
            hoursWorked: hours.decimal,
            hoursDisplay: `${hours.decimal} (${hours.hoursMinutes})`,
            branch: attendance.branch_code || 'N/A'
          };
        });
        
        // Apply filters
        let filteredRecords = records;
        
        if (employeeSearch) {
          filteredRecords = filteredRecords.filter(r =>
            r.employeeName.toLowerCase().includes(employeeSearch.toLowerCase())
          );
        }
        
        if (branchFilter !== 'ALL') {
          filteredRecords = filteredRecords.filter(r => r.branch === branchFilter);
        }
        
        if (statusFilter !== 'all') {
          filteredRecords = filteredRecords.filter(r => r.status.toLowerCase() === statusFilter.toLowerCase());
        }
        
        // Apply sorting
        filteredRecords.sort((a, b) => {
          let comparison = 0;
          switch (sortField) {
            case 'employeeName':
              comparison = a.employeeName.localeCompare(b.employeeName);
              break;
            case 'date':
              comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
              break;
            case 'dayWorked':
              comparison = a.dayName.localeCompare(b.dayName);
              break;
            case 'hoursWorked':
              comparison = a.hoursWorked - b.hoursWorked;
              break;
          }
          return sortDirection === 'asc' ? comparison : -comparison;
        });
        
        setError(null);
        setIsNetworkError(false);
        
        return {
          records: filteredRecords,
          total: filteredRecords.length,
          totalPages: Math.ceil(filteredRecords.length / pageSize)
        };
      } catch (err: any) {
        console.error('[Attendance Summary] Error fetching data:', err);
        console.error('[Attendance Summary] Error details:', {
          code: err.code,
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        if (err.code === 'ERR_NETWORK' || !err.response) {
          setIsNetworkError(true);
          setError('Network error. Please check your connection.');
        } else if (err.response?.status === 401) {
          setIsNetworkError(false);
          setError('Authentication failed. Please log in again.');
        } else if (err.response?.status === 404) {
          setIsNetworkError(false);
          setError('API endpoint not found. Please contact support.');
        } else {
          setIsNetworkError(false);
          setError(err.response?.data?.message || `Error: ${err.message}`);
        }
        throw err;
      }
    },
    enabled: validateDateRange(startDate, endDate)
  });

  // Handle date range changes
  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartDate = e.target.value;
    setStartDate(newStartDate);
    validateDateRange(newStartDate, endDate);
    setPage(1);
  };

  const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEndDate = e.target.value;
    setEndDate(newEndDate);
    validateDateRange(startDate, newEndDate);
    setPage(1);
  };

  // Handle sort
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Handle retry
  const handleRetry = () => {
    refetch();
  };

  // Export functions
  const exportToCSV = () => {
    if (!attendanceData?.records.length) return;
    
    const headers = ['Employee Name', 'Date', 'Day Worked', 'Hours Worked', 'Status', 'Branch'];
    const rows = attendanceData.records.map(r => [
      r.employeeName,
      r.date,
      r.dayName,
      r.hoursDisplay,
      r.status,
      r.branch
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-summary-${startDate}-to-${endDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToExcel = () => {
    // For simplicity, use CSV format for Excel
    exportToCSV();
  };

  const exportToPDF = () => {
    window.print();
  };

  // Get paginated records
  const paginatedRecords = attendanceData?.records.slice((page - 1) * pageSize, page * pageSize) || [];

  // Get sort icon
  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Custom Date Range Attendance Audit</h1>
        <div className="flex gap-2">
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            title="Export to CSV"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            CSV
          </button>
          <button
            onClick={exportToExcel}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            title="Export to Excel"
          >
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            Excel
          </button>
          <button
            onClick={exportToPDF}
            className="inline-flex items-center px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            title="Print/Export to PDF"
          >
            <Printer className="w-5 h-5 mr-2" />
            PDF
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-[#141414] p-4 rounded-lg shadow border border-gray-200 dark:border-[#262626]">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Date Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              value={startDate}
              onChange={handleStartDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#262626] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#1a1a1a] dark:text-white"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={handleEndDateChange}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#262626] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#1a1a1a] dark:text-white"
            />
          </div>
          {dateRangeError && (
            <div className="col-span-2 flex items-end">
              <p className="text-red-500 text-sm">{dateRangeError}</p>
            </div>
          )}
          
          {/* Employee Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Employee Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={employeeSearch}
                onChange={(e) => { setEmployeeSearch(e.target.value); setPage(1); }}
                placeholder="Search employee name..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-[#262626] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#1a1a1a] dark:text-white"
              />
            </div>
          </div>
          
          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Branch</label>
            <select
              value={branchFilter}
              onChange={(e) => { setBranchFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#262626] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#1a1a1a] dark:text-white"
            >
              {branches.map(branch => (
                <option key={branch.code} value={branch.code}>{branch.name}</option>
              ))}
            </select>
          </div>
          
          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 dark:border-[#262626] rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-[#1a1a1a] dark:text-white"
            >
              <option value="all">All Status</option>
              <option value="present">Present</option>
              <option value="late">Late</option>
              <option value="absent">Absent</option>
              <option value="half_day">Half Day</option>
              <option value="leave">Leave</option>
            </select>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <p className="text-red-700 dark:text-red-400">{error}</p>
            {isNetworkError && (
              <button
                onClick={handleRetry}
                className="inline-flex items-center px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white dark:bg-[#141414] rounded-lg shadow overflow-hidden border border-gray-200 dark:border-[#262626]">
        {isAttendanceLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          </div>
        ) : !attendanceData?.records.length ? (
          <div className="text-center py-12">
            <p className="text-gray-500 dark:text-gray-400">No records found for the selected criteria</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-[#262626]">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a]">
                  <tr>
                    <th
                      onClick={() => handleSort('employeeName')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-1">
                        Employee Name
                        {getSortIcon('employeeName')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('date')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-1">
                        Date
                        {getSortIcon('date')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('dayWorked')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-1">
                        Day Worked
                        {getSortIcon('dayWorked')}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('hoursWorked')}
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-[#262626]"
                    >
                      <div className="flex items-center gap-1">
                        Hours Worked
                        {getSortIcon('hoursWorked')}
                      </div>
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Branch
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#141414] divide-y divide-gray-200 dark:divide-[#262626]">
                  {paginatedRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-gray-50 dark:hover:bg-[#1a1a1a]">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.employeeName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.dayName} - {record.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.hoursDisplay}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          record.status === 'present' ? 'bg-green-100 text-green-800' :
                          record.status === 'late' ? 'bg-yellow-100 text-yellow-800' :
                          record.status === 'absent' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {record.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {record.branch}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {attendanceData.totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200 dark:border-[#262626]">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1 border border-gray-300 dark:border-[#262626] rounded-md text-sm disabled:opacity-50 dark:text-white dark:bg-[#1a1a1a]"
                >
                  Previous
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  Page {page} of {attendanceData.totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(attendanceData.totalPages, p + 1))}
                  disabled={page === attendanceData.totalPages}
                  className="px-3 py-1 border border-gray-300 dark:border-[#262626] rounded-md text-sm disabled:opacity-50 dark:text-white dark:bg-[#1a1a1a]"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
