import { useState } from "react";
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Hero from "./sections/Hero.jsx";
import { NavBar } from "./components/NavBar.jsx";
import Signup from "./sections/Signup.jsx";
import ContactSection from "./sections/Contact.jsx";
import PostCard from "./sections/Community.jsx";
import LegoBuilder from "./sections/LegoBuilder.jsx";
import About from "./sections/About.jsx";
import Profile from "./sections/Profile.jsx";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/"
            element={
              <>
                <NavBar />
                <Hero />
                <About />
              </>
            }
          />
          <Route path="/Signup" element={<Signup />} />
          <Route path="/Profile" element={<Profile />} />
          <Route path="/ContactSection" element={<ContactSection />} />
          <Route path="/Community" element={<PostCard />} />
          <Route path="/LegoBuilder" element={<LegoBuilder />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
