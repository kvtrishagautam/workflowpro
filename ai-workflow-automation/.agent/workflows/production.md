---
description: Deploy WorkflowPro to production
---

# Production Deployment Workflow - WorkflowPro

Complete guide for deploying the WorkflowPro AI Workflow Automation platform to production.

## 📋 Prerequisites

- [ ] Production server with Node.js 14+ installed
- [ ] MongoDB instance (MongoDB Atlas or self-hosted)
- [ ] Domain name configured (optional but recommended)
- [ ] SSL certificate (Let's Encrypt or commercial)
- [ ] SMTP server credentials for email features
- [ ] API keys for integrations (Hunter.io, Apollo.io, OpenAI, etc.)

## 🔧 Pre-Deployment Checklist

### 1. Review Environment Configuration

Create a production `.env` file in the backend directory:

```bash
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/workflowpro?retryWrites=true&w=majority

# Server Configuration
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://yourdomain.com

# Security
JWT_SECRET=your-super-secure-jwt-secret-at-least-32-chars
API_KEY=your-api-key-for-webhook-authentication

# Email Configuration (for Email nodes)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-specific-password
SMTP_FROM=noreply@yourdomain.com

# API Keys for Email Discovery
HUNTER_API_KEY=your-hunter-io-api-key
APOLLO_API_KEY=your-apollo-io-api-key

# OpenAI Integration
OPENAI_API_KEY=your-openai-api-key

# Slack Integration (optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL

# Discord Integration (optional)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR/WEBHOOK/URL

# Google Sheets Integration (optional)
GOOGLE_SHEETS_API_KEY=your-google-sheets-api-key
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com
```

### 2. Update Frontend Configuration

Create or update `frontend/src/config/production.config.ts`:

```typescript
export const config = {
  API_BASE_URL: 'https://api.yourdomain.com',
  WS_URL: 'wss://api.yourdomain.com',
  ENVIRONMENT: 'production'
};
```

## 🏗️ Build Process

### Step 1: Clean Install Dependencies

```bash
# Navigate to project root
cd c:\Users\koilo\OneDrive\Desktop\wf\workflowpro\ai-workflow-automation

# Clean install with pnpm
pnpm install --frozen-lockfile
```

### Step 2: Build Backend

```bash
# Navigate to backend
cd backend

# Build TypeScript to JavaScript
npm run build

# Verify build output
dir dist
```

Expected output: `dist/` folder with compiled JavaScript files.

### Step 3: Build Frontend

```bash
# Navigate to frontend
cd ../frontend

# Build production bundle
npm run build

# Verify build output
dir build
```

Expected output: `build/` folder with optimized static files.

### Step 4: Run Production Tests

```bash
# Test backend
cd ../backend
npm test

# Test frontend
cd ../frontend
npm test
```

Ensure all tests pass before deploying.

## 🚀 Deployment Options

### Option A: Traditional Server Deployment (VPS/Dedicated Server)

#### 1. Transfer Files to Server

```bash
# Using SCP or SFTP
scp -r ./ai-workflow-automation user@your-server:/var/www/workflowpro

# Or use rsync
rsync -avz --exclude 'node_modules' ./ai-workflow-automation user@your-server:/var/www/workflowpro
```

#### 2. Install Dependencies on Server

```bash
ssh user@your-server
cd /var/www/workflowpro

# Install production dependencies only
cd backend
npm ci --production

cd ../frontend
npm ci --production
```

#### 3. Configure Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Create PM2 ecosystem file
```

Create `ecosystem.config.js` in project root:

```javascript
module.exports = {
  apps: [{
    name: 'workflowpro-backend',
    script: './backend/dist/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 5000
    },
    error_file: './logs/backend-error.log',
    out_file: './logs/backend-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true,
    autorestart: true,
    max_memory_restart: '1G',
    watch: false
  }]
};
```

```bash
# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Configure PM2 to start on system boot
pm2 startup
```

#### 4. Configure Nginx as Reverse Proxy

Create `/etc/nginx/sites-available/workflowpro`:

```nginx
# Backend API
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# Frontend
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    root /var/www/workflowpro/frontend/build;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;
}
```

```bash
# Enable site
ln -s /etc/nginx/sites-available/workflowpro /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t

