# Deployment Guide - Language Exercise App

This guide provides comprehensive instructions for deploying the Language Exercise application to production.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Database Setup](#database-setup)
4. [Deployment Options](#deployment-options)
   - [Vercel (Recommended for simplicity)](#option-1-vercel-recommended-for-simplicity)
   - [Railway](#option-2-railway)
   - [Render](#option-3-render)
   - [DigitalOcean App Platform](#option-4-digitalocean-app-platform)
   - [Docker Deployment (VPS/Cloud)](#option-5-docker-deployment-vpscloud)
5. [Post-Deployment Steps](#post-deployment-steps)
6. [Troubleshooting](#troubleshooting)

## Prerequisites

Before deploying, ensure you have:

- Node.js 20+ installed (for local development)
- A MongoDB database (MongoDB Atlas recommended for managed hosting)
- All required API keys (Gemini, OpenAI, Claude - optional, users can add their own)
- Git repository access

## Environment Variables

Copy `.env.example` to `.env` and configure the following variables:

### Required Variables

```env
# Database
DATABASE_URL="mongodb+srv://<username>:<password>@<cluster>.mongodb.net/exercises?retryWrites=true&w=majority"

# Authentication - MUST BE CHANGED IN PRODUCTION
JWT_SECRET="generate-a-strong-random-secret-key-here"
JWT_COOKIE_NAME="app_token"
JWT_EXPIRES_IN="7d"

# Token Encryption - MUST BE CHANGED IN PRODUCTION
TOKEN_SECRET="generate-a-32-character-string-here"
```

### Optional Variables

```env
# Google Translate (fallback translation service)
REACT_APP_GOOGLE_TRANSLATE_API_KEY="your-google-translate-api-key"

# Node Environment
NODE_ENV="production"
```

### Generating Secure Secrets

For `JWT_SECRET` and `TOKEN_SECRET`, generate strong random strings:

```bash
# Generate JWT_SECRET (any length, but at least 32 characters)
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Generate TOKEN_SECRET (must be exactly 32 characters)
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

## Database Setup

### MongoDB Requirements

**Important:** This application requires MongoDB with **replica set** enabled for Prisma transactions.

### MongoDB Atlas (Recommended)

1. **Create a MongoDB Atlas Account**
   - Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
   - Sign up for a free tier account

2. **Create a Cluster**
   - Choose a cloud provider and region
   - Select M0 (Free tier) or higher
   - Atlas clusters have replica sets enabled by default

3. **Configure Network Access**
   - Go to Network Access → Add IP Address
   - For testing: Allow access from anywhere (0.0.0.0/0)
   - For production: Restrict to your deployment platform's IP addresses

4. **Create Database User**
   - Go to Database Access → Add New Database User
   - Create username and password
   - Grant read/write permissions

5. **Get Connection String**
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password
   - Replace `<dbname>` with `exercises`

   Example:

   ```
   mongodb+srv://myuser:mypassword@cluster0.xxxxx.mongodb.net/exercises?retryWrites=true&w=majority
   ```

### Self-Hosted MongoDB

If self-hosting, ensure replica set is initialized:

```bash
# In MongoDB shell
rs.initiate({
  _id: "rs0",
  members: [{ _id: 0, host: "localhost:27017" }]
})
```

## Deployment Options

### Option 1: Vercel (Recommended for simplicity)

**Pros:** Easy setup, automatic deployments, excellent Next.js support, free tier available
**Cons:** Requires external MongoDB (use Atlas)

#### Steps:

1. **Prepare Your Repository**

   ```bash
   git push origin main
   ```

2. **Deploy to Vercel**
   - Go to [Vercel](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure project:
     - Framework Preset: Next.js
     - Root Directory: `./`
     - Build Command: `npm run build`
     - Output Directory: (leave default)

3. **Add Environment Variables**
   - In Vercel project settings → Environment Variables
   - Add all variables from `.env.example`:
     ```
     DATABASE_URL=mongodb+srv://...
     JWT_SECRET=your-secret
     JWT_COOKIE_NAME=app_token
     JWT_EXPIRES_IN=7d
     TOKEN_SECRET=your-token-secret
     REACT_APP_GOOGLE_TRANSLATE_API_KEY=your-key (optional)
     ```

4. **Deploy**
   - Click "Deploy"
   - Vercel will automatically build and deploy your app

5. **Post-Deployment**
   - Your app will be available at `https://your-project.vercel.app`
   - Set up custom domain in Vercel settings (optional)

#### Continuous Deployment

Vercel automatically deploys on every push to main branch. To deploy from other branches:

- Go to Settings → Git → Production Branch
- Configure deployment branches

---

### Option 2: Railway

**Pros:** Easy MongoDB setup, automatic HTTPS, environment variable management
**Cons:** Limited free tier

#### Steps:

1. **Create Railway Account**
   - Go to [Railway](https://railway.app)
   - Sign up with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose your repository

3. **Add MongoDB**
   - Click "New" → "Database" → "Add MongoDB"
   - Railway will create a MongoDB instance
   - Copy the connection string from MongoDB service variables

4. **Configure Next.js Service**
   - Select your Next.js service
   - Go to Variables tab
   - Add environment variables:
     ```
     DATABASE_URL=${{MongoDB.DATABASE_URL}}
     JWT_SECRET=your-secret
     JWT_COOKIE_NAME=app_token
     JWT_EXPIRES_IN=7d
     TOKEN_SECRET=your-token-secret
     REACT_APP_GOOGLE_TRANSLATE_API_KEY=your-key (optional)
     ```

5. **Configure Build Settings** (if needed)
   - Build Command: `npm run build`
   - Start Command: `npm start`

6. **Deploy**
   - Railway automatically deploys on push
   - Access your app at the generated Railway URL

#### Note on MongoDB Replica Set

Railway's MongoDB doesn't have replica sets by default. You have two options:

1. Use MongoDB Atlas instead (recommended)
2. Use Railway's MongoDB for development and Atlas for production

---

### Option 3: Render

**Pros:** Free tier available, good documentation
**Cons:** Slower cold starts on free tier

#### Steps:

1. **Create Render Account**
   - Go to [Render](https://render.com)
   - Sign up with GitHub

2. **Create MongoDB Database**
   - Option A: Use MongoDB Atlas (recommended)
   - Option B: Deploy MongoDB on Render (no replica set support)
   - For production, use Atlas

3. **Create Web Service**
   - Go to Dashboard → New → Web Service
   - Connect your GitHub repository
   - Configure:
     - Name: `language-exercise-app`
     - Environment: `Node`
     - Build Command: `npm install && npx prisma generate && npm run build`
     - Start Command: `npm start`

4. **Add Environment Variables**
   - In service settings → Environment
   - Add all required variables

5. **Deploy**
   - Click "Create Web Service"
   - Render will build and deploy

---

### Option 4: DigitalOcean App Platform

**Pros:** Reliable infrastructure, managed database options
**Cons:** No free tier

#### Steps:

1. **Create DigitalOcean Account**
   - Go to [DigitalOcean](https://www.digitalocean.com)
   - Create an account

2. **Create Managed MongoDB Database** (Optional)
   - Go to Databases → Create Database
   - Choose MongoDB
   - Select plan and region
   - Note: Managed MongoDB on DO is expensive; consider using Atlas

3. **Create App**
   - Go to Apps → Create App
   - Connect your GitHub repository
   - Configure:
     - Type: Web Service
     - Build Command: `npm run build`
     - Run Command: `npm start`

4. **Add Environment Variables**
   - In app settings → Environment Variables
   - Add all required variables

5. **Deploy**
   - Click "Create Resources"
   - App Platform will build and deploy

---

### Option 5: Docker Deployment (VPS/Cloud)

**Pros:** Full control, can run on any server
**Cons:** Requires server management

#### Prerequisites

- A VPS or cloud server (DigitalOcean Droplet, AWS EC2, etc.)
- Docker and Docker Compose installed
- Domain name (optional)

#### Steps:

1. **Set Up Server**

   ```bash
   # SSH into your server
   ssh user@your-server-ip

   # Install Docker
   curl -fsSL https://get.docker.com -o get-docker.sh
   sudo sh get-docker.sh

   # Install Docker Compose
   sudo apt-get update
   sudo apt-get install docker-compose-plugin
   ```

2. **Clone Repository**

   ```bash
   git clone https://github.com/yourusername/language_exercise.git
   cd language_exercise
   ```

3. **Configure Environment**

   ```bash
   # Copy and edit .env file
   cp .env.example .env
   nano .env

   # Update all environment variables
   # For DATABASE_URL, use: mongodb://mongodb:27017/exercises?replicaSet=rs0
   ```

4. **Build and Deploy**

   ```bash
   # Build and start containers
   docker-compose -f docker-compose.production.yml up -d

   # Check logs
   docker-compose -f docker-compose.production.yml logs -f
   ```

5. **Set Up Nginx Reverse Proxy** (Optional but recommended)

   ```bash
   sudo apt-get install nginx certbot python3-certbot-nginx

   # Create Nginx configuration
   sudo nano /etc/nginx/sites-available/language-exercise
   ```

   Add:

   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

   ```bash
   # Enable site
   sudo ln -s /etc/nginx/sites-available/language-exercise /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx

   # Get SSL certificate
   sudo certbot --nginx -d your-domain.com
   ```

6. **Set Up Auto-Restart**
   ```bash
   # Docker containers will restart automatically with 'unless-stopped' policy
   # To update the app:
   cd language_exercise
   git pull
   docker-compose -f docker-compose.production.yml down
   docker-compose -f docker-compose.production.yml up -d --build
   ```

---

## Post-Deployment Steps

1. **Test the Application**
   - Visit your deployed URL
   - Create a test account
   - Test basic functionality:
     - Login/logout
     - Word dictionary
     - Exercise generation
     - AI features (if API keys configured)

2. **Configure Custom Domain** (if applicable)
   - Add custom domain in your deployment platform
   - Update DNS records to point to your app
   - Wait for DNS propagation (5-48 hours)

3. **Set Up Monitoring** (Recommended)
   - Enable platform-specific monitoring
   - Set up error tracking (e.g., Sentry)
   - Configure uptime monitoring

4. **Database Maintenance**
   - Set up automated backups (Atlas does this automatically)
   - Monitor database performance
   - Review and optimize indexes as needed

5. **Security Checklist**
   - ✅ Strong JWT_SECRET and TOKEN_SECRET
   - ✅ HTTPS enabled
   - ✅ Database connection string secured
   - ✅ Network access restricted (MongoDB Atlas)
   - ✅ Environment variables not in code

## Troubleshooting

### Build Fails

**Issue:** Prisma client not generated

```bash
# Solution: Ensure prisma generate runs during build
npm run build
# or manually
npx prisma generate
```

**Issue:** TypeScript errors

```bash
# Check typescript configuration
npx tsc --noEmit
```

### Database Connection Issues

**Issue:** Cannot connect to MongoDB

- Verify DATABASE_URL is correct
- Check MongoDB Atlas network access settings
- Ensure replica set is configured
- Test connection string locally:
  ```bash
  mongosh "your-connection-string"
  ```

**Issue:** Prisma transactions fail

- MongoDB must have replica set enabled
- Local MongoDB: Initialize replica set
- Atlas: Already configured

### Runtime Errors

**Issue:** JWT_SECRET not found

- Ensure all environment variables are set in deployment platform
- Restart the application after adding variables

**Issue:** Token encryption fails

- Verify TOKEN_SECRET is exactly 32 characters
- Generate new secret: `node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"`

**Issue:** AI features not working

- Users must add their own API keys via Settings
- Check that token encryption/decryption works
- Verify API keys are valid

### Performance Issues

**Issue:** Slow cold starts (Vercel/Render free tier)

- Consider upgrading to paid tier
- Implement loading states in UI

**Issue:** Database queries slow

- Review and optimize Prisma queries
- Add database indexes for frequently queried fields
- Consider caching strategy

### Docker Issues

**Issue:** Container won't start

```bash
# Check logs
docker-compose -f docker-compose.production.yml logs app

# Rebuild container
docker-compose -f docker-compose.production.yml up -d --build --force-recreate
```

**Issue:** MongoDB replica set not initialized

```bash
# Check MongoDB logs
docker-compose -f docker-compose.production.yml logs mongodb

# Manually initialize if needed
docker exec -it language-exercise-mongodb mongosh
# In mongosh:
rs.initiate({_id:"rs0",members:[{_id:0,host:"localhost:27017"}]})
```

---

## Platform Comparison Summary

| Platform         | Ease of Setup | Free Tier | MongoDB Included     | Best For                         |
| ---------------- | ------------- | --------- | -------------------- | -------------------------------- |
| **Vercel**       | ⭐⭐⭐⭐⭐    | Yes       | No (use Atlas)       | Quick deployment, hobby projects |
| **Railway**      | ⭐⭐⭐⭐      | Limited   | Yes                  | Full-stack apps, prototypes      |
| **Render**       | ⭐⭐⭐⭐      | Yes       | No (use Atlas)       | Simple deployments               |
| **DigitalOcean** | ⭐⭐⭐        | No        | Optional (expensive) | Production apps                  |
| **Docker/VPS**   | ⭐⭐          | No        | Manual setup         | Full control, large scale        |

### Recommendations:

- **For Development/Testing:** Vercel + MongoDB Atlas (free tiers)
- **For Production (Small):** Vercel + MongoDB Atlas (paid tiers)
- **For Production (Medium):** Railway or DigitalOcean App Platform
- **For Production (Large/Enterprise):** Docker on VPS/Cloud with managed MongoDB

---

## Additional Resources

- [Next.js Deployment Documentation](https://nextjs.org/docs/app/building-your-application/deploying)
- [MongoDB Atlas Documentation](https://www.mongodb.com/docs/atlas/)
- [Prisma Deployment Guide](https://www.prisma.io/docs/guides/deployment/deployment-guides)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)

## Getting Help

If you encounter issues not covered in this guide:

1. Check the [GitHub Issues](https://github.com/yourusername/language_exercise/issues)
2. Review application logs in your deployment platform
3. Consult platform-specific documentation
4. Create a new issue with detailed error information

---

## License

[Your License Here]
