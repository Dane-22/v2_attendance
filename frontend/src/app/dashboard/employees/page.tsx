'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { useRouter } from 'next/navigation';
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
  Loader2,
  Trash2
} from 'lucide-react';
import { 
  employeeApi, 
  Employee, 
  adminApi, 
  Admin, 
  branchUserApi, 
  BranchUser,
  branchesApi,
  CreateAdminRequest,
  CreateBranchUserRequest,
  UpdateBranchUserRequest
} from '@/lib/api';
import { useToast } from '@/components/Toast';
import { useTheme } from '@/hooks/useTheme';

type UserType = 'employee' | 'admin' | 'branch_user';
type TabType = 'employees' | 'admins' | 'branch_users';

// QR Code Modal Component
// BACKUP OF ORIGINAL (lines 40-95): Placeholder QR code with Lucide icon, no download functionality
/*
function QRCodeModal({ employee, isOpen, onClose }: { employee: Employee | null; isOpen: boolean; onClose: () => void }) {
  const { classes } = useTheme();
  if (!isOpen || !employee) return null;
  const qrData = `https://jajr.xandree.com/employee/select_employee.php?auto_timeIn=1&select_branch=1&emp_id=12&emp_code=${employee.employeeCode}`;
  return ( ... );
}
*/
function QRCodeModal({ employee, isOpen, onClose }: { employee: Employee | null; isOpen: boolean; onClose: () => void }) {
  const { classes } = useTheme();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [qrFormat, setQrFormat] = useState<'JAJR-EMP' | 'LEGACY'>('JAJR-EMP');
  const [qrData, setQrData] = useState('');

  // Generate QR data based on selected format
  const generateQRData = (format: 'JAJR-EMP' | 'LEGACY', emp: Employee) => {
    if (format === 'JAJR-EMP') {
      return `JAJR-EMP:${emp.id}|${emp.employeeCode}|${emp.firstName} ${emp.lastName}`;
    } else {
      return `https://jajr.xandree.com/employee/select_employee.php?auto_timeIn=1&select_branch=1&emp_id=${emp.id}&emp_code=${emp.employeeCode}`;
    }
  };

  // Generate QR code on canvas when format or employee changes
  useEffect(() => {
    if (!isOpen || !employee) return;

    const data = generateQRData(qrFormat, employee);
    setQrData(data);

    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: 224,
        margin: 0,
        errorCorrectionLevel: 'M'
      }, (error) => {
        if (error) console.error('QR code generation error:', error);
      });
    }
  }, [qrFormat, employee, isOpen]);

  if (!isOpen || !employee) return null;

  // Handle download
  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `QR-${employee.employeeCode}-${qrFormat}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className={`w-full max-w-md ${classes.bgCardHover} rounded-2xl border border-[#facc15]/30 shadow-2xl shadow-[#facc15]/10 overflow-hidden`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${classes.border}`}>
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
          <h3 className={`text-xl font-bold ${classes.text} mb-1`}>{employee.firstName} {employee.lastName}</h3>
          <p className="text-[#facc15] font-medium mb-6">{employee.employeeCode}</p>

          {/* QR Code Display */}
          <div className="w-64 h-64 mx-auto bg-white rounded-xl p-4 mb-4 flex items-center justify-center">
            <canvas ref={canvasRef} className="w-56 h-56" />
          </div>

          {/* Format Toggle */}
          <div className="mb-4">
            <label className={`${classes.textMuted} text-xs font-semibold mb-2 block`}>Format:</label>
            <select
              value={qrFormat}
              onChange={(e) => setQrFormat(e.target.value as 'JAJR-EMP' | 'LEGACY')}
              className={`w-full px-3 py-2 ${classes.bgCard} ${classes.text} border ${classes.border} rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#facc15]`}
            >
              <option value="JAJR-EMP">JAJR-EMP (Recommended)</option>
              <option value="LEGACY">Legacy URL</option>
            </select>
          </div>

          <p className={`${classes.textMuted} text-sm mb-4`}>Scan this QR code for quick employee identification</p>

          {/* QR Data */}
          <div className={`${classes.bgCard} rounded-lg p-3 mb-6 text-left`}>
            <p className="text-[#facc15] text-xs font-semibold mb-1">QR DATA:</p>
            <p className={`${classes.textMuted} text-xs break-all font-mono`}>{qrData}</p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className={`flex-1 px-4 py-2 bg-[#262626] ${classes.text} rounded-lg hover:bg-[#333] transition-colors`}>
              Close
            </button>
            <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors">
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
  const { classes } = useTheme();

  useEffect(() => {
    if (employee) {
      setFormData(employee);
      setImagePreview(employee.profileImage ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5002'}${employee.profileImage}` : null);
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
                       setImagePreview(employee.profileImage ? `${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5002'}${employee.profileImage}` : null);
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
function AddEmployeeModal({ isOpen, onClose, onEmployeeAdded }: { isOpen: boolean; onClose: () => void; onEmployeeAdded: () => void }) {
  const [formData, setFormData] = useState<Partial<Employee>>({
    status: 'Active',
    hasDeductions: true,
    dailyRate: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const { showToast } = useToast();

  const handleAdd = async () => {
    // Validation
    if (!formData.employeeCode || !formData.firstName || !formData.lastName || !formData.email || !formData.position) {
      showToast('error', 'Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      const response = await employeeApi.create(formData);
      if (response.data?.success) {
        showToast('success', 'Employee added successfully');
        onClose();
        onEmployeeAdded();
      }
    } catch (error) {
      showToast('error', 'Failed to add employee');
      console.error('Error adding employee:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#262626] bg-[#141414]">
          <button onClick={onClose} className="px-6 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
            {isLoading ? 'Adding...' : 'Add Employee'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Unified User Modal Component (handles Employee, Admin, Branch User)
interface UserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userType: UserType;
  setUserType: (type: UserType) => void;
  mode: 'create' | 'edit';
  editData?: Employee | Admin | BranchUser | null;
}

function UserModal({ isOpen, onClose, onSuccess, userType, setUserType, mode, editData }: UserModalProps) {
  const { showToast } = useToast();
  const { classes } = useTheme();
  const [isLoading, setIsLoading] = useState(false);
  const [branches, setBranches] = useState<{ id: number; code: string; name: string }[]>([]);
  
  // Form states for different user types
  const [employeeForm, setEmployeeForm] = useState<Partial<Employee>>({
    status: 'Active',
    hasDeductions: true,
    dailyRate: 0
  });
  const [adminForm, setAdminForm] = useState<Partial<CreateAdminRequest>>({
    role: 'admin',
    permissions_enabled: false,
    permissions: []
  });
  const [branchUserForm, setBranchUserForm] = useState<Partial<CreateBranchUserRequest>>({
    password: '',
    branch_name: '',
    address: '',
    contact_number: ''
  });

  // Fetch branches for dropdowns
  useEffect(() => {
    if (isOpen) {
      branchesApi.getAll().then(response => {
        if (response.data?.success && response.data.data) {
          setBranches(response.data.data);
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  // Load edit data
  useEffect(() => {
    if (editData && mode === 'edit') {
      if (userType === 'employee' && 'employeeCode' in editData) {
        setEmployeeForm(editData);
      } else if (userType === 'admin' && 'role' in editData) {
        setAdminForm({
          username: editData.username,
          name: (editData as Admin).name,
          email: (editData as Admin).email,
          role: (editData as Admin).role,
          branch_code: (editData as Admin).branch_code || undefined,
          permissions: (editData as Admin).permissions || [],
          permissions_enabled: (editData as Admin).permissions_enabled || false
        });
      } else if (userType === 'branch_user' && 'branch_code' in editData) {
        // For edit mode, load branch_name from the branch data
        // Since the new API returns admin + branch, we need to handle this differently
        // For now, just load what we can from the current structure
        setBranchUserForm({
          password: '',
          branch_name: (editData as BranchUser).branch_name || '',
          address: '',
          contact_number: ''
        });
      }
    }
  }, [editData, mode, userType]);

  const resetForms = () => {
    setEmployeeForm({ status: 'Active', hasDeductions: true, dailyRate: 0 });
    setAdminForm({ role: 'admin', permissions_enabled: false, permissions: [] });
    setBranchUserForm({ password: '', branch_name: '', address: '', contact_number: '' });
  };

  const handleClose = () => {
    resetForms();
    onClose();
  };

  const validatePassword = (password: string): boolean => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber;
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    try {
      if (userType === 'employee') {
        if (!employeeForm.firstName || !employeeForm.lastName || !employeeForm.email || !employeeForm.position) {
          showToast('error', 'Please fill in all required fields');
          setIsLoading(false);
          return;
        }
        
        if (mode === 'edit' && editData && 'id' in editData) {
          const response = await employeeApi.update(editData.id, employeeForm);
          if (response.data?.success) {
            showToast('success', 'Employee updated successfully');
            handleClose();
            onSuccess();
          }
        } else {
          const response = await employeeApi.create(employeeForm);
          if (response.data?.success) {
            showToast('success', 'Employee added successfully');
            handleClose();
            onSuccess();
          }
        }
      } else if (userType === 'admin') {
        if (!adminForm.username || (!editData && !adminForm.password) || !adminForm.name || !adminForm.email || !adminForm.role) {
          showToast('error', 'Please fill in all required fields');
          setIsLoading(false);
          return;
        }

        if (adminForm.password && !validatePassword(adminForm.password)) {
          showToast('error', 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
          setIsLoading(false);
          return;
        }

        if (mode === 'edit' && editData && 'id' in editData) {
          const updateData: Partial<CreateAdminRequest> = {};
          if (adminForm.username) updateData.username = adminForm.username;
          if (adminForm.name) updateData.name = adminForm.name;
          if (adminForm.email) updateData.email = adminForm.email;
          if (adminForm.role) updateData.role = adminForm.role;
          if (adminForm.branch_code) updateData.branch_code = adminForm.branch_code;
          if (adminForm.password) updateData.password = adminForm.password;

          const response = await adminApi.update(editData.id, updateData);
          if (response.data?.success) {
            showToast('success', 'Admin updated successfully');
            handleClose();
            onSuccess();
          }
        } else {
          const response = await adminApi.create(adminForm as CreateAdminRequest);
          if (response.data?.success) {
            showToast('success', 'Admin added successfully');
            handleClose();
            onSuccess();
          }
        }
      } else if (userType === 'branch_user') {
        if (!branchUserForm.password || !branchUserForm.branch_name) {
          showToast('error', 'Password and branch name are required');
          setIsLoading(false);
          return;
        }

        if (branchUserForm.password && !validatePassword(branchUserForm.password)) {
          showToast('error', 'Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number');
          setIsLoading(false);
          return;
        }

        if (mode === 'edit' && editData && 'id' in editData) {
          const updateData: Partial<UpdateBranchUserRequest> = {};
          if (branchUserForm.password) updateData.password = branchUserForm.password;
          if (branchUserForm.branch_name) updateData.branch_name = branchUserForm.branch_name;
          if (branchUserForm.address !== undefined) updateData.address = branchUserForm.address;
          if (branchUserForm.contact_number !== undefined) updateData.contact_number = branchUserForm.contact_number;

          const response = await branchUserApi.update(editData.id, updateData);
          if (response.data?.success) {
            showToast('success', 'Branch user updated successfully');
            handleClose();
            onSuccess();
          }
        } else {
          const response = await branchUserApi.create(branchUserForm as CreateBranchUserRequest);
          if (response.data?.success) {
            showToast('success', 'Branch user added successfully');
            handleClose();
            onSuccess();
          }
        }
      }
    } catch (error: any) {
      showToast('error', error.response?.data?.message || `Failed to ${mode} ${userType.replace('_', ' ')}`);
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const getTitle = () => {
    const action = mode === 'edit' ? 'Edit' : 'Add New';
    const type = userType === 'branch_user' ? 'Branch User' : userType.charAt(0).toUpperCase() + userType.slice(1);
    return `${action} ${type}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl bg-[#1a1a1a] rounded-2xl border border-[#facc15]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#262626]">
          <div>
            <h2 className="text-xl font-bold text-[#facc15]">{getTitle()}</h2>
            {mode === 'edit' && editData && (
              <span className="inline-flex items-center px-2 py-0.5 bg-[#facc15]/20 text-[#facc15] text-xs font-medium rounded mt-1">
                ID: {editData.id}
              </span>
            )}
          </div>
          <button onClick={handleClose} className="p-1 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* User Type Selector (only for create mode) */}
          {mode === 'create' && (
            <div className="mb-6">
              <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">User Type</h3>
              <div className="grid grid-cols-3 gap-4">
                {(['employee', 'admin', 'branch_user'] as UserType[]).map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => {
                      setUserType(type);
                      resetForms();
                    }}
                    className={`px-4 py-3 rounded-xl font-medium text-sm transition-all ${
                      userType === type
                        ? 'bg-[#facc15] text-black'
                        : 'bg-[#262626] text-gray-400 hover:bg-[#333] hover:text-white'
                    }`}
                  >
                    {type === 'branch_user' ? 'Branch User' : type.charAt(0).toUpperCase() + type.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Common Fields */}
          <div className="mb-6">
            <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Basic Information</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">
                  {userType === 'employee' ? 'First Name' : 'Name'} <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  value={userType === 'employee' ? employeeForm.firstName || '' : adminForm.name || ''}
                  onChange={(e) => {
                    if (userType === 'employee') {
                      setEmployeeForm({ ...employeeForm, firstName: e.target.value });
                    } else {
                      setAdminForm({ ...adminForm, name: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
              {userType === 'employee' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Middle Name</label>
                  <input
                    type="text"
                    value={employeeForm.middleName || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, middleName: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              )}
              {userType === 'employee' && (
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Last Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={employeeForm.lastName || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, lastName: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              )}
              <div>
                <label className="block text-gray-400 text-sm mb-1">Email Address <span className="text-red-400">*</span></label>
                <input
                  type="email"
                  value={userType === 'employee' ? employeeForm.email || '' : adminForm.email || ''}
                  onChange={(e) => {
                    if (userType === 'employee') {
                      setEmployeeForm({ ...employeeForm, email: e.target.value });
                    } else {
                      setAdminForm({ ...adminForm, email: e.target.value });
                    }
                  }}
                  className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                />
              </div>
            </div>
          </div>

          {/* Employee-Specific Fields */}
          {userType === 'employee' && (
            <div className="mb-6">
              <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Employment Details</h3>
              <div className="grid grid-cols-4 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Employee Code</label>
                  <input
                    type="text"
                    placeholder="Auto-generated if empty"
                    value={employeeForm.employeeCode || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, employeeCode: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                  <p className="text-[10px] text-gray-500 mt-1 italic">
                    Leave empty to auto-generate ({
                      !employeeForm.position || employeeForm.position === 'Worker' ? 'E0001' :
                      employeeForm.position === 'Admin' ? 'ADMIN-2026-0001' :
                      employeeForm.position === 'Engineer' ? 'ENG-2026-0001' :
                      employeeForm.position === 'Developer' ? 'DEV-2026-0001' : 'format'
                    })
                  </p>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Position <span className="text-red-400">*</span></label>
                  <select
                    value={employeeForm.position || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, position: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  >
                    <option value="">Select Position</option>
                    <option value="Worker">Worker</option>
                    <option value="Admin">Admin</option>
                    <option value="Engineer">Engineer</option>
                    <option value="Developer">Developer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Department</label>
                  <input
                    type="text"
                    value={employeeForm.department || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, department: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Branch</label>
                  <select
                    value={employeeForm.branchCode || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, branchCode: e.target.value || null })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.code}>{branch.name} ({branch.code})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Status</label>
                  <select
                    value={employeeForm.status || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, status: e.target.value })}
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
                    value={employeeForm.dailyRate || ''}
                    onChange={(e) => setEmployeeForm({ ...employeeForm, dailyRate: parseFloat(e.target.value) || 0 })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <div
                      className={`w-12 h-6 rounded-full transition-colors ${employeeForm.hasDeductions ? 'bg-green-500' : 'bg-gray-600'}`}
                      onClick={() => setEmployeeForm({ ...employeeForm, hasDeductions: !employeeForm.hasDeductions })}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${employeeForm.hasDeductions ? 'translate-x-6' : 'translate-x-0.5'}`} />
                    </div>
                    <span className="text-white text-sm">With SSS/PhilHealth/PagIBIG</span>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Admin-Specific Fields */}
          {userType === 'admin' && (
            <div className="mb-6">
              <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Admin Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Username <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={adminForm.username || ''}
                    onChange={(e) => setAdminForm({ ...adminForm, username: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">
                    Password {mode === 'create' && <span className="text-red-400">*</span>}
                    {mode === 'edit' && <span className="text-gray-500 text-xs"> (leave blank to keep unchanged)</span>}
                  </label>
                  <input
                    type="password"
                    value={adminForm.password || ''}
                    onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                    placeholder={mode === 'edit' ? 'Leave blank to keep unchanged' : ''}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Role <span className="text-red-400">*</span></label>
                  <select
                    value={adminForm.role || ''}
                    onChange={(e) => setAdminForm({ ...adminForm, role: e.target.value as 'admin' | 'super_admin' })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  >
                    <option value="">Select Role</option>
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Branch Code</label>
                  <select
                    value={adminForm.branch_code || ''}
                    onChange={(e) => setAdminForm({ ...adminForm, branch_code: e.target.value || undefined })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  >
                    <option value="">No Branch</option>
                    {branches.map((branch) => (
                      <option key={branch.id} value={branch.code}>{branch.name} ({branch.code})</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-3">
                <span className="text-[#facc15]">ℹ</span> Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number
              </p>
            </div>
          )}

          {/* Sidebar Permissions Section */}
          {userType === 'admin' && (
            <div className="mb-6">
              <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Sidebar Permissions</h3>

              {/* Enable Permissions Toggle */}
              <div className="mb-4">
                <label className="flex items-center gap-3 cursor-pointer">
                  <div
                    className={`w-12 h-6 rounded-full transition-colors ${adminForm.permissions_enabled ? 'bg-green-500' : 'bg-gray-600'}`}
                    onClick={() => setAdminForm({ ...adminForm, permissions_enabled: !adminForm.permissions_enabled })}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform mt-0.5 ${adminForm.permissions_enabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                  </div>
                  <span className="text-white text-sm">Enable Permissions</span>
                </label>
              </div>

              {adminForm.permissions_enabled && (
                <>
                  {/* Quick Templates */}
                  <div className="mb-4">
                    <label className="block text-gray-400 text-sm mb-2">Quick Templates</label>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { name: 'Full Access', permissions: ['dashboard', 'attendance', 'notifications', 'employees', 'documents', 'logs', 'attendance-audit', 'finance', 'finance/payroll', 'finance/overtime', 'finance/billing', 'finance/cash-advance', 'finance/attendance-audit', 'procurement', 'settings'] },
                        { name: 'Finance Only', permissions: ['dashboard', 'finance', 'finance/payroll', 'finance/overtime', 'finance/billing', 'finance/cash-advance', 'finance/attendance-audit'] },
                        { name: 'HR Only', permissions: ['dashboard', 'employees', 'documents', 'logs'] },
                        { name: 'Basic Access', permissions: ['dashboard', 'attendance', 'notifications'] }
                      ].map((template) => (
                        <button
                          key={template.name}
                          type="button"
                          onClick={() => setAdminForm({ ...adminForm, permissions: template.permissions })}
                          className="px-3 py-1.5 bg-[#262626] text-gray-300 text-sm rounded-lg hover:bg-[#333] hover:text-white transition-colors border border-[#262626] hover:border-[#facc15]/30"
                        >
                          {template.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Navigation Items Checkboxes */}
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Navigation Items</label>
                    <div className="grid grid-cols-2 gap-2 max-h-64 overflow-y-auto pr-2">
                      {[
                        { id: 'dashboard', label: 'Dashboard' },
                        { id: 'attendance', label: 'Site Attendance' },
                        { id: 'notifications', label: 'Notification' },
                        { id: 'employees', label: 'Employee List' },
                        { id: 'documents', label: 'Documents' },
                        { id: 'logs', label: 'Activity Logs' },
                        { id: 'attendance-audit', label: 'Attendance Audit' },
                        { id: 'procurement', label: 'Procurement' },
                        { id: 'settings', label: 'Settings' }
                      ].map((item) => (
                        <label key={item.id} className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={(adminForm.permissions || []).includes(item.id)}
                            onChange={(e) => {
                              const currentPermissions = adminForm.permissions || [];
                              if (e.target.checked) {
                                setAdminForm({ ...adminForm, permissions: [...currentPermissions, item.id] });
                              } else {
                                setAdminForm({ ...adminForm, permissions: currentPermissions.filter((p: string) => p !== item.id) });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-[#141414] text-[#facc15] focus:ring-[#facc15]"
                          />
                          <span className="text-gray-300 text-sm">{item.label}</span>
                        </label>
                      ))}

                      {/* Finance with sub-items */}
                      <div className="col-span-2 mt-2 pt-2 border-t border-[#262626]">
                        <label className="flex items-center gap-2 cursor-pointer mb-2">
                          <input
                            type="checkbox"
                            checked={(adminForm.permissions || []).includes('finance')}
                            onChange={(e) => {
                              const currentPermissions = adminForm.permissions || [];
                              if (e.target.checked) {
                                setAdminForm({ ...adminForm, permissions: [...currentPermissions, 'finance'] });
                              } else {
                                setAdminForm({ ...adminForm, permissions: currentPermissions.filter((p: string) => p !== 'finance' && !p.startsWith('finance/')) });
                              }
                            }}
                            className="w-4 h-4 rounded border-gray-600 bg-[#141414] text-[#facc15] focus:ring-[#facc15]"
                          />
                          <span className="text-[#facc15] font-medium text-sm">Finance</span>
                        </label>
                        <div className="ml-6 grid grid-cols-2 gap-2">
                          {[
                            { id: 'finance/payroll', label: 'Payroll' },
                            { id: 'finance/overtime', label: 'Overtime' },
                            { id: 'finance/billing', label: 'Billing' },
                            { id: 'finance/cash-advance', label: 'Cash Advance' },
                            { id: 'finance/attendance-audit', label: 'Attendance Summary' }
                          ].map((subItem) => (
                            <label key={subItem.id} className="flex items-center gap-2 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={(adminForm.permissions || []).includes(subItem.id)}
                                onChange={(e) => {
                                  const currentPermissions = adminForm.permissions || [];
                                  if (e.target.checked) {
                                    // Auto-include parent finance if sub-item is selected
                                    const newPermissions = currentPermissions.includes('finance') ? currentPermissions : [...currentPermissions, 'finance'];
                                    setAdminForm({ ...adminForm, permissions: [...newPermissions, subItem.id] });
                                  } else {
                                    setAdminForm({ ...adminForm, permissions: currentPermissions.filter((p: string) => p !== subItem.id) });
                                  }
                                }}
                                className="w-4 h-4 rounded border-gray-600 bg-[#141414] text-[#facc15] focus:ring-[#facc15]"
                              />
                              <span className="text-gray-400 text-sm">{subItem.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              )}

              <p className="text-gray-500 text-xs mt-3 flex items-center gap-1">
                <span className="text-[#facc15]">ℹ</span> Branch-prefixed usernames (branch-a, etc.) bypass permissions
              </p>
              <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                <span className="text-[#facc15]">ℹ</span> Super admins always have full access
              </p>
            </div>
          )}

          {/* Branch User-Specific Fields */}
          {userType === 'branch_user' && (
            <div className="mb-6">
              <h3 className="text-[#facc15] font-semibold mb-4 pb-2 border-b border-[#262626]">Branch User Details</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-gray-400 text-sm mb-1">Branch Name <span className="text-red-400">*</span></label>
                  <input
                    type="text"
                    value={branchUserForm.branch_name || ''}
                    onChange={(e) => setBranchUserForm({ ...branchUserForm, branch_name: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Password {mode === 'create' && <span className="text-red-400">*</span>}</label>
                  <input
                    type="password"
                    value={branchUserForm.password || ''}
                    onChange={(e) => setBranchUserForm({ ...branchUserForm, password: e.target.value })}
                    placeholder={mode === 'edit' ? 'Leave blank to keep unchanged' : ''}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#facc15]/30 rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Address</label>
                  <input
                    type="text"
                    value={branchUserForm.address || ''}
                    onChange={(e) => setBranchUserForm({ ...branchUserForm, address: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm mb-1">Contact Number</label>
                  <input
                    type="text"
                    value={branchUserForm.contact_number || ''}
                    onChange={(e) => setBranchUserForm({ ...branchUserForm, contact_number: e.target.value })}
                    className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
                  />
                </div>
              </div>
              <p className="text-gray-500 text-xs mt-3">
                <span className="text-[#facc15]">ℹ</span> Username and branch code will be auto-generated
              </p>
              <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                <span className="text-[#facc15]">ℹ</span> Password must be at least 8 characters with 1 uppercase, 1 lowercase, and 1 number
              </p>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#262626] bg-[#141414]">
          <button onClick={handleClose} className="px-6 py-2 bg-[#262626] text-white rounded-lg hover:bg-[#333] transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="flex items-center gap-2 px-6 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : mode === 'edit' ? <Save className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isLoading ? (mode === 'edit' ? 'Saving...' : 'Adding...') : (mode === 'edit' ? 'Save Changes' : `Add ${userType === 'branch_user' ? 'Branch User' : userType.charAt(0).toUpperCase() + userType.slice(1)}`)}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function EmployeesPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('employees');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedAdmin, setSelectedAdmin] = useState<Admin | null>(null);
  const [selectedBranchUser, setSelectedBranchUser] = useState<BranchUser | null>(null);
  const [modalUserType, setModalUserType] = useState<UserType>('employee');
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');

  // Data states
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [branchUsers, setBranchUsers] = useState<BranchUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalItems, setTotalItems] = useState(0);

  const { showToast } = useToast();
  const { classes } = useTheme();

  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Fetch data based on active tab
  useEffect(() => {
    fetchData();
  }, [page, itemsPerPage, activeTab]);

  // Debounced search effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchData();
    }, 500);
    return () => clearTimeout(timer);
  }, [search, activeTab]);

  const fetchData = async () => {
    try {
      setIsLoading(true);
      
      if (activeTab === 'employees') {
        const response = await employeeApi.getAll({ page, limit: itemsPerPage, search });
        if (response.data?.success && response.data?.data) {
          setEmployees(response.data.data);
          setTotalItems(response.data.meta?.total || 0);
        }
      } else if (activeTab === 'admins') {
        const response = await adminApi.getAll({ page, limit: itemsPerPage, search });
        if (response.data?.success && response.data?.data) {
          setAdmins(response.data.data);
          setTotalItems(response.data.meta?.total || 0);
        }
      } else if (activeTab === 'branch_users') {
        const response = await branchUserApi.getAll({ page, limit: itemsPerPage, search });
        if (response.data?.success && response.data?.data) {
          setBranchUsers(response.data.data);
          setTotalItems(response.data.meta?.total || 0);
        }
      }
    } catch (error) {
      showToast('error', `Failed to load ${activeTab.replace('_', ' ')}`);
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setSearch('');
  };

  const handleQRClick = (employee: Employee) => {
    setSelectedEmployee(employee);
    setQrModalOpen(true);
  };

  const handleEditClick = (item: Employee | Admin | BranchUser) => {
    if (activeTab === 'employees' && 'employeeCode' in item) {
      setSelectedEmployee(item);
      setModalUserType('employee');
      setSelectedAdmin(null);
      setSelectedBranchUser(null);
    } else if (activeTab === 'admins' && 'role' in item) {
      setSelectedAdmin(item as Admin);
      setModalUserType('admin');
      setSelectedEmployee(null);
      setSelectedBranchUser(null);
    } else if (activeTab === 'branch_users' && 'branch_code' in item) {
      setSelectedBranchUser(item as BranchUser);
      setModalUserType('branch_user');
      setSelectedEmployee(null);
      setSelectedAdmin(null);
    }
    setModalMode('edit');
    setEditModalOpen(true);
  };

  const handleAddClick = () => {
    setModalMode('create');
    setModalUserType(activeTab === 'branch_users' ? 'branch_user' : activeTab === 'admins' ? 'admin' : 'employee');
    setSelectedEmployee(null);
    setSelectedAdmin(null);
    setSelectedBranchUser(null);
    setAddModalOpen(true);
  };

  const handleDeleteClick = async (item: Employee | Admin | BranchUser) => {
    if (!confirm(`Are you sure you want to delete this ${activeTab.slice(0, -1)}?`)) return;
    
    try {
      let response;
      if (activeTab === 'employees' && 'employeeCode' in item) {
        response = await employeeApi.delete(item.id);
      } else if (activeTab === 'admins' && 'role' in item) {
        response = await adminApi.delete(item.id);
      } else if (activeTab === 'branch_users' && 'branch_code' in item) {
        response = await branchUserApi.delete(item.id);
      }
      
      if (response?.data?.success) {
        showToast('success', 'Deleted successfully');
        fetchData();
      }
    } catch (error) {
      showToast('error', 'Failed to delete');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl font-bold ${classes.text}`}>User Management</h1>
          <p className={`${classes.textMuted} text-sm mt-0.5`}>Total {activeTab === 'branch_users' ? 'Branch Users' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}: {totalItems}</p>
        </div>
        <div className="flex items-center gap-4">
          <p className={`${classes.textMuted} text-sm hidden sm:block`}>Manage users across all tables</p>
          <button 
            onClick={handleAddClick}
            className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            Add {activeTab === 'branch_users' ? 'Branch User' : activeTab === 'admins' ? 'Admin' : 'Employee'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-[#262626]">
        {(['employees', 'admins', 'branch_users'] as TabType[]).map((tab) => (
          <button
            key={tab}
            onClick={() => handleTabChange(tab)}
            className={`px-4 py-3 font-medium text-sm transition-colors relative ${
              activeTab === tab
                ? 'text-[#facc15]'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'branch_users' ? 'Branch Users' : tab.charAt(0).toUpperCase() + tab.slice(1)}
            {activeTab === tab && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#facc15]" />
            )}
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 ${classes.textMuted}`} />
        <input
          type="text"
          placeholder={`Search ${activeTab.replace('_', ' ')} by name, code...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={`w-full pl-11 pr-4 py-3 ${classes.bgCard} ${classes.border} rounded-lg ${classes.text} placeholder-gray-500 focus:outline-none focus:border-[#facc15]`}
        />
      </div>

      {/* Existing Items Section */}
      <div>
        <h2 className="text-[#facc15] font-bold text-lg mb-4">
          Existing {activeTab === 'branch_users' ? 'Branch Users' : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </h2>

        {/* Dynamic Table */}
        <div className={`${classes.bgCard} rounded-xl ${classes.border} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className={`border-b ${classes.border}`}>
                  {activeTab === 'employees' && (
                    <>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Employee</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Code</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Position</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Status</th>
                    </>
                  )}
                  {activeTab === 'admins' && (
                    <>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Admin</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Username</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Role</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Branch</th>
                    </>
                  )}
                  {activeTab === 'branch_users' && (
                    <>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Branch User</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Username</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Branch</th>
                      <th className={`px-4 py-4 text-left text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Branch Name</th>
                    </>
                  )}
                  <th className={`px-4 py-4 text-right text-xs font-medium ${classes.textMuted} uppercase tracking-wider`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                      <span className="mt-2 block">Loading...</span>
                    </td>
                  </tr>
                ) : (
                  <>
                    {activeTab === 'employees' && employees.map((employee) => (
                      <tr key={employee.id} className={`border-b ${classes.border} last:border-0 ${classes.bgCardHover}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#facc15] flex items-center justify-center text-black text-sm font-bold overflow-hidden">
                              {employee.profileImage ? (
                                <img
                                  src={`${process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5002'}${employee.profileImage}`}
                                  alt={`${employee.firstName} ${employee.lastName}`}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <span>{(employee.firstName || '')?.[0]}{(employee.lastName || '')?.[0]}</span>
                              )}
                            </div>
                            <div>
                              <p className={`${classes.text} font-medium text-sm`}>{employee.firstName} {employee.lastName}</p>
                              <p className={`${classes.textMuted} text-xs`}>{employee.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 ${classes.textMuted} font-mono text-sm`}>{employee.employeeCode}</td>
                        <td className={`px-4 py-4 ${classes.textMuted} text-sm`}>{employee.position}</td>
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
                              className={`p-1.5 ${classes.textMuted} hover:text-[#facc15] transition-colors`}
                              title="Generate QR Code"
                            >
                              <QrCode className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => router.push(`/dashboard/employees/face-registration?id=${employee.id}`)}
                              className={`p-1.5 ${classes.textMuted} hover:text-[#facc15] transition-colors`}
                              title="Register Face"
                            >
                              <UserPlus className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditClick(employee)}
                              className={`p-1.5 ${classes.textMuted} hover:text-[#facc15] transition-colors`}
                              title="Edit Employee"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activeTab === 'admins' && admins.map((admin) => (
                      <tr key={admin.id} className={`border-b ${classes.border} last:border-0 ${classes.bgCardHover}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#facc15] flex items-center justify-center text-black text-sm font-bold">
                              {(admin.name || '')?.[0]}
                            </div>
                            <div>
                              <p className={`${classes.text} font-medium text-sm`}>{admin.name}</p>
                              <p className={`${classes.textMuted} text-xs`}>{admin.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 ${classes.textMuted} font-mono text-sm`}>{admin.username}</td>
                        <td className="px-4 py-4">
                          <span className={`inline-flex items-center px-2.5 py-1 text-xs font-medium rounded-full ${
                            admin.role === 'super_admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                          </span>
                        </td>
                        <td className={`px-4 py-4 ${classes.textMuted} text-sm`}>{admin.branch_code || '-'}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditClick(admin)}
                              className={`p-1.5 ${classes.textMuted} hover:text-[#facc15] transition-colors`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(admin)}
                              className={`p-1.5 ${classes.textMuted} hover:text-red-400 transition-colors`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {activeTab === 'branch_users' && branchUsers.map((branchUser) => (
                      <tr key={branchUser.id} className={`border-b ${classes.border} last:border-0 ${classes.bgCardHover}`}>
                        <td className="px-4 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#facc15] flex items-center justify-center text-black text-sm font-bold">
                              {(branchUser.username || '')?.[0]}
                            </div>
                            <div>
                              <p className={`${classes.text} font-medium text-sm`}>{branchUser.username}</p>
                              <p className={`${classes.textMuted} text-xs`}>Branch User</p>
                            </div>
                          </div>
                        </td>
                        <td className={`px-4 py-4 ${classes.textMuted} font-mono text-sm`}>{branchUser.username}</td>
                        <td className={`px-4 py-4 ${classes.textMuted} text-sm`}>{branchUser.branch_code}</td>
                        <td className={`px-4 py-4 ${classes.textMuted} text-sm`}>{branchUser.branch_name}</td>
                        <td className="px-4 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button 
                              onClick={() => handleEditClick(branchUser)}
                              className={`p-1.5 ${classes.textMuted} hover:text-[#facc15] transition-colors`}
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteClick(branchUser)}
                              className={`p-1.5 ${classes.textMuted} hover:text-red-400 transition-colors`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between px-4 py-4 border-t border-[#262626]">
            <span className="text-sm text-gray-400">
              Showing <span className="text-white">{Math.min((page - 1) * itemsPerPage + 1, totalItems)}</span> to <span className="text-white">{Math.min(page * itemsPerPage, totalItems)}</span> of <span className="text-white">{totalItems}</span> {activeTab}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-400 mr-2">Show:</span>
              <select 
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setPage(1);
                }}
                className="px-3 py-1.5 bg-[#1a1a1a] border border-[#262626] rounded text-white text-sm focus:outline-none focus:border-[#facc15]"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 bg-[#1a1a1a] border border-[#262626] rounded-lg text-gray-400 hover:text-[#facc15] disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1">
                {(() => {
                  const pages = [];
                  const showPages = 5;
                  let startPage = Math.max(1, page - Math.floor(showPages / 2));
                  let endPage = Math.min(totalPages, startPage + showPages - 1);
                  
                  if (endPage - startPage + 1 < showPages) {
                    startPage = Math.max(1, endPage - showPages + 1);
                  }
                  
                  if (startPage > 1) {
                    pages.push(
                      <button
                        key={1}
                        onClick={() => setPage(1)}
                        className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] text-gray-400 text-sm rounded-lg hover:bg-[#262626] transition-colors"
                      >
                        1
                      </button>
                    );
                    if (startPage > 2) {
                      pages.push(<span key="start-ellipsis" className="text-gray-500 px-1">...</span>);
                    }
                  }
                  
                  for (let i = startPage; i <= endPage; i++) {
                    pages.push(
                      <button
                        key={i}
                        onClick={() => setPage(i)}
                        className={`w-8 h-8 flex items-center justify-center text-sm font-medium rounded-lg transition-colors ${
                          page === i 
                            ? 'bg-[#facc15] text-black' 
                            : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#262626]'
                        }`}
                      >
                        {i}
                      </button>
                    );
                  }
                  
                  if (endPage < totalPages) {
                    if (endPage < totalPages - 1) {
                      pages.push(<span key="end-ellipsis" className="text-gray-500 px-1">...</span>);
                    }
                    pages.push(
                      <button
                        key={totalPages}
                        onClick={() => setPage(totalPages)}
                        className="w-8 h-8 flex items-center justify-center bg-[#1a1a1a] text-gray-400 text-sm rounded-lg hover:bg-[#262626] transition-colors"
                      >
                        {totalPages}
                      </button>
                    );
                  }
                  
                  return pages;
                })()}
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
      
      {/* Create Modal */}
      <UserModal
        isOpen={addModalOpen}
        onClose={() => setAddModalOpen(false)}
        onSuccess={fetchData}
        userType={modalUserType}
        setUserType={setModalUserType}
        mode="create"
      />
      
      {/* Edit Modal */}
      <UserModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onSuccess={fetchData}
        userType={modalUserType}
        setUserType={setModalUserType}
        mode="edit"
        editData={modalUserType === 'employee' ? selectedEmployee : modalUserType === 'admin' ? selectedAdmin : selectedBranchUser}
      />
    </div>
  );
}
