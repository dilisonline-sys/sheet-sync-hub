-- DB Monitor Initial Database Schema
-- This script runs automatically when PostgreSQL container starts for the first time

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- ENUM TYPES
-- ============================================================================

CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');
CREATE TYPE app_role AS ENUM ('admin', 'user');
CREATE TYPE check_status AS ENUM ('pass', 'fail', 'warning', 'not_checked');
CREATE TYPE database_type AS ENUM (
  'primary', 'standby', 'archive', 'gis', 
  'oem', 'pilot', 'audit_vault', 'firewall'
);

-- ============================================================================
-- TABLES
-- ============================================================================

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  approval_status approval_status DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User roles table
CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- Databases table
CREATE TABLE databases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  type database_type NOT NULL,
  host VARCHAR(255),
  port INTEGER DEFAULT 1521,
  service_name VARCHAR(255),
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Check types table
CREATE TABLE check_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(50) NOT NULL CHECK (category IN ('daily', 'weekly')),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily checks table
CREATE TABLE daily_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  check_type_id UUID REFERENCES check_types(id) ON DELETE CASCADE,
  check_date DATE NOT NULL,
  status check_status DEFAULT 'not_checked',
  value TEXT,
  notes TEXT,
  checked_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Weekly checks table
CREATE TABLE weekly_checks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  check_type_id UUID REFERENCES check_types(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL CHECK (week_number BETWEEN 1 AND 53),
  year INTEGER NOT NULL,
  status check_status DEFAULT 'not_checked',
  value TEXT,
  notes TEXT,
  checked_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Schema sizes table
CREATE TABLE schema_sizes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  schema_name VARCHAR(255) NOT NULL,
  size_mb DECIMAL(15, 2),
  record_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tablespace usage table
CREATE TABLE tablespace_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  database_id UUID REFERENCES databases(id) ON DELETE CASCADE,
  tablespace_name VARCHAR(255) NOT NULL,
  total_mb DECIMAL(15, 2),
  used_mb DECIMAL(15, 2),
  free_mb DECIMAL(15, 2),
  used_percent DECIMAL(5, 2),
  record_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sheet imports table
CREATE TABLE sheet_imports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name VARCHAR(255) NOT NULL,
  import_type VARCHAR(50) NOT NULL,
  rows_imported INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'pending',
  error_message TEXT,
  imported_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit log table
CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(255) NOT NULL,
  table_name VARCHAR(255),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approval_status ON users(approval_status);
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);

CREATE INDEX idx_databases_type ON databases(type);
CREATE INDEX idx_databases_is_active ON databases(is_active);

CREATE INDEX idx_check_types_database_id ON check_types(database_id);
CREATE INDEX idx_check_types_category ON check_types(category);

CREATE INDEX idx_daily_checks_database_id ON daily_checks(database_id);
CREATE INDEX idx_daily_checks_check_date ON daily_checks(check_date);
CREATE INDEX idx_daily_checks_status ON daily_checks(status);
CREATE INDEX idx_daily_checks_composite ON daily_checks(database_id, check_date);

CREATE INDEX idx_weekly_checks_database_id ON weekly_checks(database_id);
CREATE INDEX idx_weekly_checks_week ON weekly_checks(week_number, year);

CREATE INDEX idx_schema_sizes_database_id ON schema_sizes(database_id);
CREATE INDEX idx_schema_sizes_record_date ON schema_sizes(record_date);

CREATE INDEX idx_tablespace_usage_database_id ON tablespace_usage(database_id);
CREATE INDEX idx_tablespace_usage_record_date ON tablespace_usage(record_date);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_created_at ON audit_log(created_at);
CREATE INDEX idx_audit_log_action ON audit_log(action);

-- ============================================================================
-- DEFAULT ADMIN USER
-- Password: admin123 (BCrypt hash - CHANGE IN PRODUCTION!)
-- ============================================================================

INSERT INTO users (email, password_hash, name, approval_status)
VALUES ('admin@dbmonitor.local', '$2b$10$rKN3xLxj.T9yQ5W5u8K.AOu3YzS5B.T.9X5K5u8K.AOu3YzS5B.T.9', 'System Administrator', 'approved');

INSERT INTO user_roles (user_id, role)
SELECT id, 'admin' FROM users WHERE email = 'admin@dbmonitor.local';

-- ============================================================================
-- DEFAULT DATABASE ENTRIES
-- ============================================================================

INSERT INTO databases (name, type, description) VALUES
('CNC-PRIMARY', 'primary', 'Primary Production Database'),
('CNC-STANDBY', 'standby', 'Standby Disaster Recovery Database'),
('OEM', 'oem', 'Oracle Enterprise Manager Database'),
('AUDIT-VAULT', 'audit_vault', 'Audit Vault Database'),
('GIS-DB', 'gis', 'Geographic Information System Database');

-- ============================================================================
-- DEFAULT CHECK TYPES
-- ============================================================================

-- Daily checks for all databases
INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'Alert Log Check', 'daily', id, 1 FROM databases;

INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'Backup Status', 'daily', id, 2 FROM databases;

INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'Tablespace Usage', 'daily', id, 3 FROM databases;

INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'ASM Disk Group', 'daily', id, 4 FROM databases;

INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'Database Status', 'daily', id, 5 FROM databases;

-- Weekly checks for all databases
INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'RMAN Backup Validation', 'weekly', id, 1 FROM databases;

INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'Statistics Gathering', 'weekly', id, 2 FROM databases;

INSERT INTO check_types (name, category, database_id, sort_order)
SELECT 'Index Rebuild Check', 'weekly', id, 3 FROM databases;

COMMIT;
