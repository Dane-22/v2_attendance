'use client';

import { useAppStore } from '@/store/appStore';
import { Sun, Moon, Monitor, Palette, Layout, Type, Check } from 'lucide-react';

export default function AppearanceSettings() {
  const { theme, setTheme } = useAppStore();

  const themes = [
    { 
      value: 'dark' as const, 
      label: 'Dark Mode', 
      icon: Moon, 
      description: 'Easy on the eyes in low light',
      preview: 'bg-[#0a0a0a]'
    },
    { 
      value: 'light' as const, 
      label: 'Light Mode', 
      icon: Sun, 
      description: 'Better for bright environments',
      preview: 'bg-gray-100'
    },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center">
            <Palette className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Theme</h3>
            <p className="text-sm text-gray-400">Choose your preferred color scheme</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {themes.map((t) => {
            const Icon = t.icon;
            const isActive = theme === t.value;
            
            return (
              <button
                key={t.value}
                onClick={() => setTheme(t.value)}
                className={`relative p-4 rounded-xl border-2 transition-all text-left ${
                  isActive 
                    ? 'border-[#facc15] bg-[#facc15]/5' 
                    : 'border-[#262626] bg-[#0f0f0f] hover:border-[#404040]'
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-16 h-16 rounded-lg ${t.preview} border border-[#262626] flex items-center justify-center`}>
                    <Icon className={`w-8 h-8 ${t.value === 'dark' ? 'text-white' : 'text-gray-800'}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className={`font-medium ${isActive ? 'text-[#facc15]' : 'text-white'}`}>
                        {t.label}
                      </h4>
                      {isActive && (
                        <div className="w-5 h-5 rounded-full bg-[#facc15] flex items-center justify-center">
                          <Check className="w-3 h-3 text-black" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-gray-400 mt-1">{t.description}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent Color */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-[#facc15]/10 border border-[#facc15]/30 flex items-center justify-center">
            <Layout className="w-5 h-5 text-[#facc15]" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Accent Color</h3>
            <p className="text-sm text-gray-400">Primary brand color for the interface</p>
          </div>
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
          {[
            { color: '#facc15', name: 'Yellow' },
            { color: '#22c55e', name: 'Green' },
            { color: '#3b82f6', name: 'Blue' },
            { color: '#8b5cf6', name: 'Purple' },
            { color: '#ef4444', name: 'Red' },
            { color: '#f97316', name: 'Orange' },
          ].map((accent) => (
            <button
              key={accent.color}
              className="group relative p-3 rounded-xl border border-[#262626] hover:border-[#404040] transition-all"
              style={{ backgroundColor: `${accent.color}10` }}
            >
              <div 
                className="w-full aspect-square rounded-lg mb-2"
                style={{ backgroundColor: accent.color }}
              />
              <p className="text-xs text-gray-400 text-center">{accent.name}</p>
              {accent.color === '#facc15' && (
                <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#facc15] flex items-center justify-center">
                  <Check className="w-3 h-3 text-black" />
                </div>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Density */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center">
            <Type className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Layout Density</h3>
            <p className="text-sm text-gray-400">Control the spacing and compactness</p>
          </div>
        </div>

        <div className="space-y-3">
          {[
            { value: 'compact', label: 'Compact', description: 'Minimal spacing, more content visible' },
            { value: 'comfortable', label: 'Comfortable', description: 'Balanced spacing for readability' },
            { value: 'spacious', label: 'Spacious', description: 'More breathing room between elements' },
          ].map((density, index) => (
            <label
              key={density.value}
              className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all ${
                index === 1 
                  ? 'border-[#facc15] bg-[#facc15]/5' 
                  : 'border-[#262626] bg-[#0f0f0f] hover:border-[#404040]'
              }`}
            >
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                index === 1 ? 'border-[#facc15]' : 'border-gray-500'
              }`}>
                {index === 1 && <div className="w-2 h-2 rounded-full bg-[#facc15]" />}
              </div>
              <div className="flex-1">
                <p className={`font-medium ${index === 1 ? 'text-[#facc15]' : 'text-white'}`}>
                  {density.label}
                </p>
                <p className="text-sm text-gray-400">{density.description}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Sidebar Configuration */}
      <div className="bg-[#141414] rounded-xl border border-[#262626] p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Sidebar</h3>
            <p className="text-sm text-gray-400">Configure sidebar behavior</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-[#262626] cursor-pointer">
            <div>
              <p className="text-white font-medium">Start Expanded</p>
              <p className="text-sm text-gray-400">Open sidebar by default on page load</p>
            </div>
            <div className="relative">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-12 h-6 bg-[#262626] rounded-full peer peer-checked:bg-[#facc15] transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
            </div>
          </label>

          <label className="flex items-center justify-between p-4 bg-[#0f0f0f] rounded-xl border border-[#262626] cursor-pointer">
            <div>
              <p className="text-white font-medium">Auto-hide on Mobile</p>
              <p className="text-sm text-gray-400">Hide sidebar when viewing on mobile devices</p>
            </div>
            <div className="relative">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-12 h-6 bg-[#262626] rounded-full peer peer-checked:bg-[#facc15] transition-colors" />
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform peer-checked:translate-x-6" />
            </div>
          </label>
        </div>
      </div>
    </div>
  );
}
