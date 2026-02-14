# Frontend Deployment Guide - Vercel

## Backend API Configuration

Your backend is now deployed at: **https://trans-mcq-3.onrender.com**

The frontend is configured to use this API:
- **Production (.env.production)**: `VITE_API_URL=https://trans-mcq-3.onrender.com`
- **Development (.env.local)**: `VITE_API_URL=http://localhost:5000`

---

## Deploy Frontend to Vercel

### Step 1: Prerequisites
- GitHub account with your Trans_MCQ repository
- Vercel account (sign up at [vercel.com](https://vercel.com))

### Step 2: Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub
2. Click **"Add New Project"**
3. **Select your repository**: `Trans_MCQ`
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `trans_mcq_fronted`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

5. **Add Environment Variable** (important!):
   - **Name**: `VITE_API_URL`
   - **Value**: `https://trans-mcq-3.onrender.com`

6. Click **"Deploy"**
7. Wait for deployment to complete (~2-3 minutes)

### Step 3: Get Your Frontend URL

Once deployed, Vercel will provide a URL like:
```
https://trans-mcq-fronted.vercel.app
```

Your app is now live! 🎉

---

## Environment Variables Explanation

| File | Variable | Value | Purpose |
|------|----------|-------|---------|
| `.env` | `VITE_API_URL` | `http://localhost:5000` | Default for development |
| `.env.local` | `VITE_API_URL` | `http://localhost:5000` | Override for local dev |
| `.env.production` | `VITE_API_URL` | `https://trans-mcq-3.onrender.com` | Production API URL |

Vercel uses `.env.production` when deploying, so it will automatically use the backend API URL.

---

## API Endpoints Available

Your frontend will use:
- `https://trans-mcq-3.onrender.com/files/upload` - Upload video files
- `https://trans-mcq-3.onrender.com/transcription/file/{videoId}` - Get transcription
- `https://trans-mcq-3.onrender.com/questions/...` - Get MCQ questions
- `https://trans-mcq-3.onrender.com/health` - Health check

---

## Testing the Integration

After deployment, test the API connection:

1. Open your Vercel frontend URL
2. Try uploading a video file
3. Check if transcription and questions generate

If there are CORS issues, add this to the backend [src/server.ts](../trans_mcq_back/src/server.ts):

```typescript
app.use(cors({
  origin: 'https://trans-mcq-fronted.vercel.app',
  credentials: true
}));
```

---

## Troubleshooting

### Issue: API not responding
- Verify `VITE_API_URL` environment variable is set correctly in Vercel
- Check that backend is running: `curl https://trans-mcq-3.onrender.com/health`

### Issue: CORS errors
- Add your Vercel domain to backend CORS settings
- Update [src/server.ts](../trans_mcq_back/src/server.ts) with the exact Vercel URL

### Issue: Build fails
- Check build logs in Vercel dashboard
- Ensure `npm run build` works locally
- Verify all dependencies are listed in package.json

---

## Summary

✅ **Frontend**: Deployed on Vercel  
✅ **Backend**: Deployed on Render  
✅ **API**: Connected and ready to use

You're all set! 🚀
