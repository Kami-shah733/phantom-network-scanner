import { useState } from "react";

export default function ScanForm({ onScan, loading }) {
  const [ip, setIp] = useState("");
  const [scanType, setScanType] = useState("-sT");

  const handleSubmit = () => {
    if (!ip.trim()) return;

    onScan(ip.trim(), scanType); 
    setIp("");
  };

  return (
    <div className="p-scanbar">
      <input
        type="text"
        placeholder="Target IPv4 — e.g. 192.168.1.1"
        value={ip}
        onChange={(e) => setIp(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
      />

      <select value={scanType} onChange={(e) => setScanType(e.target.value)}>
        <option value="-sT">TCP Connect (-sT Fast, top 20 ports)</option>
        <option value="-sS">SYN Scan (-sS, top 20 ports)</option>
        <option value="-sV">Service Scan (-sV, top 20 ports)</option>
      </select>

      <button onClick={handleSubmit} disabled={loading}>
        {loading ? "SCANNING..." : "RUN SCAN"}
      </button>
    </div>
  );
}