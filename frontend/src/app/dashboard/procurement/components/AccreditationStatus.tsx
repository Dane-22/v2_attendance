// AccreditationStatus component - TEMPORARILY DISABLED
// This component uses procurement-related accreditation fields not suitable for an attendance system
// To enable, implement attendance-related accreditation functionality

'use client';

import { useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Clock } from 'lucide-react';
import { Supplier } from '../types';

interface AccreditationStatusProps {
  supplier: Supplier;
  onVerify?: (supplierId: string, approved: boolean, reason?: string) => void;
  isAdmin?: boolean;
}

export default function AccreditationStatus({
  supplier,
  onVerify,
  isAdmin = false,
}: AccreditationStatusProps) {
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const getStatusIcon = () => {
    switch (supplier.accreditationStatus) {
      case 'ACCREDITED':
        return <CheckCircle className="w-5 h-5" />;
      case 'NOT_ACCREDITED':
        return <XCircle className="w-5 h-5" />;
      case 'PENDING_VERIFICATION':
        return <Clock className="w-5 h-5" />;
      case 'REJECTED':
        return <XCircle className="w-5 h-5" />;
      default:
        return <AlertCircle className="w-5 h-5" />;
    }
  };

  const getStatusColor = () => {
    switch (supplier.accreditationStatus) {
      case 'ACCREDITED':
        return 'bg-green-500/10 text-green-400 border-green-500/30';
      case 'NOT_ACCREDITED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'PENDING_VERIFICATION':
        return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      case 'REJECTED':
        return 'bg-red-500/10 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/10 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusLabel = () => {
    switch (supplier.accreditationStatus) {
      case 'ACCREDITED':
        return 'Accredited';
      case 'NOT_ACCREDITED':
        return 'Not Accredited';
      case 'PENDING_VERIFICATION':
        return 'Pending Verification';
      case 'REJECTED':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const handleVerify = async (approved: boolean) => {
    if (!onVerify) return;

    setIsSubmitting(true);
    try {
      onVerify(supplier.id, approved, rejectionReason);
      setShowVerificationForm(false);
      setRejectionReason('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`p-4 rounded-lg border ${getStatusColor()}`}>
      <div className="flex items-start gap-3">
        {getStatusIcon()}
        <div className="flex-1">
          <p className="font-medium">{supplier.name}</p>
          <div className="mt-1 space-y-1">
            <p className="text-sm opacity-75">
              Status: <span className="font-medium">{getStatusLabel()}</span>
            </p>
            {supplier.accreditationExpiry && (
              <p className="text-sm opacity-75">
                Expires: <span className="font-medium">{new Date(supplier.accreditationExpiry).toLocaleDateString()}</span>
              </p>
            )}
          </div>

          {/* Admin Verification Form */}
          {isAdmin && supplier.accreditationStatus === 'PENDING_VERIFICATION' && (
            <div className="mt-4 pt-4 border-t border-current border-opacity-20 space-y-3">
              {!showVerificationForm ? (
                <button
                  onClick={() => setShowVerificationForm(true)}
                  className="text-sm font-medium px-3 py-1.5 bg-current bg-opacity-20 rounded hover:bg-opacity-30 transition-all"
                >
                  Review Document
                </button>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Rejection Reason (if applicable)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="Explain why you're rejecting this accreditation..."
                      className="w-full p-2 text-sm rounded bg-black/30 border border-current border-opacity-20 text-white placeholder-gray-500 focus:outline-none focus:border-opacity-100"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleVerify(true)}
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-1.5 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 disabled:opacity-50 transition-colors"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleVerify(false)}
                      disabled={isSubmitting}
                      className="flex-1 px-3 py-1.5 bg-red-500 text-white text-sm font-medium rounded hover:bg-red-600 disabled:opacity-50 transition-colors"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowVerificationForm(false);
                        setRejectionReason('');
                      }}
                      disabled={isSubmitting}
                      className="px-3 py-1.5 bg-gray-500 text-white text-sm font-medium rounded hover:bg-gray-600 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
