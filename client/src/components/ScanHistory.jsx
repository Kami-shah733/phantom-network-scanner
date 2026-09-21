import RiskBadge from "./RiskBadge";

export default function ScanHistory({ history }) {
  return (
    <div>
      {history.map((item) => (
        <div key={item.id} className="p-hist-item">
          <div className="p-hist-ip">{item.target_ip}</div>
          <div className="p-hist-meta">
            <span className="p-hist-time">{item.scan_time?.toString().slice(0,16)}</span>
            <RiskBadge level={item.risk_level} />
          </div>
        </div>
      ))}
    </div>
  );
}