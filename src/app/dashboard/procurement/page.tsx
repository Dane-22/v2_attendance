'use client';

import { useState, useMemo } from 'react';
import { PurchaseOrder, Supplier } from './types';
import { mockPurchaseOrders, mockSuppliers, procurementStats, statusColors } from './data';
import { 
  ShoppingCart, 
  Truck, 
  Users, 
  DollarSign,
  Plus,
  Search,
  Filter,
  MoreHorizontal,
  Download,
  Eye,
  CheckCircle,
  XCircle,
  FileText,
  ChevronDown,
  Star
} from 'lucide-react';

const statusFilter = ['ALL', 'DRAFT', 'PENDING', 'APPROVED', 'ORDERED', 'RECEIVED'] as const;

export default function ProcurementPage() {
  const [activeTab, setActiveTab] = useState<'orders' | 'suppliers'>('orders');
  const [statusFilterValue, setStatusFilterValue] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<PurchaseOrder[]>(mockPurchaseOrders);

  const filteredOrders = useMemo(() => {
    let filtered = orders;
    
    if (statusFilterValue !== 'ALL') {
      filtered = filtered.filter(o => o.status === statusFilterValue);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.poNumber.toLowerCase().includes(query) ||
        o.supplier.toLowerCase().includes(query) ||
        (o.projectName && o.projectName.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }, [orders, statusFilterValue, searchQuery]);

  const handleApprove = (id: string) => {
    setOrders(prev =>
      prev.map(o => o.id === id ? { ...o, status: 'APPROVED', approvedBy: 'Admin Super' } : o)
    );
  };

  const handleCancel = (id: string) => {
    if (confirm('Cancel this purchase order?')) {
      setOrders(prev =>
        prev.map(o => o.id === id ? { ...o, status: 'CANCELLED' } : o)
      );
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
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
            Procurement <span className="text-[#facc15]">& Purchasing</span>
          </h1>
          <p className="text-gray-400 mt-1">
            Manage purchase orders and supplier relationships
          </p>
        </div>
        
        <button className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
          <Plus className="w-4 h-4" />
          New Purchase Order
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Orders', value: procurementStats.totalOrders, icon: ShoppingCart, color: 'text-[#facc15]', bg: 'bg-[#facc15]/10' },
          { label: 'Pending Approval', value: procurementStats.pendingApproval, icon: FileText, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
          { label: 'Total Spent', value: formatCurrency(procurementStats.totalSpent), icon: DollarSign, color: 'text-green-400', bg: 'bg-green-400/10' },
          { label: 'Active Suppliers', value: procurementStats.activeSuppliers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-400/10' },
        ].map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-[#141414] rounded-xl border border-[#262626] p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div>
                  <p className="text-xl font-bold text-white">{stat.value}</p>
                  <p className="text-xs text-gray-400">{stat.label}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#262626]">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'orders' ? 'text-[#facc15]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Purchase Orders
          {activeTab === 'orders' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#facc15]" />}
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`px-4 py-3 text-sm font-medium transition-colors relative ${
            activeTab === 'suppliers' ? 'text-[#facc15]' : 'text-gray-400 hover:text-white'
          }`}
        >
          Suppliers
          {activeTab === 'suppliers' && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#facc15]" />}
        </button>
      </div>

      {activeTab === 'orders' ? (
        <>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#141414] rounded-xl border border-[#262626] p-4">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search orders..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15]"
              />
            </div>

            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={statusFilterValue}
                onChange={(e) => setStatusFilterValue(e.target.value)}
                className="px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15] text-sm"
              >
                {statusFilter.map(status => (
                  <option key={status} value={status}>
                    {status === 'ALL' ? 'All Status' : status}
                  </option>
                ))}
              </select>
              <button className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400">
                <Download className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Orders Table */}
          <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626] bg-[#1a1a1a]">
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">PO Number</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Supplier</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Project</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-400 uppercase">Status</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-400 uppercase">Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-400 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#262626]">
                {filteredOrders.map((order) => {
                  const statusStyle = statusColors[order.status];
                  return (
                    <tr key={order.id} className="hover:bg-[#1a1a1a] transition-colors">
                      <td className="px-4 py-3">
                        <div>
                          <p className="text-white font-medium">{order.poNumber}</p>
                          <p className="text-xs text-gray-500">{formatDate(order.orderDate)}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white">{order.supplier}</p>
                        {order.deliveryDate && (
                          <p className="text-xs text-gray-500">Delivery: {formatDate(order.deliveryDate)}</p>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-white text-sm">{order.projectName || 'N/A'}</p>
                        <p className="text-xs text-gray-500">{order.items.length} items</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${statusStyle.bg} ${statusStyle.text}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <p className="text-white font-medium">{formatCurrency(order.total)}</p>
                        <p className="text-xs text-gray-500">Inc. tax</p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-center gap-1">
                          {order.status === 'PENDING' && (
                            <>
                              <button 
                                onClick={() => handleApprove(order.id)}
                                className="p-2 hover:bg-green-500/10 rounded-lg transition-colors text-gray-400 hover:text-green-400"
                                title="Approve"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                              <button 
                                onClick={() => handleCancel(order.id)}
                                className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-gray-400 hover:text-red-400"
                                title="Reject"
                              >
                                <XCircle className="w-4 h-4" />
                              </button>
                            </>
                          )}
                          <button className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white" title="View">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 hover:bg-[#262626] rounded-lg transition-colors text-gray-400 hover:text-white">
                            <MoreHorizontal className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Suppliers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockSuppliers.map((supplier) => (
              <div key={supplier.id} className="bg-[#141414] rounded-xl border border-[#262626] p-6 hover:border-[#404040] transition-all">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold">{supplier.name}</h3>
                    <p className="text-sm text-gray-400">{supplier.category}</p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    supplier.status === 'ACTIVE' 
                      ? 'bg-green-400/10 text-green-400' 
                      : 'bg-gray-400/10 text-gray-400'
                  }`}>
                    {supplier.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    <span>{supplier.contact}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-xs">📧</span>
                    <span className="truncate">{supplier.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-xs">📞</span>
                    <span>{supplier.phone}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-400">
                    <span className="text-xs">📍</span>
                    <span className="truncate">{supplier.address}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-[#262626]">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-[#facc15] fill-[#facc15]" />
                    <span className="text-white font-medium">{supplier.rating}</span>
                    <span className="text-xs text-gray-500">/ 5.0</span>
                  </div>
                  <button className="text-sm text-[#facc15] hover:text-yellow-400">
                    View History →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
