'use client';

import { useState } from 'react';
import { CompanySettings, WorkingHours } from '../types';
import { defaultCompanySettings, defaultWorkingHours } from '../data';
import { Building2, Clock, MapPin, Phone, Mail, Globe, FileText, Save } from 'lucide-react';

export default function GeneralSettings() {
  const [company, setCompany] = useState<CompanySettings>(defaultCompanySettings);
  const [workingHours, setWorkingHours] = useState<WorkingHours>(defaultWorkingHours);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Company Information</h3>
            <p className="text-sm text-gray-400">Manage your company details</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Company Name</label>
            <input
              type="text"
              value={company.companyName}
              onChange={(e) => setCompany({ ...company, companyName: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Tax ID / VAT Number</label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={company.taxId}
                onChange={(e) => setCompany({ ...company, taxId: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Address</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={company.address}
                onChange={(e) => setCompany({ ...company, address: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={company.phone}
                onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="email"
                value={company.email}
                onChange={(e) => setCompany({ ...company, email: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm text-gray-400 mb-2">Website</label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={company.website}
                onChange={(e) => setCompany({ ...company, website: e.target.value })}
                className="w-full pl-10 pr-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Working Hours */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Working Hours</h3>
            <p className="text-sm text-gray-400">Configure default working schedule</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Work Start Time</label>
            <input
              type="time"
              value={workingHours.start}
              onChange={(e) => setWorkingHours({ ...workingHours, start: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Work End Time</label>
            <input
              type="time"
              value={workingHours.end}
              onChange={(e) => setWorkingHours({ ...workingHours, end: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Grace Period (minutes)
              <span className="text-xs text-gray-500 ml-2">Buffer before marking late</span>
            </label>
            <input
              type="number"
              min="0"
              max="60"
              value={workingHours.gracePeriod}
              onChange={(e) => setWorkingHours({ ...workingHours, gracePeriod: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Overtime Threshold (minutes)
              <span className="text-xs text-gray-500 ml-2">Minimum for overtime eligibility</span>
            </label>
            <input
              type="number"
              min="0"
              max="120"
              value={workingHours.overtimeThreshold}
              onChange={(e) => setWorkingHours({ ...workingHours, overtimeThreshold: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>
        </div>
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={isSaving}
          className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
            saved
              ? 'bg-green-500 text-white'
              : 'bg-[#facc15] text-black hover:bg-yellow-400'
          }`}
        >
          {isSaving ? (
            <>
              <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              Saving...
            </>
          ) : saved ? (
            <>
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Saved!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
