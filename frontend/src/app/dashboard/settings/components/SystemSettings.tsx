'use client';

import { useState } from 'react';
import { SystemSettings as SystemSettingsType } from '../types';
import { defaultSystemSettings, timezones, dateFormats, currencies, languages } from '../data';
import { Globe, Clock, Calendar, DollarSign, Languages, Database, Save, Check, RotateCcw } from 'lucide-react';

export default function SystemSettings() {
  const [settings, setSettings] = useState<SystemSettingsType>(defaultSystemSettings);
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

  const handleReset = () => {
    if (confirm('Are you sure you want to reset all system settings to default?')) {
      setSettings(defaultSystemSettings);
    }
  };

  return (
    <div className="space-y-6">
      {/* Regional Settings */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
            <Globe className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Regional Settings</h3>
            <p className="text-sm text-gray-400">Configure timezone, date format, and language</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Clock className="inline w-4 h-4 mr-2" />
              Timezone
            </label>
            <select
              value={settings.timezone}
              onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            >
              {timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>{tz.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Calendar className="inline w-4 h-4 mr-2" />
              Date Format
            </label>
            <select
              value={settings.dateFormat}
              onChange={(e) => setSettings({ ...settings, dateFormat: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            >
              {dateFormats.map((format) => (
                <option key={format.value} value={format.value}>{format.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <DollarSign className="inline w-4 h-4 mr-2" />
              Currency
            </label>
            <select
              value={settings.currency}
              onChange={(e) => setSettings({ ...settings, currency: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            >
              {currencies.map((currency) => (
                <option key={currency.value} value={currency.value}>{currency.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              <Languages className="inline w-4 h-4 mr-2" />
              Language
            </label>
            <select
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>{lang.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* System Preferences */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Database className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">System Preferences</h3>
            <p className="text-sm text-gray-400">Configure system behavior and data retention</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-[#262626] cursor-pointer">
            <div>
              <p className="text-white font-medium">Auto Logout</p>
              <p className="text-sm text-gray-400">Automatically log out after session timeout</p>
            </div>
            <button
              onClick={() => setSettings({ ...settings, autoLogout: !settings.autoLogout })}
              className={`relative w-14 h-7 rounded-full transition-colors ${
                settings.autoLogout ? 'bg-[#facc15]' : 'bg-[#262626]'
              }`}
            >
              <div
                className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                  settings.autoLogout ? 'left-8' : 'left-1'
                }`}
              />
            </button>
          </label>

          <div className="p-4 bg-[#0f0f0f] rounded-xl border border-[#262626]">
            <label className="block text-sm text-gray-400 mb-3">
              Data Retention Period (days)
              <span className="text-xs text-gray-500 ml-2">How long to keep activity logs</span>
            </label>
            <input
              type="number"
              min="30"
              max="3650"
              value={settings.dataRetention}
              onChange={(e) => setSettings({ ...settings, dataRetention: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#141414] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
            <p className="text-xs text-gray-500 mt-2">
              Activity logs and audit trails older than this will be automatically deleted
            </p>
          </div>
        </div>
      </div>

      {/* System Info */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <RotateCcw className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">System Information</h3>
            <p className="text-sm text-gray-400">Current system status and version</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-400">Version:</span>
            <span className="text-white ml-2">v2.0.1 (Latest)</span>
          </div>
          <div>
            <span className="text-gray-400">Last Updated:</span>
            <span className="text-white ml-2">April 20, 2026</span>
          </div>
          <div>
            <span className="text-gray-400">Database:</span>
            <span className="text-white ml-2">Connected</span>
          </div>
          <div>
            <span className="text-gray-400">API Status:</span>
            <span className="text-green-400 ml-2">Operational</span>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-[#262626]">
          <button
            onClick={handleReset}
            className="text-sm text-red-400 hover:text-red-300 transition-colors"
          >
            Reset all settings to default
          </button>
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
              <Check className="w-5 h-5" />
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
