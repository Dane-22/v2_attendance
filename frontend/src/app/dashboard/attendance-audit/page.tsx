'use client';

import { useState, useMemo, useEffect } from 'react';
import { useTheme } from '@/hooks/useTheme';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { createPortal } from 'react-dom';
import { attendanceApi, branchApi, employeeApi, Attendance, Branch, Employee } from '@/lib/api';
import ProfileImage from '@/components/ProfileImage';
import ImagePreview from '@/components/ImagePreview';
import { 
  Search, 
  Calendar,
  ChevronLeft,
  ChevronRight,
  FileText,
  Download,
  User,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Ban,
  X,
  MapPin,
  Building2,
  CalendarDays,
  Briefcase,
  Loader2,
  RefreshCw
} from 'lucide-react';

const constructImageUrl = (profileImage: string | null | undefined): string | null => {
  if (!profileImage) return null;

  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5000';
  const imagePath = profileImage.startsWith('/') ? profileImage : `/${profileImage}`;

  try {
    return new URL(`${baseUrl}${imagePath}`).toString();
  } catch {
    return null;
  }
};

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

// Helper to get Philippines day of month
const getPhilippinesDay = (): number => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    day: 'numeric'
  });
  return parseInt(formatter.format(now), 10);
};

const formatSyncTime = (timestamp: number): string => {
  if (!timestamp) return 'Never';
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  }).format(new Date(timestamp));
};

// Generate calendar data based on branch filter
const generateCalendarDays = (branchFilter: string, currentDay: number, month: number, year: number) => {
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();

  // Get current Philippines date for "today" marker
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Manila',
    day: 'numeric',
    month: 'numeric',
    year: 'numeric'
  });
  const philippinesDate = formatter.format(now);
  const [pMonth, pDay, pYear] = philippinesDate.split('/').map(Number);
  const philippinesMonth = pMonth - 1; // Convert to 0-11
  const philippinesYear = pYear;
  const philippinesDay = pDay;

  const days = [];

  // Previous month padding
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    days.push({ day: prevMonthDays - i, prevMonth: true });
  }

  // Current month days
  for (let day = 1; day <= daysInMonth; day++) {
    const dayData: any = { day };

    // Mark today based on Philippines date
    if (year === philippinesYear && month === philippinesMonth && day === philippinesDay) {
      dayData.today = true;
    }

    // Mark selected
    if (day === currentDay) {
      dayData.selected = true;
    }

    days.push(dayData);
  }

  // Next month padding
  const remainingCells = 42 - days.length;
  for (let day = 1; day <= remainingCells; day++) {
    days.push({ day, nextMonth: true });
  }

  return days;
};


