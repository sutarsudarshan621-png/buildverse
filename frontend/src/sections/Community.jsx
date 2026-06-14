import React, { useState, useEffect } from "react";
import "../index.css";

// === POST CARD COMPONENT ===
const PostCard = ({ post, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      className="post-card"
      onClick={() => onClick(post)}
      onMouseEnter={(e) => e.currentTarget.classList.add("hovered")}
      onMouseLeave={(e) => e.currentTarget.classList.remove("hovered")}
    >
      <div className="image-container">
        {!imageLoaded && (
          <div className="image-placeholder">
            <div className="loading-spinner" />
          </div>
        )}
        <img
          src={post.imageUrl}
          alt={post.modelName}
          onLoad={() => setImageLoaded(true)}
          className={`post-image ${imageLoaded ? "loaded" : ""}`}
        />
        <div className="price-badge">{post.price}</div>
      </div>

      <div className="card-content">
        <h3 className="model-name">{post.modelName}</h3>
        <div className="creator-info">
          <img
            src={post.creator.avatar}
            alt={post.creator.username}
            className="creator-avatar"
          />
          <span className="creator-name">{post.creator.username}</span>
        </div>
        <div className="creator-contact">{post.creator.contact}</div>
        <div className="card-stats">
          <span
            className="like-btn"
            onClick={(e) => {
              e.stopPropagation();
              alert("❤️ Liked!");
            }}
          >
            ❤️ {post.likes}
          </span>

          <span
            className="comment-btn"
            onClick={(e) => {
              e.stopPropagation();
              const text = prompt("Write your comment:");
              if (text) {
                alert(`💬 Comment: ${text}`);
              }
            }}
          >
            💬 Comment
          </span>
        </div>
      </div>
      <button
        className=" apperbtn1 absolute h-20px bottom-5 left-10 px-3 py-1 rounded bg-yellow-400 font-bold text-black"
        onClick={() => window.history.back()}
      >
        ⬅ BACK
      </button>
    </div>
  );
};

// === DETAIL MODAL COMPONENT ===
const DetailModal = ({ post, onClose }) => {
  if (!post) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>
          ×
        </button>
        <div className="modal-body">
          <div className="modal-image">
            <img src={post.imageUrl} alt={post.modelName} />
          </div>
          <div className="modal-info">
            <h2>{post.modelName}</h2>
            <div className="modal-price">{post.price}</div>

            <div className="modal-creator">
              <img src={post.creator.avatar} alt={post.creator.username} />
              <div>
                <div>{post.creator.username}</div>
                <div>{post.creator.contact}</div>
              </div>
            </div>

            <div className="modal-description">
              <h3>Description</h3>
              <p>{post.description}</p>
            </div>

            <div className="modal-tags">
              <h3>Tags</h3>
              <div>
                {post.tags.map((tag, i) => (
                  <span key={i}>{tag}</span>
                ))}
              </div>
            </div>

            <div className="modal-stats">
              <div>
                <div>{post.likes}</div>
                <div>Likes</div>
              </div>
              <div>
                <div>{post.views}</div>
                <div>Views</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// === MAIN COMMUNITY PAGE COMPONENT ===
const CommunityPage = () => {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [loading] = useState(false);

  useEffect(() => {
    const dummyPosts = [
      {
        id: 1,
        modelName: "Cyber Dragon",
        imageUrl: "https://picsum.photos/400/300?random=1",
        price: "120 BVT",
        description: "A futuristic dragon model.",
        likes: 15,
        views: 120,
        tags: ["Dragon", "Sci-Fi", "NFT"],
        creator: {
          username: "Sudhakar",
          avatar: "https://i.pravatar.cc/100?img=1",
          contact: "@sudhakar",
        },
      },
      {
        id: 2,
        modelName: "Space Rover",
        imageUrl: "https://picsum.photos/400/300?random=2",
        price: "80 BVT",
        description: "Exploration rover for Mars.",
        likes: 22,
        views: 180,
        tags: ["Space", "Vehicle"],
        creator: {
          username: "BuilderX",
          avatar: "https://i.pravatar.cc/100?img=2",
          contact: "@builderx",
        },
      },
    ];

    setPosts(dummyPosts);
    
  }, []);

  return (
    <div className="community-page">
      <header className="header">
        <div className="header-content">
          <h1>BrickVerse Community</h1>
          <div className="model-count">{posts.length} Models</div>
        </div>
      </header>

      <main className="main-content">
        {loading ? (
          <div className="loading-area">
            <div className="loading-spinner" />
            Loading amazing builds...
          </div>
        ) : posts.length === 0 ? (
          <div className="no-results">🔍 No models found</div>
        ) : (
          <div className="masonry-grid">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} onClick={setSelectedPost} />
            ))}
          </div>
        )}
      </main>

      {selectedPost && (
        <DetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}
    </div>
  );
};

export default CommunityPage;
