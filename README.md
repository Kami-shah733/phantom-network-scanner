# Phantom Network Scanner

Phantom Network Scanner is a full-stack network security dashboard. It scans IPv4 targets with Nmap, reports responsive and filtered TCP ports, calculates a rule-based threat score, and optionally generates Gemini threat reports.

## Project Structure

- `client/`: React + Vite dashboard
- `server/`: FastAPI API, Nmap integration, SQLite persistence, and ML anomaly detection

## Requirements

- Windows, Linux, or macOS
- Python 3.10+
- Node.js 18+
- Nmap installed and available on `PATH`
- Npcap on Windows for Nmap TCP scans

## Local Setup

### 1. Start the API

```powershell
cd server
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
Copy-Item .env.example .env
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

On macOS or Linux, activate the environment with:

```bash
source .venv/bin/activate
```

### 2. Start the dashboard

```powershell
cd client
npm install
Copy-Item .env.example .env
npm run dev
```

Open the Vite URL shown in the terminal, normally `http://localhost:5173`.

The client defaults to `http://localhost:8000` when `VITE_API_URL` is not set. Set `VITE_API_URL` in `client/.env` when the API runs elsewhere.

## Scanning

The default scan checks Nmap's top 20 common TCP ports. It is bounded by a 15-second host timeout and returns both open and filtered port states. The threat score is calculated from open ports and known high-risk services.

The scan types are:

- TCP Connect: `-sT`
- SYN Scan: `-sS`
- Service Detection: `-sV`

To change the default port selection, set `SCAN_PORT_SPEC` in `server/.env`, for example:

```env
SCAN_PORT_SPEC=--top-ports 100
```

## Optional AI Reports

Add a Gemini API key in the dashboard Settings tab, or configure a server-side fallback key in `server/.env`:

```env
GEMINI_API_KEY=your-key
GEMINI_MODEL=gemini-2.0-flash
```

Do not commit `.env` files or API keys.

## API Endpoints

- `GET /`: API health check
- `GET /history`: saved scan history
- `POST /scan`: run a scan
- `GET /generate-report/{scan_id}`: generate an AI report
- `GET /export-csv`: export scan history
- `DELETE /clear-history`: remove saved scan history

## Production Notes

For deployment:

1. Deploy the FastAPI server with a production ASGI command such as `uvicorn main:app --host 0.0.0.0 --port $PORT`.
2. Install Nmap on the server and verify it is available on `PATH`.
3. Set `APP_ENV=production`, `APP_API_TOKEN`, `FRONTEND_URL`, and `ALLOWED_HOSTS` in the server environment.
4. Build the dashboard with `npm run build` and serve the generated `client/dist` directory from a static host.
5. Set `VITE_API_URL` to the deployed API URL before building the client.

## Validation

```powershell
cd client
npm run build
npx eslint src/App.jsx src/components/ScanForm.jsx src/components/PortTable.jsx

cd ..\server
python -m py_compile main.py
```
