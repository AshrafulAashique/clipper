import { ClipMoment, MomentCategory, TranscriptSegment } from '@/types';

interface AiAnalysisResult {
  clips: ClipMoment[];
  statusMessage: string;
  hasMinimumFive: boolean;
}

/**
 * Heuristic fallback moment detector when no AI API key is configured.
 * Scans speech density, emotional cues, punchline indicators, and dialogue pacing.
 */
export function heuristicMomentDetector(
  segments: TranscriptSegment[],
  totalDuration: number
): AiAnalysisResult {
  if (!segments || segments.length === 0) {
    return {
      clips: [],
      statusMessage: 'No speech segments detected in this video to extract clips from.',
      hasMinimumFive: false,
    };
  }

  // Keywords that signal humor, surprise, high emotion, punchlines, or key takeaways
  const punchlineKeywords = [
    'wait', 'what', 'crazy', 'insane', 'secret', 'never', 'hilarious', 'laugh',
    'joke', 'actually', 'shocking', 'omg', 'holy', 'punchline', 'truth', 'mistake',
    'stop', 'listen', 'look', 'unbelievable', 'stupid', 'genius', 'why', 'how',
    'suddenly', 'boom', 'plot twist', 'worst', 'best', 'warning', 'rules'
  ];

  // Group segments into candidate 15-30 second windows
  interface WindowCandidate {
    start: number;
    end: number;
    duration: number;
    text: string;
    score: number;
    category: MomentCategory;
    hook: string;
    segments: TranscriptSegment[];
  }

  const candidates: WindowCandidate[] = [];
  const minDuration = 15;
  const maxDuration = 30;

  for (let i = 0; i < segments.length; i++) {
    const startSeg = segments[i];
    const windowStart = startSeg.start;
    let windowEnd = startSeg.start + startSeg.duration;
    let windowText = startSeg.text;
    const windowSegs: TranscriptSegment[] = [startSeg];

    for (let j = i + 1; j < segments.length; j++) {
      const nextSeg = segments[j];
      const newDuration = (nextSeg.start + nextSeg.duration) - windowStart;

      if (newDuration > maxDuration) break;

      windowEnd = nextSeg.start + nextSeg.duration;
      windowText += ' ' + nextSeg.text;
      windowSegs.push(nextSeg);

      if (newDuration >= minDuration) {
        // Score this candidate window
        const lower = windowText.toLowerCase();
        let keywordHits = 0;
        punchlineKeywords.forEach((kw) => {
          if (lower.includes(kw)) keywordHits++;
        });

        // Question mark and exclamation mark density
        const exclamationCount = (windowText.match(/!/g) || []).length;
        const questionCount = (windowText.match(/\?/g) || []).length;

        // Word rate (words per second) - energetic speech is 2.5 to 3.8 words/sec
        const wordCount = windowText.split(/\s+/).length;
        const wordsPerSec = wordCount / newDuration;
        const energyBonus = wordsPerSec >= 2.5 && wordsPerSec <= 4.0 ? 15 : 5;

        // Calculate score
        let score = 50 + keywordHits * 7 + exclamationCount * 5 + questionCount * 4 + energyBonus;
        score = Math.min(99, Math.max(40, score));

        // Determine category
        let category: MomentCategory = 'insight';
        if (lower.includes('laugh') || lower.includes('joke') || lower.includes('funny') || exclamationCount >= 2) {
          category = 'joke';
        } else if (lower.includes('wait') || lower.includes('what') || lower.includes('crazy') || lower.includes('insane')) {
          category = 'unexpected';
        } else if (questionCount > 0 && exclamationCount > 0) {
          category = 'reaction';
        } else if (lower.includes('secret') || lower.includes('lesson') || lower.includes('remember')) {
          category = 'insight';
        } else {
          category = 'punchline';
        }

        const firstSentence = windowText.split(/[.?!]/)[0]?.trim() || windowText.slice(0, 50);

        candidates.push({
          start: windowStart,
          end: windowEnd,
          duration: newDuration,
          text: windowText,
          score,
          category,
          hook: firstSentence,
          segments: [...windowSegs],
        });
      }
    }
  }

  // Filter out overlapping candidates, keeping the highest-scoring ones
  candidates.sort((a, b) => b.score - a.score);

  const nonOverlapping: WindowCandidate[] = [];
  const minSeparationSeconds = 12; // Avoid duplicating the same exact speech

  for (const cand of candidates) {
    const overlaps = nonOverlapping.some(
      (selected) => Math.max(cand.start, selected.start) < Math.min(cand.end, selected.end) - minSeparationSeconds
    );
    if (!overlaps && cand.score >= 60) {
      nonOverlapping.push(cand);
    }
  }

  // Sort chronologically for better user experience, or keep top virality
  const finalClips: ClipMoment[] = nonOverlapping.map((c, index) => {
    // Generate punchy titles
    const titlePresets: Record<MomentCategory, string[]> = {
      joke: ['Wait For The Punchline 😂', 'He Did NOT Just Say That', 'Unfiltered Comedy Gold'],
      unexpected: ['Nobody Saw This Coming 🤯', 'The Plot Twist Everyone Missed', 'Wait Until You Hear This'],
      reaction: ['Priceless Real-Time Reaction', 'Total Disbelief Caught On Camera', 'The Exact Second Everything Changed'],
      punchline: ['The Brutal Truth Exposed', 'Dropping Knowledge Bomb', 'The Ultimate Reality Check'],
      insight: ['Mind-Blowing Perspective', 'The One Secret Nobody Tells You', 'Watch This Before It Gets Deleted'],
    };

    const presetList = titlePresets[c.category] || titlePresets.insight;
    const chosenTitle = presetList[index % presetList.length];

    return {
      id: `clip-${index + 1}-${Math.round(c.start)}`,
      title: chosenTitle,
      hook: c.hook.length > 70 ? c.hook.slice(0, 67) + '...' : c.hook,
      reason: `Detected high-intensity ${c.category} with strong verbal payoff and pacing (${c.score}% virality rating).`,
      viralityScore: c.score,
      category: c.category,
      startTime: Math.round(c.start * 10) / 10,
      endTime: Math.round(c.end * 10) / 10,
      duration: Math.round(c.duration * 10) / 10,
      segments: c.segments,
      tags: ['#viral', '#shorts', `#${c.category}`, '#trending', '#mustwatch'],
      aspectRatio: '9:16',
    };
  });

  const count = finalClips.length;
  const hasMinimumFive = count >= 5;

  let statusMessage = '';
  if (count === 0) {
    statusMessage = 'Could not find any suitable 15–30s segments with high engagement markers.';
  } else if (count < 5) {
    statusMessage = `Found ${count} high-impact clip${count === 1 ? '' : 's'}. The video did not contain enough high-retention moments to reach 5 without forcing low-quality filler.`;
  } else {
    statusMessage = `Successfully identified ${count} viral moments exceeding engagement thresholds!`;
  }

  return {
    clips: finalClips,
    statusMessage,
    hasMinimumFive,
  };
}

