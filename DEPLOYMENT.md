# NexusFlow Deployment Guide

Complete guide to deploy NexusFlow to production using Render (backend services) and Vercel (frontend).

## Quick Start (TL;DR)

```bash
# 1. Push to GitHub
git add .
git commit -m "Deploy to production"
git push origin main

# 2. Deploy Backend & Engine to Render
# Go to render.com → New → Blueprint → Connect repo
# Render auto-detects render.yaml and deploys both services

# 3. Deploy Frontend to Vercel  
# Go to vercel.com → Add New → Import repo
# Set root directory to "frontend"
# Add environment variables (see below)
```

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│     Backend     │────▶│     Engine      │
│    (Vercel)     │     │    (Render)     │     │    (Render)     │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                                                        ▼
                                                ┌─────────────────┐
                                                │     Signer      │
                                                │    (Render)     │
                                                └─────────────────┘
```

| Service | Platform | Purpose |
|---------|----------|---------|
| Frontend | Vercel | React UI - Workflow builder |
| Backend | Render | Express API - Workflow management |
| Engine | Render | TypeScript - Workflow execution |
| Signer | Render | Transaction signing service |

---

## Prerequisites

- GitHub account with repo pushed
- [Render](https://render.com) account (free tier works)
- [Vercel](https://vercel.com) account (free tier works)
- Environment variables ready (API keys, private keys)

---

## Step 1: Deploy Backend to Render

### 1.1 Create Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click **New +** → **Web Service**
3. Connect your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `nexusflow-backend` |
| **Root Directory** | `backend` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node server.js` |
| **Instance Type** | Free (or Starter for production) |

### 1.2 Environment Variables

Add these in the **Environment** tab:

```env
NODE_ENV=production
PORT=8080
OPENAI_API_KEY=sk-your-openai-key
GEMINI_API_KEY=your-gemini-key
CORS_ORIGIN=https://your-frontend.vercel.app
```

### 1.3 Deploy

Click **Create Web Service** and wait for deployment.

**Note your URL:** `https://nexusflow-backend.onrender.com`

---

## Step 2: Deploy Engine to Render

### 2.1 Create Web Service

1. Click **New +** → **Web Service**
2. Connect same GitHub repository
3. Configure:

| Setting | Value |
|---------|-------|
| **Name** | `nexusflow-engine` |
| **Root Directory** | *(leave empty - repo root)* |
| **Runtime** | `Node` |
| **Build Command** | `cd sdk/nip1-sdk && npm install && npm run build && cd ../../engine && npm install && npm run build` |
| **Start Command** | `npm start --prefix engine` |
| **Instance Type** | Free (or Starter for production) |

### 2.2 Environment Variables

```env
NODE_ENV=production
PORT=8080
DEMO_MODE=true
RPC_URL=https://testnet.zkevm.cronos.org
CHAIN_ID=240
PRIVATE_KEY=your-wallet-private-key
BACKEND_URL=https://nexusflow-backend.onrender.com
```

### 2.3 Deploy

Click **Create Web Service**.

**Note your URL:** `https://nexusflow-engine.onrender.com`

---

## Step 3: Deploy Signer to Render (Optional)

Only needed if using separate signing service.

### 3.1 Create Web Service

| Setting | Value |
|---------|-------|
| **Name** | `nexusflow-signer` |
| **Root Directory** | `signer` |
| **Runtime** | `Node` |
| **Build Command** | `npm install` |
| **Start Command** | `node index.js` |

### 3.2 Environment Variables

```env
NODE_ENV=production
PORT=8080
PRIVATE_KEY=your-wallet-private-key
RPC_URL=https://testnet.zkevm.cronos.org
```

---

## Step 4: Deploy Frontend to Vercel

### 4.1 Import Project

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click **Add New** → **Project**
3. Import your GitHub repository
4. Configure:

