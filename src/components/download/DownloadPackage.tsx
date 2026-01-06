import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { Download, Package, FileCode, Database, FileText, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

// File contents for the backend package
const FILES = {
  'README.md': `# DB Monitor - DPCCC Database Monitoring Dashboard

## Self-Hosted Backend Setup Guide

This guide provides complete instructions for setting up the backend infrastructure for the DB Monitor application on your internal servers.

---

## Quick Start

1. Install PostgreSQL 14+ and Node.js 18+
2. Create database: \`createdb db_monitor\`
3. Run migrations: \`psql -d db_monitor -f migrations/001_initial_schema.sql\`
4. Copy \`.env.example\` to \`.env\` and configure
5. Install dependencies: \`npm install\`
6. Start server: \`npm start\`

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

\`\`\`
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
\`\`\`

---

## PostgreSQL Database Setup

### 1. Install PostgreSQL

**Ubuntu/Debian:**
\`\`\`bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

**CentOS/RHEL:**
\`\`\`bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
\`\`\`

**Windows:**
Download and install from https://www.postgresql.org/download/windows/

### 2. Create Database and User

\`\`\`bash
sudo -u postgres psql
\`\`\`

\`\`\`sql
CREATE DATABASE db_monitor;
CREATE USER db_monitor_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE db_monitor TO db_monitor_user;
\\c db_monitor
GRANT ALL ON SCHEMA public TO db_monitor_user;
\`\`\`

### 3. Run Database Migrations

\`\`\`bash
psql -U db_monitor_user -d db_monitor -f migrations/001_initial_schema.sql
\`\`\`

---

## Node.js Backend Setup

### 1. Install Node.js

\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment

\`\`\`bash
cp .env.example .env
# Edit .env with your configuration
\`\`\`

### 4. Start the Server

\`\`\`bash
# Development
npm run dev

# Production
npm start
\`\`\`

---

## Deployment Guide

### Option 1: PM2 (Recommended)

\`\`\`bash
npm install -g pm2
pm2 start src/server.js --name db-monitor-api
pm2 save
pm2 startup
\`\`\`

### Option 2: Docker

\`\`\`bash
docker-compose up -d
\`\`\`

---

## Creating First Admin User

After initial setup:

\`\`\`sql
-- Register via API, then run:
UPDATE users SET approval_status = 'approved' WHERE email = 'admin@yourdomain.com';
INSERT INTO user_roles (user_id, role) SELECT id, 'admin' FROM users WHERE email = 'admin@yourdomain.com';
\`\`\`

---

## Security Recommendations

1. Use HTTPS with SSL certificates
2. Configure firewall for internal access only
3. Use strong database passwords
4. Keep Node.js and PostgreSQL updated
5. Implement regular database backups

---

*Document Version: 1.0 | Last Updated: January 2025*
`,

  'package.json': `{
  "name": "db-monitor-backend",
  "version": "1.0.0",
  "description": "DPCCC Database Monitoring Backend API",
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
  },
  "engines": {
    "node": ">=18.0.0"
  }
}
`,

  '.env.example': `# Server Configuration
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
`,

  'src/server.js': `// ============================================
// DB Monitor Backend - Express Server
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================
// Database Connection
// ============================================

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Database connection failed:', err.message);
  } else {
    console.log('Database connected successfully');
  }
});

// ============================================
// Middleware
// ============================================

app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
});
app.use('/api/', limiter);

// ============================================
// Auth Middleware
// ============================================

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

const requireAdmin = async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT role FROM user_roles WHERE user_id = $1 AND role = $2',
      [req.user.id, 'admin']
    );
    
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
};

// ============================================
// Auth Routes
// ============================================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email.toLowerCase()]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      \`INSERT INTO users (email, password_hash, name, approval_status)
       VALUES ($1, $2, $3, 'pending')
       RETURNING id, email, name, approval_status, created_at\`,
      [email.toLowerCase(), passwordHash, name]
    );

    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [result.rows[0].id, 'user']
    );

    res.status(201).json({
      message: 'Registration successful. Your account is pending approval.',
      user: result.rows[0]
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      \`SELECT u.*, ur.role 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.email = $1\`,
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.approval_status === 'pending') {
      return res.status(403).json({ error: 'Account pending approval' });
    }

    if (user.approval_status === 'rejected') {
      return res.status(403).json({ error: 'Account access denied' });
    }

    await pool.query(
      'UPDATE users SET last_login = NOW() WHERE id = $1',
      [user.id]
    );

    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        approvalStatus: user.approval_status
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      \`SELECT u.id, u.email, u.name, u.approval_status, u.created_at, u.last_login, ur.role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       WHERE u.id = $1\`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

// ============================================
// User Management Routes (Admin Only)
// ============================================

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      \`SELECT u.id, u.email, u.name, u.approval_status, u.created_at, u.last_login, ur.role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       ORDER BY u.created_at DESC\`
    );
    res.json({ users: result.rows });
  } catch (error) {
    console.error('List users error:', error);
    res.status(500).json({ error: 'Failed to list users' });
  }
});

app.put('/api/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      \`UPDATE users SET approval_status = 'approved', updated_at = NOW()
       WHERE id = $1 RETURNING id, email, name, approval_status\`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User approved', user: result.rows[0] });
  } catch (error) {
    console.error('Approve user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.put('/api/users/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      \`UPDATE users SET approval_status = 'rejected', updated_at = NOW()
       WHERE id = $1 RETURNING id, email, name, approval_status\`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'User rejected', user: result.rows[0] });
  } catch (error) {
    console.error('Reject user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// ============================================
// Database Routes
// ============================================

app.get('/api/databases', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM databases WHERE is_active = true ORDER BY type, short_name'
    );
    res.json({ databases: result.rows });
  } catch (error) {
    console.error('List databases error:', error);
    res.status(500).json({ error: 'Failed to list databases' });
  }
});

// ============================================
// Daily Checks Routes
// ============================================

app.get('/api/daily-checks', authenticateToken, async (req, res) => {
  try {
    const { databaseId, startDate, endDate } = req.query;
    
    let query = \`
      SELECT dc.*, d.short_name as database_name, ct.name as check_name
      FROM daily_checks dc
      JOIN databases d ON dc.database_id = d.id
      JOIN check_types ct ON dc.check_type_id = ct.id
      WHERE 1=1
    \`;
    const params = [];

    if (databaseId) {
      params.push(databaseId);
      query += \` AND dc.database_id = $\${params.length}\`;
    }

    if (startDate) {
      params.push(startDate);
      query += \` AND dc.check_date >= $\${params.length}\`;
    }

    if (endDate) {
      params.push(endDate);
      query += \` AND dc.check_date <= $\${params.length}\`;
    }

    query += ' ORDER BY dc.check_date DESC, d.short_name, ct.display_order';

    const result = await pool.query(query, params);
    res.json({ dailyChecks: result.rows });
  } catch (error) {
    console.error('List daily checks error:', error);
    res.status(500).json({ error: 'Failed to list daily checks' });
  }
});

// ============================================
// Weekly Checks Routes
// ============================================

app.get('/api/weekly-checks', authenticateToken, async (req, res) => {
  try {
    const { databaseId, year } = req.query;
    
    let query = \`
      SELECT wc.*, d.short_name as database_name
      FROM weekly_checks wc
      JOIN databases d ON wc.database_id = d.id
      WHERE 1=1
    \`;
    const params = [];

    if (databaseId) {
      params.push(databaseId);
      query += \` AND wc.database_id = $\${params.length}\`;
    }

    if (year) {
      params.push(year);
      query += \` AND wc.year = $\${params.length}\`;
    }

    query += ' ORDER BY wc.year DESC, wc.week_number DESC';

    const result = await pool.query(query, params);
    res.json({ weeklyChecks: result.rows });
  } catch (error) {
    console.error('List weekly checks error:', error);
    res.status(500).json({ error: 'Failed to list weekly checks' });
  }
});

// ============================================
// Health Check
// ============================================

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================
// Error Handler
// ============================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================
// Start Server
// ============================================

app.listen(PORT, () => {
  console.log(\`DB Monitor API running on port \${PORT}\`);
  console.log(\`Environment: \${process.env.NODE_ENV || 'development'}\`);
});

module.exports = app;
`,

  'migrations/001_initial_schema.sql': `-- ============================================
-- DB Monitor - Initial Database Schema
-- Version: 1.0
-- Database: PostgreSQL 14+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE check_status AS ENUM ('pass', 'fail', 'warning', 'not_checked');
CREATE TYPE database_type AS ENUM (
  'primary', 'standby', 'archive', 'gis', 'oem', 'pilot', 'audit_vault', 'firewall'
);

-- ============================================
-- USERS TABLE
-- ============================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  approval_status approval_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_login TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approval_status ON users(approval_status);

-- ============================================
-- USER ROLES TABLE
-- ============================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- ============================================
-- DATABASES TABLE
-- ============================================

CREATE TABLE databases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_name VARCHAR(255) NOT NULL,
  short_name VARCHAR(50) NOT NULL,
  instance_name VARCHAR(100) NOT NULL,
  ip_address VARCHAR(50),
  host_name VARCHAR(100),
  vcpu INTEGER,
  ram VARCHAR(50),
  sga VARCHAR(50),
  software_version VARCHAR(100),
  os_version VARCHAR(100),
  type database_type DEFAULT 'primary',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_databases_type ON databases(type);
CREATE INDEX idx_databases_is_active ON databases(is_active);

-- ============================================
-- CHECK TYPES TABLE
-- ============================================

CREATE TABLE check_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  applicable_database_types database_type[] DEFAULT '{}',
  is_daily BOOLEAN DEFAULT true,
  is_weekly BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DAILY CHECKS TABLE
-- ============================================

CREATE TABLE daily_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE NOT NULL,
  check_type_id UUID REFERENCES check_types(id) ON DELETE CASCADE NOT NULL,
  check_date DATE NOT NULL,
  status check_status DEFAULT 'not_checked',
  value TEXT,
  comments TEXT,
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (database_id, check_type_id, check_date)
);

CREATE INDEX idx_daily_checks_database_id ON daily_checks(database_id);
CREATE INDEX idx_daily_checks_check_date ON daily_checks(check_date);
CREATE INDEX idx_daily_checks_status ON daily_checks(status);
CREATE INDEX idx_daily_checks_composite ON daily_checks(database_id, check_date);

-- ============================================
-- WEEKLY CHECKS TABLE
-- ============================================

CREATE TABLE weekly_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE NOT NULL,
  week_number INTEGER NOT NULL,
  week_start_date DATE NOT NULL,
  year INTEGER NOT NULL,
  production_db_size VARCHAR(50),
  archive_db_size VARCHAR(50),
  invalid_objects INTEGER,
  instance_start_date VARCHAR(100),
  performed_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (database_id, week_number, year)
);

CREATE INDEX idx_weekly_checks_database_id ON weekly_checks(database_id);
CREATE INDEX idx_weekly_checks_week ON weekly_checks(week_number, year);

-- ============================================
-- SCHEMA SIZES TABLE
-- ============================================

CREATE TABLE schema_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_check_id UUID REFERENCES weekly_checks(id) ON DELETE CASCADE NOT NULL,
  schema_name VARCHAR(100) NOT NULL,
  size_value VARCHAR(50) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_schema_sizes_weekly_check ON schema_sizes(weekly_check_id);

-- ============================================
-- TABLESPACE USAGE TABLE
-- ============================================

CREATE TABLE tablespace_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_check_id UUID REFERENCES weekly_checks(id) ON DELETE CASCADE NOT NULL,
  tablespace_name VARCHAR(100) NOT NULL,
  total_gb DECIMAL(10,2) NOT NULL,
  used_gb DECIMAL(10,2) NOT NULL,
  free_gb DECIMAL(10,2) NOT NULL,
  used_percent INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_tablespace_usage_weekly_check ON tablespace_usage(weekly_check_id);

-- ============================================
-- OBJECTS CREATED TABLE
-- ============================================

CREATE TABLE objects_created (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  weekly_check_id UUID REFERENCES weekly_checks(id) ON DELETE CASCADE NOT NULL,
  object_date DATE NOT NULL,
  user_name VARCHAR(100) NOT NULL,
  object_name VARCHAR(255) NOT NULL,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_objects_created_weekly_check ON objects_created(weekly_check_id);

-- ============================================
-- SHEET IMPORTS TABLE
-- ============================================

CREATE TABLE sheet_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sheet_name VARCHAR(255) NOT NULL,
  sheet_url TEXT,
  import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  imported_by UUID REFERENCES users(id),
  row_count INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  raw_data JSONB
);

CREATE INDEX idx_sheet_imports_status ON sheet_imports(status);
CREATE INDEX idx_sheet_imports_date ON sheet_imports(import_date);

-- ============================================
-- AUDIT LOG TABLE
-- ============================================

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================
-- TRIGGERS
-- ============================================

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_databases_updated_at
  BEFORE UPDATE ON databases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_checks_updated_at
  BEFORE UPDATE ON daily_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_weekly_checks_updated_at
  BEFORE UPDATE ON weekly_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: CHECK TYPES
-- ============================================

INSERT INTO check_types (name, description, applicable_database_types, is_daily, display_order) VALUES
('DB Instance Availability', 'Check if database instance is running', '{primary,standby,archive,gis}', true, 1),
('Alert Log: Errors and Warnings', 'Review alert log for errors', '{primary,standby,archive,gis}', true, 2),
('Active Session Count', 'Monitor active sessions', '{primary,standby,archive,gis}', true, 3),
('DB Full Backup', 'Verify full backup completion', '{primary,standby,archive,gis,oem}', true, 4),
('Archive Log Backup', 'Check archive log backups', '{primary,standby,archive,gis}', true, 5),
('DB Load from OEM', 'Check database load metrics', '{primary,standby,archive,gis}', true, 6),
('DB Jobs', 'Verify database job status', '{primary,standby,archive,gis,oem}', true, 7),
('Check Cluster Services', 'Verify cluster services running', '{primary,standby,archive,gis}', true, 8),
('Check SCAN Services', 'Verify SCAN listener status', '{primary,standby,archive,gis}', true, 9),
('Long Running Queries', 'Identify long-running queries', '{primary,standby,archive,gis,oem}', true, 10),
('Database Locks', 'Check for blocking locks', '{primary,standby,archive,gis}', true, 11),
('Listener Status', 'Verify listener is running', '{primary,standby,archive,gis}', true, 12),
('Connection Test', 'Test database connectivity', '{primary,standby,archive,gis}', true, 13),
('OMS Status', 'Oracle Management Service status', '{oem}', true, 1),
('Repository DB Availability', 'Check OEM repository', '{oem}', true, 2),
('Repository DB Space', 'Monitor repository space', '{oem}', true, 3),
('Management Agents Status', 'Verify agents are up', '{oem}', true, 4),
('Agent Version Validation', 'Check agent versions', '{oem}', true, 5),
('Database Targets Reachable', 'Confirm all targets reachable', '{oem}', true, 6),
('Critical Alerts Review', 'Review critical incidents', '{oem}', true, 7),
('Performance Charts Review', 'Check for anomalies', '{oem}', true, 8),
('Compliance Standards Review', 'Review compliance violations', '{oem}', true, 9),
('Instance Availability', 'Audit Vault availability', '{audit_vault}', true, 1),
('System Status CPU', 'Check CPU usage', '{audit_vault}', true, 2),
('System Status Memory', 'Check memory usage', '{audit_vault}', true, 3),
('System Status Disk Space', 'Check disk space', '{audit_vault}', true, 4),
('Audit Trail Collection', 'Verify audit collection', '{audit_vault}', true, 5),
('Repository Growth Monitoring', 'Monitor repository growth', '{audit_vault}', true, 6),
('Agents Online Status', 'Check agent status', '{audit_vault}', true, 7),
('Agents Collecting Data', 'Verify data collection', '{audit_vault}', true, 8),
('Upload Backlog', 'Check upload backlog', '{audit_vault}', true, 9),
('Upload Connectivity', 'Verify upload connectivity', '{audit_vault}', true, 10),
('Logs Review', 'Review audit logs', '{audit_vault}', true, 11),
('Firewall Policies Active', 'Verify policies active', '{firewall}', true, 2),
('Blocking Rules Validation', 'Check blocking rules', '{firewall}', true, 3),
('Alerting Rules Validation', 'Validate alert rules', '{firewall}', true, 4);

-- ============================================
-- SEED DATA: SAMPLE DATABASES
-- ============================================

INSERT INTO databases (database_name, short_name, instance_name, ip_address, host_name, vcpu, ram, sga, software_version, os_version, type) VALUES
('Control Pro-Database (2-Node RAC)', 'CPRDB', 'CPRDB01', '10.9.176.XX', 'dpcckvmcprdb01', 24, '158 GB', '76 GB', 'Oracle 19c 19.23.0.0 - 64 bit', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'primary'),
('Control Pro-Database (2-Node RAC)', 'CPRDB', 'CPRDB02', '10.9.176.XX', 'dpcckvmcprdb02', 24, '158 GB', '76 GB', 'Oracle 19c 19.23.0.0 - 64 bit', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'primary'),
('Standby-Database (2-Node RAC)', 'CPSDB', 'CPSDB01', '10.9.176.XX', 'dpcckvmcpsdb01', 24, '128 GB', '21 GB', 'Oracle 19c 19.23.0.0 - 64 bit', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'standby'),
('Archive-Database (2-Node RAC)', 'CPADB', 'CPADB01', '10.9.176.XX', 'dpcckvmcpadb01', 24, '158 GB', '20 GB', 'Oracle 19c 19.23.0.0 - 64 bit', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'archive'),
('GIS-Database (2-Node RAC)', 'CPGDB', 'CPGDB01', '10.9.176.XX', 'dpcckvmcpgdb01', 24, '128 GB', NULL, 'Oracle 19c 19.23.0.0 - 64 bit', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'gis'),
('Oracle Enterprise Manager', 'OEMDB', 'CPEMDB01', '10.9.176.XX', 'dpcckvmcpemdb01', 16, '158 GB', '7.5 GB', '13c - 64 bit', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'oem'),
('Audit Vault Server', 'AVS', 'AVSERVER01', '10.9.176.XX', 'dpcckvmavs01', 16, '64 GB', NULL, 'Audit Vault 20.3', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'audit_vault'),
('Database Firewall', 'DBFW', 'DBFW01', '10.9.176.XX', 'dpcckvmdbfw01', 8, '32 GB', NULL, 'Database Firewall 12.2', 'Oracle Enterprise Linux Release 8.9 (64-bit)', 'firewall');

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_monitor_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_monitor_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO db_monitor_user;

-- ============================================
-- END OF MIGRATION
-- ============================================
`,

  'Dockerfile': `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3001

CMD ["node", "src/server.js"]
`,

  'docker-compose.yml': `version: '3.8'

services:
  api:
    build: .
    ports:
      - "3001:3001"
    environment:
      - DATABASE_URL=postgresql://db_monitor_user:password@db:5432/db_monitor
      - JWT_SECRET=your_very_long_random_secret_key_change_this
      - NODE_ENV=production
      - FRONTEND_URL=http://localhost:8080
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:14
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./migrations:/docker-entrypoint-initdb.d
    environment:
      - POSTGRES_DB=db_monitor
      - POSTGRES_USER=db_monitor_user
      - POSTGRES_PASSWORD=password
    restart: unless-stopped

volumes:
  postgres_data:
`,

  '.gitignore': `node_modules/
.env
*.log
.DS_Store
dist/
`,
};

const FILE_LIST = [
  { name: 'README.md', icon: FileText, description: 'Setup documentation' },
  { name: 'package.json', icon: Package, description: 'Node.js dependencies' },
  { name: '.env.example', icon: FileCode, description: 'Environment template' },
  { name: 'src/server.js', icon: FileCode, description: 'Express API server' },
  { name: 'migrations/001_initial_schema.sql', icon: Database, description: 'Database schema' },
  { name: 'Dockerfile', icon: FileCode, description: 'Docker configuration' },
  { name: 'docker-compose.yml', icon: FileCode, description: 'Docker Compose setup' },
  { name: '.gitignore', icon: FileText, description: 'Git ignore rules' },
];

export function DownloadPackage() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const generateZip = async () => {
    setIsGenerating(true);
    setIsComplete(false);

    try {
      const zip = new JSZip();

      // Add all files to the zip
      Object.entries(FILES).forEach(([path, content]) => {
        zip.file(path, content);
      });

      // Generate the zip file
      const blob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });

      // Download the file
      saveAs(blob, 'db-monitor-backend.zip');

      setIsComplete(true);
      toast.success('Download started!', {
        description: 'Your backend package is ready',
      });
    } catch (error) {
      console.error('Error generating zip:', error);
      toast.error('Failed to generate package', {
        description: 'Please try again',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" />
          Backend Package
        </CardTitle>
        <CardDescription>
          Download the complete self-hosted backend package with all configuration files
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* File List */}
        <div className="grid gap-2">
          <p className="text-sm font-medium text-foreground mb-2">Included files:</p>
          {FILE_LIST.map((file) => {
            const Icon = file.icon;
            return (
              <div
                key={file.name}
                className="flex items-center gap-3 p-2 rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-mono text-foreground truncate">{file.name}</p>
                  <p className="text-xs text-muted-foreground">{file.description}</p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Download Button */}
        <Button
          onClick={generateZip}
          disabled={isGenerating}
          className="w-full gap-2"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : isComplete ? (
            <>
              <CheckCircle className="h-4 w-4" />
              Downloaded!
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Download Backend Package
            </>
          )}
        </Button>

        {isComplete && (
          <div className="flex items-center gap-2 p-3 rounded-md bg-success/10 border border-success/20">
            <CheckCircle className="h-4 w-4 text-success" />
            <p className="text-sm text-success">
              Package downloaded! Follow the README.md for setup instructions.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
