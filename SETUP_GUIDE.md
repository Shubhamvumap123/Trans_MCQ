# Trans MCQ - Production Setup Guide

## Overview
This guide walks through the complete production setup process for Trans MCQ, including security configurations, deployment, and monitoring.

## Prerequisites

- Node.js 18+
- npm 8+
- MongoDB Atlas account (free tier available)
- Render.com account (for backend)
- Vercel account (for frontend)
- GitHub account with repository access

---

## PHASE 1: Local Development Setup

### 1.1 Backend Setup

```bash
cd trans_mcq_back

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Configure environment variables
# IMPORTANT: Fill in your MongoDB URI
```

#### Backend .env Configuration
```env
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db?retryWrites=true&w=majority
PORT=5000
NODE_ENV=development
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
LOG_LEVEL=debug
```

### 1.2 Frontend Setup

```bash
cd trans_mcq_fronted

# Install dependencies
npm install

# Create .env.local file
cp .env.example .env.local

# Add your API URL
```

#### Frontend .env.local Configuration
```env
VITE_API_URL=http://localhost:5000
VITE_ENV=development
```

### 1.3 Run Locally

**Terminal 1 - Backend:**
```bash
cd trans_mcq_back
npm run dev
# Server running on http://localhost:5000
```

**Terminal 2 - Frontend:**
```bash
cd trans_mcq_fronted
npm run dev
# App running on http://localhost:5173
```

---

## PHASE 2: MongoDB Setup (Free Tier)

### 2.1 MongDB Atlas Configuration

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create free account → Create Project
3. Create **M0 Shared Cluster** (free tier)
4. Set region closest to your users
5. Create Database User:
   - Username: `trans_mcq_user`
   - Password: (generate strong password)
6. Add IP Address:
   - Development: 0.0.0.0/0 (allow all)
   - Production: Add specific Render.com IPs
7. Get Connection String:
   - Click "Connect" → "Drivers"
   - Copy connection string
   - Replace `<password>` with actual password

### 2.2 Database Indexes

Indexes are automatically created by Mongoose schemas in models/.

---

## PHASE 3: Backend Deployment (Render)

### 3.1 Prepare for Deployment

```bash
cd trans_mcq_back

# Test build
npm run build

# Verify output in dist/ folder
ls -la dist/
```

### 3.2 Deploy to Render

