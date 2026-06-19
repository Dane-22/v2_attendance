'use client';

import { useState, useEffect } from 'react';
import { Send, Clock, DollarSign, Calendar, User, AlertCircle } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/hooks/useTheme';
import { overtimeRequestApi } from '@/lib/api';
import type { CreateOvertimeRequestInput } from '@/lib/api';

type TabType = 'overtime' | 'cash-advance' | 'leave';

export default function SubmitRequestPage() {
  const { classes } = useTheme();
  const { user } = useAppStore();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('overtime');

  // Overtime form state
  const [formData, setFormData] = useState<CreateOvertimeRequestInput>({
    employeeName: '',
    requestDate: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    requestedHours: undefined,
    reason: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const tabs = [
    { id: 'overtime' as TabType, name: 'Request Overtime', icon: Clock },
    { id: 'cash-advance' as TabType, name: 'Request Cash Advance', icon: DollarSign },
    { id: 'leave' as TabType, name: 'Request Leave', icon: Calendar },
  ];

  // Auto-calculate hours when start/end time changes
  useEffect(() => {
    if (formData.startTime && formData.endTime) {
      const hours = calculateHours(formData.startTime, formData.endTime);
      if (hours > 0) {
        setFormData(prev => ({
          ...prev,
          requestedHours: hours
        }));
      }
    }
  }, [formData.startTime, formData.endTime]);

  const calculateHours = (start: string, end: string): number => {
    const startMins = timeToMinutes(start);
    const endMins = timeToMinutes(end);
    return (endMins - startMins) / 60;
  };

  const timeToMinutes = (timeStr: string): number => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.employeeName || formData.employeeName.trim().length < 2) {
      newErrors.employeeName = 'Employee name is required (at least 2 characters)';
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
      if (response.success) {
        alert('Overtime request submitted successfully');
        setFormData({
          employeeName: '',
          requestDate: new Date().toISOString().split('T')[0],
          startTime: '',
          endTime: '',
          requestedHours: undefined,
          reason: ''
        });
        setErrors({});
        await queryClient.invalidateQueries({ queryKey: ['my-overtime-requests'] });
      } else {
        alert(response.message || 'Failed to submit overtime request');
      }
    },
    onError: (error: any) => {
      console.error('Overtime request error:', error);
      alert(error.response?.data?.message || 'Failed to submit overtime request');
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await overtimeRequestMutation.mutateAsync(formData);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-3xl font-bold ${classes.text} flex items-center gap-3`}>
          <Send className="w-8 h-8 text-[#facc15]" />
          Submit Request
        </h1>
        <p className={`${classes.textMuted} mt-2`}>
          Submit overtime, cash advance, and leave requests
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
                    ? 'bg-[#facc15] text-black shadow-lg shadow-yellow-500/30'
                    : classes.hover
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="whitespace-nowrap">{tab.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className={`rounded-xl border ${classes.bgCard} ${classes.border} p-6`}>
        {activeTab === 'overtime' && (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Employee Name - Fillable input */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Employee Name:
              </label>
              <input
                type="text"
                value={formData.employeeName}
                onChange={(e) => setFormData(prev => ({ ...prev, employeeName: e.target.value }))}
                placeholder="Enter employee full name (e.g., John Doe)"
                autoComplete="off"
                className={`w-full px-3 py-2 rounded-lg bg-[#141414] border ${errors.employeeName ? 'border-red-500' : 'border-[#262626]'} text-white focus:outline-none focus:border-[#facc15]`}
              />
              {errors.employeeName && (
                <p className="text-red-500 text-sm mt-1">{errors.employeeName}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter the employee's full name (First Last)
              </p>
            </div>

            {/* Request Date */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-2" />
                Request Date
              </label>
              <input
                type="date"
                value={formData.requestDate}
                onChange={(e) => setFormData(prev => ({ ...prev, requestDate: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg bg-[#141414] border ${errors.requestDate ? 'border-red-500' : 'border-[#262626]'} text-white focus:outline-none focus:border-[#facc15]`}
                max={new Date().toISOString().split('T')[0]}
              />
              {errors.requestDate && (
                <p className="text-red-500 text-sm mt-1">{errors.requestDate}</p>
              )}
            </div>

            {/* Time Inputs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Start Time
                </label>
                <input
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg bg-[#141414] border ${errors.startTime ? 'border-red-500' : 'border-[#262626]'} text-white focus:outline-none focus:border-[#facc15]`}
                />
                {errors.startTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.startTime}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  End Time
                </label>
                <input
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                  className={`w-full px-3 py-2 rounded-lg bg-[#141414] border ${errors.endTime ? 'border-red-500' : 'border-[#262626]'} text-white focus:outline-none focus:border-[#facc15]`}
                />
                {errors.endTime && (
                  <p className="text-red-500 text-sm mt-1">{errors.endTime}</p>
                )}
              </div>
            </div>

            {/* Requested Hours */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Requested Hours
              </label>
              <input
                type="number"
                step="0.5"
                min="0.5"
                value={formData.requestedHours || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, requestedHours: parseFloat(e.target.value) || undefined }))}
                className="w-full px-3 py-2 rounded-lg bg-[#141414] border border-[#262626] text-white focus:outline-none focus:border-[#facc15]"
                placeholder="Auto-calculated from time range"
              />
              <p className="text-xs text-gray-500 mt-1">
                Auto-calculated from start/end time, but you can override if needed
              </p>
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Reason for Overtime
              </label>
              <textarea
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                className={`w-full px-3 py-2 rounded-lg bg-[#141414] border ${errors.reason ? 'border-red-500' : 'border-[#262626]'} text-white focus:outline-none focus:border-[#facc15] resize-none`}
                rows={3}
                placeholder="Please provide a detailed reason for the overtime request..."
              />
              {errors.reason && (
                <p className="text-red-500 text-sm mt-1">{errors.reason}</p>
              )}
            </div>

            {/* Warning Note */}
            <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-yellow-400">
                Overtime requests require attendance record for the selected date. 
                Requests for employees with absent attendance will be rejected.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={() => {
                  setFormData({
                    employeeName: '',
                    requestDate: new Date().toISOString().split('T')[0],
                    startTime: '',
                    endTime: '',
                    requestedHours: undefined,
                    reason: ''
                  });
                  setErrors({});
                }}
                className="flex-1 px-4 py-2 rounded-lg bg-[#141414] border border-[#262626] text-gray-300 hover:text-white transition-colors"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 rounded-lg bg-[#facc15] text-black font-medium hover:bg-[#facc15]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'cash-advance' && (
          <div className="text-center py-12">
            <DollarSign className="w-16 h-16 text-[#facc15] mx-auto mb-4" />
            <h2 className={`text-xl font-semibold ${classes.text} mb-2`}>Cash Advance Request</h2>
            <p className={`${classes.textMuted}`}>Submit cash advance requests</p>
          </div>
        )}

        {activeTab === 'leave' && (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-[#facc15] mx-auto mb-4" />
            <h2 className={`text-xl font-semibold ${classes.text} mb-2`}>Leave Request</h2>
            <p className={`${classes.textMuted}`}>Submit leave requests</p>
          </div>
        )}
      </div>
    </div>
  );
}
