import React, { useEffect, useState } from "react";
import { navLinks } from "../constants/index.js";
import { Link } from "react-router-dom";
import Toggle from "../components/Toggle"; 

export const NavBar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [isDark, setIsDark] = useState(
    document.documentElement.getAttribute("data-theme") === "dark"
  );

  const toggleTheme = () => {
    const html = document.documentElement;
    const newTheme = isDark ? "light" : "dark";

    html.setAttribute("data-theme", newTheme);
    setIsDark(!isDark);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar ${scrolled ? "scrolled" : "not-scrolled"}`}>
      <div className="inner">
        <a className="logo" href="#hero">
          BrickVerse
        </a>

        <nav className="desktop gap-10">
          <ul>
            {navLinks.map(({ link, name }) => (
              <li key={name} className="group gap-10">
                <a href={link}>
                  <span>{name}</span>
                  <span className="underline" />
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="contact-btn group gap-10">
          <Link to="/Profile">
            <div className="inner">
              <span>Profile</span>
            </div>
          </Link>

          <Link to="/ContactSection">
            <div className="inner">
              <span>Contact us</span>
            </div>
          </Link>

          {/* 🌗 THEME TOGGLE */}
          <Toggle isDark={isDark} onToggle={toggleTheme} />
        </div>
      </div>
    </header>
  );
};
