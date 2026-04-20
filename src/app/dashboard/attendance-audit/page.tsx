'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceApi, branchApi } from '@/lib/api';
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
  Loader2
} from 'lucide-react';

// Generate calendar data based on branch filter
const generateCalendarDays = (branchFilter: string) => {
  // Base record counts per day (for "ALL" branches)
  const baseRecords: Record<number, number> = {
    1: 67, 2: 2, 3: 2, 4: 2, 5: 2, 6: 4, 7: 2, 8: 2, 9: 2, 10: 2, 11: 2,
    12: 2, 13: 2, 14: 2, 15: 2, 16: 2, 17: 2, 18: 2, 19: 2, 20: 53, 21: 2, 
    22: 2, 23: 2, 24: 2, 25: 2, 26: 2, 27: 2, 28: 2, 29: 2, 30: 2,
  };
  
  // Filtered counts based on branch
  const getRecordCount = (day: number) => {
    if (branchFilter === 'ALL') return baseRecords[day] || 0;
    
    // Simulate branch-specific data - each branch has roughly 10-30% of total
    const branchFactors: Record<string, number> = {
      'A': 0.15, // Sto. Rosario
      'B': 0.25, // BCDA
      'C': 0.12, // Sundara
      'D': 0.10, // Panicsican
      'E': 0.20, // Main Office
      'F': 0.08, // Capitol
      'H': 0.10, // Testing Branch
    };
    
    const factor = branchFactors[branchFilter] || 0.2;
    return Math.floor((baseRecords[day] || 0) * factor);
  };
  
  return [
    { day: 30, prevMonth: true }, { day: 31, prevMonth: true },
    { day: 1, records: getRecordCount(1) }, { day: 2, records: getRecordCount(2), selected: true }, 
    { day: 3, records: getRecordCount(3) }, { day: 4, records: getRecordCount(4) },
    { day: 5, records: getRecordCount(5) }, { day: 6, records: getRecordCount(6) }, 
    { day: 7, records: getRecordCount(7) }, { day: 8, records: getRecordCount(8) }, 
    { day: 9, records: getRecordCount(9) }, { day: 10, records: getRecordCount(10) }, 
    { day: 11, records: getRecordCount(11) },
    { day: 12, records: getRecordCount(12) }, { day: 13, records: getRecordCount(13) }, 
    { day: 14, records: getRecordCount(14) }, { day: 15, records: getRecordCount(15) }, 
    { day: 16, records: getRecordCount(16) }, { day: 17, records: getRecordCount(17) }, 
    { day: 18, records: getRecordCount(18) },
    { day: 19, records: getRecordCount(19) }, { day: 20, records: getRecordCount(20), today: true }, 
    { day: 21, records: getRecordCount(21) }, { day: 22, records: getRecordCount(22) }, 
    { day: 23, records: getRecordCount(23) }, { day: 24, records: getRecordCount(24) }, 
    { day: 25, records: getRecordCount(25) },
    { day: 26, records: getRecordCount(26) }, { day: 27, records: getRecordCount(27) }, 
    { day: 28, records: getRecordCount(28) }, { day: 29, records: getRecordCount(29) }, 
    { day: 30, records: getRecordCount(30) },
    { day: 1, nextMonth: true }, { day: 2, nextMonth: true },
  ];
};

const filterTabs = [
  { id: 'all', label: 'All', count: null },
  { id: 'present', label: 'Present', count: 53 },
  { id: 'late', label: 'Late', count: null },
  { id: 'completed', label: 'Completed', count: 0 },
  { id: 'absent', label: 'Absent', count: 24 },
  { id: 'voided', label: 'Voided', count: null },
];

// Branch data based on database schema (branches table: branch_code, branch_name)
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

