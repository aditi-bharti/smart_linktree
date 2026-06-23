# Fix Vercel PyJWT Error

## Problem
Vercel is caching old requirements with PyJWT==2.8.1

## Solution Applied

1. ✅ Added `runtime.txt` - Specifies Python 3.11
2. ✅ Updated `vercel.json` - Custom build command to force clean install
3. ✅ Verified `requirements.txt` - Has correct PyJWT==2.8.0

## Push and Redeploy

### Step 1: Push Changes
```bash
git push https://YOUR_TOKEN@github.com/codecraftersmca-hash/smart-linktree.git main
```

### Step 2: Clear Vercel Cache

**Option A: Via Vercel Dashboard**
1. Go to https://vercel.com/dashboard
2. Click on your project
3. Go to Settings → General
4. Scroll to "Build & Development Settings"
5. Click "Clear Cache"
6. Go back to Deployments
7. Click "Redeploy" on latest deployment

**Option B: Via CLI**
```bash
vercel --force
```

**Option C: Delete and Redeploy**
1. Go to Vercel Dashboard
2. Settings → General
3. Scroll to bottom
4. Click "Delete Project"
5. Re-import from GitHub
6. Deploy fresh

## Alternative: Use Render.com Instead

Since Vercel has these issues and doesn't support:
- ❌ WebSockets (your real-time analytics)
- ❌ Persistent storage (your JSON database)
- ❌ Long-running processes

**I strongly recommend Render.com:**

### Deploy to Render (5 minutes):

1. Go to https://render.com
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your repository: `codecraftersmca-hash/smart-linktree`
5. Configure:
   - **Name:** smart-linktree
   - **Environment:** Python 3
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
6. Click "Create Web Service"
7. Wait 2-3 minutes
8. Done! ✅

### Why Render is Better:

| Feature | Vercel | Render |
|---------|--------|--------|
| WebSockets | ❌ No | ✅ Yes |
| File Storage | ❌ Temporary | ✅ Persistent |
| Build Issues | ⚠️ Cache problems | ✅ Clean builds |
| Setup | Complex | Simple |
| Your App | ⚠️ Limited | ✅ Full support |

## Quick Decision

**If you want full features (WebSockets, database):**
→ Use Render.com

**If you just want to test deployment:**
→ Clear Vercel cache and redeploy

## Commands Summary

```bash
# Push changes
git push https://YOUR_TOKEN@github.com/codecraftersmca-hash/smart-linktree.git main

# Force redeploy on Vercel
vercel --force

# OR deploy to Render
# Just go to render.com and import your repo
```

---

**My recommendation:** Switch to Render.com for hassle-free deployment with full feature support.
