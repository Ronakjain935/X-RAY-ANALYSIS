# 🚀 Live Deployment Guide — X-RAY SQUARED

This guide walks you through deploying **X-RAY SQUARED** live to the web using **Render** (for the AI/PyTorch Backend) and **Vercel** (for the Next.js Frontend). Both platforms offer free tiers.

---

## 📋 Architecture Overview

- **Backend (Render / Railway / Hugging Face Spaces)**
  - FastAPI + PyTorch + ResNet18 + Grad-CAM + SQLite
  - Packaged via Docker with CPU-optimized PyTorch
  - Health check endpoint: `/health`
- **Frontend (Vercel)**
  - Next.js 16 + Tailwind CSS + Lucide Icons + React 19
  - Connects to Backend via `NEXT_PUBLIC_API_URL`

---

## Step 1: Deploy Backend to Render (Free Tier)

1. Go to [Render.com](https://render.com) and log in (or sign up with your GitHub account).
2. Click **New +** > **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your repository:  
   `https://github.com/Ronakjain935/X-RAY-ANALYSIS`
4. Configure the Web Service:
   - **Name:** `xray-backend` (or your choice)
   - **Region:** Choose the region closest to you (e.g. Frankfurt, Oregon, Singapore)
   - **Root Directory:** `backend`
   - **Runtime:** `Docker` (Render will automatically detect `backend/Dockerfile`)
   - **Instance Type:** `Free` (or Starter for higher RAM if needed)
5. Under **Environment Variables**, add:
   - `CORS_ORIGINS`: `*` (or your Vercel URL once deployed)
   - `PORT`: `8000`
6. Click **Deploy Web Service**.
7. Wait 3–5 minutes for the build to finish. Once live, Render will give you a public URL like:  
   `https://xray-backend-xxxx.onrender.com`
8. Verify it works by opening in your browser:  
   `https://xray-backend-xxxx.onrender.com/health`  
   You should see: `{"status":"ok","model_available":true}`

---

## Step 2: Deploy Frontend to Vercel (Free Tier)

1. Go to [Vercel.com](https://vercel.com) and log in with your GitHub account.
2. Click **Add New...** > **Project**.
3. Select the repository: `Ronakjain935/X-RAY-ANALYSIS`.
4. Configure Project:
   - **Framework Preset:** `Next.js`
   - **Root Directory:** Click **Edit** and select `frontend`
5. Expand **Environment Variables** and add:
   - **Key:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://xray-backend-xxxx.onrender.com` *(Replace with your Render URL from Step 1, without trailing slash)*
6. Click **Deploy**.
7. Vercel will build and deploy your frontend in ~1-2 minutes.
8. Click the generated live URL (e.g. `https://x-ray-analysis.vercel.app`).
9. The header will display a green **"Live Backend"** badge!

---

## Step 3: (Optional) Alternative — Deploy with Railway

If you prefer Railway instead of Render:
1. Log into [Railway.app](https://railway.app).
2. Click **New Project** > **Deploy from GitHub repo**.
3. Choose `Ronakjain935/X-RAY-ANALYSIS`.
4. In Settings:
   - Set **Root Directory** to `/backend`.
   - Railway will build using `backend/Dockerfile`.
5. Under **Variables**, add:
   - `CORS_ORIGINS`: `*`
6. Under **Networking**, click **Generate Domain**.
7. Use the generated Railway URL as `NEXT_PUBLIC_API_URL` on Vercel.

---

## Step 4: (Optional) Self-Host on a Cloud VPS with Docker Compose

If you have a VPS (AWS EC2, DigitalOcean, Hetzner, Linode):
```bash
git clone https://github.com/Ronakjain935/X-RAY-ANALYSIS.git
cd X-RAY-ANALYSIS
docker compose up -d --build
```
Both frontend (`http://YOUR_SERVER_IP:3000`) and backend (`http://YOUR_SERVER_IP:8000`) will be running and connected!

---

## 🔒 Post-Deployment Checklist

- [ ] `/health` on backend returns `{"status":"ok","model_available":true}`
- [ ] Frontend header shows **Live Backend** badge
- [ ] Uploading a sample X-ray generates real predictions and Grad-CAM heatmap
- [ ] Database persists cases and allows human review
