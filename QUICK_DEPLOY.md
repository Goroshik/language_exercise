# Quick Deployment Guide

## Fastest Way to Deploy (5 minutes)

This guide will get your app running on Vercel with MongoDB Atlas in about 5 minutes.

### Step 1: Set up MongoDB Atlas (2 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and create a free account
2. Click **"Create Cluster"** and choose the **Free tier (M0)**
3. Choose a cloud provider and region (any will work)
4. Click **"Create Cluster"** (wait 1-2 minutes for it to be ready)
5. Go to **Database Access** → **Add New Database User**
   - Create a username and password (save these!)
   - Set permissions to **"Read and write to any database"**
6. Go to **Network Access** → **Add IP Address** → **Allow Access from Anywhere** (0.0.0.0/0)
7. Go back to **Database** → Click **"Connect"** on your cluster
8. Choose **"Connect your application"**
9. Copy the connection string (looks like: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/`)
10. Replace `<password>` with your database user password
11. Add `/exercises` before the `?` (final: `mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/exercises?retryWrites=true&w=majority`)

### Step 2: Generate Secrets (1 minute)

Run these commands in your terminal to generate secure secrets:

```bash
# Generate JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate TOKEN_SECRET (must be exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

Save these values!

### Step 3: Deploy to Vercel (2 minutes)

1. Go to [Vercel](https://vercel.com) and sign up with GitHub
2. Click **"New Project"**
3. Import your repository (`Goroshik/language_exercise`)
4. Click on **"Environment Variables"**
5. Add these variables:

   ```
   DATABASE_URL = [your MongoDB connection string from Step 1]
   JWT_SECRET = [generated in Step 2]
   JWT_COOKIE_NAME = app_token
   JWT_EXPIRES_IN = 7d
   TOKEN_SECRET = [generated in Step 2]
   ```

6. Click **"Deploy"**
7. Wait 2-3 minutes for deployment to complete

### Step 4: Done! 🎉

Your app is now live! Vercel will give you a URL like `https://your-app.vercel.app`

### Optional: Add Custom Domain

1. In Vercel project settings → **Domains**
2. Add your custom domain
3. Update your domain's DNS records as instructed by Vercel
4. Wait for DNS propagation (5 minutes to 48 hours)

---

## Troubleshooting

### "Cannot connect to database"

- Double-check your `DATABASE_URL` has the correct password
- Make sure you added `/exercises` before the `?` in the connection string
- Verify Network Access in MongoDB Atlas allows 0.0.0.0/0

### "Build failed"

- Check the build logs in Vercel dashboard
- Make sure all environment variables are set correctly
- Try deploying again (sometimes first deploy fails)

### "Application error"

- Check Function Logs in Vercel dashboard
- Verify `JWT_SECRET` and `TOKEN_SECRET` are set
- Make sure `TOKEN_SECRET` is exactly 32 characters (use the generation command from Step 2)

### Need More Help?

See the full [DEPLOYMENT.md](./DEPLOYMENT.md) guide for detailed instructions and other deployment options.

---

## What's Next?

After deployment:

1. Visit your deployed app
2. Create an account
3. Add your AI API keys in Settings (Gemini, OpenAI, or Claude)
4. Start creating language exercises!

Enjoy your language learning app! 🚀
