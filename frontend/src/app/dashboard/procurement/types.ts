export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: string;
  status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'ORDERED' | 'RECEIVED' | 'CANCELLED';
  items: PurchaseItem[];
  subtotal: number;
  tax: number;
  total: number;
  orderDate: string;
  deliveryDate?: string;
  projectId?: string;
  projectName?: string;
  requestedBy: string;
  approvedBy?: string;
}

export interface PurchaseItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  total: number;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  email: string;
  phone: string;
  address: string;
  category: string;
  rating: number;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface ProcurementStats {
  totalOrders: number;
  pendingApproval: number;
  totalSpent: number;
  activeSuppliers: number;
}
