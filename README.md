# AI Launch Roast

AI Launch Roast is a hackathon-ready web app that takes a startup URL and produces a fast, viral-style roast using Google Gemini. It fetches the page title and meta description, then delivers four punchy outputs optimized for short-form reels and social posts.

## What it does
- Accepts a product or Product Hunt URL.
- Fetches the page title + meta description.
- Falls back to manual description input if metadata is unavailable.
- Sends the prompt to Gemini and renders four shareable lines.

## Tech stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI:** Google Gemini (text generation only)
- **Styling:** Clean CSS, mobile-first

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in `server/`:
   ```bash
   GEMINI_API_KEY=your_api_key_here
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

This runs both the Vite client and Express API in one command.

## Gemini API key
Create a key in Google AI Studio and set it as `GEMINI_API_KEY` in `server/.env`. The backend uses it to call Gemini for the roast content.

## One-command run
```bash
npm install && npm run dev
```