/**
 * AI Moment Detection using Google Gemini 1.5/2.0 Flash (Free API tier)
 */
export async function geminiMomentDetector(
  segments: TranscriptSegment[],
  apiKey: string,
  videoTitle: string
): Promise<AiAnalysisResult> {
  // Compress transcript to save context and speed up response
  const simplifiedTranscript = segments.map((s) => ({
    t: `${Math.round(s.start)}s-${Math.round(s.start + s.duration)}s`,
    start: Math.round(s.start * 10) / 10,
    end: Math.round((s.start + s.duration) * 10) / 10,
    text: s.text,
  }));

  const prompt = `
You are the world's most elite short-form video editor (similar to OpusClip, Klap, and Vidyo.ai).
Your job is to analyze this timestamped video transcript and identify the most viral, captivating standalone clips for TikTok, YouTube Shorts, and Instagram Reels.

Video Title: "${videoTitle}"

REQUIREMENTS:
1. Clip Duration: STRICTLY between 15 and 30 seconds per clip (duration = endTime - startTime).
2. Content Focus: Prioritize jokes, unexpected twists, strong emotional reactions, hilarious punchlines, and high-impact insightful statements.
3. Hook & Payoff: Every clip MUST begin with an immediate attention-grabbing hook in the first 3 seconds, and MUST resolve with a satisfying punchline or payoff. Do NOT cut in the middle of a sentence.
4. Selection Rule:
   - Identify AT LEAST 5 clips if at least 5 strong moments exist.
   - If more strong moments exist (6, 7, 8, etc.), include all of them!
   - CRITICAL REQUIREMENT: If the video DOES NOT contain 5 genuinely worthwhile moments, DO NOT force 5 clips! Only return the genuinely worthwhile moments, and explain in "statusMessage" why fewer than 5 were found.
5. Virality Score: Grade each moment from 60 to 99 based on hook strength, pacing, and emotional payoff.

TRANSCRIPT:
${JSON.stringify(simplifiedTranscript.slice(0, 300), null, 2)}

Respond with ONLY valid JSON strictly matching this schema:
{
  "clips": [
    {
      "title": "Punchy 3-6 word click-worthy headline",
      "hook": "The exact opening line of the clip",
      "reason": "Why this moment goes viral (psychological hook & punchline)",
      "viralityScore": 94,
      "category": "joke" | "unexpected" | "reaction" | "punchline" | "insight",
      "startTime": 45.2,
      "endTime": 68.5,
      "tags": ["#tag1", "#tag2", "#tag3"]
    }
  ],
  "hasMinimumFive": boolean,
  "statusMessage": "Summary explanation of detected moments or why fewer than 5 were found"
}
`;

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini API error (${response.status}): ${errText}`);
    }

    const data = await response.json();
    const rawContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawContent) {
      throw new Error('No content returned from Gemini');
    }

    const parsed = JSON.parse(rawContent);

    // Map segments to each clip
    const mappedClips: ClipMoment[] = (parsed.clips || []).map((c: any, index: number) => {
      const startTime = parseFloat(c.startTime);
      const endTime = parseFloat(c.endTime);
      const duration = Math.round((endTime - startTime) * 10) / 10;

      // Extract matching transcript segments for subtitle rendering
      const matchingSegments = segments.filter(
        (s) => s.start >= startTime - 1 && s.start <= endTime + 1
      );

      return {
        id: `ai-clip-${index + 1}-${Math.round(startTime)}`,
        title: c.title || `Viral Highlight #${index + 1}`,
        hook: c.hook || '',
        reason: c.reason || 'High emotional impact and retention.',
        viralityScore: c.viralityScore || 85,
        category: (c.category as MomentCategory) || 'punchline',
        startTime,
        endTime,
        duration,
        segments: matchingSegments,
        tags: Array.isArray(c.tags) ? c.tags : ['#viral', '#shorts'],
        aspectRatio: '9:16',
      };
    });

    const count = mappedClips.length;
    return {
      clips: mappedClips,
      hasMinimumFive: count >= 5,
      statusMessage:
        parsed.statusMessage ||
        (count >= 5
          ? `Discovered ${count} viral moments with excellent retention potential.`
          : `Identified ${count} strong clip${count === 1 ? '' : 's'}. Video did not contain 5 sufficiently punchy moments.`),
    };
  } catch (err) {
    console.error('Gemini moment detection failed, falling back to heuristic engine:', err);
    return heuristicMomentDetector(segments, 0);
  }
}