// Generate mock employee attendance history for modal calendar (will be replaced with real data later)
const generateEmployeeAttendanceHistory = (employeeCode: string) => {
  const history: Record<number, { status: 'present' | 'late' | 'absent' | null; timeIn?: string; timeOut?: string; location?: string }> = {};
  
  for (let day = 1; day <= 30; day++) {
    // Generate deterministic random-ish data based on employee code and day
    const seed = employeeCode.charCodeAt(1) + day;
    const rand = (seed * 9301 + 49297) % 233280 / 233280;
    
    if (rand > 0.85) {
      history[day] = { status: null };
    } else if (rand > 0.7) {
      history[day] = { 
        status: 'absent', 
        timeIn: '-', 
        timeOut: '-', 
        location: 'BCDA - Admin' 
      };
    } else if (rand > 0.55) {
      history[day] = { 
        status: 'late', 
        timeIn: `0${Math.floor(rand * 2) + 8}:${Math.floor(rand * 50 + 10).toString().padStart(2, '0')} AM`, 
        timeOut: `0${Math.floor(rand * 2) + 5}:${Math.floor(rand * 50 + 10).toString().padStart(2, '0')} PM`, 
        location: 'BCDA - Admin' 
      };
    } else {
      history[day] = { 
        status: 'present', 
        timeIn: `0${Math.floor(rand * 1) + 6}:${Math.floor(rand * 50 + 30).toString().padStart(2, '0')} AM`, 
        timeOut: `0${Math.floor(rand * 2) + 5}:${Math.floor(rand * 50 + 10).toString().padStart(2, '0')} PM`, 
        location: day % 3 === 0 ? 'BCDA - Admin' : day % 3 === 1 ? 'BCDA - Control Tower' : 'Sto. Rosario' 
      };
    }
  }
  return history;
};

