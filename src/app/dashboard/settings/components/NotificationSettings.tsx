'use client';

import { useState } from 'react';
import { NotificationSettings as NotificationSettingsType } from '../types';
import { defaultNotificationSettings } from '../data';
import { Bell, Mail, Smartphone, AlertTriangle, DollarSign, RefreshCw, Check, Save } from 'lucide-react';

export default function NotificationSettings() {
  const [settings, setSettings] = useState<NotificationSettingsType>(defaultNotificationSettings);
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

  const toggleSetting = (key: keyof NotificationSettingsType) => {
    setSettings({ ...settings, [key]: !settings[key] });
  };

  const notificationGroups = [
    {
      title: 'Email Notifications',
      icon: Mail,
      description: 'Receive updates via email',
      settings: [
        { key: 'emailNotifications' as const, label: 'Enable Email Notifications', description: 'Master toggle for all email notifications' },
      ],
    },
    {
      title: 'Push Notifications',
      icon: Smartphone,
      description: 'Browser and mobile push alerts',
      settings: [
        { key: 'pushNotifications' as const, label: 'Enable Push Notifications', description: 'Receive real-time push notifications' },
      ],
    },
    {
      title: 'Attendance Alerts',
      icon: AlertTriangle,
      description: 'Employee attendance related alerts',
      settings: [
        { key: 'attendanceAlerts' as const, label: 'Late Arrivals', description: 'Notify when employees are late' },
      ],
    },
    {
      title: 'Payroll Alerts',
      icon: DollarSign,
      description: 'Payroll and payment notifications',
      settings: [
        { key: 'payrollAlerts' as const, label: 'Payroll Processing', description: 'Updates about payroll status' },
      ],
    },
    {
      title: 'System Updates',
      icon: RefreshCw,
      description: 'System maintenance and updates',
      settings: [
        { key: 'systemUpdates' as const, label: 'System Updates', description: 'New features and maintenance alerts' },
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
            <Bell className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Notification Preferences</h3>
            <p className="text-sm text-gray-400">Manage how you receive alerts and updates</p>
          </div>
        </div>
      </div>

      {/* Notification Groups */}
      {notificationGroups.map((group) => {
        const Icon = group.icon;
        return (
          <div key={group.title} className="bg-[#141414] rounded-xl border border-[#262626] p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
                <Icon className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <h4 className="text-white font-medium">{group.title}</h4>
                <p className="text-sm text-gray-400">{group.description}</p>
              </div>
            </div>

            <div className="space-y-3">
              {group.settings.map((setting) => {
                const isEnabled = settings[setting.key];
                return (
                  <label
                    key={setting.key}
                    className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#262626] cursor-pointer hover:border-[#404040] transition-colors"
                  >
                    <div>
                      <p className="text-white text-sm font-medium">{setting.label}</p>
                      <p className="text-xs text-gray-400">{setting.description}</p>
                    </div>
                    <button
                      onClick={() => toggleSetting(setting.key)}
                      className={`relative w-12 h-6 rounded-full transition-colors ${
                        isEnabled ? 'bg-[#facc15]' : 'bg-[#262626]'
                      }`}
                    >
                      <div
                        className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                          isEnabled ? 'left-7' : 'left-1'
                        }`}
                      />
                    </button>
                  </label>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Low Balance Alert */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-red-400" />
          </div>
          <div>
            <h4 className="text-white font-medium">Low Balance Alert</h4>
            <p className="text-sm text-gray-400">Notify when account balance is low</p>
          </div>
        </div>

        <label className="flex items-center justify-between p-3 bg-[#0f0f0f] rounded-lg border border-[#262626] cursor-pointer hover:border-[#404040] transition-colors mb-4">
          <span className="text-white text-sm font-medium">Enable Low Balance Alerts</span>
          <button
            onClick={() => toggleSetting('lowBalanceAlerts')}
            className={`relative w-12 h-6 rounded-full transition-colors ${
              settings.lowBalanceAlerts ? 'bg-[#facc15]' : 'bg-[#262626]'
            }`}
          >
            <div
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                settings.lowBalanceAlerts ? 'left-7' : 'left-1'
              }`}
            />
          </button>
        </label>

        {settings.lowBalanceAlerts && (
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-400">Alert threshold:</span>
            <div className="flex items-center gap-2">
              <span className="text-white font-medium">₱</span>
              <input
                type="number"
                defaultValue={100000}
                className="w-32 px-3 py-2 bg-[#0f0f0f] border border-[#262626] rounded-lg text-white focus:outline-none focus:border-[#facc15]"
              />
            </div>
          </div>
        )}
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
