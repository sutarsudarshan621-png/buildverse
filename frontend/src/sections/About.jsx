import React, { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "../index.css";

gsap.registerPlugin(ScrollTrigger);

const About = () => {
  const blurRef = useRef(null);
  const imageRef = useRef(null);

  useEffect(() => {
    // TEXT BLUR ANIMATION
    gsap.fromTo(
      blurRef.current,
      {
        opacity: 0,
        filter: "blur(40px)",
        y: 50,
      },
      {
        opacity: 1,
        filter: "blur(0px)",
        y: 0,
        scrollTrigger: {
          trigger: blurRef.current,
          start: "top 80%",
          end: "top 30%",
          scrub: true,
        },
        ease: "power2.out",
      }
    );

    // IMAGE EXPAND ANIMATION
    gsap.fromTo(
      imageRef.current,
      {
        width: "360px",
        height: "510px",
        borderRadius: "50px",
      },
      {
        width: "100%",
        height: "100vh",
        borderRadius: "0px",
        scrollTrigger: {
          trigger: imageRef.current,
          start: "top 70%",
          end: "top top",
          scrub: true,
        },
        ease: "power2.out",
      }
    );

    ScrollTrigger.refresh();
  }, []);

  return (
    <section id="about" className="about-section">
      <div ref={blurRef} className="autoBlur">
        <h1>DISCOVER A NEW WAY TO BUILD, PLAY, AND OWN</h1>
        <p>
          BuildVerse is a gamified Web3 builder universe where creativity, play,
          and ownership come together on the blockchain.
        </p>
      </div>

      <div ref={imageRef} className="image-box">
        <div className="details">
          <h2>BrickVerse</h2>
          <p>A gamified Web3 builder platform powered by creativity.</p>
          <div className="about-detail">
            <ul>
              <li> Create and customize 3D models using digital blocks</li>
              <li> Earn tokens by building, upgrading, and participating</li>
              <li> Mint your creations as NFTs you truly own</li>
              <li> Share your builds with a community-driven gallery</li>
              <li> Build your on-chain profile with models, NFTs, and posts</li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
