import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function QuickTryOn() {
  const [personImage, setPersonImage] = useState("");
  const [garmentImage, setGarmentImage] = useState("");
  const [garmentType, setGarmentType] = useState("upper_body");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [resultImage, setResultImage] = useState(null);
  const [status, setStatus] = useState("");

  const handleTryOn = async (e) => {
    e.preventDefault();
    if (!personImage || !garmentImage) {
      setError("Please provide both person and garment images");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/try-on`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personImageUrl: personImage,
          garmentImageUrl: garmentImage,
          garmentType,
        }),
      });

      if (!response.ok) throw new Error("Try-on generation failed");
      const data = await response.json();
      setResult(data);
      setStatus("Processing...");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Poll for result
  useEffect(() => {
    if (!result?.jobId) return;

    let pollInterval;
    const pollStatus = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/try-on/${result.jobId}`);
        if (!resp.ok) throw new Error("Status check failed");
        const data = await resp.json();
        setStatus(data.status);

        if (data.status === "completed" && data.imageUrl) {
          setResultImage(data.imageUrl);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    pollStatus();
    pollInterval = setInterval(pollStatus, 3000);
    return () => clearInterval(pollInterval);
  }, [result?.jobId]);

  const downloadImage = async () => {
    if (!resultImage) return;
    const a = document.createElement("a");
    a.href = resultImage;
    a.download = `expressfit-tryon-${result.jobId}.jpg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const shareTwitter = () => {
    if (!result?.jobId) return;
    const text = encodeURIComponent(
      `Just tried on an outfit with ExpressFit! Powered by Magic Hour AI ✨\n\nTry it yourself:`
    );
    const url = encodeURIComponent(result.shareUrl);
    const magicHourRef = encodeURIComponent("https://magichour.ai?ref=expressfit");
    window.open(
      `https://twitter.com/intent/tweet?text=${text}%20${url}%20${magicHourRef}`,
      "_blank"
    );
  };

  if (result && resultImage) {
    return (
      <div className="quick-result">
        <div className="result-image-container">
          <img src={resultImage} alt="Try-on result" className="result-image" />
        </div>
        <div className="result-actions">
          <button onClick={downloadImage} className="btn">
            ⬇️ Download
          </button>
          <button onClick={shareTwitter} className="btn btn-primary">
            🐦 Share on Twitter
          </button>
          <button onClick={() => setResult(null)} className="btn">
            ✨ Try Another
          </button>
        </div>
        <p className="small muted" style={{ textAlign: "center", marginTop: 16 }}>
          Powered by{" "}
          <a
            href="https://magichour.ai?ref=expressfit"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#38bdf8", textDecoration: "underline" }}
          >
            Magic Hour AI
          </a>
        </p>
      </div>
    );
  }

  if (result) {
    return (
      <div className="quick-loading">
        <p className="loading-text">
          {status === "completed"
            ? "Result ready!"
            : status === "failed"
            ? "Try-on failed. Try again."
            : "Generating your try-on... This may take up to 60 seconds."}
        </p>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="quick-form">
      <h2>Express Fit Try-On</h2>
      <p className="subtitle">Upload your photo and a garment image, see yourself in it instantly</p>

      <form onSubmit={handleTryOn}>
        <div className="form-group">
          <label>Your Photo (Portrait works best)</label>
          <input
            type="url"
            value={personImage}
            onChange={(e) => setPersonImage(e.target.value)}
            placeholder="https://via.placeholder.com/400x600.jpg"
            required
          />
          {personImage && <img src={personImage} alt="Person" className="preview-img-small" />}
        </div>

        <div className="form-group">
          <label>Garment Image</label>
          <input
            type="url"
            value={garmentImage}
            onChange={(e) => setGarmentImage(e.target.value)}
            placeholder="https://via.placeholder.com/400x600.jpg"
            required
          />
          {garmentImage && <img src={garmentImage} alt="Garment" className="preview-img-small" />}
        </div>

        <div className="form-group">
          <label>Garment Type</label>
          <select value={garmentType} onChange={(e) => setGarmentType(e.target.value)}>
            <option value="upper_body">Upper Body (Shirt/Top)</option>
            <option value="lower_body">Lower Body (Pants/Skirt)</option>
            <option value="full_body">Full Body (Dress/Outfit)</option>
          </select>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        <button type="submit" disabled={loading} className="btn btn-primary" style={{ width: "100%" }}>
          {loading ? "Starting..." : "✨ Generate Try-On"}
        </button>
      </form>

      <p className="small muted" style={{ marginTop: 16, textAlign: "center" }}>
        Use CORS-enabled URLs (via.placeholder.com, imgur, etc). Takes ~30-60 seconds.
      </p>
    </div>
  );
}
