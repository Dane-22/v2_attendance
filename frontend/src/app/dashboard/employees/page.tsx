'use client';

import { useState } from 'react';
import { 
  Search, 
  Plus, 
  QrCode, 
  Edit2, 
  X, 
  Download, 
  ChevronLeft, 
  ChevronRight,
  Save,
  Key,
  UserPlus,
  Check
} from 'lucide-react';

// Mock employee data
const mockEmployees = [
  { id: 1, firstName: 'CESAR', lastName: 'ABUBO', email: 'cesar.abubo@example.com', employeeCode: 'E0002', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeductions: true, profileImage: null },
  { id: 2, firstName: 'Santi', lastName: 'Abubo', email: 's.abubo@gmail.com', employeeCode: 'E0072', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeductions: false, profileImage: null },
  { id: 3, firstName: 'Admin', lastName: 'Super', email: 'admin@jajrconstruction.com', employeeCode: 'SA001', position: 'Super Admin', status: 'Active', dailyRate: 800.00, hasDeductions: false, profileImage: null },
  { id: 4, firstName: 'Elaine', lastName: 'Aguilar', email: 'aguilar.elaine@example.com', employeeCode: 'ADMIN 2026-0001', position: 'Admin', status: 'Active', dailyRate: 600.00, hasDeductions: false, profileImage: null },
  { id: 5, firstName: 'MARLON', lastName: 'AGUILAR', email: 'marlon.aguilar@example.com', employeeCode: 'E0003', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeductions: false, profileImage: null },
  { id: 6, firstName: 'GIN TYRONE', lastName: 'AGUINO', email: 'aguino@gmail.com', employeeCode: 'E0089', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeductions: false, profileImage: null },
  { id: 7, firstName: 'Kyle', lastName: 'Arrieta', email: 'kyle@hotmail.com', employeeCode: 'E0078', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeductions: false, profileImage: null },
  { id: 8, firstName: 'Marc Justin', lastName: 'Arzadan', email: 'arzadan@gmail.com', employeeCode: 'SA 2026-004', position: 'Admin', status: 'Active', dailyRate: 700.00, hasDeductions: false, profileImage: null },
  { id: 9, firstName: 'JERICHO', lastName: 'BALTAZAR', email: 'jericho.baltazar@example.com', employeeCode: 'E0088', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeductions: true, profileImage: null },
  { id: 10, firstName: 'ROLLY', lastName: 'BALTAZAR', email: 'r.baltazar@yahoo.com', employeeCode: 'E0007', position: 'Worker', status: 'Active', dailyRate: 550.00, hasDeductions: false, profileImage: null },
];

// Types
interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  employeeCode: string;
  position: string;
  status: string;
  dailyRate: number;
  hasDeductions: boolean;
  profileImage: string | null;
}

