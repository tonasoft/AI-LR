# AI Launch Roast - Copilot Instructions

## Architecture Overview
This is a full-stack web app with clear client-server separation:
- **Client** (`client/`): React + Vite frontend for user interaction
- **Server** (`server/`): Express.js API handling metadata fetching and AI roasting
- **Data Flow**: URL → Client → Server (preview) → Client → Server (roast) → Gemini AI → Response

## Development Workflow
- Run `npm run dev` from root - uses `concurrently` to start both client (port 5173) and server (port 3000)
- Server uses `node --watch index.js` for auto-restart on changes
- Client hot-reloads via Vite
- Environment: Set `GEMINI_API_KEY` in `server/.env` (required for roasting)

## Key Patterns
- **API Communication**: Client uses `fetch` to `API_BASE` (defaults to `http://localhost:3000`)
- **Error Handling**: Server returns specific error messages ("Preview fetch failed", "Gemini request failed")
- **Gemini Integration**: Uses `gemini-1.5-flash` model with custom prompt in `buildPrompt()`
- **HTML Parsing**: Server uses `cheerio` to extract title and meta description from URLs
- **Response Parsing**: Client's `parseLines()` function cleans numbered lists from AI responses
- **Styling**: Dark theme with CSS variables, responsive design using `clamp()`, radial gradients

## File Structure Conventions
- Root `package.json` manages workspaces and concurrent dev scripts
- Client dependencies in `client/package.json`, server in `server/package.json`
- No build step for server - runs directly with Node.js
- Client builds to static files via Vite for production

## Common Tasks
- **Adding API endpoints**: Follow `/api/*` pattern in `server/index.js`
- **Frontend features**: Modify `client/src/App.jsx`, use React hooks for state
- **Styling**: Update `client/src/styles.css` with existing color scheme (#0f172a background, #f8fafc text)
- **Environment vars**: Add to `server/.env` for server-side config

## Dependencies
- Server: Express, Cheerio, Google Generative AI, CORS, dotenv
- Client: React, Vite
- Dev: Concurrently for multi-process development</content>
<parameter name="filePath">.github/copilot-instructions.md