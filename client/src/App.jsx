import { useState } from "react";
import "./styles.css";
import Alert from "./components/Alert.jsx";
import Tabs from "./components/Tabs.jsx";
import ProfileForm from "./components/ProfileForm.jsx";
import ProfileSummary from "./components/ProfileSummary.jsx";
import TryOnForm from "./components/TryOnForm.jsx";
import ResultBox from "./components/ResultBox.jsx";
import ProductPicker from "./components/ProductPicker.jsx";
import ThreeViewer from "./components/ThreeViewer.jsx";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3000";

export default function App() {
  const [currentTab, setCurrentTab] = useState("profile");
  const [userId, setUserId] = useState("");
  const [profileData, setProfileData] = useState({
    age: "",
    weight: "",
    bodyShape: "apple",
    height: "",
    skinTone: "medium",
    imageUrl: "",
  });
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [tryOnData, setTryOnData] = useState({
    garmentImageUrl: "",
    garmentType: "upper_body",
  });
  const [tryOnResult, setTryOnResult] = useState(null);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccessMsg("");

    try {
      const response = await fetch(`${API_BASE}/api/profile`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, ...profileData }),
      });

      if (!response.ok) throw new Error("Failed to create profile");
      const data = await response.json();
      setUserProfile(data.profile);
      setSuccessMsg("Profile created successfully!");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTryOnChange = (e) => {
    const { name, value } = e.target;
    setTryOnData((prev) => ({ ...prev, [name]: value }));
  };

  const handleTryOnSubmit = async (e) => {
    e.preventDefault();
    if (!userProfile) {
      setError("Please create a profile first");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/try-on`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userProfile.userId, ...tryOnData }),
      });

      if (!response.ok) throw new Error("Try-on generation failed");
      const data = await response.json();
      setTryOnResult(data);
      setSuccessMsg(`Try-on started! Job ID: ${data.jobId}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="app-shell">
      <div className="left-pane">
        <header>
          <h1>ExpressFit</h1>
          <p>Personalized outfit try-on with 3D preview</p>
        </header>

        <Alert type="error">{error}</Alert>
        <Alert type="success">{successMsg}</Alert>

        <Tabs active={currentTab} onChange={setCurrentTab} />

        {currentTab === "profile" && (
          <div className="tab-content">
            <ProfileForm
              userId={userId}
              profileData={profileData}
              loading={loading}
              onUserIdChange={setUserId}
              onProfileChange={handleProfileChange}
              onSubmit={handleProfileSubmit}
            />

            {userProfile && (
              <div className="profile-summary">
                <h3>✅ Profile Saved</h3>
                <p>Age: {userProfile.age}</p>
                <p>Weight: {userProfile.weight} lbs</p>
                <p>Body Shape: {userProfile.bodyShape}</p>
                <p>Height: {userProfile.height}</p>
                <p>Ready to try outfits! →</p>
              </div>
            )}
          </div>
        )}

        {currentTab === "tryon" && (
          <div className="tab-content">
            <ProductPicker onImageSelected={(img) => setTryOnData((p) => ({ ...p, garmentImageUrl: img }))} />
            <TryOnForm
              userProfile={userProfile}
              tryOnData={tryOnData}
              loading={loading}
              onTryOnChange={handleTryOnChange}
              onSubmit={handleTryOnSubmit}
            />
            <ResultBox result={tryOnResult} />
          </div>
        )}

        <footer>
          <p>Powered by Magic Hour AI</p>
        </footer>
      </div>

      <div className="right-pane">
        <div className="viewer-card">
          <ThreeViewer imageUrl={profileData.imageUrl || tryOnData.garmentImageUrl} />
          <p className="small muted">Full-page 3D preview. Drop in your photo to see it here.</p>
        </div>
      </div>
    </div>
  );
}
