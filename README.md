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

## Deployment Status

The current free deployment uses two parts:

- Frontend: Vercel at `https://client-liard-two-32.vercel.app`
- Backend: FastAPI running locally and exposed through a temporary `localhost.run` HTTPS tunnel

The frontend is permanently hosted by Vercel, but the backend is only available while the local computer, API process, and tunnel process are running. The tunnel URL can change after a restart.

## Free Deployment Runbook

### Start the backend after powering on the computer

Open PowerShell terminal 1 from the repository root:

```powershell
cd C:\Users\PCP\Desktop\phantom-network-scanner-master\server
.\.venv\Scripts\Activate.ps1
$env:ALLOWED_HOSTS="*"
$env:FRONTEND_URL="https://client-liard-two-32.vercel.app"
python -m uvicorn main:app --host 127.0.0.1 --port 8001
```

Keep this terminal open. It runs the FastAPI backend and Nmap scanner.

Open PowerShell terminal 2:

```powershell
ssh -o StrictHostKeyChecking=no -o ServerAliveInterval=30 -R 80:127.0.0.1:8001 nokey@localhost.run
```

Keep this terminal open. It prints a public URL similar to:

```text
https://random-name.lhr.life
```

Test the tunnel before using it:

```powershell
curl.exe https://random-name.lhr.life/
```

The response should be:

```json
{"message":"PHANTOM API Base is Online!"}
```

### Connect a new tunnel URL to Vercel

The frontend stores the backend URL at build time. If the tunnel URL changes, update the Vercel production variable and redeploy:

```powershell
cd C:\Users\PCP\Desktop\phantom-network-scanner-master\client
npx vercel env rm VITE_API_URL production --yes
"https://NEW-TUNNEL-URL.lhr.life" | npx vercel env add VITE_API_URL production
npx vercel --prod --yes
```

After deployment, open `https://client-liard-two-32.vercel.app` and refresh the page.

### Stop the backend and tunnel

Press `Ctrl+C` in the tunnel terminal first, then press `Ctrl+C` in the backend terminal. Closing the terminals or shutting down the computer has the same effect.

### What happens after shutdown

- The Vercel frontend remains online.
- The backend stops.
- The tunnel stops.
- History and scanning fail until both processes are started again.
- A new tunnel usually gets a new URL, so update Vercel again before scanning.

## Environment Variables

The configuration blocks below are examples only. They do not contain real credentials. Create local `.env` files from the provided `.env.example` files, and replace placeholder values locally.

### Client: `client/.env`

```env
VITE_API_URL=https://your-backend-url
VITE_API_TOKEN=optional-server-token
```

`VITE_*` values are embedded in the browser bundle. Never put private secrets in them.

### Server: `server/.env`

```env
APP_ENV=development
API_PORT=8000
FRONTEND_URL=http://localhost:5173
ALLOWED_HOSTS=localhost,127.0.0.1
APP_API_TOKEN=
SCAN_PORT_SPEC=--top-ports 20
GEMINI_MODEL=gemini-2.0-flash
GEMINI_API_KEY=
```

For the temporary public tunnel, set `ALLOWED_HOSTS=*` and set `FRONTEND_URL` to the Vercel URL in the terminal before starting Uvicorn. Do not commit `.env` files, API tokens, Gemini keys, or the local SQLite database.

## Permanent Hosting Options

The local tunnel is free but temporary. For a backend that runs without your computer, use a host that supports Docker, Python, and Nmap:

- Render: free web service with card verification; `render.yaml` and `server/Dockerfile` are included.
- Railway: requires an active paid plan for this account.
- Hugging Face Spaces: free Spaces are static; Docker compute requires a paid plan.
- Vercel: suitable for this React frontend, but not for the long-running Nmap backend.

For Render, create a Blueprint from this repository and use the root `render.yaml`. Configure `FRONTEND_URL`, `ALLOWED_HOSTS`, `APP_API_TOKEN`, and optional `GEMINI_API_KEY`. After Render provides an API URL, set it as Vercel's `VITE_API_URL` and redeploy the frontend. Do not use `ALLOWED_HOSTS=*` for a permanent public production service; use the exact API hostname instead.

## Security Precautions

- Only scan hosts you own or have permission to test.
- Do not expose the backend without authentication in a permanent deployment.
- Use `APP_API_TOKEN` and configure the same value as the client `VITE_API_TOKEN` when required.
- Do not share `.env`, `.env.local`, API keys, or database files.
- The temporary tunnel URL is public while it is running.
- Anyone who can reach an unauthenticated scan endpoint may be able to use your computer to send scans.
- Keep Nmap and Npcap updated.

## Validation

```powershell
cd client
npm run build
npx eslint src/App.jsx src/components/ScanForm.jsx src/components/PortTable.jsx

cd ..\server
python -m py_compile main.py
```
