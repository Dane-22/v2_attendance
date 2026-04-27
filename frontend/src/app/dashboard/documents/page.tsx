'use client';

import { useState, useEffect, useRef } from 'react';
import { documentApi, EmployeeSummary, Document } from '@/lib/api';
import { DocumentType } from './types';
import {
  Users,
  Search,
  Grid3X3,
  List,
  FileText,
  Download,
  Trash2,
  Archive,
  Upload,
  FolderOpen,
  ChevronDown,
  ArrowLeft,
  File,
  MoreVertical
} from 'lucide-react';

type ViewMode = 'grid' | 'list' | 'details';
type ViewState = 'employees' | 'employee-documents' | 'archived';

const DOCUMENT_TYPES: Record<DocumentType, string> = {
  RESUME: 'Resume',
  SSS: 'SSS',
  TIN: 'TIN',
  PHILHEALTH: 'PhilHealth',
  BIRTH_CERTIFICATE: 'Birth Certificate',
  PDS: 'PDS',
  COVER_LETTER: 'Cover Letter',
  APPLICATION_LETTER: 'Application Letter',
  CLEARANCE: 'Clearance',
};

const DOCUMENT_ICONS: Record<DocumentType, string> = {
  RESUME: '📄',
  SSS: '📋',
  TIN: '📝',
  PHILHEALTH: '🏥',
  BIRTH_CERTIFICATE: '📜',
  PDS: '📊',
  COVER_LETTER: '✉️',
  APPLICATION_LETTER: '📧',
  CLEARANCE: '✅',
};

