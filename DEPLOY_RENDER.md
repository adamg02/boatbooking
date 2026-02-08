# Deploying to Render.com

This guide walks you through deploying your boat booking app to Render.com.

## Prerequisites

- GitHub account
- Render.com account (free tier available)
- Your code pushed to a GitHub repository

## Step 1: Push Code to GitHub

If you haven't already:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourusername/boatbooking.git
git push -u origin main
```

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Sign up with your GitHub account
3. Authorize Render to access your repositories

## Step 3: Create New Web Service

1. Click **"New +"** button in the Render dashboard
2. Select **"Web Service"**
3. Connect your GitHub repository
4. Configure the service:

### Build & Deploy Settings

**Name:** `boatbooking` (or your preferred name)

**Environment:** `Node`

**Region:** Choose closest to your users

**Branch:** `main`

**Build Command:**
```bash
npm install && npm run build
```

**Start Command:**
```bash
npm start
```

**Instance Type:** Free (or paid if needed)

## Step 4: Configure Environment Variables

In the Render dashboard, go to **Environment** tab and add:

```
NEXT_PUBLIC_SUPABASE_URL=https://zykspozosjiubmezhxfr.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
NODE_VERSION=18
```

**Important:** Replace `your-anon-key-here` with your actual Supabase anon key from `.env`

## Step 5: Deploy

1. Click **"Create Web Service"**
2. Render will automatically:
   - Clone your repository
   - Install dependencies
   - Build your Next.js app
   - Start the server

This takes 3-5 minutes on first deploy.

## Step 6: Update Supabase Configuration

Once deployed, get your Render URL (e.g., `https://boatbooking.onrender.com`) and update:

### In Supabase Dashboard:

1. **Authentication → URL Configuration:**
   - Add **Site URL:** `https://boatbooking.onrender.com`
   - Add **Redirect URLs:** `https://boatbooking.onrender.com/auth/callback`

2. **Authentication → Providers:**
   - Update each OAuth provider (Google, Azure, Facebook)
   - Add redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`

### In OAuth Provider Settings:

**Google Cloud Console:**
- Add authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`

**Azure Portal:**
- Add redirect URI in your app registration

**Facebook Developers:**
- Add OAuth redirect URI in Facebook Login settings

## Step 7: Test Your Deployment

1. Visit your Render URL
2. Try signing in with each OAuth provider
3. Test booking a boat
4. Verify admin panel works (if you're an admin)

## Automatic Deployments

Render automatically redeploys when you push to GitHub:

```bash
git add .
git commit -m "Update feature"
git push
```

Render detects the push and rebuilds your app.

## Render.com Features

**Free Tier Includes:**
- 750 hours/month (enough for one app running 24/7)
- Automatic HTTPS
- Continuous deployment from Git
- Custom domains (optional)

**Limitations:**
- Spins down after 15 minutes of inactivity
- First request after spin-down takes 30-60 seconds
- 512 MB RAM

**Paid Tier ($7+/month):**
- No spin-down
- More RAM
- Faster builds

## Troubleshooting

### Build Fails

Check the build logs in Render dashboard. Common issues:

**Missing dependencies:**
```bash
# Make sure package.json is committed
git add package.json package-lock.json
git commit -m "Add dependencies"
git push
```

**Node version:**
Add to environment variables:
```
NODE_VERSION=18
```

### OAuth Not Working

1. Verify redirect URLs in Supabase match your Render URL exactly
2. Check OAuth provider redirect URIs include Supabase callback
3. Clear browser cookies and try again

### App Not Starting

Check start command is:
```bash
npm start
```

Not `npm run dev` (development mode won't work in production)

### Slow First Load After Inactivity

This is normal on free tier. Consider:
- Upgrading to paid tier (no spin-down)
- Using a service to ping your app every 14 minutes (keeps it awake)

## Custom Domain (Optional)

1. In Render dashboard, go to **Settings**
2. Scroll to **Custom Domains**
3. Click **Add Custom Domain**
4. Follow instructions to configure DNS

## Monitoring

Render provides:
- Real-time logs
- Deployment history
- Metrics (CPU, memory usage)

Access these in your service dashboard.

## Alternative: Deploy via Render Blueprint

Create `render.yaml` in your project root:

```yaml
services:
  - type: web
    name: boatbooking
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: NODE_VERSION
        value: 18
      - key: NEXT_PUBLIC_SUPABASE_URL
        sync: false
      - key: NEXT_PUBLIC_SUPABASE_ANON_KEY
        sync: false
```

Then:
1. Push to GitHub
2. In Render, select "Blueprint" instead of "Web Service"
3. Connect repository
4. Add environment variables manually

## Costs

**Free Tier:** $0/month
- Good for testing and low-traffic apps
- Spins down after inactivity

**Starter:** $7/month
- Always on (no spin-down)
- 512 MB RAM
- Good for production

**Standard:** $25/month+
- More resources
- Better performance

## Support

- [Render Documentation](https://render.com/docs)
- [Render Community](https://community.render.com/)
- [Next.js on Render Guide](https://render.com/docs/deploy-nextjs-app)

## Summary

1. Push code to GitHub
2. Create Render account
3. Create Web Service from GitHub repo
4. Add environment variables
5. Deploy
6. Update Supabase URLs
7. Test OAuth login

Your app will be live at `https://your-app-name.onrender.com`! 🚀
