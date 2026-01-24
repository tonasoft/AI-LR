import React, { useEffect, useState } from "react";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function ResultBox({ result, onResultImageUpdate }) {
  const [status, setStatus] = useState("");
  const [resultImage, setResultImage] = useState(null);
  const [polling, setPolling] = useState(false);

  useEffect(() => {
    if (!result || !result.jobId) return;

    let pollInterval;
    const pollStatus = async () => {
      try {
        const resp = await fetch(`${API_BASE}/api/try-on/${result.jobId}`);
        if (!resp.ok) throw new Error("Status check failed");
        const data = await resp.json();
        setStatus(data.status);

        // Check if result is ready
        if (data.status === "completed" && data.output) {
          const imageUrl = Array.isArray(data.output.images)
            ? data.output.images[0]
            : data.output.images || data.output;
          setResultImage(imageUrl);
          onResultImageUpdate?.(imageUrl);
          setPolling(false);
          clearInterval(pollInterval);
        }
      } catch (err) {
        console.error("Poll error:", err);
      }
    };

    setPolling(true);
    pollStatus(); // Immediate check
    pollInterval = setInterval(pollStatus, 3000); // Poll every 3 sec

    return () => clearInterval(pollInterval);
  }, [result, onResultImageUpdate]);

  if (!result) return null;

  return (
    <div className="result-box">
      <h3>✨ Try-On in Progress</h3>
      <p>Job ID: <code style={{ color: "#93c5fd" }}>{result.jobId}</code></p>
      <p>Credits Used: {result.creditsCharged}</p>
      <p>Garment Type: {result.garmentType.replace("_", " ")}</p>
      <p>Status: <strong>{polling ? "Processing..." : status || "Queued"}</strong></p>
      {resultImage && (
        <p style={{ color: "#86efac", fontSize: "0.9rem" }}>✓ Result ready! Check the preview on the right.</p>
      )}
      <p className="small">This may take 30-60 seconds.</p>
    </div>
  );
}
