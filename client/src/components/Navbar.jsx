import { useState, useEffect } from "react";

export default function Navbar({ activeTab, setActiveTab }) {
  const [time, setTime] = useState("");

  useEffect(() => {
    const iv = setInterval(() => {
      setTime(new Date().toTimeString().slice(0, 8));
    }, 1000);
    return () => clearInterval(iv);
  }, []);

  return (
    <nav className="p-nav">
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div className="p-logo">
          <div className="p-logo-box">
            <svg viewBox="0 0 16 16"><path d="M8 1L15 4.5V8C15 11.5 11.5 14.5 8 15C4.5 14.5 1 11.5 1 8V4.5L8 1Z"/></svg>
          </div>
          <span className="p-logo-name">PHANTOM</span>
          <span className="p-logo-ver">v2.0</span>
        </div>
        
        <div className="p-tabs">
          {["Scanner", "History", "Reports", "Settings"].map((t) => (
            <div 
              key={t} 
              // 🔴 FIX: Yahan hum dynamic active class de rahe hain
              className={`p-tab ${activeTab === t ? "active" : ""}`}
              onClick={() => setActiveTab(t)}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
      
      <div className="p-nav-right">
        <div className="p-status">
          <div className="p-status-dot"></div>
          Engine Online
        </div>
        <span className="p-clk">{time}</span>
      </div>
    </nav>
  );
}