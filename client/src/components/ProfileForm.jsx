import React from "react";

export default function ProfileForm({
  userId,
  profileData,
  loading,
  onUserIdChange,
  onProfileChange,
  onSubmit,
}) {
  return (
    <form onSubmit={onSubmit}>
      <div className="form-group">
        <label>User ID</label>
        <input
          type="text"
          value={userId}
          onChange={(e) => onUserIdChange(e.target.value)}
          placeholder="Enter your unique ID"
          required
        />
      </div>

      <div className="form-group">
        <label>Age</label>
        <input
          type="number"
          name="age"
          value={profileData.age}
          onChange={(e) => onProfileChange(e)}
          placeholder="e.g., 28"
        />
      </div>

      <div className="form-group">
        <label>Weight (lbs)</label>
        <input
          type="number"
          name="weight"
          value={profileData.weight}
          onChange={(e) => onProfileChange(e)}
          placeholder="e.g., 160"
        />
      </div>

      <div className="form-group">
        <label>Body Shape</label>
        <select
          name="bodyShape"
          value={profileData.bodyShape}
          onChange={(e) => onProfileChange(e)}
        >
          <option value="apple">Apple</option>
          <option value="pear">Pear</option>
          <option value="hourglass">Hourglass</option>
          <option value="rectangle">Rectangle</option>
          <option value="triangle">Triangle</option>
        </select>
      </div>

      <div className="form-group">
        <label>Height (e.g., 5'7)</label>
        <input
          type="text"
          name="height"
          value={profileData.height}
          onChange={(e) => onProfileChange(e)}
          placeholder="e.g., 5'7"
        />
      </div>

      <div className="form-group">
        <label>Skin Tone</label>
        <select
          name="skinTone"
          value={profileData.skinTone}
          onChange={(e) => onProfileChange(e)}
        >
          <option value="fair">Fair</option>
          <option value="light">Light</option>
          <option value="medium">Medium</option>
          <option value="olive">Olive</option>
          <option value="deep">Deep</option>
        </select>
      </div>

      <div className="form-group">
        <label>Your Photo URL</label>
        <input
          type="url"
          name="imageUrl"
          value={profileData.imageUrl}
          onChange={(e) => onProfileChange(e)}
          placeholder="https://example.com/your-photo.jpg"
        />
        {profileData.imageUrl && (
          <img src={profileData.imageUrl} alt="Preview" className="preview-img" />
        )}
      </div>

      <button type="submit" disabled={loading} className="btn">
        {loading ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
