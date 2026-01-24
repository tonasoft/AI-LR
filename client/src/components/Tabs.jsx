import React from "react";

export default function Tabs({ active, onChange }) {
  return (
    <div className="tabs">
      <button
        className={`tab-btn ${active === "profile" ? "active" : ""}`}
        onClick={() => onChange("profile")}
      >
        My Profile
      </button>
      <button
        className={`tab-btn ${active === "tryon" ? "active" : ""}`}
        onClick={() => onChange("tryon")}
      >
        Try-On
      </button>
    </div>
  );
}