export default function DocumentsPage() {
  const [viewState, setViewState] = useState<ViewState>('employees');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeSummary | null>(null);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [archivedDocuments, setArchivedDocuments] = useState<Document[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState<DocumentType>('RESUME');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEmployees();
  }, [page, searchQuery]);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const response = await documentApi.getEmployees({ page, limit: 10, search: searchQuery });
      setEmployees(response.data.data ?? []);
      setTotalPages(response.data.meta.totalPages);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployeeDocuments = async (employeeId: number) => {
    setLoading(true);
    try {
      const response = await documentApi.getEmployeeDocuments(employeeId);
      setDocuments(response.data.data?.documents ?? []);
    } catch (error) {
      console.error('Error fetching employee documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchArchivedDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentApi.getArchivedDocuments({ page: 1, limit: 50 });
      setArchivedDocuments(response.data.data ?? []);
    } catch (error) {
      console.error('Error fetching archived documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEmployeeClick = (employee: EmployeeSummary) => {
    setSelectedEmployee(employee);
    setViewState('employee-documents');
    fetchEmployeeDocuments(employee.id);
  };

  const handleBack = () => {
    setViewState('employees');
    setSelectedEmployee(null);
    setDocuments([]);
  };

  const handleViewArchived = () => {
    setViewState('archived');
    fetchArchivedDocuments();
  };

  const handleDownload = async (documentId: number, fileName: string) => {
    try {
      const response = await documentApi.downloadDocument(documentId);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  const handleArchive = async (documentId: number) => {
    if (confirm('Are you sure you want to archive this document?')) {
      try {
        await documentApi.archiveDocument(documentId);
        if (selectedEmployee) {
          fetchEmployeeDocuments(selectedEmployee.id);
        } else {
          fetchArchivedDocuments();
        }
      } catch (error) {
        console.error('Error archiving document:', error);
      }
    }
  };

  const handleDelete = async (documentId: number) => {
    if (confirm('Are you sure you want to permanently delete this document?')) {
      try {
        await documentApi.deleteDocument(documentId);
        if (selectedEmployee) {
          fetchEmployeeDocuments(selectedEmployee.id);
        } else {
          fetchArchivedDocuments();
        }
      } catch (error) {
        console.error('Error deleting document:', error);
      }
    }
  };

  const handleUnarchive = async (documentId: number) => {
    try {
      await documentApi.unarchiveDocument(documentId);
      fetchArchivedDocuments();
    } catch (error) {
      console.error('Error unarchiving document:', error);
    }
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedEmployee) return;

    setUploading(true);
    try {
      await documentApi.uploadDocument(selectedEmployee.id, file, selectedDocumentType);
      fetchEmployeeDocuments(selectedEmployee.id);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Failed to upload document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getDocumentCountColor = (count: number) => {
    if (count === 0) return 'bg-red-500/20 text-red-400';
    if (count <= 5) return 'bg-yellow-500/20 text-yellow-400';
    if (count <= 10) return 'bg-blue-500/20 text-blue-400';
    return 'bg-green-500/20 text-green-400';
  };

  if (viewState === 'employees') {
    return (
      <div className="space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white">
              Digital 201 <span className="text-[#facc15]">File Manager</span>
            </h1>
            <p className="text-gray-400 mt-1">
              Manage employee personnel files (201 files)
            </p>
          </div>
          <button
            onClick={handleViewArchived}
            className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] text-gray-400 hover:text-white rounded-lg hover:border-[#404040] transition-colors"
          >
            <FolderOpen className="w-4 h-4" />
            View Archived Documents
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] rounded-xl border border-[#262626] p-4">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0f0f0f] rounded-lg border border-[#262626] overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#facc15] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#facc15] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : employees.length === 0 ? (
          <div className="bg-[#141414] rounded-xl border border-[#262626] p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium text-white mb-2">No employees found</h3>
            <p className="text-gray-400 text-sm">Try adjusting your search criteria</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {employees.map((employee) => (
              <div
                key={employee.id}
                className="bg-[#141414] rounded-xl border border-[#262626] p-4 hover:border-[#404040] transition-all cursor-pointer"
                onClick={() => handleEmployeeClick(employee)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#262626] flex items-center justify-center">
                    <Users className="w-6 h-6 text-gray-400" />
                  </div>
                  <span className={`px-2 py-1 rounded text-xs font-medium ${getDocumentCountColor(employee.documentCount)}`}>
                    {employee.documentCount} docs
                  </span>
                </div>
                <h4 className="text-white font-medium mb-1">
                  {employee.firstName} {employee.lastName}
                </h4>
                <p className="text-xs text-gray-400 mb-2">{employee.employeeCode || 'No ID'}</p>
                <p className="text-xs text-gray-500">{employee.department || 'No Department'}</p>
                <p className="text-xs text-gray-500">{employee.position || 'No Position'}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626] bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Employee</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Department</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Documents</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {employees.map((employee) => (
                  <tr key={employee.id} className="hover:bg-[#1a1a1a] transition-colors cursor-pointer" onClick={() => handleEmployeeClick(employee)}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center">
                          <Users className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-white font-medium">
                          {employee.firstName} {employee.lastName}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{employee.employeeCode || '-'}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{employee.department || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getDocumentCountColor(employee.documentCount)}`}>
                        {employee.documentCount}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button className="px-3 py-1 bg-[#facc15] text-black text-sm font-medium rounded hover:bg-yellow-400 transition-colors">
                        View Documents
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white hover:border-[#404040] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-gray-400">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white hover:border-[#404040] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        )}
      </div>
    );
  }

  if (viewState === 'employee-documents' && selectedEmployee) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] text-gray-400 hover:text-white rounded-lg hover:border-[#404040] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </div>

        <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white">
                {selectedEmployee.firstName} {selectedEmployee.lastName}
              </h2>
              <p className="text-gray-400">
                {selectedEmployee.employeeCode || 'No ID'} • {selectedEmployee.department || 'No Department'} • {selectedEmployee.position || 'No Position'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-[#facc15]">{documents.length}</p>
              <p className="text-xs text-gray-400">Total Documents</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] rounded-xl border border-[#262626] p-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-[#0f0f0f] rounded-lg border border-[#262626] overflow-hidden">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#facc15] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-[#facc15] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('details')}
                className={`p-2 transition-colors ${viewMode === 'details' ? 'bg-[#facc15] text-black' : 'text-gray-400 hover:text-white'}`}
              >
                <FileText className="w-4 h-4" />
              </button>
            </div>
          </div>

          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Upload Document'}
          </button>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png"
        />

        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400">Document Type:</span>
          <select
            value={selectedDocumentType}
            onChange={(e) => setSelectedDocumentType(e.target.value as DocumentType)}
            className="px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white text-sm focus:outline-none focus:border-[#facc15]"
          >
            {Object.entries(DOCUMENT_TYPES).map(([type, label]) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : documents.length === 0 ? (
          <div className="bg-[#141414] rounded-xl border border-[#262626] p-12 text-center">
            <File className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
            <p className="text-gray-400 text-sm">Upload documents to get started</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {documents.map((doc) => (
              <div key={doc.id} className="bg-[#141414] rounded-xl border border-[#262626] p-4 hover:border-[#404040] transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-12 h-12 rounded-xl bg-[#262626] flex items-center justify-center text-2xl">
                    {DOCUMENT_ICONS[doc.documentType] || '📄'}
                  </div>
                  <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#262626] rounded transition-all text-gray-400">
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
                <h4 className="text-white font-medium mb-1 line-clamp-2">{doc.originalFileName || doc.fileName}</h4>
                <p className="text-xs text-gray-400 mb-2">{DOCUMENT_TYPES[doc.documentType]}</p>
                <p className="text-xs text-gray-500 mb-3">{formatFileSize(doc.fileSize)}</p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDownload(doc.id, doc.originalFileName || doc.fileName)}
                    className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleArchive(doc.id)}
                    className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                    title="Archive"
                  >
                    <Archive className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : viewMode === 'list' ? (
          <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626] bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Uploaded</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center text-lg">
                          {DOCUMENT_ICONS[doc.documentType] || '📄'}
                        </span>
                        <p className="text-white font-medium line-clamp-1">{doc.originalFileName || doc.fileName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#262626] rounded text-xs text-gray-400">
                        {DOCUMENT_TYPES[doc.documentType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(doc.uploadedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(doc.id, doc.originalFileName || doc.fileName)}
                          className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(doc.id)}
                          className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626] bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Uploaded</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">File Hash</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Compressed</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center text-lg">
                          {DOCUMENT_ICONS[doc.documentType] || '📄'}
                        </span>
                        <div>
                          <p className="text-white font-medium line-clamp-1">{doc.originalFileName || doc.fileName}</p>
                          <p className="text-xs text-gray-500">{doc.filePath}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#262626] rounded text-xs text-gray-400">
                        {DOCUMENT_TYPES[doc.documentType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatDate(doc.uploadedAt)}</td>
                    <td className="px-4 py-3 text-xs text-gray-500 font-mono">{doc.fileHash || '-'}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs ${doc.isCompressed ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>
                        {doc.isCompressed ? 'Yes' : 'No'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleDownload(doc.id, doc.originalFileName || doc.fileName)}
                          className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleArchive(doc.id)}
                          className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white"
                          title="Archive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (viewState === 'archived') {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-4 py-2 bg-[#141414] border border-[#262626] text-gray-400 hover:text-white rounded-lg hover:border-[#404040] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Employees
          </button>
        </div>

        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Archived <span className="text-[#facc15]">Documents</span>
          </h1>
          <p className="text-gray-400 mt-1">
            View and restore archived employee documents
          </p>
        </div>

        {loading ? (
          <div className="text-center text-gray-400 py-12">Loading...</div>
        ) : archivedDocuments.length === 0 ? (
          <div className="bg-[#141414] rounded-xl border border-[#262626] p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-medium text-white mb-2">No archived documents</h3>
            <p className="text-gray-400 text-sm">Archived documents will appear here</p>
          </div>
        ) : (
          <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626] bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Document</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Type</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Archived Date</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {archivedDocuments.map((doc) => (
                  <tr key={doc.id} className="hover:bg-[#1a1a1a] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <span className="w-10 h-10 rounded-lg bg-[#262626] flex items-center justify-center text-lg">
                          {DOCUMENT_ICONS[doc.documentType] || '📄'}
                        </span>
                        <p className="text-white font-medium line-clamp-1">{doc.originalFileName || doc.fileName}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-[#262626] rounded text-xs text-gray-400">
                        {DOCUMENT_TYPES[doc.documentType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-400">{formatFileSize(doc.fileSize)}</td>
                    <td className="px-4 py-3 text-sm text-gray-400">{doc.archivedAt ? formatDate(doc.archivedAt) : '-'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleUnarchive(doc.id)}
                          className="p-2 hover:bg-green-500/10 rounded-lg transition-colors text-gray-400 hover:text-green-400"
                          title="Unarchive"
                        >
                          <Archive className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(doc.id)}
                          className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                          title="Delete Permanently"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  return null;
}
