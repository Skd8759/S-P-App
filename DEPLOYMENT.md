# Deployment Guide

This guide will help you deploy the NITK Swimming Pool Booking System to production.

## Prerequisites

- Node.js (v16 or higher)
- MongoDB Atlas account or MongoDB server
- Domain name (optional)
- SSL certificate (recommended)

## Environment Setup

### 1. Production Environment Variables

Create a `.env` file in the backend directory with production values:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/nitk-swimming-pool

# JWT
JWT_SECRET=your-very-long-and-secure-jwt-secret-key-for-production
JWT_EXPIRE=7d

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-production-email@gmail.com
EMAIL_PASS=your-app-password

# Frontend URL
FRONTEND_URL=https://yourdomain.com

# Node Environment
NODE_ENV=production

# Server Port
PORT=5000
```

### 2. MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist your server IP address
5. Get the connection string and update `MONGODB_URI`

### 3. Gmail Configuration

1. Create a dedicated Gmail account for the application
2. Enable 2-Factor Authentication
3. Generate an App Password
4. Update the email credentials in `.env`

## Deployment Options

### Option 1: VPS/Cloud Server (Recommended)

#### Using PM2 for Process Management

1. **Install PM2 globally**:
```bash
npm install -g pm2
```

2. **Build the frontend**:
```bash
npm run build
```

3. **Start the application with PM2**:
```bash
pm2 start backend/server.js --name "nitk-pool-booking"
```

4. **Save PM2 configuration**:
```bash
pm2 save
pm2 startup
```

#### Using Docker (Alternative)

1. **Create Dockerfile**:
```dockerfile
FROM node:16-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY backend/ ./backend/
COPY frontend/dist/ ./frontend/dist/

EXPOSE 5000

CMD ["node", "backend/server.js"]
```

2. **Build and run**:
```bash
docker build -t nitk-pool-booking .
docker run -p 5000:5000 --env-file .env nitk-pool-booking
```

### Option 2: Heroku

1. **Install Heroku CLI**
2. **Create Heroku app**:
```bash
heroku create your-app-name
```

3. **Set environment variables**:
```bash
heroku config:set MONGODB_URI=your-mongodb-uri
heroku config:set JWT_SECRET=your-jwt-secret
heroku config:set EMAIL_USER=your-email
heroku config:set EMAIL_PASS=your-app-password
heroku config:set NODE_ENV=production
```

4. **Deploy**:
```bash
git push heroku main
```

### Option 3: Vercel (Frontend) + Railway/Render (Backend)

#### Frontend on Vercel

1. Connect your GitHub repository to Vercel
2. Set build command: `cd frontend && npm run build`
3. Set output directory: `frontend/dist`
4. Add environment variable: `VITE_API_URL=https://your-backend-url.com`

#### Backend on Railway/Render

1. Connect your GitHub repository
2. Set build command: `npm install`
3. Set start command: `npm start`
4. Add all environment variables

## Nginx Configuration (For VPS)

Create `/etc/nginx/sites-available/nitk-pool-booking`:

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/nitk-pool-booking /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## SSL Certificate (Let's Encrypt)

```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

## Database Initialization

After deployment, initialize the database:

```bash
npm run init-db
```

## Monitoring and Maintenance

### 1. Log Management

```bash
# View PM2 logs
pm2 logs nitk-pool-booking

# View real-time logs
pm2 logs nitk-pool-booking --lines 100
```

### 2. Performance Monitoring

```bash
# Monitor PM2 processes
pm2 monit

# Restart application
pm2 restart nitk-pool-booking
```

### 3. Backup Strategy

Set up regular MongoDB backups:

```bash
# Create backup script
#!/bin/bash
mongodump --uri="your-mongodb-uri" --out="/backup/$(date +%Y%m%d)"
```

## Security Considerations

1. **Change default admin password** after first login
2. **Use strong JWT secrets** (32+ characters)
3. **Enable HTTPS** in production
4. **Regular security updates** for dependencies
5. **Monitor logs** for suspicious activity
6. **Rate limiting** is already implemented
7. **Input validation** is in place

## Performance Optimization

1. **Enable gzip compression** in Nginx
2. **Use CDN** for static assets
3. **Implement caching** for frequently accessed data
4. **Database indexing** for better query performance
5. **Monitor memory usage** and scale accordingly

## Troubleshooting

### Common Issues

1. **Email not sending**: Check Gmail app password and 2FA settings
2. **Database connection failed**: Verify MongoDB URI and network access
3. **Frontend not loading**: Check build process and static file serving
4. **CORS errors**: Verify FRONTEND_URL in environment variables

### Logs Location

- PM2 logs: `~/.pm2/logs/`
- Nginx logs: `/var/log/nginx/`
- Application logs: Check PM2 output

## Scaling

For high traffic:

1. **Load balancing** with multiple PM2 instances
2. **Database clustering** with MongoDB replica sets
3. **CDN integration** for static assets
4. **Redis caching** for session management
5. **Microservices architecture** for complex features

## Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test database connectivity
4. Check network and firewall settings
5. Review security configurations
