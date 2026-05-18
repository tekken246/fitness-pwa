'use client';

import { useState, useTransition } from 'react';
import type { ReactNode } from 'react';
import { Check, Loader2 } from 'lucide-react';

import { updateSettingsAction } from '@/lib/actions/settings-actions';
import type { UserSettings } from '@/lib/types';

type ThemeSelectorProps = {
  settings: UserSettings;
};

export function ThemeSelector({ settings }: ThemeSelectorProps): ReactNode {
  const [currentTheme, setCurrentTheme] = useState(settings.theme);
  const [currentUnit, setCurrentUnit] = useState(settings.unit);
  const [isPending, startTransition] = useTransition();

  // Unified instant-save mechanism
  const triggerUpdate = (updatedTheme: typeof settings.theme, updatedUnit: typeof settings.unit) => {
    startTransition(() => {
      updateSettingsAction({ 
        theme: updatedTheme, 
        unit: updatedUnit, 
        timezone: settings.timezone 
      }).then((result) => {
        if (result.ok) {
          document.documentElement.dataset.theme = updatedTheme;
          window.localStorage.setItem('fit_theme', updatedTheme);
        }
      });
    });
  };

  const handleThemeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newTheme = e.target.value as typeof settings.theme;
    setCurrentTheme(newTheme);
    triggerUpdate(newTheme, currentUnit);
  };

  const toggleUnit = (newUnit: typeof settings.unit) => {
    if (newUnit === currentUnit) return;
    setCurrentUnit(newUnit);
    triggerUpdate(currentTheme, newUnit);
  };

  return (
    <div className="w-full space-y-4">
      {/* 1. Integrated Theme Select Dropdown Row */}
      <div className="flex items-center justify-between p-4">
        <span className="text-[15px] font-medium text-white">Theme Mode</span>
        <div className="relative flex items-center">
          {isPending && <Loader2 className="absolute -left-6 h-4 w-4 animate-spin text-[#22C55E]" />}
          <select
            value={currentTheme}
            onChange={handleThemeChange}
            className="h-9 rounded-[10px] bg-white/[0.06] border border-white/[0.08] px-3 text-[13px] font-semibold text-white focus:outline-none focus:ring-2 focus:ring-[#22C55E]/40 appearance-none pr-8 relative bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20className%3D%22h-4%20w-4%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%20viewBox%3D%220%200%2020%2020%20%22%20fill%3D%22rgba%28255,255,255,0.4%29%22%3E%3Cpath%20fillRule%3D%22evenodd%22%20d%3D%22M5.293%207.293a1%201%200%20011.414%200L10%2010.586l3.293-3.293a1%201%200%20111.414%201.414l-4%204a1%201%200%2001-1.414%200l-4-4a1%201%200%20010-1.414z%22%20clipRule%3D%22evenodd%22%3E%3C/path%3E%3C/svg%3E')] bg-[length:16px_16px] bg-[right_8px_center] bg-no-repeat"
          >
            <option value="dark" className="bg-[#0a0e1a]">Dark</option>
            <option value="light" className="bg-[#0a0e1a]">Light</option>
            <option value="rose" className="bg-[#0a0e1a]">Rose Glow</option>
          </select>
        </div>
      </div>

      {/* 2. Integrated Weight Unit Segmented Switch Row */}
      <div className="flex items-center justify-between p-4 border-t border-white/[0.06]">
        <span className="text-[15px] font-medium text-white">Weight Unit</span>
        <div className="flex rounded-[10px] bg-white/[0.04] p-0.5 border border-white/[0.06]">
          <button
            type="button"
            onClick={() => toggleUnit('lb')}
            className={`px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all ${
              currentUnit === 'lb' 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            LBS
          </button>
          <button
            type="button"
            onClick={() => toggleUnit('kg')}
            className={`px-3 py-1.5 rounded-[8px] text-[13px] font-semibold transition-all ${
              currentUnit === 'kg' 
                ? 'bg-white/10 text-white shadow-sm' 
                : 'text-white/40 hover:text-white/70'
            }`}
          >
            KGS
          </button>
        </div>
      </div>
    </div>
  );
}