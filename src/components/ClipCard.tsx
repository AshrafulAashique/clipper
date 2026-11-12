'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Download,
  Share2,
  Play,
  Pause,
  Sparkles,
  Flame,
  Copy,
  Check,
  RotateCcw,
  Palette,
} from 'lucide-react';
import { ClipMoment, SubtitleStyle, VideoMetadata } from '@/types';
import { renderCaptionsOnCanvas } from '@/lib/caption-renderer';
import { downloadFile, renderAndExportClip } from '@/lib/video-clipper';

interface ClipCardProps {
  clip: ClipMoment;
  video: VideoMetadata;
  subtitleStyle: SubtitleStyle;
  onStyleChange: (style: SubtitleStyle) => void;
  index: number;
}

export const ClipCard: React.FC<ClipCardProps> = ({
  clip,
  video,
  subtitleStyle,
  onStyleChange,
  index,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(clip.startTime);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // Category badge styling
  const categoryConfig: Record<string, { label: string; color: string; bg: string }> = {
    joke: { label: 'Hilarious Joke', color: 'text-amber-400', bg: 'bg-amber-400/10 border-amber-400/20' },
    unexpected: { label: 'Unexpected Twist', color: 'text-purple-400', bg: 'bg-purple-400/10 border-purple-400/20' },
    reaction: { label: 'Shock Reaction', color: 'text-pink-400', bg: 'bg-pink-400/10 border-pink-400/20' },
    punchline: { label: 'Viral Punchline', color: 'text-rose-400', bg: 'bg-rose-400/10 border-rose-400/20' },
    insight: { label: 'Mind-Blowing Truth', color: 'text-cyan-400', bg: 'bg-cyan-400/10 border-cyan-400/20' },
  };

  const catStyle = categoryConfig[clip.category] || categoryConfig.punchline;

  // Render animated preview canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;

    const render = () => {
      // Clear canvas
      ctx.fillStyle = '#09090b';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw background pattern/thumbnail
      const img = new Image();
      img.src = video.thumbnailUrl;
      if (img.complete && img.naturalWidth > 0) {
        ctx.save();
        ctx.filter = 'blur(10px) brightness(0.4)';
        ctx.drawImage(img, -canvas.width * 0.2, -canvas.height * 0.1, canvas.width * 1.4, canvas.height * 1.2);
        ctx.restore();

        // Centered thumbnail
        const aspect = img.naturalWidth / img.naturalHeight;
        const drawW = canvas.width;
        const drawH = drawW / aspect;
        const drawY = (canvas.height - drawH) / 2;
        ctx.drawImage(img, 0, drawY, drawW, drawH);
      }

      // Draw captions
      renderCaptionsOnCanvas({
        ctx,
        canvasWidth: canvas.width,
        canvasHeight: canvas.height,
        currentTime,
        segments: clip.segments,
        style: subtitleStyle,
      });

      if (isPlaying) {
        animId = requestAnimationFrame(render);
      }
    };

    render();

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [currentTime, isPlaying, subtitleStyle, clip.segments, video.thumbnailUrl]);

  // Handle preview playback
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= clip.endTime) {
            setIsPlaying(false);
            return clip.startTime;
          }
          return prev + 0.1;
        });
      }, 100);
    }
    return () => clearInterval(interval);
  }, [isPlaying, clip.startTime, clip.endTime]);

  const togglePlay = () => {
    if (currentTime >= clip.endTime) {
      setCurrentTime(clip.startTime);
    }
    setIsPlaying(!isPlaying);
  };

  const handleCopyHook = () => {
    const textToCopy = `"${clip.hook}"\n\n${clip.tags.join(' ')}`;
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: clip.title,
          text: `Check out this viral moment: "${clip.hook}"`,
          url: `${video.url}&t=${Math.floor(clip.startTime)}s`,
        });
      } catch (e) {
        // user cancelled or share failed
      }
    } else {
      handleCopyHook();
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(10);

    try {
      // Simulate/Generate high quality vertical video blob
      // In browser environment without direct mp4 binary, we record canvas stream
      const canvas = document.createElement('canvas');
      canvas.width = 720;
      canvas.height = 1280;
      const ctx = canvas.getContext('2d')!;

      // Load thumbnail for video rendering
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = video.thumbnailUrl;
      await new Promise((r) => {
        img.onload = () => r(null);
        img.onerror = () => r(null);
      });

      let mimeType = 'video/webm';
      if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      }

      const stream = canvas.captureStream(30);
      const recorder = new MediaRecorder(stream, { mimeType, videoBitsPerSecond: 3_000_000 });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      const recordPromise = new Promise<Blob>((resolve) => {
        recorder.onstop = () => {
          resolve(new Blob(chunks, { type: mimeType }));
        };
      });

      recorder.start();

      const totalSteps = 60;
      const timeStep = clip.duration / totalSteps;

      for (let s = 0; s <= totalSteps; s++) {
        const renderTime = clip.startTime + s * timeStep;

        // Background
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, 720, 1280);

        if (img.complete && img.naturalWidth > 0) {
          ctx.save();
          ctx.filter = 'blur(20px) brightness(0.5)';
          ctx.drawImage(img, -100, -100, 920, 1480);
          ctx.restore();

          const aspect = img.naturalWidth / img.naturalHeight;
          const drawH = 720 / aspect;
          const drawY = (1280 - drawH) / 2;
          ctx.drawImage(img, 0, drawY, 720, drawH);
        }

        // Subtitles
        renderCaptionsOnCanvas({
          ctx,
          canvasWidth: 720,
          canvasHeight: 1280,
          currentTime: renderTime,
          segments: clip.segments,
          style: subtitleStyle,
        });

        setExportProgress(Math.round((s / totalSteps) * 95));
        await new Promise((r) => setTimeout(r, 20));
      }

      recorder.stop();
      const finalBlob = await recordPromise;

      setExportProgress(100);
      const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';
      const filename = `clip_${index + 1}_${clip.title.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
      downloadFile(finalBlob, filename);
    } catch (err) {
      console.error('Export error:', err);
      alert('Clip export encountered an issue on this device. Please try another browser.');
    } finally {
      setIsExporting(false);
      setExportProgress(0);
    }
  };

  return (
    <div className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-900/90 overflow-hidden shadow-xl transition-all hover:border-zinc-700">
      {/* 9:16 Vertical Video Preview Container */}
      <div className="relative aspect-[9/16] w-full bg-zinc-950 flex items-center justify-center overflow-hidden">
        <canvas
          ref={canvasRef}
          width={360}
          height={640}
          className="h-full w-full object-contain"
        />

        {/* Top Overlay Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Virality score badge */}
          <div className="flex items-center space-x-1.5 rounded-full bg-black/80 backdrop-blur-md px-3 py-1 border border-pink-500/30">
            <Flame className="h-4 w-4 text-pink-500 fill-pink-500" />
            <span className="text-xs font-black text-white">{clip.viralityScore}</span>
            <span className="text-[10px] text-zinc-400 font-medium">/ 100</span>
          </div>

          {/* Category Pill */}
          <div className={`rounded-full border px-2.5 py-1 text-[10px] font-bold backdrop-blur-md ${catStyle.bg} ${catStyle.color}`}>
            {catStyle.label}
          </div>
        </div>

        {/* Center Play/Pause button */}
        <button
          onClick={togglePlay}
          className="absolute z-10 flex h-14 w-14 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-md border border-white/20 transition-all hover:scale-110 active:scale-95 hover:bg-black/80"
        >
          {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
        </button>

        {/* Bottom Time & Progress bar */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-3 pt-6">
          <div className="flex items-center justify-between text-[11px] text-zinc-300 mb-1.5 font-mono">
            <span>{Math.round(currentTime)}s</span>
            <span>Duration: {clip.duration}s</span>
          </div>
          {/* Progress track */}
          <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-100"
              style={{
                width: `${Math.min(
                  100,
                  Math.max(0, ((currentTime - clip.startTime) / clip.duration) * 100)
                )}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* Card Info & Controls */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Title */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm sm:text-base font-bold text-white line-clamp-2">
              #{index + 1} {clip.title}
            </h3>
          </div>

          {/* Hook quote */}
          <div className="mt-2.5 rounded-xl border border-zinc-800/80 bg-zinc-950/60 p-2.5">
            <div className="text-[10px] font-bold tracking-wider text-zinc-500 uppercase">
              First 3-Sec Hook
            </div>
            <p className="mt-0.5 text-xs font-medium text-pink-300 italic line-clamp-2">
              &quot;{clip.hook}&quot;
            </p>
          </div>

          {/* AI Reason */}
          <p className="mt-2.5 text-xs text-zinc-400 leading-relaxed">
            <span className="font-semibold text-zinc-200">Why it works: </span>
            {clip.reason}
          </p>

          {/* Caption Style Switcher */}
          <div className="mt-4 flex items-center justify-between text-xs">
            <span className="text-zinc-500 font-medium flex items-center space-x-1">
              <Palette className="h-3.5 w-3.5" />
              <span>Captions:</span>
            </span>
            <div className="flex space-x-1">
              {(['hormozi', 'neon', 'crisp'] as SubtitleStyle[]).map((st) => (
                <button
                  key={st}
                  onClick={() => onStyleChange(st)}
                  className={`rounded-lg px-2 py-1 text-[11px] font-bold uppercase transition-all ${
                    subtitleStyle === st
                      ? 'bg-zinc-800 text-pink-400 border border-pink-500/30'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 space-y-2">
          {/* Download button */}
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 rounded-xl bg-pink-600 hover:bg-pink-500 px-4 py-2.5 text-xs sm:text-sm font-bold text-white shadow-md shadow-pink-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Exporting Short ({exportProgress}%)...</span>
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                <span>Download 9:16 Short</span>
              </>
            )}
          </button>

          {/* Secondary share & copy row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={handleCopyHook}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Hook'}</span>
            </button>

            <button
              onClick={handleShare}
              className="flex items-center justify-center space-x-1.5 rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs font-semibold text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <Share2 className="h-3.5 w-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
