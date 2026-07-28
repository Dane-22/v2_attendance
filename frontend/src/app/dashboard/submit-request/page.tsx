'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Clock, 
  DollarSign, 
  Calendar, 
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
  Check
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/hooks/useTheme';
import { overtimeRequestApi, employeeApi } from '@/lib/api';
import type { CreateOvertimeRequestInput } from '@/lib/api';

type TabType = 'overtime' | 'cash-advance' | 'leave';

export default function SubmitRequestPage() {
  const { classes } = useTheme();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overtime');

  // Overtime form state
  const [formData, setFormData] = useState<CreateOvertimeRequestInput>({
    employeeId: undefined,
    employeeName: '',
    requestDate: new Date().toISOString().split('T')[0],
    startTime: '17:00',
    endTime: '19:00',
    requestedHours: 2,
    reason: ''
  });

  // Autofill search state
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isCustomHoursOverride, setIsCustomHoursOverride] = useState(false);

  // Fetch employees list for autofill
  const { data: employeesResponse, isLoading: isLoadingEmployees } = useQuery({
    queryKey: ['employees-list-select'],
    queryFn: async () => {
      const res = await employeeApi.getAll({ limit: 500 });
      return res.data;
    }
  });

  const employeesList = Array.isArray(employeesResponse?.data)
    ? employeesResponse.data
    : Array.isArray(employeesResponse)
    ? employeesResponse
    : [];

  // Filter employees for autofill based on query
  const filteredEmployees = employeesList.filter((emp: any) => {
    if (!employeeSearchQuery.trim()) return true;
    const query = employeeSearchQuery.toLowerCase().trim();
    const fullName = `${emp.firstName} ${emp.lastName}`.toLowerCase();
    const position = (emp.position || '').toLowerCase();
    const branch = (emp.branchCode || emp.branchName || '').toLowerCase();
    return fullName.includes(query) || position.includes(query) || branch.includes(query);
  });

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const tabs = [
    { id: 'overtime' as TabType, name: 'Request Overtime', icon: Clock },
    { id: 'cash-advance' as TabType, name: 'Request Cash Advance', icon: DollarSign, badge: 'Coming Soon' },
    { id: 'leave' as TabType, name: 'Request Leave', icon: Calendar, badge: 'Coming Soon' },
  ];

  // Utility to convert 24h format to 12h AM/PM string for friendly UI display
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
    const baseTime = startTimeStr || '17:00';
    const [h, m] = baseTime.split(':').map(Number);
    const totalMins = (h || 0) * 60 + (m || 0) + Math.round(hoursToAdd * 60);
    const newH = Math.floor((totalMins / 60) % 24);
    const newM = totalMins % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  // Auto-calculate hours when start/end time changes
  useEffect(() => {
    if (formData.startTime && formData.endTime && !isCustomHoursOverride) {
      const hours = calculateHours(formData.startTime, formData.endTime);
      if (hours > 0) {
        setFormData(prev => ({
          ...prev,
          requestedHours: hours
        }));
      }
    }
  }, [formData.startTime, formData.endTime, isCustomHoursOverride]);

  const handleSelectEmployeeSuggestion = (emp: any) => {
    const fullName = `${emp.firstName} ${emp.lastName}`.trim();
    setEmployeeSearchQuery(fullName);
    setFormData(prev => ({
      ...prev,
      employeeId: emp.id,
      employeeName: fullName
    }));
    setShowSuggestions(false);
  };

  const handleInputChange = (value: string) => {
    setEmployeeSearchQuery(value);
    setFormData(prev => ({
      ...prev,
      employeeName: value,
      employeeId: undefined // Reset explicit ID unless selected from suggestion
    }));
    setShowSuggestions(true);
  };

  const handleClearEmployee = () => {
    setEmployeeSearchQuery('');
    setFormData(prev => ({
      ...prev,
      employeeName: '',
      employeeId: undefined
    }));
    setShowSuggestions(false);
  };

  const handleQuickDurationPreset = (hours: number) => {
    setIsCustomHoursOverride(false);
    const start = formData.startTime || '17:00';
    const end = addHoursToTime(start, hours);
    setFormData(prev => ({
      ...prev,
      startTime: start,
      endTime: end,
      requestedHours: hours
    }));
  };

  const handleShiftPreset = (start24: string, end24: string) => {
    setIsCustomHoursOverride(false);
    const hours = calculateHours(start24, end24);
    setFormData(prev => ({
      ...prev,
      startTime: start24,
      endTime: end24,
      requestedHours: hours
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeId && (!formData.employeeName || formData.employeeName.trim().length < 2)) {
      newErrors.employeeName = 'Please enter or select a valid employee name';
    }

    if (!formData.requestDate) {
      newErrors.requestDate = 'Request date is required';
    }

    if (!formData.startTime) {
      newErrors.startTime = 'Start time is required';
    }

    if (!formData.endTime) {
      newErrors.endTime = 'End time is required';
    }

    if (formData.startTime && formData.endTime) {
      const startMins = timeToMinutes(formData.startTime);
      const endMins = timeToMinutes(formData.endTime);

      if (endMins <= startMins) {
        newErrors.endTime = 'End time must be after start time';
      }
    }

    if (!formData.reason || formData.reason.trim().length < 10) {
      newErrors.reason = 'Reason must be at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Overtime request mutation
  const overtimeRequestMutation = useMutation({
    mutationFn: (data: CreateOvertimeRequestInput) =>
      overtimeRequestApi.create(data),
    onSuccess: async (response: any) => {
      if (response.data?.success) {
        const empName = formData.employeeName || 'employee';
        const hours = formData.requestedHours || 0;
        const dateStr = formData.requestDate;
        
        setSubmitSuccess(`Overtime request for ${empName} (${hours} hrs on ${dateStr}) has been submitted successfully for manager approval!`);
        setSubmitError(null);
        
        setFormData({
          employeeId: undefined,
          employeeName: '',
          requestDate: new Date().toISOString().split('T')[0],
          startTime: '17:00',
          endTime: '19:00',
          requestedHours: 2,
          reason: ''
        });
        setEmployeeSearchQuery('');
        setIsCustomHoursOverride(false);
        setErrors({});
        await queryClient.invalidateQueries({ queryKey: ['overtime-requests'] });
        await queryClient.invalidateQueries({ queryKey: ['my-overtime-requests'] });
      } else {
        setSubmitError(response.data?.message || 'Failed to submit overtime request. Please check form details and try again.');
        setSubmitSuccess(null);
      }
    },
    onError: (error: any) => {
      console.error('Overtime request error:', error);
      setSubmitError(error.response?.data?.message || 'Failed to submit overtime request. Please try again.');
      setSubmitSuccess(null);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitSuccess(null);
    setSubmitError(null);
    
    if (!validateForm()) {
      console.log('VALIDATION FAILED', { formData, errors });
      return;
    }

    console.log('VALIDATION PASSED', { formData });
    setIsSubmitting(true);
    try {
      await overtimeRequestMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${classes.text} flex items-center gap-3`}>
          <Send className="w-8 h-8 text-[#facc15]" />
          Submit Request
        </h1>
        <p className={`${classes.textMuted} mt-2`}>
          Submit overtime, cash advance, and leave requests with streamlined approvals
        </p>
      </div>

      {/* Tab Navigation */}
      <div className={`rounded-xl border ${classes.bgCard} ${classes.border} p-2`}>
        <div className="flex gap-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-[#facc15] text-black shadow-lg shadow-yellow-500/30 font-semibold'
                    : classes.hover
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{tab.name}</span>
                {tab.badge && (
                  <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full ${
                    isActive ? 'bg-black/20 text-black' : 'bg-gray-800 text-gray-400'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`rounded-2xl border ${classes.bgCard} ${classes.border} p-6 md:p-8 shadow-xl`}>
        {activeTab === 'overtime' && (
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Styled Success & Error Feedback Cards */}
            {submitSuccess && (
              <div className="flex items-start justify-between gap-3 p-4 bg-emerald-950/60 border border-emerald-500/40 rounded-xl text-emerald-300 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg shadow-emerald-950/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 mt-0.5">
                    <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-emerald-200 text-sm">Overtime Request Submitted Successfully</h3>
                    <p className="text-xs text-emerald-300/90 mt-1 leading-relaxed">{submitSuccess}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitSuccess(null)}
                  className="text-emerald-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {submitError && (
              <div className="flex items-start justify-between gap-3 p-4 bg-rose-950/60 border border-rose-500/40 rounded-xl text-rose-300 animate-in fade-in slide-in-from-top-2 duration-300 shadow-lg shadow-rose-950/40">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400 mt-0.5">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-rose-200 text-sm">Submission Failed</h3>
                    <p className="text-xs text-rose-300/90 mt-1 leading-relaxed">{submitError}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSubmitError(null)}
                  className="text-rose-400 hover:text-white p-1 rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* SECTION 1: Employee & Request Date */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 border-b border-[#262626] pb-3">
                <User className="w-5 h-5 text-[#facc15]" />
                <h2 className="text-lg font-semibold text-white">1. Employee & Date Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Input with Autofill / Autocomplete */}
                <div className="relative" ref={dropdownRef}>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Employee Name <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                      <Search className="w-4 h-4 text-[#facc15]" />
                    </div>
                    <input
                      type="text"
                      value={employeeSearchQuery}
                      onChange={(e) => handleInputChange(e.target.value)}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Start typing employee name..."
                      autoComplete="off"
                      className={`w-full pl-10 pr-10 py-3 rounded-xl bg-[#141414] border ${
                        errors.employeeName ? 'border-red-500' : 'border-[#262626]'
                      } text-white focus:outline-none focus:border-[#facc15] transition-colors`}
                    />
                    {employeeSearchQuery && (
                      <button
                        type="button"
                        onClick={handleClearEmployee}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Selected Indicator Badge */}
                  {formData.employeeId && (
                    <div className="mt-1.5 flex items-center gap-1.5 text-xs text-green-400 font-medium">
                      <Check className="w-3.5 h-3.5" />
                      <span>Linked to Employee ID #{formData.employeeId}</span>
                    </div>
                  )}

                  {/* Autofill Floating Dropdown */}
                  {showSuggestions && (
                    <div className="absolute left-0 right-0 top-full mt-1.5 z-30 bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl shadow-2xl overflow-hidden max-h-60 overflow-y-auto divide-y divide-[#242424]">
                      {isLoadingEmployees ? (
                        <div className="p-3 text-xs text-gray-400 text-center">Loading directory...</div>
                      ) : filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp: any) => (
                          <div
                            key={emp.id}
                            onClick={() => handleSelectEmployeeSuggestion(emp)}
                            className="p-3 hover:bg-[#252525] cursor-pointer transition-colors flex items-center justify-between group"
                          >
                            <div>
                              <p className="text-sm font-semibold text-white group-hover:text-[#facc15] transition-colors">
                                {emp.firstName} {emp.lastName}
                              </p>
                              <p className="text-xs text-gray-400">
                                {emp.position || 'Staff'} {emp.branchCode ? `• ${emp.branchCode}` : ''}
                              </p>
                            </div>
                            <span className="text-[10px] font-mono bg-[#141414] text-gray-400 group-hover:text-white px-2 py-0.5 rounded border border-[#262626]">
                              ID #{emp.id}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-xs text-gray-400 text-center">
                          No matching employee found. You can continue typing to record custom name.
                        </div>
                      )}
                    </div>
                  )}

                  {errors.employeeName && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.employeeName}</p>
                  )}
                </div>

                {/* Request Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Request Date <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={formData.requestDate}
                      onChange={(e) => setFormData(prev => ({ ...prev, requestDate: e.target.value }))}
                      className={`w-full px-4 py-3 rounded-xl bg-[#141414] border ${
                        errors.requestDate ? 'border-red-500' : 'border-[#262626]'
                      } text-white focus:outline-none focus:border-[#facc15] transition-colors`}
                    />
                  </div>
                  {errors.requestDate && (
                    <p className="text-red-500 text-xs mt-1.5">{errors.requestDate}</p>
                  )}
                </div>
              </div>
            </div>

            {/* SECTION 2: Refactored Overtime Time & Schedule Card */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5 text-[#facc15]" />
                  <h2 className="text-lg font-semibold text-white">2. Overtime Schedule & Hours</h2>
                </div>
                {/* Computed Hours Badge */}
                <div className="flex items-center gap-2 bg-[#facc15]/10 border border-[#facc15]/30 text-[#facc15] px-3 py-1 rounded-full text-xs font-semibold">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Total OT: {formData.requestedHours || 0} Hours</span>
                </div>
              </div>

              {/* Interactive Schedule Control Box */}
              <div className="bg-[#121212] border border-[#262626] rounded-2xl p-5 md:p-6 space-y-6">
                
                {/* Live Visual Timeline Summary */}
                <div className="bg-[#1a1a1a] border border-[#2c2c2c] rounded-xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
                  {/* Start Time Preview */}
                  <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="p-2.5 rounded-lg bg-yellow-500/10 text-[#facc15]">
                      <Clock className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-medium text-gray-400 block">Start Time</span>
                      <span className="text-xl font-bold text-white tracking-wide">
                        {formatTimeTo12Hour(formData.startTime)}
                      </span>
                    </div>
                  </div>

                  {/* Arrow Indicator & Duration Badge */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-center my-2 md:my-0">
                    <ArrowRight className="w-5 h-5 text-gray-500 hidden md:block" />
                    <div className="text-center px-4 py-1.5 rounded-full bg-[#facc15] text-black font-bold text-sm shadow-md shadow-yellow-500/20">
                      {formData.requestedHours || 0} hrs
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500 hidden md:block" />
                  </div>

                  {/* End Time Preview */}
                  <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                    <div className="text-right">
                      <span className="text-xs uppercase font-medium text-gray-400 block">End Time</span>
                      <span className="text-xl font-bold text-white tracking-wide">
                        {formatTimeTo12Hour(formData.endTime)}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-yellow-500/10 text-[#facc15]">
                      <Clock className="w-5 h-5" />
                    </div>
                  </div>
                </div>

                {/* Quick Presets Bar */}
                <div className="space-y-2">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider block">
                    Quick Overtime Presets:
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                    <button
                      type="button"
                      onClick={() => handleQuickDurationPreset(1)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        formData.requestedHours === 1 && !isCustomHoursOverride
                          ? 'bg-[#facc15] text-black border-[#facc15] font-semibold'
                          : 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-[#facc15]/50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      +1.0 Hour
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDurationPreset(2)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        formData.requestedHours === 2 && !isCustomHoursOverride
                          ? 'bg-[#facc15] text-black border-[#facc15] font-semibold'
                          : 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-[#facc15]/50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      +2.0 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDurationPreset(3)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        formData.requestedHours === 3 && !isCustomHoursOverride
                          ? 'bg-[#facc15] text-black border-[#facc15] font-semibold'
                          : 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-[#facc15]/50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      +3.0 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => handleQuickDurationPreset(4)}
                      className={`px-3 py-2 text-xs font-medium rounded-lg border transition-all flex items-center justify-center gap-1.5 ${
                        formData.requestedHours === 4 && !isCustomHoursOverride
                          ? 'bg-[#facc15] text-black border-[#facc15] font-semibold'
                          : 'bg-[#181818] border-[#2a2a2a] text-gray-300 hover:border-[#facc15]/50'
                      }`}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      +4.0 Hours
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftPreset('17:00', '19:00')}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-300 hover:border-[#facc15]/50 transition-all text-center"
                    >
                      5PM - 7PM
                    </button>
                    <button
                      type="button"
                      onClick={() => handleShiftPreset('17:00', '20:00')}
                      className="px-3 py-2 text-xs font-medium rounded-lg bg-[#181818] border border-[#2a2a2a] text-gray-300 hover:border-[#facc15]/50 transition-all text-center"
                    >
                      5PM - 8PM
                    </button>
                  </div>
                </div>

                {/* Time Picker Inputs & Requested Hours */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
                  {/* Start Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Start Time <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => {
                        setIsCustomHoursOverride(false);
                        setFormData(prev => ({ ...prev, startTime: e.target.value }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-[#181818] border ${
                        errors.startTime ? 'border-red-500' : 'border-[#2c2c2c]'
                      } text-white focus:outline-none focus:border-[#facc15] transition-colors`}
                    />
                    <span className="text-xs text-gray-500 mt-1 block">
                      Selected: {formatTimeTo12Hour(formData.startTime)}
                    </span>
                    {errors.startTime && (
                      <p className="text-red-500 text-xs mt-1">{errors.startTime}</p>
                    )}
                  </div>

                  {/* End Time */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      End Time <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => {
                        setIsCustomHoursOverride(false);
                        setFormData(prev => ({ ...prev, endTime: e.target.value }));
                      }}
                      className={`w-full px-4 py-3 rounded-xl bg-[#181818] border ${
                        errors.endTime ? 'border-red-500' : 'border-[#2c2c2c]'
                      } text-white focus:outline-none focus:border-[#facc15] transition-colors`}
                    />
                    <span className="text-xs text-gray-500 mt-1 block">
                      Selected: {formatTimeTo12Hour(formData.endTime)}
                    </span>
                    {errors.endTime && (
                      <p className="text-red-500 text-xs mt-1">{errors.endTime}</p>
                    )}
                  </div>

                  {/* Total Requested Hours */}
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 flex items-center justify-between">
                      <span>Total OT Hours</span>
                      {isCustomHoursOverride && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsCustomHoursOverride(false);
                            const h = calculateHours(formData.startTime, formData.endTime);
                            setFormData(prev => ({ ...prev, requestedHours: h }));
                          }}
                          className="text-[10px] text-yellow-400 hover:underline flex items-center gap-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Reset Auto
                        </button>
                      )}
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      value={formData.requestedHours ?? ''}
                      onChange={(e) => {
                        setIsCustomHoursOverride(true);
                        setFormData(prev => ({
                          ...prev,
                          requestedHours: parseFloat(e.target.value) || undefined
                        }));
                      }}
                      className="w-full px-4 py-3 rounded-xl bg-[#181818] border border-[#2c2c2c] text-white focus:outline-none focus:border-[#facc15] transition-colors"
                      placeholder="e.g. 2.0"
                    />
                    <span className="text-xs text-gray-500 mt-1 block">
                      {isCustomHoursOverride ? 'Custom hours override active' : 'Auto-computed from time range'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SECTION 3: Reason & Justification */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-[#262626] pb-3">
                <div className="flex items-center gap-2">
                  <Info className="w-5 h-5 text-[#facc15]" />
                  <h2 className="text-lg font-semibold text-white">3. Reason & Justification</h2>
                </div>
                <span className="text-xs text-gray-500">Min 10 characters</span>
              </div>

              <div>
                <textarea
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                  className={`w-full px-4 py-3 rounded-xl bg-[#141414] border ${
                    errors.reason ? 'border-red-500' : 'border-[#262626]'
                  } text-white focus:outline-none focus:border-[#facc15] resize-none transition-colors`}
                  rows={3}
                  placeholder="Please provide a clear and detailed reason for the overtime request..."
                />
                <div className="flex justify-between items-center mt-1">
                  {errors.reason ? (
                    <p className="text-red-500 text-xs">{errors.reason}</p>
                  ) : (
                    <span className="text-xs text-gray-500">Provide details for payroll auditor approval</span>
                  )}
                  <span className={`text-xs ${formData.reason.length < 10 ? 'text-gray-500' : 'text-green-400'}`}>
                    {formData.reason.length} / 10 min chars
                  </span>
                </div>
              </div>

              {/* Warning Policy Note */}
              <div className="flex items-start gap-3 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl">
                <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-yellow-400/90 leading-relaxed">
                  Submitted overtime requests will be forwarded to store management and admin reviewers. Requests marked as absent on the date will be rejected automatically during processing.
                </p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex gap-4 pt-4 border-t border-[#262626]">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    employeeId: undefined,
                    employeeName: '',
                    requestDate: new Date().toISOString().split('T')[0],
                    startTime: '17:00',
                    endTime: '19:00',
                    requestedHours: 2,
                    reason: ''
                  });
                  setEmployeeSearchQuery('');
                  setIsCustomHoursOverride(false);
                  setErrors({});
                  setSubmitSuccess(null);
                  setSubmitError(null);
                }}
                className="flex-1 px-5 py-3 rounded-xl bg-[#141414] border border-[#262626] text-gray-300 font-medium hover:text-white hover:border-gray-600 transition-colors"
              >
                Clear Form
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-5 py-3 rounded-xl bg-[#facc15] text-black font-semibold hover:bg-[#facc15]/90 transition-all shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <>Submitting Request...</>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    Submit Overtime Request
                  </>
                )}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'cash-advance' && (
          <div className="text-center py-12 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
              <DollarSign className="w-8 h-8 text-[#facc15]" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${classes.text}`}>Cash Advance Requests</h2>
              <p className={`${classes.textMuted} text-sm mt-1`}>
                Cash Advance request workflow is undergoing module integration and will be available in the upcoming update.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-xs text-gray-400">
              <Info className="w-4 h-4 text-yellow-500" />
              <span>Current cash advance deductions can still be recorded directly in Payroll processing.</span>
            </div>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="text-center py-12 space-y-4 max-w-md mx-auto">
            <div className="w-16 h-16 bg-yellow-500/10 rounded-full flex items-center justify-center mx-auto">
              <Calendar className="w-8 h-8 text-[#facc15]" />
            </div>
            <div>
              <h2 className={`text-xl font-semibold ${classes.text}`}>Leave Requests</h2>
              <p className={`${classes.textMuted} text-sm mt-1`}>
                Leave management & request module integration is scheduled for the upcoming release.
              </p>
            </div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#141414] border border-[#262626] text-xs text-gray-400">
              <Info className="w-4 h-4 text-yellow-500" />
              <span>Leave statuses can currently be marked under Attendance Audit & Records.</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
