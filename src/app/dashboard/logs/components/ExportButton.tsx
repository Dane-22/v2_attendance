'use client';

import { useState } from 'react';
import { LogEntry } from '../types';
import { Download, FileSpreadsheet, FileText, ChevronDown, Check } from 'lucide-react';

interface ExportButtonProps {
  logs: LogEntry[];
  filters: string;
}

export default function ExportButton({ logs, filters }: ExportButtonProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [exported, setExported] = useState(false);

  const exportToCSV = () => {
    const headers = ['ID', 'Timestamp', 'User', 'Role', 'Action Type', 'Entity Type', 'Entity Name', 'Entity ID', 'Description', 'Status', 'IP Address'];
    
    const rows = logs.map(log => [
      log.id,
      log.timestamp,
      log.user.name,
      log.user.role,
      log.actionType,
      log.entityType,
      log.entityName || '',
      log.entityId || '',
      log.description,
      log.status,
      log.ipAddress || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExported(true);
    setTimeout(() => setExported(false), 2000);
    setShowDropdown(false);
  };

  const exportToJSON = () => {
    const jsonContent = JSON.stringify(logs, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `activity-logs-${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setExported(true);
    setTimeout(() => setExported(false), 2000);
    setShowDropdown(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
          exported 
            ? 'bg-green-500 text-white' 
            : 'bg-[#facc15] text-black hover:bg-yellow-400'
        }`}
      >
        {exported ? (
          <>
            <Check className="w-4 h-4" />
            Exported
          </>
        ) : (
          <>
            <Download className="w-4 h-4" />
            Export
            <ChevronDown className="w-4 h-4" />
          </>
        )}
      </button>

      {showDropdown && !exported && (
        <div className="absolute top-full right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#262626] rounded-lg shadow-xl z-50 overflow-hidden">
          <button
            onClick={exportToCSV}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#262626] transition-colors text-left"
          >
            <FileSpreadsheet className="w-5 h-5 text-green-400" />
            <div>
              <div className="text-white text-sm font-medium">Export as CSV</div>
              <div className="text-gray-400 text-xs">Spreadsheet format</div>
            </div>
          </button>
          <button
            onClick={exportToJSON}
            className="w-full flex items-center gap-3 px-4 py-3 hover:bg-[#262626] transition-colors text-left border-t border-[#262626]"
          >
            <FileText className="w-5 h-5 text-blue-400" />
            <div>
              <div className="text-white text-sm font-medium">Export as JSON</div>
              <div className="text-gray-400 text-xs">Raw data format</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
}
