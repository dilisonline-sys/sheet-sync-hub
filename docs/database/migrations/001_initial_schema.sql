-- ============================================
-- DB Monitor - Initial Database Schema
-- Version: 1.0
-- Database: PostgreSQL 14+
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- ENUM TYPES
-- ============================================

-- User approval status
CREATE TYPE approval_status AS ENUM ('pending', 'approved', 'rejected');

-- User roles
CREATE TYPE app_role AS ENUM ('admin', 'user');

-- Check status for daily/weekly checks
CREATE TYPE check_status AS ENUM ('pass', 'fail', 'warning', 'not_checked');

-- Database types
CREATE TYPE database_type AS ENUM (
  'primary', 
  'standby', 
  'archive', 
  'gis', 
  'oem', 
  'pilot', 
  'audit_vault', 
  'firewall'
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

-- Index for email lookups
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_approval_status ON users(approval_status);

-- ============================================
-- USER ROLES TABLE (SEPARATE FOR SECURITY)
-- ============================================

CREATE TABLE user_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, role)
);

-- Index for role lookups
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

-- Index for type filtering
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
  
  -- Unique constraint to prevent duplicate entries
  UNIQUE (database_id, check_type_id, check_date)
);

-- Indexes for efficient querying
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
  
  -- Unique constraint
  UNIQUE (database_id, week_number, year)
);

-- Indexes
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
-- SHEET IMPORTS TABLE (For Google Sheets data)
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

-- Function to check if user has a specific role
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

-- Function to update timestamps
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

-- Auto-update updated_at for users
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for databases
CREATE TRIGGER update_databases_updated_at
  BEFORE UPDATE ON databases
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for daily_checks
CREATE TRIGGER update_daily_checks_updated_at
  BEFORE UPDATE ON daily_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Auto-update updated_at for weekly_checks
CREATE TRIGGER update_weekly_checks_updated_at
  BEFORE UPDATE ON weekly_checks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED DATA: CHECK TYPES
-- ============================================

INSERT INTO check_types (name, description, applicable_database_types, is_daily, display_order) VALUES
-- Standard database checks
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

-- OEM specific checks
('OMS Status', 'Oracle Management Service status', '{oem}', true, 1),
('Repository DB Availability', 'Check OEM repository', '{oem}', true, 2),
('Repository DB Space', 'Monitor repository space', '{oem}', true, 3),
('Management Agents Status', 'Verify agents are up', '{oem}', true, 4),
('Agent Version Validation', 'Check agent versions', '{oem}', true, 5),
('Database Targets Reachable', 'Confirm all targets reachable', '{oem}', true, 6),
('Critical Alerts Review', 'Review critical incidents', '{oem}', true, 7),
('Performance Charts Review', 'Check for anomalies', '{oem}', true, 8),
('Compliance Standards Review', 'Review compliance violations', '{oem}', true, 9),

-- Audit Vault specific checks
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

-- Firewall specific checks
('Instance Availability', 'Firewall availability', '{firewall}', true, 1),
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

-- Grant all permissions on all tables to the application user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO db_monitor_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO db_monitor_user;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO db_monitor_user;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE users IS 'Application users with authentication';
COMMENT ON TABLE user_roles IS 'User role assignments (admin, user)';
COMMENT ON TABLE databases IS 'Monitored database instances';
COMMENT ON TABLE daily_checks IS 'Daily database check results';
COMMENT ON TABLE weekly_checks IS 'Weekly database check summary';
COMMENT ON TABLE audit_log IS 'Audit trail for all changes';

-- ============================================
-- END OF MIGRATION
-- ============================================
