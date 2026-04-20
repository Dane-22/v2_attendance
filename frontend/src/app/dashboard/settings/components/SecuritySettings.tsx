'use client';

import { useState } from 'react';
import { SecuritySettings as SecuritySettingsType } from '../types';
import { defaultSecuritySettings } from '../data';
import { Shield, Lock, Key, Smartphone, History, AlertTriangle, Save, Check, Eye, EyeOff } from 'lucide-react';

export default function SecuritySettings() {
  const [settings, setSettings] = useState<SecuritySettingsType>(defaultSecuritySettings);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 1000);
  };

  const toggleSetting = (key: keyof SecuritySettingsType) => {
    if (typeof settings[key] === 'boolean') {
      setSettings({ ...settings, [key]: !settings[key] });
    }
  };

  return (
    <div className="space-y-6">
      {/* Password Change */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
            <Key className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Change Password</h3>
            <p className="text-sm text-gray-400">Update your account password</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Current Password</label>
            <div className="relative">
              <input
                type={showCurrentPassword ? 'text' : 'password'}
                placeholder="Enter current password"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
              <button
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">New Password</label>
            <div className="relative">
              <input
                type={showNewPassword ? 'text' : 'password'}
                placeholder="Enter new password"
                className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
              <button
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white"
              >
                {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">Minimum 8 characters with uppercase, lowercase, and numbers</p>
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">Confirm New Password</label>
            <input
              type="password"
              placeholder="Confirm new password"
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>
        </div>
      </div>

      {/* Two-Factor Authentication */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Two-Factor Authentication</h3>
              <p className="text-sm text-gray-400">Add an extra layer of security</p>
            </div>
          </div>
          <button
            onClick={() => toggleSetting('twoFactorAuth')}
            className={`relative w-14 h-7 rounded-full transition-colors ${
              settings.twoFactorAuth ? 'bg-[#facc15]' : 'bg-[#262626]'
            }`}
          >
            <div
              className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${
                settings.twoFactorAuth ? 'left-8' : 'left-1'
              }`}
            />
          </button>
        </div>

        {settings.twoFactorAuth && (
          <div className="mt-4 p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-white font-medium">2FA is enabled</p>
                <p className="text-sm text-gray-400">Your account is protected with authenticator app</p>
              </div>
            </div>
            <button className="mt-3 text-sm text-green-400 hover:text-green-300">
              Reconfigure 2FA →
            </button>
          </div>
        )}
      </div>

      {/* Session Settings */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <History className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Session Settings</h3>
            <p className="text-sm text-gray-400">Manage your session preferences</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Session Timeout (minutes)
              <span className="text-xs text-gray-500 ml-2">Auto logout after inactivity</span>
            </label>
            <input
              type="number"
              min="5"
              max="120"
              value={settings.sessionTimeout}
              onChange={(e) => setSettings({ ...settings, sessionTimeout: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-400 mb-2">
              Maximum Login Attempts
              <span className="text-xs text-gray-500 ml-2">Lock account after failed attempts</span>
            </label>
            <input
              type="number"
              min="3"
              max="10"
              value={settings.loginAttempts}
              onChange={(e) => setSettings({ ...settings, loginAttempts: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
            />
          </div>

          <label className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#262626] cursor-pointer">
            <div>
              <p className="text-white text-sm font-medium">Require Strong Passwords</p>
              <p className="text-xs text-gray-400">Enforce complex password requirements</p>
            </div>
            <button
              onClick={() => toggleSetting('requireStrongPasswords')}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                settings.requireStrongPasswords ? 'bg-[#facc15]' : 'bg-[#262626]'
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  settings.requireStrongPasswords ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Active Sessions */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Active Sessions</h3>
            <p className="text-sm text-gray-400">Manage devices logged into your account</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { device: 'Chrome on Windows', location: 'Manila, Philippines', time: 'Current session', current: true },
            { device: 'Mobile App on Android', location: 'Manila, Philippines', time: '2 hours ago', current: false },
          ].map((session, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#262626]">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${session.current ? 'bg-green-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="text-white text-sm font-medium">{session.device}</p>
                  <p className="text-xs text-gray-400">{session.location} • {session.time}</p>
                </div>
              </div>
              {!session.current && (
                <button className="text-sm text-red-400 hover:text-red-300">
                  Revoke
                </button>
              )}
            </div>
          ))}
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
