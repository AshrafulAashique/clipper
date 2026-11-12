'use client';

import React from 'react';
import { Scissors, Sparkles, Key, Smartphone, Info } from 'lucide-react';

interface NavbarProps {
  onOpenSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenSettings }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-pink-600 via-rose-500 to-amber-400 p-0.5 shadow-lg shadow-pink-500/20">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-zinc-950">
              <Scissors className="h-5 w-5 text-pink-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-extrabold tracking-tight text-white">ClipForge</span>
              <span className="rounded-full bg-pink-500/10 px-2 py-0.5 text-[10px] font-semibold text-pink-400 border border-pink-500/20">
                AI REPLICA
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 hidden sm:block">
              Free 15–30s Viral Short Generator
            </p>
          </div>
        </div>

        {/* Status badges & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          <div className="hidden md:flex items-center space-x-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs text-emerald-400 font-medium">
            <Smartphone className="h-3.5 w-3.5" />
            <span>Mobile & Free Vercel Serverless Ready</span>
          </div>

          <button
            onClick={onOpenSettings}
            className="flex items-center space-x-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 transition-colors hover:border-zinc-500 hover:bg-zinc-800"
          >
            <Key className="h-3.5 w-3.5 text-amber-400" />
            <span className="hidden sm:inline">AI Settings</span>
            <span className="sm:hidden">Keys</span>
          </button>
        </div>
      </div>
    </header>
  );
};

