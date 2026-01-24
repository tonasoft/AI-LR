# ✨ ExpressFit

**See yourself in any outfit instantly.** A viral-ready web app that lets you upload your photo and try on any garment using Magic Hour's AI Clothes Changer. Results are shareable, downloadable, and credits Magic Hour.

## Challenge Statement

Built for the [Magic Hour Hackathon](https://magichour.ai/api) – **Build a repeatable distribution channel using Magic Hour's APIs** that gets users results in <30 seconds and makes sharing effortless.

## What It Does

1. **Upload your photo** (portrait mode works best)
2. **Pick a garment image** (direct URL, e.g., via.placeholder.com)
3. **Select garment type** (upper body, lower body, full body)
4. **Get instant try-on** powered by Magic Hour Clothes Changer AI
5. **Download & share** – one-click Twitter share with Magic Hour referral

## Share Loop

- **Shareable link:** `https://expressfit.app/?result={jobId}` – friends can see your result
- **Download:** Get the result image to share anywhere
- **Social share:** Pre-filled Twitter post with Magic Hour attribution (`?ref=expressfit`)
- **Attribution:** Every output links to Magic Hour with referral tag

## Time-to-Wow: ~30-60 seconds

1. Upload photos (10 sec)
2. Click "Generate" (2 sec)
3. Watch it process (30-60 sec for Magic Hour to render)
4. Download & share (3 sec)

## Tech Stack

- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI:** Magic Hour Clothes Changer API
- **Styling:** CSS with dark theme
- **3D Preview:** Three.js (interactive model viewer)

## Setup

### One-command run:

```bash
npm install && npm run dev
```

This installs all dependencies and starts both the Vite frontend (port 5173) and Express backend (port 3000) in parallel.

### Manual setup:

1. Install root + client + server dependencies:
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   cd ..
   ```

2. Create `.env` in the repo root:
   ```bash
   MAGIC_HOUR_API_KEY=your_magic_hour_api_key
   ```

   Get your key from [Magic Hour API](https://magichour.ai/api)

3. Start both servers:
   ```bash
   npm run dev
   ```

4. Open http://localhost:5173 in your browser

## Features

- ⚡ **Quick Try-On Tab** – Skip the profile form, get results in <30 seconds
- 👤 **Profile Mode** – Save your details for personalized results
- 👗 **Try-On Tab** – Advanced options with saved profiles
- 🎨 **3D Preview** – Interactive model viewer (drag to rotate)
- 📥 **Download** – Save results to your device
- 🐦 **Twitter Share** – Share with Magic Hour attribution built-in
- 🔗 **Shareable Links** – Friends can see results without uploading

## Image URL Sources

Use **CORS-friendly URLs** for best results:

- `https://via.placeholder.com/{width}x{height}.jpg?text=YourText`
- `https://imgur.com/` direct links
- Your own image server
- Public URLs with CORS headers enabled

**Avoid:** Sites with strict CORS policies (Freepik, Getty Images, etc.)

## Hackathon Checklist

- ✅ **Live demo link:** http://localhost:5173
- ✅ **GitHub repo:** All code + one-command setup
- ✅ **Time-to-wow:** <30 seconds (after Magic Hour processing)
- ✅ **Share loop:** Result links + social share buttons
- ✅ **Attribution:** All Magic Hour links include `?ref=expressfit`
- ✅ **Viral potential:** Photo try-ons naturally inspire shares
- ✅ **Simple UX:** 3 inputs → 1 button → Results
- ✅ **Naturally shareable:** Download + Twitter intent built-in

---

**Powered by [Magic Hour AI](https://magichour.ai?ref=expressfit) 🎨**
