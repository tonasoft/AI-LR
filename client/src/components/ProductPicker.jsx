import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ProductPicker({ onImageSelected }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUseImage = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError("Enter a garment image URL");
      return;
    }
    // Validate it's a URL
    try {
      new URL(url);
      setError(""); // Clear error before attempting
      onImageSelected(url);
      setUrl("");
    } catch {
      setError("Invalid URL format");
    }
  };

  return (
    <div className="tab-content">
      <form onSubmit={handleUseImage}>
        <div className="form-group">
          <label>Garment Image URL</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com/garment.jpg"
            required
          />
          <small style={{ color: "#94a3b8", marginTop: "4px" }}>
            Use CORS-enabled URLs (most public images work). Examples: via.placeholder.com, imgur.com direct links, or your own server.
          </small>
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Adding…" : "Add to Try-On"}
        </button>
      </form>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
