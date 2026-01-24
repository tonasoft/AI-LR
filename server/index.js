import "dotenv/config";
import cors from "cors";
import express from "express";
import { load } from "cheerio";
import { GoogleGenerativeAI } from "@google/generative-ai";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const geminiApiKey = process.env.GEMINI_API_KEY;

const getMetadata = async (url) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 6000);

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent": "AI-Launch-Roast/1.0"
      }
    });

    if (!response.ok) {
      throw new Error("fetch_failed");
    }

    const html = await response.text();
    const $ = load(html);
    const title = $("title").first().text().trim();
    const description =
      $("meta[name=description]").attr("content")?.trim() ||
      $("meta[property='og:description']").attr("content")?.trim() ||
      "";

    return { title, description };
  } finally {
    clearTimeout(timeout);
  }
};

const buildPrompt = (title, description) => `You are a clever startup roast comedian.
Given this product:
Title: ${title}
Description: ${description}

Generate:
1. A funny but playful roast (max 60 words)
2. A sharp punchline (1 sentence)
3. A hook line for a 10–15 second vertical reel
4. A viral caption suitable for Twitter or Product Hunt

Tone: sarcastic, witty, not hateful.`;

app.post("/api/preview", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing URL" });
  }

  try {
    const metadata = await getMetadata(url);
    return res.json(metadata);
  } catch (error) {
    return res.status(422).json({ error: "Preview fetch failed" });
  }
});

app.post("/api/roast", async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description" });
  }

  if (!geminiApiKey) {
    return res.status(500).json({ error: "Missing GEMINI_API_KEY" });
  }

  try {
    const genAI = new GoogleGenerativeAI(geminiApiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const prompt = buildPrompt(title, description);
    const result = await model.generateContent(prompt);
    const text = result.response.text();

    return res.json({ text });
  } catch (error) {
    return res.status(500).json({ error: "Gemini request failed" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
