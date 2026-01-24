import { useMemo, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

const emptyResult = {
  title: "",
  description: "",
  lines: []
};

const parseLines = (text) =>
  text
    .split(/\n+/)
    .map((line) => line.replace(/^\s*\d+[\).:-]?\s*/, "").trim())
    .filter(Boolean);

export default function App() {
  const [url, setUrl] = useState("");
  const [manualDescription, setManualDescription] = useState("");
  const [needsDescription, setNeedsDescription] = useState(false);
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
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
      throw new Error("roast_failed");
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
        description: resolvedDescription
      });

      const lines = parseLines(roast.text || "");
      setResult({ title: resolvedTitle, description: resolvedDescription, lines });
      setStatus("success");
    } catch (err) {
      setError("We hit turbulence. Try again or paste a description.");
      setStatus("error");
      if (!title) {
        setTitle(url);
      }
      setNeedsDescription(true);
    }
  };

  const handleCopy = async () => {
    const text = result.lines.join("\n");
    if (!text) {
      return;
    }
    await navigator.clipboard.writeText(text);
  };

  const handleDownload = () => {
    const text = result.lines.join("\n");
    const blob = new Blob([text || "AI Launch Roast"], { type: "text/plain" });
    const urlObject = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = urlObject;
    link.download = "ai-launch-roast.txt";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(urlObject);
  };

  return (
    <div className="app">
      <header className="hero">
        <p className="badge">Hackathon Drop</p>
        <h1>AI Launch Roast</h1>
        <p>Give your launch the roast it deserves in 15 seconds or less.</p>
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

        <button type="submit" disabled={!canSubmit || status === "loading"}>
          {status === "loading" ? "Roasting..." : "Roast Me"}
        </button>
      </form>

      <section className="result">
        <div className="reel">
          {result.lines.length === 0 ? (
            <div className="placeholder">
              <p>✨ Your roast will land here.</p>
              <p>Make it viral. Keep it spicy.</p>
            </div>
          ) : (
            result.lines.map((line, index) => (
              <p
                key={`${line}-${index}`}
                className="reveal"
                style={{ animationDelay: `${index * 0.2}s` }}
              >
                {line}
              </p>
            ))
          )}
        </div>

        <div className="actions">
          <button type="button" onClick={handleCopy} disabled={!result.lines.length}>
            Copy Text
          </button>
          <button type="button" onClick={handleDownload} disabled={!result.lines.length}>
            Download Placeholder
          </button>
        </div>
      </section>
    </div>
  );
}
