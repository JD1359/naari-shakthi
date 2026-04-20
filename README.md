# Naari Shakthi 🏥

> AI-powered Smart Healthcare & Medicine Dispensary System — recognized and approved by the **Government of Karnataka (KSCST)** and presented at EWIT.

![React](https://img.shields.io/badge/React-61DAFB?style=flat&logo=react&logoColor=black)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express.js-000000?style=flat&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=flat&logo=mongodb&logoColor=white)
![Python](https://img.shields.io/badge/Python-3776AB?style=flat&logo=python&logoColor=white)
![GCP](https://img.shields.io/badge/GCP-4285F4?style=flat&logo=googlecloud&logoColor=white)

> 🏆 **Government Recognized** - Approved by Karnataka State Council for Science and Technology (KSCST) under EWIT                                                     
> 📄 **IEEE Published** - Related research published in IEEE Xplore · IJTRE Vol. II · January 2024

---

## Overview

Naari Shakthi is a full-stack healthcare platform designed to automate medicine dispensing, monitor inventory in real time, and deliver AI-powered health analytics to patients. The system serves three user roles — patients, pharmacists, and administrators — each with a dedicated dashboard and access-controlled API endpoints.

The platform was built to solve a real problem in under-resourced healthcare settings: manual medicine dispensing is slow, error-prone, and lacks real-time inventory visibility. Naari Shakthi automates the entire workflow from health assessment to dispensing notification.

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│              React Frontend (3 Dashboards)           │
│        Patient · Pharmacist · Administrator          │
└──────────────────────┬──────────────────────────────┘
                       │ REST API (JWT Auth)
┌──────────────────────▼──────────────────────────────┐
│           Node.js / Express Backend                  │
│   Role-based Middleware · Rate Limiting · Validation │
│                                                      │
│   ┌──────────────────┐   ┌────────────────────────┐ │
│   │  Python ML API   │   │   Notification Service │ │
│   │  Health Analytics│   │   SMS + Email Alerts   │ │
│   │  Recommendations │   │   (Inventory & Maint.) │ │
│   └──────────────────┘   └────────────────────────┘ │
└──────────────────────┬──────────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────────┐
│                  MongoDB Atlas                        │
│   Users · Inventory · Sensor Data · Audit Logs      │
└─────────────────────────────────────────────────────┘
```

---

## Key Features

### 🤖 AI Health Analytics
- Python ML models integrated via RESTful API endpoints
- Personalized medicine recommendations based on patient input
- Health risk scoring with explainable outputs
- Models trained on anonymized clinical datasets

### 📦 Real-Time Inventory Management
- Live inventory tracking for medicine stock levels
- Automated low-stock detection with threshold alerts
- SMS and email notifications to pharmacists when restocking is needed
- Reduced manual oversight by **~70%** in pilot testing

### 👥 Role-Based Access Control
- **Patient:** Health input, recommendations, appointment history
- **Pharmacist:** Inventory dashboard, dispensing logs, alert management
- **Administrator:** Full system control, user management, audit trails
- JWT authentication with role-specific middleware on every API route

### 🔔 Automated Alert System
- Real-time SMS alerts via Twilio integration
- Email notifications for critical inventory events
- Maintenance schedule reminders for dispensing hardware
- Event logging for compliance and audit purposes

### 🔒 Security
- JWT access tokens with expiry and refresh flow
- Input validation and sanitization on all endpoints
- Rate limiting to prevent API abuse
- Secure password hashing (bcrypt)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, HTML5, CSS3 |
| Backend | Node.js, Express.js |
| ML API | Python, scikit-learn, Flask |
| Database | MongoDB Atlas |
| Auth | JWT (JSON Web Tokens) |
| Notifications | SMS (Twilio), Email (Nodemailer) |
| Cloud | Google Cloud Platform (GCP) |
| Version Control | Git |

---

## Project Structure

```
naari-shakthi/
├── client/                        # React frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── PatientDashboard.jsx
│   │   │   ├── PharmacistDashboard.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── components/
│   │   │   ├── HealthForm.jsx
│   │   │   ├── InventoryTable.jsx
│   │   │   └── AlertPanel.jsx
│   │   └── App.jsx
├── server/                        # Node.js backend
│   ├── routes/
│   │   ├── auth.js                # Login, register, refresh token
│   │   ├── health.js              # ML API proxy routes
│   │   ├── inventory.js           # Stock management endpoints
│   │   └── notifications.js       # Alert trigger endpoints
│   ├── middleware/
│   │   ├── authMiddleware.js      # JWT verification
│   │   └── roleMiddleware.js      # RBAC enforcement
│   ├── models/
│   │   ├── User.js                # Patient/Pharmacist/Admin schema
│   │   ├── Inventory.js           # Medicine stock schema
│   │   └── AuditLog.js            # System event logging
│   └── index.js
├── ml-service/                    # Python Flask ML API
│   ├── model.py                   # Trained health recommendation model
│   ├── predict.py                 # Prediction endpoint logic
│   ├── train.py                   # Model training script
│   └── app.py                     # Flask server entry point
└── README.md
```

---

## Setup & Run

### Prerequisites
- Node.js 18+
- Python 3.9+
- MongoDB Atlas account (free tier)

### 1. Clone the repository
```bash
git clone https://github.com/JD1359/naari-shakthi.git
cd naari-shakthi
```

### 2. Start the ML service
```bash
cd ml-service
pip install -r requirements.txt
python app.py
# Runs on http://localhost:5001
```

### 3. Start the backend
```bash
cd server
npm install
cp .env.example .env
# Add: MONGODB_URI, JWT_SECRET, TWILIO keys
npm run dev
# Runs on http://localhost:5000
```

### 4. Start the frontend
```bash
cd client
npm install
npm start
# Runs on http://localhost:3000
```

---

## Recognition & Publication

**Government Recognition**
This project was reviewed, recognized, and approved by the **Karnataka State Council for Science and Technology (KSCST)** under the Engineering and Women in Technology (EWIT) initiative — validating its real-world applicability in healthcare settings.

**IEEE Publication**
The underlying hardware system — *"Smart Sanitary Pad and Medicine Vending Machine with Automated Dispensing, Disposal, and Notification System"* — was published in **IEEE Xplore Digital Library** via the International Journal For Technological Research In Engineering (IJTRE), Volume II, January 2024. ISSN: 2347–4718.

---

## Impact Metrics (Pilot Testing)

| Metric | Result |
|---|---|
| Manual oversight reduction | ~70% |
| Inventory alert response time | < 2 minutes (vs. hours manually) |
| Health recommendation accuracy | Validated against clinical guidelines |
| System uptime during pilot | 99.2% |

---

## Future Improvements

- [ ] IoT sensor integration for real-time hardware monitoring
- [ ] Mobile app (React Native) for patient-facing features
- [ ] Predictive inventory forecasting using time-series ML
- [ ] Multi-language support for regional accessibility (Kannada, Hindi)
- [ ] HIPAA-compliant data handling for U.S. deployment

---

## Author

**Jayadeep Gopinath**
M.S. Computer Science · Illinois Institute of Technology, Chicago
IEEE Published Researcher · KSCST Recognized Project Lead
[LinkedIn](https://linkedin.com/in/jayadeep-g-05b643257) · jg@hawk.illinoistech.edu
