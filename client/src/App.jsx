import { useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const emptyResult = {
  title: "",
  description: "",
  imageUrl: "",
  shareUrl: ""
};

export default function App() {
  const [url, setUrl] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [needsDescription, setNeedsDescription] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("roast");
  const [result, setResult] = useState(emptyResult);

  const canSubmit = useMemo(() => {
    if (!url.trim()) {
      return false;
    }
    if (needsDescription) {
      return manualDescription.trim().length > 0;
    }
    return true;
  }, [manualDescription, needsDescription, url]);

  const resetOutput = () => {
    setResult(emptyResult);
  };

  const requestPreview = async () => {
    const response = await fetch(`${API_BASE}/api/preview`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      throw new Error("preview_failed");
    }

    return response.json();
  };

  const requestRoast = async (payload) => {
    const response = await fetch(`${API_BASE}/api/roast`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Roast request failed");
    }

    return response.json();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    resetOutput();

    try {
      setStatus("loading");

      let resolvedTitle = title;
      let resolvedDescription = "";

      if (!needsDescription) {
        const preview = await requestPreview();
        resolvedTitle = preview.title || url;
        resolvedDescription = preview.description || "";

        setTitle(resolvedTitle);

        if (!resolvedDescription) {
          setNeedsDescription(true);
          setStatus("idle");
          return;
        }
      } else {
        resolvedTitle = title || url;
        resolvedDescription = manualDescription.trim();
      }

      const roast = await requestRoast({
        title: resolvedTitle,
        description: resolvedDescription,
        style: selectedStyle
      });

      setResult({ title: resolvedTitle, description: resolvedDescription, imageUrl: roast.imageUrl, shareUrl: roast.shareUrl });
      setStatus("success");
    } catch (err) {
      setError("Generation failed. Try again or paste a description.");
      setStatus("error");
      if (!title) {
        setTitle(url);
      }
      setNeedsDescription(true);
    }
  };

  const handleCopy = async () => {
    if (!result.shareUrl) {
      return;
    }
    await navigator.clipboard.writeText(result.shareUrl);
  };

  const handleDownload = () => {
    if (!result.imageUrl) {
      return;
    }
    const link = document.createElement("a");
    link.href = result.imageUrl;
    link.download = "product-roast-meme.jpg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="badge">Hackathon Drop</p>
        <h1>AI Product Meme Roast</h1>
        <p>Turn any product into a hilarious meme roast in under 30 seconds.</p>
      </header>

      <form className="card" onSubmit={handleSubmit}>
        <label htmlFor="url">Product or Product Hunt URL</label>
        <input
          id="url"
          type="url"
          placeholder="https://yourstartup.com"
          value={url}
          onChange={(event) => {
            setUrl(event.target.value);
            setNeedsDescription(false);
            setManualDescription("");
          }}
          required
        />

        {needsDescription && (
          <div className="manual">
            <label htmlFor="description">Describe your product</label>
            <textarea
              id="description"
              placeholder="Give us the highlights, quickly."
              rows={4}
              value={manualDescription}
              onChange={(event) => setManualDescription(event.target.value)}
              required
            />
          </div>
        )}

        {error && <p className="error">{error}</p>}

        <label htmlFor="style">Choose Meme Style</label>
        <select
          id="style"
          value={selectedStyle}
          onChange={(event) => setSelectedStyle(event.target.value)}
        >
          <option value="roast">Classic Roast</option>
          <option value="distracted">Distracted Boyfriend</option>
          <option value="drake">Drake Hotline Bling</option>
          <option value="success">Success Kid</option>
          <option value="expanding">Expanding Brain</option>
        </select>

        <button type="submit" disabled={!canSubmit || status === "loading"}>
          {status === "loading" ? "Generating Meme..." : "Generate Meme"}
        </button>
      </form>

      <section className="result">
        <div className="reel">
          {!result.imageUrl ? (
            <div className="placeholder">
              <p>Your roast meme will appear here.</p>
              <p>Share the laughs!</p>
            </div>
          ) : (
            <img
              src={result.imageUrl}
              alt="Roast Meme"
              style={{ width: '100%', height: 'auto', borderRadius: '20px' }}
            />
          )}
        </div>

        <div className="actions">
          <button type="button" onClick={handleCopy} disabled={!result.imageUrl}>
            Copy Share Link
          </button>
          <button type="button" onClick={handleDownload} disabled={!result.imageUrl}>
            Download Meme
          </button>
        </div>
      </section>
    </div>
  );
}
