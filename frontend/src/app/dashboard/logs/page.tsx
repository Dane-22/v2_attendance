'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { LogEntry, LogFilters, ViewMode } from './types';
import { logsApi } from '@/lib/api';
import LogTable from './components/LogTable';
import LogTimeline from './components/LogTimeline';
import LogFiltersComponent from './components/LogFilters';
import ExportButton from './components/ExportButton';
import { useAppStore } from '@/store/appStore';
import { 
  Activity, 
  LayoutList, 
  Clock,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Shield,
  AlertTriangle,
  Archive
} from 'lucide-react';

const RETENTION_DAYS = 365;

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

// Convert frontend filters to API params
function buildQueryParams(filters: LogFilters, page: number, limit: number): Record<string, any> {
  const params: Record<string, any> = {
    page,
    limit,
    dateRange: filters.dateRange,
  };

  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  if (filters.actionTypes.length > 0) params.actionTypes = filters.actionTypes.join(',');
  if (filters.entityTypes.length > 0) params.entityTypes = filters.entityTypes.join(',');
  if (filters.userId) params.userId = filters.userId;
  if (filters.status.length > 0) params.status = filters.status.join(',');
  if (filters.searchQuery) params.searchQuery = filters.searchQuery;

  return params;
}

export default function LogsPage() {
  const user = useAppStore((state) => state.user);
  const isSuperAdmin = user?.role === 'super_admin';
  
  const [filters, setFilters] = useState<LogFilters>({
    dateRange: 'today',
    actionTypes: [],
    entityTypes: [],
    status: [],
    searchQuery: '',
  });
  
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch logs from API using React Query
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['logs', filters, currentPage, itemsPerPage],
    queryFn: async () => {
      const params = buildQueryParams(filters, currentPage, itemsPerPage);
      const response = await logsApi.getAll(params);
      return response.data.data;
    },
    placeholderData: (previousData) => previousData,
  });

  const logs = data?.logs || [];
  const total = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        pages.push(currentPage - 1);
        pages.push(currentPage);
        pages.push(currentPage + 1);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="space-y-6">
      {/* Retention Policy Banner */}
      <div className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <Archive className="w-5 h-5 text-blue-400" />
        <p className="text-sm text-blue-400">
          Logs are retained for <span className="font-semibold">{RETENTION_DAYS} days</span> and auto-deleted per policy. 
          <span className="hidden sm:inline"> Export important logs before retention period ends.</span>
        </p>
      </div>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Activity <span className="text-[#facc15]">Logs</span>
            </h1>
            {isSuperAdmin && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-500/10 border border-purple-500/30 rounded-lg text-xs text-purple-400">
                <Shield className="w-3 h-3" />
                Super Admin
              </span>
            )}
          </div>
          <p className="text-gray-400 mt-1">
            Total {total} activities recorded
            {isLoading && <span className="ml-2 text-sm">(Loading...)</span>}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            className={`flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white hover:border-[#404040] transition-all ${
              isRefreshing ? 'animate-pulse' : ''
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-[#141414] border border-[#262626] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                viewMode === 'table' 
                  ? 'bg-[#facc15] text-black' 
                  : 'text-white hover:bg-[#262626]'
              }`}
            >
              <LayoutList className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-2 px-4 py-2 transition-colors ${
                viewMode === 'timeline' 
                  ? 'bg-[#facc15] text-black' 
                  : 'text-white hover:bg-[#262626]'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span className="hidden sm:inline">Timeline</span>
            </button>
          </div>

          {/* Export Button */}
          <ExportButton logs={logs} filters={JSON.stringify(filters)} />
        </div>
      </div>

      {/* Filters */}
      <LogFiltersComponent filters={filters} onFiltersChange={(newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1); // Reset to first page on filter change
      }} />

      {/* Error State */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <p className="text-red-400">Failed to load logs. Please try again.</p>
          <button
            onClick={handleRefresh}
            className="mt-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Content */}
      {!error && (
        <>
          {viewMode === 'table' ? (
            <LogTable logs={logs} isSuperAdmin={isSuperAdmin} />
          ) : (
            <LogTimeline logs={logs} />
          )}
        </>
      )}

      {/* Pagination */}
      {total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] rounded-xl border border-[#262626] p-4">
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">
              Showing <span className="text-white">{total === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1}</span> to{' '}
              <span className="text-white">{Math.min(currentPage * itemsPerPage, total)}</span> of{' '}
              <span className="text-white">{total}</span> results
            </span>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400">Show:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded text-white text-sm focus:outline-none focus:border-[#facc15]"
              >
                {ITEMS_PER_PAGE_OPTIONS.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-gray-400 hover:text-[#facc15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-2 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`w-10 h-10 flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      currentPage === page
                        ? 'bg-[#facc15] text-black'
                        : 'bg-[#1a1a1a] text-gray-400 hover:text-white hover:bg-[#262626]'
                    }`}
                  >
                    {page}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-gray-400 hover:text-[#facc15] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