1. Go to [render.com](https://render.com)
2. Sign up with GitHub
3. Click "New +" → "Web Service"
4. Select your repository
5. Configure:
   - **Name**: `trans-mcq-backend`
   - **Environment**: Node
   - **Region**: Select closest to users
   - **Branch**: main
   - **Build Command**: `cd trans_mcq_back && npm install && npm run build`
   - **Start Command**: `node dist/server.js`
   - **Plan**: Free (for testing) or Starter ($7/month for production)

### 3.3 Set Environment Variables in Render

Click "Advanced" and add:

```
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/db?retryWrites=true&w=majority
NODE_ENV=production
PORT=5000
ALLOWED_ORIGINS=https://trans-mcq.vercel.app
LOG_LEVEL=info
```

### 3.4 Deploy

- Click "Create Web Service"
- Wait 5-10 minutes for deployment
- Get your URL: `https://trans-mcq-xxxx.onrender.com`

### 3.5 Verify Backend

```bash
curl https://trans-mcq-xxxx.onrender.com/api/health
# Should return: { "status": "healthy", ... }
```

---

## PHASE 4: Frontend Deployment (Vercel)

### 4.1 Prepare for Deployment

```bash
cd trans_mcq_fronted

# Test build
npm run build

# Build should succeed without errors
```

### 4.2 Deploy to Vercel

1. Go to [vercel.com](https://vercel.com)
2. Sign in with GitHub
3. Click "Add New..." → "Project"
4. Import your repository
5. Configure:
   - **Root Directory**: `trans_mcq_fronted`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### 4.3 Set Environment Variables in Vercel

Create `.env.production`:

```
VITE_API_URL=https://trans-mcq-xxxx.onrender.com
```

### 4.4 Deploy

- Click "Deploy"
- Wait 2-3 minutes
- Get your URL: `https://trans-mcq.vercel.app`

### 4.5 Verify Frontend

- Open frontend URL
- Check browser console for errors
- Test API health check (should show "API Connected")

---

## PHASE 5: Security Hardening

### 5.1 API Security Checklist

- [ ] CORS properly configured (not `*`)
- [ ] Rate limiting enabled
- [ ] Helmet headers active
- [ ] Input validation on all routes
- [ ] File upload security (magic number check)
- [ ] Environment variables not exposed
- [ ] HTTPS enforced
- [ ] No console.logs in production

### 5.2 Frontend Security Checklist

- [ ] XSS protection (input sanitization)
- [ ] CSP headers set
- [ ] Dependencies up-to-date
- [ ] No hardcoded secrets
- [ ] Error messages don't expose internals
- [ ] CORS trusted origins only

### 5.3 Database Security

- [ ] Connection string uses strong password
- [ ] IP whitelist configured (not 0.0.0.0)
- [ ] Backups enabled (paid tier)
- [ ] No test data in production

---

## PHASE 6: Monitoring & Logging

### 6.1 View Render Logs

```bash
# In Render dashboard:
# Applications → select your service → Logs
# Monitor for errors and performance
```

### 6.2 Setup Optional Monitoring

#### Sentry (Error Tracking)
1. Create free account at [sentry.io](https://sentry.io)
2. Create project
3. Add `SENTRY_DSN` to environment variables
4. Install Sentry SDK:

**Backend:**
```bash
npm install @sentry/node
```

**Frontend:**
```bash
npm install @sentry/react
```

#### Uptime Monitoring
- Use [UptimeRobot](https://uptimerobot.com) (free)
- Monitor `https://your-backend/api/health`
- Get alerts if API goes down

---

## PHASE 7: Testing Production

### 7.1 Functional Testing

```bash
# Test upload endpoint
curl -X POST -F "video=@test.mp4" \
  https://your-backend/api/files/upload

# Test health check
curl https://your-backend/api/health

# Test CORS headers
curl -i -H "Origin: https://your-frontend" \
  https://your-backend/api/health
```

### 7.2 Security Testing

```bash
# Check security headers
curl -i https://your-backend/api/health
# Should include: X-Frame-Options, CSP, etc.

# Check CORS is restricted
curl -H "Origin: http://malicious.com" \
  https://your-backend/api/health
# Should deny with 403
```

### 7.3 Performance Testing

- Use [PageSpeed Insights](https://pagespeed.web.dev/)
- Check Core Web Vitals
- Monitor API response times in Render dashboard

---

## PHASE 8: Troubleshooting

### Common Issues

#### API Connection Failed
```
❌ API Disconnected
```

**Solutions:**
1. Check backend is running: `curl https://backend-url/api/health`
2. Verify ALLOWED_ORIGINS in backend .env
3. Check browser console for CORS errors
4. Ensure frontend VITE_API_URL is correct

#### File Upload Fails
```
Error: File upload failed
```

**Solutions:**
1. Check file size < 500MB
2. Verify file format is supported
3. Check file upload quota in Render
4. Review backend logs for detailed error

#### Slow Performance
**Solutions:**
1. Check database indexes are created
2. Monitor API response times
3. Enable compression in backend
4. Use CDN for frontend (Vercel does this automatically)

#### Database Connection Error
```
MongoDB connection error
```

**Solutions:**
1. Verify MONGODB_URI in .env
2. Check IP whitelist in MongoDB Atlas
3. Verify username/password correct
4. Check cluster is active

---

## PHASE 9: Maintenance

### Regular Tasks

#### Daily
- [ ] Monitor error logs
- [ ] Check uptime monitoring
- [ ] Review API health status

#### Weekly
- [ ] Check for security updates: `npm audit`
- [ ] Review database usage
- [ ] Check Render/Vercel logs

#### Monthly
- [ ] Update dependencies: `npm update`
- [ ] Review security headers
- [ ] Backup database (if using paid tier)
- [ ] Check performance metrics

### Backup Strategy

**MongoDB Atlas Free Tier:**
- No automatic backups
- Manually export data monthly:

```bash
# Export collections
mongoexport --uri "mongodb+srv://..." --collection Files --out Files.json
mongoexport --uri "mongodb+srv://..." --collection Transcriptions --out Transcriptions.json
mongoexport --uri "mongodb+srv://..." --collection Questions --out Questions.json
```

**Upgrade to Paid for Automatic Backups:**
- M2 tier: ~$9/month
- Includes automated daily backups
- Access to point-in-time recovery

---

## PHASE 10: Scaling Up

### When You Need More Resources

#### Render Upgrade
- Free: 0.5 CPU, 512MB RAM - ~10 concurrent users
- Starter: 1 CPU, 1GB RAM - ~50 concurrent users
- Standard: 2 CPU, 2GB RAM - ~200 concurrent users

#### Database Upgrade
- M0 (Free): ✅ Development only
- M2 (Paid): ✅ Small production
- M5+ (Paid): ✅ Production with backups
- Dedicated: ✅ Enterprise

#### What to Monitor Before Scaling

1. **CPU Usage**: Check Render dashboard
2. **Memory Usage**: Monitor in Render logs
3. **Database Load**: Check MongoDB Atlas metrics
4. **Request Latency**: API response times

---

## Next Steps: Real AI Integration

The current setup uses mock data for transcription and question generation. To use real AI:

### Whisper API (Transcription)
```bash
npm install openai
```

### GPT API (Question Generation)
```bash
npm install openai
```

Add to `.env.production`:
```
OPENAI_API_KEY=sk-...
```

This will be significantly more expensive at scale, so plan costs accordingly.

---

## Support & Documentation

- [Render Docs](https://render.com/docs)
- [Vercel Docs](https://vercel.com/docs)
- [MongoDB Docs](https://docs.mongodb.com/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** February 14, 2026  
**Version:** 1.0.0
