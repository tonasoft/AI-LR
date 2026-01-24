import "dotenv/config";
import cors from "cors";
import express from "express";
import { load } from "cheerio";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "1mb" }));

const magicHourApiKey = process.env.MAGIC_HOUR_API_KEY;

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
  const { title, description, style } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Missing title or description" });
  }

  if (!magicHourApiKey) {
    console.log('Magic Hour API key not found');
    return res.status(500).json({ error: "Missing MAGIC_HOUR_API_KEY" });
  }

  try {
    let prompt;
    switch (style) {
      case "roast":
        prompt = `Generate an image of a hilarious meme roasting the product "${title}" with description "${description}". The meme must have English text only, no other languages. Make it funny and viral.`;
        break;
      case "distracted":
        prompt = `Generate an image of a Distracted Boyfriend meme where the boyfriend is labeled "${title}", the girlfriend is "Boring Products", and the other girl is "${description}". All text in the image must be in English. Make it humorous.`;
        break;
      case "drake":
        prompt = `Generate an image of a Drake Hotline Bling meme where Drake disapproves of "${title}" and approves of something better related to "${description}". All captions must be in English. Make it funny.`;
        break;
      case "success":
        prompt = `Generate an image of a Success Kid meme where the kid is celebrating the success of "${title}" with "${description}". All text must be in English. Make it sarcastically funny.`;
        break;
      case "expanding":
        prompt = `Generate an image of an Expanding Brain meme showing the evolution of understanding "${title}" with "${description}". All text in the meme must be in English. Make it clever and funny.`;
        break;
      default:
        prompt = `Generate a funny meme image about "${title}" - "${description}". Ensure all text is in English.`;
    }

    // Start the text-to-image job
    const body = {
      image_count: 1,
      orientation: "square",
      style: {
        prompt
      },
      name: "Roast Meme"
    };
    console.log('Sending request body:', JSON.stringify(body, null, 2));
    const createResponse = await fetch('https://api.magichour.ai/v1/ai-image-generator', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${magicHourApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("Magic Hour API error response:", errorText);
      throw new Error(`Magic Hour API error: ${createResponse.status}`);
    }

    const job = await createResponse.json();
    console.log("Job created:", job);
    const jobId = job.id;

    // Poll for completion
    let status = 'pending';
    let imageUrl = null;
    const maxPolls = 30; // 30 seconds max
    let polls = 0;

    while (status !== 'complete' && polls < maxPolls) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1s

      const statusResponse = await fetch(`https://api.magichour.ai/v1/image-projects/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${magicHourApiKey}`
        }
      });

      if (statusResponse.ok) {
        const jobStatus = await statusResponse.json();
        console.log("Full job status:", jobStatus);
        status = jobStatus.status;
        console.log(`Job ${jobId} status: ${status}`);
        if (status === 'complete') {
          if (jobStatus.downloads && jobStatus.downloads.length > 0) {
            imageUrl = jobStatus.downloads[0].url;
          }
        } else if (status === 'error') {
          throw new Error(`Job failed: ${jobStatus.error || 'Unknown error'}`);
        }
      } else {
        console.error(`Failed to get job status: ${statusResponse.status}`);
        const errorText = await statusResponse.text();
        console.error("Status error response:", errorText);
      }

      polls++;
    }

    if (!imageUrl) {
      throw new Error('Meme generation timed out');
    }

    return res.json({ imageUrl: imageUrl, shareUrl: `${imageUrl}?ref=ai-launch-roast` });
  } catch (error) {
    console.error("Magic Hour error:", error);
    return res.status(500).json({ error: error.message || "Meme generation failed" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
