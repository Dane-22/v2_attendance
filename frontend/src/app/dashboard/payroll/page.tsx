'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  payrollApi,
  branchesApi,
  PayrollDailyBreakdown,
  PayrollIssue,
  PayrollRecord,
  WeeklyPayrollBatchResponse,
} from '@/lib/api';

const currencyFormatter = new Intl.NumberFormat('en-PH', {
  style: 'currency',
  currency: 'PHP',
  minimumFractionDigits: 2,
});

const minutesToHoursLabel = (minutes: number) => `${(minutes / 60).toFixed(2)}h`;

const formatCurrency = (value: number | null | undefined) => currencyFormatter.format(value ?? 0);

const getDefaultWeekRange = () => {
  const today = new Date();
  const day = today.getDay();
  const diffToMonday = day === 0 ? -6 : 1 - day;
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return {
    weekStart: monday.toISOString().split('T')[0],
    weekEnd: sunday.toISOString().split('T')[0],
  };
};

const getReviewBadge = (record: PayrollRecord) => {
  switch (record.reviewStatus) {
    case 'processed':
      return 'bg-emerald-100 text-emerald-800';
    case 'needs_review':
      return 'bg-amber-100 text-amber-800';
    default:
      return 'bg-slate-100 text-slate-700';
  }
};

const issueTone = (issue: PayrollIssue) =>
  issue.severity === 'error'
    ? 'border-red-200 bg-red-50 text-red-700'
    : 'border-amber-200 bg-amber-50 text-amber-700';

const employeeName = (record: PayrollRecord) => {
  const employee = record.employee;
  if (!employee) return `Employee #${record.employeeId}`;
  return [employee.firstName, employee.middleName, employee.lastName].filter(Boolean).join(' ');
};

const employeeDisplayCode = (record: PayrollRecord) =>
  record.employee?.employeeCode || `ID ${record.employeeId}`;

const sanitizeFileName = (value: string) => value.replace(/[^a-z0-9-_]+/gi, '-').replace(/-+/g, '-').toLowerCase();

const formatWeekLabel = (record: PayrollRecord) =>
  `${new Date(record.payroll_week_start).toLocaleDateString()} - ${new Date(record.payroll_week_end).toLocaleDateString()}`;

const dateFileLabel = (value: Date | string) => new Date(value).toISOString().split('T')[0];

const downloadPayslip = async (record: PayrollRecord) => {
  const canvas = document.createElement('canvas');
  canvas.width = 1400;
  canvas.height = 940;
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error('Canvas rendering is not supported in this browser.');
  }

  const employee = employeeName(record);
  const employeeCode = employeeDisplayCode(record);
  const weekLabel = formatWeekLabel(record);
  const generatedAt = new Date().toLocaleString();

  context.fillStyle = '#0f172a';
  context.fillRect(0, 0, canvas.width, canvas.height);

  const headerGradient = context.createLinearGradient(0, 0, canvas.width, 0);
  headerGradient.addColorStop(0, '#1d4ed8');
  headerGradient.addColorStop(1, '#0f766e');
  context.fillStyle = headerGradient;
  context.fillRect(0, 0, canvas.width, 180);

  context.fillStyle = '#ffffff';
  context.font = '700 44px Arial';
  context.fillText('JAJR Construction Payroll Payslip', 72, 78);
  context.font = '24px Arial';
  context.fillStyle = 'rgba(255,255,255,0.85)';
  context.fillText(`Payroll week: ${weekLabel}`, 72, 122);
  context.fillText(`Generated: ${generatedAt}`, 72, 154);

  context.fillStyle = '#ffffff';
  roundRect(context, 48, 214, 1304, 660, 28, '#ffffff');

  context.fillStyle = '#0f172a';
  context.font = '700 34px Arial';
  context.fillText(employee, 88, 284);
  context.font = '22px Arial';
  context.fillStyle = '#475569';
  context.fillText(`${employeeCode}${record.employee?.position ? ` • ${record.employee.position}` : ''}`, 88, 320);
  context.fillText(`${record.employee?.branchName || 'No branch assigned'}${record.employee?.department ? ` • ${record.employee.department}` : ''}`, 88, 352);

  drawChip(context, 1010, 252, record.reviewStatus === 'needs_review' ? 'NEEDS REVIEW' : (record.reviewStatus || 'DRAFT').toUpperCase());

  const leftX = 88;
  const rightX = 718;
  const sectionTop = 404;

  context.fillStyle = '#0f172a';
  context.font = '700 26px Arial';
  context.fillText('Earnings', leftX, sectionTop);
  context.fillText('Deductions', rightX, sectionTop);

  drawRule(context, leftX, sectionTop + 20, 520);
  drawRule(context, rightX, sectionTop + 20, 520);

  const earnings = [
    ['Payable days', `${Number(record.payableDays ?? 0).toFixed(2)} day(s)`],
    ['Daily rate', formatCurrency(record.daily_rate)],
    ['Basic pay', formatCurrency(record.basic_pay)],
    ['Overtime hours', `${Number(record.overtime_hours ?? 0).toFixed(2)}h approved / ${Number(record.overtimeHoursCandidate ?? 0).toFixed(2)}h detected`],
    ['Overtime amount', formatCurrency(record.overtime_amount)],
    ['Performance allowance', formatCurrency(record.performance_allowance)],
    ['Gross pay', formatCurrency(record.grossPay)],
  ];

  const deductions = [
    ['SSS', formatCurrency(record.sss_contribution)],
    ['PhilHealth', formatCurrency(record.phic_contribution)],
    ['Pag-IBIG', formatCurrency(record.hdmf_contribution)],
    ['Cash advance', formatCurrency(record.cash_advance)],
    ['Total deductions', formatCurrency(record.total_deductions)],
    ['Take home pay', formatCurrency(record.netPay)],
  ];

  drawRows(context, leftX, sectionTop + 56, 520, earnings, 6);
  drawRows(context, rightX, sectionTop + 56, 520, deductions, 4);

  context.fillStyle = '#64748b';
  context.font = '18px Arial';
  context.fillText('This payslip was generated from the payroll dashboard.', 96, 840);

  const fileName = sanitizeFileName(`payslip-${employee}-${dateFileLabel(record.payroll_week_start)}.png`);
  const dataUrl = canvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = fileName;
  link.click();
};

function roundRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fill: string,
) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fillStyle = fill;
  context.fill();
}

function drawRule(context: CanvasRenderingContext2D, x: number, y: number, width: number) {
  context.strokeStyle = '#cbd5e1';
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(x, y);
  context.lineTo(x + width, y);
  context.stroke();
}

function drawChip(context: CanvasRenderingContext2D, x: number, y: number, label: string) {
  roundRect(context, x, y, 260, 52, 20, '#dbeafe');
  context.fillStyle = '#1d4ed8';
  context.font = '700 20px Arial';
  context.fillText(label, x + 28, y + 33);
}

function drawRows(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  rows: string[][],
  highlightFrom: number,
) {
  let rowY = y;
  rows.forEach(([label, value], index) => {
    const strong = index >= highlightFrom;
    context.fillStyle = strong ? '#0f172a' : '#475569';
    context.font = strong ? '700 22px Arial' : '20px Arial';
    context.fillText(label, x, rowY);
    context.textAlign = 'right';
    context.fillText(value, x + width, rowY);
    context.textAlign = 'left';
    rowY += 52;
  });
}


const statusFilterOptions = [
  { value: 'all', label: 'All records' },
  { value: 'draft', label: 'Draft' },
  { value: 'needs_review', label: 'Needs review' },
  { value: 'processed', label: 'Processed' },
];

