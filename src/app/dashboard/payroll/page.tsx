'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { payrollApi, PayrollRecord } from '@/lib/api';
import { useState } from 'react';

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [employeeId, setEmployeeId] = useState('');
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [calcForm, setCalcForm] = useState({
    employeeId: '',
    weekStart: '',
    weekEnd: '',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['payroll', { page, employeeId }],
    queryFn: () =>
      payrollApi.getAll({
        page,
        limit: 10,
        employeeId: employeeId ? parseInt(employeeId) : undefined,
      }),
  });

  const calculateMutation = useMutation({
    mutationFn: payrollApi.calculate,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
      setShowCalculateModal(false);
      setCalcForm({ employeeId: '', weekStart: '', weekEnd: '' });
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: number) => payrollApi.process(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll'] });
    },
  });

  const payroll = data?.data.data || [];
  const meta = data?.data.meta;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'processed':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCalculate = (e: React.FormEvent) => {
    e.preventDefault();
    calculateMutation.mutate({
      employeeId: parseInt(calcForm.employeeId),
      weekStart: calcForm.weekStart,
      weekEnd: calcForm.weekEnd,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Payroll Records</h1>
        <button
          onClick={() => setShowCalculateModal(true)}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 3.75v-1.5a2.25 2.25 0 00-2.25-2.25h-3a2.25 2.25 0 00-2.25 2.25v1.5m9 0v1.5a2.25 2.25 0 01-2.25 2.25h-3a2.25 2.25 0 01-2.25-2.25v-1.5m9 0H9" />
          </svg>
          Calculate Payroll
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow flex gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
          <input
            type="text"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            placeholder="Enter employee ID"
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex items-end">
          <button
            onClick={() => setEmployeeId('')}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
          >
            Clear Filter
          </button>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Week</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Employee ID</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Worked</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Basic Pay</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">OT Amount</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gross Pay</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Deductions</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Net Pay</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-500">Loading...</td>
              </tr>
            ) : payroll.length === 0 ? (
              <tr>
                <td colSpan={10} className="px-6 py-4 text-center text-gray-500">No payroll records found</td>
              </tr>
            ) : (
              payroll.map((record: PayrollRecord) => (
                <tr key={record.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(record.payroll_week_start).toLocaleDateString()} - {new Date(record.payroll_week_end).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.employeeId}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">{record.days_worked}</td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{record.basic_pay?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                    ₱{record.overtime_amount?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₱{record.grossPay?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-red-600">
                    -₱{record.total_deductions?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                    ₱{record.netPay?.toLocaleString()}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(record.status)}`}>
                      {record.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {record.status === 'draft' && (
                      <button
                        onClick={() => processMutation.mutate(record.id)}
                        disabled={processMutation.isPending}
                        className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                      >
                        Process
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        {meta && meta.totalPages > 1 && (
          <div className="px-6 py-4 flex items-center justify-between border-t border-gray-200">
            <button
              onClick={() => setPage((p: number) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-700">
              Page {page} of {meta.totalPages}
            </span>
            <button
              onClick={() => setPage((p: number) => Math.min(meta.totalPages, p + 1))}
              disabled={page === meta.totalPages}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Calculate Modal */}
      {showCalculateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Calculate Payroll</h2>
            <form onSubmit={handleCalculate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID</label>
                <input
                  type="text"
                  value={calcForm.employeeId}
                  onChange={(e) => setCalcForm({ ...calcForm, employeeId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week Start</label>
                <input
                  type="date"
                  value={calcForm.weekStart}
                  onChange={(e) => setCalcForm({ ...calcForm, weekStart: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Week End</label>
                <input
                  type="date"
                  value={calcForm.weekEnd}
                  onChange={(e) => setCalcForm({ ...calcForm, weekEnd: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCalculateModal(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={calculateMutation.isPending}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {calculateMutation.isPending ? 'Calculating...' : 'Calculate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
