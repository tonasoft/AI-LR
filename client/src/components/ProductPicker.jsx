import React, { useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ProductPicker({ onImageSelected }) {
  const [url, setUrl] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFetch = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/api/product-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      if (!resp.ok) throw new Error("Failed to fetch product image");
      const data = await resp.json();
      onImageSelected(data.imageUrl);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="tab-content">
      <form onSubmit={handleFetch}>
        <div className="form-group">
          <label>Product URL (Amazon or any store)</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.amazon.com/…"
            required
          />
        </div>
        <button type="submit" className="btn" disabled={loading}>
          {loading ? "Fetching…" : "Use This Product Image"}
        </button>
      </form>
      {error && <div className="alert alert-error">{error}</div>}
    </div>
  );
}
