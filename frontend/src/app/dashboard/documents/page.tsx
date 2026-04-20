'use client';

import { useState, useMemo } from 'react';
import { Document, DocumentCategory, DocumentSortBy, DocumentViewMode } from './types';
import { mockDocuments, documentCategories, typeIcons, typeColors } from './data';
import { 
  Folder, 
  FileText, 
  Receipt, 
  BarChart3, 
  DollarSign, 
  Shield, 
  File,
  Search,
  Grid3X3,
  List,
  Upload,
  MoreVertical,
  Download,
  Trash2,
  Archive,
  Clock,
  User,
  ChevronDown,
  Filter
} from 'lucide-react';

const iconMap: Record<string, React.ElementType> = {
  Folder,
  FileText,
  Receipt,
  BarChart3,
  DollarSign,
  Shield,
  File,
};

const sortOptions: { value: DocumentSortBy; label: string }[] = [
  { value: 'date', label: 'Date Modified' },
  { value: 'name', label: 'Name' },
  { value: 'size', label: 'Size' },
];

export default function DocumentsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<DocumentViewMode>('list');
  const [sortBy, setSortBy] = useState<DocumentSortBy>('date');
  const [documents, setDocuments] = useState<Document[]>(mockDocuments);

  const filteredDocuments = useMemo(() => {
    let filtered = documents;

    // Filter by category
    if (selectedCategory !== 'ALL') {
      filtered = filtered.filter(doc => doc.category === selectedCategory);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.uploadedBy.toLowerCase().includes(query) ||
        (doc.projectName && doc.projectName.toLowerCase().includes(query))
      );
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'size':
          return parseFloat(b.size) - parseFloat(a.size);
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
      }
    });

    return filtered;
  }, [documents, selectedCategory, searchQuery, sortBy]);

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this document?')) {
      setDocuments(prev => prev.filter(doc => doc.id !== id));
    }
  };

  const handleArchive = (id: string) => {
    setDocuments(prev =>
      prev.map(doc =>
        doc.id === id ? { ...doc, isArchived: !doc.isArchived } : doc
      )
    );
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Documents <span className="text-[#facc15]">& Files</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage and organize your project documents
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
          <Upload className="w-4 h-4" />
          Upload Document
        </button>
      </div>

      {/* Stats & Filters */}
      <div className="flex flex-wrap items-center gap-2">
        {documentCategories.map((cat) => {
          const Icon = iconMap[cat.icon] || File;
          const isActive = selectedCategory === cat.id;
          
          return (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-[#facc15] text-black'
                  : 'bg-[#141414] border border-[#262626] text-gray-400 hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" style={{ color: isActive ? 'inherit' : cat.color }} />
              {cat.name}
              <span className={`px-1.5 py-0.5 rounded text-xs ${isActive ? 'bg-black/20' : 'bg-[#262626]'}`}>
                {cat.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] rounded-xl border border-[#262626] p-4">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15]"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Sort Dropdown */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as DocumentSortBy)}
              className="appearance-none px-4 py-2 pr-10 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15] text-sm"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
          </div>

          {/* View Toggle */}
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

      {/* Documents Display */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-[#141414] rounded-xl border border-[#262626] p-12 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#262626] flex items-center justify-center">
            <Folder className="w-8 h-8 text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-white mb-2">No documents found</h3>
          <p className="text-gray-400 text-sm">Try adjusting your search or filter criteria</p>
        </div>
      ) : viewMode === 'grid' ? (
        // Grid View
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-[#141414] rounded-xl border border-[#262626] p-4 hover:border-[#404040] transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${typeColors[doc.type]}`}>
                  {typeIcons[doc.type]}
                </div>
                <button className="p-1 opacity-0 group-hover:opacity-100 hover:bg-[#262626] rounded transition-all text-gray-400">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <h4 className="text-white font-medium mb-1 line-clamp-2">{doc.name}</h4>
              <p className="text-xs text-gray-400 mb-3">{doc.size}</p>
              
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <User className="w-3 h-3" />
                <span>{doc.uploadedBy}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>{formatDate(doc.uploadedAt)}</span>
              </div>
              
              {doc.projectName && (
                <div className="mt-3 pt-3 border-t border-[#262626]">
                  <span className="text-xs px-2 py-1 bg-[#262626] rounded text-gray-400">
                    {doc.projectName}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        // List View
        <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#262626] bg-[#1a1a1a]">
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Category</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Size</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Uploaded</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#262626]">
              {filteredDocuments.map((doc) => (
                <tr key={doc.id} className="hover:bg-[#1a1a1a] transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <span className={`w-10 h-10 rounded-lg flex items-center justify-center text-lg ${typeColors[doc.type]}`}>
                        {typeIcons[doc.type]}
                      </span>
                      <div>
                        <p className="text-white font-medium">{doc.name}</p>
                        {doc.projectName && (
                          <p className="text-xs text-gray-400">{doc.projectName}</p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 bg-[#262626] rounded text-xs text-gray-400">
                      {doc.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400">{doc.size}</td>
                  <td className="px-4 py-3">
                    <div className="text-sm text-white">{doc.uploadedBy}</div>
                    <div className="text-xs text-gray-500">{formatDate(doc.uploadedAt)}</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white" title="Download">
                        <Download className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleArchive(doc.id)}
                        className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white" 
                        title={doc.isArchived ? 'Unarchive' : 'Archive'}
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

      {/* Storage Info */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-white font-medium">Storage Usage</p>
              <p className="text-sm text-gray-400">12.4 MB of 10 GB used</p>
            </div>
          </div>
          <div className="w-48">
            <div className="h-2 bg-[#262626] rounded-full overflow-hidden">
              <div className="h-full bg-blue-400 rounded-full" style={{ width: '0.12%' }} />
            </div>
            <p className="text-xs text-gray-500 mt-1 text-right">0.12% used</p>
          </div>
        </div>
      </div>
    </div>
  );
}
