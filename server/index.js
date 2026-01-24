import "dotenv/config";
import cors from "cors";
import express from "express";
import { load } from "cheerio";

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));

const magicHourApiKey = process.env.MAGIC_HOUR_API_KEY;
const magicHourApiUrl = "https://api.magichour.ai/v1";

// Store user profiles in memory (replace with DB in production)
const userProfiles = new Map();

app.post("/api/profile", async (req, res) => {
  const { userId, age, weight, bodyShape, height, skinTone, imageUrl } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  userProfiles.set(userId, {
    userId,
    age,
    weight,
    bodyShape, // e.g., "pear", "apple", "hourglass", "rectangle"
    height,
    skinTone,
    imageUrl,
    createdAt: new Date(),
  });

  return res.json({
    message: "Profile created/updated",
    profile: userProfiles.get(userId),
  });
});

app.get("/api/profile/:userId", (req, res) => {
  const { userId } = req.params;
  const profile = userProfiles.get(userId);

  if (!profile) {
    return res.status(404).json({ error: "Profile not found" });
  }

  return res.json(profile);
});

app.post("/api/try-on", async (req, res) => {
  const { personImageUrl, garmentImageUrl, garmentType = "upper_body", userId } = req.body;

  // Allow quick try-on with just personImageUrl + garmentImageUrl, OR use saved profile if userId provided
  let personUrl = personImageUrl;
  
  if (!personUrl && userId) {
    const userProfile = userProfiles.get(userId);
    if (!userProfile || !userProfile.imageUrl) {
      return res.status(400).json({ error: "User profile not found. Provide personImageUrl or create a profile first." });
    }
    personUrl = userProfile.imageUrl;
  }

  if (!personUrl || !garmentImageUrl) {
    return res.status(400).json({ error: "Missing personImageUrl or garmentImageUrl" });
  }

  if (!magicHourApiKey) {
    return res.status(500).json({ error: "Missing MAGIC_HOUR_API_KEY" });
  }

  try {
    const inferExtension = (contentType) => {
      if (!contentType) return "jpg";
      if (contentType.includes("jpeg")) return "jpg";
      if (contentType.includes("png")) return "png";
      if (contentType.includes("webp")) return "webp";
      if (contentType.includes("gif")) return "gif";
      return "jpg";
    };

    const downloadImage = async (url) => {
      const resp = await fetch(url);
      if (!resp.ok) throw new Error("failed_to_download_image");
      const contentType = resp.headers.get("content-type") || "image/jpeg";
      const arrayBuf = await resp.arrayBuffer();
      const buffer = Buffer.from(arrayBuf);
      const extension = inferExtension(contentType);
      return { buffer, contentType, extension };
    };

    const uploadToMagicHour = async (buffer, extension, contentType) => {
      // 1) Get upload URL
      const urlsResp = await fetch(`${magicHourApiUrl}/files/upload-urls`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${magicHourApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ items: [{ type: "image", extension }] }),
      });
      if (!urlsResp.ok) throw new Error("upload_urls_failed");
      const { items } = await urlsResp.json();
      const { upload_url, file_path } = items[0];

      // 2) PUT the binary
      const putResp = await fetch(upload_url, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: buffer,
      });
      if (!putResp.ok) throw new Error("asset_put_failed");
      return file_path;
    };

    // Prepare assets
    const personAsset = await downloadImage(personUrl);
    const garmentAsset = await downloadImage(garmentImageUrl);

    const personFilePath = await uploadToMagicHour(
      personAsset.buffer,
      personAsset.extension,
      personAsset.contentType
    );
    const garmentFilePath = await uploadToMagicHour(
      garmentAsset.buffer,
      garmentAsset.extension,
      garmentAsset.contentType
    );

    // Call Clothes Changer
    const response = await fetch(`${magicHourApiUrl}/ai-clothes-changer`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${magicHourApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        assets: {
          person_file_path: personFilePath,
          garment_file_path: garmentFilePath,
          garment_type: garmentType,
        },
        name: `Try-on: ${garmentType}`,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Magic Hour API error:", errorData);
      throw new Error(`Magic Hour API returned ${response.status}`);
    }

    const result = await response.json();

    return res.json({
      message: "Try-on generation started",
      jobId: result.id,
      creditsCharged: result.credits_charged,
      garmentType,
      shareUrl: `${process.env.APP_URL || "http://localhost:5173"}/?result=${result.id}`,
      magicHourUrl: `https://magichour.ai?ref=expressfit`,
    });
  } catch (error) {
    console.error("Error calling Magic Hour API:", error);
    return res.status(500).json({ error: "Try-on generation failed", details: error.message });
  }
});

app.get("/api/try-on/:jobId", async (req, res) => {
  const { jobId } = req.params;

  if (!magicHourApiKey) {
    return res.status(500).json({ error: "Missing MAGIC_HOUR_API_KEY" });
  }

  try {
    const response = await fetch(`${magicHourApiUrl}/image-projects/${jobId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${magicHourApiKey}`,
      },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: "Job not found" });
    }

    const result = await response.json();
    
    // Extract image from result
    let imageUrl = null;
    if (result.output && result.output.images) {
      imageUrl = Array.isArray(result.output.images) ? result.output.images[0] : result.output.images;
    }

    return res.json({
      ...result,
      imageUrl,
      magicHourUrl: `https://magichour.ai?ref=expressfit`,
    });
  } catch (error) {
    console.error("Error fetching try-on status:", error);
    return res.status(500).json({ error: "Failed to fetch status" });
  }
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Extract product main image from a store URL (Amazon, etc.)
app.post("/api/product-image", async (req, res) => {
  const { url } = req.body;
  if (!url) return res.status(400).json({ error: "Missing url" });
  try {
    const resp = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
    });
    if (!resp.ok) {
      console.error("/api/product-image fetch failed", { url, status: resp.status, statusText: resp.statusText });
      return res.status(422).json({ error: "fetch_failed", status: resp.status });
    }
    const html = await resp.text();
    const $ = load(html);
    const og = $("meta[property='og:image']").attr("content") || $("meta[name='og:image']").attr("content");
    if (og) return res.json({ imageUrl: og });
    let best = "";
    let bestArea = 0;
    $("img").each((_, el) => {
      const src = $(el).attr("src") || $(el).attr("data-src");
      const w = parseInt($(el).attr("width") || "0", 10);
      const h = parseInt($(el).attr("height") || "0", 10);
      const area = (isNaN(w) ? 0 : w) * (isNaN(h) ? 0 : h);
      if (src && area > bestArea) {
        best = src;
        bestArea = area;
      }
    });
    if (best) return res.json({ imageUrl: best });
    return res.status(404).json({ error: "image_not_found" });
  } catch (e) {
    console.error("/api/product-image extract error", e);
    return res.status(500).json({ error: "extract_failed" });
  }
});

app.listen(port, () => {
  console.log(`Server listening on ${port}`);
});