| Setting | Value |
|---------|-------|
| **Framework Preset** | Vite |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` |
| **Output Directory** | `dist` |

### 4.2 Environment Variables

Add in **Settings** → **Environment Variables**:

```env
VITE_API_URL=https://nexusflow-backend.onrender.com
VITE_ENGINE_URL=https://nexusflow-engine.onrender.com
VITE_RPC_URL=https://testnet.zkevm.cronos.org
VITE_CHAIN_ID=240
VITE_DELEGATE_CONTRACT_ADDRESS=0x78E566E5B7b10c8c93d622382d6a27d960A3D76A
```

### 4.3 Deploy

Click **Deploy** and wait for build.

**Your app URL:** `https://nexusflow.vercel.app`

---

## Step 5: Update CORS & URLs

### Backend - Update CORS

In `backend/server.js`, ensure CORS allows your Vercel domain:

```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'https://nexusflow.vercel.app',
    'https://your-custom-domain.com'
  ]
}));
```

### Frontend - Verify URLs

Create `frontend/.env.production`:

```env
VITE_API_URL=https://nexusflow-backend.onrender.com
VITE_ENGINE_URL=https://nexusflow-engine.onrender.com
VITE_RPC_URL=https://testnet.zkevm.cronos.org
VITE_CHAIN_ID=240
```

---

## Alternative: Blueprint Deployment

Use the `render.yaml` file for one-click deployment:

1. Push `render.yaml` to your repo
2. Go to Render → **New** → **Blueprint**
3. Connect repository
4. Render auto-detects services
5. Fill in secret environment variables
6. Deploy all services at once

---

## Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `production` |
| `OPENAI_API_KEY` | OpenAI API key | `sk-...` |
| `GEMINI_API_KEY` | Google Gemini key | `AI...` |
| `CORS_ORIGIN` | Allowed origins | `https://app.vercel.app` |

### Engine (`engine/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `8080` |
| `NODE_ENV` | Environment | `production` |
| `DEMO_MODE` | Auto-approve trades | `true` |
| `RPC_URL` | Blockchain RPC | `https://testnet.zkevm.cronos.org` |
| `CHAIN_ID` | Chain ID | `240` |
| `PRIVATE_KEY` | Wallet private key | `0x...` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend URL | `https://backend.onrender.com` |
| `VITE_ENGINE_URL` | Engine URL | `https://engine.onrender.com` |
| `VITE_RPC_URL` | Blockchain RPC | `https://testnet.zkevm.cronos.org` |
| `VITE_CHAIN_ID` | Chain ID | `240` |

---

## Troubleshooting

### Build Fails on Render

**SDK not found:**
```
Error: Cannot find module '@nexus-ecosystem/nip1'
```
**Fix:** Ensure build command includes SDK build:
```bash
cd sdk/nip1-sdk && npm install && npm run build && cd ../../engine && npm install && npm run build
```

### CORS Errors

**Error:** `Access-Control-Allow-Origin` missing

**Fix:** Add your Vercel domain to backend CORS config.

### Engine Connection Failed

**Error:** Frontend can't reach engine

**Fix:** 
1. Check engine is running on Render
2. Verify `VITE_ENGINE_URL` in frontend env vars
3. Check Render logs for errors

### Cold Start Delays

Free tier services sleep after 15 min inactivity.

**Fix:** 
- Upgrade to Starter tier ($7/mo)
- Or use a cron job to ping services every 10 min

---

## Production Checklist

- [ ] All services deployed and running
- [ ] Environment variables set correctly
- [ ] CORS configured for frontend domain
- [ ] Frontend pointing to correct backend/engine URLs
- [ ] Wallet private key secured (use Render secrets)
- [ ] API keys secured (use Render secrets)
- [ ] Custom domain configured (optional)
- [ ] SSL enabled (automatic on Render/Vercel)

---

## Useful Commands

```bash
# Check service logs on Render
# Go to Dashboard → Service → Logs

# Redeploy after code changes
git push origin main
# Render auto-deploys on push

# Manual deploy trigger
# Dashboard → Service → Manual Deploy → Deploy latest commit

# Check frontend build locally
cd frontend && npm run build && npm run preview
```

---

## Cost Estimate (Free Tier)

| Service | Platform | Cost |
|---------|----------|------|
| Frontend | Vercel | Free |
| Backend | Render | Free |
| Engine | Render | Free |
| Signer | Render | Free |
| **Total** | | **$0/month** |

*Note: Free tier has cold starts and limited hours. Upgrade to Starter ($7/service/month) for production.*
