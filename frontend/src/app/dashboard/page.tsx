'use client';

import { useQuery } from '@tanstack/react-query';
import { employeeApi, attendanceApi } from '@/lib/api';
import Link from 'next/link';
import { 
  Users, 
  Clock, 
  Wallet, 
  ScanLine, 
  CalendarCheck, 
  TrendingUp,
  ArrowRight,
  Building2
} from 'lucide-react';

export default function DashboardPage() {
  const { data: employeesData } = useQuery({
    queryKey: ['employees', { limit: 5 }],
    queryFn: () => employeeApi.getAll({ limit: 5 }),
  });

  const { data: attendanceData } = useQuery({
    queryKey: ['attendance', { limit: 5 }],
    queryFn: () => attendanceApi.getAll({ limit: 5 }),
  });

  const stats = {
    totalEmployees: employeesData?.data.meta?.total || 0,
    todayAttendance: attendanceData?.data.data?.length || 0,
    presentRate: 0,
  };

  return (
    <div className="space-y-8 w-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Dashboard <span className="text-[#facc15]">Overview</span>
          </h1>
          <p className="text-gray-400 mt-1">Welcome back! Here&apos;s what&apos;s happening today.</p>
        </div>
        <Link
          href="/dashboard/scanner"
          className="inline-flex items-center gap-2 px-5 py-3 bg-[#facc15] text-black font-semibold rounded-xl hover:bg-yellow-400 transition-all shadow-lg shadow-yellow-500/20"
        >
          <ScanLine className="w-5 h-5" />
          Open QR Scanner
        </Link>
      </div>

      {/* Stats Cards - Full Width Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6 hover:border-[#404040] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wider">Total Employees</p>
              <p className="text-3xl font-bold text-[#facc15] mt-2">{stats.totalEmployees}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
              <Users className="w-7 h-7 text-[#facc15]" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Active</span>
            <span className="text-gray-500">workforce</span>
          </div>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6 hover:border-[#404040] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wider">Today&apos;s Attendance</p>
              <p className="text-3xl font-bold text-[#facc15] mt-2">{stats.todayAttendance}</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <Clock className="w-7 h-7 text-green-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <CalendarCheck className="w-4 h-4 text-gray-400" />
            <span className="text-gray-400">Records today</span>
          </div>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6 hover:border-[#404040] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wider">Present Rate</p>
              <p className="text-3xl font-bold text-[#facc15] mt-2">{stats.presentRate}%</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-blue-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-500">Based on today&apos;s data</span>
          </div>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6 hover:border-[#404040] transition-colors">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wider">Pending Payroll</p>
              <p className="text-3xl font-bold text-[#facc15] mt-2">-</p>
            </div>
            <div className="w-14 h-14 rounded-xl bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center">
              <Wallet className="w-7 h-7 text-yellow-400" />
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-gray-500">Processing next cycle</span>
          </div>
        </div>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="lg:col-span-2 bg-[#141414] rounded-xl border border-[#262626] p-6">
          <h2 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-[#facc15]" />
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/dashboard/employees"
              className="group flex flex-col p-4 bg-[#1a1a1a] rounded-xl border border-[#262626] hover:border-[#facc15]/50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 flex items-center justify-center mb-3 group-hover:bg-[#facc15]/20 transition-colors">
                <Users className="w-5 h-5 text-[#facc15]" />
              </div>
              <span className="text-white font-medium">Manage Employees</span>
              <span className="text-gray-500 text-sm mt-1">View and edit staff</span>
              <ArrowRight className="w-4 h-4 text-gray-500 mt-3 group-hover:text-[#facc15] transition-colors" />
            </Link>
            
            <Link
              href="/dashboard/attendance"
              className="group flex flex-col p-4 bg-[#1a1a1a] rounded-xl border border-[#262626] hover:border-[#facc15]/50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                <CalendarCheck className="w-5 h-5 text-green-400" />
              </div>
              <span className="text-white font-medium">Attendance</span>
              <span className="text-gray-500 text-sm mt-1">Mark & view records</span>
              <ArrowRight className="w-4 h-4 text-gray-500 mt-3 group-hover:text-green-400 transition-colors" />
            </Link>
            
            <Link
              href="/dashboard/payroll"
              className="group flex flex-col p-4 bg-[#1a1a1a] rounded-xl border border-[#262626] hover:border-[#facc15]/50 transition-all"
            >
              <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center mb-3 group-hover:bg-yellow-500/20 transition-colors">
                <Wallet className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="text-white font-medium">Payroll</span>
              <span className="text-gray-500 text-sm mt-1">Process salaries</span>
              <ArrowRight className="w-4 h-4 text-gray-500 mt-3 group-hover:text-yellow-400 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Recent Activity</h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-[#facc15]/20 flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#facc15]" />
              </div>
              <div>
                <p className="text-white text-sm">Attendance marked</p>
                <p className="text-gray-500 text-xs mt-0.5">2 minutes ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-green-500/20 flex items-center justify-center shrink-0">
                <Users className="w-4 h-4 text-green-400" />
              </div>
              <div>
                <p className="text-white text-sm">New employee added</p>
                <p className="text-gray-500 text-xs mt-0.5">1 hour ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-[#1a1a1a] rounded-lg">
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <ScanLine className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white text-sm">QR scan completed</p>
                <p className="text-gray-500 text-xs mt-0.5">3 hours ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
