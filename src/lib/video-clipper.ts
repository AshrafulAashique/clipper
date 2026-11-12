import JSZip from 'jszip';
import { ClipMoment, SubtitleStyle } from '@/types';
import { renderCaptionsOnCanvas } from './caption-renderer';

interface ExportClipOptions {
  videoElement: HTMLVideoElement;
  clip: ClipMoment;
  subtitleStyle?: SubtitleStyle;
  onProgress?: (progress: number) => void;
  width?: number;
  height?: number;
}

/**
 * Trims a video segment and burns animated karaoke subtitles into an MP4/WebM blob
 */
export async function renderAndExportClip({
  videoElement,
  clip,
  subtitleStyle = 'hormozi',
  onProgress,
  width = 720,
  height = 1280,
}: ExportClipOptions): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Could not get 2D canvas context');
      }

      // Check supported MIME types for MediaRecorder
      let mimeType = 'video/webm;codecs=vp9,opus';
      if (MediaRecorder.isTypeSupported('video/mp4;codecs=avc1')) {
        mimeType = 'video/mp4;codecs=avc1';
      } else if (MediaRecorder.isTypeSupported('video/mp4')) {
        mimeType = 'video/mp4';
      } else if (MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) {
        mimeType = 'video/webm;codecs=vp8,opus';
      } else if (MediaRecorder.isTypeSupported('video/webm')) {
        mimeType = 'video/webm';
      }

      // Set up audio capture from the video element
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      let audioSource: MediaElementAudioSourceNode | null = null;
      let audioDestination: MediaStreamAudioDestinationNode | null = null;

      try {
        audioSource = audioCtx.createMediaElementSource(videoElement);
        audioDestination = audioCtx.createMediaStreamDestination();
        audioSource.connect(audioDestination);
        audioSource.connect(audioCtx.destination);
      } catch (e) {
        // Source might already be connected
      }

      const canvasStream = canvas.captureStream(30);
      if (audioDestination && audioDestination.stream.getAudioTracks().length > 0) {
        audioDestination.stream.getAudioTracks().forEach((track) => {
          canvasStream.addTrack(track);
        });
      }

      const recorder = new MediaRecorder(canvasStream, {
        mimeType,
        videoBitsPerSecond: 4_500_000,
      });

      const chunks: BlobPart[] = [];
      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = () => {
        const finalBlob = new Blob(chunks, { type: mimeType.split(';')[0] });
        resolve(finalBlob);
      };

      // Seek to clip start
      videoElement.currentTime = clip.startTime;
      await new Promise<void>((r) => {
        const onSeeked = () => {
          videoElement.removeEventListener('seeked', onSeeked);
          r();
        };
        videoElement.addEventListener('seeked', onSeeked);
      });

      // Start recording
      recorder.start(100);
      await videoElement.play();

      let animationFrameId: number;

      const drawFrame = () => {
        const currentTime = videoElement.currentTime;

        // Check if clip duration ended
        if (currentTime >= clip.endTime || videoElement.ended || videoElement.paused) {
          cancelAnimationFrame(animationFrameId);
          videoElement.pause();
          recorder.stop();
          if (onProgress) onProgress(100);
          return;
        }

        // Calculate progress percentage
        const progress = Math.min(
          99,
          Math.max(0, ((currentTime - clip.startTime) / clip.duration) * 100)
        );
        if (onProgress) onProgress(Math.round(progress));

        // 1. Draw 9:16 background
        // First draw blurred background from video to create stylish vertical aesthetic
        ctx.save();
        ctx.filter = 'blur(20px) brightness(0.6)';
        // Draw zoomed video across the full 9:16 canvas
        ctx.drawImage(videoElement, -width * 0.2, -height * 0.1, width * 1.4, height * 1.2);
        ctx.restore();

        // 2. Draw centered video in aspect ratio
        const vidW = videoElement.videoWidth || 1920;
        const vidH = videoElement.videoHeight || 1080;
        const videoAspect = vidW / vidH;

        // Scale to fit width
        const drawW = width;
        const drawH = drawW / videoAspect;
        const drawY = (height - drawH) / 2;

        ctx.drawImage(videoElement, 0, drawY, drawW, drawH);

        // 3. Render dynamic karaoke captions
        renderCaptionsOnCanvas({
          ctx,
          canvasWidth: width,
          canvasHeight: height,
          currentTime,
          segments: clip.segments,
          style: subtitleStyle,
        });

        animationFrameId = requestAnimationFrame(drawFrame);
      };

      animationFrameId = requestAnimationFrame(drawFrame);
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Triggers native download of a file
 */
export function downloadFile(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/**
 * Packages multiple generated clips and a summary into a single ZIP file
 */
export async function createZipFromClips(
  clipsWithBlobs: { clip: ClipMoment; blob: Blob }[],
  videoTitle: string
): Promise<Blob> {
  const zip = new JSZip();

  // Create clips folder
  const folder = zip.folder('clips') || zip;

  clipsWithBlobs.forEach(({ clip, blob }, index) => {
    const ext = blob.type.includes('mp4') ? 'mp4' : 'webm';
    const cleanTitle = clip.title.replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `clip_${index + 1}_${cleanTitle}_${clip.viralityScore}pts.${ext}`;
    folder.file(filename, blob);
  });

  // Add rich metadata summary file with ready-to-copy titles, hooks, and hashtags
  let summaryText = `# ClipForge Viral Clips Summary\n`;
  summaryText += `Source Video: ${videoTitle}\n`;
  summaryText += `Generated on: ${new Date().toLocaleString()}\n`;
  summaryText += `Total Clips: ${clipsWithBlobs.length}\n\n`;
  summaryText += `-----------------------------------------\n\n`;

  clipsWithBlobs.forEach(({ clip }, idx) => {
    summaryText += `CLIP #${idx + 1}: ${clip.title}\n`;
    summaryText += `Virality Score: ${clip.viralityScore}/100 [Category: ${clip.category.toUpperCase()}]\n`;
    summaryText += `Time: ${clip.startTime}s -> ${clip.endTime}s (${clip.duration}s)\n`;
    summaryText += `Opening Hook: "${clip.hook}"\n`;
    summaryText += `Why it works: ${clip.reason}\n`;
    summaryText += `Suggested Hashtags: ${clip.tags.join(' ')}\n\n`;
  });

  zip.file('captions_and_descriptions.txt', summaryText);

  return await zip.generateAsync({ type: 'blob' });
}

