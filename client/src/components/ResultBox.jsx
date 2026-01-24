import React from "react";

export default function ResultBox({ result }) {
  if (!result) return null;
  return (
    <div className="result-box">
      <h3>✨ Try-On Generated</h3>
      <p>Job ID: {result.jobId}</p>
      <p>Credits Used: {result.creditsCharged}</p>
      <p>Garment Type: {result.garmentType}</p>
      <p className="small">Check back soon for your result!</p>
    </div>
  );
}