# Reload Nginx
systemctl reload nginx
```

#### 5. Configure SSL with Let's Encrypt

```bash
# Install Certbot
apt-get install certbot python3-certbot-nginx

# Obtain SSL certificates
certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal is configured automatically
# Test renewal process
certbot renew --dry-run
```

### Option B: Docker Deployment

#### 1. Create Dockerfile for Backend

Create `backend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
COPY pnpm-lock.yaml ./

# Install dependencies
RUN npm install -g pnpm
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Production image
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --production

# Copy built files from builder
COPY --from=builder /app/dist ./dist

EXPOSE 5000

CMD ["node", "dist/index.js"]
```

#### 2. Create Dockerfile for Frontend

Create `frontend/Dockerfile`:

```dockerfile
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Production image with Nginx
FROM nginx:alpine

# Copy built files
COPY --from=builder /app/build /usr/share/nginx/html

# Copy Nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

Create `frontend/nginx.conf`:

```nginx
server {
    listen 80;
    server_name localhost;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api {
        proxy_pass http://backend:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### 3. Create Docker Compose File

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'

services:
  mongodb:
    image: mongo:7
    container_name: workflowpro-mongo
    restart: always
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: ${MONGO_PASSWORD}
    volumes:
      - mongodb_data:/data/db
      - mongodb_config:/data/configdb
    networks:
      - workflowpro-network
    ports:
      - "27017:27017"

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: workflowpro-backend
    restart: always
    environment:
      NODE_ENV: production
      PORT: 5000
      MONGODB_URI: mongodb://admin:${MONGO_PASSWORD}@mongodb:27017/workflowpro?authSource=admin
      JWT_SECRET: ${JWT_SECRET}
      SMTP_HOST: ${SMTP_HOST}
      SMTP_PORT: ${SMTP_PORT}
      SMTP_USER: ${SMTP_USER}
      SMTP_PASS: ${SMTP_PASS}
      OPENAI_API_KEY: ${OPENAI_API_KEY}
      HUNTER_API_KEY: ${HUNTER_API_KEY}
      APOLLO_API_KEY: ${APOLLO_API_KEY}
    depends_on:
      - mongodb
    networks:
      - workflowpro-network
    ports:
      - "5000:5000"

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: workflowpro-frontend
    restart: always
    depends_on:
      - backend
    networks:
      - workflowpro-network
    ports:
      - "80:80"

volumes:
  mongodb_data:
  mongodb_config:

networks:
  workflowpro-network:
    driver: bridge
```

#### 4. Deploy with Docker Compose

```bash
# Build and start containers
docker-compose up -d --build

# View logs
docker-compose logs -f

# Check status
docker-compose ps

# Stop containers
docker-compose down

# Update and restart
docker-compose up -d --build --force-recreate
```

### Option C: Cloud Platform Deployment

#### Heroku Deployment

1. **Create Heroku Apps**

```bash
# Install Heroku CLI
# Download from https://devcenter.heroku.com/articles/heroku-cli

# Login to Heroku
heroku login

# Create backend app
heroku create workflowpro-backend

# Create frontend app
heroku create workflowpro-frontend

# Add MongoDB addon to backend
heroku addons:create mongolab:sandbox -a workflowpro-backend
```

2. **Configure Backend**

Create `backend/Procfile`:

```
web: node dist/index.js
```

```bash
# Set environment variables
heroku config:set NODE_ENV=production -a workflowpro-backend
heroku config:set JWT_SECRET=your-secret -a workflowpro-backend
heroku config:set SMTP_HOST=smtp.gmail.com -a workflowpro-backend
# ... set other env vars

# Deploy backend
cd backend
git subtree push --prefix backend heroku main

# Or use this for monorepo
git push heroku `git subtree split --prefix backend main`:main --force
```

3. **Configure Frontend**

Create `frontend/static.json`:

