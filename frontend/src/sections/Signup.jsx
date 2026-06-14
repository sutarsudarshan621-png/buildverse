import React, { useState } from "react";
import "../index.css";
import gsap from "gsap";
import { useEffect } from "react";

import { useGSAP } from "@gsap/react";


const Signup = () => {
  const [account, setAccount] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState("");
  const [isLogin, setIsLogin] = useState(false); // toggle between login/signup
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  //  Connect wallet function
  const connectWallet = async () => {
    if (!window.ethereum) {
      alert("MetaMask not detected! Please install MetaMask extension.");
      return;
    }
    try {
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      setAccount(accounts[0]);
      userAccount = accounts[0];

      const provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();

      setStatus("Wallet connected successfully!");
    } catch (error) {
      console.error("User rejected request:", error);
      setStatus("Wallet connection failed!");
    }
  };

  //Disconnect wallet

  // Signup
  const handleSignup = async (e) => {
    e.preventDefault();

    if (!username || !email || !password) {
      alert("Please fill in all fields!");
      return;
    }

    try {
      localStorage.setItem(
        "user",
        JSON.stringify({
          username,
          email,
          walletAddress: account,
        }),
      );

      setStatus("Signup successful!");
      setIsAuthenticated(true);

      setUsername("");
      setEmail("");
      setPassword("");

      alert("Signup successful!");
    } catch (err) {
      console.error(err);
      setStatus("Server error. Try again later.");
    }
  };

  // Login
  const handleLogin = async (e) => {
    e.preventDefault();

    const user = JSON.parse(localStorage.getItem("user"));

    if (user && user.email === email) {
      setIsAuthenticated(true);
      alert("Login successful!");
    } else {
      alert("User not found");
    }
  };
  // Logout
  const handleSignout = () => {
    setIsAuthenticated(false);
    setAccount(null);

    alert("Logout successful!");
  };
  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      setIsAuthenticated(true);
    }
  }, []);

  // GSAP animations (unchanged)
  useGSAP(() => {
    gsap.from(".left-container", {
      y: -700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });

    gsap.from(".last-container", {
      y: -700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });

    gsap.from(".right-container", {
      y: 700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });

    gsap.from(".lastest-container", {
      y: 700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });

    gsap.from(".first-container", {
      y: 700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });
    gsap.from(".second-container", {
      y: 700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });
    gsap.from(".third-container", {
      y: 700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });
    gsap.from(".fourth-container", {
      y: 700,
      opacity: 1,
      duration: 1,
      delay: 0.2,
      ease: "power3.out",
    });

    gsap.from(".h12", {
      x: -700,
      opacity: 0,
      duration: 1,
      delay: 0.9,
      ease: "power3.out",
    });

    gsap.from(".h11", {
      x: 700,
      opacity: 0,
      duration: 1,
      delay: 0.9,
      ease: "power3.out",
    });

    gsap.from(".connectbtn", {
      x: 700,
      opacity: 0,
      duration: 2,
      delay: 0.2,
      ease: "power3.out",
    });

    gsap.from(".apperbtn1", {
      x: 900,
      opacity: 0,
      duration: 2,
      delay: 0.2,
      ease: "power3.out",
    });
  });

  return (
    <div className="signup-container Signup relative">
      <div className="first-container"></div>
      <div className="second-container"></div>
      <div className="left-container">
        <div className="toggle-buttons align-center ">
          <button
            className={!isLogin ? "active-btn" : ""}
            onClick={() => setIsLogin(false)}
          >
            Sign Up
          </button>
          <button
            className={isLogin ? "active-btn" : ""}
            onClick={() => setIsLogin(true)}
          >
            Login
          </button>
        </div>

        {!isLogin ? (
          <form className="form" onSubmit={handleSignup}>
            <input
              type="text"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">SIGN UP</button>
          </form>
        ) : (
          <form className="form" onSubmit={handleLogin}>
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">LOGIN</button>
          </form>
        )}

        <div className="alt-buttons">
          OR
          <button
            type="button"
            className="google-btn"
            onClick={() => alert("Google Login Disabled")}
          >
            Sign in with Google
          </button>
          {isAuthenticated && (
            <button
              className="connectbtn rounded bg-red-500 font-bold text-white hover:bg-red-600"
              onClick={handleSignout}
            >
              SIGN OUT
            </button>
          )}
        </div>
      </div>

      <div className="right-container"></div>

      <div className="last-container">
        <div className="inline">
          <button
            className="connectbtn left-2 w-50"
            type="button"
            onClick={connectWallet}
          >
            {account
              ? `Connected: ${account.slice(0, 6)}...${account.slice(-4)}`
              : "CONNECT WALLET"}
          </button>
          {account && (
            <button
              className="connectbtn right-2 rounded bg-red-500 font-bold text-white hover:bg-red-600"
              type="button"
              onClick={disconnectWallet}
            >
              DISCONNECT
            </button>
          )}
        </div>
      </div>
      <div className="lastest-container"></div>
      <div className="third-container"></div>
      <div className="fourth-container"></div>
      <button
        className=" apperbtn1 absolute h-20px bottom-5 left-10 px-3 py-1 rounded bg-yellow-400 font-bold text-black"
        onClick={() => window.history.back()}
      >
        ⬅ BACK
      </button>
    </div>
  );
};

export default Signup;
