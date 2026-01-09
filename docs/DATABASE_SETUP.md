# Database Setup Guide

This guide provides complete instructions for setting up the PostgreSQL database for DB Monitor.

## Prerequisites

- PostgreSQL 14 or higher
- Node.js 18+ (for backend server)
- Admin access to PostgreSQL

## Quick Start

### 1. Install PostgreSQL

**Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
```

**CentOS/RHEL:**
```bash
sudo dnf install postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

**Windows:**
Download from https://www.postgresql.org/download/windows/

### 2. Create Database and User

```sql
-- Connect as postgres superuser
sudo -u postgres psql

-- Create database
CREATE DATABASE db_monitor;

-- Create application user
CREATE USER db_monitor_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE db_monitor TO db_monitor_user;

-- Connect to the database
\c db_monitor

-- Grant schema privileges
GRANT ALL ON SCHEMA public TO db_monitor_user;

-- Exit
\q
```

### 3. Run Migration Script

```bash
# Navigate to project root
cd /path/to/db-monitor

# Run the migration
psql -U db_monitor_user -d db_monitor -h localhost -f docs/database/migrations/001_initial_schema.sql
```

## Database Schema Overview

### Tables

| Table | Description |
|-------|-------------|
| `users` | Application users with authentication |
| `user_roles` | User role assignments (admin, user) |
| `databases` | Monitored database instances |
| `check_types` | Types of checks to perform |
| `daily_checks` | Daily database check results |
| `weekly_checks` | Weekly database check summary |
| `schema_sizes` | Schema size tracking |
| `tablespace_usage` | Tablespace utilization data |
| `objects_created` | New database objects tracking |
| `sheet_imports` | Excel/sheet import history |
| `audit_log` | Audit trail for all changes |

### ENUM Types

```sql
-- User approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- User roles
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Check status
CREATE TYPE check_status AS ENUM ('pass', 'fail', 'warning', 'not_checked');

-- Database types
CREATE TYPE database_type AS ENUM (
  'primary', 'standby', 'archive', 'gis', 
  'oem', 'pilot', 'audit_vault', 'firewall'
);
```

### Indexes

All tables include optimized indexes for common queries:

```sql
-- User lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

-- Database filtering
CREATE INDEX idx_databases_type ON databases(type);
CREATE INDEX idx_databases_is_active ON databases(is_active);

-- Daily checks queries
CREATE INDEX idx_daily_checks_database_id ON daily_checks(database_id);
CREATE INDEX idx_daily_checks_check_date ON daily_checks(check_date);
CREATE INDEX idx_daily_checks_status ON daily_checks(status);
CREATE INDEX idx_daily_checks_composite ON daily_checks(database_id, check_date);

-- Weekly checks queries
CREATE INDEX idx_weekly_checks_database_id ON weekly_checks(database_id);
CREATE INDEX idx_weekly_checks_week ON weekly_checks(week_number, year);

-- Audit queries
CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);
```

## Creating the Admin User

After running migrations, create the initial admin user:

```sql
-- Connect to database
psql -U db_monitor_user -d db_monitor

-- Insert admin user (password should be hashed in production)
INSERT INTO users (email, password_hash, name, approval_status)
VALUES ('admin@company.com', '$2b$10$hashedpasswordhere', 'Admin User', 'approved');

-- Get the user ID
SELECT id FROM users WHERE email = 'admin@company.com';

-- Assign admin role (replace UUID with actual user id)
INSERT INTO user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

## Backend Configuration

Create `.env` file in the backend directory:

```env
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=db_monitor
DB_USER=db_monitor_user
DB_PASSWORD=your_secure_password

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10

# JWT Configuration
JWT_SECRET=your_very_long_and_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100
```

## Frontend Configuration

Create `.env` file in the frontend root:

```env
# API Configuration
VITE_API_URL=http://localhost:3001/api
VITE_API_ENABLED=true
```

Or configure via the Settings page in the application.

## Verification

Test the database connection:

```bash
# Test direct connection
psql -U db_monitor_user -d db_monitor -c "SELECT COUNT(*) FROM databases;"

# Test API health endpoint
curl http://localhost:3001/api/health
```

Expected response:
```json
{
  "status": "ok",
  "database": "connected"
}
```

## Backup and Restore

### Create Backup

```bash
pg_dump -U db_monitor_user -d db_monitor -F c -f backup.dump
```

### Restore Backup

```bash
pg_restore -U db_monitor_user -d db_monitor -c backup.dump
```

## Troubleshooting

### Connection Refused

```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check pg_hba.conf for local connections
sudo cat /etc/postgresql/14/main/pg_hba.conf
```

### Permission Denied

```sql
-- Grant all privileges again
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_monitor_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_monitor_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO db_monitor_user;
```

### Password Authentication Failed

Check that the password in `.env` matches the database user password:

```sql
-- Reset user password
ALTER USER db_monitor_user WITH ENCRYPTED PASSWORD 'new_password';
```