```json
{
  "root": "build/",
  "routes": {
    "/**": "index.html"
  },
  "headers": {
    "/**": {
      "Cache-Control": "no-cache, no-store, must-revalidate"
    },
    "/static/**": {
      "Cache-Control": "public, max-age=31536000"
    }
  }
}
```

Add to `frontend/package.json`:

```json
{
  "scripts": {
    "heroku-postbuild": "npm run build"
  }
}
```

```bash
# Add buildpack
heroku buildpacks:add heroku/nodejs -a workflowpro-frontend
heroku buildpacks:add https://github.com/heroku/heroku-buildpack-static -a workflowpro-frontend

# Deploy frontend
git push heroku `git subtree split --prefix frontend main`:main --force
```

#### Vercel Deployment (Frontend Only)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy from frontend directory
cd frontend
vercel --prod
```

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/static-build",
      "config": {
        "distDir": "build"
      }
    }
  ],
  "routes": [
    {
      "src": "/static/(.*)",
      "headers": {
        "cache-control": "public, max-age=31536000, immutable"
      }
    },
    {
      "src": "/(.*)",
      "dest": "/index.html"
    }
  ]
}
```

#### AWS EC2 Deployment

1. **Launch EC2 Instance**
   - Choose Ubuntu 22.04 LTS
   - t3.medium or larger recommended
   - Configure Security Groups (ports 80, 443, 22, 5000)

2. **Connect and Setup**

```bash
# SSH into instance
ssh -i your-key.pem ubuntu@ec2-ip-address

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm
npm install -g pnpm

# Install MongoDB (or use MongoDB Atlas)
wget -qO - https://www.mongodb.org/static/pgp/server-7.0.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu jammy/mongodb-org/7.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-7.0.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod
sudo systemctl enable mongod

# Install Nginx
sudo apt install nginx -y

# Install PM2
npm install -g pm2

# Clone or upload your code
# Follow steps from Option A above
```

## 🔒 Security Hardening

### 1. Environment Variables Security

```bash
# Never commit .env files
# Use secrets management services in production

# AWS Secrets Manager
# Google Cloud Secret Manager
# HashiCorp Vault
# Azure Key Vault
```

### 2. Enable Rate Limiting

Add to `backend/src/index.ts`:

```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

### 3. Add Helmet for Security Headers

```bash
cd backend
npm install helmet
```

Add to `backend/src/index.ts`:

```typescript
import helmet from 'helmet';

app.use(helmet());
```

### 4. Enable CORS Properly

Update CORS configuration:

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
```

### 5. MongoDB Security

```bash
# Enable authentication
# Use strong passwords
# Enable SSL/TLS
# Whitelist IP addresses
# Regular backups
```

## 📊 Monitoring & Logging

### 1. Setup Application Monitoring

```bash
# Install monitoring dependencies
npm install winston morgan
```

Create `backend/src/utils/logger.ts`:

```typescript
import winston from 'winston';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}
```

### 2. Setup PM2 Monitoring

```bash
# PM2 Plus (free tier available)
pm2 link your-secret-key your-public-key

# View logs
pm2 logs

# Monitor resources
pm2 monit

# Web-based dashboard
pm2 web
```

### 3. Database Monitoring

- Use MongoDB Atlas built-in monitoring
- Setup alerts for high CPU/memory usage
- Monitor slow queries
- Track connection pool usage

### 4. Setup Health Checks

Already implemented at `/health` endpoint. Add uptime monitoring:
- UptimeRobot (free)
- Pingdom
- StatusCake
- New Relic

## 💾 Backup Strategy

### 1. Database Backups

```bash
# Manual MongoDB backup
mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/workflowpro" --out=/backups/$(date +%Y%m%d)

# Automated daily backups (crontab)
0 2 * * * /usr/bin/mongodump --uri="mongodb+srv://user:pass@cluster.mongodb.net/workflowpro" --out=/backups/$(date +\%Y\%m\%d) && find /backups -mtime +7 -delete
```

### 2. Code and Configuration Backup