// Modal Calendar Component
function EmployeeAttendanceModal({ 
  employee, 
  isOpen, 
  onClose,
  initialMonth,
  initialYear
}: { 
  employee: AuditRecord | null; 
  isOpen: boolean; 
  onClose: () => void;
  initialMonth: number;
  initialYear: number;
}) {
  const [modalMonth, setModalMonth] = useState(initialMonth);
  const [modalYear, setModalYear] = useState(initialYear);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  
  // Calculate date range for the modal month
  const startDate = useMemo(() => {
    return `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-01`;
  }, [modalMonth, modalYear]);

  const endDate = useMemo(() => {
    const daysInMonth = new Date(modalYear, modalMonth + 1, 0).getDate();
    return `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  }, [modalMonth, modalYear]);
  
  // Fetch real attendance data for this employee
  const { data: employeeAttendanceData, isLoading } = useQuery({
    queryKey: ['employee-attendance-modal', employee?.employeeId, startDate, endDate],
    queryFn: async () => {
      if (!employee?.employeeId) return [];
      const response = await attendanceApi.getAll({
        employeeId: employee.employeeId,
        startDate,
        endDate
      });
      return response.data.data || [];
    },
    enabled: isOpen && !!employee?.employeeId,
    staleTime: 30000
  });
  
  // Group attendance records by day - support multiple records per day
  const attendanceHistory = useMemo(() => {
    const history: Record<number, { records: any[]; summary: { present: number; late: number; absent: number } }> = {};
    
    if (!employeeAttendanceData) return history;
    
    employeeAttendanceData.forEach((record: Attendance) => {
      const recordDate = new Date(record.date);
      const day = recordDate.getDate();
      
      if (!history[day]) {
        history[day] = { records: [], summary: { present: 0, late: 0, absent: 0 } };
      }
      
      // Format times from actual check_in/check_out
      const timeIn = record.check_in 
        ? new Date(record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '-';
      const timeOut = record.check_out 
        ? new Date(record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '-';
      
      history[day].records.push({
        status: record.status,
        timeIn,
        timeOut,
        location: record.branch_code || 'Unknown',
        notes: record.notes
      });
      
      // Update summary counts
      if (record.status === 'present') history[day].summary.present++;
      else if (record.status === 'late') history[day].summary.late++;
      else if (record.status === 'absent') history[day].summary.absent++;
    });
    
    return history;
  }, [employeeAttendanceData]);
  
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Sync modal month/year when initial values change - MUST be before early return
  useEffect(() => {
    setModalMonth(initialMonth);
    setModalYear(initialYear);
  }, [initialMonth, initialYear]);
  
  if (!isOpen || !employee) return null;
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (modalMonth === 0) {
        setModalMonth(11);
        setModalYear(y => y - 1);
      } else {
        setModalMonth(m => m - 1);
      }
    } else {
      if (modalMonth === 11) {
        setModalMonth(0);
        setModalYear(y => y + 1);
      } else {
        setModalMonth(m => m + 1);
      }
    }
  };
  
  // Generate calendar days for modal
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  
  const daysInMonth = getDaysInMonth(modalMonth, modalYear);
  const firstDay = getFirstDayOfMonth(modalMonth, modalYear);
  
  const modalCalendarDays = [];
  // Previous month padding
  const prevMonthDays = getDaysInMonth(modalMonth === 0 ? 11 : modalMonth - 1, modalMonth === 0 ? modalYear - 1 : modalYear);
  for (let i = firstDay - 1; i >= 0; i--) {
    modalCalendarDays.push({ day: prevMonthDays - i, prevMonth: true });
  }
  // Current month
  for (let day = 1; day <= daysInMonth; day++) {
    const record = attendanceHistory[day];
    modalCalendarDays.push({ 
      day, 
      record,
      isCurrentMonth: true
    });
  }
  // Next month padding
  const remainingCells = 42 - modalCalendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    modalCalendarDays.push({ day, nextMonth: true });
  }
  
  const getStatusColor = (status: string | null | undefined) => {
    switch (status) {
      case 'present': return 'bg-green-500/30 border-green-500/50';
      case 'late': return 'bg-[#facc15]/30 /50';
      case 'absent': return 'bg-red-500/30 border-red-500/50';
      default: return ' ';
    }
  };
  
  const getStatusText = (status: string | null | undefined) => {
    switch (status) {
      case 'present': return 'Present';
      case 'late': return 'Late';
      case 'absent': return 'Absent';
      default: return 'No Record';
    }
  };
  
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl  rounded-2xl border  shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
              <User className="w-5 h-5 " />
            </div>
            <div>
              <h2 className="text-xl font-bold ">{employee.name}</h2>
              <span className="inline-flex items-center px-2 py-0.5 bg-[#facc15]/20  text-xs font-medium rounded">
                WORKER
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {/* Month Navigation */}
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 " />
              </button>
              <span className=" font-medium min-w-[120px] text-center">
                {monthNames[modalMonth]} {modalYear}
              </span>
              <button 
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 " />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-500/20  hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Modal Calendar */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs  py-2 font-medium">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {modalCalendarDays.map((item, index) => (
              <div
                key={index}
                className={`aspect-square p-2 rounded-lg border transition-all ${
                  item.prevMonth || item.nextMonth
                    ? 'bg-transparent border-transparent text-gray-600'
                    : item.record?.records && item.record.records.length > 0
                    ? `${getStatusColor(item.record.records[0].status)} `
                    : '  '
                }`}
              >
                <div className="flex flex-col h-full justify-between">
                  <span className="text-sm font-medium">{item.day}</span>
                  {item.record?.records && item.record.records.length > 0 && (
                    <div className="text-[9px] leading-tight">
                      {/* Show first record */}
                      <div className="text-gray-300">{item.record.records[0].timeIn}</div>
                      <div className="">{item.record.records[0].timeOut}</div>
                      <div className="flex items-center gap-0.5 mt-0.5 ">
                        <MapPin className="w-2 h-2" />
                        <span className="truncate">{item.record.records[0].location}</span>
                      </div>
                      {/* Show count if multiple records - clickable */}
                      {item.record.records.length > 1 && (
                        <div 
                          className=" mt-0.5 cursor-pointer hover:text-yellow-400 hover:underline"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedDay(item.day);
                          }}
                        >
                          +{item.record.records.length - 1} more
                        </div>
                      )}
                      <div className={`mt-1 font-medium ${
                        item.record.records[0].status === 'present' ? 'text-green-400' :
                        item.record.records[0].status === 'late' ? '' :
                        item.record.records[0].status === 'absent' ? 'text-red-400' : ''
                      }`}>
                        {getStatusText(item.record.records[0].status)}
                      </div>
                      {/* Summary if multiple records with different statuses */}
                      {(item.record.summary.present > 0 || item.record.summary.late > 0 || item.record.summary.absent > 0) && (
                        <div className="mt-1 pt-1 border-t  flex gap-1 text-[8px]">
                          {item.record.summary.present > 0 && <span className="text-green-400">{item.record.summary.present}P</span>}
                          {item.record.summary.late > 0 && <span className="">{item.record.summary.late}L</span>}
                          {item.record.summary.absent > 0 && <span className="text-red-400">{item.record.summary.absent}A</span>}
                        </div>
                      )}
                    </div>
                  )}
                  {(!item.record?.records || item.record.records.length === 0) && !item.prevMonth && !item.nextMonth && (
                    <span className="text-[9px] text-gray-600 mt-auto">No Record</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Selected Day Details */}
        {selectedDay && attendanceHistory[selectedDay] && (
          <div className="px-6 pb-4">
            <div className=" rounded-lg border  p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className=" font-medium">
                  {monthNames[modalMonth]} {selectedDay}, {modalYear} - All Records ({attendanceHistory[selectedDay].records.length})
                </h3>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-1 hover:bg-red-500/20  hover:text-red-400 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {attendanceHistory[selectedDay].records.map((record, ridx) => (
                  <div key={ridx} className="flex items-center justify-between py-2 px-3  rounded border ">
                    <div className="flex items-center gap-3">
                      <span className={`text-xs px-2 py-0.5 rounded border ${
                        record.status === 'present' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                        record.status === 'late' ? '  ' :
                        record.status === 'absent' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                        ' border-gray-500/30 bg-gray-500/10'
                      }`}>
                        {record.status || 'No Record'}
                      </span>
                      <div className="flex items-center gap-1 ">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs">{record.location}</span>
                      </div>
                    </div>
                    <div className="text-xs ">
                      {record.timeIn} - {record.timeOut}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 px-6 py-4 border-t  text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
            <span className="">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#facc15]/30 border /50" />
            <span className="">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
            <span className="">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded  border " />
            <span className="">No Record</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Branch Attendance Modal Component
function BranchAttendanceModal({
  branch,
  isOpen,
  onClose,
  records,
  initialMonth,
  initialYear
}: {
  branch: string | null;
  isOpen: boolean;
  onClose: () => void;
  records: AuditRecord[];
  initialMonth: number;
  initialYear: number;
}) {
  const [modalMonth, setModalMonth] = useState(initialMonth);
  const [modalYear, setModalYear] = useState(initialYear);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Calculate date range for the modal month
  const startDate = useMemo(() => {
    return `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-01`;
  }, [modalMonth, modalYear]);

  const endDate = useMemo(() => {
    const daysInMonth = new Date(modalYear, modalMonth + 1, 0).getDate();
    return `${modalYear}-${String(modalMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  }, [modalMonth, modalYear]);

  // Fetch real attendance data for this branch
  const { data: branchAttendanceData } = useQuery({
    queryKey: ['branch-attendance-modal', branch, startDate, endDate],
    queryFn: async () => {
      if (!branch) return [];
      const response = await attendanceApi.getAll({
        startDate,
        endDate
      });
      // Filter by branch code
      const allRecords = response.data.data || [];
      return allRecords.filter((record: Attendance) => record.branch_code === branch);
    },
    enabled: isOpen && !!branch,
    staleTime: 30000
  });

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  // Sync modal month/year when initial values change
  useEffect(() => {
    setModalMonth(initialMonth);
    setModalYear(initialYear);
  }, [initialMonth, initialYear]);

  if (!isOpen || !branch) return null;

  // Generate branch employees data from filtered records
  const branchEmployees = records.filter((emp: AuditRecord) => emp.branch === branch);
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (modalMonth === 0) {
        setModalMonth(11);
        setModalYear(y => y - 1);
      } else {
        setModalMonth(m => m - 1);
      }
    } else {
      if (modalMonth === 11) {
        setModalMonth(0);
        setModalYear(y => y + 1);
      } else {
        setModalMonth(m => m + 1);
      }
    }
  };

  // Generate calendar days
  const getDaysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();

  const daysInMonth = getDaysInMonth(modalMonth, modalYear);
  const firstDay = getFirstDayOfMonth(modalMonth, modalYear);

  const modalCalendarDays = [];
  const prevMonthDays = getDaysInMonth(modalMonth === 0 ? 11 : modalMonth - 1, modalMonth === 0 ? modalYear - 1 : modalYear);
  for (let i = firstDay - 1; i >= 0; i--) {
    modalCalendarDays.push({ day: prevMonthDays - i, prevMonth: true });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    modalCalendarDays.push({ day, isCurrentMonth: true });
  }
  const remainingCells = 42 - modalCalendarDays.length;
  for (let day = 1; day <= remainingCells; day++) {
    modalCalendarDays.push({ day, nextMonth: true });
  }

  // Generate daily records for branch from real attendance data
  const generateDailyRecords = (day: number) => {
    const records: { name: string; timeIn: string; timeOut: string; location: string; status: 'present' | 'late' | 'absent' | null; employeeCode: string }[] = [];
    
    if (!branchAttendanceData) {
      return {
        records: [],
        summary: { present: 0, late: 0, absent: 0, total: branchEmployees.length }
      };
    }
    
    // Filter records for this specific day
    const dayRecords = branchAttendanceData.filter((record: Attendance) => {
      const recordDate = new Date(record.date);
      return recordDate.getDate() === day;
    });
    
    // Group by employee to handle multiple entries
    const employeeRecords: Record<number, any[]> = {};
    dayRecords.forEach((record: Attendance) => {
      if (!employeeRecords[record.employeeId]) {
        employeeRecords[record.employeeId] = [];
      }
      employeeRecords[record.employeeId].push(record);
    });
    
    // Build records from real data
    Object.entries(employeeRecords).forEach(([empId, empRecords]) => {
      const firstRecord = empRecords[0];
      const empData = branchEmployees.find(e => e.employeeId === parseInt(empId));
      
      // Format times from actual check_in/check_out - handle multiple records
      const timeIn = firstRecord.check_in 
        ? new Date(firstRecord.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '-';
      const timeOut = firstRecord.check_out 
        ? new Date(firstRecord.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
        : '-';
      
      records.push({
        name: empData?.name || `Employee ${empId}`,
        timeIn,
        timeOut,
        location: firstRecord.branch_code || branch,
        status: firstRecord.status,
        employeeCode: empData?.code || ''
      });
    });
    
    // Calculate summary from real data
    const presentCount = records.filter(r => r.status === 'present').length;
    const lateCount = records.filter(r => r.status === 'late').length;
    const absentCount = records.filter(r => r.status === 'absent').length;
    
    return {
      records,
      summary: { present: presentCount, late: lateCount, absent: absentCount, total: branchEmployees.length }
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-400';
      case 'late': return '';
      case 'absent': return 'text-red-400';
      default: return '';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-7xl  rounded-2xl border  shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 " />
            </div>
            <div>
              <h2 className="text-xl font-bold ">{branch}</h2>
              <span className="inline-flex items-center px-2 py-0.5 bg-[#facc15]/20  text-xs font-medium rounded">
                ALL EMPLOYEES
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 " />
              </button>
              <span className=" font-medium min-w-[120px] text-center">
                {monthNames[modalMonth]} {modalYear}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 " />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20  hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Calendar */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs  py-2 font-medium  rounded">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-2">
            {modalCalendarDays.map((item, index) => {
              const dayData = item.isCurrentMonth ? generateDailyRecords(item.day) : null;
              return (
                <div
                  key={index}
                  className={`min-h-[140px] p-2 rounded-lg border transition-all cursor-pointer ${
                    item.prevMonth || item.nextMonth
                      ? 'bg-transparent border-transparent'
                      : selectedDay === item.day
                      ? ' '
                      : '  hover:'
                  }`}
                  onClick={() => item.isCurrentMonth && setSelectedDay(item.day)}
                >
                  {item.isCurrentMonth && (
                    <div className="flex flex-col h-full">
                      <span className="text-sm font-medium  mb-2">{item.day}</span>
                      {dayData && dayData.summary.total > 0 && (
                        <div className="flex-1 space-y-1 overflow-hidden">
                          {dayData.records.slice(0, 4).map((record, ridx) => (
                            <div key={ridx} className="text-[10px] leading-tight truncate">
                              <span className={getStatusColor(record.status || '')}>{record.name}</span>
                            </div>
                          ))}
                          {dayData.records.length > 4 && (
                            <div 
                              className="text-[10px]  hover:text-yellow-400 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedDay(item.day);
                              }}
                            >
                              +{dayData.records.length - 4} more
                            </div>
                          )}
                        </div>
                      )}
                      {dayData && dayData.summary.total > 0 && (
                        <div className="mt-1 pt-1 border-t  text-[9px]  flex justify-between">
                          <span className="text-green-400">{dayData.summary.present} P</span>
                          <span className="">{dayData.summary.late} L</span>
                          <span className="text-red-400">{dayData.summary.absent} A</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selected Day Details */}
          {selectedDay && (
            <div className="mt-4 p-4  rounded-lg border ">
              <div className="flex items-center justify-between mb-3">
                <h3 className=" font-medium">
                  {monthNames[modalMonth]} {selectedDay}, {modalYear} - All Records
                </h3>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-1 hover:bg-red-500/20  hover:text-red-400 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {(() => {
                const dayData = generateDailyRecords(selectedDay);
                return dayData.records.length > 0 ? (
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {dayData.records.map((record, ridx) => (
                      <div key={ridx} className="flex items-center justify-between py-2 px-3  rounded border ">
                        <div className="flex items-center gap-3">
                          <span className={getStatusColor(record.status || '')}>{record.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded border ${getStatusColor(record.status || '')}`}>
                            {record.status || 'No Record'}
                          </span>
                        </div>
                        <div className="text-[10px] ">
                          {record.timeIn} - {record.timeOut}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className=" text-sm">No records for this day</p>
                );
              })()}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 px-6 py-4 border-t  text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
            <span className="">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#facc15]/30 border /50" />
            <span className="">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
            <span className="">Absent</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Day Details Modal Component
function DayDetailsModal({
  isOpen,
  onClose,
  selectedDate,
  calendarMonth,
  calendarYear,
  monthlyAttendanceData,
  selectedBranchFilter
}: {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: number;
  calendarMonth: number;
  calendarYear: number;
  monthlyAttendanceData: Attendance[];
  selectedBranchFilter: string;
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Filter records for the selected date
  const dayRecords = monthlyAttendanceData.filter((record: Attendance) => {
    const recordDate = new Date(record.date);
    const day = recordDate.getDate();
    const month = recordDate.getMonth();
    const year = recordDate.getFullYear();

    if (day !== selectedDate || month !== calendarMonth || year !== calendarYear) {
      return false;
    }

    if (selectedBranchFilter !== 'ALL' && record.branch_code !== selectedBranchFilter) {
      return false;
    }

    return true;
  });

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const displayDate = `${monthNames[calendarMonth]} ${selectedDate}, ${calendarYear}`;

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'present': return 'text-green-400';
      case 'late': return '';
      case 'absent': return 'text-red-400';
      default: return '';
    }
  };

  const getStatusBg = (status: string | null) => {
    switch (status) {
      case 'present': return 'bg-green-500/20 border-green-500/30';
      case 'late': return 'bg-[#facc15]/20 ';
      case 'absent': return 'bg-red-500/20 border-red-500/30';
      default: return ' ';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl  rounded-2xl border  shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b ">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
              <FileText className="w-5 h-5 " />
            </div>
            <div>
              <h2 className="text-xl font-bold ">{displayDate}</h2>
              <span className="text-sm ">{dayRecords.length} records</span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-red-500/20  hover:text-red-400 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {dayRecords.length === 0 ? (
            <div className="text-center py-12">
              <p className="">No records found for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayRecords.map((record: Attendance) => (
                <div key={record.id} className=" rounded-lg border  p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className=" font-medium">Employee ID: {record.employeeId}</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium border ${getStatusBg(record.status)} ${getStatusColor(record.status)}`}>
                          {record.status || 'No Record'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="">Branch:</span>
                          <span className="text-gray-300 ml-2">{record.branch_code || '-'}</span>
                        </div>
                        <div>
                          <span className="">Check In:</span>
                          <span className="text-gray-300 ml-2">
                            {record.check_in ? new Date(record.check_in).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                        <div>
                          <span className="">Check Out:</span>
                          <span className="text-gray-300 ml-2">
                            {record.check_out ? new Date(record.check_out).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : '-'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 px-6 py-4 border-t  text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
            <span className="">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#facc15]/20 border " />
            <span className="">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
            <span className="">Absent</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Schedule Modal Component
function ScheduleModal({
  employee,
  isOpen,
  onClose
}: {
  employee: AuditRecord | null;
  isOpen: boolean;
  onClose: () => void;
}) {
  const [currentWeek, setCurrentWeek] = useState(20); // Week starting April 20

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setCurrentWeek(20);
    }
  }, [isOpen, employee?.id]);

  if (!isOpen || !employee) return null;

  // Generate week days (Sun-Sat)
  const weekDays = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const weekDates = [20, 21, 22, 23, 24, 25, 26]; // April 20-26, 2026

  // Generate schedule data for the week
  const generateScheduleData = () => {
    const schedule: Record<number, { timeIn: string; timeOut: string; status: 'present' | 'late' | 'absent' | 'restday'; notes?: string }> = {};
    
    weekDates.forEach((date, idx) => {
      // Weekend rest days
      if (idx === 0 || idx === 6) {
        schedule[date] = { timeIn: '-', timeOut: '-', status: 'restday', notes: 'Rest Day' };
        return;
      }
      
      const seed = employee.code.charCodeAt(1) + date;
      const rand = (seed * 9301 + 49297) % 233280 / 233280;
      
      if (rand > 0.9) {
        schedule[date] = { timeIn: '-', timeOut: '-', status: 'absent', notes: 'Absent (Auto)' };
      } else if (rand > 0.75) {
        schedule[date] = { 
          timeIn: `08:${Math.floor(rand * 30 + 15).toString().padStart(2, '0')} AM`, 
          timeOut: `05:${Math.floor(rand * 30).toString().padStart(2, '0')} PM`, 
          status: 'late',
          notes: 'Late - 15+ min'
        };
      } else {
        schedule[date] = { 
          timeIn: `06:${Math.floor(rand * 30 + 30).toString().padStart(2, '0')} AM`, 
          timeOut: `0${Math.floor(rand * 2 + 3)}:${Math.floor(rand * 30).toString().padStart(2, '0')} PM`, 
          status: 'present',
          notes: 'On Time'
        };
      }
    });
    
    return schedule;
  };

  const scheduleData = generateScheduleData();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'late': return 'bg-[#facc15]/20  ';
      case 'absent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'restday': return 'bg-gray-500/10  border-gray-500/20';
      default: return '  ';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'late': return 'Late';
      case 'absent': return 'Absent';
      case 'restday': return 'Rest Day';
      default: return '-';
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl rounded-2xl border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 sm:px-6 py-4 border-b">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-bold truncate">{employee.name}</h2>
              <div className="flex items-center gap-2 text-sm">
                <Briefcase className="w-3 h-3" />
                <span className="truncate">Worker • {employee.code} • {employee.branch}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeek(w => w - 7)}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-medium text-sm sm:text-base">
                Week of April {currentWeek}, 2026
              </span>
              <button
                onClick={() => setCurrentWeek(w => w + 7)}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Schedule Grid */}
        <div className="p-4 sm:p-6 overflow-y-auto">
          <div className="md:hidden -mx-1 px-1 flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2">
            {weekDays.map((day, idx) => {
              const date = weekDates[idx];
              const data = scheduleData[date];
              return (
                <div key={day} className="snap-start shrink-0 w-[170px] rounded-xl border overflow-hidden">
                  <div className="bg-[#262626] px-3 py-2 text-center">
                    <div className="text-xs font-medium">{day}</div>
                    <div className="text-lg font-bold">{date}</div>
                  </div>
                  <div className="p-3 space-y-3">
                    <div className={`p-2 rounded-lg border text-center ${getStatusColor(data.status)}`}>
                      <div className="text-xs font-medium">{getStatusText(data.status)}</div>
                    </div>
                    {data.status !== 'restday' && data.status !== 'absent' && (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span>In:</span>
                            <span className="font-medium">{data.timeIn}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span>Out:</span>
                            <span className="font-medium">{data.timeOut}</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3" />
                            <span className="text-xs">{data.notes}</span>
                          </div>
                        </div>
                      </>
                    )}
                    {data.status === 'absent' && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400">{data.notes}</span>
                        </div>
                      </div>
                    )}
                    {data.status === 'restday' && (
                      <div className="pt-2 border-t">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3" />
                          <span className="text-xs">{data.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="hidden md:grid md:grid-cols-7 gap-3">
            {weekDays.map((day, idx) => {
              const date = weekDates[idx];
              const data = scheduleData[date];
              return (
                <div key={day} className="rounded-xl border overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-[#262626] px-3 py-2 text-center">
                    <div className="text-xs font-medium">{day}</div>
                    <div className="text-lg font-bold">{date}</div>
                  </div>
                  
                  {/* Day Content */}
                  <div className="p-3 space-y-3">
                    <div className={`p-2 rounded-lg border text-center ${getStatusColor(data.status)}`}>
                      <div className="text-xs font-medium">{getStatusText(data.status)}</div>
                    </div>
                    
                    {data.status !== 'restday' && data.status !== 'absent' && (
                      <>
                        <div className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="">In:</span>
                            <span className=" font-medium">{data.timeIn}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="">Out:</span>
                            <span className=" font-medium">{data.timeOut}</span>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t ">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 " />
                            <span className="text-xs ">{data.notes}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {data.status === 'absent' && (
                      <div className="pt-2 border-t ">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400">{data.notes}</span>
                        </div>
                      </div>
                    )}
                    
                    {data.status === 'restday' && (
                      <div className="pt-2 border-t ">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 " />
                          <span className="text-xs ">{data.notes}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 px-4 sm:px-6 py-4 border-t text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
            <span className="">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#facc15]/30 border /50" />
            <span className="">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
            <span className="">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500/30 border border-gray-500/50" />
            <span className="">Rest Day</span>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

// Type for audit record
interface AuditRecord {
  id: number;
  employeeId: number;
  name: string;
  code: string;
  profileImage: string | null;
  branch: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  status: string;
  rawStatus: string;
}

type ReportPreset = 'day' | 'week' | 'month';

interface ReportRow {
  date: string;
  employeeCode: string;
  employeeName: string;
  branch: string;
  checkIn: string;
  checkOut: string;
  hoursWorked: string;
  status: string;
  notes: string;
}

interface ScopedAuditStats {
  totalRecords: number;
  currentlyPresent: number;
  completedShifts: number;
  absent: number;
  present: number;
  late: number;
}

const formatIsoDate = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseIsoDate = (value: string): Date => {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const getHoursWorked = (checkIn: Date | string | null, checkOut: Date | string | null): string => {
  if (!checkIn || !checkOut) return '0.00';
  const inDate = new Date(checkIn);
  const outDate = new Date(checkOut);
  if (Number.isNaN(inDate.getTime()) || Number.isNaN(outDate.getTime())) return '0.00';
  const diffHours = (outDate.getTime() - inDate.getTime()) / (1000 * 60 * 60);
  return Math.max(diffHours, 0).toFixed(2);
};

const formatTimeValue = (value: Date | string | null): string => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

export default function AttendanceAuditPage() {
  const { classes } = useTheme();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(getPhilippinesDay());
  const [calendarMonth, setCalendarMonth] = useState(() => {
    const now = new Date();
    return now.getMonth(); // 0-11
  });
  const [calendarYear, setCalendarYear] = useState(() => {
    const now = new Date();
    return now.getFullYear();
  });
  const [selectedEmployee, setSelectedEmployee] = useState<AuditRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [scheduleEmployee, setScheduleEmployee] = useState<AuditRecord | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');
  const [isDayDetailsModalOpen, setIsDayDetailsModalOpen] = useState(false);
  const [isManualRefreshing, setIsManualRefreshing] = useState(false);
  const [previewImage, setPreviewImage] = useState<{ src: string; alt: string } | null>(null);
  const [reportPreset, setReportPreset] = useState<ReportPreset>('day');
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Format date for API (YYYY-MM-DD) using calendar month/year
  const formattedDate = useMemo(() => {
    const year = calendarYear;
    const month = String(calendarMonth + 1).padStart(2, '0');
    const day = String(selectedDate).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [selectedDate, calendarMonth, calendarYear]);

  // Format date for display (e.g., "April 22, 2026 (Wednesday)")
  const displayDate = useMemo(() => {
    const date = new Date(calendarYear, calendarMonth, selectedDate);
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return date.toLocaleDateString('en-US', options);
  }, [calendarYear, calendarMonth, selectedDate]);

  const openImagePreview = (profileImage: string | null, name: string) => {
    const src = constructImageUrl(profileImage);
    if (!src) return;
    setPreviewImage({ src, alt: `${name} profile image` });
  };

  // Fetch attendance audit data
  const {
    data: auditData,
    isLoading,
    isFetching: isAuditFetching,
    isError: isAuditError,
    refetch: refetchAudit,
    dataUpdatedAt: auditDataUpdatedAt
  } = useQuery({
    queryKey: ['attendance-audit', formattedDate, selectedBranchFilter, activeFilter],
    queryFn: async () => {
      const response = await attendanceApi.getAudit({
        date: formattedDate,
        branch_code: selectedBranchFilter === 'ALL' ? undefined : selectedBranchFilter,
        status: activeFilter === 'all' ? undefined : activeFilter
      });
      return response.data.data;
    },
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 15000,
    gcTime: 300000
  });

  const records = auditData?.records || [];

  // Calculate date range for monthly data
  const startDate = useMemo(() => {
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-01`;
  }, [calendarMonth, calendarYear]);

  const endDate = useMemo(() => {
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    return `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`;
  }, [calendarMonth, calendarYear]);

  // Fetch branches from database
  const { data: branchesData, isLoading: isLoadingBranches } = useQuery({
    queryKey: ['branches'],
    queryFn: async () => {
      const response = await branchApi.getAll();
      return response.data.data || [];
    },
    staleTime: 300000, // 5 minutes
    gcTime: 600000 // 10 minutes
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employees-for-attendance-audit-report'],
    queryFn: async () => {
      const response = await employeeApi.getAll({ limit: 2000 });
      return response.data.data || [];
    },
    staleTime: 300000,
    gcTime: 600000
  });

  // Transform branches data to include "All Branches" option
  const branches = useMemo(() => {
    const dbBranches = (branchesData || []) as Branch[];
    return [
      { code: 'ALL', name: 'All Branches' },
      ...dbBranches.map((branch) => ({
        code: branch.code,
        name: branch.shortName || branch.name // Use shortName (branch_name from database) as display name
      }))
    ];
  }, [branchesData]);

  const employeeMap = useMemo(() => {
    const employees = (employeesData || []) as Employee[];
    return new Map(
      employees.map((employee) => [
        employee.id,
        {
          code: employee.employeeCode || `EMP-${employee.id}`,
          name: [employee.firstName, employee.lastName].filter(Boolean).join(' ').trim() || `Employee ${employee.id}`,
          branchCode: employee.branchCode || employee.branchName || '',
          branchName: employee.branchName || employee.branchCode || ''
        }
      ])
    );
  }, [employeesData]);

  const branchNameMap = useMemo(() => {
    return new Map(
      branches
        .filter((branch) => branch.code !== 'ALL')
        .map((branch) => [branch.code, branch.name])
    );
  }, [branches]);

  // Fetch monthly attendance data for calendar counts
  const {
    data: monthlyAttendanceData,
    isFetching: isMonthlyFetching,
    isError: isMonthlyError,
    refetch: refetchMonthly,
    dataUpdatedAt: monthlyDataUpdatedAt
  } = useQuery({
    queryKey: ['attendance-monthly', startDate, endDate, selectedBranchFilter],
    queryFn: async () => {
      const response = await attendanceApi.getAll({
        startDate,
        endDate,
        limit: 1000,
        branch_code: selectedBranchFilter === 'ALL' ? undefined : selectedBranchFilter
      });
      return response.data.data || [];
    },
    enabled: !!startDate && !!endDate,
    refetchInterval: 30000,
    refetchIntervalInBackground: false,
    staleTime: 60000,
    gcTime: 600000
  });

  const isSyncing = isManualRefreshing || isAuditFetching || isMonthlyFetching;
  const hasSyncError = isAuditError || isMonthlyError;
  const lastSyncedAt = Math.max(auditDataUpdatedAt || 0, monthlyDataUpdatedAt || 0);
  const syncStateLabel = hasSyncError ? 'Sync failed' : isSyncing ? 'Syncing...' : 'Live';

  const handleManualRefresh = async () => {
    setIsManualRefreshing(true);
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['attendance-audit'] }),
        queryClient.invalidateQueries({ queryKey: ['attendance-monthly'] }),
        refetchAudit(),
        refetchMonthly()
      ]);
    } finally {
      setIsManualRefreshing(false);
    }
  };

  // Generate calendar days based on branch filter
  const calendarDays = generateCalendarDays(selectedBranchFilter, selectedDate, calendarMonth, calendarYear);

  // Aggregate daily record counts from monthly data
  const dailyRecordCounts = useMemo(() => {
    const counts: Record<number, number> = {};

    if (!monthlyAttendanceData || monthlyAttendanceData.length === 0) {
      return counts;
    }

    monthlyAttendanceData.forEach((record: Attendance) => {
      // Filter by branch if not "ALL"
      if (selectedBranchFilter !== 'ALL' && record.branch_code !== selectedBranchFilter) {
        return;
      }

      const recordDate = new Date(record.date);
      const day = recordDate.getDate();
      const month = recordDate.getMonth();
      const year = recordDate.getFullYear();

      // Only count records for the displayed month
      if (month === calendarMonth && year === calendarYear) {
        counts[day] = (counts[day] || 0) + 1;
      }
    });

    return counts;
  }, [monthlyAttendanceData, calendarMonth, calendarYear, selectedBranchFilter]);

  // Month names for display
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  // Month navigation handlers
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      if (calendarMonth === 0) {
        setCalendarMonth(11);
        setCalendarYear(y => y - 1);
      } else {
        setCalendarMonth(m => m - 1);
      }
    } else {
      if (calendarMonth === 11) {
        setCalendarMonth(0);
        setCalendarYear(y => y + 1);
      } else {
        setCalendarMonth(m => m + 1);
      }
    }
    // Reset selected date to 1st of month when navigating
    setSelectedDate(1);
  };

  const goToToday = () => {
    const now = new Date();
    setCalendarMonth(now.getMonth());
    setCalendarYear(now.getFullYear());
    setSelectedDate(now.getDate());
  };

  const reportRange = useMemo(() => {
    const selected = new Date(calendarYear, calendarMonth, selectedDate);

    if (reportPreset === 'week') {
      const start = new Date(selected);
      const day = start.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      start.setDate(start.getDate() + diffToMonday);

      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      return {
        label: 'This Week',
        startDate: formatIsoDate(start),
        endDate: formatIsoDate(end)
      };
    }

    if (reportPreset === 'month') {
      const start = new Date(calendarYear, calendarMonth, 1);
      const end = new Date(calendarYear, calendarMonth + 1, 0);
      return {
        label: 'This Month',
        startDate: formatIsoDate(start),
        endDate: formatIsoDate(end)
      };
    }

    return {
      label: 'Selected Day',
      startDate: formattedDate,
      endDate: formattedDate
    };
  }, [calendarMonth, calendarYear, formattedDate, reportPreset, selectedDate]);

  const highlightedCalendarDays = useMemo(() => {
    if (reportPreset === 'day') {
      return new Set<number>([selectedDate]);
    }

    const start = parseIsoDate(reportRange.startDate);
    const end = parseIsoDate(reportRange.endDate);
    const days = new Set<number>();

    const cursor = new Date(start);
    while (cursor <= end) {
      if (cursor.getMonth() === calendarMonth && cursor.getFullYear() === calendarYear) {
        days.add(cursor.getDate());
      }
      cursor.setDate(cursor.getDate() + 1);
    }

    return days;
  }, [calendarMonth, calendarYear, reportPreset, reportRange.endDate, reportRange.startDate, selectedDate]);

  const {
    data: scopedAttendanceData,
    isFetching: isScopedAttendanceFetching
  } = useQuery({
    queryKey: ['attendance-audit-scope', reportPreset, reportRange.startDate, reportRange.endDate, selectedBranchFilter],
    queryFn: async () => {
      if (reportPreset === 'day') {
        return null;
      }

      const response = await attendanceApi.getAll({
        startDate: reportRange.startDate,
        endDate: reportRange.endDate,
        limit: 5000,
        branch_code: selectedBranchFilter === 'ALL' ? undefined : selectedBranchFilter
      });

      return response.data.data || [];
    },
    enabled: reportPreset !== 'day',
    staleTime: 30000,
    gcTime: 300000
  });

  const displayedRecords = useMemo(() => {
    if (reportPreset === 'day') {
      return records;
    }

    const scopedRecords = (scopedAttendanceData || []) as Attendance[];
    return scopedRecords.map((record) => {
      const employee = employeeMap.get(record.employeeId);
      const branchCode = record.branch_code || employee?.branchCode || '';
      const branchName = branchCode
        ? `${branchCode}${branchNameMap.get(branchCode) ? ` - ${branchNameMap.get(branchCode)}` : ''}`
        : employee?.branchName || '-';

      let statusLabel = 'Present';
      if (record.status === 'late') statusLabel = 'Late';
      else if (record.status === 'absent' || !record.status) statusLabel = 'Absent';
      else if (record.status === 'voided') statusLabel = 'Voided';

      return {
        id: record.id,
        employeeId: record.employeeId,
        name: employee?.name || `Employee ${record.employeeId}`,
        code: employee?.code || `EMP-${record.employeeId}`,
        profileImage: null,
        branch: branchName,
        timeIn: formatTimeValue(record.check_in),
        timeOut: formatTimeValue(record.check_out),
        hours: getHoursWorked(record.check_in, record.check_out),
        status: statusLabel,
        rawStatus: record.status || 'absent'
      };
    });
  }, [branchNameMap, employeeMap, records, reportPreset, scopedAttendanceData]);

  const displayedStats = useMemo<ScopedAuditStats>(() => {
    if (reportPreset === 'day') {
      return auditData?.stats || { totalRecords: 0, currentlyPresent: 0, completedShifts: 0, absent: 0, present: 0, late: 0 };
    }

    return displayedRecords.reduce<ScopedAuditStats>((accumulator, record) => {
      accumulator.totalRecords += 1;

      if (record.rawStatus === 'present') {
        accumulator.present += 1;
      }

      if (record.rawStatus === 'late') {
        accumulator.late += 1;
      }

      if (record.rawStatus === 'absent' || !record.rawStatus) {
        accumulator.absent += 1;
      }

      if (record.timeOut !== '-') {
        accumulator.completedShifts += 1;
      } else if (record.rawStatus === 'present' || record.rawStatus === 'late') {
        accumulator.currentlyPresent += 1;
      }

      return accumulator;
    }, { totalRecords: 0, currentlyPresent: 0, completedShifts: 0, absent: 0, present: 0, late: 0 });
  }, [auditData?.stats, displayedRecords, reportPreset]);

  // Filter data based on search query and active filter (client-side)
  const filteredData = useMemo(() => {
    let data = displayedRecords;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.code.toLowerCase().includes(query) ||
        emp.branch.toLowerCase().includes(query)
      );
    }
    
    if (activeFilter !== 'all') {
      data = data.filter(emp => {
        if (activeFilter === 'present') return emp.rawStatus === 'present';
        if (activeFilter === 'late') return emp.rawStatus === 'late';
        if (activeFilter === 'absent') return emp.rawStatus === 'absent' || emp.rawStatus === null;
        if (activeFilter === 'completed') return emp.timeOut !== '-';
        if (activeFilter === 'voided') return emp.rawStatus === 'voided';
        return true;
      });
    }
    
    return data;
  }, [displayedRecords, searchQuery, activeFilter]);

  // Dynamic filter tabs with counts from stats
  const filterTabs = [
    { id: 'all', label: 'All', count: displayedStats.totalRecords },
    { id: 'present', label: 'Present', count: displayedStats.present },
    { id: 'late', label: 'Late', count: displayedStats.late },
    { id: 'completed', label: 'Completed', count: displayedStats.completedShifts },
    { id: 'absent', label: 'Absent', count: displayedStats.absent },
    { id: 'voided', label: 'Voided', count: 0 },
  ];

  const fetchReportRows = async (): Promise<ReportRow[]> => {
    const response = await attendanceApi.getAll({
      startDate: reportRange.startDate,
      endDate: reportRange.endDate,
      limit: 5000,
      branch_code: selectedBranchFilter === 'ALL' ? undefined : selectedBranchFilter
    });

    const sourceRows = response.data.data || [];

    return sourceRows
      .map((record) => {
        const employee = employeeMap.get(record.employeeId);
        const employeeName = employee?.name || `Employee ${record.employeeId}`;
        const employeeCode = employee?.code || `EMP-${record.employeeId}`;
        const branchCode = record.branch_code || employee?.branchCode || '';
        const branchLabel = branchCode
          ? `${branchCode}${branchNameMap.get(branchCode) ? ` - ${branchNameMap.get(branchCode)}` : ''}`
          : employee?.branchName || '-';

        return {
          date: formatIsoDate(new Date(record.date)),
          employeeCode,
          employeeName,
          branch: branchLabel,
          checkIn: formatTimeValue(record.check_in),
          checkOut: formatTimeValue(record.check_out),
          hoursWorked: getHoursWorked(record.check_in, record.check_out),
          status: record.status || 'no_record',
          notes: record.notes || ''
        };
      })
      .filter((row) => {
        if (searchQuery) {
          const query = searchQuery.toLowerCase();
          const searchable = `${row.employeeName} ${row.employeeCode} ${row.branch}`.toLowerCase();
          if (!searchable.includes(query)) {
            return false;
          }
        }

        if (activeFilter !== 'all') {
          if (activeFilter === 'completed') {
            return row.checkOut !== '-';
          }

          if (activeFilter === 'absent') {
            return row.status === 'absent' || row.status === 'no_record';
          }

          if (activeFilter === 'voided') {
            return row.status === 'voided';
          }

          return row.status === activeFilter;
        }

        return true;
      })
      .sort((left, right) => {
        const dateDiff = right.date.localeCompare(left.date);
        if (dateDiff !== 0) return dateDiff;
        return left.employeeName.localeCompare(right.employeeName);
      });
  };

  const handleGenerateReport = async () => {
    setIsGeneratingReport(true);
    setActionMessage(null);

    const reportWindow = window.open('', '_blank', 'width=1200,height=800');
    if (!reportWindow) {
      setIsGeneratingReport(false);
      setActionMessage('Popup blocked. Please allow popups to generate the report.');
      return;
    }

    reportWindow.document.write(`
      <html>
        <head>
          <title>Attendance Audit Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
            .loading { display: flex; align-items: center; justify-content: center; min-height: 60vh; font-size: 18px; }
          </style>
        </head>
        <body>
          <div class="loading">Generating attendance report...</div>
        </body>
      </html>
    `);
    reportWindow.document.close();

    try {
      const rows = await fetchReportRows();
      if (!rows.length) {
        reportWindow.document.open();
        reportWindow.document.write(`
          <html>
            <head>
              <title>Attendance Audit Report</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
              </style>
            </head>
            <body>
              <h1>Attendance Audit Report</h1>
              <p>No attendance records found for ${escapeHtml(reportRange.label.toLowerCase())}.</p>
            </body>
          </html>
        `);
        reportWindow.document.close();
        setActionMessage(`No attendance records found for ${reportRange.label.toLowerCase()}.`);
        return;
      }

      const totals = rows.reduce(
        (accumulator, row) => {
          accumulator.total += 1;
          accumulator.hours += Number(row.hoursWorked);
          if (row.status === 'present') accumulator.present += 1;
          if (row.status === 'late') accumulator.late += 1;
          if (row.status === 'absent' || row.status === 'no_record') accumulator.absent += 1;
          return accumulator;
        },
        { total: 0, present: 0, late: 0, absent: 0, hours: 0 }
      );

      const uniqueEmployees = new Set(rows.map((row) => row.employeeCode)).size;
      const onTimeCount = Math.max(totals.present - totals.late, 0);
      const attendanceRate = totals.total > 0
        ? (((totals.present + totals.late) / totals.total) * 100).toFixed(1)
        : '0.0';
      const averageHoursPerRecord = totals.total > 0
        ? (totals.hours / totals.total).toFixed(2)
        : '0.00';

      const branchBreakdown = Array.from(
        rows.reduce((map, row) => {
          const current = map.get(row.branch) || { total: 0, present: 0, late: 0, absent: 0, hours: 0 };
          current.total += 1;
          current.hours += Number(row.hoursWorked);
          if (row.status === 'present') current.present += 1;
          if (row.status === 'late') current.late += 1;
          if (row.status === 'absent' || row.status === 'no_record') current.absent += 1;
          map.set(row.branch, current);
          return map;
        }, new Map<string, { total: number; present: number; late: number; absent: number; hours: number }>())
      )
        .sort((left, right) => right[1].total - left[1].total)
        .map(([branch, values]) => `
          <tr>
            <td>${escapeHtml(branch)}</td>
            <td>${values.total}</td>
            <td>${values.present}</td>
            <td>${values.late}</td>
            <td>${values.absent}</td>
            <td>${values.hours.toFixed(2)}</td>
          </tr>
        `)
        .join('');

      const topEmployees = Array.from(
        rows.reduce((map, row) => {
          const key = `${row.employeeCode}__${row.employeeName}`;
          const current = map.get(key) || {
            employeeCode: row.employeeCode,
            employeeName: row.employeeName,
            branch: row.branch,
            total: 0,
            late: 0,
            hours: 0
          };
          current.total += 1;
          current.hours += Number(row.hoursWorked);
          if (row.status === 'late') current.late += 1;
          map.set(key, current);
          return map;
        }, new Map<string, { employeeCode: string; employeeName: string; branch: string; total: number; late: number; hours: number }>())
      )
        .map(([, value]) => value)
        .sort((left, right) => right.hours - left.hours)
        .slice(0, 5)
        .map((employee) => `
          <tr>
            <td>${escapeHtml(employee.employeeCode)}</td>
            <td>${escapeHtml(employee.employeeName)}</td>
            <td>${escapeHtml(employee.branch)}</td>
            <td>${employee.total}</td>
            <td>${employee.late}</td>
            <td>${employee.hours.toFixed(2)}</td>
          </tr>
        `)
        .join('');

      const rowsHtml = rows.map((row) => `
        <tr>
          <td>${escapeHtml(row.date)}</td>
          <td>${escapeHtml(row.employeeCode)}</td>
          <td>${escapeHtml(row.employeeName)}</td>
          <td>${escapeHtml(row.branch)}</td>
          <td>${escapeHtml(row.checkIn)}</td>
          <td>${escapeHtml(row.checkOut)}</td>
          <td>${escapeHtml(row.hoursWorked)}</td>
          <td>${escapeHtml(row.status)}</td>
          <td>${escapeHtml(row.notes || '-')}</td>
        </tr>
      `).join('');

      reportWindow.document.open();
      reportWindow.document.write(`
        <html>
          <head>
            <title>Attendance Audit Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
              h1 { margin: 0 0 8px; font-size: 28px; }
              h2 { margin: 28px 0 12px; font-size: 18px; }
              p { margin: 4px 0; }
              .meta { margin-bottom: 20px; }
              .stats { display: flex; gap: 12px; flex-wrap: wrap; margin: 20px 0; }
              .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 16px; min-width: 140px; }
              .analytics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; margin: 20px 0; }
              .analytics-card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px 16px; background: #fafafa; }
              .analytics-label { font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; }
              .analytics-value { margin-top: 8px; font-size: 24px; font-weight: 700; }
              .section-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin: 18px 0 8px; }
              table { width: 100%; border-collapse: collapse; margin-top: 12px; }
              th, td { border: 1px solid #d1d5db; padding: 8px; font-size: 12px; text-align: left; vertical-align: top; }
              th { background: #f3f4f6; }
              .section-table { margin-top: 0; }
            </style>
          </head>
          <body>
            <h1>Attendance Audit Report</h1>
            <div class="meta">
              <p><strong>Range:</strong> ${escapeHtml(reportRange.startDate)} to ${escapeHtml(reportRange.endDate)}</p>
              <p><strong>Scope:</strong> ${escapeHtml(reportRange.label)}</p>
              <p><strong>Branch:</strong> ${escapeHtml(selectedBranchFilter === 'ALL' ? 'All Branches' : selectedBranchFilter)}</p>
              <p><strong>Status Filter:</strong> ${escapeHtml(activeFilter)}</p>
              <p><strong>Generated:</strong> ${escapeHtml(new Date().toLocaleString('en-US', { timeZone: 'Asia/Manila' }))}</p>
            </div>
            <div class="stats">
              <div class="card"><strong>Total Records</strong><br />${totals.total}</div>
              <div class="card"><strong>Present</strong><br />${totals.present}</div>
              <div class="card"><strong>Late</strong><br />${totals.late}</div>
              <div class="card"><strong>Absent</strong><br />${totals.absent}</div>
              <div class="card"><strong>Total Hours</strong><br />${totals.hours.toFixed(2)}</div>
            </div>
            <h2>Analytics</h2>
            <div class="analytics">
              <div class="analytics-card">
                <div class="analytics-label">Unique Employees</div>
                <div class="analytics-value">${uniqueEmployees}</div>
              </div>
              <div class="analytics-card">
                <div class="analytics-label">Attendance Rate</div>
                <div class="analytics-value">${attendanceRate}%</div>
              </div>
              <div class="analytics-card">
                <div class="analytics-label">On-Time Records</div>
                <div class="analytics-value">${onTimeCount}</div>
              </div>
              <div class="analytics-card">
                <div class="analytics-label">Avg Hours / Record</div>
                <div class="analytics-value">${averageHoursPerRecord}</div>
              </div>
            </div>
            <div class="section-grid">
              <div>
                <h2>Branch Breakdown</h2>
                <table class="section-table">
                  <thead>
                    <tr>
                      <th>Branch</th>
                      <th>Records</th>
                      <th>Present</th>
                      <th>Late</th>
                      <th>Absent</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>${branchBreakdown || '<tr><td colspan="6">No branch data</td></tr>'}</tbody>
                </table>
              </div>
              <div>
                <h2>Top Employees By Hours</h2>
                <table class="section-table">
                  <thead>
                    <tr>
                      <th>Code</th>
                      <th>Name</th>
                      <th>Branch</th>
                      <th>Records</th>
                      <th>Late</th>
                      <th>Hours</th>
                    </tr>
                  </thead>
                  <tbody>${topEmployees || '<tr><td colspan="6">No employee data</td></tr>'}</tbody>
                </table>
              </div>
            </div>
            <h2>Detailed Records</h2>
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Code</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Time In</th>
                  <th>Time Out</th>
                  <th>Hours</th>
                  <th>Status</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>${rowsHtml}</tbody>
            </table>
          </body>
        </html>
      `);
      reportWindow.document.close();
      setActionMessage(`Report generated for ${reportRange.startDate} to ${reportRange.endDate}.`);
    } catch (error) {
      console.error('Failed to generate attendance audit report', error);
      reportWindow.document.open();
      reportWindow.document.write(`
        <html>
          <head>
            <title>Attendance Audit Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 24px; color: #111827; }
              .error { color: #b91c1c; }
            </style>
          </head>
          <body>
            <h1>Attendance Audit Report</h1>
            <p class="error">Failed to generate the report. Please try again.</p>
          </body>
        </html>
      `);
      reportWindow.document.close();
      setActionMessage('Failed to generate report. Please try again.');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const handleExportExcel = async () => {
    setIsExportingExcel(true);
    setActionMessage(null);

    try {
      const rows = await fetchReportRows();
      if (!rows.length) {
        setActionMessage(`No attendance records found for ${reportRange.label.toLowerCase()}.`);
        return;
      }

      const headers = ['Date', 'Employee Code', 'Employee Name', 'Branch', 'Check In', 'Check Out', 'Hours Worked', 'Status', 'Notes'];
      const csvContent = [
        headers.join(','),
        ...rows.map((row) =>
          [
            row.date,
            row.employeeCode,
            row.employeeName,
            row.branch,
            row.checkIn,
            row.checkOut,
            row.hoursWorked,
            row.status,
            row.notes
          ].map((value) => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')
        )
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `attendance-audit-${reportRange.startDate}-to-${reportRange.endDate}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      setActionMessage(`Excel export downloaded for ${reportRange.startDate} to ${reportRange.endDate}.`);
    } catch (error) {
      console.error('Failed to export attendance audit data', error);
      setActionMessage('Failed to export Excel file. Please try again.');
    } finally {
      setIsExportingExcel(false);
    }
  };

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${classes.text}`}>
            Attendance <span className={classes.textAccent}>Audit</span>
          </h1>
          <p className={`${classes.textMuted} mt-1`}>Review daily attendance records by selecting a date</p>
          <div className="flex items-center gap-3 mt-2 text-xs">
            <span className={`px-2 py-1 rounded-full border ${
              hasSyncError
                ? 'text-red-600 border-red-300 bg-red-50'
                : isSyncing
                ? `${classes.textAccent} ${classes.borderAccent} ${classes.bgCardHover}`
                : 'text-green-600 border-green-300 bg-green-50'
            }`}>
              {syncStateLabel}
            </span>
            <span className={classes.textMuted}>Last synced: {formatSyncTime(lastSyncedAt)}</span>
            {reportPreset !== 'day' && isScopedAttendanceFetching && (
              <span className={classes.textMuted}>Loading scoped records...</span>
            )}
          </div>
        </div>
      </div>

      {hasSyncError && (
        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-red-600 text-sm">Unable to sync attendance data. Please retry.</p>
          <button
            onClick={handleManualRefresh}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-md text-sm transition-colors disabled:opacity-60"
          >
            <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
            Retry sync
          </button>
        </div>
      )}

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${classes.textMuted}`} />
          <input
            type="text"
            placeholder="Search employees, codes, or branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2.5 border ${classes.border} rounded-lg ${classes.bg} ${classes.text} placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-yellow-500/50`}
          />
        </div>
        
        {/* Branch Filter Dropdown */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Building2 className={`w-4 h-4 ${classes.textMuted}`} />
          <select 
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className={`w-full sm:w-auto px-4 py-2.5 border ${classes.border} rounded-lg ${classes.bg} ${classes.text} focus:outline-none focus:ring-2 focus:ring-yellow-500/50 min-w-0 sm:min-w-[180px]`}
          >
            {branches.map((branch) => (
              <option key={branch.code} value={branch.code}>
                {branch.code === 'ALL' ? branch.name : `${branch.code} - ${branch.name}`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 w-full lg:w-auto">
          <div className={`flex items-center gap-2 ${classes.text} text-sm`}>
            <span>Search By</span>
          </div>
          <select className={`w-full sm:w-auto px-4 py-2.5 border ${classes.border} rounded-lg ${classes.bg} ${classes.text} focus:outline-none focus:ring-2 focus:ring-yellow-500/50`}>
            <option>All Fields</option>
            <option>Employee Name</option>
            <option>Code</option>
            <option>Branch</option>
          </select>
          <button className="flex items-center justify-center gap-2 px-4 py-2.5 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors w-full sm:w-auto">
            <Search className="w-4 h-4" />
            Search
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={handleManualRefresh}
          disabled={isSyncing}
          className={`flex items-center justify-center gap-2 px-4 py-2 border ${classes.border} ${classes.text} rounded-lg ${classes.hover} transition-colors disabled:opacity-60 w-full sm:w-auto`}
        >
          <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
        <button
          onClick={() => {
            const now = new Date();
            const day = now.getDay();
            const diffToMonday = day === 0 ? -6 : 1 - day;
            const monday = new Date(now);
            monday.setDate(now.getDate() + diffToMonday);
            setCalendarMonth(monday.getMonth());
            setCalendarYear(monday.getFullYear());
            setSelectedDate(monday.getDate());
            setReportPreset('week');
            setActionMessage(`Report scope set to this week: ${formatIsoDate(monday)}.`);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors w-full sm:w-auto ${
            reportPreset === 'week'
              ? 'border-yellow-400 bg-yellow-100 text-yellow-900'
              : `${classes.border} ${classes.text} ${classes.hover}`
          }`}
        >
          <Calendar className="w-4 h-4" />
          This Week
        </button>
        <button
          onClick={() => {
            const now = new Date();
            setCalendarMonth(now.getMonth());
            setCalendarYear(now.getFullYear());
            setSelectedDate(1);
            setReportPreset('month');
            setActionMessage(`Report scope set to this month: ${formatIsoDate(new Date(now.getFullYear(), now.getMonth(), 1))}.`);
          }}
          className={`flex items-center justify-center gap-2 px-4 py-2 border rounded-lg transition-colors w-full sm:w-auto ${
            reportPreset === 'month'
              ? 'border-yellow-400 bg-yellow-100 text-yellow-900'
              : `${classes.border} ${classes.text} ${classes.hover}`
          }`}
        >
          <Calendar className="w-4 h-4" />
          This Month
        </button>
        <button
          onClick={() => {
            goToToday();
            setReportPreset('day');
            setActionMessage(`Report scope set to selected day: ${getPhilippinesDateString()}.`);
          }}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors w-full sm:w-auto"
        >
          <Calendar className="w-4 h-4" />
          Today
        </button>
        <button
          onClick={handleGenerateReport}
          disabled={isGeneratingReport}
          className={`flex items-center justify-center gap-2 px-4 py-2 border ${classes.border} ${classes.text} rounded-lg ${classes.hover} transition-colors w-full sm:w-auto disabled:opacity-60`}
        >
          {isGeneratingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
          Generate Report
        </button>
        <button
          onClick={handleExportExcel}
          disabled={isExportingExcel}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors w-full sm:w-auto disabled:opacity-60"
        >
          {isExportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export Excel
        </button>
        <button className={`flex items-center justify-center gap-2 px-4 py-2 border ${classes.border} ${classes.text} rounded-lg ${classes.hover} transition-colors w-full sm:w-auto`}>
          <FileText className="w-4 h-4" />
          Individual Report
        </button>
      </div>

      <div className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm ${classes.textMuted}`}>
        <span>
          Active report scope: <span className={classes.text}>{reportRange.label}</span> from <span className={classes.text}>{reportRange.startDate}</span> to <span className={classes.text}>{reportRange.endDate}</span>
        </span>
        {actionMessage && <span className={classes.text}>{actionMessage}</span>}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className={`xl:col-span-1 ${classes.bgCard} rounded-xl border ${classes.border} p-4 sm:p-6`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <h2 className={`text-lg font-semibold ${classes.text}`}>{monthNames[calendarMonth]} {calendarYear}</h2>
            <div className="flex items-center gap-2">
              <button onClick={() => navigateMonth('prev')} className={`p-1 ${classes.hover} rounded transition-colors`}>
                <ChevronLeft className={`w-5 h-5 ${classes.text}`} />
              </button>
              <button onClick={goToToday} className="px-3 py-1 bg-[#facc15] text-black text-sm font-medium rounded">
                Today
              </button>
              <button onClick={() => navigateMonth('next')} className={`p-1 ${classes.hover} rounded transition-colors`}>
                <ChevronRight className={`w-5 h-5 ${classes.text}`} />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className={`text-center text-[10px] sm:text-xs ${classes.textMuted} py-2 font-medium`}>
                {day}
              </div>
            ))}
            {calendarDays.map((item, index) => (
              <button
                key={index}
                onClick={() => {
                  if (item.prevMonth || item.nextMonth) return;
                  setSelectedDate(item.day);
                  setReportPreset('day');
                }}
                className={`aspect-square p-1 sm:p-2 rounded-lg text-xs sm:text-sm transition-all ${
                  item.prevMonth || item.nextMonth
                    ? 'text-gray-400'
                    : highlightedCalendarDays.has(item.day)
                    ? reportPreset === 'day'
                      ? 'bg-[#facc15] text-black font-semibold'
                      : 'bg-yellow-100 border border-yellow-300 text-yellow-900 font-semibold'
                    : item.today
                    ? 'bg-yellow-100 border border-yellow-300 text-yellow-800'
                    : `${classes.text} ${classes.hover}`
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{item.day}</span>
                  {dailyRecordCounts[item.day] > 0 && !item.prevMonth && !item.nextMonth && (
                    <span className={`text-[10px] mt-0.5 ${
                      highlightedCalendarDays.has(item.day)
                        ? reportPreset === 'day'
                          ? 'text-black/70'
                          : 'text-yellow-800'
                        : classes.textMuted
                    }`}>
                      {dailyRecordCounts[item.day]} rec
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* View Details Button */}
          {dailyRecordCounts[selectedDate] > 0 && (
            <button
              onClick={() => setIsDayDetailsModalOpen(true)}
              className={`w-full mt-4 flex items-center justify-center gap-2 px-4 py-2 border ${classes.border} ${classes.text} rounded-lg ${classes.hover} transition-colors`}
            >
              <FileText className="w-4 h-4" />
              View Details for {displayDate.split(',')[0]}
            </button>
          )}

          {/* Legend */}
          <div className={`flex flex-wrap items-center gap-3 mt-4 pt-4 border-t ${classes.border} text-xs`}>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${reportPreset === 'day' ? 'bg-[#facc15]' : 'bg-yellow-100 border border-yellow-300'}`} />
              <span className={classes.textMuted}>{reportPreset === 'day' ? 'Selected' : 'Filtered Range'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-yellow-300 bg-yellow-100" />
              <span className={classes.textMuted}>Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-3 h-3 rounded ${classes.bg}`} />
              <span className={classes.textMuted}>Has Records</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Stats and Table */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`${classes.bgCard} rounded-xl border ${classes.border} p-4`}>
              <p className={`${classes.textMuted} text-xs uppercase tracking-wider`}>Total Records</p>
              <p className={`text-2xl font-bold ${classes.text} mt-1`}>{displayedStats.totalRecords}</p>
            </div>
            <div className={`${classes.bgCard} rounded-xl border ${classes.border} p-4`}>
              <p className={`${classes.textMuted} text-xs uppercase tracking-wider`}>Currently Present</p>
              <p className="text-2xl font-bold text-green-500 mt-1">{displayedStats.currentlyPresent}</p>
            </div>
            <div className={`${classes.bgCard} rounded-xl border ${classes.border} p-4`}>
              <p className={`${classes.textMuted} text-xs uppercase tracking-wider`}>Completed Shifts</p>
              <p className={`text-2xl font-bold ${classes.text} mt-1`}>{displayedStats.completedShifts}</p>
            </div>
            <div className={`${classes.bgCard} rounded-xl border ${classes.border} p-4`}>
              <p className={`${classes.textMuted} text-xs uppercase tracking-wider`}>Absent</p>
              <p className="text-2xl font-bold text-red-500 mt-1">{displayedStats.absent}</p>
            </div>
          </div>

          {/* Selected Date Info */}
          <div className={`border ${classes.border} rounded-xl p-4 ${classes.bgCard}`}>
            <div className="flex items-center gap-2 mb-2">
              <Calendar className={`w-5 h-5 ${classes.textAccent}`} />
              <h3 className={`${classes.text} font-semibold`}>
                {reportPreset === 'day' ? displayDate : `${reportRange.label}: ${reportRange.startDate} to ${reportRange.endDate}`}
              </h3>
            </div>
            <div className={`flex items-center gap-2 text-sm ${classes.textMuted}`}>
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Auto-absent mode active. Employees without time-in records are shown as <span className="text-red-500">Absent (Auto)</span></span>
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex flex-wrap gap-2">
            {filterTabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  activeFilter === tab.id
                    ? 'bg-[#facc15] text-black'
                    : `${classes.border} border ${classes.hover} ${classes.text}`
                }`}
              >
                {tab.id === 'all' && <CheckCircle className="w-4 h-4" />}
                {tab.id === 'present' && <CheckCircle className="w-4 h-4" />}
                {tab.id === 'late' && <Clock className="w-4 h-4" />}
                {tab.id === 'completed' && <CheckCircle className="w-4 h-4" />}
                {tab.id === 'absent' && <XCircle className="w-4 h-4" />}
                {tab.id === 'voided' && <Ban className="w-4 h-4" />}
                {tab.label}
                {tab.count !== null && (
                  <span className={`px-1.5 py-0.5 rounded text-xs ${activeFilter === tab.id ? 'bg-black/20' : classes.bg}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Employee Table */}
          <div className={`${classes.bgCard} rounded-xl border ${classes.border} overflow-hidden`}>
            {/* Mobile cards */}
            <div className="sm:hidden">
              {filteredData.length === 0 ? (
                <div className={`px-4 py-8 text-center ${classes.textMuted}`}>No records found</div>
              ) : (
                filteredData.map((employee) => (
                  <div key={employee.id} className={`p-4 border-b ${classes.border} last:border-0`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <button
                          type="button"
                          onClick={() => openImagePreview(employee.profileImage, employee.name)}
                          className="rounded-full transition-opacity hover:opacity-90"
                          disabled={!employee.profileImage}
                          aria-label={employee.profileImage ? `View ${employee.name} profile image` : `${employee.name} has no profile image`}
                        >
                          <ProfileImage
                            src={constructImageUrl(employee.profileImage)}
                            name={employee.name}
                            alt={employee.name}
                            size="sm"
                            className="shrink-0"
                          />
                        </button>
                        <div className="min-w-0">
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsModalOpen(true);
                            }}
                            className={`${classes.text} font-medium text-sm hover:text-yellow-600 transition-colors text-left truncate w-full`}
                          >
                            {employee.name}
                          </button>
                          <p className={`${classes.textMuted} text-xs`}>{employee.code} • {employee.branch}</p>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0 ${
                        employee.status === 'Present'
                          ? 'bg-green-100 text-green-700'
                          : employee.status === 'Absent'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                      }`}>
                        {employee.status === 'Present' && <CheckCircle className="w-3 h-3" />}
                        {employee.status === 'Absent' && <XCircle className="w-3 h-3" />}
                        {employee.status}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                      <div>
                        <p className={classes.textMuted}>Time In</p>
                        <p className={classes.text}>{employee.timeIn}</p>
                      </div>
                      <div>
                        <p className={classes.textMuted}>Time Out</p>
                        <p className={classes.text}>{employee.timeOut}</p>
                      </div>
                      <div>
                        <p className={classes.textMuted}>Hours</p>
                        <p className={classes.text}>{employee.hours}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <button
                        onClick={() => {
                          setSelectedBranch(employee.branch);
                          setIsBranchModalOpen(true);
                        }}
                        className={`${classes.textMuted} text-sm hover:text-yellow-600 transition-colors text-left`}
                      >
                        Branch: {employee.branch}
                      </button>
                      <button
                        onClick={() => {
                          setScheduleEmployee(employee);
                          setIsScheduleModalOpen(true);
                        }}
                        className={`${classes.textAccent} hover:underline text-sm font-medium`}
                      >
                        View
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop/tablet table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full min-w-[900px]">
                <thead>
                  <tr className={`border-b ${classes.border} ${classes.bg}`}>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Employee</th>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider hidden md:table-cell`}>Code</th>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider hidden lg:table-cell`}>Branch</th>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Time In</th>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Time Out</th>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Hours</th>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Status</th>
                    <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className={`px-4 py-8 text-center ${classes.textMuted}`}>
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((employee) => (
                      <tr key={employee.id} className={`border-b ${classes.border} last:border-0 ${classes.hover} transition-colors`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => openImagePreview(employee.profileImage, employee.name)}
                              className="rounded-full transition-opacity hover:opacity-90"
                              disabled={!employee.profileImage}
                              aria-label={employee.profileImage ? `View ${employee.name} profile image` : `${employee.name} has no profile image`}
                            >
                              <ProfileImage
                                src={constructImageUrl(employee.profileImage)}
                                name={employee.name}
                                alt={employee.name}
                                size="sm"
                              />
                            </button>
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setIsModalOpen(true);
                                }}
                                className={`${classes.text} font-medium text-sm hover:text-yellow-600 transition-colors text-left`}
                              >
                                {employee.name}
                              </button>
                              <p className={`${classes.textMuted} text-xs`}>Worker</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 ${classes.textMuted} font-mono text-sm hidden md:table-cell`}>{employee.code}</td>
                        <td className="px-4 py-4 hidden lg:table-cell">
                          <button
                            onClick={() => {
                              setSelectedBranch(employee.branch);
                              setIsBranchModalOpen(true);
                            }}
                            className={`${classes.textMuted} text-sm hover:text-yellow-600 transition-colors text-left`}
                          >
                            {employee.branch}
                          </button>
                        </td>
                        <td className={`px-4 py-4 ${classes.textMuted} text-sm`}>{employee.timeIn}</td>
                        <td className={`px-4 py-4 ${classes.textMuted} text-sm`}>{employee.timeOut}</td>
                        <td className={`px-4 py-4 ${classes.textMuted} text-sm`}>{employee.hours}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            employee.status === 'Present'
                              ? 'bg-green-100 text-green-700'
                              : employee.status === 'Absent'
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                            {employee.status === 'Present' && <CheckCircle className="w-3 h-3" />}
                            {employee.status === 'Absent' && <XCircle className="w-3 h-3" />}
                            {employee.status}
                          </span>
                        </td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setScheduleEmployee(employee);
                              setIsScheduleModalOpen(true);
                            }}
                            className={`${classes.textAccent} hover:underline text-sm font-medium`}
                          >
                            View
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      
      {/* Employee Attendance Modal */}
      <EmployeeAttendanceModal
        employee={selectedEmployee}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEmployee(null);
        }}
        initialMonth={calendarMonth}
        initialYear={calendarYear}
      />
      
      {/* Branch Attendance Modal */}
      <BranchAttendanceModal
        branch={selectedBranch}
        isOpen={isBranchModalOpen}
        onClose={() => {
          setIsBranchModalOpen(false);
          setSelectedBranch(null);
        }}
        records={filteredData}
        initialMonth={calendarMonth}
        initialYear={calendarYear}
      />
      
      {/* Schedule Modal */}
      <ScheduleModal
        employee={scheduleEmployee}
        isOpen={isScheduleModalOpen}
        onClose={() => {
          setIsScheduleModalOpen(false);
          setScheduleEmployee(null);
        }}
      />

      {/* Day Details Modal */}
      <DayDetailsModal
        isOpen={isDayDetailsModalOpen}
        onClose={() => setIsDayDetailsModalOpen(false)}
        selectedDate={selectedDate}
        calendarMonth={calendarMonth}
        calendarYear={calendarYear}
        monthlyAttendanceData={monthlyAttendanceData || []}
        selectedBranchFilter={selectedBranchFilter}
      />

      <ImagePreview
        src={previewImage?.src || ''}
        alt={previewImage?.alt || 'Profile image'}
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        showRotate={false}
      />
    </div>
  );
}
