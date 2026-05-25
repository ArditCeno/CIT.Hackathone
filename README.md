🛡️ GuardianAI — Sistemi i Zbulimit të Mashtrimit në Kohë Reale

Platformë e fuqizuar me AI për zbulimin dhe parandalimin e mashtrimit bankar — ndërtuar për FiBank Hackathon.

## 🚀 Quick Start

Double-click `start.bat` to launch all three servers, then open http://localhost:5173

## 👤 Demo Accounts

| Username | Password | PIN  | Role  | Description |
|----------|----------|------|-------|-------------|
| admin    | admin123 | 0000 | Admin | Full system view, all users, fraud stats |
| arjola   | user123  | 1234 | User  | Normal user with 2 fraud incidents |
| besnik   | user123  | 5678 | User  | High-balance user with 1 critical fraud |
| erjon    | user123  | 1357 | User  | High-risk user with multiple frauds |
| elona    | user123  | 2468 | User  | Clean user, no fraud history |

## 🎯 Demo Script for Judges

**Scenario 1 — Normal user flow:**
<p align="center">
  <img src="assets/UserScenarioDEMO.gif" alt="User Scenario Demo" width="100%" max-width="800px"/>
</p>
* Login as **elona** / **user123** / PIN **2468**
* See balance and fraud alert badges
* Go to GuardianAI Scanner → click "Normal" → see ALLOW + green gauge

**Scenario 2 — Fraud detection:**

1. On the scanner → click "Account Takeover" → see MFA_CHALLENGE
2. Click "Phishing URL" → see immediate BLOCK
3. Check Security tab → see unread fraud alerts with mark-as-read

**Scenario 3 — Admin view:**
<p align="center">
  <img src="assets/AdminScenarioDEMO.gif" alt="Admin Scenario Demo" width="100%" max-width="800px"/>
</p>
1. Logout → login as `admin` / `admin123` / PIN `0000`
2. See global fraud rate, decision breakdown pie chart
3. See "Users at Risk" table — erjon and arjola highlighted
4. See all events with risk scores


📌 Ç'është GuardianAI?
Problemi: Klientët e FiBank janë të ekspozuar ndaj sulmeve si smishing, phishing, dhe credential theft. Banka nuk disponon një sistem inteligjent për të zbuluar dhe parandaluar këto kërcënime në kohë reale.
Zgjidhja: GuardianAI është një platformë AI që analizon transaksionet dhe sjelljen e klientit në kohë reale, zbulon anomalitë, dhe ndërhyn para se mashtrimi të ndodhë — në përputhje të plotë me GDPR.

🗂️ Struktura e Projektit
CIT.Hackathone/
├── main.py                      # Pika e hyrjes së serverit FastAPI

├── fraud_api.py                 # API kryesore e zbulimit të mashtrimit

├── scoring_engine.py            # Motori hibrid i vlerësimit (Rregulla + ML)

├── train.py                     # Trajnimi i modelit të ML

├── model.joblib                 # Modeli i trajnuar (Isolation Forest)

├── database.py                  # Inicializimi i bazës së të dhënave

├── fraud_synthetic_dataset.csv  # Dataset sintetik për trajnim

├── requirements.txt             # Varësitë e Python

├── assets/                      # Dokumentacioni mediatik (GIFs)
│   ├── AdminScenarioDEMO.gif
│   └── UserScenarioDEMO.gif

├── api/

│   └── endpoints.py             # Endpoint-et e API-t

├── models/

│   ├── behaviour_profile.py     # Profilizimi i sjelljes së klientit

│   ├── fraud_engine.py          # Logjika kryesore e zbulimit

│   └── response_engine.py      # Gjenerimi i përgjigjeve

└── frontend/                   # Ndërfaqja React + Vite
    ├── src/
    |
    ├── index.html
    |
    └── package.json

⚙️ Si Funksionon Motori i Vlerësimit
Sistemi përdor dy shtresa vendimmarrjeje:

┌─────────────────────────────────────────┐
│  SHTRESA 1 — Rregulla Biznesi (O(1))    |
│
│  Nëse zbulohet phishing → BLLOKO        │
└──────────────────┬──────────────────────┘
                   │
                   |
                   të gjitha rregullat kaluan
                   |
┌──────────────────▼──────────────────────┐
│  SHTRESA 2 — Isolation Forest (ML)      │
│  Anomali  → MFA_CHALLENGE               │
│  Normal   → ALLOW                       │
└─────────────────────────────────────────┘

Vendimet e mundshme:
VendimKuptimiALLOWTransaksion normal, lejohetMFA_CHALLENGEAnomali e zbuluar, kërkohet verifikim shtesëBLOCKPhishing/smishing i zbuluar, bllokohet menjëherë

🚀 Si ta Ekzekutosh
Kërkesat

Python 3.10 ose më i ri
Node.js 18 ose më i ri
npm


1️⃣ Backend (FastAPI)
Hap një terminal në dosjen rrënjë të projektit:
bash# Krijo dhe aktivizo ambiente virtuale
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Instalo varësitë
pip install -r requirements.txt

# Trajno modelin (vetëm herën e parë — mund ta kalosh nëse model.joblib ekziston)
python train.py

# Nis serverin
python main.py
Serveri do të jetë i disponueshëm në: http://localhost:8000
Dokumentimi i API-t (Swagger): http://localhost:8000/docs

2️⃣ Frontend (React + Vite)
Hap një terminal të dytë:
bashcd frontend
npm install
npm run dev
Ndërfaqja do të jetë e disponueshme në: http://localhost:5173

📋 Rendi i Nisjes
1. Nis backend-in   →  python main.py
2. Nis frontend-in  →  npm run dev (brenda dosjes /frontend)
3. Hap shfletuesin  →  http://localhost:5173

🔌 Endpoint-et Kryesore të API-t
MetodaRrugaPërshkrimiPOST/api/events/loginRegjistron dhe vlerëson një ngjarje loginPOST/api/events/transactionAnalizon një transaksion në kohë realeGET/api/dashboard/eventsListon të gjitha ngjarjetGET/api/dashboard/statsStatistikat e sistemitGET/api/dashboard/profilesProfilet e sjelljes së klientëveGET/api/dashboard/profile/{client_id}Profili i një klienti specifik

🧪 Testimi
bash# Ekzekuto skenarët e testimit
python test_scenarios.py

🛠️ Teknologjitë e Përdorura
ShtresaTeknologjiBackendFastAPI, Uvicorn, PydanticMachine LearningScikit-learn (Isolation Forest), Joblib, Pandas, NumPyFrontendReact 19, Vite, Tailwind CSS, Chart.jsDatabazaSQLite (nëpërmjet database.py)

🔒 Pajtueshmëria me GDPR
GuardianAI është projektuar me privacy-by-design:

Çdo vendim i marrë nga sistemi ka shpjegim të gjeneruar automatikisht (Neni 22 i GDPR)
Asnjë të dhënë personale nuk ruhet pa qëllim të qartë
Profilizimi i sjelljes bazohet vetëm në metadatë transaksionale, jo në të dhëna identifikuese
