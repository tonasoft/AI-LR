import React from "react";

export default function TryOnForm({
  userProfile,
  tryOnData,
  loading,
  onTryOnChange,
  onSubmit,
}) {
  if (!userProfile) {
    return (
      <div className="alert alert-info">
        Please create a profile first in the "My Profile" tab
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>Garment Image URL</label>
        <input
          type="url"
          name="garmentImageUrl"
          value={tryOnData.garmentImageUrl}
          onChange={(e) => onTryOnChange(e)}
          placeholder="https://example.com/outfit.jpg"
          required
        />
        {tryOnData.garmentImageUrl && (
          <img src={tryOnData.garmentImageUrl} alt="Garment" className="preview-img" />
        )}
      </div>

      <div className="form-group">
        <label>Garment Type</label>
        <select
          name="garmentType"
          value={tryOnData.garmentType}
          onChange={(e) => onTryOnChange(e)}
        >
          <option value="upper_body">Upper Body</option>
          <option value="lower_body">Lower Body</option>
          <option value="full_body">Full Body</option>
        </select>
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "Generating..." : "Try-On"}
      </button>
    </form>
  );
}