export default function PayrollPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [selectedPayrollId, setSelectedPayrollId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'needs_review' | 'processed'>('all');
  const [week, setWeek] = useState(getDefaultWeekRange);
  const [lastBatchResult, setLastBatchResult] = useState<WeeklyPayrollBatchResponse | null>(null);
  const [payslipError, setPayslipError] = useState<string | null>(null);
  const [isGeneratingPayslip, setIsGeneratingPayslip] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');

  const payrollQuery = useQuery({
    queryKey: ['payroll', { page, statusFilter, week, searchQuery, branchFilter }],
    queryFn: async () => {
      const response = await payrollApi.getAll({
        page,
        limit: 10,
        weekStart: week.weekStart,
        weekEnd: week.weekEnd,
        status: statusFilter === 'draft' || statusFilter === 'processed' ? statusFilter : undefined,
        search: searchQuery || undefined,
        branch: branchFilter === 'all' ? undefined : branchFilter,
      });

      const records = response.data.data ?? [];
      const filteredRecords =
        statusFilter === 'needs_review'
          ? records.filter((record) => record.reviewStatus === 'needs_review')
          : records;

      const filteredTotal =
        statusFilter === 'needs_review'
          ? filteredRecords.length
          : response.data.meta?.total ?? filteredRecords.length;

      const filteredTotalPages =
        statusFilter === 'needs_review'
          ? Math.max(1, Math.ceil(filteredRecords.length / 10))
          : response.data.meta?.totalPages ?? 1;

      return {
        ...response,
        data: {
          ...response.data,
          data: filteredRecords,
          meta: {
            page,
            limit: 10,
            total: filteredTotal,
            totalPages: filteredTotalPages,
          },
        },
      };
    },
  });

  const branchesQuery = useQuery({
  queryKey: ['branches'],
  queryFn: async () => {
    const response = await branchesApi.getAll();
    return response.data.data || [];
  },
});

  const records = payrollQuery.data?.data.data ?? [];
  const meta = payrollQuery.data?.data.meta;
  const branches = branchesQuery.data || [];

  const selectedRecordPreview = records.find((record) => record.id === selectedPayrollId) ?? null;

  const payrollDetailQuery = useQuery({
    queryKey: ['payroll-detail', selectedPayrollId],
    queryFn: async () => {
      const response = await payrollApi.getById(selectedPayrollId as number);
      return response.data.data;
    },
    enabled: selectedPayrollId != null,
  });

  const selectedRecord = payrollDetailQuery.data ?? selectedRecordPreview;

  const weeklySummary = useMemo(() => {
    return records.reduce(
      (acc, record) => {
        acc.netPay += Number(record.netPay ?? 0);
        acc.grossPay += Number(record.grossPay ?? 0);
        acc.payableDays += Number(record.payableDays ?? 0);
        if (record.reviewStatus === 'needs_review') acc.needsReview += 1;
        if (record.reviewStatus === 'processed') acc.processed += 1;
        if (record.reviewStatus === 'draft') acc.draft += 1;
        return acc;
      },
      { netPay: 0, grossPay: 0, payableDays: 0, needsReview: 0, processed: 0, draft: 0 },
    );
  }, [records]);

  const refreshPayrollQueries = async () => {
    await queryClient.invalidateQueries({ queryKey: ['payroll'] });
    await queryClient.invalidateQueries({ queryKey: ['payroll-detail'] });
  };

  const batchMutation = useMutation({
    mutationFn: () => payrollApi.calculateWeekly(week),
    onSuccess: async (response) => {
      setLastBatchResult(response.data.data ?? null);
      await refreshPayrollQueries();
    },
  });

  const approveOvertimeMutation = useMutation({
    mutationFn: (id: number) => payrollApi.approveOvertime(id),
    onSuccess: async () => {
      await refreshPayrollQueries();
    },
  });

  const processMutation = useMutation({
    mutationFn: (id: number) => payrollApi.process(id),
    onSuccess: async () => {
      await refreshPayrollQueries();
    },
  });

  const canProcessRecord = (record: PayrollRecord) =>
    record.status === 'draft' && !record.issues?.some((issue) => issue.severity === 'error');

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-blue-950 p-6 text-white shadow-xl">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <p className="text-sm uppercase tracking-[0.3em] text-blue-200">Payroll Operations</p>
            <h1 className="text-3xl font-semibold">Weekly payroll runs with review-first controls.</h1>
            <p className="text-sm text-slate-300">
              Generate weekly payroll for all active employees, inspect flagged drafts, approve overtime separately,
              and lock clean records only when they are ready.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
              <label className="text-sm">
                <span className="mb-1 block text-slate-300">Search employee</span>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    placeholder="Name or code..."
                    value={searchQuery}
                    onChange={(event) => {
                      setPage(1);
                      setSearchQuery(event.target.value);
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 pl-9 pr-3 py-2 text-white outline-none placeholder:text-slate-400 transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-300">Branch</span>
                <div className="relative">
                  <select
                    value={branchFilter}
                    onChange={(event) => {
                      setPage(1);
                      setBranchFilter(event.target.value);
                    }}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2 pr-8 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    <option value="all">All branches</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.name}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-300">Week start</span>
                <div className="relative">
                  <input
                    type="date"
                    value={week.weekStart}
                    onChange={(event) => {
                      setPage(1);
                      setWeek((current) => ({ ...current, weekStart: event.target.value }));
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-300">Week end</span>
                <div className="relative">
                  <input
                    type="date"
                    value={week.weekEnd}
                    onChange={(event) => {
                      setPage(1);
                      setWeek((current) => ({ ...current, weekEnd: event.target.value }));
                    }}
                    className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  />
                </div>
              </label>
              <label className="text-sm">
                <span className="mb-1 block text-slate-300">Record state</span>
                <div className="relative">
                  <select
                    value={statusFilter}
                    onChange={(event) => {
                      setPage(1);
                      setStatusFilter(event.target.value as typeof statusFilter);
                    }}
                    className="w-full appearance-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2 pr-8 text-white outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-400/20"
                  >
                    {statusFilterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </label>
              <div className="text-sm">
                <span className="mb-1 block text-slate-300">&nbsp;</span>
                <button
                  onClick={() => batchMutation.mutate()}
                  disabled={batchMutation.isPending}
                  className="w-full rounded-2xl bg-gradient-to-r from-blue-500 to-blue-600 px-4 py-2 text-sm font-medium text-white shadow-lg transition-all hover:from-blue-400 hover:to-blue-500 hover:shadow-xl disabled:cursor-not-allowed disabled:opacity-60 disabled:from-slate-500 disabled:to-slate-600"
                >
                  {batchMutation.isPending ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      Generate
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {lastBatchResult && (
        <section className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-950 shadow-sm">
          <p className="font-semibold">Latest payroll run</p>
          <p className="mt-1">
            Week {lastBatchResult.weekStart} to {lastBatchResult.weekEnd}: {lastBatchResult.totals.employees} employees,
            {` ${lastBatchResult.totals.created}`} created, {` ${lastBatchResult.totals.updated}`} updated,
            {` ${lastBatchResult.totals.skippedProcessed}`} locked processed record(s) left untouched.
          </p>
        </section>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard label="Gross payroll" value={formatCurrency(weeklySummary.grossPay)} tone="slate" />
        <SummaryCard label="Net payroll" value={formatCurrency(weeklySummary.netPay)} tone="blue" />
        <SummaryCard label="Payable days" value={weeklySummary.payableDays.toFixed(2)} tone="emerald" />
        <SummaryCard
          label="Review queue"
          value={`${weeklySummary.needsReview} flagged`}
          detail={`${weeklySummary.draft} draft / ${weeklySummary.processed} processed`}
          tone="amber"
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.9fr)]">
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">Payroll records</h2>
              <p className="text-sm text-slate-500">Compact list for the selected week. Open a record to review details.</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {['Employee', 'Week', 'Days Worked', 'Daily Rate', 'Basic Pay', 'OT Hrs', 'OT Amt', 'Gross + Allowance', 'Deductions', 'Take Home Pay', 'Actions'].map((heading) => (
                    <th
                      key={heading}
                      className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500"
                    >
                      {heading}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {payrollQuery.isLoading && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                      Loading payroll records...
                    </td>
                  </tr>
                )}

                {!payrollQuery.isLoading && records.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-6 py-8 text-center text-sm text-slate-500">
                      No payroll records found for this view yet. Generate the selected week to populate drafts.
                    </td>
                  </tr>
                )}

                {records.map((record) => (
                  <tr
                    key={record.id}
                    className={`transition hover:bg-slate-50 ${selectedPayrollId === record.id ? 'bg-blue-50/70' : ''}`}
                  >
                    <td className="px-4 py-4 text-sm text-slate-700">
                      <div className="min-w-[180px]">
                        <p className="font-semibold text-slate-900">{employeeName(record)}</p>
                        <p className="text-xs text-slate-500">
                          {employeeDisplayCode(record)}
                          {record.employee?.branchName ? ` • ${record.employee.branchName}` : ''}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">
                      {new Date(record.payroll_week_start).toLocaleDateString()} -{' '}
                      {new Date(record.payroll_week_end).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[110px]">
                        <p className="font-semibold text-slate-900">{Number(record.payableDays ?? 0).toFixed(2)} days</p>
                        <p className="text-xs text-slate-500">{record.days_worked ?? 0} attendance row(s)</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-700">{formatCurrency(record.daily_rate)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">{formatCurrency(record.basic_pay)}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{Number(record.overtimeHoursCandidate ?? 0).toFixed(2)}</td>
                    <td className="px-4 py-4 text-sm text-slate-700">{formatCurrency(record.overtime_amount)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-900">
                      <div className="min-w-[120px]">
                        <p>{formatCurrency(record.grossPay)}</p>
                        <p className="text-xs text-slate-500">Allowance {formatCurrency(record.performance_allowance)}</p>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm text-rose-600">
                      <div className="min-w-[150px]">
                        <p className="font-medium">{formatCurrency(record.total_deductions)}</p>
                        <p className="text-xs text-slate-500">
                          SSS {formatCurrency(record.sss_contribution)} • PHIC {formatCurrency(record.phic_contribution)}
                        </p>
                        <p className="text-xs text-slate-500">
                          HDMF {formatCurrency(record.hdmf_contribution)} • CA {formatCurrency(record.cash_advance)}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="min-w-[120px]">
                        <p className="font-semibold text-emerald-600">{formatCurrency(record.netPay)}</p>
                        <span className={`mt-1 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getReviewBadge(record)}`}>
                          {record.reviewStatus === 'needs_review' ? 'Needs review' : record.reviewStatus}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap items-center gap-3 text-sm">
                        <button
                          onClick={() => setSelectedPayrollId(record.id)}
                          className="font-medium text-blue-700 transition hover:text-blue-900"
                        >
                          View
                        </button>
                        {record.status === 'draft' && record.overtimeHoursCandidate && record.overtimeHoursCandidate > 0 && (
                          <button
                            onClick={() => approveOvertimeMutation.mutate(record.id)}
                            disabled={approveOvertimeMutation.isPending}
                            className="font-medium text-violet-700 transition hover:text-violet-900 disabled:opacity-50"
                          >
                            Approve OT
                          </button>
                        )}
                        {record.status === 'draft' && (
                          <button
                            onClick={() => processMutation.mutate(record.id)}
                            disabled={!canProcessRecord(record) || processMutation.isPending}
                            className="font-medium text-emerald-700 transition hover:text-emerald-900 disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            Process
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {meta && meta.totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-5 py-4 text-sm text-slate-600">
              <button
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-300 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Previous
              </button>
              <span>
                Page {page} of {meta.totalPages}
              </span>
              <button
                onClick={() => setPage((current) => Math.min(meta.totalPages, current + 1))}
                disabled={page === meta.totalPages}
                className="rounded-lg border border-slate-300 px-3 py-1.5 transition hover:bg-slate-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </section>

        <aside className="rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-slate-900">Payroll detail</h2>
            <p className="text-sm text-slate-500">Employee identity, day fractions, issues, and overtime review live here.</p>
          </div>

          {!selectedRecord && (
            <div className="p-6 text-sm text-slate-500">
              Select a payroll record to inspect the employee, attendance breakdown, and review notes.
            </div>
          )}

          {selectedRecord && (
            <div className="space-y-5 p-5">
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Employee</p>
                <h3 className="text-xl font-semibold text-slate-900">{employeeName(selectedRecord)}</h3>
                <p className="text-sm text-slate-500">
                  {selectedRecord.employee?.employeeCode || `ID ${selectedRecord.employeeId}`}
                  {selectedRecord.employee?.branchName ? ` • ${selectedRecord.employee.branchName}` : ''}
                  {selectedRecord.employee?.position ? ` • ${selectedRecord.employee.position}` : ''}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <DetailStat label="Payable days" value={Number(selectedRecord.payableDays ?? 0).toFixed(2)} />
                <DetailStat label="Payable time" value={minutesToHoursLabel(selectedRecord.payableMinutes ?? 0)} />
                <DetailStat label="OT candidate" value={`${Number(selectedRecord.overtimeHoursCandidate ?? 0).toFixed(2)}h`} />
                <DetailStat label="Approved OT" value={`${Number(selectedRecord.overtime_hours ?? 0).toFixed(2)}h`} />
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-900">Payroll breakdown</p>
                <div className="mt-3 grid gap-2 text-sm text-slate-700">
                  <BreakdownRow label="Basic pay" value={formatCurrency(selectedRecord.basic_pay)} />
                  <BreakdownRow label="Overtime pay" value={formatCurrency(selectedRecord.overtime_amount)} />
                  <BreakdownRow label="Performance allowance" value={formatCurrency(selectedRecord.performance_allowance)} />
                  <BreakdownRow label="Gross pay" value={formatCurrency(selectedRecord.grossPay)} strong />
                  <BreakdownRow label="Total deductions" value={formatCurrency(selectedRecord.total_deductions)} />
                  <BreakdownRow label="Net pay" value={formatCurrency(selectedRecord.netPay)} strong />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Review issues</p>
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${getReviewBadge(selectedRecord)}`}>
                    {selectedRecord.reviewStatus === 'needs_review' ? 'Needs review' : selectedRecord.reviewStatus}
                  </span>
                </div>

                {selectedRecord.issues && selectedRecord.issues.length > 0 ? (
                  <div className="space-y-2">
                    {selectedRecord.issues.map((issue, index) => (
                      <div key={`${issue.code}-${index}`} className={`rounded-2xl border px-3 py-2 text-sm ${issueTone(issue)}`}>
                        {issue.message}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                    No review blockers for this payroll record.
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-slate-900">Daily attendance breakdown</p>
                  {payrollDetailQuery.isLoading && <span className="text-xs text-slate-400">Refreshing...</span>}
                </div>

                <div className="space-y-2">
                  {(selectedRecord.dailyBreakdown ?? []).map((day: PayrollDailyBreakdown) => (
                    <div key={day.date} className="rounded-2xl border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">{day.date}</p>
                          <p className="text-xs text-slate-500">
                            {day.checkIn || '--'} to {day.checkOut || '--'} • Payable {minutesToHoursLabel(day.payableMinutes)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-slate-900">{day.dayFraction.toFixed(2)} day</p>
                          <p className="text-xs text-slate-500">OT candidate {minutesToHoursLabel(day.overtimeMinutesCandidate)}</p>
                        </div>
                      </div>

                      {day.issues.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {day.issues.map((issue, index) => (
                            <span key={`${issue.code}-${index}`} className={`rounded-full border px-2 py-1 text-xs ${issueTone(issue)}`}>
                              {issue.message}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {!selectedRecord.dailyBreakdown?.length && (
                    <div className="rounded-2xl border border-dashed border-slate-200 px-3 py-4 text-sm text-slate-500">
                      No daily attendance rows available for this week.
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <button
                  onClick={async () => {
                    try {
                      setPayslipError(null);
                      setIsGeneratingPayslip(true);
                      await downloadPayslip(selectedRecord);
                    } catch (error) {
                      setPayslipError(error instanceof Error ? error.message : 'Failed to generate payslip.');
                    } finally {
                      setIsGeneratingPayslip(false);
                    }
                  }}
                  disabled={isGeneratingPayslip}
                  className="rounded-xl bg-amber-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-amber-300 disabled:opacity-50"
                >
                  {isGeneratingPayslip ? 'Generating payslip...' : 'Generate payslip PNG'}
                </button>
                {selectedRecord.status === 'draft' && Number(selectedRecord.overtimeHoursCandidate ?? 0) > 0 && (
                  <button
                    onClick={() => approveOvertimeMutation.mutate(selectedRecord.id)}
                    disabled={approveOvertimeMutation.isPending}
                    className="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-500 disabled:opacity-50"
                  >
                    {approveOvertimeMutation.isPending ? 'Approving overtime...' : 'Approve detected overtime'}
                  </button>
                )}
                {selectedRecord.status === 'draft' && (
                  <button
                    onClick={() => processMutation.mutate(selectedRecord.id)}
                    disabled={!canProcessRecord(selectedRecord) || processMutation.isPending}
                    className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processMutation.isPending ? 'Processing payroll...' : 'Process payroll'}
                  </button>
                )}
              </div>
              {payslipError && <p className="text-sm text-red-600">{payslipError}</p>}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  detail,
  tone,
}: {
  label: string;
  value: string;
  detail?: string;
  tone: 'slate' | 'blue' | 'emerald' | 'amber';
}) {
  const styles = {
    slate: 'border-slate-200 bg-white text-slate-900',
    blue: 'border-blue-200 bg-blue-50 text-blue-950',
    emerald: 'border-emerald-200 bg-emerald-50 text-emerald-950',
    amber: 'border-amber-200 bg-amber-50 text-amber-950',
  }[tone];

  return (
    <div className={`rounded-2xl border p-4 shadow-sm ${styles}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      {detail && <p className="mt-1 text-sm opacity-75">{detail}</p>}
    </div>
  );
}

function DetailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
      <p className="mt-1 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function BreakdownRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className={strong ? 'font-semibold text-slate-900' : ''}>{label}</span>
      <span className={strong ? 'font-semibold text-slate-900' : ''}>{value}</span>
    </div>
  );
}
