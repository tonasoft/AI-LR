# AI Launch Roast

AI Launch Roast is a hackathon-ready web app that takes a startup URL and generates viral, funny memes using Magic Hour's AI image generation APIs. It fetches the page title and meta description, then creates shareable promotional memes in multiple styles (roast, distracted boyfriend, drake, etc.) in under 30 seconds.

## What it does
- Accepts a product or Product Hunt URL.
- Fetches the page title + meta description.
- Falls back to manual description input if metadata is unavailable.
- Choose from multiple meme styles (roast, distracted boyfriend, drake, etc.).
- Sends the prompt to Magic Hour to generate a funny meme image.
- Provides a shareable link with referral tag (?ref=falconhacks).

## Tech stack
- **Frontend:** React + Vite
- **Backend:** Node.js + Express
- **AI:** Magic Hour (image generation)
- **Styling:** Clean CSS, mobile-first

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in `server/`:
   ```bash
   MAGIC_HOUR_API_KEY=your_magic_hour_api_key_here
   PORT=3000
   ```

3. Start the app:
   ```bash
   npm run dev
   ```

This runs both the Vite client and Express API in one command.

## Magic Hour API key
Get your API key from [Magic Hour Developer Hub](https://magichour.ai/developer?tab=api-keys) and set it as `MAGIC_HOUR_API_KEY` in `server/.env`.

## One-command run
```bash
npm install && npm run dev
```

## Share loop
- Users generate unique, funny memes roasting their startup.
- Shareable link includes referral tag for attribution.
- Viral potential on social media, Product Hunt, etc.
- New users discover the tool through shared memes.
- Bonus: Chrome extension for one-click roasting from any product page (future feature).
