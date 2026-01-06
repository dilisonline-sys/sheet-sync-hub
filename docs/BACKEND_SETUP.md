# DB Monitor - DPCCC Database Monitoring Dashboard

## Self-Hosted Backend Setup Guide

This guide provides complete instructions for setting up the backend infrastructure for the DB Monitor application on your internal servers.

---

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Architecture Overview](#architecture-overview)
3. [PostgreSQL Database Setup](#postgresql-database-setup)
4. [Node.js Backend Setup](#nodejs-backend-setup)
5. [API Endpoints](#api-endpoints)
6. [Environment Configuration](#environment-configuration)
7. [Deployment Guide](#deployment-guide)
8. [User Management](#user-management)
9. [Troubleshooting](#troubleshooting)

---

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Storage**: 50 GB SSD
- **Node.js**: v18.0.0 or later
- **PostgreSQL**: v14.0 or later

### Recommended for Production
- **CPU**: 4+ cores
- **RAM**: 8+ GB
- **Storage**: 100+ GB SSD

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (React)                         │
│                    Hosted on nginx/IIS                       │
└─────────────────────┬───────────────────────────────────────┘
                      │ HTTPS
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  Backend API (Node.js)                       │
│                Express.js + JWT Auth                         │
└─────────────────────┬───────────────────────────────────────┘
                      │ TCP/5432
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                PostgreSQL Database                           │
│     Users, Daily Checks, Weekly Checks, Sheet Data          │
└─────────────────────────────────────────────────────────────┘
```

---

## PostgreSQL Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**CentOS/RHEL:**
```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Database and User

```bash
sudo -u postgres psql
```

```sql
-- Create database
CREATE DATABASE db_monitor;

-- Create user with password
CREATE USER db_monitor_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE db_monitor TO db_monitor_user;

-- Connect to database
\c db_monitor

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO db_monitor_user;
```

### 3. Run Database Migrations

Save the following SQL to a file named `001_initial_schema.sql` and execute:

```bash
psql -U db_monitor_user -d db_monitor -f migrations/001_initial_schema.sql
```

See the complete migration file in: `docs/database/migrations/001_initial_schema.sql`

---

## Node.js Backend Setup

### 1. Install Node.js

**Using NodeSource (Recommended):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

**Verify installation:**
```bash
node --version  # Should be v18.x.x
npm --version   # Should be v9.x.x
```

### 2. Project Structure

Create the following folder structure for your backend:

```
backend/
├── src/
│   ├── config/
│   │   └── database.js
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── userController.js
│   │   ├── dailyCheckController.js
│   │   └── weeklyCheckController.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── adminOnly.js
│   ├── models/
│   │   ├── User.js
│   │   ├── UserRole.js
│   │   ├── DailyCheck.js
│   │   └── WeeklyCheck.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── users.js
│   │   ├── dailyChecks.js
│   │   └── weeklyChecks.js
│   └── server.js
├── migrations/
│   └── 001_initial_schema.sql
├── .env.example
├── package.json
└── README.md
```

### 3. Install Dependencies

Create `package.json`:
```json
{
  "name": "db-monitor-backend",
  "version": "1.0.0",
  "description": "DPCCC Database Monitoring Backend",
  "main": "src/server.js",
  "scripts": {
    "start": "node src/server.js",
    "dev": "nodemon src/server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "pg": "^8.11.3",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.2"
  }
}
```

Install:
```bash
npm install
```

---

## Environment Configuration

Create `.env` file:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://db_monitor_user:your_secure_password@localhost:5432/db_monitor
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_monitor
DB_USER=db_monitor_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_very_long_random_secret_key_at_least_32_characters
JWT_EXPIRES_IN=24h

# CORS Configuration
FRONTEND_URL=http://your-internal-server:8080

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | User login |
| POST | `/api/auth/register` | User registration |
| POST | `/api/auth/logout` | User logout |
| GET | `/api/auth/me` | Get current user |

### Users (Admin Only)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List all users |
| GET | `/api/users/pending` | List pending users |
| PUT | `/api/users/:id/approve` | Approve user |
| PUT | `/api/users/:id/reject` | Reject user |
| PUT | `/api/users/:id/role` | Update user role |
| DELETE | `/api/users/:id` | Delete user |

### Daily Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/daily-checks` | List all daily checks |
| GET | `/api/daily-checks/:databaseId` | Get checks by database |
| POST | `/api/daily-checks` | Create daily check |
| PUT | `/api/daily-checks/:id` | Update daily check |

### Weekly Checks
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/weekly-checks` | List all weekly checks |
| GET | `/api/weekly-checks/:databaseId` | Get checks by database |
| POST | `/api/weekly-checks` | Create weekly check |
| PUT | `/api/weekly-checks/:id` | Update weekly check |

### Databases
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/databases` | List all databases |
| POST | `/api/databases` | Add database |
| PUT | `/api/databases/:id` | Update database |
| DELETE | `/api/databases/:id` | Remove database |

---

## Deployment Guide

### Option 1: PM2 (Recommended for Linux)

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start src/server.js --name db-monitor-api

# Save PM2 process list
pm2 save

# Setup startup script
pm2 startup
```

### Option 2: systemd Service

Create `/etc/systemd/system/db-monitor.service`:

```ini
[Unit]
Description=DB Monitor Backend API
After=network.target postgresql.service

[Service]
Type=simple
User=nodejs
WorkingDirectory=/opt/db-monitor/backend
ExecStart=/usr/bin/node src/server.js
Restart=on-failure
RestartSec=10
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable db-monitor
sudo systemctl start db-monitor
```

### Option 3: Docker

Create `Dockerfile`:

```dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
```

Create `docker-compose.yml`:

```yaml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://db_monitor_user:password@db:5432/db_monitor
    depends_on:
      - db

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=db_monitor
      - POSTGRES_USER=db_monitor_user
      - POSTGRES_PASSWORD=password

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up -d
```

---

## User Management

### Creating the First Admin User

After initial setup, create an admin user directly in the database:

```bash
psql -U db_monitor_user -d db_monitor
```

```sql
-- Hash a password (use bcrypt in production)
-- For initial setup, use the API to register, then:

-- First, register a user via the API, then:
UPDATE users 
SET approval_status = 'approved' 
WHERE email = 'admin@yourdomain.com';

-- Add admin role
INSERT INTO user_roles (user_id, role) 
SELECT id, 'admin' FROM users WHERE email = 'admin@yourdomain.com';
```

### User Approval Workflow

1. New user registers via `/auth` page
2. Admin logs in and navigates to User Management
3. Admin reviews pending users
4. Admin approves or rejects users
5. Approved users can now log in

---

## Troubleshooting

### Database Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -U db_monitor_user -d db_monitor -h localhost

# Check logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### API Not Starting

```bash
# Check Node.js version
node --version

# Check for port conflicts
netstat -tlnp | grep 3001

# Check PM2 logs
pm2 logs db-monitor-api
```

### Common Errors

| Error | Solution |
|-------|----------|
| `ECONNREFUSED` | Database not running or wrong credentials |
| `Invalid token` | JWT_SECRET mismatch or expired token |
| `Permission denied` | User not approved or lacking role |

---

## Security Recommendations

1. **Use HTTPS** - Deploy behind nginx with SSL certificates
2. **Firewall** - Only allow internal network access
3. **Strong Passwords** - Use complex passwords for database
4. **Regular Updates** - Keep Node.js and PostgreSQL updated
5. **Backup** - Implement regular database backups
6. **Audit Logs** - Enable PostgreSQL logging
7. **Rate Limiting** - Already configured in the backend

---

## Support

For issues or questions, contact your database administration team.

---

*Document Version: 1.0 | Last Updated: January 2025*
