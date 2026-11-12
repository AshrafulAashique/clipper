'use client';

import React from 'react';
import { Archive, AlertCircle, CheckCircle2, Flame, Sparkles } from 'lucide-react';
import { DetectionReport } from '@/types';

interface ReportBannerProps {
  report: DetectionReport;
  onDownloadAllZip: () => void;
  isZipping: boolean;
}

export const ReportBanner: React.FC<ReportBannerProps> = ({
  report,
  onDownloadAllZip,
  isZipping,
}) => {
  const { video, clips, totalMomentsFound, hasMinimumFive, statusMessage } = report;

  return (
    <div className="w-full max-w-5xl mx-auto my-6 rounded-2xl border border-zinc-800 bg-zinc-900/80 p-5 sm:p-6 backdrop-blur-md shadow-xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left: Video Preview & Metadata */}
        <div className="flex items-start sm:items-center space-x-4">
          <div className="relative h-16 w-24 sm:h-20 sm:w-32 flex-shrink-0 overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950">
            <img
              src={video.thumbnailUrl}
              alt={video.title}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
            <div className="absolute bottom-1 right-1 rounded bg-black/80 px-1.5 py-0.5 text-[10px] font-bold text-white">
              HD
            </div>
          </div>

          <div>
            <h2 className="text-sm sm:text-base font-bold text-white line-clamp-1">
              {video.title}
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">{video.author}</p>

            {/* Quality status badge */}
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {hasMinimumFive ? (
                <div className="inline-flex items-center space-x-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>{totalMomentsFound} High-Impact Clips (Goal 5+ Reached)</span>
                </div>
              ) : (
                <div className="inline-flex items-center space-x-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-semibold text-amber-400">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span>Found {totalMomentsFound} Clips • Quality Threshold Enforced</span>
                </div>
              )}

              <div className="inline-flex items-center space-x-1 rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-0.5 text-[11px] text-zinc-400">
                <Flame className="h-3.5 w-3.5 text-pink-500" />
                <span>15–30s Shorts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Master Download Button */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <button
            onClick={onDownloadAllZip}
            disabled={isZipping || clips.length === 0}
            className="flex items-center justify-center space-x-2 rounded-xl bg-gradient-to-r from-pink-600 via-rose-500 to-amber-500 px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-pink-600/20 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isZipping ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Creating ZIP Archive...</span>
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" />
                <span>Download All Clips (ZIP)</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Explanatory Message */}
      <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/50 p-3 text-xs text-zinc-300 leading-relaxed">
        <span className="font-semibold text-pink-400">AI Curator Assessment: </span>
        {statusMessage}
      </div>
    </div>
  );
};