// QR Code Modal Component
function QRCodeModal({ employee, isOpen, onClose }: { employee: Employee | null; isOpen: boolean; onClose: () => void }) {
  if (!isOpen || !employee) return null;

  const qrData = `https://jajr.xandree.com/employee/select_employee.php?auto_timeIn=1&select_branch=1&emp_id=12&emp_code=${employee.employeeCode}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#1a1a1a] rounded-2xl border border-[#facc15]/30 shadow-2xl shadow-[#facc15]/10 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <div className="flex items-center gap-2">
            <QrCode className="w-5 h-5 text-[#facc15]" />
            <h2 className="text-lg font-bold text-[#facc15]">Employee QR Code</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <h3 className="text-xl font-bold text-white mb-1">{employee.firstName} {employee.lastName}</h3>
          <p className="text-[#facc15] font-medium mb-6">{employee.employeeCode}</p>

          {/* QR Code Placeholder */}
          <div className="w-64 h-64 mx-auto bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
            <div className="w-56 h-56 bg-[#1a1a1a] rounded-lg flex items-center justify-center">
              <QrCode className="w-40 h-40 text-black" />
            </div>
          </div>

          <p className="text-gray-500 text-sm mb-4">Scan this QR code for quick employee identification</p>

          {/* QR Data */}
          <div className="bg-[#141414] rounded-lg p-3 mb-6 text-left">
            <p className="text-[#facc15] text-xs font-semibold mb-1">QR DATA:</p>
            <p className="text-gray-400 text-xs break-all font-mono">{qrData}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 px-4 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333] transition-colors">
              Close
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
              <Download className="w-4 h-4" />
              Download QR
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Edit Employee Modal Component
function EditEmployeeModal({ employee, isOpen, onClose }: { employee: Employee | null; isOpen: boolean; onClose: () => void }) {
  const [formData, setFormData] = useState<Partial<Employee>>({});

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-[#1a1a1a] rounded-2xl border border-[#facc15]/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <div>
            <h2 className="text-xl font-bold text-[#facc15]">Edit Employee</h2>
            <span className="inline-flex items-center px-2 py-0.5 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded mt-1">
              {employee.employeeCode}
            </span>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Profile Information - 4 columns */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Profile Information</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Employee Code <span className="text-red-400">*</span></label>
                <input type="text" defaultValue={employee.employeeCode} className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">First Name <span className="text-red-400">*</span></label>
                <input type="text" defaultValue={employee.firstName} className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Middle Name</label>
                <input type="text" className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Last Name <span className="text-red-400">*</span></label>
                <input type="text" defaultValue={employee.lastName} className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email Address <span className="text-red-400">*</span></label>
                <input type="email" defaultValue={employee.email} className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
            </div>
          </div>

          {/* Employment Details - 4 columns */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Employment Details</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Position <span className="text-red-400">*</span></label>
                <select defaultValue={employee.position} className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]">
                  <option>Worker</option>
                  <option>Admin</option>
                  <option>Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <select defaultValue={employee.status} className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Daily Rate (₱)</label>
                <input type="number" defaultValue={employee.dailyRate} className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className={`w-12 h-6 rounded-full transition-colors ${employee.hasDeductions ? 'bg-green-500' : 'bg-gray-600'}`}>
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${employee.hasDeductions ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-white text-sm">With SSS/PhilHealth/PagIBIG</span>
                </label>
              </div>
            </div>
            <p className="text-gray-500 text-xs mt-3 flex items-center gap-1">
              <span className="text-[#facc15]">ℹ</span> Use &quot;Reset Password&quot; button below to set password to default (jajrconstruction)
            </p>
          </div>

          {/* Profile Image */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Profile Image</h3>
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center text-[#facc15] text-xl font-bold border-2 border-[#facc15]/30">
                {employee.firstName[0]}{employee.lastName[0]}
              </div>
              <div className="flex-1 max-w-md">
                <button className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#facc15]/30 rounded-lg text-[#facc15] hover:bg-[#facc15]/10 transition-colors">
                  <UserPlus className="w-5 h-5" />
                  Choose New Profile Image
                </button>
                <p className="text-gray-500 text-xs mt-2">Max file size: 10MB • Auto-compressed to ~500KB • Formats: JPG, PNG, GIF, WebP</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#262626] bg-[#141414]">
          <button onClick={onClose} className="px-6 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333] transition-colors">
            Cancel
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-[#facc15]/20 text-[#facc15] border border-[#facc15] rounded-lg hover:bg-[#facc15]/30 transition-colors">
            <Key className="w-4 h-4" />
            Reset Password
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
            <Save className="w-4 h-4" />
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}

// Add Employee Modal Component
function AddEmployeeModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-[#1a1a1a] rounded-2xl border border-[#facc15]/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <h2 className="text-xl font-bold text-[#facc15]">Add New Employee</h2>
          <button onClick={onClose} className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* Profile Information - 4 columns */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Profile Information</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Employee Code <span className="text-red-400">*</span></label>
                <input type="text" className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">First Name <span className="text-red-400">*</span></label>
                <input type="text" className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Middle Name</label>
                <input type="text" className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Last Name <span className="text-red-400">*</span></label>
                <input type="text" className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email Address <span className="text-red-400">*</span></label>
                <input type="email" className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
            </div>
          </div>

          {/* Employment Details - 4 columns */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Employment Details</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Position <span className="text-red-400">*</span></label>
                <select className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]">
                  <option value="">Select Position</option>
                  <option>Worker</option>
                  <option>Admin</option>
                  <option>Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <select className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]">
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Daily Rate (₱)</label>
                <input type="number" className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]" />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="w-12 h-6 rounded-full bg-green-500">
                    <div className="w-5 h-5 bg-white rounded-full transition-transform mt-0.5 translate-x-6" />
                  </div>
                  <span className="text-white text-sm">With SSS/PhilHealth/PagIBIG</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#262626] bg-[#141414]">
          <button onClick={onClose} className="px-6 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333] transition-colors">
            Cancel
          </button>
          <button className="flex items-center gap-2 px-6 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
            <UserPlus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const employeesPerPage = 10;
  const totalEmployees = 70; // Mock total
  const totalPages = Math.ceil(totalEmployees / employeesPerPage);

  // Filter employees based on search
  const filteredEmployees = mockEmployees.filter(emp => 
    emp.firstName.toLowerCase().includes(search.toLowerCase()) ||
    emp.lastName.toLowerCase().includes(search.toLowerCase()) ||
    emp.employeeCode.toLowerCase().includes(search.toLowerCase())
  );

  const handleQRClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setQrModalOpen(true);
  };

  const handleEditClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">Employees</h1>
          <p className="text-gray-500 text-sm mt-0.5">Total Employees: {totalEmployees}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className="text-gray-500 text-sm hidden sm:block">Manage employee records</p>
          <button 
            onClick={() => setAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add Employee
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          placeholder="Search employees by name, code,"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-11 pr-4 py-3 bg-[#141414] border border-[#262626] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#facc15]"
        />
      </div>

      {/* Existing Employees Section */}
      <div>
        <h2 className="text-[#facc15] font-bold text-lg mb-4">Existing Employees</h2>

        {/* Employees Table */}
        <div className="bg-[#141414] rounded-xl border border-[#262626] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#262626]">
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Code</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Position</th>
                  <th className="px-4 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredEmployees.map((employee) => (
                  <tr key={employee.id} className="border-b border-[#262626] last:border-0 hover:bg-[#1a1a1a]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#facc15] flex items-center justify-center text-black text-sm font-bold">
                          {employee.firstName[0]}{employee.lastName[0]}
                        </div>
                        <div>
                          <p className="text-white font-medium text-sm">{employee.firstName} {employee.lastName}</p>
                          <p className="text-gray-500 text-xs">{employee.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-gray-400 font-mono text-sm">{employee.employeeCode}</td>
                    <td className="px-4 py-4 text-gray-400 text-sm">{employee.position}</td>
                    <td className="px-4 py-4">
                      <span className="inline-flex items-center px-2.5 py-1 bg-green-500/20 text-green-400 text-xs font-medium rounded-full">
                        {employee.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                          employee.hasDeductions 
                            ? 'bg-green-500/20 text-green-400 hover:bg-green-500/30' 
                            : 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                        }`}>
                          {employee.hasDeductions ? (
                            <><Check className="w-3 h-3" /> With Deductions</>
                          ) : (
                            <><X className="w-3 h-3" /> No Deductions</>
                          )}
                        </button>
                        <button 
                          onClick={() => handleQRClick(employee)}
                          className="p-1.5 text-gray-400 hover:text-[#facc15] transition-colors"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleEditClick(employee)}
                          className="p-1.5 text-gray-400 hover:text-[#facc15] transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-[#262626]">
            <span className="text-sm text-gray-400">
              Showing <span className="text-white">1</span> to <span className="text-white">10</span> of <span className="text-white">{totalEmployees}</span> employees
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 mr-2">Show:</span>
              <select className="px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded text-white text-sm focus:outline-none focus:border-[#facc15]">
                <option>10</option>
                <option>20</option>
                <option>50</option>
              </select>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-gray-400 hover:text-[#facc15] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                <button className="w-8 h-8 flex items-center justify-center bg-[#facc15] text-black text-sm font-medium rounded-lg">
                  1
                </button>
                <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] text-gray-400 text-sm rounded-lg hover:bg-[#262626] transition-colors">
                  2
                </button>
                <span className="text-gray-500 px-1">...</span>
                <button className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] text-gray-400 text-sm rounded-lg hover:bg-[#262626] transition-colors">
                  {totalPages}
                </button>
              </div>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-gray-400 hover:text-[#facc15] disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <QRCodeModal 
        employee={selectedEmployee} 
        isOpen={qrModalOpen} 
        onClose={() => setQrModalOpen(false)} 
      />
      <EditEmployeeModal 
        employee={selectedEmployee} 
        isOpen={editModalOpen} 
        onClose={() => setEditModalOpen(false)} 
      />
      <AddEmployeeModal 
        isOpen={addModalOpen} 
        onClose={() => setAddModalOpen(false)} 
      />
    </div>
  );
}
