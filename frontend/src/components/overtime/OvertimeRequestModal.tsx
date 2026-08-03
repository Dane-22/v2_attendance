'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Clock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Sparkles,
  ArrowRight,
  Zap,
  RotateCcw,
  Search,
  X,
  Check,
  UserPlus,
  Users
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '@/hooks/useTheme';
import { overtimeRequestApi, employeeApi } from '@/lib/api';

export interface SelectedEmployeeItem {
  id?: number;
  code?: string;
  name: string;
  position?: string;
  branchCode?: string;
}

interface OvertimeRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmployee?: SelectedEmployeeItem | null;
  onSuccess?: () => void;
}

export default function OvertimeRequestModal({
  isOpen,
  onClose,
  initialEmployee,
  onSuccess
}: OvertimeRequestModalProps) {
  const { classes } = useTheme();
  const queryClient = useQueryClient();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Selected employees list
  const [selectedEmployees, setSelectedEmployees] = useState<SelectedEmployeeItem[]>([]);
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Schedule & Form State
  const [requestDate, setRequestDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [startTime, setStartTime] = useState<string>('16:00');
  const [endTime, setEndTime] = useState<string>('18:00');
  const [requestedHours, setRequestedHours] = useState<number>(2);
  const [reason, setReason] = useState<string>('');
  const [isCustomHoursOverride, setIsCustomHoursOverride] = useState(false);
  const isSubmittingRef = useRef(false);

  // Status & Error state
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Initial employee sync when modal opens or prop changes
  useEffect(() => {
    if (initialEmployee) {
      setSelectedEmployees((prev) => {
        const exists = prev.some(
          (emp) => (emp.id && emp.id === initialEmployee.id) || (emp.code && emp.code === initialEmployee.code)
        );
        if (!exists) {
          return [...prev, initialEmployee];
        }
        return prev;
      });
    }
  }, [initialEmployee]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !initialEmployee && selectedEmployees.length === 0) {
      setRequestDate(new Date().toISOString().split('T')[0]);
      setStartTime('16:00');
      setEndTime('18:00');
      setRequestedHours(2);
      setReason('');
      setSubmitSuccess(null);
      setSubmitError(null);
      setErrors({});
    }
  }, [isOpen]);

  // Fetch employee list for autocomplete
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees-list-select-modal'],
    queryFn: async () => {
      const res = await employeeApi.getAll({ limit: 500 });
      return res.data;
    },
    enabled: isOpen
  });

  const employeesList = Array.isArray(employeesResponse?.data)
    ? employeesResponse.data
    : Array.isArray(employeesResponse)
    ? employeesResponse
    : [];

  const filteredEmployees = employeesList.filter((emp: any) => {
    if (!employeeSearchQuery.trim()) return true;
    const query = employeeSearchQuery.toLowerCase().trim();
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const position = (emp.position || '').toLowerCase();
    const code = (emp.employeeCode || '').toLowerCase();
    const branch = (emp.branchCode || emp.branchName || '').toLowerCase();
    return fullName.includes(query) || position.includes(query) || code.includes(query) || branch.includes(query);
  });

  // Close suggestions dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Time conversion utilities
  const formatTimeTo12Hour = (timeStr: string): string => {
    if (!timeStr) return '--:--';
    const [hStr, mStr] = timeStr.split(':');
    let h = parseInt(hStr, 10);
    const m = mStr || '00';
    if (isNaN(h)) return '--:--';
    const period = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${h}:${m} ${period}`;
  };

  const timeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const [hours, minutes] = timeStr.split(':').map(Number);
    return (hours || 0) * 60 + (minutes || 0);
  };

  const calculateHours = (start: string, end: string): number => {
    const startMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);
    const diffMins = endMins - startMins;
    return diffMins > 0 ? Number((diffMins / 60).toFixed(2)) : 0;
  };

  const addHoursToTime = (startTimeStr: string, hoursToAdd: number): string => {
    const baseTime = startTimeStr || '16:00';
    const [h, m] = baseTime.split(':').map(Number);
    const totalMins = (h || 0) * 60 + (m || 0) + Math.round(hoursToAdd * 60);
    const newH = Math.floor((totalMins / 60) % 24);
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // Auto calculate hours
  useEffect(() => {
    if (startTime && endTime && !isCustomHoursOverride) {
      const hours = calculateHours(startTime, endTime);
      if (hours > 0) {
        setRequestedHours(hours);
      }
    }
  }, [startTime, endTime, isCustomHoursOverride]);

  // Handlers for adding/removing employees
  const handleAddEmployee = (emp: any) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.trim();
    const newItem: SelectedEmployeeItem = {
      id: emp.id,
      code: emp.employeeCode,
      name: fullName,
      position: emp.position || 'Staff',
      branchCode: emp.branchCode || emp.branchName
    };

    setSelectedEmployees((prev) => {
      if (prev.some((e) => (e.id && e.id === emp.id) || (e.code && e.code === emp.employeeCode))) {
        return prev;
      }
      return [...prev, newItem];
    });

    setEmployeeSearchQuery('');
    setShowSuggestions(false);
  };

  const handleRemoveEmployee = (indexToRemove: number) => {
    setSelectedEmployees((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleClearAllEmployees = () => {
    setSelectedEmployees([]);
  };

  const handleQuickDurationPreset = (hours: number) => {
    setIsCustomHoursOverride(false);
    const start = startTime || '16:00';
    const end = addHoursToTime(start, hours);
    setStartTime(start);
    setEndTime(end);
    setRequestedHours(hours);
  };

  const handleShiftPreset = (start24: string, end24: string) => {
    setIsCustomHoursOverride(false);
    const hours = calculateHours(start24, end24);
    setStartTime(start24);
    setEndTime(end24);
    setRequestedHours(hours);
  };

  const handleReasonPreset = (presetText: string) => {
    setReason((prev) => (prev ? `${prev} - ${presetText}` : presetText));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (selectedEmployees.length === 0) {
      newErrors.employees = 'Please select at least one employee for the overtime request';
    }

    if (!requestDate) {
      newErrors.requestDate = 'Request date is required';
    }

    if (!startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (startTime && endTime) {
      const startMins = timeToMinutes(startTime);
      const endMins = timeToMinutes(endTime);
      if (endMins <= startMins) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (!reason || reason.trim().length < 5) {
      newErrors.reason = 'Please enter a clear reason (minimum 5 characters)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmittingRef.current) return;
    setSubmitSuccess(null);
    setSubmitError(null);

    if (!validateForm()) return;

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    try {
      const employeeIds = selectedEmployees.map((e) => e.id).filter(Boolean) as number[];
      const employeeCodes = selectedEmployees.map((e) => e.code).filter(Boolean) as string[];

      let response: any;
      if (selectedEmployees.length > 1) {
        response = await overtimeRequestApi.createBatch({
          employeeIds,
          employeeCodes,
          requestDate,
          startTime,
          endTime,
          requestedHours,
          reason
        });
      } else {
        const emp = selectedEmployees[0];
        response = await overtimeRequestApi.create({
          employeeId: emp.id,
          employeeCode: emp.code,
          employeeName: emp.name,
          requestDate,
          startTime,
          endTime,
          requestedHours,
          reason
        });
      }

      if (response.data?.success) {
        const msg = `Overtime request for ${selectedEmployees.length} employee(s) submitted successfully for approval!`;
        setSubmitSuccess(msg);
        queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
        queryClient.invalidateQueries({ queryKey: ['my-overtime-requests'] });

        setTimeout(() => {
          setSelectedEmployees([]);
          onSuccess?.();
          onClose();
        }, 1500);
      } else {
        setSubmitError(response.data?.message || 'Failed to submit overtime request.');
      }
    } catch (err: any) {
      console.error('Submit overtime error:', err);
      setSubmitError(err.response?.data?.message || 'Failed to submit overtime request. Please try again.');
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto">
      <div className="relative w-full max-w-3xl my-8 rounded-3xl bg-[#121212] border border-white/15 text-white shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15]">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Submit Overtime Request
                {selectedEmployees.length > 1 && (
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#facc15] text-black font-semibold">
                    Batch ({selectedEmployees.length})
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Submit OT requests for one or multiple employees at once
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Feedback Alerts */}
          {submitSuccess && (
            <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl text-emerald-300 flex items-center gap-3 shadow-lg">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
              <p className="text-sm font-medium">{submitSuccess}</p>
            </div>
          )}

          {submitError && (
            <div className="p-4 bg-rose-950/70 border border-rose-500/50 rounded-2xl text-rose-300 flex items-center justify-between gap-3 shadow-lg">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0" />
                <p className="text-sm font-medium">{submitError}</p>
              </div>
              <button onClick={() => setSubmitError(null)} className="text-rose-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <form id="ot-modal-form" onSubmit={handleSubmit} className="space-y-6">
            {/* SECTION 1: Selected Employee(s) */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-[#facc15]" />
                  <h3 className="text-base font-semibold text-white">
                    1. Selected Employees ({selectedEmployees.length})
                  </h3>
                </div>
                {selectedEmployees.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllEmployees}
                    className="text-xs text-rose-400 hover:underline"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {/* Selected Employee Tags */}
              <div className="flex flex-wrap gap-2 min-h-[44px] p-3 bg-[#181818] border border-[#262626] rounded-2xl">
                {selectedEmployees.length === 0 ? (
                  <div className="text-xs text-gray-500 flex items-center gap-2 py-1">
                    <UserPlus className="w-4 h-4 text-gray-400" />
                    <span>Scan QR code or search employee name below to add to request...</span>
                  </div>
                ) : (
                  selectedEmployees.map((emp, index) => (
                    <div
                      key={index}
                      className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-slate-900 to-blue-950 border border-blue-400/30 text-white text-xs font-medium shadow-sm animate-in fade-in"
                    >
                      <User className="w-3.5 h-3.5 text-[#facc15]" />
                      <span>{emp.name}</span>
                      {emp.code && <span className="text-[10px] text-blue-300 font-mono">({emp.code})</span>}
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployee(index)}
                        className="text-slate-400 hover:text-white p-0.5 rounded hover:bg-white/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>
              {errors.employees && <p className="text-red-400 text-xs">{errors.employees}</p>}

              {/* Employee Autocomplete Input */}
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">
                  Search & Add Employee
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => {
                      setEmployeeSearchQuery(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    placeholder="Type name, code, or department..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15] transition-all"
                  />
                </div>

                {/* Dropdown Suggestions */}
                {showSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 z-40 bg-[#1e1e1e] border border-[#2e2e2e] rounded-xl shadow-2xl max-h-56 overflow-y-auto divide-y divide-[#282828]">
                    {isLoadingEmployees ? (
                      <div className="p-3 text-xs text-gray-400 text-center">Loading employee directory...</div>
                    ) : filteredEmployees.length > 0 ? (
                      filteredEmployees.map((emp: any) => (
                        <div
                          key={emp.id}
                          onClick={() => handleAddEmployee(emp)}
                          className="p-3 hover:bg-[#282828] cursor-pointer transition-colors flex items-center justify-between group"
                        >
                          <div>
                            <p className="text-sm font-semibold text-white group-hover:text-[#facc15]">
                              {emp.firstName} {emp.lastName}
                            </p>
                            <p className="text-xs text-gray-400">
                              {emp.position || 'Staff'} {emp.branchCode ? `• ${emp.branchCode}` : ''}
                            </p>
                          </div>
                          <span className="text-[10px] font-mono bg-[#141414] text-gray-400 px-2 py-0.5 rounded border border-[#282828]">
                            +{emp.employeeCode || `ID #${emp.id}`}
                          </span>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 text-xs text-gray-400 text-center">No matching employees found</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* SECTION 2: Schedule & Hours */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#facc15]" />
                  <h3 className="text-base font-semibold text-white">2. Schedule & Hours</h3>
                </div>
                <div className="flex items-center gap-2 bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15] px-3 py-1 rounded-full text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Total OT: {requestedHours || 0} Hrs</span>
                </div>
              </div>

              {/* Request Date Input */}
              <div>
                <label className="block text-xs font-medium text-gray-400 mb-1.5">Request Date</label>
                <input
                  type="date"
                  value={requestDate}
                  onChange={(e) => setRequestDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-[#181818] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-[#facc15]"
                />
                {errors.requestDate && <p className="text-red-400 text-xs mt-1">{errors.requestDate}</p>}
              </div>

              {/* Live Timeline Display */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-2xl p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-yellow-500/10 text-[#facc15]">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] uppercase text-gray-400 font-semibold block">Start</span>
                    <span className="text-base font-bold text-white tracking-wide">
                      {formatTimeTo12Hour(startTime)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                  <div className="px-3 py-1 rounded-full bg-[#facc15] text-black font-bold text-xs shadow-md">
                    {requestedHours || 0} hrs
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500" />
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-gray-400 font-semibold block">End</span>
                  <span className="text-base font-bold text-white tracking-wide">
                    {formatTimeTo12Hour(endTime)}
                  </span>
                </div>
              </div>

              {/* Quick Presets */}
              <div className="space-y-1.5">
                <span className="text-xs text-gray-400 font-medium block">Quick Duration Presets:</span>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  <button
                    type="button"
                    onClick={() => handleQuickDurationPreset(1)}
                    className="px-2.5 py-2 text-xs font-medium rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#facc15] text-gray-300"
                  >
                    +1.0 Hr
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDurationPreset(2)}
                    className="px-2.5 py-2 text-xs font-medium rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#facc15] text-gray-300"
                  >
                    +2.0 Hrs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDurationPreset(3)}
                    className="px-2.5 py-2 text-xs font-medium rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#facc15] text-gray-300"
                  >
                    +3.0 Hrs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickDurationPreset(4)}
                    className="px-2.5 py-2 text-xs font-medium rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#facc15] text-gray-300"
                  >
                    +4.0 Hrs
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftPreset('16:00', '18:00')}
                    className="px-2.5 py-2 text-xs font-medium rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#facc15] text-gray-300"
                  >
                    4PM - 6PM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShiftPreset('16:00', '19:00')}
                    className="px-2.5 py-2 text-xs font-medium rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#facc15] text-gray-300"
                  >
                    4PM - 7PM
                  </button>
                </div>
              </div>

              {/* Time Pickers & Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      setIsCustomHoursOverride(false);
                      setStartTime(e.target.value);
                    }}
                    className="w-full px-3 py-2.5 bg-[#181818] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-[#facc15]"
                  />
                  {errors.startTime && <p className="text-red-400 text-xs mt-1">{errors.startTime}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setIsCustomHoursOverride(false);
                      setEndTime(e.target.value);
                    }}
                    className="w-full px-3 py-2.5 bg-[#181818] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-[#facc15]"
                  />
                  {errors.endTime && <p className="text-red-400 text-xs mt-1">{errors.endTime}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-1 flex items-center justify-between">
                    <span>OT Hours</span>
                    {isCustomHoursOverride && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomHoursOverride(false);
                          setRequestedHours(calculateHours(startTime, endTime));
                        }}
                        className="text-[10px] text-yellow-400 hover:underline"
                      >
                        Reset Auto
                      </button>
                    )}
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={requestedHours ?? ''}
                    onChange={(e) => {
                      setIsCustomHoursOverride(true);
                      setRequestedHours(parseFloat(e.target.value) || 0);
                    }}
                    className="w-full px-3 py-2.5 bg-[#181818] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>
            </div>

            {/* SECTION 3: Reason & Justification */}
            <div className="space-y-3">
              <div className="flex items-center justify-between border-b border-[#262626] pb-2">
                <div className="flex items-center gap-2">
                  <Info className="w-4 h-4 text-[#facc15]" />
                  <h3 className="text-base font-semibold text-white">3. Reason & Justification</h3>
                </div>
              </div>

              <div>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Enter overtime reason..."
                  className="w-full p-3 bg-[#181818] border border-[#2a2a2a] rounded-xl text-sm text-white focus:outline-none focus:border-[#facc15] resize-none"
                />
                {errors.reason && <p className="text-red-400 text-xs mt-1">{errors.reason}</p>}
              </div>

              <div className="flex items-start gap-2.5 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-xs text-yellow-300">
                <AlertCircle className="w-4 h-4 text-yellow-400 flex-shrink-0 mt-0.5" />
                <p>
                  Overtime requests will be submitted for store admin approval. Submissions for absent employees will be auto-flagged.
                </p>
              </div>
            </div>
          </form>
        </div>

        {/* Modal Footer Actions */}
        <div className="p-6 border-t border-white/10 bg-[#141414] flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-5 py-3 rounded-2xl bg-[#1f1f1f] border border-[#333] text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#282828] transition-all"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="ot-modal-form"
            disabled={isSubmitting}
            className="flex-1 px-5 py-3 rounded-2xl bg-[#facc15] text-black text-sm font-semibold hover:bg-[#facc15]/90 transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>Submitting Request...</>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Submit Request {selectedEmployees.length > 0 ? `(${selectedEmployees.length})` : ''}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
