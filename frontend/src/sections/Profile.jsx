import React, { useEffect, useState } from "react";
import "../index.css";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const Profile = () => {
  const [profile, setProfile] = useState(null);

  
  const [bio, setBio] = useState("");

  const [avatarFile, setAvatarFile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [showBioEditor, setShowBioEditor] = useState(false);
  const [activeModelMenu, setActiveModelMenu] = useState(null);

  useGSAP(
    () => {
      gsap.from(".p-left-container", { y: -700, duration: 1 });
      gsap.from(".p-right-container", { x: 700, duration: 1 });
      gsap.from(".p-lastest-container", { y: 700, duration: 1 });
    },
    { dependencies: [] }, // 👈 run once
  );

  useEffect(() => {
  setProfile({
    user: {
      username: "Sudhakar",
      bio: "BuildVerse Developer",
      wallet_address: null,
      avatar_cid: null,
    },
    totalModels: 2,
    models: [
      {
        id: 1,
        name: "Cyber Castle",
        image_cid: null,
        is_minted: false,
        is_posted: false,
      },
      {
        id: 2,
        name: "Space Ship",
        image_cid: null,
        is_minted: false,
        is_posted: false,
      },
    ],
  });

  setBio("BuildVerse Developer");
}, []);
  if (!profile) return <div className="profile">Loading...</div>;

  return (
    <div className="profile">
      <div className="parent">
        {/* LEFT */}
        <div className="p-left-container">
          {/* 3 DOT MENU */}
          <div className="profile-menu">
            <button
              className="dots-btn"
              onClick={() => setMenuOpen((prev) => !prev)}
            >
              ⋮
            </button>

            {menuOpen && (
              <div className="menu-popup">
                <button
                  className="menu-item"
                  onClick={() =>
                    document.getElementById("avatar-upload").click()
                  }
                >
                  Choose & Save Photo
                </button>

                <input
                  type="file"
                  id="avatar-upload"
                  accept="image/*"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;

                    if (file.size > 2 * 1024 * 1024) {
                      alert("Max file size is 2MB");
                      return;
                    }

                    setAvatarFile(file);
                    alert("Avatar upload disabled (frontend mode)"); // immediately upload after selection
                    setMenuOpen(false); // close menu
                  }}
                />

                {profile.user.avatar_cid && (
                  <button
                    className="menu-item danger"
                    onClick={() => {
                      removeAvatar();
                      setMenuOpen(false);
                    }}
                  >
                    Remove Photo
                  </button>
                )}

                <button
                  className="menu-item"
                  onClick={() => {
                    setShowBioEditor(true);
                    setMenuOpen(false);
                  }}
                >
                  Edit Bio
                </button>
              </div>
            )}
          </div>

          <div className="profile-circle">
            {profile.user.avatar_cid ? (
              <img
                src={`https://gateway.pinata.cloud/ipfs/${profile.user.avatar_cid}`}
                alt="avatar"
              />
            ) : (
              <span className="no-photo-text">No Photo</span>
            )}
          </div>

          <h1 className="profile-name">{profile.user.username}</h1>
          <p className="profile-tagline">{bio || "Add your bio"}</p>

          {showBioEditor && (
            <div className="bio-modal">
              <div className="bio-card">
                <h3>Edit Bio</h3>

                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  maxLength={160}
                  placeholder="Tell something about yourself..."
                />

                <div className="bio-actions">
                  <button
                    className="save-bio-btn"
                    onClick={() => {
                      setProfile((prev) => ({
                        ...prev,
                        user: {
                          ...prev.user,
                          bio,
                        },
                      }));

                      setShowBioEditor(false);
                    }}
                  >
                    edit Bio
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="p-right-container">
          <div className="stat">
            <span>Status</span>
            <p>Frontend Mode</p>
          </div>
          <div className="stat">
            <span>Models</span>
            <p>{profile.totalModels}</p>
          </div>
        </div>

        {/* MODELS */}
        {/* MODELS */}
        <div className="p-lastest-container">
          <h3>My Models</h3>

          <div className="models">
            {profile.models.length === 0 && (
              <p style={{ opacity: 0.6 }}>No models created yet</p>
            )}

            {profile.models.map((model) => (
              <div key={model.id} className="model-card">
                {/* FULL IMAGE BACKGROUND */}
                <div
                  className="model-image"
                  style={{
                    backgroundImage:
                      "url(https://picsum.photos/400/300?random=" +
                      model.id +
                      ")",
                  }}
                />

                {/* 3 DOT MENU */}
                <button
                  className="model-menu-btn"
                  onClick={() =>
                    setActiveModelMenu(
                      activeModelMenu === model.id ? null : model.id,
                    )
                  }
                >
                  ⋮
                </button>

                {/* DROPDOWN ACTIONS */}
                {activeModelMenu === model.id && (
                  <div className="model-menu">
                    {!model.is_minted && (
                      <button
                        onClick={() => {
                          alert("Frontend Mode");
                          setActiveModelMenu(null);
                        }}
                      >
                        View
                      </button>
                    )}

                    {model.is_minted && !model.is_posted && (
                      <button
                        onClick={() => {
                          alert("Frontend Mode");
                          setActiveModelMenu(null);
                        }}
                      >
                        View
                      </button>
                    )}

                    {/* DELETE button is always available */}
                    <button
                      onClick={() => {
                        alert("Frontend Mode");
                        setActiveModelMenu(null);
                      }}
                    >
                      View
                    </button>
                  </div>
                )}

                {/* MODEL NAME + NFT INFO OVERLAY */}
                <div className="model-footer">
                  <span>{model.name}</span>

                  {model.is_minted && model.nft_tx_hash && (
                    <div className="nft-info">
                      <a
                        href={`https://sepolia.etherscan.io/tx/${model.nft_tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="etherscan-link"
                      >
                        View on Etherscan
                      </a>
                      <p className="contract-address">
                        Contract: {model.nft_contract_address.slice(0, 6)}...
                        {model.nft_contract_address.slice(-4)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        <button
          className=" apperbtn1 absolute h-20px bottom-5 left-10 px-3 py-1 rounded bg-yellow-400 font-bold text-black"
          onClick={() => window.history.back()}
        >
          ⬅ BACK
        </button>
      </div>
    </div>
  );
};

export default Profile;
