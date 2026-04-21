# 🚀 ClinicOS — Complete Deployment Guide

> **Backend → Render** (free plan) | **Frontend → Netlify** (free plan) | **Database → Aiven MySQL** (free plan)  
> Estimated time: ~45 minutes. No prior cloud experience needed.

---

## Overview — What You Will Set Up

```
[Netlify] React Frontend  ──► (HTTPS API calls) ──► [Render] Node.js Backend
                                                           │
                                                           ▼
                                                  [Aiven] MySQL Database
```

---

## PART 1 — Database on Aiven (Free MySQL Cloud)

Aiven gives you a free hosted MySQL database — no credit card required.

### Step 1 — Create Your Database

1. Go to **[https://aiven.io](https://aiven.io)** and click **"Start Free"**.
2. Sign up with your Google account.
3. Click **"Create Service"** → Select **MySQL**.
4. Choose the **Free plan** (it will say "Hobbyist" or "Free").
5. Pick a region close to you (e.g., `ap-south-1` for India).
6. Name your service: `clinicos-db` → Click **"Create Service"**.
7. Wait ~2 minutes for it to spin up. Status will change to **"Running"** ✅.

### Step 2 — Get Your Database Credentials

1. Click on your `clinicos-db` service.
2. Go to the **"Connection"** tab (or "Overview").
3. You will see a **Connection Information** panel. Note down these values:

   | ClinicOS Variable | Aiven Field Name |
   |---|---|
   | `DB_HOST` | Host |
   | `DB_PORT` | Port |
   | `DB_USER` | User |
   | `DB_PASSWORD` | Password |
   | `DB_NAME` | Database name (usually `defaultdb`) |

4. Also **download the CA Certificate**: scroll down, click **"Download CA cert"** → save as `ca.pem`. You will need this in Step 5.

> ⚠️ **Store these credentials safely.** You will use them as environment variables on Render.

### Step 3 — Enable SSL in Your Backend Config

Aiven MySQL requires SSL. Open `clinicOS-Backend/src/config/database.js` and update it:

```js
const { Sequelize } = require('sequelize')
const fs = require('fs')
const path = require('path')
require('dotenv').config()

const sslOptions = process.env.DB_SSL === 'true'
  ? { ca: process.env.DB_CA_CERT }  // Render will supply this as an env var
  : false

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host:    process.env.DB_HOST,
    port:    process.env.DB_PORT,
    dialect: 'mysql',
    logging: false,
    dialectOptions: sslOptions ? { ssl: sslOptions } : {},
    pool: { max: 10, min: 0, acquire: 30000, idle: 10000 },
  }
)

module.exports = sequelize
```

> The Sequelize `sync()` call in `server.js` will automatically create all tables on first boot — you do NOT need to run any SQL manually. ✅

---

## PART 2 — Backend on Render

### Step 4 — Push Your Code to GitHub

If not already done:

```bash
# In the project root
git init
git add .
git commit -m "Initial commit"
```

Then go to **[https://github.com/new](https://github.com/new)** and create a new **private** repository called `clinicos`. Then:

```bash
git remote add origin https://github.com/YOUR_USERNAME/clinicos.git
git push -u origin main
```

### Step 5 — Deploy Backend on Render

1. Go to **[https://render.com](https://render.com)** and sign up (use GitHub login — it's easiest).
2. Click **"New +"** → **"Web Service"**.
3. Click **"Connect a repository"** → select your `clinicos` repo.
4. Configure the service:

   | Setting | Value |
   |---|---|
   | **Name** | `clinicos-api` |
   | **Root Directory** | `clinicOS-Backend` |
   | **Environment** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `node server.js` |
   | **Plan** | Free |

5. Click **"Advanced"** and add Environment Variables one by one:  
   (Click "Add Environment Variable" for each row below)

   | Key | Value |
   |---|---|
   | `NODE_ENV` | `production` |
   | `PORT` | `5000` |
   | `CLIENT_URL` | *(Leave blank for now — fill in after Netlify deploy)* |
   | `DB_HOST` | *(From Aiven Step 2)* |
   | `DB_PORT` | *(From Aiven Step 2)* |
   | `DB_USER` | *(From Aiven Step 2)* |
   | `DB_PASSWORD` | *(From Aiven Step 2)* |
   | `DB_NAME` | `defaultdb` |
   | `DB_SSL` | `true` |
   | `DB_CA_CERT` | *(Open the `ca.pem` file you downloaded, copy ALL the text including `-----BEGIN CERTIFICATE-----` and paste it here)* |
   | `JWT_SECRET` | *(Any long random string — e.g., `mySuperSecretKey2025!@#`)* |
   | `RAZORPAY_KEY_ID` | *(Your Razorpay test key)* |
   | `RAZORPAY_KEY_SECRET` | *(Your Razorpay secret)* |
   | `MAIL_HOST` | `smtp.gmail.com` |
   | `MAIL_PORT` | `587` |
   | `MAIL_USER` | *(Your Gmail address)* |
   | `MAIL_PASS` | *(Your Gmail App Password — see note below)* |
   | `MAIL_FROM` | `ClinicOS <your@gmail.com>` |
   | `WHATSAPP_API_KEY` | *(Your Meta WhatsApp token)* |
   | `WHATSAPP_PHONE_ID` | *(Your Meta WhatsApp phone ID)* |

6. Click **"Create Web Service"**.
7. Render will build and deploy. Watch the logs — when you see `✅ Server running` it is live.
8. **Copy your backend URL** — it looks like `https://clinicos-api.onrender.com`. You will need this next.

> 📧 **Gmail App Password**: Go to your Google Account → Security → 2-Step Verification → App Passwords → Generate one for "Mail". Use that 16-character password as `MAIL_PASS`.

---

## PART 3 — Frontend on Netlify

### Step 6 — Update the Frontend API Base URL

Open `clinicOS-Frontend/src/services/api.js` and change line 4 from the hardcoded localhost to an environment variable:

```js
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
})
```

Also update the Socket.IO connection in `clinicOS-Frontend/src/hooks/useSocket.js` — change line 32 from:
```js
socketInstance = io('http://localhost:5000', {
```
to:
```js
socketInstance = io(import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000', {
```

Commit and push these changes:
```bash
git add .
git commit -m "Use env vars for API URL"
git push
```

### Step 7 — Deploy Frontend on Netlify

1. Go to **[https://www.netlify.com](https://www.netlify.com)** and sign up (use GitHub login).
2. Click **"Add new site"** → **"Import an existing project"**.
3. Click **"GitHub"** → Select your `clinicos` repository.
4. Configure the build:

   | Setting | Value |
   |---|---|
   | **Base directory** | `clinicOS-Frontend` |
   | **Build command** | `npm run build` |
   | **Publish directory** | `clinicOS-Frontend/dist` |

5. Click **"Show advanced"** → **"New variable"** and add:

   | Key | Value |
   |---|---|
   | `VITE_API_URL` | `https://clinicos-api.onrender.com/api` *(your Render URL + /api)* |
   | `VITE_RAZORPAY_KEY_ID` | *(Your Razorpay publishable key)* |

6. Click **"Deploy site"**.
7. Wait ~2 minutes. Copy your Netlify URL (e.g., `https://clinicos.netlify.app`).

---

## PART 4 — Wire Everything Together

### Step 8 — Update Render's CLIENT_URL

1. Go back to [Render](https://render.com) → Your `clinicos-api` service.
2. Click **"Environment"** in the sidebar.
3. Find `CLIENT_URL` and set its value to your Netlify URL: `https://clinicos.netlify.app`
4. Click **"Save Changes"** — Render will automatically redeploy. ✅

### Step 9 — Update Razorpay Allowed Origins (if using payments)

1. Log in to [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Go to **Settings → API Keys → Allowed Origins**.
3. Add your Netlify URL: `https://clinicos.netlify.app`.

---

## PART 5 — Verify Everything Works

### Step 10 — Health Check

Open your browser and visit:

```
https://clinicos-api.onrender.com/api/health
```

You should see:
```json
{ "success": true, "data": { "status": "ok" } }
```

If yes — your backend and database are connected. ✅

### Step 11 — Test the Full App

1. Visit your Netlify URL: `https://clinicos.netlify.app`
2. The app should load the login page.
3. Try registering as an Admin (first user creates a clinic).
4. Log in and test creating a token — the Socket.IO live queue should update in real time.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| Render shows `❌ MySQL connected failed` | Double-check `DB_HOST`, `DB_PASSWORD`, and that `DB_SSL=true` are correctly set |
| `CA cert error` on Render | Make sure you pasted the entire contents of `ca.pem` including the header and footer lines |
| Netlify shows a blank white page | Make sure `netlify.toml` is present in `clinicOS-Frontend/` (already added for you ✅) |
| API calls fail with CORS error | Make sure `CLIENT_URL` on Render exactly matches your Netlify URL (no trailing slash) |
| Socket.IO doesn't connect | Render's free plan spins down after 15 min of inactivity — first request after sleep takes ~30s |
| Emails not sending | Ensure you used a Gmail **App Password** (not your regular Gmail password) |
| Razorpay payment fails | Make sure you added your Netlify URL to Razorpay's allowed origins |

---

## Important Notes on Free Plan Limits

| Service | Free Tier Limit |
|---|---|
| **Render** | Spins down after 15 min inactivity (cold start ~30s) |
| **Aiven MySQL** | 5 GB storage, 1 CPU, connection limit applies |
| **Netlify** | 100 GB bandwidth/month, unlimited builds |

> 💡 To prevent Render cold starts during demos, you can use [UptimeRobot](https://uptimerobot.com) (free) to ping `/api/health` every 14 minutes.

---

## Quick Reference — All URLs

Once deployed, fill this in and save it:

```
Backend API:  https://_______.onrender.com
Frontend App: https://_______.netlify.app
Database:     Aiven → clinicos-db (MySQL)
```
