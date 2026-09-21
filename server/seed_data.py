import random
from datetime import datetime, timedelta
from database import SessionLocal, engine
import models

# Ensure tables exist
models.Base.metadata.create_all(bind=engine)

def seed_database():
    db = SessionLocal()
    
    # Check if DB already has enough data
    existing_scans = db.query(models.Scan).count()
    if existing_scans > 0:
        print(f"\n⚠️ Database already has {existing_scans} scans.")
        print("💡 Tip: Agar aap fresh training data chahte hain, toh UI ke Settings tab se 'Clear All Scan History' dabayein aur phir yeh script chalayein.\n")
        db.close()
        return

    print("🌱 Injecting 100 training scans for ML Engine...")
    
    # Dummy Targets
    targets = ["192.168.1.10", "192.168.1.50", "10.0.0.15", "172.16.0.5"]
    safe_ports = [80, 443, 53]
    dangerous_ports = [22, 23, 21, 3389, 445, 3306]

    for i in range(100):
        target = random.choice(targets)
        
        # 80% Normal Scans, 20% Anomalies (Dangerous)
        is_anomaly = random.random() < 0.2
        
        if is_anomaly:
            risk_score = random.randint(50, 90)
            risk_level = "High" if risk_score >= 60 else "Medium"
            open_ports = random.sample(dangerous_ports, k=random.randint(1, 3))
        else:
            risk_score = random.randint(0, 30)
            risk_level = "Low"
            open_ports = random.sample(safe_ports, k=random.randint(1, 2))
            
        # Randomize dates within the last 30 days
        scan_time = (datetime.now() - timedelta(days=random.randint(0, 30))).strftime("%Y-%m-%d %H:%M:%S")
        
        # Add Scan Record
        new_scan = models.Scan(
            target_ip=target,
            scan_time=scan_time,
            risk_score=risk_score,
            risk_level=risk_level
        )
        db.add(new_scan)
        db.commit()
        db.refresh(new_scan)
        
        # Add Associated Port Records
        for port in open_ports:
            risk = "High" if port in dangerous_ports else "Low"
            if port == 3389: risk = "Critical"
            
            new_port = models.Port(
                scan_id=new_scan.id,
                port_number=port,
                status="open",
                service="simulated-service",
                product="",
                version="",
                risk=risk
            )
            db.add(new_port)
        db.commit()

    print("✅ System Seeded: 100 Scans injected successfully! ML Engine is ready.")
    db.close()

if __name__ == "__main__":
    seed_database()