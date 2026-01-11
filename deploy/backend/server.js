/**
 * DB Monitor Backend Server
 * Express.js API server for the DB Monitor application
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3001;

// ============================================================================
// DATABASE CONNECTION
// ============================================================================

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'db_monitor',
  user: process.env.DB_USER || 'db_monitor_user',
  password: process.env.DB_PASSWORD,
  min: parseInt(process.env.DB_POOL_MIN) || 2,
  max: parseInt(process.env.DB_POOL_MAX) || 10,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

// Test database connection
pool.query('SELECT NOW()')
  .then(() => console.log('✓ Database connected successfully'))
  .catch(err => console.error('✗ Database connection failed:', err.message));

// ============================================================================
// MIDDLEWARE
// ============================================================================

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
  message: { error: 'Too many requests, please try again later' }
});
app.use('/api/', limiter);

// ============================================================================
// AUTHENTICATION MIDDLEWARE
// ============================================================================

const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const result = await pool.query(
      `SELECT u.*, ur.role 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       WHERE u.id = $1`,
      [decoded.userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    req.user = result.rows[0];
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

// ============================================================================
// HEALTH CHECK
// ============================================================================

app.get('/api/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as time, current_database() as database');
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: result.rows[0].time,
      databaseName: result.rows[0].database
    });
  } catch (err) {
    res.status(500).json({
      status: 'error',
      database: 'disconnected',
      error: err.message
    });
  }
});

// ============================================================================
// AUTHENTICATION ROUTES
// ============================================================================

// Register
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (email, password_hash, name, approval_status) 
       VALUES ($1, $2, $3, 'pending') 
       RETURNING id, email, name, approval_status, created_at`,
      [email, passwordHash, name]
    );

    // Assign default user role
    await pool.query(
      'INSERT INTO user_roles (user_id, role) VALUES ($1, $2)',
      [result.rows[0].id, 'user']
    );

    res.status(201).json({
      message: 'Registration successful. Awaiting admin approval.',
      user: result.rows[0]
    });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const result = await pool.query(
      `SELECT u.*, ur.role 
       FROM users u 
       LEFT JOIN user_roles ur ON u.id = ur.user_id 
       WHERE u.email = $1`,
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = result.rows[0];

    if (user.approval_status !== 'approved') {
      return res.status(403).json({ 
        error: 'Account pending approval',
        status: user.approval_status
      });
    }

    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get current user
app.get('/api/auth/me', authenticateToken, (req, res) => {
  res.json({
    id: req.user.id,
    email: req.user.email,
    name: req.user.name,
    role: req.user.role
  });
});

// ============================================================================
// USER MANAGEMENT (Admin only)
// ============================================================================

app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT u.id, u.email, u.name, u.approval_status, u.created_at, ur.role
       FROM users u
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       ORDER BY u.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

app.put('/api/users/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET approval_status = 'approved', updated_at = NOW()
       WHERE id = $1 RETURNING id, email, name, approval_status`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

app.put('/api/users/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `UPDATE users SET approval_status = 'rejected', updated_at = NOW()
       WHERE id = $1 RETURNING id, email, name, approval_status`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

// ============================================================================
// DATABASE MANAGEMENT
// ============================================================================

app.get('/api/databases', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM databases WHERE is_active = true ORDER BY name'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch databases' });
  }
});

app.post('/api/databases', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, type, host, port, service_name, description } = req.body;
    const result = await pool.query(
      `INSERT INTO databases (name, type, host, port, service_name, description)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, type, host, port || 1521, service_name, description]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create database' });
  }
});

app.delete('/api/databases/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE databases SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Database deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete database' });
  }
});

// ============================================================================
// CHECK TYPES
// ============================================================================

app.get('/api/check-types', authenticateToken, async (req, res) => {
  try {
    const { database_id, category } = req.query;
    let query = 'SELECT * FROM check_types WHERE is_active = true';
    const params = [];
    
    if (database_id) {
      params.push(database_id);
      query += ` AND database_id = $${params.length}`;
    }
    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }
    
    query += ' ORDER BY sort_order, name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch check types' });
  }
});

app.post('/api/check-types', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, description, category, database_id, sort_order } = req.body;
    const result = await pool.query(
      `INSERT INTO check_types (name, description, category, database_id, sort_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, description, category, database_id, sort_order || 0]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create check type' });
  }
});

app.delete('/api/check-types/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await pool.query('UPDATE check_types SET is_active = false WHERE id = $1', [req.params.id]);
    res.json({ message: 'Check type deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete check type' });
  }
});

// ============================================================================
// DAILY CHECKS
// ============================================================================

app.get('/api/daily-checks', authenticateToken, async (req, res) => {
  try {
    const { database_id, start_date, end_date } = req.query;
    let query = `
      SELECT dc.*, d.name as database_name, ct.name as check_type_name
      FROM daily_checks dc
      JOIN databases d ON dc.database_id = d.id
      JOIN check_types ct ON dc.check_type_id = ct.id
      WHERE 1=1
    `;
    const params = [];

    if (database_id) {
      params.push(database_id);
      query += ` AND dc.database_id = $${params.length}`;
    }
    if (start_date) {
      params.push(start_date);
      query += ` AND dc.check_date >= $${params.length}`;
    }
    if (end_date) {
      params.push(end_date);
      query += ` AND dc.check_date <= $${params.length}`;
    }

    query += ' ORDER BY dc.check_date DESC, d.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch daily checks' });
  }
});

app.post('/api/daily-checks', authenticateToken, async (req, res) => {
  try {
    const { database_id, check_type_id, check_date, status, value, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO daily_checks (database_id, check_type_id, check_date, status, value, notes, checked_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (database_id, check_type_id, check_date) 
       DO UPDATE SET status = $4, value = $5, notes = $6, checked_by = $7, updated_at = NOW()
       RETURNING *`,
      [database_id, check_type_id, check_date, status, value, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save daily check' });
  }
});

// ============================================================================
// WEEKLY CHECKS
// ============================================================================

app.get('/api/weekly-checks', authenticateToken, async (req, res) => {
  try {
    const { database_id, year, week_number } = req.query;
    let query = `
      SELECT wc.*, d.name as database_name, ct.name as check_type_name
      FROM weekly_checks wc
      JOIN databases d ON wc.database_id = d.id
      JOIN check_types ct ON wc.check_type_id = ct.id
      WHERE 1=1
    `;
    const params = [];

    if (database_id) {
      params.push(database_id);
      query += ` AND wc.database_id = $${params.length}`;
    }
    if (year) {
      params.push(year);
      query += ` AND wc.year = $${params.length}`;
    }
    if (week_number) {
      params.push(week_number);
      query += ` AND wc.week_number = $${params.length}`;
    }

    query += ' ORDER BY wc.year DESC, wc.week_number DESC, d.name';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch weekly checks' });
  }
});

app.post('/api/weekly-checks', authenticateToken, async (req, res) => {
  try {
    const { database_id, check_type_id, week_number, year, status, value, notes } = req.body;
    const result = await pool.query(
      `INSERT INTO weekly_checks (database_id, check_type_id, week_number, year, status, value, notes, checked_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (database_id, check_type_id, week_number, year)
       DO UPDATE SET status = $5, value = $6, notes = $7, checked_by = $8, updated_at = NOW()
       RETURNING *`,
      [database_id, check_type_id, week_number, year, status, value, notes, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to save weekly check' });
  }
});

// ============================================================================
// ERROR HANDLING
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// ============================================================================
// START SERVER
// ============================================================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║                    DB Monitor Backend                       ║
║────────────────────────────────────────────────────────────║
║  Server running on port ${PORT}                              ║
║  Environment: ${process.env.NODE_ENV || 'development'}                              ║
║  API endpoint: http://localhost:${PORT}/api                  ║
╚════════════════════════════════════════════════════════════╝
  `);
});
