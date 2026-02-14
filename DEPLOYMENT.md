# Backend Deployment Guide

## Deploy to Render (Free Platform)

### Step 1: Set Up MongoDB Atlas (Free Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas)
2. Sign up for a free account
3. Create a new project
4. Create a cluster (select the free M0 tier)
5. Add your IP address to the network access list (or use 0.0.0.0/0 for development)
6. Create a database user (username and password)
7. Get your connection string from "Connect" → "Connect your application"
   - Format: `mongodb+srv://username:password@cluster0.mongodb.net/transcription_db?retryWrites=true&w=majority`

### Step 2: Deploy to Render

1. Go to [Render.com](https://render.com)
2. Sign up with your GitHub account
3. Click "New +" and select "Web Service"
4. Select "Build and deploy from a Git repository"
5. Connect your GitHub account and select the `Trans_MCQ` repository
6. Configure the service:
   - **Name**: `trans-mcq-backend` (or any name)
   - **Environment**: Node
   - **Region**: Select closest to you
   - **Branch**: main
   - **Build Command**: `cd trans_mcq_back && npm install && npm run build`
   - **Start Command**: `cd trans_mcq_back && npm start`
   - **Plan**: Free
7. Add Environment Variables:
   - Click "Add Environment Variable":
     - **Key**: `MONGODB_URI`
     - **Value**: Your MongoDB connection string (from Step 1)
   - **Key**: `PORT`
   - **Value**: `5000`
   - **Key**: `NODE_ENV`
   - **Value**: `production`

8. Click "Create Web Service"
9. Wait for deployment to complete (5-10 minutes)

### Step 3: Get Your API Link

Once deployed, Render will provide a URL like:
```
https://trans-mcq-backend.onrender.com
```

Your API endpoints will be:
- **Health Check**: `https://trans-mcq-backend.onrender.com/health`
- **Files API**: `https://trans-mcq-backend.onrender.com/api/files`
- **Transcription API**: `https://trans-mcq-backend.onrender.com/api/transcription`
- **Questions API**: `https://trans-mcq-backend.onrender.com/api/questions`

### Step 4: Update Frontend with API URL

Update your frontend API base URL in [trans_mcq_fronted/src/services/apiServices.ts](../trans_mcq_fronted/src/services/apiServices.ts):

```typescript
const API_BASE_URL = 'https://trans-mcq-backend.onrender.com/api';
```

### Important Notes

- **Free tier limitations**:
  - Render spins down services after 15 minutes of inactivity
  - MongoDB Atlas free tier: 512MB storage, 3GB/month data transfer
- **Keep deployment active**: Ping the `/health` endpoint periodically to keep the service awake
- **Monitor usage**: Free tiers have limitations; monitor requests and data usage

### Troubleshooting

If deployment fails:
1. Check build logs in Render dashboard
2. Ensure `MONGODB_URI` is correct
3. Verify MongoDB Atlas network access allows Render IPs
4. Check that `npm run build` works locally

---

**Your API is now live!** Test it with:
```bash
curl https://trans-mcq-backend.onrender.com/health
```
