import React from "react";

import { useGSAP } from "@gsap/react";
import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import gsap from "gsap";
import "../index.css";
import HeroExperience from "../components/HeroModels/HeroExperience.jsx";

const Hero = () => {
  
  useGSAP(() => {
    gsap.fromTo(
      ".hero-text h1",
      {
        y: 50,
        opacity: 0,
      },
      {
        y: 0,
        opacity: 1,
        stagger: 0.2,
        duration: 1,
        ease: "power2.inOut",
      }
    );

    gsap.fromTo(
      ".hero-text button",
      { scale: 0.8, opacity: 0 },
      { scale: 1, opacity: 1, delay: 1.2, duration: 0.8, ease: "back.out(1.7)" }
    );
  });

  return (
    <section id="hero"  className=" relative hero-layout">

      <div className="absolute top-0 left-0 w-full h-full bg-black opacity-50"></div>

      {/* Overlay content */}
      <div className="absolute top-0 left-0 w-full h-full z-10 px-5 md:px-20 flex flex-col md:flex-row justify-between items-center pb-20">
        <div className=" relative hero-text flex flex-col gap-4">
          <h2 className="text-3xl  md:text-5xl font-semibold">
            FREE YOUR CREATIVITY
          </h2>

          <Link to="/Signup">
            <button className="!text-lg bg-white p-5 w-80 rounded-[40px] text-black cursor-pointer pointer-events-auto">
              GET STARTED
            </button>
          </Link>
        </div>
        <div className="hero-3d-layout w-full md:w-1/2 h-[100px] md:h-[400px] pointer-events-none">
          <HeroExperience />
        </div>
      </div>
    </section>
  );
};

export default Hero;
