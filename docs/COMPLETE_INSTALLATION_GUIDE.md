# DB Monitor - Complete Installation Guide

**Version:** 1.0  
**Last Updated:** January 2025

This document provides a complete, step-by-step guide for installing and configuring the DB Monitor application on-premises.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Prerequisites](#2-prerequisites)
3. [System Requirements](#3-system-requirements)
4. [Installation Methods](#4-installation-methods)
5. [Method A: Docker Installation (Recommended)](#5-method-a-docker-installation-recommended)
6. [Method B: Manual Installation](#6-method-b-manual-installation)
7. [Post-Installation Configuration](#7-post-installation-configuration)
8. [SSL/TLS Configuration](#8-ssltls-configuration)
9. [Firewall Configuration](#9-firewall-configuration)
10. [Backup and Recovery](#10-backup-and-recovery)
11. [Monitoring and Maintenance](#11-monitoring-and-maintenance)
12. [Troubleshooting](#12-troubleshooting)
13. [Quick Reference](#13-quick-reference)

---

## 1. Overview

DB Monitor is an internal web application for monitoring and tracking database health checks. The application consists of three main components:

| Component | Technology | Purpose |
|-----------|------------|---------|
| **Frontend** | React + Vite + TypeScript | User interface |
| **Backend** | Node.js + Express.js | REST API server |
| **Database** | PostgreSQL 14+ | Data persistence |

### Architecture Diagram

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│                 │     │                 │     │                 │
│    Frontend     │────▶│     Backend     │────▶│   PostgreSQL    │
│   (Nginx:80)    │     │  (Node.js:3001) │     │     (:5432)     │
│                 │     │                 │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
       │                        │                       │
       └────────────────────────┴───────────────────────┘
                         Docker Network
```

---

## 2. Prerequisites

### Required Software

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| **Docker** | 24.0+ | Container runtime |
| **Docker Compose** | 2.20+ | Container orchestration |
| **Git** | 2.30+ | Source code management |

### For Manual Installation (Alternative)

| Software | Minimum Version | Purpose |
|----------|-----------------|---------|
| **Node.js** | 18.0+ | JavaScript runtime |
| **npm** | 9.0+ | Package manager |
| **PostgreSQL** | 14+ | Database server |
| **Nginx** | 1.20+ | Web server |
| **PM2** | 5.0+ | Process manager |

### Network Requirements

| Port | Service | Description |
|------|---------|-------------|
| 80 | HTTP | Frontend web server |
| 443 | HTTPS | Frontend (with SSL) |
| 3001 | Backend API | REST API server |
| 5432 | PostgreSQL | Database (internal only) |

---

## 3. System Requirements

### Minimum Specifications

| Resource | Requirement |
|----------|-------------|
| **CPU** | 2 cores |
| **RAM** | 4 GB |
| **Storage** | 20 GB SSD |
| **OS** | Ubuntu 20.04+, RHEL 8+, Debian 11+ |

### Recommended Specifications

| Resource | Requirement |
|----------|-------------|
| **CPU** | 4 cores |
| **RAM** | 8 GB |
| **Storage** | 50 GB SSD |
| **OS** | Ubuntu 22.04 LTS |

---

## 4. Installation Methods

Choose one of the following installation methods:

| Method | Complexity | Best For |
|--------|------------|----------|
| **Docker (Recommended)** | Low | Quick deployment, standard environments |
| **Manual** | Medium-High | Custom configurations, no Docker available |

---

## 5. Method A: Docker Installation (Recommended)

### Step 1: Install Docker

#### Ubuntu/Debian

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y apt-transport-https ca-certificates curl gnupg lsb-release

# Add Docker GPG key
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

# Add Docker repository
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# Install Docker Engine
sudo apt update
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Add current user to docker group
sudo usermod -aG docker $USER

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Log out and back in for group changes to take effect
```

#### RHEL/CentOS/Rocky Linux

```bash
# Install required packages
sudo dnf install -y dnf-plugins-core

# Add Docker repository
sudo dnf config-manager --add-repo https://download.docker.com/linux/centos/docker-ce.repo

# Install Docker Engine
sudo dnf install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# Start and enable Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add current user to docker group
sudo usermod -aG docker $USER
```

#### Verify Installation

```bash
docker --version
docker compose version
```

### Step 2: Clone the Repository

```bash
# Create application directory
sudo mkdir -p /opt/dbmonitor
sudo chown $USER:$USER /opt/dbmonitor
cd /opt/dbmonitor

# Clone the repository (or copy files)
git clone <repository-url> .

# Or if using deployment package:
unzip dbmonitor-deployment-package.zip
```

### Step 3: Configure Environment Variables

```bash
# Navigate to Docker directory
cd deploy/docker

# Copy environment template
cp .env.example .env

# Edit configuration
nano .env
```

**Required Configuration Changes:**

```bash
# =============================================================================
# DATABASE CONFIGURATION (CHANGE THESE!)
# =============================================================================
DB_NAME=db_monitor
DB_USER=db_monitor_user
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE    # CHANGE THIS!
DB_PORT=5432
DB_POOL_MIN=2
DB_POOL_MAX=10

# =============================================================================
# BACKEND CONFIGURATION
# =============================================================================
BACKEND_PORT=3001
NODE_ENV=production

# JWT Configuration (CHANGE THIS!)
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_minimum_32_characters_CHANGE_THIS
JWT_EXPIRES_IN=24h

# CORS - Set to your frontend URL
CORS_ORIGIN=http://your-server-ip

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# =============================================================================
# FRONTEND CONFIGURATION
# =============================================================================
FRONTEND_PORT=80

# API URL - Use your server's IP or hostname
VITE_API_URL=http://your-server-ip:3001/api
```

### Step 4: Build and Start Containers

```bash
# Build and start all services
docker compose up -d --build

# View container status
docker compose ps

# View logs
docker compose logs -f
```

### Step 5: Verify Installation

```bash
# Check all containers are running
docker compose ps

# Expected output:
# NAME                  STATUS
# dbmonitor-postgres    Up (healthy)
# dbmonitor-backend     Up (healthy)
# dbmonitor-frontend    Up (healthy)

# Test backend health
curl http://localhost:3001/api/health

# Test frontend
curl http://localhost/
```

### Step 6: Create Admin User

```bash
# Connect to PostgreSQL container
docker compose exec postgres psql -U db_monitor_user -d db_monitor

# Run the following SQL:
```

```sql
-- Insert admin user (password: Admin@123)
INSERT INTO users (email, password_hash, name, approval_status)
VALUES (
  'admin@yourcompany.com',
  '$2a$10$8K1p/a0dL1LXMIgoEDFrQeGqR6k2F3z4s5e6r7t8u9v0w1x2y3z4A',
  'System Administrator',
  'approved'
);

-- Assign admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@yourcompany.com';

-- Verify
SELECT u.email, u.name, ur.role FROM users u 
JOIN user_roles ur ON u.id = ur.user_id;

-- Exit
\q
```

**Note:** Change the admin password immediately after first login.

---

## 6. Method B: Manual Installation

### Step 1: Install PostgreSQL

#### Ubuntu/Debian

```bash
# Install PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Verify installation
psql --version
```

#### RHEL/CentOS

```bash
# Install PostgreSQL repository
sudo dnf install -y https://download.postgresql.org/pub/repos/yum/reporpms/EL-8-x86_64/pgdg-redhat-repo-latest.noarch.rpm

# Disable built-in module
sudo dnf -qy module disable postgresql

# Install PostgreSQL
sudo dnf install -y postgresql16-server postgresql16

# Initialize database
sudo /usr/pgsql-16/bin/postgresql-16-setup initdb

# Start and enable
sudo systemctl start postgresql-16
sudo systemctl enable postgresql-16
```

### Step 2: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database and user
psql
```

```sql
-- Create application user
CREATE USER db_monitor_user WITH PASSWORD 'YOUR_SECURE_PASSWORD';

-- Create database
CREATE DATABASE db_monitor OWNER db_monitor_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE db_monitor TO db_monitor_user;

-- Exit
\q
```

```bash
# Exit postgres user shell
exit
```

### Step 3: Configure PostgreSQL Authentication

```bash
# Edit pg_hba.conf (location varies by OS)
# Ubuntu: /etc/postgresql/16/main/pg_hba.conf
# RHEL: /var/lib/pgsql/16/data/pg_hba.conf

sudo nano /etc/postgresql/16/main/pg_hba.conf
```

Add the following line before other entries:

```
# Allow application connections
host    db_monitor    db_monitor_user    127.0.0.1/32    scram-sha-256
host    db_monitor    db_monitor_user    ::1/128         scram-sha-256
```

```bash
# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 4: Run Database Migration

```bash
# Navigate to migration directory
cd /opt/dbmonitor/docs/database/migrations

# Run migration script
PGPASSWORD='YOUR_SECURE_PASSWORD' psql -h localhost -U db_monitor_user -d db_monitor -f 001_initial_schema.sql

# Verify tables were created
PGPASSWORD='YOUR_SECURE_PASSWORD' psql -h localhost -U db_monitor_user -d db_monitor -c "\dt"
```

### Step 5: Install Node.js

#### Ubuntu/Debian (Using NodeSource)

```bash
# Install NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Install Node.js
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

#### RHEL/CentOS

```bash
# Install NodeSource repository
curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -

# Install Node.js
sudo dnf install -y nodejs

# Verify installation
node --version
npm --version
```

### Step 6: Install and Configure Backend

```bash
# Navigate to backend directory
cd /opt/dbmonitor/deploy/backend

# Install dependencies
npm install --production

# Create environment file
nano .env
```

**Backend .env file:**

```bash
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_monitor
DB_USER=db_monitor_user
DB_PASSWORD=YOUR_SECURE_PASSWORD
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT Configuration
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_minimum_32_characters
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://your-server-ip

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

### Step 7: Install PM2 and Start Backend

```bash
# Install PM2 globally
sudo npm install -g pm2

# Start backend with PM2
pm2 start server.js --name dbmonitor-backend

# Configure PM2 to start on boot
pm2 startup
# Follow the instructions displayed

pm2 save

# Verify backend is running
pm2 status
curl http://localhost:3001/api/health
```

### Step 8: Build Frontend

```bash
# Navigate to project root
cd /opt/dbmonitor

# Install frontend dependencies
npm install

# Create production environment file
echo "VITE_API_URL=http://your-server-ip:3001/api" > .env.production
echo "VITE_API_ENABLED=true" >> .env.production

# Build frontend
npm run build

# The built files will be in the 'dist' directory
ls -la dist/
```

### Step 9: Install and Configure Nginx

#### Ubuntu/Debian

```bash
# Install Nginx
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### RHEL/CentOS

```bash
# Install Nginx
sudo dnf install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Step 10: Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/dbmonitor
```

**Nginx Configuration:**

```nginx
server {
    listen 80;
    listen [::]:80;
    server_name your-server-ip;  # Or your domain name
    
    root /opt/dbmonitor/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript 
               application/xml application/xml+rss text/javascript;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    # API proxy (optional - if you want to use same domain)
    location /api/ {
        proxy_pass http://localhost:3001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_cache_bypass $http_upgrade;
    }

    # SPA fallback
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Health check
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
```

```bash
# Enable site (Ubuntu/Debian)
sudo ln -s /etc/nginx/sites-available/dbmonitor /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# For RHEL/CentOS, place config in /etc/nginx/conf.d/dbmonitor.conf

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 11: Create Admin User (Manual Installation)

```bash
# Connect to PostgreSQL
psql -h localhost -U db_monitor_user -d db_monitor
```

```sql
-- Insert admin user (password: Admin@123)
INSERT INTO users (email, password_hash, name, approval_status)
VALUES (
  'admin@yourcompany.com',
  '$2a$10$8K1p/a0dL1LXMIgoEDFrQeGqR6k2F3z4s5e6r7t8u9v0w1x2y3z4A',
  'System Administrator',
  'approved'
);

-- Assign admin role
INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@yourcompany.com';

-- Exit
\q
```

---

## 7. Post-Installation Configuration

### Access the Application

1. Open a web browser
2. Navigate to `http://your-server-ip`
3. Login with the admin credentials you created
4. **Change the admin password immediately**

### Initial Setup Tasks

1. **Update Admin Password**
   - Go to Settings → User Management
   - Update the admin user password

2. **Add Databases to Monitor**
   - Go to Settings → Databases
   - Add your database instances

3. **Configure Check Types**
   - Go to Settings → Check Types
   - Customize which checks are applicable

4. **Add Users**
   - Go to User Management
   - Invite team members
   - Approve user registrations

---

## 8. SSL/TLS Configuration

### Using Let's Encrypt (Recommended for Public Access)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx  # Ubuntu/Debian
# OR
sudo dnf install -y certbot python3-certbot-nginx  # RHEL/CentOS

# Obtain certificate
sudo certbot --nginx -d your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Using Self-Signed Certificate (Internal Use)

```bash
# Create SSL directory
sudo mkdir -p /etc/nginx/ssl

# Generate self-signed certificate
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout /etc/nginx/ssl/dbmonitor.key \
  -out /etc/nginx/ssl/dbmonitor.crt \
  -subj "/C=US/ST=State/L=City/O=Organization/CN=your-server-ip"

# Update Nginx configuration to use SSL
sudo nano /etc/nginx/sites-available/dbmonitor
```

**Add SSL configuration:**

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name your-server-ip;

    ssl_certificate /etc/nginx/ssl/dbmonitor.crt;
    ssl_certificate_key /etc/nginx/ssl/dbmonitor.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
    ssl_prefer_server_ciphers off;

    # ... rest of configuration
}

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name your-server-ip;
    return 301 https://$server_name$request_uri;
}
```

---

## 9. Firewall Configuration

### Ubuntu (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Allow backend API (if exposed externally)
sudo ufw allow 3001/tcp

# Check status
sudo ufw status
```

### RHEL/CentOS (firewalld)

```bash
# Start firewalld
sudo systemctl start firewalld
sudo systemctl enable firewalld

# Allow services
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --permanent --add-port=3001/tcp

# Reload
sudo firewall-cmd --reload

# Check status
sudo firewall-cmd --list-all
```

---

## 10. Backup and Recovery

### Automated Database Backup Script

Create the backup script:

```bash
sudo nano /opt/dbmonitor/scripts/backup.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/opt/dbmonitor/backups"
DB_NAME="db_monitor"
DB_USER="db_monitor_user"
RETENTION_DAYS=30
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# For Docker installation:
docker compose -f /opt/dbmonitor/deploy/docker/docker-compose.yml exec -T postgres \
  pg_dump -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# For manual installation:
# PGPASSWORD='your_password' pg_dump -h localhost -U $DB_USER $DB_NAME | gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Remove old backups
find $BACKUP_DIR -name "db_backup_*.sql.gz" -mtime +$RETENTION_DAYS -delete

# Log
echo "$(date): Backup completed - db_backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

```bash
# Make executable
sudo chmod +x /opt/dbmonitor/scripts/backup.sh

# Add to crontab (daily at 2 AM)
sudo crontab -e
# Add: 0 2 * * * /opt/dbmonitor/scripts/backup.sh
```

### Restore from Backup

```bash
# Docker installation
gunzip -c /opt/dbmonitor/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  docker compose -f /opt/dbmonitor/deploy/docker/docker-compose.yml exec -T postgres \
  psql -U db_monitor_user -d db_monitor

# Manual installation
gunzip -c /opt/dbmonitor/backups/db_backup_YYYYMMDD_HHMMSS.sql.gz | \
  PGPASSWORD='your_password' psql -h localhost -U db_monitor_user -d db_monitor
```

---

## 11. Monitoring and Maintenance

### View Logs

#### Docker Installation

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f backend
docker compose logs -f postgres
docker compose logs -f frontend
```

#### Manual Installation

```bash
# Backend logs
pm2 logs dbmonitor-backend

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-16-main.log
```

### Health Check Endpoint

```bash
# Check backend health
curl http://localhost:3001/api/health

# Expected response:
# {"status":"ok","database":"connected","timestamp":"2025-01-16T...","databaseName":"db_monitor"}
```

### Common Maintenance Tasks

```bash
# Docker: Restart all services
docker compose restart

# Docker: Update containers
docker compose pull
docker compose up -d --build

# Manual: Restart backend
pm2 restart dbmonitor-backend

# Manual: Restart Nginx
sudo systemctl restart nginx
```

---

## 12. Troubleshooting

### Common Issues and Solutions

| Issue | Possible Cause | Solution |
|-------|---------------|----------|
| Container won't start | Port conflict | Check `docker compose logs` and change ports |
| Database connection failed | Wrong credentials | Verify `.env` settings |
| Frontend shows blank page | Build failed | Rebuild with `npm run build` |
| API returns 401 | Invalid/expired token | Re-login to get new token |
| CORS errors | Wrong CORS_ORIGIN | Update CORS_ORIGIN in backend |

### Debug Commands

```bash
# Docker: Check container status
docker compose ps
docker compose logs --tail=100

# Docker: Access container shell
docker compose exec backend sh
docker compose exec postgres bash

# Check network connectivity
curl -v http://localhost:3001/api/health

# Check database connection
docker compose exec postgres psql -U db_monitor_user -d db_monitor -c "SELECT 1"

# Check disk space
df -h

# Check memory usage
free -m

# Check process status
ps aux | grep -E "(node|postgres|nginx)"
```

---

## 13. Quick Reference

### Docker Commands

```bash
# Start all services
docker compose up -d

# Stop all services
docker compose down

# View status
docker compose ps

# View logs
docker compose logs -f [service]

# Restart service
docker compose restart [service]

# Rebuild and restart
docker compose up -d --build
```

### Service Endpoints

| Endpoint | URL |
|----------|-----|
| Frontend | http://your-server-ip |
| Backend API | http://your-server-ip:3001/api |
| Health Check | http://your-server-ip:3001/api/health |

### Default Ports

| Service | Port |
|---------|------|
| Frontend (HTTP) | 80 |
| Frontend (HTTPS) | 443 |
| Backend API | 3001 |
| PostgreSQL | 5432 |

### File Locations (Docker)

| File | Location |
|------|----------|
| Docker Compose | `/opt/dbmonitor/deploy/docker/docker-compose.yml` |
| Environment | `/opt/dbmonitor/deploy/docker/.env` |
| Database Init | `/opt/dbmonitor/deploy/docker/init-db/` |

### File Locations (Manual)

| File | Location |
|------|----------|
| Backend | `/opt/dbmonitor/deploy/backend/` |
| Frontend Build | `/opt/dbmonitor/dist/` |
| Nginx Config | `/etc/nginx/sites-available/dbmonitor` |
| PM2 Logs | `~/.pm2/logs/` |
| Database | `/var/lib/postgresql/` |

---

## Support

For additional assistance:
- Review application logs
- Check the troubleshooting section
- Contact your system administrator

---

**End of Installation Guide**
