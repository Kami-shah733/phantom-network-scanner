import os
import ipaddress
import csv
import hmac
import time
from threading import Lock
from io import StringIO
from fastapi import FastAPI, HTTPException, Depends, Header, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator
from typing import Literal
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.trustedhost import TrustedHostMiddleware
from datetime import datetime
import nmap
from dotenv import load_dotenv

# Database imports
from sqlalchemy.orm import Session
import models
import database

# AI Imports
import google.generativeai as genai

# ML Imports (optional - may be blocked by Windows Application Control)
ML_AVAILABLE = False
try:
    import numpy as np
    from sklearn.svm import OneClassSVM
    ML_AVAILABLE = True
    print("[OK] ML Engine (numpy + scikit-learn) loaded successfully.")
except ImportError as e:
    print(f"[WARN] ML Engine disabled: {e}. Anomaly detection will be skipped.")
    np = None
    OneClassSVM = None

# Load .env variables
load_dotenv()

# Database Tables Create karein
models.Base.metadata.create_all(bind=database.engine)

# Gemini API Configuration fallback
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-3.6-flash")
SCAN_PORT_SPEC = os.getenv("SCAN_PORT_SPEC", "--top-ports 20")
APP_ENV = os.getenv("APP_ENV", "development").lower()
APP_API_TOKEN = os.getenv("APP_API_TOKEN")
ALLOWED_HOSTS = [host.strip() for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",") if host.strip()]
FRONTEND_URL = os.getenv("FRONTEND_URL")

if APP_ENV == "production" and not APP_API_TOKEN:
    raise RuntimeError("APP_API_TOKEN must be configured when APP_ENV=production.")
if APP_ENV == "production" and not FRONTEND_URL:
    raise RuntimeError("FRONTEND_URL must be configured when APP_ENV=production.")

scan_lock = Lock()
rate_limit_lock = Lock()
scan_requests = {}
report_lock = Lock()

def require_api_access(
    x_api_token: str | None = Header(default=None),
):
    if not APP_API_TOKEN:
        return
    if not x_api_token or not hmac.compare_digest(x_api_token, APP_API_TOKEN):
        raise HTTPException(status_code=401, detail="Valid API access token required.")

def enforce_scan_rate_limit(request: Request):
    client_ip = request.client.host if request.client else "unknown"
    now = time.monotonic()
    with rate_limit_lock:
        window_start, request_count = scan_requests.get(client_ip, (now, 0))
        if now - window_start >= 60:
            window_start, request_count = now, 0
        if request_count >= 10:
            raise HTTPException(status_code=429, detail="Scan rate limit exceeded. Try again later.")
        scan_requests[client_ip] = (window_start, request_count + 1)

def get_gemini_model(api_key):
    genai.configure(api_key=api_key)
    return genai.GenerativeModel(GEMINI_MODEL)

def find_available_gemini_model(api_key):
    genai.configure(api_key=api_key)

    preferred_models = [
        GEMINI_MODEL,
        "gemini-3.6-flash",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
    ]

    available_models = {}
    for model_info in genai.list_models():
        supported_methods = getattr(model_info, "supported_generation_methods", [])
        if "generateContent" in supported_methods:
            model_name = model_info.name.removeprefix("models/")
            available_models[model_name] = model_name

    for model_name in preferred_models:
        if model_name in available_models:
            return genai.GenerativeModel(available_models[model_name])

    raise RuntimeError(
        "The supplied Gemini API key has no available model that supports generateContent."
    )

app = FastAPI(title="Phantom Network Scanner (ML Edition)")

app.add_middleware(TrustedHostMiddleware, allowed_hosts=ALLOWED_HOSTS)

allowed_origins = [FRONTEND_URL] if FRONTEND_URL else []
if APP_ENV != "production":
    allowed_origins.extend(("http://localhost:5173", "http://127.0.0.1:5173"))

@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["Cache-Control"] = "no-store"
    return response

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = database.SessionLocal()
    try:
        yield db
    finally:
        db.close()

nm = None
def get_scanner():
    global nm
    if nm is None:
        nm = nmap.PortScanner()
    return nm

class ScanRequest(BaseModel):
    target_ip: str
    scan_type: Literal["-sT", "-sS", "-sV"]

    @field_validator('target_ip')
    def validate_ip(cls, v):
        try:
            ipaddress.ip_address(v)
            return v
        except ValueError:
            raise ValueError("Invalid IP address format. Please enter a valid IPv4.")

DANGEROUS_PORTS = [22, 23, 21, 3389, 445, 8080, 3306, 5900]

