import { SubtitleStyle, TranscriptSegment, WordSegment } from '@/types';

interface RenderCaptionOptions {
  ctx: CanvasRenderingContext2D;
  canvasWidth: number;
  canvasHeight: number;
  currentTime: number; // in seconds
  segments: TranscriptSegment[];
  style?: SubtitleStyle;
}

/**
 * Finds the currently active segment and words for a given timestamp
 */
export function getActiveCaptionWords(
  segments: TranscriptSegment[],
  currentTime: number
): { allWords: WordSegment[]; activeIndex: number; text: string } | null {
  for (const seg of segments) {
    const segEnd = seg.start + seg.duration;
    // Add small buffer so subtitle stays visible
    if (currentTime >= seg.start - 0.1 && currentTime <= segEnd + 0.2) {
      if (seg.words && seg.words.length > 0) {
        let activeIdx = 0;
        for (let i = 0; i < seg.words.length; i++) {
          if (currentTime >= seg.words[i].start && currentTime <= seg.words[i].end) {
            activeIdx = i;
            break;
          } else if (currentTime > seg.words[i].end) {
            activeIdx = i;
          }
        }
        return {
          allWords: seg.words,
          activeIndex: activeIdx,
          text: seg.text,
        };
      } else {
        // Approximate words from text
        const words = seg.text.split(/\s+/).filter(Boolean);
        const wDuration = seg.duration / (words.length || 1);
        const wordSegs: WordSegment[] = words.map((w, idx) => ({
          word: w,
          start: seg.start + idx * wDuration,
          end: seg.start + (idx + 1) * wDuration,
        }));
        const activeIdx = Math.min(
          words.length - 1,
          Math.max(0, Math.floor((currentTime - seg.start) / wDuration))
        );
        return {
          allWords: wordSegs,
          activeIndex: activeIdx,
          text: seg.text,
        };
      }
    }
  }
  return null;
}

/**
 * Draws animated, high-impact captions onto a Canvas (for 9:16 vertical video)
 */
export function renderCaptionsOnCanvas({
  ctx,
  canvasWidth,
  canvasHeight,
  currentTime,
  segments,
  style = 'hormozi',
}: RenderCaptionOptions) {
  const activeData = getActiveCaptionWords(segments, currentTime);
  if (!activeData || activeData.allWords.length === 0) return;

  const { allWords, activeIndex } = activeData;

  // We display words in small readable chunks (typically 3 to 5 words per flash)
  const chunkSize = 4;
  const chunkIndex = Math.floor(activeIndex / chunkSize);
  const startIdx = chunkIndex * chunkSize;
  const currentChunk = allWords.slice(startIdx, startIdx + chunkSize);
  const localActiveIdx = activeIndex - startIdx;

  ctx.save();

  // Position captions in lower third of 9:16 vertical video (around 72% height)
  const centerY = canvasHeight * 0.72;
  const baseFontSize = Math.max(24, Math.round(canvasWidth * 0.065));

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  if (style === 'hormozi') {
    // Alex Hormozi / OpusClip Style: Bold uppercase, heavy outline, active word highlighted in bright yellow with scale pop
    ctx.font = `900 ${baseFontSize}px "Montserrat", "Impact", "Arial Black", sans-serif`;

    // Measure widths of each word in chunk
    const wordSpacings = currentChunk.map((w) => ctx.measureText(w.word.toUpperCase()).width);
    const spaceWidth = ctx.measureText(' ').width * 1.2;
    const totalChunkWidth =
      wordSpacings.reduce((sum, w) => sum + w, 0) + spaceWidth * (currentChunk.length - 1);

    let startX = (canvasWidth - totalChunkWidth) / 2;

    currentChunk.forEach((wObj, idx) => {
      const isWordActive = idx === localActiveIdx;
      const wordText = wObj.word.toUpperCase();
      const wordWidth = wordSpacings[idx];
      const wordCenterX = startX + wordWidth / 2;

      ctx.save();
      ctx.translate(wordCenterX, centerY);

      if (isWordActive) {
        ctx.scale(1.15, 1.15); // Dynamic pop-in
      }

      // Drop shadow for ultra high contrast
      ctx.shadowColor = 'rgba(0, 0, 0, 0.85)';
      ctx.shadowBlur = 12;
      ctx.shadowOffsetX = 3;
      ctx.shadowOffsetY = 4;

      // Heavy black stroke
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = Math.max(6, Math.round(baseFontSize * 0.18));
      ctx.lineJoin = 'miter';
      ctx.miterLimit = 2;
      ctx.strokeText(wordText, 0, 0);

      // Fill color: Active word is bright yellow, others are crisp white
      ctx.fillStyle = isWordActive ? '#FACC15' : '#FFFFFF';
      ctx.fillText(wordText, 0, 0);

      ctx.restore();

      startX += wordWidth + spaceWidth;
    });
  } else if (style === 'neon') {
    // Cyberpunk Neon Style: Glow, green/cyan accents
    ctx.font = `800 ${baseFontSize}px "Montserrat", "Trebuchet MS", sans-serif`;
    const fullText = currentChunk.map((w) => w.word).join(' ');

    ctx.shadowColor = '#10B981';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#022C22';
    ctx.lineWidth = 6;
    ctx.strokeText(fullText, canvasWidth / 2, centerY);

    ctx.fillStyle = '#6EE7B7';
    ctx.fillText(fullText, canvasWidth / 2, centerY);
  } else {
    // Crisp Studio Style: White text with rounded dark pill background
    ctx.font = `700 ${baseFontSize * 0.85}px system-ui, -apple-system, sans-serif`;
    const fullText = currentChunk.map((w) => w.word).join(' ');
    const textMetrics = ctx.measureText(fullText);
    const boxPadding = 16;
    const boxWidth = textMetrics.width + boxPadding * 2;
    const boxHeight = baseFontSize * 1.5;

    // Background pill
    ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
    const boxX = (canvasWidth - boxWidth) / 2;
    const boxY = centerY - boxHeight / 2;
    const radius = 12;
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxWidth, boxHeight, radius);
    ctx.fill();

    // Text
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(fullText, canvasWidth / 2, centerY);
  }

  ctx.restore();
}
