import React, { useEffect, useRef } from "react";
import { Sun, Moon } from "lucide-react";
import "./Toggle.css";

const Toggle = ({ isDark, onToggle }) => {
  const buttonRef = useRef(null);
  const sunRef = useRef(null);
  const moonRef = useRef(null);

  useEffect(() => {
    const button = buttonRef.current;
    const sun = sunRef.current;
    const moon = moonRef.current;

    button.classList.add("btn-press");
    setTimeout(() => button.classList.remove("btn-press"), 100);

    if (isDark) {
      sun.classList.add("icon-hidden");
      moon.classList.remove("icon-hidden");
    } else {
      moon.classList.add("icon-hidden");
      sun.classList.remove("icon-hidden");
    }
  }, [isDark]);

  return (
    <button
      ref={buttonRef}
      onClick={onToggle}
      className={`toggle-btn ${isDark ? "dark-btn" : "light-btn"}`}
      aria-label="Toggle theme"
    >
      <div className="icon-wrapper">
        <div ref={sunRef} className="icon sun-icon">
          <Sun size={22} strokeWidth={2.5} />
        </div>
        <div ref={moonRef} className="icon moon-icon icon-hidden">
          <Moon size={22} strokeWidth={2.5} />
        </div>
      </div>
    </button>
  );
};

export default Toggle;
