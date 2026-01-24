import React from "react";

export default function ProfileSummary({ profile }) {
  if (!profile) return null;
  return (
    <div className="profile-summary">
      <h3>✅ Profile Saved</h3>
      <p>Age: {profile.age}</p>
      <p>Weight: {profile.weight} kg</p>
      <p>Body Shape: {profile.bodyShape}</p>
      <p>Height: {profile.height}</p>
      <p>Ready to try outfits! →</p>
    </div>
  );
}
