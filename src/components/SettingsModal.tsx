'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, ExternalLink, ShieldCheck, Zap, Info } from 'lucide-react';
import { SubtitleStyle } from '@/types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  subtitleStyle: SubtitleStyle;
  onSelectSubtitleStyle: (style: SubtitleStyle) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  subtitleStyle,
  onSelectSubtitleStyle,
}) => {
  const [keyInput, setKeyInput] = useState(apiKey);

  useEffect(() => {
    setKeyInput(apiKey);
  }, [apiKey]);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(keyInput.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
              <Key className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">AI Engine & Settings</h3>
              <p className="text-xs text-zinc-400">100% Free Tier Configuration</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="mt-5 space-y-5">
          {/* Free Gemini API Key section */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-200">
                Google Gemini API Key (Optional)
              </label>
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noreferrer"
                className="flex items-center space-x-1 text-[11px] text-pink-400 hover:underline"
              >
                <span>Get Free Key at Google AI Studio</span>
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
            <input
              type="password"
              placeholder="AIzaSy... (Leave empty to use built-in heuristic engine)"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              className="w-full rounded-xl border border-zinc-700 bg-zinc-950 px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:border-pink-500 focus:outline-none"
            />
            <p className="mt-1.5 text-[11px] text-zinc-400">
              Gemini 1.5/2.0 Flash is 100% free with no credit card required. If left blank, ClipForge automatically uses its built-in NLP heuristic moment detector!
            </p>
          </div>

          {/* Subtitle Style Default */}
          <div>
            <label className="text-xs font-semibold text-zinc-200 block mb-2">
              Default Subtitle Theme
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              <button
                type="button"
                onClick={() => onSelectSubtitleStyle('hormozi')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  subtitleStyle === 'hormozi'
                    ? 'border-amber-400 bg-amber-400/10 text-amber-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold text-amber-300">HORMOZI</div>
                <div className="text-[10px] mt-0.5 text-zinc-400">Yellow Pop</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectSubtitleStyle('neon')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  subtitleStyle === 'neon'
                    ? 'border-emerald-400 bg-emerald-400/10 text-emerald-300 font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold text-emerald-300">NEON</div>
                <div className="text-[10px] mt-0.5 text-zinc-400">Emerald Glow</div>
              </button>

              <button
                type="button"
                onClick={() => onSelectSubtitleStyle('crisp')}
                className={`p-3 rounded-xl border text-center transition-all ${
                  subtitleStyle === 'crisp'
                    ? 'border-white bg-white/10 text-white font-bold'
                    : 'border-zinc-800 bg-zinc-950 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <div className="text-xs font-bold text-white">CRISP</div>
                <div className="text-[10px] mt-0.5 text-zinc-400">Studio Pill</div>
              </button>
            </div>
          </div>

          {/* Architecture info */}
          <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 p-3.5 space-y-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-zinc-200">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              <span>Vercel Free Tier Optimized</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-relaxed">
              Video rendering and subtitle burning execute directly on your device (phone or browser) using HTML5 Canvas & WebCodecs. This prevents Vercel server timeouts and keeps hosting 100% free!
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end space-x-2.5">
          <button
            onClick={onClose}
            className="rounded-xl border border-zinc-700 px-4 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-pink-600 px-5 py-2 text-xs font-semibold text-white hover:bg-pink-500 shadow-md shadow-pink-600/20 transition-all"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
