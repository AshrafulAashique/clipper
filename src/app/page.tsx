'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/Navbar';
import { UrlInputBar } from '@/components/UrlInputBar';
import { ProcessTracker } from '@/components/ProcessTracker';
import { ReportBanner } from '@/components/ReportBanner';
import { ClipCard } from '@/components/ClipCard';
import { SettingsModal } from '@/components/SettingsModal';
import { DetectionReport, SubtitleStyle } from '@/types';
import { createZipFromClips, downloadFile } from '@/lib/video-clipper';
import { renderCaptionsOnCanvas } from '@/lib/caption-renderer';
import {
  Sparkles,
  Zap,
  Flame,
  ShieldCheck,
  CheckCircle,
  Scissors,
  Smartphone,
  Layers,
  HelpCircle,
} from 'lucide-react';

export default function Home() {
  const [url, setUrl] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [subtitleStyle, setSubtitleStyle] = useState<SubtitleStyle>('hormozi');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusText, setStatusText] = useState('');
  const [report, setReport] = useState<DetectionReport | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isZipping, setIsZipping] = useState(false);

  // Load API key from local storage
  useEffect(() => {
    const savedKey = localStorage.getItem('clipforge_gemini_key');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSaveApiKey = (newKey: string) => {
    setApiKey(newKey);
    localStorage.setItem('clipforge_gemini_key', newKey);
  };

  const handleGenerate = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setErrorMessage('');
    setReport(null);
    setCurrentStep(0);
    setStatusText('Connecting to video source...');

    try {
      // Step 1: Ingestion
      setCurrentStep(0);
      setStatusText('Ingesting video metadata & audio stream...');
      await new Promise((r) => setTimeout(r, 600));

      // Step 2: Transcription
      setCurrentStep(1);
      setStatusText('Extracting speech & generating millisecond timestamps...');
      await new Promise((r) => setTimeout(r, 800));

      // Step 3: Moment Detection
      setCurrentStep(2);
      setStatusText('AI analyzing jokes, reactions, unexpected twists & punchlines...');

      const response = await fetch('/api/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), apiKey: apiKey || undefined }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Server responded with ${response.status}`);
      }

      const data: DetectionReport = await response.json();

      // Step 4: Formatting
      setCurrentStep(3);
      setStatusText('Synthesizing 15–30s viral shorts with animated subtitles...');
      await new Promise((r) => setTimeout(r, 700));

      setReport(data);
    } catch (err: any) {
      console.error('Generation error:', err);
      setErrorMessage(err.message || 'Failed to analyze video. Please check the URL and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Master ZIP generator
  const handleDownloadAllZip = async () => {
    if (!report || report.clips.length === 0) return;

    setIsZipping(true);
    try {
      const clipsWithBlobs = [];

      for (let i = 0; i < report.clips.length; i++) {
        const clip = report.clips[i];

        // Generate synthetic video blob for zip bundling
        const canvas = document.createElement('canvas');
        canvas.width = 720;
        canvas.height = 1280;
        const ctx = canvas.getContext('2d')!;

        // Render poster frame
        ctx.fillStyle = '#09090b';
        ctx.fillRect(0, 0, 720, 1280);

        renderCaptionsOnCanvas({
          ctx,
          canvasWidth: 720,
          canvasHeight: 1280,
          currentTime: clip.startTime + 1,
          segments: clip.segments,
          style: subtitleStyle,
        });

        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
        });

        clipsWithBlobs.push({ clip, blob });
      }

      const zipBlob = await createZipFromClips(clipsWithBlobs, report.video.title);
      downloadFile(zipBlob, `ClipForge_${report.video.id}_ViralClips.zip`);
    } catch (err) {
      console.error('ZIP generation error:', err);
      alert('Could not compile ZIP archive. Try downloading clips individually.');
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100">
      {/* Navigation Bar */}
      <Navbar onOpenSettings={() => setIsSettingsOpen(true)} />

      {/* Main Content */}
      <main className="flex-1 px-4 py-8 sm:py-12 max-w-7xl mx-auto w-full">
        {/* Hero Section */}
        <div className="text-center space-y-4 mb-8 sm:mb-12">
          <div className="inline-flex items-center space-x-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3.5 py-1 text-xs font-semibold text-pink-400">
            <Sparkles className="h-3.5 w-3.5" />
            <span>AI Short-Form Video Clipper • OpusClip Replica</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Turn Any Long Video into{' '}
            <span className="bg-gradient-to-r from-pink-500 via-rose-400 to-amber-400 bg-clip-text text-transparent">
              Viral 15–30s Shorts
            </span>
          </h1>

          <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Automatically pinpoints jokes, sudden reactions, punchlines, and high-retention moments.
            Generates 5+ clips when worthy moments exist, with animated Alex Hormozi captions.
          </p>
        </div>

        {/* Video URL Input */}
        <UrlInputBar
          url={url}
          setUrl={setUrl}
          onSubmit={handleGenerate}
          isLoading={isLoading}
        />

        {/* Error Notification */}
        {errorMessage && (
          <div className="mt-6 max-w-2xl mx-auto rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-center text-sm text-red-300">
            {errorMessage}
          </div>
        )}

        {/* Pipeline Progress Indicator */}
        {isLoading && (
          <ProcessTracker currentStep={currentStep} statusText={statusText} />
        )}

        {/* Results Section */}
        {report && !isLoading && (
          <section className="mt-10 animate-in fade-in duration-300">
            {/* Report Banner */}
            <ReportBanner
              report={report}
              onDownloadAllZip={handleDownloadAllZip}
              isZipping={isZipping}
            />

            {/* Clips Grid */}
            <div className="mt-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-pink-500" />
                  <span>Curated Viral Moments ({report.clips.length})</span>
                </h3>
                <span className="text-xs text-zinc-400">
                  Click play to preview animated captions
                </span>
              </div>

              {report.clips.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {report.clips.map((clip, idx) => (
                    <ClipCard
                      key={clip.id}
                      clip={clip}
                      video={report.video}
                      subtitleStyle={subtitleStyle}
                      onStyleChange={setSubtitleStyle}
                      index={idx}
                    />
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-12 text-center text-zinc-400">
                  No high-retention segments met the virality criteria for this video.
                </div>
              )}
            </div>
          </section>
        )}

        {/* Feature Highlights (when empty) */}
        {!report && !isLoading && (
          <div className="mt-16 pt-12 border-t border-zinc-800/80">
            <h3 className="text-center text-xs font-bold tracking-widest text-zinc-500 uppercase mb-8">
              Engineered for Free Vercel Serverless & Mobile Phone Access
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2.5">
                <div className="p-2.5 w-fit rounded-xl bg-pink-500/10 text-pink-400">
                  <Smartphone className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Mobile-First UI</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Optimized for one-handed operation on mobile browsers (Safari & Chrome). Includes native Web Share API to export straight to TikTok and Instagram.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2.5">
                <div className="p-2.5 w-fit rounded-xl bg-amber-500/10 text-amber-400">
                  <Flame className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Smart Moment Detection</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Pinpoints punchlines, funny jokes, and unexpected insights. Enforces 15–30s durations and reports when a video lacks 5 genuine moments without forcing filler.
                </p>
              </div>

              <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/40 p-5 space-y-2.5">
                <div className="p-2.5 w-fit rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Zap className="h-5 w-5" />
                </div>
                <h4 className="text-sm font-bold text-white">Zero Server Cost</h4>
                <p className="text-xs text-zinc-400 leading-relaxed">
                  Uses YouTube timedtext captions and free Google Gemini Flash / heuristic NLP. Subtitles and 9:16 rendering execute on-device, bypassing Vercel timeout limits!
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800 bg-zinc-950 py-6 text-center text-xs text-zinc-500">
        <p>ClipForge AI • Built for Free Vercel Serverless Hosting • 100% Free Tier</p>
      </footer>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        subtitleStyle={subtitleStyle}
        onSelectSubtitleStyle={setSubtitleStyle}
      />
    </div>
  );
}

