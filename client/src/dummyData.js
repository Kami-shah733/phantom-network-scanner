export const dummyScanResult = {
  target_ip: "192.168.1.1",
  scan_time: "2025-04-21 10:30:00",
  risk_score: 75,
  risk_level: "High",
  ports: [
    { port_number: 22,   status: "open", service: "SSH"   },
    { port_number: 80,   status: "open", service: "HTTP"  },
    { port_number: 443,  status: "open", service: "HTTPS" },
    { port_number: 3389, status: "open", service: "RDP"   },
    { port_number: 21,   status: "open", service: "FTP"   },
  ],
};

export const dummyHistory = [
  { id: 1, target_ip: "127.0.0.1", scan_time: "2025-04-21 10:30", risk_level: "High",   risk_score: 75 },
  { id: 2, target_ip: "10.0.0.1",    scan_time: "2025-04-20 14:15", risk_level: "Medium", risk_score: 45 },
  { id: 3, target_ip: "10.0.0.5", scan_time: "2025-04-19 09:00", risk_level: "Low",    risk_score: 10 },
];