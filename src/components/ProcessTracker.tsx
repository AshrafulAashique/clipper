'use client';

import React from 'react';
import { CheckCircle2, Loader2, Sparkles, FileAudio, Search, Video } from 'lucide-react';

interface ProcessTrackerProps {
  currentStep: number; // 0, 1, 2, 3
  statusText: string;
}

export const ProcessTracker: React.FC<ProcessTrackerProps> = ({ currentStep, statusText }) => {
  const steps = [
    { label: 'Metadata Ingestion', desc: 'Fetching video stream & duration', icon: Video },
    { label: 'Timed Transcription', desc: 'Parsing speech into millisecond timestamps', icon: FileAudio },
    { label: 'Moment Detection', desc: 'Detecting jokes, punchlines & high-energy hooks', icon: Search },
    { label: 'Shorts Generation', desc: 'Creating 15–30s viral clips with dynamic captions', icon: Sparkles },
  ];

  return (
    <div className="w-full max-w-2xl mx-auto my-8 rounded-2xl border border-zinc-800 bg-zinc-900/70 p-6 backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="inline-flex items-center space-x-2 rounded-full bg-pink-500/10 px-3 py-1 text-xs font-semibold text-pink-400 border border-pink-500/20 mb-2">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          <span>Processing Pipeline</span>
        </div>
        <h4 className="text-base font-bold text-white">{statusText || 'Analyzing Video...'}</h4>
      </div>

      <div className="space-y-3 sm:space-y-4">
        {steps.map((step, idx) => {
          const isDone = currentStep > idx;
          const isCurrent = currentStep === idx;
          const isPending = currentStep < idx;

          const IconComponent = step.icon;

          return (
            <div
              key={idx}
              className={`flex items-center justify-between rounded-xl p-3 sm:p-3.5 transition-all ${
                isCurrent
                  ? 'border border-pink-500/40 bg-pink-500/5 shadow-sm'
                  : isDone
                  ? 'border border-zinc-800/80 bg-zinc-950/40 text-zinc-300'
                  : 'border border-transparent bg-zinc-950/20 opacity-40'
              }`}
            >
              <div className="flex items-center space-x-3">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                    isDone
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : isCurrent
                      ? 'bg-pink-500/10 text-pink-400 border border-pink-500/30'
                      : 'bg-zinc-800 text-zinc-500'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-xs sm:text-sm font-semibold text-white">{step.label}</div>
                  <div className="text-[11px] text-zinc-400 hidden sm:block">{step.desc}</div>
                </div>
              </div>

              <div>
                {isDone ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="h-5 w-5 text-pink-400 animate-spin" />
                ) : (
                  <div className="h-3 w-3 rounded-full bg-zinc-700" />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

