# ⚡ BARQ — Complete Full-Stack Wellness App

> **Stack**: React Native (Expo) + Node.js + PostgreSQL + Prisma + Socket.IO
> 
> **Platforms**: iOS + Android (cross-platform)

---

## 📁 Project Structure

```
barq/
├── backend/          ← Node.js API server
│   ├── prisma/       ← Database schema + seed
│   └── src/
│       ├── controllers/
│       ├── middleware/
│       ├── routes/
│       ├── services/  ← Scoring algorithms + Socket.IO
│       └── utils/
├── mobile/           ← React Native + Expo app
│   ├── app/
│   │   ├── (tabs)/   ← Main screens
│   │   └── auth/     ← Login + Register
│   └── src/
│       ├── constants/ ← Design tokens
│       ├── hooks/     ← React Query data hooks
│       ├── i18n/      ← EN + AR translations
│       ├── services/  ← Axios API client
│       └── stores/    ← Zustand state
└── docker-compose.yml
```

---

## 🚀 SETUP — Step by Step

### STEP 1: Install Prerequisites

```bash
# Node.js (download from nodejs.org — LTS version)
# Docker Desktop (download from docker.com)
# VS Code (download from code.visualstudio.com)

# After installing Node.js, install global tools:
npm install -g expo-cli eas-cli
```

### STEP 2: Start the Database

```bash
# From the barq/ root folder:
docker-compose up postgres -d

# Verify it's running:
docker ps
# You should see: barq_postgres   Up
```

### STEP 3: Setup Backend

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env
# (Edit .env if needed — defaults work for local dev)

# Generate Prisma client
npm run prisma:generate

# Run database migrations (creates all tables)
npm run prisma:migrate

# Seed with test data
npm run prisma:seed
# ✅ Creates user: ahmed@barq.sa / barq1234

# Start the API server
npm run dev
# ✅ Server running on http://localhost:3000
# ✅ Health check: http://localhost:3000/api/health
```

### STEP 4: Setup Mobile App

```bash
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start
# A QR code will appear in the terminal
```

### STEP 5: Run on Your Phone

**Option A — Expo Go (quickest, no build needed):**
1. Download "Expo Go" from App Store or Play Store
2. Scan the QR code from Step 4
3. App opens on your phone! ✅

**Option B — TestFlight (iOS, real app):**
```bash
# Login to EAS
eas login

# Configure EAS (first time only)
eas build:configure

# Build for iOS
eas build --platform ios --profile preview
# Takes ~20 minutes in the cloud

# Submit to TestFlight
eas submit --platform ios
```

**Option C — Android APK:**
```bash
eas build --platform android --profile preview
# Downloads a .apk file you can install directly
```

---

## 🔑 Test Credentials

```
Email:    ahmed@barq.sa
Password: barq1234
```

---

## 🌐 API Reference

| Method | Endpoint                    | Description          |
|--------|-----------------------------|----------------------|
| POST   | /api/v1/auth/register       | Create account       |
| POST   | /api/v1/auth/login          | Login                |
| POST   | /api/v1/auth/refresh-token  | Refresh JWT          |
| GET    | /api/v1/wellness/today      | Today's dashboard    |
| GET    | /api/v1/wellness/history    | Historical scores    |
| GET    | /api/v1/recovery/latest     | Latest recovery data |
| GET    | /api/v1/sleep/last-night    | Last night's sleep   |
| GET    | /api/v1/activity/today      | Today's activities   |
| POST   | /api/v1/activity/start      | Start activity       |
| PUT    | /api/v1/activity/:id/end    | End activity         |
| GET    | /api/v1/goals               | User goals           |
| GET    | /api/v1/notifications       | Notifications        |

---

## 🧮 Scoring Algorithms

### Wellness Score (0-100)
```
= (Recovery × 0.40) + (Sleep × 0.35) + (Strain/21×100 × 0.25)
```

### Recovery Score (0-100)
```
= HRV_delta×0.40 + RHR_delta×0.25 + SleepScore×0.20 + SpO2×0.10 + Temp×0.05
```

### Strain Score (0-21)
```
Zone weights: Rest=0, Easy=0.3, Aerobic=0.7, Threshold=1.2, Max=2.0
Score = Σ(zone_weight × minutes_in_zone) / 7
```

---

## 🛠 Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Mobile      | React Native + Expo SDK 51        |
| Navigation  | Expo Router + React Navigation    |
| State       | Zustand + React Query             |
| API Client  | Axios (with auto token refresh)   |
| Charts      | React Native SVG                  |
| i18n        | react-i18next (EN + AR + RTL)     |
| Auth        | JWT + Expo SecureStore            |
| Biometrics  | Expo Local Authentication         |
| Backend     | Node.js 20 + Express 4            |
| Database    | PostgreSQL 15 + Prisma ORM        |
| Real-time   | Socket.IO                         |
| Logging     | Winston                           |
| Container   | Docker + docker-compose           |
| Build       | EAS Build (cloud, no Mac needed)  |

---

## 📱 App Screens

| Screen    | Description                              | Data Source          |
|-----------|------------------------------------------|----------------------|
| Today     | Wellness Score + 3 pillars + chart       | /wellness/today      |
| Recovery  | HRV, RHR, SpO2, trend                   | /recovery/latest     |
| Strain    | Live timer, activities, HR zones         | /activity/today      |
| Sleep     | Sleep stages, score, coach tip           | /sleep/last-night    |
| Profile   | Stats, goals, language, logout           | /user + /goals       |

---

## 🔌 Real-time Features (Socket.IO)

```javascript
// Connect from mobile
const socket = io('http://localhost:3000', {
  auth: { token: accessToken }
});

// Stream live HR during activity
socket.emit('activity:heartrate', { bpm: 128, timestamp: Date.now() });

// Band sync
socket.emit('band:sync', { batteryLevel: 87, firmwareVersion: '2.1.4' });
```

---

## 🌍 Language Support

- **English** (LTR)
- **Arabic** (RTL — full right-to-left layout)
- Toggle in Profile screen
- Persists across sessions

---

## 🔐 Security

- JWT Access Token (15min) + Refresh Token (30 days)
- Token rotation on refresh
- Bcrypt password hashing (12 rounds)
- Helmet.js security headers
- Rate limiting: 100 req/min
- Input validation on all endpoints
- Credentials stored in Expo SecureStore (encrypted)

---

## 📞 Support

Ahmed Elnaggar — Digital Delmar / BMS Medical
