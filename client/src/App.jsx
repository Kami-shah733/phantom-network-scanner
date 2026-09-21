import { useState, useEffect } from "react";
import axios from "axios";
import Navbar from "./components/Navbar";
import ScanForm from "./components/ScanForm";
import PortTable from "./components/PortTable";
import ScanHistory from "./components/ScanHistory";
import RiskBadge from "./components/RiskBadge";
import AIReport from "./components/AIReport";
import Settings from "./components/Settings";

const API_TOKEN = import.meta.env.VITE_API_TOKEN || "";
const apiHeaders = API_TOKEN ? { "X-API-Token": API_TOKEN } : {};

export default function App() {
  const [activeTab, setActiveTab] = useState("Scanner");

  const [scanResult, setScanResult] = useState(null);
  const [history, setHistory]       = useState([]);
  const [loading, setLoading]       = useState(false);
  const [loadText, setLoadText]     = useState("");
  const [scanStatus, setScanStatus] = useState("Idle");
  const [scanError, setScanError]   = useState("");

  // Fetch complete scan history on app start
  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
        const res = await axios.get(`${API_URL}/history`, { headers: apiHeaders });
        setHistory(res.data);
      } catch (error) {
        console.error("Failed to fetch history:", error);
      }
    };
    fetchHistory();
  }, []);

  // Cyber-themed loading messages
  const loadMsgs = [
    "Starting Nmap 7.99 scan...",
    "Resolving target hostname...",
    "Initiating scan protocol...",
    "Scanning designated ports...",
    "Detecting service versions...",
    "Running ML Anomaly Detection...",
    "Analyzing results...",
    "Calculating final risk score...",
  ];

  const handleScan = async (ip, scanType) => {
    setLoading(true);
    setScanResult(null);
    setScanError("");
    setScanStatus("Scanning...");
    
    let i = 0;
    setLoadText(loadMsgs[0]);
    const interval = setInterval(() => {
      i++;
      setLoadText(loadMsgs[Math.min(i, loadMsgs.length - 1)]);
    }, 350);

    try {
      const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
      const response = await axios.post(`${API_URL}/scan`, { target_ip: ip, scan_type: scanType }, { headers: apiHeaders });
      
      clearInterval(interval);
      const riskScore = Number(response.data.risk_score);
      const safeData = {
        ...response.data,
        risk_score: Number.isFinite(riskScore) ? Math.max(0, Math.min(100, riskScore)) : 0,
        risk_level: response.data.risk_level || "Low",
        ports: Array.isArray(response.data.ports) ? response.data.ports : [],
      };
      setScanResult(safeData);
      
      setHistory((prev) => [
        {
          id: safeData.id, 
          target_ip: ip,
          scan_time: safeData.scan_time,
          risk_level: safeData.risk_level,
          risk_score: safeData.risk_score,
        },
        ...prev,
      ]);
      setScanStatus("Complete");
    } catch (error) {
      clearInterval(interval);
      let errMsg = "Scan failed. Check target IP or Nmap setup.";
      if (error.response?.data?.detail) {
        const detail = error.response.data.detail;
        errMsg = Array.isArray(detail) ? detail[0].msg.replace("Value error, ", "") : detail;
      }
      setScanStatus("Error: " + errMsg);
      setScanError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)" }}>
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* VIEW 1: SCANNER TAB */}
      {activeTab === "Scanner" && (
        <>
          <div style={{ background: "var(--surface)", borderBottom: "1px solid var(--border)", padding: "28px 24px" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "20px" }}>
              <div>
                <h1 className="p-hero-title">Network <span>Threat</span> Scanner</h1>
                <p className="p-hero-sub">Performs TCP port scans on target hosts, detects running services, and evaluates security exposure using rule-based risk analysis and SVM Machine Learning.</p>
              </div>
              <div className="p-hero-meta">
                {["Nmap 7.99 engine", "TCP Connect scan", "Top 20 ports", "AI & ML risk scoring"].map((m) => (
                  <div key={m} className="p-meta-item"><div className="p-meta-dot"></div>{m}</div>
                ))}
              </div>
            </div>
            <ScanForm onScan={handleScan} loading={loading} />
          </div>

          <div className="p-stats">
            <div className="p-stat"><div className="p-stat-label">Total Scans</div><div className="p-stat-val c-blue">{history.length}</div><div className="p-stat-sub">All time</div></div>
            <div className="p-stat"><div className="p-stat-label">High Risk</div><div className="p-stat-val c-red">{history.filter(h => h.risk_level === "High").length}</div><div className="p-stat-sub">Hosts flagged</div></div>
            <div className="p-stat"><div className="p-stat-label">Open Ports</div><div className="p-stat-val c-yellow">{scanResult ? scanResult.ports.filter(p => p.status === "open").length : 0}</div><div className="p-stat-sub">Last scan</div></div>
            <div className="p-stat"><div className="p-stat-label">Safe Hosts</div><div className="p-stat-val c-green">{history.filter(h => h.risk_level === "Low").length}</div><div className="p-stat-sub">Low risk</div></div>
          </div>

          <div className="p-main">
            <div className="p-content">
              <div className="p-sec-hdr"><div className="p-sec-title"><div className="p-sec-bar"></div>Scan Output</div><span className="p-sec-badge">{scanStatus}</span></div>
              {loading && <div className="p-loading"><div className="p-load-row"><span className="p-load-prefix">[ STATUS ]</span><span className="p-load-txt">{loadText}</span></div><div className="p-load-track"><div className="p-load-bar"></div></div></div>}
              {scanError && !loading && <div className="p-empty" style={{ color: "var(--red)", borderColor: "var(--red)" }}>[ SCAN ERROR ] {scanError}</div>}
              {scanResult && !loading && (
                <div className="p-result">
                  <div className="p-result-grid">
                    <div className="p-rg-cell"><div className="p-rg-label">Target</div><div className="p-rg-val">{scanResult.target_ip}</div></div>
                    <div className="p-rg-cell"><div className="p-rg-label">Timestamp</div><div className="p-rg-val">{scanResult.scan_time}</div></div>
                    <div className="p-rg-cell"><div className="p-rg-label">Risk Level</div><RiskBadge level={scanResult.risk_level} /></div>
                  </div>
                  <div className="p-score-row">
                    <span className="p-score-label">Threat Score</span>
                    <div className="p-score-track"><div className="p-score-fill" style={{ width: `${scanResult.risk_score}%`, background: scanResult.risk_score >= 60 ? "var(--red)" : scanResult.risk_score >= 40 ? "var(--yellow)" : "var(--green)" }}></div></div>
                    <span className="p-score-num">{scanResult.risk_score}/100</span>
                  </div>

                  {/* 🔥 THE ML ANOMALY ALERT BOX 🔥 */}
                  {scanResult.anomaly_detected && (
                    <div style={{ marginTop: "20px", padding: "15px", background: "rgba(255, 68, 68, 0.1)", border: "1px solid var(--red)", borderRadius: "4px" }}>
                      <div style={{ color: "var(--red)", fontWeight: "bold", marginBottom: "8px", fontFamily: "monospace" }}>
                        ⚠️ ML ENGINE ALERT: OUTLIER DETECTED
                      </div>
                      <div style={{ color: "#ddd", fontSize: "14px", fontFamily: "monospace", lineHeight: "1.5" }}>
                        {scanResult.anomaly_description}
                      </div>
                    </div>
                  )}

                </div>
              )}
              {!scanResult && !loading && <div className="p-empty">[ No scan data ]<br />Enter a target IP and run a scan to begin.</div>}
              <div className="p-sec-hdr"><div className="p-sec-title"><div className="p-sec-bar"></div>Port Analysis</div><span className="p-sec-badge">{scanResult ? `${scanResult.ports.filter((port) => !port.summary).length} total` : "—"}</span></div>
              {scanResult ? <PortTable ports={scanResult.ports} /> : <div className="p-empty">Run a scan to detect ports</div>}
            </div>

            <div className="p-sidebar">
              <div style={{ borderBottom: "1px solid var(--border)" }}>
                <div className="p-sb-hdr">Risk Distribution</div>
                <div className="p-meter-item"><div className="p-meter-hdr"><span style={{ color: "var(--red)" }}>High Risk</span><span style={{ color: "var(--dim)" }}>{history.filter(h => h.risk_level === "High").length} hosts</span></div><div className="p-meter-track"><div className="p-meter-fill" style={{ width: `${(history.filter(h => h.risk_level === "High").length / (history.length || 1)) * 100}%`, background: "var(--red)" }}></div></div></div>
                <div className="p-meter-item"><div className="p-meter-hdr"><span style={{ color: "var(--yellow)" }}>Medium Risk</span><span style={{ color: "var(--dim)" }}>{history.filter(h => h.risk_level === "Medium").length} hosts</span></div><div className="p-meter-track"><div className="p-meter-fill" style={{ width: `${(history.filter(h => h.risk_level === "Medium").length / (history.length || 1)) * 100}%`, background: "var(--yellow)" }}></div></div></div>
                <div className="p-meter-item"><div className="p-meter-hdr"><span style={{ color: "var(--green)" }}>Low Risk</span><span style={{ color: "var(--dim)" }}>{history.filter(h => h.risk_level === "Low").length} hosts</span></div><div className="p-meter-track"><div className="p-meter-fill" style={{ width: `${(history.filter(h => h.risk_level === "Low").length / (history.length || 1)) * 100}%`, background: "var(--green)" }}></div></div></div>
              </div>
              <div><div className="p-sb-hdr">Recent Scans</div><ScanHistory history={history} /></div>
            </div>
          </div>
        </>
      )}

      {/* VIEW 2: HISTORY TAB */}
      {activeTab === "History" && (
        <div style={{ padding: "30px" }}>
          <div className="p-sec-hdr" style={{ marginBottom: "20px" }}><div className="p-sec-title"><div className="p-sec-bar"></div>Complete Scan History Log</div></div>
          <div className="p-table-wrap" style={{ background: "var(--surface)", padding: "20px" }}><ScanHistory history={history} /></div>
        </div>
      )}

      {/* VIEW 3: REPORTS TAB */}
      {activeTab === "Reports" && (
        <div style={{ padding: "30px" }}>
          <div className="p-sec-hdr" style={{ marginBottom: "20px" }}>
            <div className="p-sec-title"><div className="p-sec-bar"></div>AI Threat Intelligence Reports</div>
            <span className="p-sec-badge" style={{ color: "var(--blue)", border: "1px solid var(--blue)" }}>Powered by Gemini</span>
          </div>
          <AIReport history={history} /> 
        </div>
      )}

      {/* VIEW 4: SETTINGS TAB */}
      {activeTab === "Settings" && (
        <div style={{ padding: "30px" }}>
          <div className="p-sec-hdr" style={{ marginBottom: "20px" }}>
            <div className="p-sec-title"><div className="p-sec-bar"></div>System Settings</div>
          </div>
          <Settings history={history} setHistory={setHistory} />
        </div>
      )}
    </div>
  );
}