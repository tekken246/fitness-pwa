import type { ReactNode } from 'react';
import { SignOutButton, UserButton } from '@clerk/nextjs';
import { Palette, Smartphone, Info, LogOut } from 'lucide-react';

import { ThemeSelector } from '@/components/settings/theme-selector';
import { requireClerkUserId } from '@/lib/auth';
import { getOrCreateUserSettings } from '@/lib/data/settings';

/** Renders authenticated user settings. */
export default async function SettingsPage(): Promise<ReactNode> {
  const clerkUserId = await requireClerkUserId();
  const settings = await getOrCreateUserSettings(clerkUserId);

  return (
    <div className="space-y-6 pb-24 text-white">
      <h1 className="px-1 pt-2 text-[28px] font-bold tracking-tight text-white">Settings</h1>

      <div className="flex items-center gap-3 rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-4">
        <UserButton afterSignOutUrl="/" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold text-white">Your account</p>
          <p className="truncate text-[12px] text-white/45">Tap your avatar to manage profile, email, and security</p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">Preferences</p>
        <div className="overflow-hidden rounded-[18px] border border-white/[0.08] bg-white/[0.05]">
          <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 pb-1.5 pt-4 text-white/55">
            <Palette className="h-4 w-4" />
            <span className="text-[12px] font-bold uppercase tracking-wider">Appearance &amp; units</span>
          </div>
          <ThemeSelector settings={settings} />
        </div>
      </div>

      <div className="space-y-2">
        <p className="px-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white/40">About</p>
        <div className="space-y-3 rounded-[18px] border border-white/[0.08] bg-white/[0.05] p-4">
          <div className="flex items-start gap-3">
            <Smartphone className="mt-0.5 h-4 w-4 shrink-0 text-white/50" />
            <div>
              <p className="text-[14px] font-semibold text-white">Install the app</p>
              <p className="mt-0.5 text-[13px] leading-relaxed text-white/50">
                On iOS Safari, tap Share then Add to Home Screen. On Chromium mobile, use the browser install prompt when
                available.
              </p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-white/[0.06] pt-3">
            <span className="flex items-center gap-2 text-[14px] text-white">
              <Info className="h-4 w-4 text-white/50" /> Version
            </span>
            <span className="text-[13px] text-white/45">1.0.0</span>
          </div>
        </div>
      </div>

      <SignOutButton>
        <button
          type="button"
          className="flex h-12 w-full items-center justify-center gap-2 rounded-[14px] border border-red-500/20 bg-red-500/[0.08] text-[14px] font-semibold text-red-400 transition-colors hover:bg-red-500/[0.12]"
        >
          <LogOut className="h-4 w-4" /> Sign out
        </button>
      </SignOutButton>
    </div>
  );
}
