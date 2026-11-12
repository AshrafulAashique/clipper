# ClipForge AI 🎬🔥
### An Open-Source AI Video Clipper & OpusClip Replica for Free Vercel Serverless

ClipForge turns long YouTube videos into high-retention, viral 15–30-second vertical shorts (9:16) with automated moment detection and Alex Hormozi animated karaoke captions.

Designed specifically to run **100% free on Vercel's Hobby Serverless Tier** and be operated effortlessly from your **mobile phone (iPhone / Android)**.

---

## ⚡ Key Highlights & Features

- **Input:** Paste any supported YouTube URL (Standard watch URLs, Shorts, youtu.be, or embeds).
- **AI Speech Transcription:** Extracts word- and phrase-level timestamps without needing expensive Whisper server clusters.
- **Viral Moment Detection:**
  - Pinpoints jokes, unexpected twists, shock reactions, comedic punchlines, and high-impact insights.
  - Grades every clip on a **0–100 Virality Score** with an AI reasoning breakdown (*"Why it works"*).
- **Quality-First Clip Selection:**
  - Automatically identifies at least **5 clips** when 5 or more suitable moments exist.
  - Returns more clips (6, 7, 8+) if additional strong moments are present.
  - **Graceful Shortfall Reporting:** If a video does not contain 5 worthwhile moments, it **does not force low-quality filler clips**. It presents only the genuine highlights and alerts you with a transparent curator assessment.
- **Strict 15–30s Duration:** Every clip is calibrated to standard short-form retention pacing.
- **Dynamic Animated Captions (Subtitles):**
  - **Hormozi Gold:** Bold uppercase typography with real-time active word scaling and bright yellow highlight.
  - **Neon Emerald:** Cyberpunk aesthetic with emerald glow.
  - **Crisp Studio:** Rounded dark background pill with white text.
- **Export & Download Options:**
  - Individual **"Download 9:16 Short"** button per clip.
  - Master **"Download All (ZIP)"** button bundling all generated clips + metadata file (`captions_and_descriptions.txt`).
  - Native **Mobile Share** button (shares directly to TikTok, Instagram Reels, or WhatsApp via Web Share API).
- **Mobile-Friendly UI:** Mobile viewport tuned, touch-friendly, PWA-ready ("Add to Home Screen").
- **Zero Paid AI APIs Required:**
  - Works out of the box with built-in heuristic NLP moment detection (0 API keys required).
  - Optionally connects to **Google Gemini 1.5/2.0 Flash** via the free tier on Google AI Studio.

---

## 🏗️ How It Runs on Free Vercel Without Server Timeouts

Vercel Hobby Serverless Functions have a strict 10–15 second execution timeout and a 512MB disk limit, which normally crashes server-side FFmpeg transcoding pipelines.

**ClipForge solves this with a smart hybrid architecture:**
1. **Lightweight Serverless Ingestion (`/api/extract`):** Runs on Vercel in 1–2 seconds. Parses YouTube metadata, extracts timed text streams, and runs AI moment detection.
2. **Client-Side Canvas & WebCodecs Rendering:** Video frame composition, 9:16 vertical cropping, blurred background fill, and animated subtitle burning execute **directly in the client's browser / phone**.
3. **Zero Bandwidth or Server Fees:** You never pay for heavy cloud GPUs or dedicated video rendering instances.

---

## 🚀 Quick Deployment to Vercel (100% Free)

### Option 1: Deploy with Git (Recommended)
1. Push this project to your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit of ClipForge"
   git branch -M main
   git remote add origin https://github.com/<your-username>/clipforge.git
   git push -u origin main
   ```
2. Log into [vercel.com](https://vercel.com) (free account).
3. Click **"Add New..."** -> **"Project"**.
4. Import your `clipforge` repository.
5. *(Optional)* In **Environment Variables**, add:
   - `GEMINI_API_KEY`: Your free Gemini API key from [aistudio.google.com](https://aistudio.google.com/app/apikey).
   *(If omitted, ClipForge automatically uses its built-in NLP heuristic moment detector!)*
6. Click **Deploy**. Your app is live with an `https://<your-project>.vercel.app` URL!

### Option 2: Deploy using Vercel CLI
```bash
npm i -g vercel
vercel
```

---

## 📱 Mobile Phone Access (iPhone & Android)

1. Open your Vercel URL (e.g. `https://clipforge.vercel.app`) in **Safari** (iOS) or **Chrome** (Android).
2. **Add to Home Screen:**
   - **iOS:** Tap the Share button -> *Add to Home Screen*.
   - **Android:** Tap the three dots menu -> *Install app* or *Add to Home Screen*.
3. It opens in standalone full-screen mode like a native mobile app!
4. Tap **"Paste"**, tap **"Generate Clips"**, preview the 9:16 video with animated captions, and download clips directly to your camera roll!

---

## 🛠️ Local Development

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```