def get_port_risk(port, status):
    if status != "open": return "None"
    if port == 3389: return "Critical"
    elif port in DANGEROUS_PORTS: return "High"
    return "Low"

def calculate_risk_score(ports):
    score = 0
    for p in ports:
        if p["status"] == "open":
            score += 10
            if p["port_number"] == 3389: score += 30
            elif p["port_number"] in DANGEROUS_PORTS: score += 20
    return min(score, 100)

def get_risk_level(score):
    if score >= 50: return "High"
    elif score >= 40: return "Medium"
    return "Low"

# 🧠 MACHINE LEARNING ENGINE: SVM Anomaly Detector
def detect_anomaly_svm(current_score, current_ports_count, past_scans, db: Session):
    if not ML_AVAILABLE:
        return False, "ML Engine not available on this system (DLL blocked by Application Control)."
    if len(past_scans) < 10:
        return False, "Not enough historical data to run ML analysis."

    try:
        # Step 1: Prepare Training Data (Features: Risk Score, Num of Open Ports)
        X_train = []
        for s in past_scans:
            port_count = db.query(models.Port).filter(models.Port.scan_id == s.id).count()
            X_train.append([s.risk_score, port_count])
            
        X_train = np.array(X_train)

        # Step 2: Train One-Class SVM Model
        # nu=0.1 means we assume 10% of past data might be outliers
        model = OneClassSVM(kernel='rbf', gamma='scale', nu=0.01)
        model.fit(X_train)

        # Step 3: Predict Current Scan
        X_test = np.array([[current_score, current_ports_count]])
        prediction = model.predict(X_test)

        # Output -1 means Anomaly, 1 means Normal
        is_anomaly = bool(prediction[0] == -1)
        
        desc = ""
        if is_anomaly:
            desc = f"⚠️ ML Alert: Support Vector Machine (SVM) detected a significant anomaly. The threat pattern (Score: {current_score}, Ports: {current_ports_count}) deviates from historical baselines."
        
        return is_anomaly, desc

    except Exception as e:
        print(f"ML Engine Error: {e}")
        return False, "ML Engine failed to process data."

@app.get("/")
def home():
    return {"message": "PHANTOM API Base is Online!"}

@app.get("/history", dependencies=[Depends(require_api_access)])
def get_history(db: Session = Depends(get_db)):
    scans = db.query(models.Scan).order_by(models.Scan.id.desc()).all()
    return scans

@app.get("/generate-report/{scan_id}")
def generate_ai_report(scan_id: int, db: Session = Depends(get_db), x_api_key: str = Header(None), _: None = Depends(require_api_access)):
    print(f"\n--- [AI] REPORT REQUEST FOR SCAN ID: {scan_id} ---")
    api_key_to_use = x_api_key if x_api_key else GEMINI_API_KEY
    
    if not api_key_to_use:
        raise HTTPException(status_code=400, detail="API Key Missing! Please add your Gemini API Key in the Settings tab.")
    if len(api_key_to_use) > 256:
        raise HTTPException(status_code=400, detail="Gemini API key is invalid.")

    scan = db.query(models.Scan).filter(models.Scan.id == scan_id).first()
    if not scan:
        raise HTTPException(status_code=404, detail="Scan not found")
        
    ports = db.query(models.Port).filter(models.Port.scan_id == scan_id).all()
    open_ports_info = [f"Port {p.port_number} ({p.service}) - Risk: {p.risk}" for p in ports if p.status == "open"]
    
    prompt = f"""
    You are an expert Cybersecurity Analyst. Review the following network scan results for target IP {scan.target_ip}.
    - Risk Score: {scan.risk_score}/100
    - Risk Level: {scan.risk_level}
    - Open Ports Detected: {', '.join(open_ports_info) if open_ports_info else 'None'}
    
    Provide a concise, highly professional threat intelligence report. 
    Format your response in exactly two short paragraphs:
    1. Threat Analysis: What these open ports mean for the system's security.
    2. Mitigation Strategy: Actionable steps the administrator should take to secure the network.
    Do not use markdown like * or #, just plain text paragraphs.
    """

    try:
        with report_lock:
            model = get_gemini_model(api_key_to_use)
            try:
                response = model.generate_content(prompt)
            except Exception as generation_error:
                error_text = str(generation_error).lower()
                if "not found" not in error_text and "no longer available" not in error_text:
                    raise
                model = find_available_gemini_model(api_key_to_use)
                response = model.generate_content(prompt)
        return {"report": response.text}
    except Exception as e:
        print(f"AI report failed for scan {scan_id}: {e}")
        raise HTTPException(
            status_code=500,
            detail="AI Engine failed. Check the API key and server logs for details.",
        )

