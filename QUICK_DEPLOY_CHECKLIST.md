# Quick Deployment Checklist

## Pre-Deployment

### Backend Preparation
- [ ] Run `npm install` to get latest dependencies
- [ ] Create `.env` file with all required variables
- [ ] Test locally: `npm run dev`
- [ ] Check `.gitignore` includes `.env`
- [ ] Build locally: `npm run build`
- [ ] Verify no build errors

### Frontend Preparation
- [ ] Run `npm install`
- [ ] Create `.env.local` with API URL
- [ ] Test locally: `npm run dev`
- [ ] Build locally: `npm run build`
- [ ] Verify no build errors
- [ ] Check console for warnings

### Database Setup
- [ ] MongoDB Atlas account created
- [ ] Free cluster (M0) created
- [ ] Database user created
- [ ] Connection string obtained
- [ ] IP whitelist configured (0.0.0.0/0 for dev, specific IPs for prod)

### Accounts Ready
- [ ] Render.com account (GitHub connected)
- [ ] Vercel account (GitHub connected)
- [ ] MongoDB Atlas account

---

## Backend Deployment (Render)

### Step 1: Create Web Service
- [ ] Log in to Render dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Select repository and connect
- [ ] Set service name: `trans-mcq-backend`

### Step 2: Configure Build Settings
- [ ] Root directory: (leave empty for full repo)
- [ ] Build command: `cd trans_mcq_back && npm install && npm run build`
- [ ] Start command: `node dist/server.js`
- [ ] Plan: Free (testing) or Starter ($7/mo for production)

### Step 3: Environment Variables
- [ ] MONGODB_URI: (from MongoDB Atlas)
- [ ] NODE_ENV: `production`
- [ ] ALLOWED_ORIGINS: `https://your-frontend-url`
- [ ] LOG_LEVEL: `info`
- [ ] Save and deploy

### Step 4: Wait & Verify
- [ ] Deployment should take 3-5 minutes
- [ ] Check Render dashboard for "Live" status
- [ ] Copy your backend URL
- [ ] Test: `curl https://your-backend-url/api/health`
- [ ] Should return: `{ "status": "healthy", ... }`

---

## Frontend Deployment (Vercel)

### Step 1: Import Project
- [ ] Log in to Vercel
- [ ] Click "Add New..." → "Project"
- [ ] Find and import your repository

### Step 2: Configure Build
- [ ] Framework: Vite React
- [ ] Root directory: `trans_mcq_fronted`
- [ ] Build command: `npm run build`
- [ ] Output directory: `dist`

### Step 3: Environment Variables
- [ ] VITE_API_URL: `https://your-backend-url` (from Render)
- [ ] VITE_ENV: `production`
- [ ] Click "Deploy"

### Step 4: Wait & Verify
- [ ] Deployment should take 2-3 minutes
- [ ] Check for green checkmark (Deployment Successful)
- [ ] Copy your frontend URL
- [ ] Visit your frontend URL
- [ ] Should see "API Connected" (green check)

---

## Post-Deployment Verification

### API Health Check
```bash
curl https://your-backend-url/api/health
# Expected: { "status": "healthy", ... }
```

### CORS Verification
```bash
curl -H "Origin: https://your-frontend-url" \
  https://your-backend-url/api/health
# Should NOT have CORS error
```

### Untrusted Origin Test
```bash
curl -H "Origin: https://malicious.com" \
  https://your-backend-url/api/health
# Should have CORS error (good!)
```

### Frontend Testing
- [ ] Open frontend in browser
- [ ] Check browser console (no errors)
- [ ] API Connection should show "Connected"
- [ ] Test file upload with small video
- [ ] Verify no 404 or CORS errors

---

## Security Checklist

### Backend
- [ ] CORS only allows your frontend origin
- [ ] Environment variables set (not hardcoded)
- [ ] MONGODB_URI is secret
- [ ] Rate limiting active (check for restrictions)
- [ ] File upload accepts only specific types
- [ ] Health check accessible
- [ ] API logs don't expose sensitive data

### Frontend
- [ ] API URL points to production backend
- [ ] No console.logs in production build
- [ ] Error boundary catches component errors
- [ ] XSS protection enabled
- [ ] No hardcoded API keys

---

## Monitoring Setup

### Render Logs
- [ ] Go to service dashboard
- [ ] Click "Logs" tab
- [ ] Monitor for errors (red text)
- [ ] Check response codes

### Set Up Alerts
- [ ] Consider UptimeRobot for monitoring
- [ ] Add your health check URL: `https://your-backend-url/api/health`
- [ ] Get instant alerts if API goes down

### Optional: Error Tracking
- [ ] Sign up for Sentry (free tier)
- [ ] Install Sentry SDK
- [ ] Get notified of production errors

---

## Troubleshooting

### API Connection Failed
1. Check Render deployment (green "Live"?)
2. Verify MONGODB_URI is correct
3. Check ALLOWED_ORIGINS includes your Vercel URL
4. Try: `curl https://backend-url/api/health`

### File Upload Fails
1. Check file size < 500MB
2. Verify file is MP4 or audio
3. Check Render logs for error details
4. Ensure database is accessible

### Frontend Shows Blank Page
1. Check browser console for errors
2. Verify Vercel deployment was successful
3. Check VITE_API_URL in Vercel env vars
4. Try clearing browser cache

### Database Connection Error
1. Check MONGODB_URI in Render .env
2. Verify MongoDB Atlas IP whitelist includes Render
3. Check username/password are correct
4. Verify cluster is active in MongoDB Atlas

---

## Production Optimization (Optional)

### Enable Caching
- [ ] Configure Render to cache database queries
- [ ] Use CloudFlare for additional caching

### Scale Up Plan
- [ ] Monitor Render CPU/Memory usage
- [ ] Upgrade plan if needed (Starter: $7/mo)
- [ ] Upgrade MongoDB to M2 ($9/mo) for backups

### Add Monitoring
- [ ] Set up Sentry for error tracking
- [ ] Add Google Analytics to frontend
- [ ] Monitor database metrics in MongoDB Atlas

---

## Done! 🎉

Your application is now deployed!

### Access Points
- **Frontend:** https://your-frontend-url
- **Backend API:** https://your-backend-url/api
- **Health Check:** https://your-backend-url/api/health

### Next Steps
1. Share with early users (beta/testing)
2. Gather feedback
3. Plan real AI integration (Whisper + GPT-4)
4. Add user authentication

---

**Questions?** See the full guides:
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Detailed setup
- [PRODUCTION_AUDIT_REPORT.md](PRODUCTION_AUDIT_REPORT.md) - Technical details
- [IMPROVEMENTS_SUMMARY.md](IMPROVEMENTS_SUMMARY.md) - What was improved