// Modal Calendar Component
function EmployeeAttendanceModal({ 
  employee, 
  isOpen, 
  onClose 
}: { 
  employee: AuditRecord | null; 
  isOpen: boolean; 
  onClose: () => void;
}) {
  const [modalMonth, setModalMonth] = useState(3); // April = 3
  const [modalYear, setModalYear] = useState(2026);
  
  if (!isOpen || !employee) return null;
  
  const attendanceHistory = generateEmployeeAttendanceHistory(employee.code);
  
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
      case 'late': return 'bg-[#facc15]/30 border-[#facc15]/50';
      case 'absent': return 'bg-red-500/30 border-red-500/50';
      default: return 'bg-[#1a1a1a] border-[#262626]';
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
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-4xl bg-[#141414] rounded-2xl border border-[#262626] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
              <User className="w-5 h-5 text-[#facc15]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{employee.name}</h2>
              <span className="inline-flex items-center px-2 py-0.5 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded">
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
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-white font-medium min-w-[120px] text-center">
                {monthNames[modalMonth]} {modalYear}
              </span>
              <button 
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Modal Calendar */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs text-gray-500 py-2 font-medium">
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
                    : item.record?.status
                    ? `${getStatusColor(item.record.status)} text-white`
                    : 'bg-[#1a1a1a] border-[#262626] text-gray-500'
                }`}
              >
                <div className="flex flex-col h-full justify-between">
                  <span className="text-sm font-medium">{item.day}</span>
                  {item.record?.status && (
                    <div className="text-[9px] leading-tight">
                      <div className="text-gray-300">{item.record.timeIn}</div>
                      <div className="text-gray-400">{item.record.timeOut}</div>
                      <div className="flex items-center gap-0.5 mt-0.5 text-gray-500">
                        <MapPin className="w-2 h-2" />
                        <span className="truncate">{item.record.location}</span>
                      </div>
                      <div className={`mt-1 font-medium ${
                        item.record.status === 'present' ? 'text-green-400' :
                        item.record.status === 'late' ? 'text-[#facc15]' :
                        item.record.status === 'absent' ? 'text-red-400' : 'text-gray-400'
                      }`}>
                        {getStatusText(item.record.status)}
                      </div>
                    </div>
                  )}
                  {!item.record?.status && !item.prevMonth && !item.nextMonth && (
                    <span className="text-[9px] text-gray-600 mt-auto">No Record</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-6 px-6 py-4 border-t border-[#262626] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
            <span className="text-gray-400">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#facc15]/30 border border-[#facc15]/50" />
            <span className="text-gray-400">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
            <span className="text-gray-400">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#1a1a1a] border border-[#262626]" />
            <span className="text-gray-400">No Record</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Branch Attendance Modal Component
function BranchAttendanceModal({
  branch,
  isOpen,
  onClose,
  records
}: {
  branch: string | null;
  isOpen: boolean;
  onClose: () => void;
  records: AuditRecord[];
}) {
  const [modalMonth, setModalMonth] = useState(3); // April = 3
  const [modalYear, setModalYear] = useState(2026);

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

  // Generate daily records for branch
  const generateDailyRecords = (day: number) => {
    const records: { name: string; timeIn: string; timeOut: string; location: string; status: 'present' | 'late' | 'absent' }[] = [];
    const presentCount = Math.floor(Math.random() * branchEmployees.length * 0.7) + Math.floor(branchEmployees.length * 0.2);
    const lateCount = Math.floor(Math.random() * 5);
    const absentCount = branchEmployees.length - presentCount - lateCount;
    
    branchEmployees.forEach((emp, idx) => {
      let status: 'present' | 'late' | 'absent';
      if (idx < presentCount) status = 'present';
      else if (idx < presentCount + lateCount) status = 'late';
      else status = 'absent';
      
      records.push({
        name: emp.name,
        timeIn: status === 'absent' ? '-' : `06:${30 + Math.floor(Math.random() * 30).toString().padStart(2, '0')} AM`,
        timeOut: status === 'absent' ? '-' : `0${5 + Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} PM`,
        location: branch,
        status
      });
    });
    
    return {
      records,
      summary: { present: presentCount, late: lateCount, absent: absentCount, total: branchEmployees.length }
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-400';
      case 'late': return 'text-[#facc15]';
      case 'absent': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-7xl bg-[#141414] rounded-2xl border border-[#262626] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-[#facc15]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{branch}</h2>
              <span className="inline-flex items-center px-2 py-0.5 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded">
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
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-white font-medium min-w-[120px] text-center">
                {monthNames[modalMonth]} {modalYear}
              </span>
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Calendar */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs text-gray-500 py-2 font-medium bg-[#1a1a1a] rounded">
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
                  className={`min-h-[140px] p-2 rounded-lg border transition-all ${
                    item.prevMonth || item.nextMonth
                      ? 'bg-transparent border-transparent'
                      : 'bg-[#1a1a1a] border-[#262626] hover:border-[#404040]'
                  }`}
                >
                  {item.isCurrentMonth && (
                    <div className="flex flex-col h-full">
                      <span className="text-sm font-medium text-white mb-2">{item.day}</span>
                      {dayData && dayData.summary.total > 0 && (
                        <div className="flex-1 space-y-1 overflow-hidden">
                          {dayData.records.slice(0, 4).map((record, ridx) => (
                            <div key={ridx} className="text-[10px] leading-tight truncate">
                              <span className={getStatusColor(record.status)}>{record.name}</span>
                            </div>
                          ))}
                          {dayData.records.length > 4 && (
                            <div className="text-[10px] text-gray-500">
                              +{dayData.records.length - 4} more
                            </div>
                          )}
                        </div>
                      )}
                      {dayData && dayData.summary.total > 0 && (
                        <div className="mt-1 pt-1 border-t border-[#262626] text-[9px] text-gray-500 flex justify-between">
                          <span className="text-green-400">{dayData.summary.present} P</span>
                          <span className="text-[#facc15]">{dayData.summary.late} L</span>
                          <span className="text-red-400">{dayData.summary.absent} A</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 px-6 py-4 border-t border-[#262626] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/30 border border-green-500/50" />
            <span className="text-gray-400">Present</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#facc15]/30 border border-[#facc15]/50" />
            <span className="text-gray-400">Late</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/30 border border-red-500/50" />
            <span className="text-gray-400">Absent</span>
          </div>
        </div>
      </div>
    </div>
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
      case 'late': return 'bg-[#facc15]/20 text-[#facc15] border-[#facc15]/30';
      case 'absent': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'restday': return 'bg-gray-500/10 text-gray-500 border-gray-500/20';
      default: return 'bg-[#1a1a1a] text-gray-400 border-[#262626]';
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl bg-[#141414] rounded-2xl border border-[#262626] shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#facc15]/20 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-[#facc15]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{employee.name}</h2>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Briefcase className="w-3 h-3" />
                <span>Worker • {employee.code} • {employee.branch}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentWeek(w => w - 7)}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-white font-medium">
                Week of April {currentWeek}, 2026
              </span>
              <button
                onClick={() => setCurrentWeek(w => w + 7)}
                className="p-2 hover:bg-[#262626] rounded-lg transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Week Schedule Grid */}
        <div className="p-6">
          <div className="grid grid-cols-7 gap-3">
            {weekDays.map((day, idx) => {
              const date = weekDates[idx];
              const data = scheduleData[date];
              return (
                <div key={day} className="bg-[#1a1a1a] rounded-xl border border-[#262626] overflow-hidden">
                  {/* Day Header */}
                  <div className="bg-[#262626] px-3 py-2 text-center">
                    <div className="text-xs text-gray-500 font-medium">{day}</div>
                    <div className="text-lg font-bold text-white">{date}</div>
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
                            <span className="text-gray-500">In:</span>
                            <span className="text-white font-medium">{data.timeIn}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Out:</span>
                            <span className="text-white font-medium">{data.timeOut}</span>
                          </div>
                        </div>
                        
                        <div className="pt-2 border-t border-[#262626]">
                          <div className="flex items-center gap-1.5">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span className="text-xs text-gray-400">{data.notes}</span>
                          </div>
                        </div>
                      </>
                    )}
                    
                    {data.status === 'absent' && (
                      <div className="pt-2 border-t border-[#262626]">
                        <div className="flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3 text-red-400" />
                          <span className="text-xs text-red-400">{data.notes}</span>
                        </div>
                      </div>
                    )}
                    
                    {data.status === 'restday' && (
                      <div className="pt-2 border-t border-[#262626]">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle className="w-3 h-3 text-gray-500" />
                          <span className="text-xs text-gray-500">{data.notes}</span>
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
        <div className="flex items-center justify-center gap-6 px-6 py-4 border-t border-[#262626] text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
            <span className="text-gray-400">Present (On Time)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-[#facc15]/20 border border-[#facc15]/30" />
            <span className="text-gray-400">Late (15+ min)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
            <span className="text-gray-400">Absent</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded bg-gray-500/10 border border-gray-500/20" />
            <span className="text-gray-400">Rest Day</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Type for audit record
interface AuditRecord {
  id: number;
  employeeId: number;
  name: string;
  code: string;
  branch: string;
  timeIn: string;
  timeOut: string;
  hours: string;
  status: string;
  rawStatus: string;
}

export default function AttendanceAuditPage() {
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState(20);
  const [selectedEmployee, setSelectedEmployee] = useState<AuditRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<string | null>(null);
  const [isBranchModalOpen, setIsBranchModalOpen] = useState(false);
  const [scheduleEmployee, setScheduleEmployee] = useState<AuditRecord | null>(null);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState('ALL');

  // Format date for API (YYYY-MM-DD)
  const formattedDate = useMemo(() => {
    const date = new Date(2026, 3, selectedDate); // April 2026
    return date.toISOString().split('T')[0];
  }, [selectedDate]);

  // Fetch attendance audit data
  const { data: auditData, isLoading } = useQuery({
    queryKey: ['attendance-audit', formattedDate, selectedBranchFilter],
    queryFn: async () => {
      const response = await attendanceApi.getAudit({
        date: formattedDate,
        branch_code: selectedBranchFilter === 'ALL' ? undefined : selectedBranchFilter,
        status: activeFilter === 'all' ? undefined : activeFilter
      });
      return response.data.data;
    }
  });

  const records = auditData?.records || [];
  const stats = auditData?.stats || { totalRecords: 0, currentlyPresent: 0, completedShifts: 0, absent: 0, present: 0, late: 0 };
  
  // Generate calendar days based on branch filter
  const calendarDays = generateCalendarDays(selectedBranchFilter);

  // Filter data based on search query and active filter (client-side)
  const filteredData = useMemo(() => {
    let data = records;
    
    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      data = data.filter(emp => 
        emp.name.toLowerCase().includes(query) ||
        emp.code.toLowerCase().includes(query) ||
        emp.branch.toLowerCase().includes(query)
      );
    }
    
    // Apply status filter (if not already filtered by API)
    if (activeFilter !== 'all') {
      data = data.filter(emp => {
        if (activeFilter === 'present') return emp.rawStatus === 'present';
        if (activeFilter === 'late') return emp.rawStatus === 'late';
        if (activeFilter === 'absent') return emp.rawStatus === 'absent' || emp.rawStatus === null;
        if (activeFilter === 'completed') return emp.timeOut !== '-';
        return true;
      });
    }
    
    return data;
  }, [records, searchQuery, activeFilter]);

  return (
    <div className="space-y-6 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Attendance <span className="text-[#facc15]">Audit</span>
          </h1>
          <p className="text-gray-400 mt-1">Review daily attendance records by selecting a date</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search employees, codes, or branches..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15]"
          />
        </div>
        
        {/* Branch Filter Dropdown */}
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-gray-500" />
          <select 
            value={selectedBranchFilter}
            onChange={(e) => setSelectedBranchFilter(e.target.value)}
            className="px-4 py-2.5 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15] min-w-[180px]"
          >
            {branches.map((branch) => (
              <option key={branch.code} value={branch.code}>
                {branch.code === 'ALL' ? branch.name : `${branch.code} - ${branch.name}`}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex items-center gap-2 text-gray-400 text-sm">
          <span>Search By</span>
        </div>
        <select className="px-4 py-2.5 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]">
          <option>All Fields</option>
          <option>Employee Name</option>
          <option>Code</option>
          <option>Branch</option>
        </select>
        <button className="flex items-center gap-2 px-4 py-2.5 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
          <Search className="w-4 h-4" />
          Search
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-2">
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] text-gray-300 rounded-lg hover:border-[#facc15] transition-colors">
          <Calendar className="w-4 h-4" />
          This Week
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] text-gray-300 rounded-lg hover:border-[#facc15] transition-colors">
          <Calendar className="w-4 h-4" />
          This Month
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
          <Calendar className="w-4 h-4" />
          Today
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-[#1a1a1a] border border-[#262626] text-gray-300 rounded-lg hover:border-[#facc15] transition-colors">
          <FileText className="w-4 h-4" />
          Generate Report
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
          <Download className="w-4 h-4" />
          Export Excel
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
          <FileText className="w-4 h-4" />
          Individual Report
        </button>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Calendar Section */}
        <div className="xl:col-span-1 bg-[#141414] rounded-xl border border-[#262626] p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold text-white">April 2026</h2>
            <div className="flex items-center gap-2">
              <button className="p-1 hover:bg-[#262626] rounded transition-colors">
                <ChevronLeft className="w-5 h-5 text-gray-400" />
              </button>
              <button className="px-3 py-1 bg-[#facc15] text-black text-sm font-medium rounded">
                Today
              </button>
              <button className="p-1 hover:bg-[#262626] rounded transition-colors">
                <ChevronRight className="w-5 h-5 text-gray-400" />
              </button>
            </div>
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 gap-1">
            {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map(day => (
              <div key={day} className="text-center text-xs text-gray-500 py-2 font-medium">
                {day}
              </div>
            ))}
            {calendarDays.map((item, index) => (
              <button
                key={index}
                onClick={() => !item.prevMonth && !item.nextMonth && setSelectedDate(item.day)}
                className={`aspect-square p-2 rounded-lg text-sm transition-all ${
                  item.prevMonth || item.nextMonth
                    ? 'text-gray-600'
                    : selectedDate === item.day
                    ? 'bg-[#facc15] text-black font-semibold'
                    : item.today
                    ? 'bg-[#facc15]/20 text-[#facc15] border border-[#facc15]'
                    : 'bg-[#1a1a1a] text-gray-300 hover:bg-[#262626]'
                }`}
              >
                <div className="flex flex-col items-center">
                  <span>{item.day}</span>
                  {item.records && !item.prevMonth && !item.nextMonth && (
                    <span className={`text-[10px] mt-0.5 ${selectedDate === item.day ? 'text-black/70' : 'text-gray-500'}`}>
                      {item.records} rec
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t border-[#262626] text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#facc15]" />
              <span className="text-gray-400">Selected</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded border border-[#facc15] bg-[#facc15]/20" />
              <span className="text-gray-400">Today</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded bg-[#1a1a1a]" />
              <span className="text-gray-400">Has Records</span>
            </div>
          </div>
        </div>

        {/* Right Panel - Stats and Table */}
        <div className="xl:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#141414] rounded-xl border border-[#262626] p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Total Records</p>
              <p className="text-2xl font-bold text-white mt-1">{stats.totalRecords}</p>
            </div>
            <div className="bg-[#141414] rounded-xl border border-[#262626] p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Currently Present</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{stats.currentlyPresent}</p>
            </div>
            <div className="bg-[#141414] rounded-xl border border-[#262626] p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Completed Shifts</p>
              <p className="text-2xl font-bold text-gray-500 mt-1">{stats.completedShifts}</p>
            </div>
            <div className="bg-[#141414] rounded-xl border border-[#262626] p-4">
              <p className="text-gray-400 text-xs uppercase tracking-wider">Absent</p>
              <p className="text-2xl font-bold text-red-400 mt-1">{stats.absent}</p>
            </div>
          </div>

          {/* Selected Date Info */}
          <div className="bg-[#facc15]/10 border border-[#facc15]/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Calendar className="w-5 h-5 text-[#facc15]" />
              <h3 className="text-[#facc15] font-semibold">April 20, 2026 (Monday)</h3>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <AlertCircle className="w-4 h-4 text-yellow-500" />
              <span>Auto-absent mode active. Employees without time-in records are shown as <span className="text-red-400">Absent (Auto)</span></span>
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
                    : 'bg-[#1a1a1a] text-gray-400 border border-[#262626] hover:border-[#404040]'
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
                  <span className={`px-1.5 py-0.5 rounded text-xs ${activeFilter === tab.id ? 'bg-black/20' : 'bg-[#262626]'}`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Employee Table */}
          <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#262626]">
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Branch</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time In</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Time Out</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Hours</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-500">
                        No records found
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((employee) => (
                      <tr key={employee.id} className="border-b border-[#262626] last:border-0 hover:bg-[#1a1a1a]">
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-[#262626] flex items-center justify-center">
                              <User className="w-4 h-4 text-gray-400" />
                            </div>
                            <div>
                              <button
                                onClick={() => {
                                  setSelectedEmployee(employee);
                                  setIsModalOpen(true);
                                }}
                                className="text-white font-medium text-sm hover:text-[#facc15] transition-colors text-left"
                              >
                                {employee.name}
                              </button>
                              <p className="text-gray-500 text-xs">Worker</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-4 py-4 text-gray-400 font-mono text-sm">{employee.code}</td>
                        <td className="px-4 py-4">
                          <button
                            onClick={() => {
                              setSelectedBranch(employee.branch);
                              setIsBranchModalOpen(true);
                            }}
                            className="text-gray-400 text-sm hover:text-[#facc15] transition-colors text-left"
                          >
                            {employee.branch}
                          </button>
                        </td>
                        <td className="px-4 py-4 text-gray-400 text-sm">{employee.timeIn}</td>
                        <td className="px-4 py-4 text-gray-400 text-sm">{employee.timeOut}</td>
                        <td className="px-4 py-4 text-gray-400 text-sm">{employee.hours}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                            employee.status === 'Present'
                              ? 'bg-green-500/20 text-green-400'
                              : employee.status === 'Absent'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-500/20 text-gray-400'
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
                            className="text-[#facc15] hover:text-yellow-400 text-sm font-medium"
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
    </div>
  );
}
