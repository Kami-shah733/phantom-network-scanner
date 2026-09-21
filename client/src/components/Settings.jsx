import { useState, useEffect } from "react";
import axios from "axios";

const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

export default function Settings({ history, setHistory }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  // API Key States
  const [apiKey, setApiKey] = useState("");
  const [isKeySaved, setIsKeySaved] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

  // Component mount hone par localStorage se key read karein
  useEffect(() => {
    const savedKey = localStorage.getItem("gemini_api_key");
    if (savedKey) {
      setApiKey(savedKey);
      setIsKeySaved(true);
    }
  }, []);

  const handleSaveKey = () => {
    if (!apiKey.trim()) {
      setError("Please enter a valid API key.");
      return;
    }
    localStorage.setItem("gemini_api_key", apiKey.trim());
    setIsKeySaved(true);
    setMessage("API Key saved securely in your browser's local storage.");
    setError(null);
  };

  const handleRemoveKey = () => {
    localStorage.removeItem("gemini_api_key");
    setApiKey("");
    setIsKeySaved(false);
    setMessage("API Key removed from local storage.");
    setError(null);
  };

  // CSV Export Handler
  const handleExportCSV = () => {
    if (history.length === 0) return;
    axios.get(`${API_URL}/export-csv`, {
      responseType: "blob",
      headers: API_TOKEN ? { "X-API-Token": API_TOKEN } : {},
    }).then((response) => {
      const url = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = url;
      link.download = "phantom_scan_history.csv";
      link.click();
      URL.revokeObjectURL(url);
    }).catch(() => setError("Failed to export scan history."));
  };

  // Clear History Handler
  const handleClearHistory = async () => {
    if (history.length === 0) return;
    const confirmClear = window.confirm("⚠ WARNING: Kya aap waqai saari scan history permanently delete karna chahte hain?");
    if (!confirmClear) return;

    setLoading(true);
    setMessage(null);
    setError(null);

    try {
      await axios.delete(`${API_URL}/clear-history`, {
        headers: API_TOKEN ? { "X-API-Token": API_TOKEN } : {},
      });
      setHistory([]); 
      setMessage("All scan records and port analysis logs have been wiped.");
    } catch (err) {
      console.error(err);
      setError("Failed to communicate with Phantom DB engine.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "0 20px" }}>
      
      {/* SECTION 1: API CONFIGURATION */}
      <div className="p-result" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "30px", borderRadius: "4px", marginBottom: "20px" }}>
        <div className="p-sec-hdr" style={{ borderBottom: "none", marginBottom: "20px" }}>
          <div className="p-sec-title">
            <div className="p-sec-bar" style={{ background: "var(--blue)" }}></div>
            AI ENGINE CONFIGURATION
          </div>
        </div>

        <p style={{ color: "var(--dim)", marginBottom: "20px", fontSize: "0.95rem", lineHeight: "1.6", fontFamily: "monospace" }}>
          [ GEMINI API INTEGRATION ]<br />
          Enter your Google Gemini API Key to enable AI Threat Reports. This key is stored securely in your browser and is never saved to the database.
        </p>

        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap", marginBottom: "15px" }}>
          {/* SECURE MASKED INPUT FIELD */}
          <input 
            type={showKey && !isKeySaved ? "text" : "password"} 
            value={isKeySaved ? "••••••••••••••••••••••••••••••••••••" : apiKey}
            onChange={(e) => { setApiKey(e.target.value); setIsKeySaved(false); }}
            placeholder="AIzaSyB..."
            disabled={isKeySaved}
            style={{ 
              background: "var(--bg)", 
              color: isKeySaved ? "var(--green)" : "#fff", 
              border: "1px solid var(--border)", 
              padding: "12px", 
              fontFamily: "monospace", 
              width: "100%", 
              maxWidth: "400px", 
              borderRadius: "3px",
              cursor: isKeySaved ? "not-allowed" : "text",
              letterSpacing: isKeySaved ? "2px" : "normal"
            }}
          />
          
          {/* SHOW BUTTON (Sirf nayi key dalte waqt nazar aayega) */}
          {!isKeySaved && (
            <button 
              onClick={() => setShowKey(!showKey)}
              style={{ background: "transparent", color: "var(--dim)", border: "1px solid var(--border)", padding: "12px", cursor: "pointer", fontFamily: "monospace", borderRadius: "3px" }}
            >
              {showKey ? "HIDE" : "SHOW"}
            </button>
          )}
        </div>

        <div style={{ display: "flex", gap: "15px" }}>
          <button 
            onClick={handleSaveKey}
            style={{ background: "var(--green)", color: "#000", border: "none", padding: "12px 24px", fontFamily: "monospace", fontWeight: "bold", cursor: "pointer", borderRadius: "3px" }}
          >
            {isKeySaved ? "KEY SAVED ✔" : "SAVE API KEY"}
          </button>
          
          {isKeySaved && (
            <button 
              onClick={handleRemoveKey}
              style={{ background: "transparent", color: "var(--red)", border: "1px solid var(--red)", padding: "12px 24px", fontFamily: "monospace", cursor: "pointer", borderRadius: "3px" }}
            >
              REMOVE KEY
            </button>
          )}
        </div>
      </div>

      {/* SECTION 2: DATABASE MANAGEMENT */}
      <div className="p-result" style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "30px", borderRadius: "4px" }}>
        <div className="p-sec-hdr" style={{ borderBottom: "none", marginBottom: "20px" }}>
          <div className="p-sec-title">
            <div className="p-sec-bar" style={{ background: "var(--red)" }}></div>
            DATABASE MANAGEMENT
          </div>
        </div>

        <p style={{ color: "var(--dim)", marginBottom: "25px", fontSize: "0.95rem", lineHeight: "1.6", fontFamily: "monospace" }}>
          [ SYSTEM LOG CONTROL ]<br />
          Manage your local SQLite instance storage. Export historical threat intelligence metrics to Excel-compatible formats or wipe target data.
        </p>

        <div style={{ display: "flex", gap: "15px", flexWrap: "wrap" }}>
          <button 
            onClick={handleExportCSV} disabled={history.length === 0}
            style={{ background: "var(--blue)", color: "#fff", border: "none", padding: "12px 24px", fontFamily: "monospace", fontWeight: "bold", letterSpacing: "1px", borderRadius: "3px", opacity: history.length === 0 ? 0.4 : 1, cursor: history.length === 0 ? "not-allowed" : "pointer" }}
          >
            EXPORT TO CSV (EXCEL)
          </button>

          <button 
            onClick={handleClearHistory} disabled={loading || history.length === 0}
            style={{ background: "var(--red)", color: "#fff", border: "none", padding: "12px 24px", fontFamily: "monospace", fontWeight: "bold", letterSpacing: "1px", borderRadius: "3px", opacity: history.length === 0 ? 0.4 : 1, cursor: history.length === 0 ? "not-allowed" : "pointer" }}
          >
            {loading ? "WIPING DATABASE..." : "CLEAR ALL SCAN HISTORY"}
          </button>
        </div>

        {message && (
          <div className="p-empty" style={{ color: "var(--green)", borderColor: "var(--green)", marginTop: "25px", textAlign: "left", padding: "15px" }}>
            [ SUCCESS ]<br />{message}
          </div>
        )}

        {error && (
          <div className="p-empty" style={{ color: "var(--red)", borderColor: "var(--red)", marginTop: "25px", textAlign: "left", padding: "15px" }}>
            [ ERROR ]<br />{error}
          </div>
        )}
      </div>
    </div>
  );
}