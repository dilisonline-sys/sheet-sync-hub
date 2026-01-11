# On-Premises Deployment Guide for DB Monitor

This comprehensive guide covers everything needed to deploy DB Monitor on your internal servers.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Required Software](#required-software)
3. [Installation Methods](#installation-methods)
   - [Docker Deployment (Recommended)](#docker-deployment-recommended)
   - [Manual Installation](#manual-installation)
4. [Configuration](#configuration)
5. [SSL/TLS Setup](#ssltls-setup)
6. [Firewall Configuration](#firewall-configuration)
7. [Backup and Recovery](#backup-and-recovery)
8. [Monitoring and Logging](#monitoring-and-logging)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements

| Component | Specification |
|-----------|---------------|
| **CPU** | 2 cores |
| **RAM** | 4 GB |
| **Storage** | 20 GB SSD |
| **OS** | Linux (Ubuntu 20.04+, RHEL 8+, CentOS 8+) |

### Recommended Requirements

| Component | Specification |
|-----------|---------------|
| **CPU** | 4+ cores |
| **RAM** | 8 GB+ |
| **Storage** | 50 GB+ SSD |
| **OS** | Ubuntu 22.04 LTS or RHEL 9 |

---

## Required Software

### For Docker Deployment

| Software | Version | Purpose |
|----------|---------|---------|
| **Docker** | 24.0+ | Container runtime |
| **Docker Compose** | 2.20+ | Container orchestration |

### For Manual Deployment

| Software | Version | Purpose |
|----------|---------|---------|
| **Node.js** | 20 LTS | Backend runtime |
| **npm** | 10+ | Package manager |
| **PostgreSQL** | 16 | Database server |
| **Nginx** | 1.24+ | Reverse proxy & static files |
| **PM2** | 5+ | Process manager (optional) |

---

## Installation Methods

### Docker Deployment (Recommended)

Docker provides the simplest and most consistent deployment experience.

#### Step 1: Install Docker

**Ubuntu/Debian:**
```bash
# Update package index
sudo apt update

# Install prerequisites
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker's official GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker
```

**RHEL/CentOS:**
```bash
# Remove old versions
sudo dnf remove -y docker docker-client docker-client-latest docker-common docker-latest

# Install prerequisites
sudo dnf install -y dnf-plugins-core

# Add Docker repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER
```

#### Step 2: Deploy DB Monitor

```bash
# Clone or copy the deployment files
cd /opt
sudo mkdir dbmonitor
sudo chown $USER:$USER dbmonitor
cd dbmonitor

# Copy the deploy folder from the project
# (or extract from the deployment package)
cp -r /path/to/project/deploy .

# Navigate to docker directory
cd deploy/docker

# Create environment file from template
cp .env.example .env

# Edit configuration (IMPORTANT: Change default passwords!)
nano .env
```

**Required `.env` changes:**
```bash
# CHANGE THESE VALUES!
DB_PASSWORD=your_secure_database_password_here
JWT_SECRET=your_very_long_jwt_secret_minimum_32_characters_here

# Set your server's IP or hostname
VITE_API_URL=http://your-server-ip:3001/api
CORS_ORIGIN=http://your-server-ip
```

#### Step 3: Start Services

```bash
# Build and start all containers
docker compose up -d --build

# Check status
docker compose ps

# View logs
docker compose logs -f
```

#### Step 4: Verify Installation

```bash
# Check API health
curl http://localhost:3001/api/health

# Access frontend
# Open browser to http://your-server-ip
```

**Default Login:**
- Email: `admin@dbmonitor.local`
- Password: `admin123` (CHANGE IMMEDIATELY!)

---

### Manual Installation

For environments where Docker is not available.

#### Step 1: Install PostgreSQL

**Ubuntu/Debian:**
```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE db_monitor;
CREATE USER db_monitor_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE db_monitor TO db_monitor_user;
\c db_monitor
GRANT ALL ON SCHEMA public TO db_monitor_user;
EOF
```

**RHEL/CentOS:**
```bash
# Install PostgreSQL
sudo dnf install -y postgresql-server postgresql-contrib

# Initialize database
sudo postgresql-setup --initdb

# Start and enable
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Configure authentication (edit pg_hba.conf)
sudo nano /var/lib/pgsql/data/pg_hba.conf
# Change "ident" to "md5" for local connections

sudo systemctl restart postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE db_monitor;
CREATE USER db_monitor_user WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE db_monitor TO db_monitor_user;
\c db_monitor
GRANT ALL ON SCHEMA public TO db_monitor_user;
EOF
```

#### Step 2: Run Database Migration

```bash
# Run the initial schema
psql -U db_monitor_user -d db_monitor -h localhost -f deploy/docker/init-db/01-init.sql
```

#### Step 3: Install Node.js

```bash
# Using NodeSource repository (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Using NodeSource repository (RHEL/CentOS)
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
sudo dnf install -y nodejs

# Verify installation
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

#### Step 4: Setup Backend

```bash
# Create application directory
sudo mkdir -p /opt/dbmonitor/backend
sudo chown -R $USER:$USER /opt/dbmonitor

# Copy backend files
cp -r deploy/backend/* /opt/dbmonitor/backend/

# Install dependencies
cd /opt/dbmonitor/backend
npm install --production

# Create environment file
cat > .env << EOF
NODE_ENV=production
PORT=3001

DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_monitor
DB_USER=db_monitor_user
DB_PASSWORD=your_secure_password

JWT_SECRET=your_very_long_jwt_secret_minimum_32_characters
JWT_EXPIRES_IN=24h

CORS_ORIGIN=http://your-server-ip
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
EOF
```

#### Step 5: Install PM2 and Start Backend

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start the backend
cd /opt/dbmonitor/backend
pm2 start server.js --name dbmonitor-backend

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions printed by the command
```

#### Step 6: Build Frontend

```bash
# Navigate to project root
cd /path/to/project

# Install dependencies
npm install

# Create production environment file
cat > .env.production << EOF
VITE_API_URL=http://your-server-ip:3001/api
VITE_API_ENABLED=true
EOF

# Build for production
npm run build

# Copy built files
sudo mkdir -p /var/www/dbmonitor
sudo cp -r dist/* /var/www/dbmonitor/
```

#### Step 7: Configure Nginx

```bash
# Install Nginx
sudo apt install -y nginx  # Ubuntu/Debian
# OR
sudo dnf install -y nginx  # RHEL/CentOS

# Create Nginx configuration
sudo nano /etc/nginx/sites-available/dbmonitor
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-server-ip;

    root /var/www/dbmonitor;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml;

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API proxy (optional - if frontend and backend on same server)
    location /api {
        proxy_pass http://localhost:3001;
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
sudo ln -s /etc/nginx/sites-available/dbmonitor /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

---

## Configuration

### Environment Variables Reference

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | localhost | PostgreSQL host |
| `DB_PORT` | 5432 | PostgreSQL port |
| `DB_NAME` | db_monitor | Database name |
| `DB_USER` | db_monitor_user | Database user |
| `DB_PASSWORD` | - | Database password (REQUIRED) |
| `JWT_SECRET` | - | JWT signing secret (REQUIRED, min 32 chars) |
| `JWT_EXPIRES_IN` | 24h | Token expiration time |
| `CORS_ORIGIN` | http://localhost | Allowed CORS origin |
| `RATE_LIMIT_MAX` | 100 | Max requests per window |
| `VITE_API_URL` | - | Backend API URL for frontend |

---

## SSL/TLS Setup

### Using Let's Encrypt (Public servers)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
```

### Using Self-Signed Certificate (Internal servers)

```bash
# Generate self-signed certificate
sudo mkdir -p /etc/ssl/dbmonitor
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout /etc/ssl/dbmonitor/key.pem \
    -out /etc/ssl/dbmonitor/cert.pem \
    -subj "/C=AE/ST=Dubai/L=Dubai/O=Organization/CN=dbmonitor.local"
```

Update Nginx configuration:
```nginx
server {
    listen 443 ssl;
    server_name your-server-ip;

    ssl_certificate /etc/ssl/dbmonitor/cert.pem;
    ssl_certificate_key /etc/ssl/dbmonitor/key.pem;

    # ... rest of configuration
}

server {
    listen 80;
    server_name your-server-ip;
    return 301 https://$host$request_uri;
}
```

---

## Firewall Configuration

### UFW (Ubuntu)

```bash
# Allow required ports
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # Backend API (if accessed directly)
sudo ufw allow 22/tcp    # SSH

# Enable firewall
sudo ufw enable
sudo ufw status
```

### firewalld (RHEL/CentOS)

```bash
# Allow required ports
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3001/tcp

# Reload firewall
sudo firewall-cmd --reload
sudo firewall-cmd --list-all
```

---

## Backup and Recovery

### Automated Database Backup

Create backup script:
```bash
sudo nano /opt/dbmonitor/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/opt/dbmonitor/backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/db_monitor_$DATE.sql.gz"

# Create backup directory
mkdir -p $BACKUP_DIR

# Backup database
PGPASSWORD="your_db_password" pg_dump -U db_monitor_user -h localhost db_monitor | gzip > $BACKUP_FILE

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_FILE"
```

```bash
# Make executable
chmod +x /opt/dbmonitor/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add: 0 2 * * * /opt/dbmonitor/backup.sh >> /var/log/dbmonitor-backup.log 2>&1
```

### Restore from Backup

```bash
# Stop the backend
pm2 stop dbmonitor-backend
# OR: docker compose stop backend

# Restore database
gunzip -c /opt/dbmonitor/backups/db_monitor_YYYYMMDD_HHMMSS.sql.gz | \
    psql -U db_monitor_user -h localhost db_monitor

# Start the backend
pm2 start dbmonitor-backend
# OR: docker compose start backend
```

---

## Monitoring and Logging

### View Logs

**Docker:**
```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f postgres
```

**PM2:**
```bash
# View logs
pm2 logs dbmonitor-backend

# Monitor processes
pm2 monit
```

### Health Check Endpoint

```bash
# Check API health
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"...","databaseName":"db_monitor"}
```

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Database connection failed | Check `DB_PASSWORD`, ensure PostgreSQL is running |
| CORS errors | Verify `CORS_ORIGIN` matches frontend URL |
| 502 Bad Gateway | Backend not running, check PM2/Docker logs |
| JWT errors | Ensure `JWT_SECRET` is set and consistent |
| Frontend not loading | Check Nginx config, verify build files exist |

### Debug Commands

```bash
# Check service status
systemctl status postgresql
systemctl status nginx
pm2 status

# Check ports in use
ss -tlnp | grep -E '80|443|3001|5432'

# Check Docker containers
docker compose ps
docker compose logs --tail=100
```

---

## Quick Reference Card

### Docker Commands
```bash
docker compose up -d          # Start all services
docker compose down           # Stop all services
docker compose restart        # Restart all services
docker compose logs -f        # View logs
docker compose ps            # Check status
```

### PM2 Commands
```bash
pm2 start server.js          # Start backend
pm2 stop dbmonitor-backend   # Stop backend
pm2 restart dbmonitor-backend # Restart backend
pm2 logs                     # View logs
pm2 monit                    # Real-time monitoring
```

### Service Endpoints
| Service | URL |
|---------|-----|
| Frontend | http://your-server:80 |
| Backend API | http://your-server:3001/api |
| Health Check | http://your-server:3001/api/health |

---

## Support

For issues and support:
1. Check the troubleshooting section above
2. Review logs for error messages
3. Ensure all environment variables are configured correctly
4. Verify network connectivity between services
