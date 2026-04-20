'use client';

import { useState, useMemo } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { branchApi, attendanceApi, employeeApi, Branch, BranchEmployee } from '@/lib/api';
import { Search, Plus, X, RotateCcw, Lightbulb, Clock, UserX, UserCheck, ChevronLeft, ChevronRight, CheckCircle, Loader2, LogIn, LogOut } from 'lucide-react';

// Employee type from API
interface EmployeeData {
  id: number;
  employeeCode: string | null;
  firstName: string | null;
  lastName: string | null;
  name: string;
  avatar: string;
  department: string | null;
  position: string | null;
  branchName: string | null;
  status: string | null;
}

// Attendance record type
interface AttendanceRecord {
  id: number;
  employeeId: number;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: 'present' | 'absent' | 'late' | 'half_day' | 'leave';
}

// Display employee type
interface DisplayEmployee {
  id: number;
  name: string;
  avatar: string;
  department: string;
  branchName: string;
  timeIn: string | null;
  timeOut: string | null;
  totalHours: string;
  status: 'present' | 'absent' | null;
  attendanceStatus: string;
}

// Filter tabs
const filterTabs = ['Available', 'Summary', 'Present', 'Absent'];

export default function AttendancePage() {
  const queryClient = useQueryClient();
  const [selectedBranch, setSelectedBranch] = useState<string>('');
  const [activeTab, setActiveTab] = useState('Available');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pagination for branches
  const [currentPage, setCurrentPage] = useState(1);
  const branchesPerPage = 6;

  // Fetch branches from API
  const { data: branchesData, isLoading: branchesLoading } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await branchApi.getAll();
      return response.data.data || [];
    }
  });

  const branches = branchesData || [];
  const totalPages = Math.ceil(branches.length / branchesPerPage);
  const indexOfLastBranch = currentPage * branchesPerPage;
  const indexOfFirstBranch = indexOfLastBranch - branchesPerPage;
  const currentBranches = branches.slice(indexOfFirstBranch, indexOfLastBranch);

  // Fetch employees for selected branch
  const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees } = useQuery({
    queryKey: ['branch-employees', selectedBranch],
    queryFn: async () => {
      if (!selectedBranch) return [];
      const response = await branchApi.getEmployees(selectedBranch);
      console.log('Fetched employees:', response.data.data);
      return response.data.data || [];
    },
    enabled: !!selectedBranch
  });

  // Search all employees when search query exists
  const { data: searchResultsData } = useQuery({
    queryKey: ['employee-search', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return [];
      const response = await employeeApi.getAll({ search: searchQuery, limit: 50 });
      console.log('Search results:', response.data.data);
      return response.data.data || [];
    },
    enabled: searchQuery.length >= 2
  });

  // Fetch today's attendance for ALL employees (to check cross-branch status)
  const { data: todayAttendanceData } = useQuery({
    queryKey: ['today-attendance-all'],
    queryFn: async () => {
      const response = await attendanceApi.getAll({ startDate: new Date().toISOString().split('T')[0], endDate: new Date().toISOString().split('T')[0], limit: 1000 });
      console.log('Today attendance:', response.data.data);
      return response.data.data || [];
    }
  });

  // Manual clock-in mutation
  const clockInMutation = useMutation({
    mutationFn: ({ employeeId, branchCode }: { employeeId: number; branchCode: string }) =>
      attendanceApi.manualClockIn({ employeeId, branch_code: branchCode }),
    onSuccess: async (data) => {
      console.log('Clock-in success response:', data);
      // Clear search and force immediate refetch to update UI
      setSearchQuery('');
      // Refetch queries immediately to get fresh data
      await queryClient.refetchQueries({ queryKey: ['branch-employees', selectedBranch], exact: true });
      await queryClient.refetchQueries({ queryKey: ['today-attendance-all'], exact: true });
    },
    onError: (error: any) => {
      console.error('Clock-in error:', error);
      console.log('Error response data:', error?.response?.data);
      const message = error?.response?.data?.message || error?.response?.data?.error || error?.message || 'Failed to clock in';
      console.log('Alert message:', message);
      window.alert(message);
    }
  });

  // Manual clock-out mutation
  const clockOutMutation = useMutation({
    mutationFn: (employeeId: number) => attendanceApi.manualClockOut({ employeeId }),
    onSuccess: async () => {
      // Clear search and force immediate refetch to update UI
      setSearchQuery('');
      // Refetch queries immediately to get fresh data
      await queryClient.refetchQueries({ queryKey: ['branch-employees', selectedBranch], exact: true });
      await queryClient.refetchQueries({ queryKey: ['today-attendance-all'], exact: true });
    },
    onError: (error: any) => {
      console.error('Clock-out error:', error);
      alert(error?.response?.data?.message || error?.message || 'Failed to clock out');
    }
  });

  const employees = employeesData || [];
  const searchResults = searchResultsData || [];
  const todayAttendance = todayAttendanceData || [];
  
  // Merge branch employees with search results (for cross-branch transfers)
  const mergedEmployees = useMemo(() => {
    if (searchQuery.length < 2) return employees;
    
    // Create a map of existing employees by ID
    const existingMap = new Map(employees.map(e => [e.id, e]));
    
    // Create attendance map by employee ID (find most recent incomplete record)
    const attendanceMap = new Map<number, { timeIn: string | null; timeOut: string | null; status: string | null; attendanceId: number | null }>();
    todayAttendance.forEach((record: any) => {
      const existing = attendanceMap.get(record.employeeId);
      // Only update if no existing record or this one has no check_out (active shift)
      if (!existing || (!existing.timeOut && record.check_out)) {
        attendanceMap.set(record.employeeId, {
          timeIn: record.check_in ? new Date(record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
          timeOut: record.check_out ? new Date(record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false }) : null,
          status: record.status,
          attendanceId: record.id
        });
      }
    });
    
    // Add search results that aren't already in the list
    const merged = [...employees];
    searchResults.forEach(emp => {
      if (!existingMap.has(emp.id)) {
        const attendance = attendanceMap.get(emp.id);
        // Format the employee to match BranchEmployee structure
        merged.push({
          id: emp.id,
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
          avatar: `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase(),
          employeeCode: emp.employeeCode,
          department: emp.department || 'General',
          position: emp.position || 'Worker',
          branchName: emp.branchName || '',
          timeIn: attendance?.timeIn || null,
          timeOut: attendance?.timeOut || null,
          totalHours: attendance?.timeIn && !attendance?.timeOut ? 
            `${Math.floor((new Date().getTime() - new Date(`2000-01-01T${attendance.timeIn}`).getTime()) / (1000 * 60 * 60))}.${Math.floor(((new Date().getTime() - new Date(`2000-01-01T${attendance.timeIn}`).getTime()) / (1000 * 60)) % 60).toString().padStart(2, '0')}` : 
            (attendance?.timeIn && attendance?.timeOut ? 
              `${Math.floor((new Date(`2000-01-01T${attendance.timeOut}`).getTime() - new Date(`2000-01-01T${attendance.timeIn}`).getTime()) / (1000 * 60 * 60))}.${Math.floor(((new Date(`2000-01-01T${attendance.timeOut}`).getTime() - new Date(`2000-01-01T${attendance.timeIn}`).getTime()) / (1000 * 60)) % 60).toString().padStart(2, '0')}` : 
              '0.00'),
          status: attendance?.status || null,
          attendanceId: attendance?.attendanceId || null
        } as BranchEmployee);
      }
    });
    
    return merged;
  }, [employees, searchResults, searchQuery, todayAttendance]);

  // Pagination handlers
  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage(prev => prev + 1);
  };
  
  const goToPrevPage = () => {
    if (currentPage > 1) setCurrentPage(prev => prev - 1);
  };

  // Filter employees based on search and tab
  let filteredEmployees = mergedEmployees.filter(emp => {
    const matchesSearch = emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         emp.id.toString().includes(searchQuery) ||
                         (emp.employeeCode?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    // Filter by tab status
    switch (activeTab) {
      case 'Available':
        // Available: no time in yet OR completed shift (has both timeIn and timeOut)
        return (emp.timeIn === null && emp.timeOut === null) || 
               (emp.timeIn !== null && emp.timeOut !== null);
      case 'Present':
        return emp.timeIn !== null && emp.timeOut === null;
      case 'Absent':
        return emp.status === 'absent' || emp.status === null;
      case 'Summary':
      default:
        return true;
    }
  });
  
  // Sort for Summary tab: Present → Available → Absent
  if (activeTab === 'Summary') {
    filteredEmployees = filteredEmployees.sort((a, b) => {
      const getPriority = (emp: typeof a) => {
        if (emp.timeIn !== null && emp.timeOut === null) return 0;
        if (emp.timeIn === null && emp.timeOut === null) return 1;
        return 2;
      };
      return getPriority(a) - getPriority(b);
    });
  }

  // Stats
  const totalWorkers = filteredEmployees.length;
  const availableCount = filteredEmployees.filter(e => e.timeIn === null && e.timeOut === null).length;
  const presentCount = filteredEmployees.filter(e => e.timeIn !== null && e.timeOut === null).length;
  const absentCount = filteredEmployees.filter(e => e.timeIn === null && e.timeOut === null && (e.status === 'absent' || e.status === null)).length;

  // Get selected branch name
  const selectedBranchData = branches.find(b => b.code === selectedBranch);
  const selectedBranchName = selectedBranchData?.shortName || '';

  const handleUndo = () => {
    refetchEmployees();
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-[#facc15]">
            Welcome! Please select a project to start!
          </h1>
        </div>
        <div className="text-gray-400 text-sm">
          April 20, 2026 11:03
        </div>
      </div>

      {/* Project Selection Section */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Select Deployment Project
          </h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black text-sm font-medium rounded-lg hover:bg-yellow-400 transition-colors w-full sm:w-auto justify-center">
            <Plus className="w-4 h-4" />
            Add Project
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search projects..."
            className="w-full pl-10 pr-4 py-2 bg-[#0a0a0a] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15]"
          />
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-gray-500">
            Showing {indexOfFirstBranch + 1}-{Math.min(indexOfLastBranch, branches.length)} of {branches.length} branches
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={goToPrevPage}
              disabled={currentPage === 1}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:border-[#facc15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400 px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:border-[#facc15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Branch Cards Grid - Rate Limited (6 per page) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
          {currentBranches.map((branch: Branch) => (
            <button
              key={branch.id}
              onClick={() => setSelectedBranch(branch.code)}
              className={`relative p-4 rounded-lg border text-left transition-all ${
                selectedBranch === branch.code
                  ? 'bg-[#facc15] border-[#facc15] text-black'
                  : 'bg-[#1a1a1a] border-[#262626] text-gray-300 hover:border-[#404040]'
              }`}
            >
              {selectedBranch === branch.code && (
                <div 
                  onClick={(e) => { e.stopPropagation(); setSelectedBranch(''); }}
                  role="button"
                  className="absolute top-2 right-2 w-5 h-5 flex items-center justify-center bg-red-500 text-white rounded-full text-xs cursor-pointer hover:bg-red-600"
                >
                  <X className="w-3 h-3" />
                </div>
              )}
              <h3 className={`font-semibold text-sm mb-1 ${selectedBranch === branch.code ? 'text-black' : 'text-white'}`}>
                {branch.shortName}
              </h3>
              <p className={`text-xs ${selectedBranch === branch.code ? 'text-black/70' : 'text-gray-500'}`}>
                {branch.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards - Match Filter Tab Order */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Available</p>
          <p className="text-3xl font-bold text-[#facc15]">{availableCount}</p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Present</p>
          <p className="text-3xl font-bold text-[#facc15]">{presentCount}</p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Absent</p>
          <p className="text-3xl font-bold text-[#facc15]">{absentCount}</p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Total Workers</p>
          <p className="text-3xl font-bold text-white">{totalWorkers}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2">
        {filterTabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
              activeTab === tab
                ? 'bg-[#facc15] text-black'
                : 'bg-[#1a1a1a] text-gray-400 border border-[#262626] hover:border-[#404040]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search employees by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#141414] border border-[#262626] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15]"
          />
        </div>
        <button 
          onClick={handleUndo}
          className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border border-[#262626] text-gray-400 rounded-xl hover:border-[#404040] transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
          Undo
        </button>
      </div>

      {/* Employee Table */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">#</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time In</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time Out</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Total Hours</th>
                {activeTab === 'Summary' && (
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Remarks</th>
                )}
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                    No employees found
                  </td>
                </tr>
              ) : (
                filteredEmployees.map((employee, index) => (
                  <tr key={employee.id} className="border-b border-[#262626] last:border-0 hover:bg-[#1a1a1a]">
                    <td className="px-4 py-4 text-gray-400">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center text-black text-xs font-bold">
                          {employee.avatar}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{employee.name}</p>
                          <p className="text-gray-500 text-xs">Branch: {selectedBranchName} • Dept: {employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400">{employee.timeIn || '--'}</td>
                    <td className="px-4 py-4 text-gray-400">{employee.timeOut || '--'}</td>
                    <td className="px-4 py-4 text-gray-400">{employee.totalHours}</td>
                    {activeTab === 'Summary' && (
                      <td className="px-4 py-4">
                        {employee.timeIn !== null && employee.timeOut === null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            PRESENT
                          </span>
                        ) : employee.timeIn === null && employee.timeOut === null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded-full">
                            <Clock className="w-3 h-3" />
                            AVAILABLE
                          </span>
                        ) : employee.timeIn !== null && employee.timeOut !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            COMPLETED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                            <UserX className="w-3 h-3" />
                            ABSENT
                          </span>
                        )}
                      </td>
                    )}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {employee.timeIn !== null && employee.timeOut === null ? (
                          <button
                            onClick={() => {
                              console.log('Clocking out employee:', employee.id);
                              clockOutMutation.mutate(employee.id);
                            }}
                            disabled={clockOutMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {clockOutMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <LogOut className="w-3 h-3" />
                            )}
                            Time Out
                          </button>
                        ) : employee.timeIn !== null && employee.timeOut !== null ? (
                          // Employee completed shift - allow re-clock in for different branch/task
                          <button
                            onClick={() => {
                              console.log('Re-clocking in employee:', employee.id);
                              clockInMutation.mutate({ employeeId: employee.id, branchCode: selectedBranch });
                            }}
                            disabled={clockInMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {clockInMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <LogIn className="w-3 h-3" />
                            )}
                            Time In
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              console.log('Clocking in employee:', employee.id);
                              clockInMutation.mutate({ employeeId: employee.id, branchCode: selectedBranch });
                            }}
                            disabled={clockInMutation.isPending}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 text-xs font-medium rounded-full hover:bg-green-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {clockInMutation.isPending ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <LogIn className="w-3 h-3" />
                            )}
                            Time In
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Tips */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-4 sm:p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lightbulb className="w-5 h-5 text-[#facc15]" />
          <h3 className="text-[#facc15] font-semibold">Quick Tips</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div className="text-gray-400">
            <span className="text-[#facc15] font-medium">Select a Project:</span> You must select a deployment project first to view and manage its employees.
          </div>
          <div className="text-gray-400">
            <span className="text-[#facc15] font-medium">Marking Attendance:</span> Use the <span className="text-green-400">Time In</span> and <span className="text-red-400">Mark Absent</span> buttons to record daily attendance.
          </div>
          <div className="text-gray-400">
            <span className="text-[#facc15] font-medium">Search:</span> You can search for specific employees within the selected project by name or ID.
          </div>
          <div className="text-gray-400">
            <span className="text-[#facc15] font-medium">Undo:</span> If you make a mistake, look for the &quot;Undo&quot; button to revert the last action.
          </div>
        </div>
      </div>
    </div>
  );
}