```bash
# Use Git for version control
# Tag releases
git tag -a v1.0.0 -m "Production release v1.0.0"
git push origin v1.0.0

# Backup configuration files separately
# Store in secure location (not in Git)
```

### 3. Restoration Testing

```bash
# Test restore process monthly
mongorestore --uri="mongodb+srv://user:pass@cluster.mongodb.net/workflowpro-test" /backups/20260215
```

## 🚨 Incident Response

### 1. Application Crashes

```bash
# Check PM2 logs
pm2 logs workflowpro-backend --lines 100

# Restart application
pm2 restart workflowpro-backend

# Check system resources
htop
df -h
free -m
```

### 2. Database Issues

```bash
# Check MongoDB status
systemctl status mongod

# Check MongoDB logs
tail -f /var/log/mongodb/mongod.log

# Restart MongoDB
systemctl restart mongod
```

### 3. High Traffic

```bash
# Scale PM2 instances
pm2 scale workflowpro-backend +2

# Monitor performance
pm2 monit
```

## 📈 Performance Optimization

### 1. Frontend Optimization

```bash
# Analyze bundle size
cd frontend
npm run build
npx source-map-explorer build/static/js/*.js

# Enable compression in Nginx (already configured above)
```

### 2. Backend Optimization

```typescript
// Enable compression
import compression from 'compression';
app.use(compression());

// Database indexing
// Add indexes to frequently queried fields in MongoDB
```

### 3. CDN Setup (Optional)

- Cloudflare (free tier available)
- AWS CloudFront
- DigitalOcean Spaces CDN

## ✅ Post-Deployment Checklist

- [ ] Application is accessible via domain
- [ ] SSL certificate is active and valid
- [ ] Environment variables are configured
- [ ] Database connection is working
- [ ] All API endpoints are responding
- [ ] Email sending is functional
- [ ] Scheduled jobs are running
- [ ] Monitoring is active
- [ ] Backups are configured
- [ ] Error logging is working
- [ ] Rate limiting is enabled
- [ ] Security headers are set
- [ ] DNS records are correct
- [ ] Firewall rules are configured
- [ ] PM2 auto-restart is working
- [ ] Test all workflow nodes
- [ ] Verify webhook triggers
- [ ] Check email delivery logs

## 🔄 Update & Maintenance

### Rolling Updates

```bash
# Pull latest code
git pull origin main

# Install dependencies
pnpm install

# Build
cd backend && npm run build
cd ../frontend && npm run build

# Restart with zero downtime
pm2 reload ecosystem.config.js

# Or with Docker
docker-compose up -d --build --no-deps backend
docker-compose up -d --build --no-deps frontend
```

### Database Migrations

```bash
# Create migration scripts in backend/migrations/
# Run before deploying code changes
node dist/migrations/migrate-up.js
```

## 📞 Support & Troubleshooting

### Common Issues

1. **"Cannot connect to MongoDB"**
   - Check MONGODB_URI in .env
   - Verify network access in MongoDB Atlas
   - Check firewall rules

2. **"Port already in use"**
   ```bash
   # Find process using port 5000
   lsof -i :5000
   # Kill process
   kill -9 <PID>
   ```

3. **"Frontend shows API errors"**
   - Verify CORS configuration
   - Check API_BASE_URL in frontend config
   - Verify backend is running

4. **"Scheduled jobs not running"**
   - Check job scheduler initialization
   - Verify MongoDB connection
   - Check scheduled_jobs.json
   - Review delivery logs

### Rollback Procedure

```bash
# Using Git
git checkout v1.0.0  # previous version tag
pm2 reload ecosystem.config.js

# Using Docker
docker-compose down
docker-compose up -d --build  # rebuild from previous code

# Restore database (if needed)
mongorestore --uri="..." /backups/20260214
```

---

## 📚 Additional Resources

- [WorkflowPro Documentation](./README.md)
- [Node Implementation Guide](./NODE_IMPLEMENTATIONS.md)
- [Quick Start Guide](./QUICKSTART.md)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [MongoDB Production Notes](https://docs.mongodb.com/manual/administration/production-notes/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

**Last Updated:** February 2026
**Version:** 1.0.0
