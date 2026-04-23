'use client';

import { useState, useMemo, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { branchApi, attendanceApi, employeeApi, Branch, BranchEmployee, Attendance } from '@/lib/api';
import { AxiosError } from 'axios';
import { Search, Plus, X, RotateCcw, Lightbulb, Clock, UserX, UserCheck, ChevronLeft, ChevronRight, CheckCircle, Loader2, LogIn, LogOut } from 'lucide-react';
import { useWebSocket } from '@/hooks/useWebSocket';
import RecentActivity from '@/components/RecentActivity';

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
  const [flashedEmployeeId, setFlashedEmployeeId] = useState<number | null>(null);
  const { isConnected, joinBranch, leaveBranch, on } = useWebSocket();
  
  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  
  // Mobile detail modal state
  const [selectedEmployeeForModal, setSelectedEmployeeForModal] = useState<BranchEmployee | null>(null);
  
  // Mobile detection effect
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Pagination for branches
  const [currentPage, setCurrentPage] = useState(1);
  const branchesPerPage = 6;

  // Pagination for employees
  const [employeeCurrentPage, setEmployeeCurrentPage] = useState(1);
  const [employeesPerPage, setEmployeesPerPage] = useState(() => {
    // Load from localStorage or use default 20
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('employeesPerPage');
      return saved ? Number(saved) : 20;
    }
    return 20;
  });

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
  const { data: employeesData, isLoading: employeesLoading, refetch: refetchEmployees, error: employeesError } = useQuery({
    queryKey: ['branch-employees', selectedBranch],
    queryFn: async () => {
      if (!selectedBranch) return [];
      console.log('[Attendance] Fetching employees for branch:', selectedBranch);
      const response = await branchApi.getEmployees(selectedBranch);
      console.log('[Attendance] API response:', response.data);
      const employees = response.data?.data || [];
      console.log('[Attendance] Parsed employees:', employees.length, 'items');
      return employees;
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
    onError: (error: AxiosError<{ message?: string; error?: string }>) => {
      console.error('Clock-in error:', error);
      console.log('Error response data:', error.response?.data);
      const message = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to clock in';
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
    onError: (error: AxiosError<{ message?: string }>) => {
      console.error('Clock-out error:', error);
      alert(error.response?.data?.message || error.message || 'Failed to clock out');
    }
  });

  // Individual mark absent mutation
  const markIndividualAbsentMutation = useMutation({
    mutationFn: (employeeId: number) => attendanceApi.markIndividualAbsent(employeeId),
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['branch-employees', selectedBranch], exact: true });
      await queryClient.refetchQueries({ queryKey: ['today-attendance-all'], exact: true });
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      console.error('Mark absent error:', error);
      alert(error.response?.data?.message || error.message || 'Failed to mark as absent');
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
    todayAttendance.forEach((record: Attendance) => {
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
          branchCode: emp.branchCode || null,
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
        // Available: no time in yet OR completed shift (has both timeIn and timeOut), excluding absent
        return emp.status !== 'absent' && 
               ((emp.timeIn === null && emp.timeOut === null) || 
                (emp.timeIn !== null && emp.timeOut !== null));
      case 'Present':
        // Present: active clock-in only (timeIn && !timeOut)
        return emp.timeIn !== null && emp.timeOut === null;
      case 'Absent':
        // Absent: employee has explicit absent status
        return emp.status === 'absent';
      case 'Summary':
      default:
        return true;
    }
  });
  
  // Sort for Summary tab: Completed → Present → Absent/Available
  if (activeTab === 'Summary') {
    filteredEmployees = filteredEmployees.sort((a, b) => {
      const getPriority = (emp: typeof a) => {
        if (emp.timeIn !== null && emp.timeOut !== null) return 0; // Completed first
        if (emp.timeIn !== null && emp.timeOut === null) return 1; // Present second
        return 2; // Absent/Available last
      };
      return getPriority(a) - getPriority(b);
    });
  }

  // Employee pagination calculations
  const employeeTotalPages = Math.ceil(filteredEmployees.length / employeesPerPage);
  const indexOfLastEmployee = employeeCurrentPage * employeesPerPage;
  const indexOfFirstEmployee = indexOfLastEmployee - employeesPerPage;
  const currentEmployees = filteredEmployees.slice(indexOfFirstEmployee, indexOfLastEmployee);

  // Reset employee pagination when filters change (NOT on attendance mutations)
  useEffect(() => {
    setEmployeeCurrentPage(1);
  }, [activeTab, searchQuery, selectedBranch]);

  // WebSocket: Join/leave branch room when selection changes
  useEffect(() => {
    if (selectedBranch) {
      joinBranch(selectedBranch);
    }
    return () => {
      if (selectedBranch) {
        leaveBranch(selectedBranch);
      }
    };
  }, [selectedBranch, joinBranch, leaveBranch]);

  // WebSocket: Listen for attendance updates
  useEffect(() => {
    const handleAttendanceUpdate = (data: any) => {
      console.log('[WebSocket] Attendance update received:', data);
      // Trigger flash animation for the updated employee
      setFlashedEmployeeId(data.employeeId);
      setTimeout(() => setFlashedEmployeeId(null), 1000);
      
      // Refetch employees and attendance data
      queryClient.refetchQueries({ queryKey: ['branch-employees', selectedBranch], exact: true });
      queryClient.refetchQueries({ queryKey: ['today-attendance-all'], exact: true });
    };

    on('attendance:update', handleAttendanceUpdate);

    return () => {
      // Cleanup listener
      // Note: The off function would need to be exposed from useWebSocket
    };
  }, [selectedBranch, queryClient, on]);

  // Keyboard navigation for pagination (works globally)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (filteredEmployees.length <= employeesPerPage) return; // Don't handle if no pagination

      if (e.key === 'ArrowLeft') {
        setEmployeeCurrentPage(prev => Math.max(1, prev - 1));
      } else if (e.key === 'ArrowRight') {
        setEmployeeCurrentPage(prev => Math.min(employeeTotalPages, prev + 1));
      } else if (e.key === 'PageUp') {
        e.preventDefault();
        setEmployeeCurrentPage(prev => Math.max(1, prev - 1));
      } else if (e.key === 'PageDown') {
        e.preventDefault();
        setEmployeeCurrentPage(prev => Math.min(employeeTotalPages, prev + 1));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [employeeTotalPages, filteredEmployees.length, employeesPerPage]);

  // Stats (based on currently filtered list)
  const totalWorkers = filteredEmployees.length;
  const completedCount = filteredEmployees.filter(e => e.timeIn !== null && e.timeOut !== null).length;
  const availableCount = filteredEmployees.filter(e => 
    e.status !== 'absent' && 
    ((e.timeIn === null && e.timeOut === null) || 
     (e.timeIn !== null && e.timeOut !== null))
  ).length;
  const presentCount = filteredEmployees.filter(e => e.timeIn !== null && e.timeOut === null).length;
  const absentCount = filteredEmployees.filter(e => e.status === 'absent').length;

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
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold text-[#facc15]">
            Welcome! Please select a project to start!
          </h1>
          {/* Connection Status Indicator */}
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-xs text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          </div>
        </div>
        <div className="text-gray-400 text-sm">
          {new Date().toLocaleDateString('en-US', { timeZone: 'Asia/Manila', year: 'numeric', month: 'long', day: 'numeric' })} {new Date().toLocaleTimeString('en-US', { timeZone: 'Asia/Manila', hour: '2-digit', minute: '2-digit', hour12: true })}
        </div>
      </div>

      {/* Recent Activity Section */}
      {selectedBranch && <RecentActivity branchCode={selectedBranch} />}

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
              <p className={`text-xs font-mono mb-1 ${selectedBranch === branch.code ? 'text-black/70' : 'text-gray-500'}`}>
                Code: {branch.code}
              </p>
              <p className={`text-xs ${selectedBranch === branch.code ? 'text-black/70' : 'text-gray-500'}`}>
                {branch.description}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Completed</p>
          <p className="text-3xl font-bold text-blue-400">{completedCount}</p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Present</p>
          <p className="text-3xl font-bold text-green-400">{presentCount}</p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Available</p>
          <p className="text-3xl font-bold text-[#facc15]">{availableCount}</p>
        </div>
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <p className="text-gray-400 text-sm uppercase tracking-wider mb-2">Absent</p>
          <p className="text-3xl font-bold text-red-400">{absentCount}</p>
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
        {/* Mobile Card Layout */}
        {isMobile && (
          <div className="sm:hidden">
            {filteredEmployees.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                {!selectedBranch ? (
                  <div>
                    <p className="text-lg mb-2">Select a branch to view employees</p>
                    <p className="text-sm text-gray-500">Click on a project card above to load employees</p>
                  </div>
                ) : employeesLoading ? (
                  <div>
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                    <p>Loading employees...</p>
                  </div>
                ) : employeesError ? (
                  <div className="text-red-400">
                    <p className="text-lg mb-2">Error loading employees</p>
                    <p className="text-sm text-red-500">
                      {String((employeesError as Error)?.message || 'Failed to fetch employees')}
                    </p>
                  </div>
                ) : employees.length === 0 ? (
                  <div>
                    <p className="text-lg mb-2">No employees in this branch</p>
                    <p className="text-sm text-gray-500">
                      Branch: <span className="text-[#facc15]">{selectedBranch}</span> has no assigned employees
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className="text-lg mb-2">No employees match current filters</p>
                    <p className="text-sm text-gray-500">
                      Tab: <span className="text-[#facc15]">{activeTab}</span>
                      {searchQuery && (
                        <span> | Search: "<span className="text-[#facc15]">{searchQuery}</span>"</span>
                      )}
                    </p>
                  </div>
                )}
              </div>
            ) : (
              currentEmployees.map((employee, index) => (
                <div
                  key={employee.id}
                  onClick={() => setSelectedEmployeeForModal(employee)}
                  className={`flex items-center gap-3 p-4 border-b border-[#262626] last:border-0 hover:bg-[#1a1a1a] transition-all cursor-pointer ${
                    flashedEmployeeId === employee.id ? 'bg-[#facc15]/20' : ''
                  }`}
                >
                  <span className="text-gray-400 text-sm w-6">{indexOfFirstEmployee + index + 1}</span>
                  <div className="w-10 h-10 rounded-full bg-[#facc15] flex items-center justify-center text-black text-sm font-bold flex-shrink-0">
                    {employee.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium text-sm truncate">{employee.name}</p>
                  </div>
                  <div className="flex-shrink-0">
                    {employee.timeIn !== null && employee.timeOut !== null ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        COMPLETED
                      </span>
                    ) : employee.timeIn !== null && employee.timeOut === null ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                        <CheckCircle className="w-3 h-3" />
                        PRESENT
                      </span>
                    ) : employee.status === 'absent' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                        <UserX className="w-3 h-3" />
                        ABSENT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded-full">
                        <Clock className="w-3 h-3" />
                        AVAILABLE
                      </span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Desktop Table */}
        <div className={`overflow-x-auto ${isMobile ? 'hidden' : ''}`}>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#262626]">
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">#</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Time In</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Time Out</th>
                <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Total Hours</th>
                {activeTab === 'Summary' && (
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Remarks</th>
                )}
                {/* Actions column - hide ONLY in Summary tab on mobile, visible in other tabs on mobile */}
                {!(activeTab === 'Summary' && isMobile) && (
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider hidden sm:table-cell">Actions</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filteredEmployees.length === 0 ? (
                <tr>
                  <td colSpan={isMobile ? 2 : (activeTab === 'Summary' ? 7 : 6)} className="px-4 py-8 text-center">
                    {!selectedBranch ? (
                      <div className="text-gray-400">
                        <p className="text-lg mb-2">Select a branch to view employees</p>
                        <p className="text-sm text-gray-500">Click on a project card above to load employees</p>
                      </div>
                    ) : employeesLoading ? (
                      <div className="text-gray-400">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                        <p>Loading employees...</p>
                      </div>
                    ) : employeesError ? (
                      <div className="text-red-400">
                        <p className="text-lg mb-2">Error loading employees</p>
                        <p className="text-sm text-red-500">
                          {String((employeesError as Error)?.message || 'Failed to fetch employees')}
                        </p>
                        <button
                          onClick={() => refetchEmployees()}
                          className="mt-3 text-sm text-[#facc15] hover:underline"
                        >
                          Retry
                        </button>
                      </div>
                    ) : employees.length === 0 ? (
                      <div className="text-gray-400">
                        <p className="text-lg mb-2">No employees in this branch</p>
                        <p className="text-sm text-gray-500">
                          Branch: <span className="text-[#facc15]">{selectedBranch}</span> has no assigned employees
                        </p>
                        <p className="text-xs text-gray-600 mt-2">
                          (Check: 1) Employees have branchCode=&quot;{selectedBranch}&quot; in DB, 2) status=&quot;Active&quot;)
                        </p>
                      </div>
                    ) : (
                      <div className="text-gray-400">
                        <p className="text-lg mb-2">No employees match current filters</p>
                        <p className="text-sm text-gray-500">
                          Tab: <span className="text-[#facc15]">{activeTab}</span>
                          {searchQuery && (
                            <span> | Search: &quot;<span className="text-[#facc15]">{searchQuery}</span>&quot;</span>
                          )}
                        </p>
                        <button
                          onClick={() => { setActiveTab('Summary'); setSearchQuery(''); }}
                          className="mt-3 text-sm text-[#facc15] hover:underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ) : (
                currentEmployees.map((employee, index) => (
                  <tr
                    key={employee.id}
                    className={`border-b border-[#262626] last:border-0 hover:bg-[#1a1a1a] transition-all ${
                      flashedEmployeeId === employee.id ? 'bg-[#facc15]/20' : ''
                    }`}
                  >
                    <td className="px-4 py-4 text-gray-400 hidden sm:table-cell">{indexOfFirstEmployee + index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#facc15] flex items-center justify-center text-black text-xs font-bold">
                          {employee.avatar}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{employee.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400 hidden sm:table-cell">{employee.timeIn || '--'}</td>
                    <td className="px-4 py-4 text-gray-400 hidden sm:table-cell">{employee.timeOut || '--'}</td>
                    <td className="px-4 py-4 text-gray-400 hidden sm:table-cell">{employee.totalHours}</td>
                    {activeTab === 'Summary' && (
                      <td className="px-4 py-4 hidden sm:table-cell">
                        {employee.timeIn !== null && employee.timeOut !== null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-500/20 text-blue-400 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            COMPLETED
                          </span>
                        ) : employee.timeIn !== null && employee.timeOut === null ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                            <CheckCircle className="w-3 h-3" />
                            PRESENT
                          </span>
                        ) : employee.status === 'absent' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-500/20 text-red-400 text-xs font-medium rounded-full">
                            <UserX className="w-3 h-3" />
                            ABSENT
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded-full">
                            <Clock className="w-3 h-3" />
                            AVAILABLE
                          </span>
                        )}
                      </td>
                    )}
                    {!(activeTab === 'Summary' && isMobile) && (
                      <td className="px-4 py-4 hidden sm:table-cell">
                      {employee.status === 'absent' ? (
                        <span className="text-gray-500 text-sm">No actions available</span>
                      ) : (
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
                          <>
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
                            <button
                              onClick={() => {
                                console.log('Absent button clicked for employee:', employee.id, employee.name);
                                if (window.confirm(`Mark ${employee.name} as absent for today?`)) {
                                  console.log('Confirmed, marking absent');
                                  markIndividualAbsentMutation.mutate(employee.id);
                                } else {
                                  console.log('Cancelled');
                                }
                              }}
                              disabled={markIndividualAbsentMutation.isPending}
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 text-xs font-medium rounded-full hover:bg-red-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {markIndividualAbsentMutation.isPending ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <UserX className="w-3 h-3" />
                              )}
                              Absent
                            </button>
                          </>
                        )}
                      </div>
                      )}
                    </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Employee Detail Modal */}
      {selectedEmployeeForModal && isMobile && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] rounded-xl border border-[#262626] w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-white">Employee Details</h3>
                <button
                  onClick={() => setSelectedEmployeeForModal(null)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-full bg-[#facc15] flex items-center justify-center text-black text-xl font-bold">
                  {selectedEmployeeForModal.avatar}
                </div>
                <div>
                  <p className="text-white font-semibold text-lg">{selectedEmployeeForModal.name}</p>
                  <p className="text-gray-400 text-sm">ID: {selectedEmployeeForModal.id}</p>
                </div>
              </div>

              {/* Status Badge */}
              <div className="mb-6">
                {selectedEmployeeForModal.timeIn !== null && selectedEmployeeForModal.timeOut !== null ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-sm font-medium rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    COMPLETED
                  </span>
                ) : selectedEmployeeForModal.timeIn !== null && selectedEmployeeForModal.timeOut === null ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-500/20 text-green-400 text-sm font-medium rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    PRESENT
                  </span>
                ) : selectedEmployeeForModal.status === 'absent' ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-500/20 text-red-400 text-sm font-medium rounded-full">
                    <UserX className="w-4 h-4" />
                    ABSENT
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#facc15]/20 text-[#facc15] text-sm font-medium rounded-full">
                    <Clock className="w-4 h-4" />
                    AVAILABLE
                  </span>
                )}
              </div>

              {/* Time Details */}
              <div className="space-y-3 mb-6">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Time In:</span>
                  <span className="text-white text-sm">{selectedEmployeeForModal.timeIn || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Time Out:</span>
                  <span className="text-white text-sm">{selectedEmployeeForModal.timeOut || '--'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Total Hours:</span>
                  <span className="text-white text-sm">{selectedEmployeeForModal.totalHours}</span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedEmployeeForModal.status !== 'absent' && (
                <div className="flex flex-col gap-3">
                  {selectedEmployeeForModal.timeIn !== null && selectedEmployeeForModal.timeOut === null ? (
                    <button
                      onClick={() => {
                        clockOutMutation.mutate(selectedEmployeeForModal.id);
                        setSelectedEmployeeForModal(null);
                      }}
                      disabled={clockOutMutation.isPending}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                    >
                      {clockOutMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogOut className="w-4 h-4" />
                      )}
                      Time Out
                    </button>
                  ) : selectedEmployeeForModal.timeIn !== null && selectedEmployeeForModal.timeOut !== null ? (
                    <button
                      onClick={() => {
                        clockInMutation.mutate({ employeeId: selectedEmployeeForModal.id, branchCode: selectedBranch });
                        setSelectedEmployeeForModal(null);
                      }}
                      disabled={clockInMutation.isPending}
                      className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                    >
                      {clockInMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <LogIn className="w-4 h-4" />
                      )}
                      Time In
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => {
                          clockInMutation.mutate({ employeeId: selectedEmployeeForModal.id, branchCode: selectedBranch });
                          setSelectedEmployeeForModal(null);
                        }}
                        disabled={clockInMutation.isPending}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 text-sm font-medium rounded-lg hover:bg-green-500/30 transition-colors disabled:opacity-50"
                      >
                        {clockInMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <LogIn className="w-4 h-4" />
                        )}
                        Time In
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`Mark ${selectedEmployeeForModal.name} as absent for today?`)) {
                            markIndividualAbsentMutation.mutate(selectedEmployeeForModal.id);
                            setSelectedEmployeeForModal(null);
                          }
                        }}
                        disabled={markIndividualAbsentMutation.isPending}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-red-500/20 text-red-400 text-sm font-medium rounded-lg hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {markIndividualAbsentMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserX className="w-4 h-4" />
                        )}
                        Mark Absent
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Pagination Controls - Mobile Simplified */}
      {filteredEmployees.length > employeesPerPage && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-4 border-t border-[#262626] gap-4">
          <span className="text-sm text-gray-500">
            {indexOfFirstEmployee + 1}-{Math.min(indexOfLastEmployee, filteredEmployees.length)} of {filteredEmployees.length}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setEmployeeCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={employeeCurrentPage === 1}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:border-[#facc15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Previous page (Arrow Left)"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm text-gray-400 px-2">
              {employeeCurrentPage}/{employeeTotalPages}
            </span>
            <button
              onClick={() => setEmployeeCurrentPage(prev => Math.min(employeeTotalPages, prev + 1))}
              disabled={employeeCurrentPage === employeeTotalPages}
              className="p-2 rounded-lg bg-[#1a1a1a] border border-[#262626] text-gray-400 hover:border-[#facc15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Next page (Arrow Right)"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Go to:</span>
            <input
              type="number"
              min="1"
              max={employeeTotalPages}
              value={employeeCurrentPage}
              onChange={(e) => {
                const page = Number(e.target.value);
                if (page >= 1 && page <= employeeTotalPages) {
                  setEmployeeCurrentPage(page);
                }
              }}
              className="w-16 bg-[#1a1a1a] border border-[#262626] rounded-lg px-2 py-1.5 text-sm text-gray-400 focus:outline-none focus:border-[#facc15]"
              placeholder="1"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">Show:</span>
            <select
              value={employeesPerPage}
              onChange={(e) => {
                const newSize = Number(e.target.value);
                setEmployeesPerPage(newSize);
                localStorage.setItem('employeesPerPage', newSize.toString());
                setEmployeeCurrentPage(1);
              }}
              className="bg-[#1a1a1a] border border-[#262626] rounded-lg px-2 py-1 text-sm text-gray-400 focus:outline-none focus:border-[#facc15]"
            >
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
        </div>
      )}

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
