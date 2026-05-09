'use client';

import { useState } from 'react';
import { SettingsTab } from './types';
import GeneralSettings from './components/GeneralSettings';
import AppearanceSettings from './components/AppearanceSettings';
import NotificationSettings from './components/NotificationSettings';
import SecuritySettings from './components/SecuritySettings';
import SystemSettings from './components/SystemSettings';
import BackupSettings from './components/BackupSettings';
import { useTheme } from '@/hooks/useTheme';
import { 
  Building2, 
  Palette, 
  Bell, 
  Shield, 
  Globe,
  Settings,
  Save,
  RotateCcw
} from 'lucide-react';

const tabs: { id: SettingsTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'general', label: 'General', icon: Building2, description: 'Company info & working hours' },
  { id: 'appearance', label: 'Appearance', icon: Palette, description: 'Theme & layout preferences' },
  { id: 'notifications', label: 'Notifications', icon: Bell, description: 'Alerts & email settings' },
  { id: 'security', label: 'Security', icon: Shield, description: 'Password & 2FA settings' },
  { id: 'system', label: 'System', icon: Globe, description: 'Regional & system preferences' },
  { id: 'backup', label: 'Backup', icon: Save, description: 'Backup & restore settings' },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');
  const [isSavingAll, setIsSavingAll] = useState(false);
  const { classes } = useTheme();

  const handleSaveAll = () => {
    setIsSavingAll(true);
    setTimeout(() => {
      setIsSavingAll(false);
    }, 1500);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return <GeneralSettings />;
      case 'appearance':
        return <AppearanceSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'security':
        return <SecuritySettings />;
      case 'system':
        return <SystemSettings />;
      case 'backup':
        return <BackupSettings />;
      default:
        return <GeneralSettings />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className={`text-2xl lg:text-3xl font-bold ${classes.text}`}>
            Settings <span className={classes.textAccent}>& Configuration</span>
          </h1>
          <p className={`${classes.textMuted} mt-1`}>
            Manage your application preferences and system settings
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.reload()}
            className={`flex items-center gap-2 px-4 py-2 ${classes.bgCard} ${classes.border} rounded-lg ${classes.text} hover:${classes.borderHover} transition-colors`}
          >
            <RotateCcw className="w-4 h-4" />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            onClick={handleSaveAll}
            disabled={isSavingAll}
            className="flex items-center gap-2 px-4 py-2 bg-[#facc15] text-black font-medium rounded-lg hover:bg-yellow-400 transition-colors disabled:opacity-50"
          >
            {isSavingAll ? (
              <>
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save All
              </>
            )}
          </button>
        </div>
      </div>

      {/* Settings Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Tabs */}
        <div className="lg:w-72 flex-shrink-0">
          <div className={`${classes.bgCard} rounded-xl ${classes.border} overflow-hidden sticky top-6`}>
            <div className={`p-4 border-b ${classes.border}`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${classes.hoverAccent} ${classes.borderAccent} flex items-center justify-center`}>
                  <Settings className={`w-5 h-5 ${classes.textAccent}`} />
                </div>
                <div>
                  <h3 className={`${classes.text} font-semibold`}>Settings</h3>
                  <p className={`text-xs ${classes.textMuted}`}>Configure your app</p>
                </div>
              </div>
            </div>
            
            <nav className="p-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all mb-1 ${
                      isActive
                        ? `${classes.hoverAccent} ${classes.textAccent} border-l-2 ${classes.borderAccent}`
                        : `${classes.textMuted} hover:${classes.bgCardHover} hover:${classes.text}`
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? classes.textAccent : ''}`} />
                    <div className="flex-1">
                      <p className={`font-medium ${isActive ? classes.textAccent : classes.text}`}>
                        {tab.label}
                      </p>
                      <p className={`text-xs ${classes.textMuted}`}>{tab.description}</p>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-w-0">
          <div className={`${classes.bgCard} rounded-xl ${classes.border} p-6`}>
            <div className={`flex items-center gap-3 mb-6 pb-4 border-b ${classes.border}`}>
              {(() => {
                const currentTab = tabs.find(t => t.id === activeTab);
                const Icon = currentTab?.icon || Settings;
                return (
                  <>
                    <div className={`w-10 h-10 rounded-lg ${classes.hoverAccent} ${classes.borderAccent} flex items-center justify-center`}>
                      <Icon className={`w-5 h-5 ${classes.textAccent}`} />
                    </div>
                    <div>
                      <h2 className={`text-xl font-semibold ${classes.text}`}>{currentTab?.label}</h2>
                      <p className={`text-sm ${classes.textMuted}`}>{currentTab?.description}</p>
                    </div>
                  </>
                );
              })()}
            </div>
            
            {renderTabContent()}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={`text-center text-sm ${classes.textMuted} pt-4 border-t ${classes.border}`}>
        <p>JAJR Construction Management System v2.0 • Settings are saved automatically per section</p>
      </div>
    </div>
  );
}
