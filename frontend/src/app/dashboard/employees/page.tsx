'use client';

import { useState, useEffect, useRef } from 'react';
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
  Check,
  Loader2
} from 'lucide-react';
import { employeeApi, Employee } from '@/lib/api';
import { useToast } from '@/components/Toast';

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
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();

  useEffect(() => {
    if (employee) {
      setFormData(employee);
      setImagePreview(employee.profileImage ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}${employee.profileImage}` : null);
    }
  }, [employee]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        showToast('error', 'Invalid file type. Only JPG, PNG, GIF, and WebP are allowed.');
        return;
      }

      // Validate file size (10MB)
      if (file.size > 10 * 1024 * 1024) {
        showToast('error', 'File size exceeds 10MB limit.');
        return;
      }

      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      img.onload = () => {
        const maxWidth = 800;
        const maxHeight = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: file.type,
                  lastModified: Date.now(),
                });
                resolve(compressedFile);
              } else {
                reject(new Error('Failed to compress image'));
              }
            },
            file.type,
            0.8
          );
        } else {
          reject(new Error('Failed to get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSave = async () => {
    if (!employee) return;

    setIsLoading(true);
    try {
      // Upload image if selected
      if (selectedImage) {
        const compressedImage = await compressImage(selectedImage);
        const uploadResponse = await employeeApi.uploadProfileImage(employee.id, compressedImage);
        const uploadedData = uploadResponse.data?.data;
        if (uploadedData?.profileImage) {
          setFormData(prev => ({ ...prev, profileImage: uploadedData.profileImage }));
        }
      }

      // Update employee data
      const updateResponse = await employeeApi.update(employee.id, formData);
      if (updateResponse.data?.success) {
        showToast('success', 'Employee updated successfully');
        onClose();
        // Refresh employee list
        window.location.reload();
      }
    } catch (error) {
      showToast('error', 'Failed to update employee');
      console.error('Error updating employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-[#1a1a1a] rounded-2xl border border-[#facc15]/30 shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <div>
            <h2 className="text-xl font-bold text-[#facc15]">Edit Employee</h2>
            <span className="inline-flex items-center px-2 py-0.5 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded mt-1">
              {employee.employeeCode || 'N/A'}
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
                <input
                  type="text"
                  value={formData.employeeCode || ''}
                  onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">First Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={formData.firstName || ''}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Middle Name</label>
                <input
                  type="text"
                  value={formData.middleName || ''}
                  onChange={(e) => setFormData({ ...formData, middleName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Last Name <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={formData.lastName || ''}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email Address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>
          </div>

          {/* Employment Details - 4 columns */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Employment Details</h3>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">Position <span className="text-red-400">*</span></label>
                <select
                  value={formData.position || ''}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                >
                  <option value="">Select Position</option>
                  <option>Worker</option>
                  <option>Admin</option>
                  <option>Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Status</label>
                <select
                  value={formData.status || ''}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                >
                  <option value="">Select Status</option>
                  <option>Active</option>
                  <option>Inactive</option>
                </select>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">Daily Rate (₱)</label>
                <input
                  type="number"
                  value={formData.dailyRate || ''}
                  onChange={(e) => setFormData({ ...formData, dailyRate: parseFloat(e.target.value) || 0 })}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
              <div className="flex items-end">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${formData.hasDeductions ? 'bg-green-500' : 'bg-gray-600'}`}
                    onClick={() => setFormData({ ...formData, hasDeductions: !formData.hasDeductions })}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${formData.hasDeductions ? 'translate-x-6' : 'translate-x-0.5'}`} />
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
              <div className="w-20 h-20 rounded-full bg-[#262626] flex items-center justify-center text-[#facc15] text-xl font-bold border-2 border-[#facc15]/30 overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span>{(employee.firstName || '')?.[0]}{(employee.lastName || '')?.[0]}</span>
                )}
              </div>
              <div className="flex-1 max-w-md">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-[#facc15]/30 rounded-lg text-[#facc15] hover:bg-[#facc15]/10 transition-colors"
                >
                  <UserPlus className="w-5 h-5" />
                  Choose New Profile Image
                </button>
                {selectedImage && (
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={() => {
                        setSelectedImage(null);
                        setImagePreview(employee.profileImage ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}${employee.profileImage}` : null);
                      }}
                      className="text-xs text-red-400 hover:text-red-300"
                    >
                      Remove selected image
                    </button>
                    <span className="text-xs text-gray-400">
                      {selectedImage.name} ({(selectedImage.size / 1024).toFixed(1)} KB)
                    </span>
                  </div>
                )}
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
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {isLoading ? 'Saving...' : 'Save Changes'}
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const { showToast } = useToast();

  const employeesPerPage = 10;
  const totalPages = Math.ceil(totalEmployees / employeesPerPage);

  // Fetch employees from API
  useEffect(() => {
    fetchEmployees();
  }, [page]);

  const fetchEmployees = async () => {
    try {
      setIsLoading(true);
      const response = await employeeApi.getAll({ page, limit: employeesPerPage, search });
      if (response.data?.success && response.data?.data) {
        setEmployees(response.data.data);
        setTotalEmployees(response.data.meta?.total || 0);
      }
    } catch (error) {
      showToast('error', 'Failed to load employees');
      console.error('Error fetching employees:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter employees based on search
  const filteredEmployees = employees.filter(emp =>
    (emp.firstName?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (emp.lastName?.toLowerCase() || '').includes(search.toLowerCase()) ||
    (emp.employeeCode?.toLowerCase() || '').includes(search.toLowerCase())
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
                        <div className="w-10 h-10 rounded-full bg-[#facc15] flex items-center justify-center text-black text-sm font-bold overflow-hidden">
                          {employee.profileImage ? (
                            <img
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5002'}${employee.profileImage}`}
                              alt={`${employee.firstName} ${employee.lastName}`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span>{(employee.firstName || '')?.[0]}{(employee.lastName || '')?.[0]}</span>
                          )}
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
