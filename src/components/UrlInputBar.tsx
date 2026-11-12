'use client';

import React, { useState } from 'react';
import { Sparkles, Clipboard, X, Play, Video, ArrowRight } from 'lucide-react';

interface UrlInputBarProps {
  url: string;
  setUrl: (url: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const UrlInputBar: React.FC<UrlInputBarProps> = ({
  url,
  setUrl,
  onSubmit,
  isLoading,
}) => {
  const [copiedNotification, setCopiedNotification] = useState(false);

  const sampleVideos = [
    {
      title: 'Joe Rogan & Andrew Huberman (Podcast)',
      url: 'https://www.youtube.com/watch?v=gXDMoiEkyuQ',
    },
    {
      title: 'Steve Jobs 2005 Stanford Speech',
      url: 'https://www.youtube.com/watch?v=UF8uR6Z6KLc',
    },
    {
      title: 'MKBHD Tech Review & Reaction',
      url: 'https://www.youtube.com/watch?v=Vb0ZqT_6VLE',
    },
  ];

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setUrl(text.trim());
        setCopiedNotification(true);
        setTimeout(() => setCopiedNotification(false), 2000);
      }
    } catch (e) {
      console.warn('Clipboard read error:', e);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim() && !isLoading) {
      onSubmit();
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Input Form */}
      <form onSubmit={handleSubmit} className="relative group">
        <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center rounded-2xl sm:rounded-full border border-zinc-700 bg-zinc-900/90 p-2 shadow-2xl backdrop-blur-md transition-all focus-within:border-pink-500 focus-within:ring-2 focus-within:ring-pink-500/20">
          {/* Left Icon */}
          <div className="hidden sm:flex items-center pl-3 pr-2 text-zinc-400">
            <Video className="h-5 w-5 text-pink-400" />
          </div>

          {/* Input field */}
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste YouTube video or Shorts URL (e.g. https://youtu.be/...)"
            disabled={isLoading}
            className="w-full bg-transparent px-3 py-3 sm:py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none"
          />

          {/* Action buttons inside bar */}
          <div className="flex items-center justify-between sm:justify-end space-x-2 pt-2 sm:pt-0 sm:pr-1">
            {url && (
              <button
                type="button"
                onClick={() => setUrl('')}
                disabled={isLoading}
                className="p-1.5 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                title="Clear"
              >
                <X className="h-4 w-4" />
              </button>
            )}

            <button
              type="button"
              onClick={handlePaste}
              disabled={isLoading}
              className="flex items-center space-x-1 rounded-full border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-700 transition-colors"
              title="Paste from clipboard"
            >
              <Clipboard className="h-3.5 w-3.5" />
              <span>{copiedNotification ? 'Pasted!' : 'Paste'}</span>
            </button>

            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="flex items-center justify-center space-x-2 rounded-full bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 px-5 py-2.5 sm:py-2 text-xs sm:text-sm font-bold text-white shadow-lg shadow-pink-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Clips</span>
                  <ArrowRight className="h-3.5 w-3.5 hidden sm:inline" />
                </>
              )}
            </button>
          </div>
        </div>
      </form>

      {/* Demo sample pills */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="text-zinc-500 font-medium">Or try an example:</span>
        {sampleVideos.map((s, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setUrl(s.url);
            }}
            disabled={isLoading}
            className="flex items-center space-x-1.5 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-zinc-300 hover:border-pink-500/40 hover:bg-zinc-800 transition-all"
          >
            <Play className="h-3 w-3 text-pink-400" />
            <span className="truncate max-w-[150px] sm:max-w-none">{s.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
