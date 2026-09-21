import React from 'react'





export default function RiskBadge({ level }) {
  const styles = {
    High: {
      background: "#490202",
      color: "#f85149",
      border: "1px solid #6b2020"
    },
    Medium: {
      background: "#2d2000",
      color: "#d29922",
      border: "1px solid #4a3400"
    },
    Low: {
      background: "#0a2010",
      color: "#3fb950",
      border: "1px solid #1a4020"
    },
  };

  const style = styles[level] || styles.Low;

  return (
    <span style={{
      ...style,
      padding: "2px 8px",
      borderRadius: "3px",
      fontSize: "10px",
      fontWeight: "700",
      letterSpacing: ".5px",
      display: "inline-block"
    }}>
      {level}
    </span>
  );
}