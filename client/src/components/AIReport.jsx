import { useState } from "react";
import axios from "axios";

const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";

export default function AIReport({ history }) {
  const [selectedScan, setSelectedScan] = useState("");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateReport = async () => {
    if (!selectedScan) return;
    
    setLoading(true);
    setReport(null);
    setError(null);

    // Local storage se API key nikalain
    const savedApiKey = localStorage.getItem("gemini_api_key");

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      
      // Axios request mein X-API-Key header attach karein
      const res = await axios.get(`${API_URL}/generate-report/${selectedScan}`, {
        headers: {
          ...(API_TOKEN ? { "X-API-Token": API_TOKEN } : {}),
          "X-API-Key": savedApiKey || "" // Agar key nahi hai toh khali string jayegi
        }
      });
      
      setReport(res.data.report);
    } catch (err) {
      console.error(err);
      let errMsg = "Failed to generate report.";
      if (err.response?.data?.detail) {
         errMsg = err.response.data.detail;
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!report) return;

    const scan = history.find((item) => String(item.id) === String(selectedScan));
    const filename = `phantom-report-${scan?.target_ip || selectedScan}.txt`;
    const blob = new Blob([report], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-result">
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
        <select 
          className="p-input" 
          value={selectedScan} 
          onChange={(e) => setSelectedScan(e.target.value)}
          style={{ flex: 1, padding: "12px", background: "var(--bg)", color: "var(--dim)", border: "1px solid var(--border)", fontFamily: "monospace" }}
        >
          <option value="">Select a scan to analyze...</option>
          {history.map(h => (
            <option key={h.id} value={h.id}>
              [ID: {h.id}] Target: {h.target_ip} — Date: {h.scan_time}
            </option>
          ))}
        </select>
        
        <button 
          className="p-btn" 
          onClick={generateReport}
          disabled={!selectedScan || loading}
          style={{ padding: "0 20px", background: "var(--blue)", color: "#fff", border: "none", cursor: loading ? "wait" : "pointer" }}
        >
          {loading ? "ANALYZING..." : "GENERATE AI REPORT"}
        </button>
      </div>

      <div className="p-sec-hdr"><div className="p-sec-title"><div className="p-sec-bar"></div>Threat Analysis Engine</div></div>
      
      {error && <div className="p-empty" style={{ color: "var(--red)", borderColor: "var(--red)" }}>[ ERROR ] {error}</div>}
      
      {!report && !error && !loading && (
        <div className="p-empty">
          Select a scan from the dropdown and run the AI engine to generate a detailed vulnerability report.
        </div>
      )}

      {loading && (
        <div className="p-loading" style={{ margin: "20px 0" }}>
          <div className="p-load-row"><span className="p-load-prefix">[ AI ENGINE ]</span><span className="p-load-txt">Transmitting scan data to Gemini...</span></div>
          <div className="p-load-track"><div className="p-load-bar"></div></div>
        </div>
      )}

      {report && (
        <div>
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "20px" }}>
            <button
              className="p-btn"
              onClick={downloadReport}
              style={{ padding: "10px 16px", background: "var(--green)", color: "#000", border: "none", cursor: "pointer", fontWeight: "700" }}
            >
              DOWNLOAD REPORT
            </button>
          </div>
          <div style={{
            background: "var(--bg)",
            border: "1px solid var(--border)",
            padding: "20px",
            marginTop: "10px",
            color: "#ddd",
            lineHeight: "1.8",
            fontFamily: "monospace",
            fontSize: "14px",
            whiteSpace: "pre-wrap"
          }}>
            {report}
          </div>
        </div>
      )}
    </div>
  );
}