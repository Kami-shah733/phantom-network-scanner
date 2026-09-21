# Phantom Network Scanner

## LinkedIn Project Brief

I built **Phantom Network Scanner**, a full-stack network security dashboard that combines Nmap scanning, rule-based threat scoring, port analysis, machine-learning anomaly detection, and optional AI-generated security reports.

The project is designed to make network scanning results easier to understand. Instead of showing raw scanner output only, it presents target details, risk levels, threat scores, open and filtered ports, detected services, service versions, and historical scan data through a focused web dashboard.

## Key Features

- IPv4 target validation
- TCP Connect, SYN, and service-detection scan modes
- Nmap-based port scanning
- Open and filtered port analysis
- Rule-based threat score from 0 to 100
- Risk levels: Low, Medium, and High
- Risk classification for sensitive services and ports
- Service and version detection
- SVM-based anomaly detection using historical scans
- Scan history stored with SQLite
- CSV export for scan history
- Optional Gemini AI threat intelligence reports
- Responsive React dashboard
- API access controls, CORS configuration, trusted-host protection, and rate limiting

## Technology Stack

- **Frontend:** React, Vite, Axios, Tailwind CSS
- **Backend:** Python, FastAPI, Uvicorn
- **Security Scanner:** Nmap and python-nmap
- **Database:** SQLite and SQLAlchemy
- **Machine Learning:** NumPy and scikit-learn One-Class SVM
- **AI Reporting:** Google Gemini API
- **Deployment:** Vercel frontend with a FastAPI backend exposed through a temporary HTTPS tunnel for free hosting

## Project Outcome

This project helped me connect frontend development with backend APIs, cybersecurity tooling, data persistence, machine-learning analysis, deployment configuration, and secure environment-variable management.

The main lesson was that useful security tooling is not only about running a scan. It is also about presenting the result clearly, explaining filtered or unavailable ports, calculating understandable risk levels, and protecting the API from unsafe public access.

## Live Demo

Frontend: https://client-liard-two-32.vercel.app

Source code: https://github.com/Kami-shah733/phantom-network-scanner

> Note: The frontend is permanently hosted on Vercel. The free backend tunnel runs from the development computer and must be active for live scanning to work.

## LinkedIn Post

I am excited to share **Phantom Network Scanner**, a full-stack network security dashboard I built to make Nmap scan results easier to understand and act on.

The application scans IPv4 targets, analyzes open and filtered TCP ports, detects running services, calculates a threat score from 0 to 100, assigns risk levels, and stores scan history for comparison. I also added SVM-based anomaly detection and optional Gemini-powered threat intelligence reports.

The project combines React, Vite, FastAPI, Python, Nmap, SQLite, SQLAlchemy, scikit-learn, and Google Gemini. Building it gave me practical experience connecting cybersecurity tools with modern web development, API design, data persistence, machine learning, deployment, and security controls.

A particularly important part of the project was making the results understandable. The dashboard explains port states, displays risk per service, and clearly distinguishes between no open ports and ports that are filtered or not responsive.

Live demo: https://client-liard-two-32.vercel.app
Source code: https://github.com/Kami-shah733/phantom-network-scanner

I built this project for educational and authorized security-testing purposes only.

#Cybersecurity #NetworkSecurity #Python #FastAPI #React #Nmap #MachineLearning #FullStackDevelopment #WebDevelopment #PortfolioProject
