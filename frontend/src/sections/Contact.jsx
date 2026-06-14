import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import "../index.css";

const ContactSection = () => {
  const formRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    user_name: "",
    user_email: "",
    user_message: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await emailjs.sendForm(
        import.meta.env.VITE_APP_EMAILJS_SERVICE_ID,
        import.meta.env.VITE_APP_EMAILJS_TEMPLATE_ID,
        formRef.current,
        import.meta.env.VITE_APP_EMAILJS_PUBLIC_KEY
      );

      setForm({
        user_name: "",
        user_email: "",
        user_message: "",
      });

      alert("✅ Message sent successfully!");
    } catch (error) {
      console.error("EmailJS Error:", error);
      alert("❌ Failed to send message. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useGSAP(() => {
    gsap.from(".contactsection", {
      x: 700,
      opacity: 0,
      duration: 2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".info-section h3",
        start: "top 90%",
      },
    });

    gsap.from(".contactinfo", {
      y: 800,
      opacity: 0,
      duration: 2,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".info-section h3",
        start: "top 90%",
      },
    });

    gsap.from(".contactinput", {
      x: 700,
      opacity: 0,
      duration: 2.5,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".info-section h3",
        start: "top 90%",
      },
    });

    gsap.from(".contactbgc", {
      z: 700,
      opacity: 0,
      duration: 5,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".info-section h3",
        start: "top 90%",
      },
    });
    gsap.from(".contactimg1", {
      y: -700,
      opacity: 0,
      duration: 3,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".info-section h3",
        start: "top 90%",
      },
    });
    gsap.from(".contactbgcimg2", {
      x: 700,
      opacity: 0,
      duration: 3,
      ease: "power3.out",
      scrollTrigger: {
        trigger: ".info-section h3",
        start: "top 90%",
      },
    });
    gsap.utils.toArray(".apperbtn1").forEach((card, i) => {
      gsap.from(card, {
        x: 900, // slide from bottom
        opacity: 0,
        duration: 2,
        delay: i * 0.2, // stagger effect
        ease: "power3.out",
      });
    });
  });

  return (
    <div className="flex relative justify-center items-center h-screen bg-[#111]  text-white">
      <div className=" contact-slideDisplay flex gap-12 h-[650px] w-[1100px] rounded-2xl relative bg-[#000] ">
        {/* Left Contact Section */}
        <div className=" contactsection bg-[#eceaea] h-[580px] rounded-2xl p-10 max-w-[800px] w-full text-center">
          <div className="player-border-corner"></div>
          <div className="contactinfo relative text-[90px] font-extrabold tracking-tight left-[-77px] text-black font-[Impact] top-[-26px] ">
            BrickVerse
          </div>
          <div className="contactinfo relative text-[40px] left-[-77px] text-black font-[Impact] top-[-46px]">
            Contact us
          </div>

          <form
            className=" contactinput relative flex flex-col  gap-[15px] top-[-26px]"
            ref={formRef}
            onSubmit={handleSubmit}
          >
            <input
              type="text"
              name="user_name"
              placeholder="Your Name"
              required
              className="w-[80%] px-4 py-3 rounded-lg bg-[#1a1a1a] text-white text-lg outline-none"
              value={form.user_name}
              onChange={handleChange}
            />

            <input
              type="email"
              name="user_email"
              placeholder="Your Email"
              required
              className="w-[80%] px-4 py-3 rounded-lg bg-[#1a1a1a] text-white text-lg outline-none"
              value={form.user_email}
              onChange={handleChange}
            />

            <textarea
              name="user_message"
              rows="4"
              placeholder="Your Message"
              className="w-[80%] px-4 py-3 rounded-lg bg-[#1a1a1a] text-white text-lg outline-none"
              value={form.user_message}
              onChange={handleChange}
            />

            <button
              type="submit"
              className="mt-4 w-[80%] px-[25px] py-[12px] rounded-lg border border-black text-black text-lg font-bold uppercase cursor-pointer top-[-26px]"
            >
              <p>{loading ? "Sending..." : "Send Message"}</p>
            </button>
          </form>
        </div>

        {/* Right Section Images */}

        <div className="contactbgc absolute right-[222px] top-[150px] w-[200px] h-[400px] rounded-xl bg-[#FFEE00]"></div>
      
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

export default ContactSection;