@app.delete("/clear-history", dependencies=[Depends(require_api_access)])
def clear_history(db: Session = Depends(get_db)):
    try:
        db.query(models.Port).delete()
        db.query(models.Scan).delete()
        db.commit()
        return {"message": "All scan history cleared successfully."}
    except Exception as e:
        db.rollback()
        print(f"Clear history failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to clear scan history.")

@app.get("/export-csv", dependencies=[Depends(require_api_access)])
def export_csv(db: Session = Depends(get_db)):
    try:
        scans = db.query(models.Scan).order_by(models.Scan.id.desc()).all()
        output = StringIO()
        writer = csv.writer(output)
        writer.writerow(["Scan ID", "Target IP", "Scan Time", "Risk Score", "Risk Level"])
        
        for s in scans:
            writer.writerow([s.id, s.target_ip, s.scan_time, s.risk_score, s.risk_level])
        
        output.seek(0)
        headers = {'Content-Disposition': 'attachment; filename="phantom_scan_history.csv"'}
        return StreamingResponse(output, media_type="text/csv", headers=headers)
    except Exception as e:
        print(f"CSV export failed: {e}")
        raise HTTPException(status_code=500, detail="Failed to export scan history.")

@app.post("/scan", dependencies=[Depends(require_api_access)])
def scan(request: ScanRequest, http_request: Request, db: Session = Depends(get_db)):
    enforce_scan_rate_limit(http_request)
    if not scan_lock.acquire(blocking=False):
        raise HTTPException(status_code=429, detail="Another scan is already running. Try again later.")
    try:
        scanner = get_scanner()
    except Exception as e:
        scan_lock.release()
        raise HTTPException(status_code=500, detail="Nmap not found in system PATH.")
    
    target = request.target_ip
    scan_type = request.scan_type   
    
    args_map = {"-sT": "-sT", "-sS": "-sS", "-sV": "-sV"}
    base_arg = args_map.get(scan_type, "-sT")
    port_spec = SCAN_PORT_SPEC
    if scan_type == "-sV" and "--version-light" not in port_spec:
        port_spec = f"{port_spec} --version-light"

    # Keep discovery disabled, but allow one retry so slower LAN targets report ports.
    args = f"{base_arg} -Pn -T4 --max-retries 1 --host-timeout 15s {port_spec}"

    try:
        # Run Nmap
        scanner.scan(hosts=target, arguments=args)
        
        ports_data = []
        open_ports_count = 0
        for host in scanner.all_hosts():
            for proto in scanner[host].all_protocols():
                for port in scanner[host][proto].keys():
                    port_info = scanner[host][proto][port]
                    status = port_info['state']
                    risk = get_port_risk(port, status)
                    
                    if status == "open": open_ports_count += 1
                    
                    ports_data.append({
                        "port_number": port,
                        "status": status,
                        "service": port_info.get('name', 'unknown'),
                        "product": port_info.get('product', ''),
                        "version": port_info.get('version', ''),
                        "risk": risk
                    })

        if not ports_data:
            ports_data.append({
                "summary": True,
                "port_number": None,
                "status": "filtered",
                "service": "No responsive ports",
                "product": "",
                "version": "",
                "risk": "None"
            })

        score = calculate_risk_score(ports_data)
        risk_level = get_risk_level(score)
        scan_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

        # 🚀 CALL ML ENGINE FOR ANOMALY DETECTION
        past_scans = db.query(models.Scan).all()
        anomaly_flag, anomaly_desc = detect_anomaly_svm(score, open_ports_count, past_scans, db)

        db_scan = models.Scan(target_ip=target, scan_time=scan_time, risk_score=score, risk_level=risk_level)
        db.add(db_scan)
        db.commit()
        db.refresh(db_scan)

        for p in ports_data:
            db_port = models.Port(scan_id=db_scan.id, port_number=p["port_number"], status=p["status"], service=p["service"], product=p["product"], version=p["version"], risk=p["risk"])
            db.add(db_port)
        db.commit()

        return {
            "id": db_scan.id, "target_ip": target, "scan_time": scan_time, "risk_score": score,
            "risk_level": risk_level, "anomaly_detected": anomaly_flag, "anomaly_description": anomaly_desc, "ports": ports_data
        }
    except Exception as e:
        print(f"Scan failed for target {target}: {e}")
        raise HTTPException(status_code=500, detail="Scan failed. Check the target and Nmap configuration.")
    finally:
        scan_lock.release()

if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("API_PORT", 8000))
    uvicorn.run("main:app", host="127.0.0.1", port=port, reload=True)