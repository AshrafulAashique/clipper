import { TranscriptSegment, VideoMetadata, WordSegment } from '@/types';

/**
 * Extracts YouTube video ID from various URL formats
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const trimmed = url.trim();

  // Pattern matches:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://youtube.com/embed/VIDEO_ID
  // - Raw 11-char ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  return null;
}

/**
 * Fetches video metadata via YouTube oEmbed API (Public, official, free, no API key needed)
 */
export async function getYouTubeMetadata(videoId: string): Promise<VideoMetadata> {
  const oEmbedUrl = `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`;

  try {
    const res = await fetch(oEmbedUrl, { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`Failed to fetch metadata from oEmbed: ${res.statusText}`);
    }
    const data = await res.json();

    return {
      id: videoId,
      title: data.title || `YouTube Video (${videoId})`,
      author: data.author_name || 'YouTube Creator',
      duration: 0, // Will be updated if available
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  } catch (err) {
    console.warn('oEmbed fetch error, using fallback metadata:', err);
    return {
      id: videoId,
      title: `YouTube Video (${videoId})`,
      author: 'YouTube Creator',
      duration: 0,
      thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    };
  }
}

/**
 * Parses XML captions from YouTube's timedtext endpoint
 */
function parseXmlCaptions(xmlText: string): TranscriptSegment[] {
  const segments: TranscriptSegment[] = [];
  const textTagRegex = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
  let match: RegExpExecArray | null;

  while ((match = textTagRegex.exec(xmlText)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    let rawText = match[3];

    // Decode HTML entities
    const text = rawText
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&apos;/g, "'")
      .replace(/\n/g, ' ')
      .trim();

    if (!text) continue;

    // Generate approximate word-level timestamps for animated karaoke subtitles
    const words = text.split(/\s+/).filter(Boolean);
    const wordDuration = words.length > 0 ? duration / words.length : duration;
    const wordSegments: WordSegment[] = words.map((w, idx) => ({
      word: w,
      start: start + idx * wordDuration,
      end: start + (idx + 1) * wordDuration,
    }));

    segments.push({
      start,
      duration,
      text,
      words: wordSegments,
    });
  }

  return segments;
}

/**
 * Fetches transcript segments directly from YouTube timedtext
 */
export async function getYouTubeTranscript(videoId: string): Promise<TranscriptSegment[]> {
  try {
    // 1. Fetch watch page HTML with realistic browser user-agent
    const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const res = await fetch(watchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    if (!res.ok) {
      throw new Error(`Failed to load YouTube watch page: ${res.status}`);
    }

    const html = await res.text();

    // 2. Extract ytInitialPlayerResponse JSON
    const playerResponseMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?});(?:var|\s*<\/script>)/);
    if (!playerResponseMatch) {
      throw new Error('ytInitialPlayerResponse not found in YouTube page HTML');
    }

    const playerResponse = JSON.parse(playerResponseMatch[1]);
    const captionTracks =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;

    if (!captionTracks || !Array.isArray(captionTracks) || captionTracks.length === 0) {
      throw new Error('No caption tracks found for this video');
    }

    // Prefer English, otherwise pick the first available
    let chosenTrack = captionTracks.find(
      (t: any) => t.languageCode === 'en' || t.vssId?.includes('.en')
    );
    if (!chosenTrack) {
      chosenTrack = captionTracks[0];
    }

    const captionUrl = chosenTrack.baseUrl;
    if (!captionUrl) {
      throw new Error('Caption track has no baseUrl');
    }

    // 3. Fetch the timedtext XML
    const captionRes = await fetch(captionUrl);
    if (!captionRes.ok) {
      throw new Error(`Failed to fetch caption data: ${captionRes.statusText}`);
    }

    const xml = await captionRes.text();
    const segments = parseXmlCaptions(xml);

    if (segments.length === 0) {
      throw new Error('Parsed 0 caption segments from XML');
    }

    return segments;
  } catch (err) {
    console.warn(`YouTube direct transcript extraction failed for ${videoId}:`, err);
    throw err;
  }
}

